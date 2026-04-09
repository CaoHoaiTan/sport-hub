import { test, expect } from '@playwright/test';
import crypto from 'node:crypto';

const API = 'http://localhost:4000';
const VNPAY_SECRET = process.env.VNPAY_HASH_SECRET ?? 'PC24N9TOKV42BS1THODK0Y3VHEKUVVZP';
const VNPAY_TMN = process.env.VNPAY_TMN_CODE ?? 'PUHT01O8';

// ── Helpers ──────────────────────────────────────────────────────────

async function gql(
  request: import('@playwright/test').APIRequestContext,
  query: string,
  variables: Record<string, unknown> = {},
  token?: string
) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await request.post(`${API}/graphql`, {
    headers,
    data: { query, variables },
  });
  return res.json();
}

function buildVnpayReturnUrl(paymentId: string, amount: number, success: boolean): string {
  const params: Record<string, string> = {
    vnp_Amount: String(amount * 100),
    vnp_BankCode: 'NCB',
    vnp_CardType: 'ATM',
    vnp_OrderInfo: 'Payment for test',
    vnp_PayDate: '20260409120000',
    vnp_ResponseCode: success ? '00' : '24',
    vnp_TmnCode: VNPAY_TMN,
    vnp_TransactionNo: success ? '14223345' : '0',
    vnp_TransactionStatus: success ? '00' : '02',
    vnp_TxnRef: paymentId,
  };
  const sp = new URLSearchParams();
  for (const key of Object.keys(params).sort()) sp.append(key, params[key]);
  const signData = sp.toString();
  const hash = crypto.createHmac('sha512', VNPAY_SECRET).update(Buffer.from(signData, 'utf-8')).digest('hex');
  return `${API}/payment/vnpay-return?${signData}&vnp_SecureHash=${hash}`;
}

// ── Fixture ──────────────────────────────────────────────────────────

interface Fixture {
  adminToken: string;
  organizerToken: string;
  playerToken: string;
  player2Token: string;
  tournamentId: string;
  teamId: string;
  team2Id: string;
  planId: string;
}

async function setupFixture(request: import('@playwright/test').APIRequestContext): Promise<Fixture> {
  const s = Date.now();

  // Admin login
  const admin = await gql(request, `mutation { login(input: { email: "admin@sporthub.vn", password: "Password@123" }) { accessToken user { id } } }`);
  const adminToken = admin.data.login.accessToken;

  // Organizer
  const orgReg = await gql(request, `mutation { register(input: { email: "org-${s}@e2e.test", password: "Password@123", fullName: "Organizer" }) { accessToken user { id } } }`);
  await gql(request, `mutation { updateUserRole(userId: "${orgReg.data.register.user.id}", role: organizer) { id } }`, {}, adminToken);
  const orgLogin = await gql(request, `mutation { login(input: { email: "org-${s}@e2e.test", password: "Password@123" }) { accessToken } }`);
  const organizerToken = orgLogin.data.login.accessToken;

  // Player 1
  const p1 = await gql(request, `mutation { register(input: { email: "p1-${s}@e2e.test", password: "Password@123", fullName: "Player 1" }) { accessToken } }`);
  const playerToken = p1.data.register.accessToken;

  // Player 2
  const p2 = await gql(request, `mutation { register(input: { email: "p2-${s}@e2e.test", password: "Password@123", fullName: "Player 2" }) { accessToken } }`);
  const player2Token = p2.data.register.accessToken;

  // Tournament
  const startDate = new Date(Date.now() + 14 * 86400000).toISOString();
  const t = await gql(request, `mutation CreateTournament($input: CreateTournamentInput!) { createTournament(input: $input) { id } }`, {
    input: { name: `E2E Cup ${s}`, sport: 'football', format: 'round_robin', startDate, minPlayersPerTeam: 5, maxPlayersPerTeam: 11, maxTeams: 8 },
  }, organizerToken);
  const tournamentId = t.data.createTournament.id;

  await gql(request, `mutation { updateTournamentStatus(id: "${tournamentId}", status: registration) { id } }`, {}, organizerToken);

  // Teams
  const team1 = await gql(request, `mutation { registerTeam(input: { tournamentId: "${tournamentId}", name: "Team Alpha" }) { id } }`, {}, playerToken);
  const teamId = team1.data.registerTeam.id;
  const team2 = await gql(request, `mutation { registerTeam(input: { tournamentId: "${tournamentId}", name: "Team Beta" }) { id } }`, {}, player2Token);
  const team2Id = team2.data.registerTeam.id;

  // Payment plan with bank info
  const plan = await gql(request, `mutation CreatePaymentPlan($input: CreatePaymentPlanInput!) { createPaymentPlan(input: $input) { id } }`, {
    input: {
      tournamentId,
      name: 'Entry Fee',
      amount: 500000,
      perTeam: true,
      bankName: 'Vietcombank',
      bankAccountNumber: '1234567890',
      bankAccountHolder: 'NGUYEN VAN A',
      transferContent: 'TEN DOI - Le phi giai',
    },
  }, organizerToken);
  const planId = plan.data.createPaymentPlan.id;

  return { adminToken, organizerToken, playerToken, player2Token, tournamentId, teamId, team2Id, planId };
}

// ── Tests ────────────────────────────────────────────────────────────

test.describe('Payment E2E: Complete Flow', () => {
  let f: Fixture;

  test.beforeAll(async ({ request }) => {
    f = await setupFixture(request);
  });

  // ── Bank Transfer ──────────────────────────────────────

  test('bank_transfer: initiate → pending → organizer confirms → paid', async ({ request }) => {
    const init = await gql(request, `mutation InitiatePayment($input: InitiatePaymentInput!) {
      initiatePayment(input: $input) { id status method paymentUrl amount }
    }`, { input: { paymentPlanId: f.planId, teamId: f.teamId, method: 'bank_transfer' } }, f.playerToken);

    expect(init.errors).toBeUndefined();
    expect(init.data.initiatePayment.status).toBe('pending');
    expect(init.data.initiatePayment.method).toBe('bank_transfer');
    expect(init.data.initiatePayment.paymentUrl).toBeNull();

    const paymentId = init.data.initiatePayment.id;

    const confirm = await gql(request, `mutation { confirmManualPayment(paymentId: "${paymentId}", transactionId: "VCB-001") {
      id status transactionId paidAt
    } }`, {}, f.organizerToken);

    expect(confirm.errors).toBeUndefined();
    expect(confirm.data.confirmManualPayment.status).toBe('paid');
    expect(confirm.data.confirmManualPayment.transactionId).toBe('VCB-001');
    expect(confirm.data.confirmManualPayment.paidAt).toBeTruthy();
  });

  // ── Cash ───────────────────────────────────────────────

  test('cash: initiate → organizer confirms without transactionId', async ({ request }) => {
    const init = await gql(request, `mutation InitiatePayment($input: InitiatePaymentInput!) {
      initiatePayment(input: $input) { id status method }
    }`, { input: { paymentPlanId: f.planId, teamId: f.teamId, method: 'cash' } }, f.playerToken);

    expect(init.data.initiatePayment.status).toBe('pending');
    expect(init.data.initiatePayment.method).toBe('cash');

    const confirm = await gql(request, `mutation { confirmManualPayment(paymentId: "${init.data.initiatePayment.id}") {
      id status transactionId
    } }`, {}, f.organizerToken);

    expect(confirm.data.confirmManualPayment.status).toBe('paid');
    expect(confirm.data.confirmManualPayment.transactionId).toBeNull();
  });

  // ── VNPay ──────────────────────────────────────────────

  test('vnpay: generates valid payment URL with correct params', async ({ request }) => {
    const result = await gql(request, `mutation InitiatePayment($input: InitiatePaymentInput!) {
      initiatePayment(input: $input) { id status paymentUrl amount }
    }`, { input: { paymentPlanId: f.planId, teamId: f.teamId, method: 'vnpay' } }, f.playerToken);

    expect(result.errors).toBeUndefined();
    const p = result.data.initiatePayment;
    expect(p.status).toBe('pending');
    expect(p.paymentUrl).toBeTruthy();

    const url = new URL(p.paymentUrl);
    expect(url.hostname).toBe('sandbox.vnpayment.vn');
    expect(url.searchParams.get('vnp_TxnRef')).toBe(p.id);
    expect(url.searchParams.get('vnp_Amount')).toBe('50000000');
    expect(url.searchParams.get('vnp_Version')).toBe('2.1.0');
    expect(url.searchParams.get('vnp_Command')).toBe('pay');
    expect(url.searchParams.get('vnp_ReturnUrl')).toContain('/payment/vnpay-return');
    expect(url.searchParams.get('vnp_SecureHash')).toBeTruthy();
  });

  test('vnpay: valid callback → payment marked paid → redirect success', async ({ request }) => {
    const init = await gql(request, `mutation InitiatePayment($input: InitiatePaymentInput!) {
      initiatePayment(input: $input) { id amount }
    }`, { input: { paymentPlanId: f.planId, teamId: f.teamId, method: 'vnpay' } }, f.playerToken);

    const { id, amount } = init.data.initiatePayment;
    const returnUrl = buildVnpayReturnUrl(id, amount, true);
    const res = await request.get(returnUrl, { maxRedirects: 0 });

    expect(res.status()).toBe(302);
    const loc = res.headers()['location'] ?? '';
    expect(loc).toContain('status=success');
    expect(loc).toContain(`paymentId=${id}`);
    expect(loc).toContain('tournamentId=');

    // DB check
    const check = await gql(request, `query { paymentsByTournament(tournamentId: "${f.tournamentId}") { id status transactionId paidAt } }`, {}, f.organizerToken);
    const paid = check.data.paymentsByTournament.find((p: any) => p.id === id);
    expect(paid.status).toBe('paid');
    expect(paid.paidAt).toBeTruthy();
  });

  test('vnpay: invalid signature → rejects → redirect failed', async ({ request }) => {
    const init = await gql(request, `mutation InitiatePayment($input: InitiatePaymentInput!) {
      initiatePayment(input: $input) { id }
    }`, { input: { paymentPlanId: f.planId, teamId: f.teamId, method: 'vnpay' } }, f.playerToken);

    const id = init.data.initiatePayment.id;
    const res = await request.get(`${API}/payment/vnpay-return?vnp_TxnRef=${id}&vnp_ResponseCode=00&vnp_Amount=50000000&vnp_SecureHash=tampered`, { maxRedirects: 0 });

    expect(res.status()).toBe(302);
    expect(res.headers()['location']).toContain('invalid_signature');

    // Still pending
    const check = await gql(request, `query { paymentsByTournament(tournamentId: "${f.tournamentId}") { id status } }`, {}, f.organizerToken);
    expect(check.data.paymentsByTournament.find((p: any) => p.id === id).status).toBe('pending');
  });

  test('vnpay: cancelled payment (code 24) → redirect with failure code', async ({ request }) => {
    const init = await gql(request, `mutation InitiatePayment($input: InitiatePaymentInput!) {
      initiatePayment(input: $input) { id amount }
    }`, { input: { paymentPlanId: f.planId, teamId: f.teamId, method: 'vnpay' } }, f.playerToken);

    const { id, amount } = init.data.initiatePayment;
    const res = await request.get(buildVnpayReturnUrl(id, amount, false), { maxRedirects: 0 });

    expect(res.status()).toBe(302);
    const loc = res.headers()['location'] ?? '';
    expect(loc).toContain('status=failed');
    expect(loc).toContain('code=24');
  });

  test('vnpay: success callback shows result page in browser', async ({ page, request }) => {
    const init = await gql(request, `mutation InitiatePayment($input: InitiatePaymentInput!) {
      initiatePayment(input: $input) { id amount }
    }`, { input: { paymentPlanId: f.planId, teamId: f.teamId, method: 'vnpay' } }, f.playerToken);

    const { id, amount } = init.data.initiatePayment;
    await page.goto(buildVnpayReturnUrl(id, amount, true));
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Thanh toán đã hoàn tất thành công')).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'e2e/screenshots/payment-vnpay-success.png' });
  });

  test('vnpay: failed callback shows error page in browser', async ({ page, request }) => {
    const init = await gql(request, `mutation InitiatePayment($input: InitiatePaymentInput!) {
      initiatePayment(input: $input) { id amount }
    }`, { input: { paymentPlanId: f.planId, teamId: f.teamId, method: 'vnpay' } }, f.playerToken);

    const { id, amount } = init.data.initiatePayment;
    await page.goto(buildVnpayReturnUrl(id, amount, false));
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Thanh toán thất bại')).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'e2e/screenshots/payment-vnpay-failed.png' });
  });

  // ── MoMo (disabled) ───────────────────────────────────

  test('momo: rejected with error, no payment created', async ({ request }) => {
    const result = await gql(request, `mutation InitiatePayment($input: InitiatePaymentInput!) {
      initiatePayment(input: $input) { id }
    }`, { input: { paymentPlanId: f.planId, teamId: f.teamId, method: 'momo' } }, f.playerToken);

    expect(result.errors).toBeDefined();
    expect(result.errors[0].message).toContain('MoMo');
  });

  // ── Refund ─────────────────────────────────────────────

  test('refund: paid → refunded with reason', async ({ request }) => {
    const init = await gql(request, `mutation InitiatePayment($input: InitiatePaymentInput!) {
      initiatePayment(input: $input) { id }
    }`, { input: { paymentPlanId: f.planId, teamId: f.teamId, method: 'cash' } }, f.playerToken);
    const id = init.data.initiatePayment.id;

    await gql(request, `mutation { confirmManualPayment(paymentId: "${id}") { id } }`, {}, f.organizerToken);

    const refund = await gql(request, `mutation { refundPayment(paymentId: "${id}", reason: "Duplicate") {
      id status refundReason refundedAt
    } }`, {}, f.organizerToken);

    expect(refund.data.refundPayment.status).toBe('refunded');
    expect(refund.data.refundPayment.refundReason).toBe('Duplicate');
    expect(refund.data.refundPayment.refundedAt).toBeTruthy();
  });

  test('refund: pending payment cannot be refunded', async ({ request }) => {
    const init = await gql(request, `mutation InitiatePayment($input: InitiatePaymentInput!) {
      initiatePayment(input: $input) { id }
    }`, { input: { paymentPlanId: f.planId, teamId: f.team2Id, method: 'bank_transfer' } }, f.player2Token);

    const result = await gql(request, `mutation { refundPayment(paymentId: "${init.data.initiatePayment.id}", reason: "test") { id } }`, {}, f.organizerToken);
    expect(result.errors).toBeDefined();
    expect(result.errors[0].message).toContain('Only paid');
  });

  // ── Promo Code ─────────────────────────────────────────

  test('promo: percentage discount applied to payment', async ({ request }) => {
    await gql(request, `mutation CreatePromoCode($input: CreatePromoCodeInput!) {
      createPromoCode(input: $input) { id }
    }`, { input: { tournamentId: f.tournamentId, code: 'E2E20OFF', discountType: 'percent', discountValue: 20, maxUses: 5 } }, f.organizerToken);

    // Validate
    const validate = await gql(request, `query { validatePromoCode(tournamentId: "${f.tournamentId}", code: "E2E20OFF", amount: 500000) {
      valid discountAmount message
    } }`);
    expect(validate.data.validatePromoCode.valid).toBe(true);
    expect(validate.data.validatePromoCode.discountAmount).toBe(100000);

    // Use in payment
    const init = await gql(request, `mutation InitiatePayment($input: InitiatePaymentInput!) {
      initiatePayment(input: $input) { id amount discountAmount promoCode }
    }`, { input: { paymentPlanId: f.planId, teamId: f.teamId, method: 'bank_transfer', promoCode: 'E2E20OFF' } }, f.playerToken);

    expect(init.data.initiatePayment.amount).toBe(400000);
    expect(init.data.initiatePayment.discountAmount).toBe(100000);
    expect(init.data.initiatePayment.promoCode).toBe('E2E20OFF');
  });

  test('promo: fixed discount applied correctly', async ({ request }) => {
    await gql(request, `mutation CreatePromoCode($input: CreatePromoCodeInput!) {
      createPromoCode(input: $input) { id }
    }`, { input: { tournamentId: f.tournamentId, code: 'E2E50K', discountType: 'fixed', discountValue: 50000 } }, f.organizerToken);

    const init = await gql(request, `mutation InitiatePayment($input: InitiatePaymentInput!) {
      initiatePayment(input: $input) { id amount discountAmount }
    }`, { input: { paymentPlanId: f.planId, teamId: f.teamId, method: 'cash', promoCode: 'E2E50K' } }, f.playerToken);

    expect(init.data.initiatePayment.amount).toBe(450000);
    expect(init.data.initiatePayment.discountAmount).toBe(50000);
  });

  test('promo: invalid code ignored gracefully', async ({ request }) => {
    const validate = await gql(request, `query { validatePromoCode(tournamentId: "${f.tournamentId}", code: "FAKE", amount: 500000) {
      valid message
    } }`);
    expect(validate.data.validatePromoCode.valid).toBe(false);
  });

  // ── Bank Info ──────────────────────────────────────────

  test('bank_info: payment plan returns bank details', async ({ request }) => {
    const result = await gql(request, `query { paymentPlansByTournament(tournamentId: "${f.tournamentId}") {
      id bankName bankAccountNumber bankAccountHolder transferContent
    } }`);

    const plan = result.data.paymentPlansByTournament.find((p: any) => p.id === f.planId);
    expect(plan.bankName).toBe('Vietcombank');
    expect(plan.bankAccountNumber).toBe('1234567890');
    expect(plan.bankAccountHolder).toBe('NGUYEN VAN A');
    expect(plan.transferContent).toBe('TEN DOI - Le phi giai');
  });

  // ── Financial Summary ──────────────────────────────────

  test('financial_summary: reflects correct totals', async ({ request }) => {
    const summary = await gql(request, `query { financialSummary(tournamentId: "${f.tournamentId}") {
      totalRevenue totalPending totalRefunded paymentCount paidCount overdueCount
    } }`, {}, f.organizerToken);

    expect(summary.errors).toBeUndefined();
    const s = summary.data.financialSummary;
    expect(s.paymentCount).toBeGreaterThan(0);
    expect(typeof s.totalRevenue).toBe('number');
    expect(typeof s.totalPending).toBe('number');
    expect(typeof s.totalRefunded).toBe('number');
  });

  test('financial_summary: rejected for non-organizer', async ({ request }) => {
    const result = await gql(request, `query { financialSummary(tournamentId: "${f.tournamentId}") { totalRevenue } }`, {}, f.playerToken);
    expect(result.errors).toBeDefined();
  });

  // ── Authorization ──────────────────────────────────────

  test('auth: cannot pay for another player\'s team (IDOR)', async ({ request }) => {
    const result = await gql(request, `mutation InitiatePayment($input: InitiatePaymentInput!) {
      initiatePayment(input: $input) { id }
    }`, { input: { paymentPlanId: f.planId, teamId: f.team2Id, method: 'bank_transfer' } }, f.playerToken);

    expect(result.errors).toBeDefined();
    expect(result.errors[0].extensions.code).toBe('FORBIDDEN');
  });

  test('auth: unauthenticated user cannot initiate payment', async ({ request }) => {
    const result = await gql(request, `mutation InitiatePayment($input: InitiatePaymentInput!) {
      initiatePayment(input: $input) { id }
    }`, { input: { paymentPlanId: f.planId, teamId: f.teamId, method: 'bank_transfer' } });

    expect(result.errors).toBeDefined();
  });

  test('auth: player cannot confirm payment', async ({ request }) => {
    const init = await gql(request, `mutation InitiatePayment($input: InitiatePaymentInput!) {
      initiatePayment(input: $input) { id }
    }`, { input: { paymentPlanId: f.planId, teamId: f.teamId, method: 'bank_transfer' } }, f.playerToken);

    const result = await gql(request, `mutation { confirmManualPayment(paymentId: "${init.data.initiatePayment.id}") { id } }`, {}, f.playerToken);
    expect(result.errors).toBeDefined();
  });

  test('auth: player cannot refund payment', async ({ request }) => {
    const init = await gql(request, `mutation InitiatePayment($input: InitiatePaymentInput!) {
      initiatePayment(input: $input) { id }
    }`, { input: { paymentPlanId: f.planId, teamId: f.teamId, method: 'cash' } }, f.playerToken);
    const id = init.data.initiatePayment.id;

    await gql(request, `mutation { confirmManualPayment(paymentId: "${id}") { id } }`, {}, f.organizerToken);

    const result = await gql(request, `mutation { refundPayment(paymentId: "${id}", reason: "test") { id } }`, {}, f.playerToken);
    expect(result.errors).toBeDefined();
  });

  test('auth: player cannot create payment plan', async ({ request }) => {
    const result = await gql(request, `mutation CreatePaymentPlan($input: CreatePaymentPlanInput!) {
      createPaymentPlan(input: $input) { id }
    }`, { input: { tournamentId: f.tournamentId, name: 'Nope', amount: 100000 } }, f.playerToken);

    expect(result.errors).toBeDefined();
  });
});
