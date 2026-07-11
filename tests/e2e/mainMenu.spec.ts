import { test, expect } from '@playwright/test';

test('main menu renders and Continue button is disabled without a save', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'BlockCraft' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Continue/ })).toBeDisabled();
  await expect(page.getByRole('button', { name: /New Game/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Import Save/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Settings/ })).toBeVisible();
});

test('can create a new world and enter the game', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /New Game/ }).click();
  await expect(page.getByRole('heading', { name: 'Create a New World' })).toBeVisible();
  await page.getByRole('button', { name: 'Medium' }).first().click();
  await page.getByRole('button', { name: /Easy|Medium|Hard/ }).first().click();
  await page.getByRole('button', { name: /Create World/ }).click();
  await expect(page.getByText('Building your world…')).toBeVisible({ timeout: 5000 });
  await expect(page.getByText(/chunks? ready/)).toBeVisible({ timeout: 15000 });
  await page.waitForTimeout(3000);
  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible({ timeout: 10000 });
  const controlsHint = page.getByRole('region', { name: 'Game controls' }).or(page.getByRole('button', { name: 'Show controls' }));
  await expect(controlsHint).toBeVisible({ timeout: 5000 });
});
