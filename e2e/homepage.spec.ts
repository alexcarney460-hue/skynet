import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('renders landing page with key content', async ({ page }) => {
    await page.goto('/');

    // Title / brand
    await expect(page.locator('text=SKYNETX').first()).toBeVisible();

    // Hero copy
    await expect(page.locator('text=Stop your AI agents from')).toBeVisible();
    await expect(page.locator('text=burning money')).toBeVisible();

    // Pricing section
    await expect(page.locator('#pricing')).toBeVisible();
    await expect(page.locator('text=Starter').first()).toBeVisible();
    await expect(page.locator('text=Scale').first()).toBeVisible();

    // Endpoint reference table
    await expect(page.locator('text=POST /api/v1/drift').first()).toBeVisible();
    await expect(page.locator('text=POST /api/v1/compress').first()).toBeVisible();

    // Free credits callout
    await expect(page.locator('text=100 free credits').first()).toBeVisible();
  });

  test('navigation links are present', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('a[href="#pricing"]')).toBeVisible();
    await expect(page.locator('a[href="#api"]').first()).toBeVisible();
    await expect(page.locator('a[href="/console"]').first()).toBeVisible();
  });
});
