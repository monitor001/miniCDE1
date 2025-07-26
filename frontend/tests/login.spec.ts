import { test, expect } from '@playwright/test';

test('Đăng nhập thành công với tài khoản admin (có 2FA)', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="text"]', 'admin@minicde.com');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  // Nếu xuất hiện input mã 2FA, điền 123456 và xác thực
  const twoFAInput = page.locator('input');
  if (await twoFAInput.count() === 1) {
    await twoFAInput.fill('123456');
    await page.click('button[type="submit"]');
  }
  await expect(page).not.toHaveURL('http://localhost:3000/login');
  await expect(page.locator('text=miniCDE')).toBeVisible();
}); 