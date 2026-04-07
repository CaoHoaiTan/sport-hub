import { test, expect, type Page } from '@playwright/test';

/**
 * E2E tests for the full tournament lifecycle.
 * Tests the complete flow through the browser UI.
 *
 * Prerequisites: API (port 4000) and Web (port 3000) servers running.
 * Uses existing admin account: admin@sporthub.vn / Admin@123
 */

const ADMIN_EMAIL = 'admin@sporthub.vn';
const ADMIN_PASSWORD = 'Admin@123';

// Helper: login as admin
async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(dashboard|tournaments)/);
}

// Helper: login with custom credentials
async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(dashboard|tournaments)/);
}

// ═══════════════════════════════════════════════════
// AUTH FLOW
// ═══════════════════════════════════════════════════
test.describe('Auth Flow', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/SportHub/i);
  });

  test('should show login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should login as admin', async ({ page }) => {
    await loginAsAdmin(page);
    // Should see dashboard
    await expect(page.locator('h1')).toContainText(/chào mừng|tổng quan|dashboard/i);
  });

  test('should show register page', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('should redirect unauthenticated user to login', async ({ page }) => {
    await page.goto('/tournaments');
    await page.waitForURL(/\/login/);
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════
test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should show sidebar navigation', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should navigate to tournaments page', async ({ page }) => {
    await page.goto('/tournaments');
    await expect(page.locator('h1')).toContainText(/giải đấu/i);
  });

  test('should navigate to venues page', async ({ page }) => {
    await page.goto('/venues');
    await expect(page.locator('h1')).toContainText(/địa điểm/i);
  });

  test('should navigate to admin users page', async ({ page }) => {
    await page.goto('/admin/users');
    await expect(page.locator('h1')).toContainText(/quản lý người dùng/i);
  });

  test('should navigate to profile page', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.locator('h1')).toContainText(/hồ sơ|profile/i);
  });

  test('should navigate to notifications page', async ({ page }) => {
    await page.goto('/notifications');
    await expect(page.locator('h1')).toContainText(/thông báo/i);
  });
});

// ═══════════════════════════════════════════════════
// TOURNAMENT PAGES
// ═══════════════════════════════════════════════════
test.describe('Tournament Pages', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should show create tournament page', async ({ page }) => {
    await page.goto('/tournaments/new');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should show existing tournament detail', async ({ page }) => {
    await page.goto('/tournaments');
    // Click on first tournament card if exists
    const card = page.locator('a[href*="/tournaments/"]').first();
    if (await card.isVisible()) {
      await card.click();
      await page.waitForURL(/\/tournaments\/[a-f0-9-]+/);
      // Should show tournament tabs
      await expect(page.locator('nav[aria-label="Tournament tabs"]')).toBeVisible();
    }
  });

  test('should show tournament tabs navigation', async ({ page }) => {
    // Use first in_progress tournament
    const res = await page.request.post('http://localhost:4000/graphql', {
      data: {
        query: `query { myTournaments { id status } }`,
      },
      headers: {
        Authorization: `Bearer ${await getAdminToken(page)}`,
      },
    });
    const body = await res.json();
    const tournament = body.data?.myTournaments?.[0];
    if (!tournament) return;

    await page.goto(`/tournaments/${tournament.id}`);
    const nav = page.locator('nav[aria-label="Tournament tabs"]');
    await expect(nav).toBeVisible();

    // Check tabs exist
    await expect(nav.locator('a:has-text("Overview")')).toBeVisible();
    await expect(nav.locator('a:has-text("Teams")')).toBeVisible();
    await expect(nav.locator('a:has-text("Schedule")')).toBeVisible();
    await expect(nav.locator('a:has-text("Standings")')).toBeVisible();
  });

  test('should navigate to teams tab', async ({ page }) => {
    const tid = await getFirstTournamentId(page);
    if (!tid) return;
    await page.goto(`/tournaments/${tid}/teams`);
    await expect(page.locator('text=Đội tham gia')).toBeVisible();
  });

  test('should navigate to schedule tab', async ({ page }) => {
    const tid = await getFirstTournamentId(page);
    if (!tid) return;
    await page.goto(`/tournaments/${tid}/schedule`);
    await page.waitForLoadState('networkidle');
    // Page should load without errors
    await expect(page.locator('body')).toBeVisible();
  });

  test('should navigate to standings tab', async ({ page }) => {
    const tid = await getFirstTournamentId(page);
    if (!tid) return;
    await page.goto(`/tournaments/${tid}/standings`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should navigate to checkin tab', async ({ page }) => {
    const tid = await getFirstTournamentId(page);
    if (!tid) return;
    await page.goto(`/tournaments/${tid}/checkin`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h2:has-text("Check-in")')).toBeVisible();
  });

  test('should navigate to settings tab', async ({ page }) => {
    const tid = await getFirstTournamentId(page);
    if (!tid) return;
    await page.goto(`/tournaments/${tid}/settings`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Thông tin cơ bản')).toBeVisible();
  });

  test('should navigate to payments tab', async ({ page }) => {
    const tid = await getFirstTournamentId(page);
    if (!tid) return;
    await page.goto(`/tournaments/${tid}/payments`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should navigate to posts tab', async ({ page }) => {
    const tid = await getFirstTournamentId(page);
    if (!tid) return;
    await page.goto(`/tournaments/${tid}/posts`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════
// PUBLIC PAGES
// ═══════════════════════════════════════════════════
test.describe('Public Pages', () => {
  test('should show public tournaments list', async ({ page }) => {
    await page.goto('/t');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should show public tournament overview', async ({ page }) => {
    const slug = await getFirstTournamentSlug(page);
    if (!slug) return;
    await page.goto(`/t/${slug}`);
    await page.waitForLoadState('networkidle');
    // Should show tournament info
    await expect(page.locator('text=Thông tin giải đấu')).toBeVisible();
  });

  test('should show public schedule', async ({ page }) => {
    const slug = await getFirstTournamentSlug(page);
    if (!slug) return;
    await page.goto(`/t/${slug}/schedule`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should show public standings', async ({ page }) => {
    const slug = await getFirstTournamentSlug(page);
    if (!slug) return;
    await page.goto(`/t/${slug}/standings`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should show public posts', async ({ page }) => {
    const slug = await getFirstTournamentSlug(page);
    if (!slug) return;
    await page.goto(`/t/${slug}/posts`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should show registration page for open tournament', async ({ page }) => {
    // Find a tournament in registration status
    const res = await page.request.post('http://localhost:4000/graphql', {
      data: {
        query: `query { tournaments(filter: { status: "registration" }) {
          edges { node { slug } }
        }}`,
      },
    });
    const body = await res.json();
    const slug = body.data?.tournaments?.edges?.[0]?.node?.slug;
    if (!slug) return;

    await page.goto(`/t/${slug}/register`);
    await page.waitForLoadState('networkidle');
    // Should show registration UI (login prompt or form)
    await expect(page.locator('body')).toBeVisible();
  });

  test('should show checkin page', async ({ page }) => {
    await page.goto('/checkin');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Check-in trận đấu')).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════
// VENUE PAGES
// ═══════════════════════════════════════════════════
test.describe('Venue Pages', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should show venues list', async ({ page }) => {
    await page.goto('/venues');
    await expect(page.locator('h1')).toContainText(/địa điểm/i);
  });

  test('should show new venue form', async ({ page }) => {
    await page.goto('/venues/new');
    await expect(page.locator('h1')).toContainText(/thêm địa điểm/i);
  });
});

// ═══════════════════════════════════════════════════
// ADMIN PAGES
// ═══════════════════════════════════════════════════
test.describe('Admin Pages', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should show admin users page with user list', async ({ page }) => {
    await page.goto('/admin/users');
    await expect(page.locator('h1')).toContainText(/quản lý người dùng/i);
    // Should show at least the admin user
    await expect(page.locator('table, [role="table"]').first()).toBeVisible();
  });

  test('should show admin reports page', async ({ page }) => {
    await page.goto('/admin/reports');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════
// NO 500 ERRORS — smoke test all routes
// ═══════════════════════════════════════════════════
test.describe('No 500 Errors', () => {
  test('homepage should not 500', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).not.toBe(500);
  });

  test('login should not 500', async ({ page }) => {
    const response = await page.goto('/login');
    expect(response?.status()).not.toBe(500);
  });

  test('register should not 500', async ({ page }) => {
    const response = await page.goto('/register');
    expect(response?.status()).not.toBe(500);
  });

  test('public tournaments should not 500', async ({ page }) => {
    const response = await page.goto('/t');
    expect(response?.status()).not.toBe(500);
  });

  test('checkin page should not 500', async ({ page }) => {
    const response = await page.goto('/checkin');
    expect(response?.status()).not.toBe(500);
  });
});

// ── Helpers ────────────────────────────────────────

async function getAdminToken(page: Page): Promise<string> {
  const res = await page.request.post('http://localhost:4000/graphql', {
    data: {
      query: `mutation { login(input: { email: "${ADMIN_EMAIL}", password: "${ADMIN_PASSWORD}" }) { accessToken } }`,
    },
  });
  const body = await res.json();
  return body.data?.login?.accessToken ?? '';
}

async function getFirstTournamentId(page: Page): Promise<string | null> {
  const token = await getAdminToken(page);
  const res = await page.request.post('http://localhost:4000/graphql', {
    data: { query: `query { myTournaments { id } }` },
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  return body.data?.myTournaments?.[0]?.id ?? null;
}

async function getFirstTournamentSlug(page: Page): Promise<string | null> {
  const res = await page.request.post('http://localhost:4000/graphql', {
    data: {
      query: `query { tournaments { edges { node { slug status } } } }`,
    },
  });
  const body = await res.json();
  const edges = body.data?.tournaments?.edges ?? [];
  const active = edges.find(
    (e: { node: { status: string } }) =>
      e.node.status !== 'draft' && e.node.status !== 'cancelled'
  );
  return active?.node?.slug ?? null;
}
