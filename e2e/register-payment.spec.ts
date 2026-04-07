import { test, expect, type Page } from '@playwright/test';

/**
 * E2E test: Register team with players → verify payment step
 * Uses badminton tournament (registration open, entry fee 200k)
 */

const SLUG = 'giai-cau-long-doi-nam-nu-2026';

test.describe('Team Registration + Payment Flow', () => {

  test('should register a new account, create team with players, and show payment step', async ({ page }) => {
    // 1. Go to registration page
    await page.goto(`/t/${SLUG}/register`);
    await page.waitForLoadState('networkidle');

    // Should show login prompt (not logged in)
    await expect(page.locator('text=Đăng nhập để đăng ký')).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/01-login-prompt.png' });

    // 2. Register a new account
    const email = `test-payment-${Date.now()}@test.com`;
    await page.click('text=Tạo tài khoản');
    await page.waitForURL(/\/register/);

    await page.fill('input[type="email"]', email);
    await page.locator('input[type="password"]').first().fill('Password@123');
    // Find confirm password field
    const passwordFields = page.locator('input[type="password"]');
    if (await passwordFields.count() > 1) {
      await passwordFields.nth(1).fill('Password@123');
    }
    // Fill full name
    const nameInput = page.locator('input').first();
    await nameInput.fill('Test Player E2E');

    await page.screenshot({ path: 'e2e/screenshots/02-register-form.png' });
    await page.click('button[type="submit"]');

    // Should redirect back to register page
    await page.waitForURL(/\/t\/.*\/register/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for data to load

    await page.screenshot({ path: 'e2e/screenshots/03-register-page-logged-in.png' });

    // 3. Should see registration form (team + players)
    // Fill team name
    const teamNameInput = page.locator('input[placeholder="Nhập tên đội"]');
    if (await teamNameInput.isVisible()) {
      await teamNameInput.fill('E2E Test Team');
    }

    // Fill player names (badminton doubles = 2 players)
    const playerInputs = page.locator('input[placeholder*="VĐV"]');
    const count = await playerInputs.count();
    for (let i = 0; i < count; i++) {
      await playerInputs.nth(i).fill(`Nguoi Choi ${i + 1}`);
    }

    await page.screenshot({ path: 'e2e/screenshots/04-team-form-filled.png' });

    // 4. Submit
    const submitBtn = page.locator('button[type="submit"]:has-text("Thanh toán"), button[type="submit"]:has-text("Đăng ký")');
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // 5. Wait for payment step
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'e2e/screenshots/05-after-submit.png' });

    // Check if payment card is visible
    const paymentCard = page.locator('text=Thanh toán lệ phí');
    const doneCard = page.locator('text=Đăng ký hoàn tất');

    if (await paymentCard.isVisible({ timeout: 5000 })) {
      // Payment step shown!
      await page.screenshot({ path: 'e2e/screenshots/06-payment-step.png', fullPage: true });

      // Verify amount shown
      await expect(page.locator('p.text-2xl')).toContainText('200.000');

      // Verify payment plan shown
      const payLaterBtn = page.locator('text=Thanh toán sau');
      await expect(payLaterBtn).toBeVisible();

      console.log('✅ Payment step is visible with amount and pay later button');
    } else if (await doneCard.isVisible({ timeout: 2000 })) {
      await page.screenshot({ path: 'e2e/screenshots/06-skipped-to-done.png', fullPage: true });
      console.log('❌ Skipped directly to done — payment step was bypassed!');
      // This is the bug — fail the test
      expect(false, 'Payment step was bypassed — went directly to done').toBeTruthy();
    } else {
      await page.screenshot({ path: 'e2e/screenshots/06-unknown-state.png', fullPage: true });
      console.log('❓ Unknown state after submit');
    }
  });
});
