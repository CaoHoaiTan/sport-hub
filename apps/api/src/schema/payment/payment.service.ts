import { GraphQLError } from 'graphql';
import { z } from 'zod';
import type { Kysely } from 'kysely';
import type { Database, PaymentPlan, Payment, PromoCode } from '@sporthub/db';
import { createPayment as createMomoPayment } from '../../lib/payment/momo.js';
import { createPaymentUrl as createVnPayUrl } from '../../lib/payment/vnpay.js';

const createPaymentPlanSchema = z.object({
  tournamentId: z.string().uuid(),
  name: z.string().min(1).max(255),
  amount: z.number().positive(),
  currency: z.string().length(3).default('VND'),
  perTeam: z.boolean().default(true),
  earlyBirdAmount: z.number().positive().nullable().optional(),
  earlyBirdDeadline: z.coerce.date().nullable().optional(),
});

const initiatePaymentSchema = z.object({
  paymentPlanId: z.string().uuid(),
  teamId: z.string().uuid(),
  method: z.enum(['bank_transfer', 'momo', 'vnpay', 'zalopay', 'cash']),
  promoCode: z.string().max(50).nullable().optional(),
  returnUrl: z.string().url().nullable().optional(),
});

const createPromoCodeSchema = z.object({
  tournamentId: z.string().uuid(),
  code: z.string().min(1).max(50),
  discountType: z.enum(['percent', 'fixed']),
  discountValue: z.number().positive(),
  maxUses: z.number().int().positive().nullable().optional(),
  validFrom: z.coerce.date().nullable().optional(),
  validUntil: z.coerce.date().nullable().optional(),
});

export class PaymentService {
  constructor(private db: Kysely<Database>) {}

  async createPaymentPlan(input: unknown, userId: string, userRole: string): Promise<PaymentPlan> {
    const data = createPaymentPlanSchema.parse(input);
    await this.verifyOrganizerAccess(data.tournamentId, userId, userRole);

    return this.db
      .insertInto('payment_plans')
      .values({
        tournament_id: data.tournamentId,
        name: data.name,
        amount: String(data.amount),
        currency: data.currency,
        per_team: data.perTeam,
        early_bird_amount: data.earlyBirdAmount ? String(data.earlyBirdAmount) : null,
        early_bird_deadline: data.earlyBirdDeadline ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async initiatePayment(input: unknown, userId: string): Promise<Payment> {
    const data = initiatePaymentSchema.parse(input);

    const plan = await this.db
      .selectFrom('payment_plans')
      .selectAll()
      .where('id', '=', data.paymentPlanId)
      .executeTakeFirst();

    if (!plan) {
      throw new GraphQLError('Payment plan not found', { extensions: { code: 'NOT_FOUND' } });
    }

    // Calculate amount (check early bird)
    let amount = parseFloat(plan.amount);
    if (plan.early_bird_amount && plan.early_bird_deadline && new Date() < plan.early_bird_deadline) {
      amount = parseFloat(plan.early_bird_amount);
    }

    // Handle promo code
    let discountAmount = 0;
    let promoCodeStr: string | null = null;
    if (data.promoCode) {
      const promo = await this.validatePromoCodeInternal(plan.tournament_id, data.promoCode, amount);
      if (promo.valid && promo.discountAmount) {
        discountAmount = promo.discountAmount;
        promoCodeStr = data.promoCode;

        // Increment used_count
        await this.db
          .updateTable('promo_codes')
          .set((eb) => ({ used_count: eb('used_count', '+', 1) }))
          .where('code', '=', data.promoCode!)
          .where('tournament_id', '=', plan.tournament_id)
          .execute();
      }
    }

    const finalAmount = Math.max(0, amount - discountAmount);

    // Create payment record
    const payment = await this.db
      .insertInto('payments')
      .values({
        payment_plan_id: data.paymentPlanId,
        team_id: data.teamId,
        user_id: userId,
        amount: String(finalAmount),
        currency: plan.currency,
        method: data.method,
        promo_code: promoCodeStr,
        discount_amount: String(discountAmount),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h expiry
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    // Generate payment URL based on method
    let paymentUrl: string | null = null;
    const returnUrl = data.returnUrl ?? 'http://localhost:3000/payment/callback';

    if (data.method === 'momo') {
      const result = await createMomoPayment({
        orderId: payment.id,
        amount: finalAmount,
        orderInfo: `Payment for ${plan.name}`,
        returnUrl,
        notifyUrl: `${returnUrl}/momo-notify`,
      });
      paymentUrl = result.paymentUrl;
    } else if (data.method === 'vnpay') {
      paymentUrl = createVnPayUrl({
        orderId: payment.id,
        amount: finalAmount,
        orderInfo: `Payment for ${plan.name}`,
        returnUrl,
        ipAddr: '127.0.0.1',
      });
    }

    if (paymentUrl) {
      await this.db
        .updateTable('payments')
        .set({ payment_url: paymentUrl, updated_at: new Date() })
        .where('id', '=', payment.id)
        .execute();

      return { ...payment, payment_url: paymentUrl };
    }

    return payment;
  }

  async handlePaymentCallback(
    paymentId: string,
    transactionId: string,
    gatewayResponse: string
  ): Promise<Payment> {
    const payment = await this.db
      .selectFrom('payments')
      .selectAll()
      .where('id', '=', paymentId)
      .executeTakeFirst();

    if (!payment) {
      throw new GraphQLError('Payment not found', { extensions: { code: 'NOT_FOUND' } });
    }

    if (payment.status === 'paid') {
      throw new GraphQLError('Payment already completed', { extensions: { code: 'BAD_USER_INPUT' } });
    }

    let parsedResponse: Record<string, unknown> = {};
    try {
      parsedResponse = JSON.parse(gatewayResponse);
    } catch {
      // Keep empty object if parsing fails
    }

    return this.db
      .updateTable('payments')
      .set({
        status: 'paid',
        transaction_id: transactionId,
        gateway_response: parsedResponse,
        paid_at: new Date(),
        updated_at: new Date(),
      })
      .where('id', '=', paymentId)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async refundPayment(paymentId: string, reason: string, userId: string, userRole: string): Promise<Payment> {
    const payment = await this.db
      .selectFrom('payments')
      .selectAll()
      .where('id', '=', paymentId)
      .executeTakeFirst();

    if (!payment) {
      throw new GraphQLError('Payment not found', { extensions: { code: 'NOT_FOUND' } });
    }

    if (payment.status !== 'paid') {
      throw new GraphQLError('Only paid payments can be refunded', { extensions: { code: 'BAD_USER_INPUT' } });
    }

    // Verify authorization via payment plan -> tournament
    const plan = await this.db
      .selectFrom('payment_plans')
      .selectAll()
      .where('id', '=', payment.payment_plan_id)
      .executeTakeFirst();

    if (plan) {
      await this.verifyOrganizerAccess(plan.tournament_id, userId, userRole);
    }

    return this.db
      .updateTable('payments')
      .set({
        status: 'refunded',
        refunded_at: new Date(),
        refund_reason: reason,
        updated_at: new Date(),
      })
      .where('id', '=', paymentId)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async getPaymentsByTournament(tournamentId: string): Promise<Payment[]> {
    return this.db
      .selectFrom('payments')
      .innerJoin('payment_plans', 'payment_plans.id', 'payments.payment_plan_id')
      .where('payment_plans.tournament_id', '=', tournamentId)
      .selectAll('payments')
      .orderBy('payments.created_at', 'desc')
      .execute();
  }

  async getPaymentsByTeam(teamId: string): Promise<Payment[]> {
    return this.db
      .selectFrom('payments')
      .selectAll()
      .where('team_id', '=', teamId)
      .orderBy('created_at', 'desc')
      .execute();
  }

  async getPaymentPlansByTournament(tournamentId: string): Promise<PaymentPlan[]> {
    return this.db
      .selectFrom('payment_plans')
      .selectAll()
      .where('tournament_id', '=', tournamentId)
      .orderBy('created_at', 'desc')
      .execute();
  }

  async getFinancialSummary(
    tournamentId: string,
    userId: string,
    userRole: string
  ): Promise<{
    totalRevenue: number;
    totalPending: number;
    totalRefunded: number;
    paymentCount: number;
    paidCount: number;
    overdueCount: number;
  }> {
    await this.verifyOrganizerAccess(tournamentId, userId, userRole);

    const payments = await this.getPaymentsByTournament(tournamentId);

    let totalRevenue = 0;
    let totalPending = 0;
    let totalRefunded = 0;
    let paidCount = 0;
    let overdueCount = 0;

    for (const p of payments) {
      const amount = parseFloat(p.amount);
      switch (p.status) {
        case 'paid':
          totalRevenue += amount;
          paidCount++;
          break;
        case 'pending':
          totalPending += amount;
          break;
        case 'overdue':
          totalPending += amount;
          overdueCount++;
          break;
        case 'refunded':
          totalRefunded += amount;
          break;
      }
    }

    return {
      totalRevenue,
      totalPending,
      totalRefunded,
      paymentCount: payments.length,
      paidCount,
      overdueCount,
    };
  }

  async validatePromoCode(
    tournamentId: string,
    code: string,
    amount: number
  ): Promise<{ valid: boolean; discountAmount: number | null; message: string | null }> {
    return this.validatePromoCodeInternal(tournamentId, code, amount);
  }

  async createPromoCode(input: unknown, userId: string, userRole: string): Promise<PromoCode> {
    const data = createPromoCodeSchema.parse(input);
    await this.verifyOrganizerAccess(data.tournamentId, userId, userRole);

    return this.db
      .insertInto('promo_codes')
      .values({
        tournament_id: data.tournamentId,
        code: data.code,
        discount_type: data.discountType,
        discount_value: String(data.discountValue),
        max_uses: data.maxUses ?? null,
        valid_from: data.validFrom ?? null,
        valid_until: data.validUntil ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  private async validatePromoCodeInternal(
    tournamentId: string,
    code: string,
    amount: number
  ): Promise<{ valid: boolean; discountAmount: number | null; message: string | null }> {
    const promo = await this.db
      .selectFrom('promo_codes')
      .selectAll()
      .where('code', '=', code)
      .where('tournament_id', '=', tournamentId)
      .where('is_active', '=', true)
      .executeTakeFirst();

    if (!promo) {
      return { valid: false, discountAmount: null, message: 'Invalid promo code' };
    }

    const now = new Date();
    if (promo.valid_from && now < promo.valid_from) {
      return { valid: false, discountAmount: null, message: 'Promo code not yet active' };
    }
    if (promo.valid_until && now > promo.valid_until) {
      return { valid: false, discountAmount: null, message: 'Promo code expired' };
    }
    if (promo.max_uses !== null && promo.used_count >= promo.max_uses) {
      return { valid: false, discountAmount: null, message: 'Promo code usage limit reached' };
    }

    const discountValue = parseFloat(promo.discount_value);
    let discountAmount: number;

    if (promo.discount_type === 'percent') {
      discountAmount = Math.round(amount * (discountValue / 100));
    } else {
      discountAmount = Math.min(discountValue, amount);
    }

    return { valid: true, discountAmount, message: null };
  }

  private async verifyOrganizerAccess(
    tournamentId: string,
    userId: string,
    userRole: string
  ): Promise<void> {
    const tournament = await this.db
      .selectFrom('tournaments')
      .select(['organizer_id'])
      .where('id', '=', tournamentId)
      .executeTakeFirst();

    if (!tournament || (tournament.organizer_id !== userId && userRole !== 'admin')) {
      throw new GraphQLError('Not authorized', { extensions: { code: 'FORBIDDEN' } });
    }
  }
}
