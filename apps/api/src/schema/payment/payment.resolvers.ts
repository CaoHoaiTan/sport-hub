import { GraphQLError } from 'graphql';
import type { PaymentPlan, Payment, PromoCode } from '@sporthub/db';
import type { GraphQLContext } from '../../context.js';
import { requireAuth, requireRole } from '../../middleware/role.guard.js';
import { PaymentService } from './payment.service.js';

export const paymentResolvers = {
  Query: {
    paymentPlansByTournament: async (
      _: unknown,
      { tournamentId }: { tournamentId: string },
      ctx: GraphQLContext
    ) => {
      const service = new PaymentService(ctx.db);
      return service.getPaymentPlansByTournament(tournamentId);
    },

    paymentsByTournament: async (
      _: unknown,
      { tournamentId }: { tournamentId: string },
      ctx: GraphQLContext
    ) => {
      requireRole(ctx.user, 'organizer', 'admin');
      const service = new PaymentService(ctx.db);
      return service.getPaymentsByTournament(tournamentId);
    },

    paymentsByTeam: async (
      _: unknown,
      { teamId }: { teamId: string },
      ctx: GraphQLContext
    ) => {
      const user = requireAuth(ctx.user);
      // Verify user is team manager or admin
      if (user.role !== 'admin' && user.role !== 'organizer') {
        const team = await ctx.db
          .selectFrom('teams')
          .select('manager_id')
          .where('id', '=', teamId)
          .executeTakeFirst();
        if (!team || team.manager_id !== user.id) {
          throw new GraphQLError('Not authorized', {
            extensions: { code: 'FORBIDDEN' },
          });
        }
      }
      const service = new PaymentService(ctx.db);
      return service.getPaymentsByTeam(teamId);
    },

    financialSummary: async (
      _: unknown,
      { tournamentId }: { tournamentId: string },
      ctx: GraphQLContext
    ) => {
      const user = requireRole(ctx.user, 'organizer', 'admin');
      const service = new PaymentService(ctx.db);
      return service.getFinancialSummary(tournamentId, user.id, user.role);
    },

    validatePromoCode: async (
      _: unknown,
      { tournamentId, code, amount }: { tournamentId: string; code: string; amount: number },
      ctx: GraphQLContext
    ) => {
      const service = new PaymentService(ctx.db);
      return service.validatePromoCode(tournamentId, code, amount);
    },
  },

  Mutation: {
    createPaymentPlan: async (
      _: unknown,
      { input }: { input: unknown },
      ctx: GraphQLContext
    ) => {
      const user = requireRole(ctx.user, 'organizer', 'admin');
      const service = new PaymentService(ctx.db);
      return service.createPaymentPlan(input, user.id, user.role);
    },

    initiatePayment: async (
      _: unknown,
      { input }: { input: unknown },
      ctx: GraphQLContext
    ) => {
      const user = requireAuth(ctx.user);
      const service = new PaymentService(ctx.db);
      return service.initiatePayment(input, user.id);
    },

    handlePaymentCallback: async (
      _: unknown,
      { paymentId, transactionId, gatewayResponse }: { paymentId: string; transactionId: string; gatewayResponse: string },
      ctx: GraphQLContext
    ) => {
      requireRole(ctx.user, 'admin');
      const service = new PaymentService(ctx.db);
      return service.handlePaymentCallback(paymentId, transactionId, gatewayResponse);
    },

    refundPayment: async (
      _: unknown,
      { paymentId, reason }: { paymentId: string; reason: string },
      ctx: GraphQLContext
    ) => {
      const user = requireRole(ctx.user, 'organizer', 'admin');
      const service = new PaymentService(ctx.db);
      return service.refundPayment(paymentId, reason, user.id, user.role);
    },

    createPromoCode: async (
      _: unknown,
      { input }: { input: unknown },
      ctx: GraphQLContext
    ) => {
      const user = requireRole(ctx.user, 'organizer', 'admin');
      const service = new PaymentService(ctx.db);
      return service.createPromoCode(input, user.id, user.role);
    },
  },

  PaymentPlan: {
    tournamentId: (p: PaymentPlan) => p.tournament_id,
    tournament: async (p: PaymentPlan, _: unknown, ctx: GraphQLContext) => {
      return ctx.db.selectFrom('tournaments').selectAll().where('id', '=', p.tournament_id).executeTakeFirst();
    },
    amount: (p: PaymentPlan) => parseFloat(p.amount),
    perTeam: (p: PaymentPlan) => p.per_team,
    earlyBirdAmount: (p: PaymentPlan) => p.early_bird_amount ? parseFloat(p.early_bird_amount) : null,
    earlyBirdDeadline: (p: PaymentPlan) => p.early_bird_deadline,
    createdAt: (p: PaymentPlan) => p.created_at,
  },

  Payment: {
    paymentPlanId: (p: Payment) => p.payment_plan_id,
    paymentPlan: async (p: Payment, _: unknown, ctx: GraphQLContext) => {
      return ctx.db.selectFrom('payment_plans').selectAll().where('id', '=', p.payment_plan_id).executeTakeFirst();
    },
    teamId: (p: Payment) => p.team_id,
    team: async (p: Payment, _: unknown, ctx: GraphQLContext) => {
      return ctx.db.selectFrom('teams').selectAll().where('id', '=', p.team_id).executeTakeFirst();
    },
    userId: (p: Payment) => p.user_id,
    amount: (p: Payment) => parseFloat(p.amount),
    discountAmount: (p: Payment) => parseFloat(p.discount_amount),
    transactionId: (p: Payment) => p.transaction_id,
    paymentUrl: (p: Payment) => p.payment_url,
    promoCode: (p: Payment) => p.promo_code,
    refundedAt: (p: Payment) => p.refunded_at,
    refundReason: (p: Payment) => p.refund_reason,
    paidAt: (p: Payment) => p.paid_at,
    expiresAt: (p: Payment) => p.expires_at,
    createdAt: (p: Payment) => p.created_at,
    updatedAt: (p: Payment) => p.updated_at,
  },

  PromoCode: {
    tournamentId: (p: PromoCode) => p.tournament_id,
    discountType: (p: PromoCode) => p.discount_type,
    discountValue: (p: PromoCode) => parseFloat(p.discount_value),
    maxUses: (p: PromoCode) => p.max_uses,
    usedCount: (p: PromoCode) => p.used_count,
    validFrom: (p: PromoCode) => p.valid_from,
    validUntil: (p: PromoCode) => p.valid_until,
    isActive: (p: PromoCode) => p.is_active,
    createdAt: (p: PromoCode) => p.created_at,
  },
};
