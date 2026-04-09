import { GraphQLError } from 'graphql';
import { z } from 'zod';
import type { Kysely } from 'kysely';
import type { Database, PaymentPlan, Payment, PromoCode } from '@sporthub/db';
import { createPaymentUrl as createVnPayUrl } from '../../lib/payment/vnpay.js';

const FRONTEND_URL = process.env.APP_URL ?? 'http://localhost:3000';
const API_URL = process.env.API_URL ?? 'http://localhost:4000';

const createPaymentPlanSchema = z.object({
  tournamentId: z.string().uuid(),
  name: z.string().min(1).max(255),
  amount: z.number().positive(),
  currency: z.string().length(3).default('VND'),
  perTeam: z.boolean().default(true),
  earlyBirdAmount: z.number().positive().nullable().optional(),
  earlyBirdDeadline: z.coerce.date().nullable().optional(),
  bankName: z.string().max(255).nullable().optional(),
  bankAccountNumber: z.string().max(50).nullable().optional(),
  bankAccountHolder: z.string().max(255).nullable().optional(),
  transferContent: z.string().max(500).nullable().optional(),
});

const updatePaymentPlanSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  amount: z.number().positive().optional(),
  perTeam: z.boolean().optional(),
  earlyBirdAmount: z.number().positive().nullable().optional(),
  earlyBirdDeadline: z.coerce.date().nullable().optional(),
  bankName: z.string().max(255).nullable().optional(),
  bankAccountNumber: z.string().max(50).nullable().optional(),
  bankAccountHolder: z.string().max(255).nullable().optional(),
  transferContent: z.string().max(500).nullable().optional(),
});

const initiatePaymentSchema = z.object({
  paymentPlanId: z.string().uuid(),
  teamId: z.string().uuid(),
  method: z.enum(['bank_transfer', 'momo', 'vnpay', 'cash']),
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
        bank_name: data.bankName ?? null,
        bank_account_number: data.bankAccountNumber ?? null,
        bank_account_holder: data.bankAccountHolder ?? null,
        transfer_content: data.transferContent ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async updatePaymentPlan(id: string, input: unknown, userId: string, userRole: string): Promise<PaymentPlan> {
    const data = updatePaymentPlanSchema.parse(input);

    const plan = await this.db
      .selectFrom('payment_plans')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!plan) {
      throw new GraphQLError('Payment plan not found', { extensions: { code: 'NOT_FOUND' } });
    }

    await this.verifyOrganizerAccess(plan.tournament_id, userId, userRole);

    const updates: Record<string, unknown> = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.amount !== undefined) updates.amount = String(data.amount);
    if (data.perTeam !== undefined) updates.per_team = data.perTeam;
    if (data.earlyBirdAmount !== undefined) updates.early_bird_amount = data.earlyBirdAmount ? String(data.earlyBirdAmount) : null;
    if (data.earlyBirdDeadline !== undefined) updates.early_bird_deadline = data.earlyBirdDeadline ?? null;
    if (data.bankName !== undefined) updates.bank_name = data.bankName ?? null;
    if (data.bankAccountNumber !== undefined) updates.bank_account_number = data.bankAccountNumber ?? null;
    if (data.bankAccountHolder !== undefined) updates.bank_account_holder = data.bankAccountHolder ?? null;
    if (data.transferContent !== undefined) updates.transfer_content = data.transferContent ?? null;

    if (Object.keys(updates).length === 0) {
      return plan;
    }

    return this.db
      .updateTable('payment_plans')
      .set(updates)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async deletePaymentPlan(id: string, userId: string, userRole: string): Promise<boolean> {
    const plan = await this.db
      .selectFrom('payment_plans')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!plan) {
      throw new GraphQLError('Payment plan not found', { extensions: { code: 'NOT_FOUND' } });
    }

    await this.verifyOrganizerAccess(plan.tournament_id, userId, userRole);

    // Check if any payments exist for this plan
    const paymentCount = await this.db
      .selectFrom('payments')
      .select(({ fn }) => fn.countAll<number>().as('count'))
      .where('payment_plan_id', '=', id)
      .executeTakeFirstOrThrow();

    if (Number(paymentCount.count) > 0) {
      throw new GraphQLError(
        'Không thể xóa gói thanh toán đã có giao dịch.',
        { extensions: { code: 'BAD_USER_INPUT' } }
      );
    }

    await this.db
      .deleteFrom('payment_plans')
      .where('id', '=', id)
      .execute();

    return true;
  }

  async initiatePayment(input: unknown, userId: string, userRole: string, clientIp: string): Promise<Payment> {
    const data = initiatePaymentSchema.parse(input);

    const plan = await this.db
      .selectFrom('payment_plans')
      .selectAll()
      .where('id', '=', data.paymentPlanId)
      .executeTakeFirst();

    if (!plan) {
      throw new GraphQLError('Payment plan not found', { extensions: { code: 'NOT_FOUND' } });
    }

    // Verify the caller owns the team (or is admin/organizer)
    const team = await this.db
      .selectFrom('teams')
      .select(['id', 'manager_id', 'tournament_id'])
      .where('id', '=', data.teamId)
      .executeTakeFirst();

    if (!team) {
      throw new GraphQLError('Team not found', { extensions: { code: 'NOT_FOUND' } });
    }
    if (userRole !== 'admin' && userRole !== 'organizer' && team.manager_id !== userId) {
      throw new GraphQLError('Not authorized to initiate payment for this team', {
        extensions: { code: 'FORBIDDEN' },
      });
    }
    if (team.tournament_id !== plan.tournament_id) {
      throw new GraphQLError('Team does not belong to this tournament', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    // Calculate amount (check early bird)
    let amount = parseFloat(plan.amount);
    if (plan.early_bird_amount && plan.early_bird_deadline && new Date() < plan.early_bird_deadline) {
      amount = parseFloat(plan.early_bird_amount);
    }

    // Validate promo code (read-only check, increment happens after payment creation)
    let discountAmount = 0;
    let promoCodeStr: string | null = null;
    if (data.promoCode) {
      const promo = await this.validatePromoCodeInternal(plan.tournament_id, data.promoCode, amount);
      if (promo.valid && promo.discountAmount) {
        discountAmount = promo.discountAmount;
        promoCodeStr = data.promoCode;
      }
    }

    const finalAmount = Math.max(0, amount - discountAmount);

    // Reject unsupported payment methods before creating any records
    if (data.method === 'momo') {
      throw new GraphQLError('MoMo chưa được hỗ trợ. Vui lòng chọn phương thức khác.', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    if (data.method === 'bank_transfer' && !plan.bank_account_number) {
      throw new GraphQLError(
        'Chưa có thông tin chuyển khoản. Vui lòng liên hệ ban tổ chức.',
        { extensions: { code: 'BAD_USER_INPUT' } }
      );
    }

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
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    // Increment promo used_count only after successful payment creation
    if (promoCodeStr) {
      await this.db
        .updateTable('promo_codes')
        .set((eb) => ({ used_count: eb('used_count', '+', 1) }))
        .where('code', '=', promoCodeStr)
        .where('tournament_id', '=', plan.tournament_id)
        .execute();
    }

    // Generate payment URL based on method
    let paymentUrl: string | null = null;
    const tournamentId = plan.tournament_id;

    if (data.method === 'vnpay') {
      paymentUrl = createVnPayUrl({
        orderId: payment.id,
        amount: finalAmount,
        orderInfo: `Payment for ${plan.name}`,
        returnUrl: `${API_URL}/payment/vnpay-return`,
        ipAddr: clientIp,
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

  async confirmManualPayment(
    paymentId: string,
    transactionId: string | null,
    userId: string,
    userRole: string
  ): Promise<Payment> {
    const payment = await this.db
      .selectFrom('payments')
      .selectAll()
      .where('id', '=', paymentId)
      .executeTakeFirst();

    if (!payment) {
      throw new GraphQLError('Payment not found', { extensions: { code: 'NOT_FOUND' } });
    }

    if (!['bank_transfer', 'cash'].includes(payment.method ?? '')) {
      throw new GraphQLError(
        'Only bank_transfer and cash payments can be confirmed manually',
        { extensions: { code: 'BAD_USER_INPUT' } }
      );
    }

    if (payment.status === 'paid') {
      throw new GraphQLError('Payment already marked as paid', { extensions: { code: 'BAD_USER_INPUT' } });
    }

    const plan = await this.db
      .selectFrom('payment_plans')
      .selectAll()
      .where('id', '=', payment.payment_plan_id)
      .executeTakeFirst();

    if (!plan) {
      throw new GraphQLError('Payment plan not found', { extensions: { code: 'NOT_FOUND' } });
    }

    await this.verifyOrganizerAccess(plan.tournament_id, userId, userRole);

    return this.db
      .updateTable('payments')
      .set({
        status: 'paid',
        transaction_id: transactionId ?? null,
        paid_at: new Date(),
        updated_at: new Date(),
      })
      .where('id', '=', paymentId)
      .returningAll()
      .executeTakeFirstOrThrow();
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

    const plan = await this.db
      .selectFrom('payment_plans')
      .selectAll()
      .where('id', '=', payment.payment_plan_id)
      .executeTakeFirst();

    // Always enforce authorization — throw if plan not found
    if (!plan) {
      throw new GraphQLError('Payment plan not found', { extensions: { code: 'NOT_FOUND' } });
    }

    await this.verifyOrganizerAccess(plan.tournament_id, userId, userRole);

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
    // Lazily mark expired pending payments as overdue
    await this.db
      .updateTable('payments')
      .set({ status: 'overdue', updated_at: new Date() })
      .where('status', '=', 'pending')
      .where('expires_at', '<', new Date())
      .where(
        'payment_plan_id',
        'in',
        this.db.selectFrom('payment_plans').select('id').where('tournament_id', '=', tournamentId)
      )
      .execute();

    return this.db
      .selectFrom('payments')
      .innerJoin('payment_plans', 'payment_plans.id', 'payments.payment_plan_id')
      .where('payment_plans.tournament_id', '=', tournamentId)
      .selectAll('payments')
      .orderBy('payments.created_at', 'desc')
      .execute();
  }

  async getPaymentsByTeam(teamId: string): Promise<Payment[]> {
    // Lazily mark expired pending payments as overdue
    await this.db
      .updateTable('payments')
      .set({ status: 'overdue', updated_at: new Date() })
      .where('status', '=', 'pending')
      .where('expires_at', '<', new Date())
      .where('team_id', '=', teamId)
      .execute();

    return this.db
      .selectFrom('payments')
      .selectAll()
      .where('team_id', '=', teamId)
      .orderBy('created_at', 'desc')
      .execute();
  }

  async getPromoCodesByTournament(tournamentId: string): Promise<PromoCode[]> {
    return this.db
      .selectFrom('promo_codes')
      .selectAll()
      .where('tournament_id', '=', tournamentId)
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
