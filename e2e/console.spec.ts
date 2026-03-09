import { test, expect } from '@playwright/test';

test.describe('Console page', () => {
  test('renders the dashboard with key elements', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/console', { waitUntil: 'domcontentloaded' });

    // Header
    await expect(page.locator('text=SkynetX Console')).toBeVisible();
    await expect(page.locator('text=Cognitive Telemetry Dashboard')).toBeVisible();

    // Tab navigation
    await expect(page.locator('button:text("Metrics")')).toBeVisible();
    await expect(page.locator('button:text("Compress")')).toBeVisible();
    await expect(page.locator('button:text("Memory")')).toBeVisible();
    await expect(page.locator('button:text("Circuit Breaker")')).toBeVisible();
    await expect(page.locator('button:text("Telemetry")')).toBeVisible();

    // Navigation links
    await expect(page.locator('a[href="/"]')).toBeVisible();
    await expect(page.locator('a[href="/console/billing"]')).toBeVisible();
  });
});
