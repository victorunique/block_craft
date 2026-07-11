import { test, expect } from '@playwright/test';

test('main menu renders and Continue button is disabled without a save', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.main-menu-logo')).toBeVisible();
  await expect(page.locator('.menu-btn.continue')).toBeDisabled();
  await expect(page.locator('.menu-btn.new')).toBeVisible();
  await expect(page.locator('.menu-btn.import')).toBeVisible();
  await expect(page.locator('.menu-btn.settings')).toBeVisible();
});

test('can create a new world and enter the game', async ({ page }) => {
  await page.goto('/');
  
  // Set render distance to 2 to keep CPU usage low in headless browser environment
  await page.evaluate(() => {
    const store = (window as any).__bcSettingsStore;
    if (store) store.getState().setSettings({ renderDistance: 2 });
  });

  await page.locator('.menu-btn.new').click();
  await expect(page.locator('.wc-title')).toBeVisible();
  
  // Click size "Medium" (first seg-group)
  await page.locator('.seg-group').first().locator('.seg', { hasText: 'Medium' }).click();
  
  // Click difficulty "Easy" (second seg-group)
  await page.locator('.seg-group').nth(1).locator('.seg', { hasText: 'Easy' }).click();
  
  // Click Create World button
  await page.locator('.btn-primary').click();
  
  await expect(page.locator('.loading-overlay')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('.loading-count')).toBeVisible({ timeout: 15000 });
  
  // Wait for loading to finish and canvas to mount
  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible({ timeout: 15000 });
  
  // Verify UI controls guide is shown on screen
  await expect(page.locator('.controls-hint, .controls-mini')).toBeVisible({ timeout: 5000 });
});
