import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { getTestDb, cleanAllTables, destroyTestDb } from '../helpers/test-db.js';
import { createTestClient } from '../helpers/test-client.js';

// ── Mutations & Queries ──────────────────────────────────────────────

const REGISTER = `
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      accessToken
      user { id email role }
    }
  }
`;

const LOGIN = `
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      user { id role }
    }
  }
`;

const CREATE_TOURNAMENT = `
  mutation CreateTournament($input: CreateTournamentInput!) {
    createTournament(input: $input) { id name }
  }
`;

const UPDATE_STATUS = `
  mutation UpdateTournamentStatus($id: ID!, $status: TournamentStatus!) {
    updateTournamentStatus(id: $id, status: $status) { id status }
  }
`;

const REGISTER_TEAM = `
  mutation RegisterTeam($input: RegisterTeamInput!) {
    registerTeam(input: $input) { id name managerId }
  }
`;

const CREATE_PAYMENT_PLAN = `
  mutation CreatePaymentPlan($input: CreatePaymentPlanInput!) {
    createPaymentPlan(input: $input) {
      id tournamentId name amount currency perTeam
      earlyBirdAmount earlyBirdDeadline createdAt
    }
  }
`;

const INITIATE_PAYMENT = `
  mutation InitiatePayment($input: InitiatePaymentInput!) {
    initiatePayment(input: $input) {
      id paymentPlanId teamId userId amount currency
      status method paymentUrl promoCode discountAmount
      expiresAt createdAt
    }
  }
`;

const CONFIRM_MANUAL_PAYMENT = `
  mutation ConfirmManualPayment($paymentId: ID!, $transactionId: String) {
    confirmManualPayment(paymentId: $paymentId, transactionId: $transactionId) {
      id status transactionId paidAt
    }
  }
`;

const REFUND_PAYMENT = `
  mutation RefundPayment($paymentId: ID!, $reason: String!) {
    refundPayment(paymentId: $paymentId, reason: $reason) {
      id status refundedAt refundReason
    }
  }
`;

const PAYMENTS_BY_TOURNAMENT = `
  query PaymentsByTournament($tournamentId: ID!) {
    paymentsByTournament(tournamentId: $tournamentId) {
      id amount status method teamId
    }
  }
`;

const PAYMENTS_BY_TEAM = `
  query PaymentsByTeam($teamId: ID!) {
    paymentsByTeam(teamId: $teamId) {
      id amount status method
    }
  }
`;

const FINANCIAL_SUMMARY = `
  query FinancialSummary($tournamentId: ID!) {
    financialSummary(tournamentId: $tournamentId) {
      totalRevenue totalPending totalRefunded
      paymentCount paidCount overdueCount
    }
  }
`;

const PAYMENT_PLANS_BY_TOURNAMENT = `
  query PaymentPlansByTournament($tournamentId: ID!) {
    paymentPlansByTournament(tournamentId: $tournamentId) {
      id name amount perTeam earlyBirdAmount earlyBirdDeadline
    }
  }
`;

const CREATE_PROMO_CODE = `
  mutation CreatePromoCode($input: CreatePromoCodeInput!) {
    createPromoCode(input: $input) {
      id code discountType discountValue maxUses usedCount isActive
    }
  }
`;

const VALIDATE_PROMO_CODE = `
  query ValidatePromoCode($tournamentId: ID!, $code: String!, $amount: Float!) {
    validatePromoCode(tournamentId: $tournamentId, code: $code, amount: $amount) {
      valid discountAmount message
    }
  }
`;

// ── Test Suite ────────────────────────────────────────────────────────

describe('Payment Integration Tests', () => {
  const db = getTestDb();
  let client: Awaited<ReturnType<typeof createTestClient>>;
  let organizerToken: string;
  let playerToken: string;
  let player2Token: string;
  let tournamentId: string;
  let teamId: string;
  let team2Id: string;
  let planId: string;

  beforeAll(async () => {
    client = await createTestClient({ db });
  });

  afterAll(async () => {
    await client.stop();
    await destroyTestDb();
  });

  beforeEach(async () => {
    await cleanAllTables(db);

    // Create organizer
    await client.execute({
      query: REGISTER,
      variables: {
        input: { email: 'org@test.com', password: 'password123', fullName: 'Organizer' },
      },
    });
    await db.updateTable('users').set({ role: 'organizer' }).where('email', '=', 'org@test.com').execute();
    const orgLogin = await client.execute({
      query: LOGIN,
      variables: { input: { email: 'org@test.com', password: 'password123' } },
    });
    organizerToken = (orgLogin.body.data!.login as any).accessToken;

    // Create player 1
    const p1 = await client.execute({
      query: REGISTER,
      variables: {
        input: { email: 'player1@test.com', password: 'password123', fullName: 'Player 1' },
      },
    });
    playerToken = (p1.body.data!.register as any).accessToken;

    // Create player 2
    const p2 = await client.execute({
      query: REGISTER,
      variables: {
        input: { email: 'player2@test.com', password: 'password123', fullName: 'Player 2' },
      },
    });
    player2Token = (p2.body.data!.register as any).accessToken;

    // Create tournament
    const t = await client.execute({
      query: CREATE_TOURNAMENT,
      variables: {
        input: {
          name: 'Payment Test Cup',
          sport: 'football',
          format: 'round_robin',
          startDate: new Date(Date.now() + 7 * 86400000).toISOString(),
          minPlayersPerTeam: 5,
          maxPlayersPerTeam: 11,
          maxTeams: 8,
        },
      },
      token: organizerToken,
    });
    tournamentId = (t.body.data!.createTournament as any).id;

    // Open registration
    await client.execute({
      query: UPDATE_STATUS,
      variables: { id: tournamentId, status: 'registration' },
      token: organizerToken,
    });

    // Register teams
    const team1 = await client.execute({
      query: REGISTER_TEAM,
      variables: { input: { tournamentId, name: 'Team Alpha' } },
      token: playerToken,
    });
    teamId = (team1.body.data!.registerTeam as any).id;

    const team2 = await client.execute({
      query: REGISTER_TEAM,
      variables: { input: { tournamentId, name: 'Team Beta' } },
      token: player2Token,
    });
    team2Id = (team2.body.data!.registerTeam as any).id;

    // Create payment plan
    const pp = await client.execute({
      query: CREATE_PAYMENT_PLAN,
      variables: {
        input: {
          tournamentId,
          name: 'Entry Fee',
          amount: 500000,
          perTeam: true,
        },
      },
      token: organizerToken,
    });
    planId = (pp.body.data!.createPaymentPlan as any).id;
  });

  // ── Payment Plan ─────────────────────────────────────────────────

  describe('Payment Plans', () => {
    it('should create a payment plan', async () => {
      const result = await client.execute({
        query: CREATE_PAYMENT_PLAN,
        variables: {
          input: {
            tournamentId,
            name: 'VIP Fee',
            amount: 1000000,
            perTeam: true,
            earlyBirdAmount: 800000,
            earlyBirdDeadline: new Date(Date.now() + 3 * 86400000).toISOString(),
          },
        },
        token: organizerToken,
      });

      expect(result.body.errors).toBeUndefined();
      const plan = result.body.data!.createPaymentPlan as any;
      expect(plan.name).toBe('VIP Fee');
      expect(plan.amount).toBe(1000000);
      expect(plan.earlyBirdAmount).toBe(800000);
    });

    it('should reject plan creation by non-organizer', async () => {
      const result = await client.execute({
        query: CREATE_PAYMENT_PLAN,
        variables: {
          input: { tournamentId, name: 'Nope', amount: 100000 },
        },
        token: playerToken,
      });

      expect(result.body.errors).toBeDefined();
    });

    it('should list payment plans for tournament', async () => {
      const result = await client.execute({
        query: PAYMENT_PLANS_BY_TOURNAMENT,
        variables: { tournamentId },
      });

      expect(result.body.errors).toBeUndefined();
      const plans = result.body.data!.paymentPlansByTournament as any[];
      expect(plans.length).toBe(1);
      expect(plans[0].name).toBe('Entry Fee');
      expect(plans[0].amount).toBe(500000);
    });
  });

  // ── Initiate Payment ─────────────────────────────────────────────

  describe('Initiate Payment', () => {
    it('should initiate bank_transfer payment', async () => {
      const result = await client.execute({
        query: INITIATE_PAYMENT,
        variables: {
          input: { paymentPlanId: planId, teamId, method: 'bank_transfer' },
        },
        token: playerToken,
      });

      expect(result.body.errors).toBeUndefined();
      const payment = result.body.data!.initiatePayment as any;
      expect(payment.amount).toBe(500000);
      expect(payment.status).toBe('pending');
      expect(payment.method).toBe('bank_transfer');
      expect(payment.paymentUrl).toBeNull();
      expect(payment.teamId).toBe(teamId);
    });

    it('should initiate cash payment', async () => {
      const result = await client.execute({
        query: INITIATE_PAYMENT,
        variables: {
          input: { paymentPlanId: planId, teamId, method: 'cash' },
        },
        token: playerToken,
      });

      expect(result.body.errors).toBeUndefined();
      const payment = result.body.data!.initiatePayment as any;
      expect(payment.status).toBe('pending');
      expect(payment.method).toBe('cash');
      expect(payment.paymentUrl).toBeNull();
    });

    it('should initiate VNPay payment with paymentUrl', async () => {
      const result = await client.execute({
        query: INITIATE_PAYMENT,
        variables: {
          input: { paymentPlanId: planId, teamId, method: 'vnpay' },
        },
        token: playerToken,
      });

      expect(result.body.errors).toBeUndefined();
      const payment = result.body.data!.initiatePayment as any;
      expect(payment.status).toBe('pending');
      expect(payment.method).toBe('vnpay');
      expect(payment.paymentUrl).toBeTruthy();
      expect(payment.paymentUrl).toContain('sandbox.vnpayment.vn');
      expect(payment.paymentUrl).toContain('vnp_SecureHash');
    });

    it('should reject MoMo (disabled)', async () => {
      const result = await client.execute({
        query: INITIATE_PAYMENT,
        variables: {
          input: { paymentPlanId: planId, teamId, method: 'momo' },
        },
        token: playerToken,
      });

      expect(result.body.errors).toBeDefined();
      expect(result.body.errors![0].message).toContain('MoMo');
    });

    it('should reject MoMo without creating a payment record', async () => {
      await client.execute({
        query: INITIATE_PAYMENT,
        variables: {
          input: { paymentPlanId: planId, teamId, method: 'momo' },
        },
        token: playerToken,
      });

      // Verify no orphaned payment was created
      const payments = await client.execute({
        query: PAYMENTS_BY_TEAM,
        variables: { teamId },
        token: playerToken,
      });

      const list = payments.body.data!.paymentsByTeam as any[];
      expect(list.length).toBe(0);
    });

    it('should reject unauthenticated payment', async () => {
      const result = await client.execute({
        query: INITIATE_PAYMENT,
        variables: {
          input: { paymentPlanId: planId, teamId, method: 'bank_transfer' },
        },
      });

      expect(result.body.errors).toBeDefined();
    });

    it('should reject payment for a team the user does not manage', async () => {
      // Player 1 tries to pay for Player 2's team
      const result = await client.execute({
        query: INITIATE_PAYMENT,
        variables: {
          input: { paymentPlanId: planId, teamId: team2Id, method: 'bank_transfer' },
        },
        token: playerToken,
      });

      expect(result.body.errors).toBeDefined();
      expect(result.body.errors![0].extensions?.code).toBe('FORBIDDEN');
    });

    it('should set 24h expiry on payment', async () => {
      const result = await client.execute({
        query: INITIATE_PAYMENT,
        variables: {
          input: { paymentPlanId: planId, teamId, method: 'bank_transfer' },
        },
        token: playerToken,
      });

      const payment = result.body.data!.initiatePayment as any;
      const expiresAt = new Date(payment.expiresAt).getTime();
      const now = Date.now();
      // Should expire roughly 24h from now (within 1 minute tolerance)
      expect(expiresAt - now).toBeGreaterThan(23 * 60 * 60 * 1000);
      expect(expiresAt - now).toBeLessThan(25 * 60 * 60 * 1000);
    });
  });

  // ── Confirm Manual Payment ───────────────────────────────────────

  describe('Confirm Manual Payment', () => {
    let paymentId: string;

    beforeEach(async () => {
      const result = await client.execute({
        query: INITIATE_PAYMENT,
        variables: {
          input: { paymentPlanId: planId, teamId, method: 'bank_transfer' },
        },
        token: playerToken,
      });
      paymentId = (result.body.data!.initiatePayment as any).id;
    });

    it('should allow organizer to confirm bank_transfer payment', async () => {
      const result = await client.execute({
        query: CONFIRM_MANUAL_PAYMENT,
        variables: { paymentId, transactionId: 'TXN-123456' },
        token: organizerToken,
      });

      expect(result.body.errors).toBeUndefined();
      const payment = result.body.data!.confirmManualPayment as any;
      expect(payment.status).toBe('paid');
      expect(payment.transactionId).toBe('TXN-123456');
      expect(payment.paidAt).toBeTruthy();
    });

    it('should reject confirmation by non-organizer', async () => {
      const result = await client.execute({
        query: CONFIRM_MANUAL_PAYMENT,
        variables: { paymentId },
        token: playerToken,
      });

      expect(result.body.errors).toBeDefined();
    });

    it('should reject confirming already-paid payment', async () => {
      // Confirm first
      await client.execute({
        query: CONFIRM_MANUAL_PAYMENT,
        variables: { paymentId },
        token: organizerToken,
      });

      // Try confirming again
      const result = await client.execute({
        query: CONFIRM_MANUAL_PAYMENT,
        variables: { paymentId },
        token: organizerToken,
      });

      expect(result.body.errors).toBeDefined();
      expect(result.body.errors![0].message).toContain('already marked as paid');
    });
  });

  // ── Refund Payment ───────────────────────────────────────────────

  describe('Refund Payment', () => {
    let paymentId: string;

    beforeEach(async () => {
      const initResult = await client.execute({
        query: INITIATE_PAYMENT,
        variables: {
          input: { paymentPlanId: planId, teamId, method: 'bank_transfer' },
        },
        token: playerToken,
      });
      paymentId = (initResult.body.data!.initiatePayment as any).id;

      // Confirm the payment first
      await client.execute({
        query: CONFIRM_MANUAL_PAYMENT,
        variables: { paymentId, transactionId: 'TXN-REFUND-TEST' },
        token: organizerToken,
      });
    });

    it('should refund a paid payment', async () => {
      const result = await client.execute({
        query: REFUND_PAYMENT,
        variables: { paymentId, reason: 'Team withdrew' },
        token: organizerToken,
      });

      expect(result.body.errors).toBeUndefined();
      const payment = result.body.data!.refundPayment as any;
      expect(payment.status).toBe('refunded');
      expect(payment.refundReason).toBe('Team withdrew');
      expect(payment.refundedAt).toBeTruthy();
    });

    it('should reject refund of pending payment', async () => {
      // Create another pending payment
      const pending = await client.execute({
        query: INITIATE_PAYMENT,
        variables: {
          input: { paymentPlanId: planId, teamId: team2Id, method: 'cash' },
        },
        token: player2Token,
      });
      const pendingId = (pending.body.data!.initiatePayment as any).id;

      const result = await client.execute({
        query: REFUND_PAYMENT,
        variables: { paymentId: pendingId, reason: 'Test' },
        token: organizerToken,
      });

      expect(result.body.errors).toBeDefined();
      expect(result.body.errors![0].message).toContain('Only paid payments');
    });

    it('should reject refund by non-organizer', async () => {
      const result = await client.execute({
        query: REFUND_PAYMENT,
        variables: { paymentId, reason: 'Test' },
        token: playerToken,
      });

      expect(result.body.errors).toBeDefined();
    });
  });

  // ── Promo Codes ──────────────────────────────────────────────────

  describe('Promo Codes', () => {
    it('should create and validate a percentage promo code', async () => {
      await client.execute({
        query: CREATE_PROMO_CODE,
        variables: {
          input: {
            tournamentId,
            code: 'SAVE20',
            discountType: 'percent',
            discountValue: 20,
            maxUses: 10,
          },
        },
        token: organizerToken,
      });

      const result = await client.execute({
        query: VALIDATE_PROMO_CODE,
        variables: { tournamentId, code: 'SAVE20', amount: 500000 },
      });

      expect(result.body.errors).toBeUndefined();
      const validation = result.body.data!.validatePromoCode as any;
      expect(validation.valid).toBe(true);
      expect(validation.discountAmount).toBe(100000); // 20% of 500000
    });

    it('should create and validate a fixed promo code', async () => {
      await client.execute({
        query: CREATE_PROMO_CODE,
        variables: {
          input: {
            tournamentId,
            code: 'FLAT100K',
            discountType: 'fixed',
            discountValue: 100000,
          },
        },
        token: organizerToken,
      });

      const result = await client.execute({
        query: VALIDATE_PROMO_CODE,
        variables: { tournamentId, code: 'FLAT100K', amount: 500000 },
      });

      const validation = result.body.data!.validatePromoCode as any;
      expect(validation.valid).toBe(true);
      expect(validation.discountAmount).toBe(100000);
    });

    it('should reject invalid promo code', async () => {
      const result = await client.execute({
        query: VALIDATE_PROMO_CODE,
        variables: { tournamentId, code: 'INVALID', amount: 500000 },
      });

      const validation = result.body.data!.validatePromoCode as any;
      expect(validation.valid).toBe(false);
    });

    it('should apply promo code discount to payment', async () => {
      await client.execute({
        query: CREATE_PROMO_CODE,
        variables: {
          input: {
            tournamentId,
            code: 'HALF',
            discountType: 'percent',
            discountValue: 50,
          },
        },
        token: organizerToken,
      });

      const result = await client.execute({
        query: INITIATE_PAYMENT,
        variables: {
          input: {
            paymentPlanId: planId,
            teamId,
            method: 'bank_transfer',
            promoCode: 'HALF',
          },
        },
        token: playerToken,
      });

      expect(result.body.errors).toBeUndefined();
      const payment = result.body.data!.initiatePayment as any;
      expect(payment.amount).toBe(250000); // 500000 - 50%
      expect(payment.discountAmount).toBe(250000);
      expect(payment.promoCode).toBe('HALF');
    });
  });

  // ── Financial Summary ────────────────────────────────────────────

  describe('Financial Summary', () => {
    it('should reflect correct totals after payments', async () => {
      // Create and confirm payment for team 1
      const p1 = await client.execute({
        query: INITIATE_PAYMENT,
        variables: {
          input: { paymentPlanId: planId, teamId, method: 'bank_transfer' },
        },
        token: playerToken,
      });
      await client.execute({
        query: CONFIRM_MANUAL_PAYMENT,
        variables: { paymentId: (p1.body.data!.initiatePayment as any).id, transactionId: 'TXN-1' },
        token: organizerToken,
      });

      // Create pending payment for team 2
      await client.execute({
        query: INITIATE_PAYMENT,
        variables: {
          input: { paymentPlanId: planId, teamId: team2Id, method: 'cash' },
        },
        token: player2Token,
      });

      const result = await client.execute({
        query: FINANCIAL_SUMMARY,
        variables: { tournamentId },
        token: organizerToken,
      });

      expect(result.body.errors).toBeUndefined();
      const summary = result.body.data!.financialSummary as any;
      expect(summary.paymentCount).toBe(2);
      expect(summary.paidCount).toBe(1);
      expect(summary.totalRevenue).toBe(500000);
      expect(summary.totalPending).toBe(500000);
    });

    it('should reject financial summary for non-organizer', async () => {
      const result = await client.execute({
        query: FINANCIAL_SUMMARY,
        variables: { tournamentId },
        token: playerToken,
      });

      expect(result.body.errors).toBeDefined();
    });
  });

  // ── Full Payment Flow ────────────────────────────────────────────

  describe('Full Payment Flow: bank_transfer', () => {
    it('should complete initiate → confirm → refund flow', async () => {
      // Step 1: Initiate
      const initResult = await client.execute({
        query: INITIATE_PAYMENT,
        variables: {
          input: { paymentPlanId: planId, teamId, method: 'bank_transfer' },
        },
        token: playerToken,
      });
      expect(initResult.body.errors).toBeUndefined();
      const paymentId = (initResult.body.data!.initiatePayment as any).id;
      expect((initResult.body.data!.initiatePayment as any).status).toBe('pending');

      // Step 2: Confirm
      const confirmResult = await client.execute({
        query: CONFIRM_MANUAL_PAYMENT,
        variables: { paymentId, transactionId: 'BANK-REF-001' },
        token: organizerToken,
      });
      expect(confirmResult.body.errors).toBeUndefined();
      expect((confirmResult.body.data!.confirmManualPayment as any).status).toBe('paid');

      // Step 3: Refund
      const refundResult = await client.execute({
        query: REFUND_PAYMENT,
        variables: { paymentId, reason: 'Duplicate payment' },
        token: organizerToken,
      });
      expect(refundResult.body.errors).toBeUndefined();
      expect((refundResult.body.data!.refundPayment as any).status).toBe('refunded');

      // Step 4: Verify final state
      const summary = await client.execute({
        query: FINANCIAL_SUMMARY,
        variables: { tournamentId },
        token: organizerToken,
      });
      expect((summary.body.data!.financialSummary as any).totalRefunded).toBe(500000);
      expect((summary.body.data!.financialSummary as any).paidCount).toBe(0);
    });
  });

  describe('Full Payment Flow: VNPay', () => {
    it('should generate valid VNPay URL with correct params', async () => {
      const result = await client.execute({
        query: INITIATE_PAYMENT,
        variables: {
          input: { paymentPlanId: planId, teamId, method: 'vnpay' },
        },
        token: playerToken,
      });

      expect(result.body.errors).toBeUndefined();
      const payment = result.body.data!.initiatePayment as any;
      expect(payment.paymentUrl).toBeTruthy();

      // Parse VNPay URL and verify params
      const url = new URL(payment.paymentUrl);
      expect(url.hostname).toBe('sandbox.vnpayment.vn');
      expect(url.searchParams.get('vnp_TxnRef')).toBe(payment.id);
      expect(url.searchParams.get('vnp_Amount')).toBe('50000000'); // 500000 * 100
      expect(url.searchParams.get('vnp_Command')).toBe('pay');
      expect(url.searchParams.get('vnp_Version')).toBe('2.1.0');
      expect(url.searchParams.get('vnp_SecureHash')).toBeTruthy();
      expect(url.searchParams.get('vnp_ReturnUrl')).toContain('/payment/vnpay-return');
    });
  });

  // ── Overdue Payments ─────────────────────────────────────────────

  describe('Overdue Payments', () => {
    it('should mark expired payments as overdue when queried', async () => {
      // Create payment
      const result = await client.execute({
        query: INITIATE_PAYMENT,
        variables: {
          input: { paymentPlanId: planId, teamId, method: 'bank_transfer' },
        },
        token: playerToken,
      });
      const paymentId = (result.body.data!.initiatePayment as any).id;

      // Manually set expires_at to the past
      await db
        .updateTable('payments')
        .set({ expires_at: new Date(Date.now() - 1000) })
        .where('id', '=', paymentId)
        .execute();

      // Query payments — should trigger lazy overdue marking
      const payments = await client.execute({
        query: PAYMENTS_BY_TOURNAMENT,
        variables: { tournamentId },
        token: organizerToken,
      });

      const list = payments.body.data!.paymentsByTournament as any[];
      expect(list.length).toBe(1);
      expect(list[0].status).toBe('overdue');
    });
  });
});
