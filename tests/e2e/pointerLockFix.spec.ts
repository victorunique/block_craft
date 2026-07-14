import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log('PAGE ERROR:', msg.text());
  });
  page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message));

  await page.goto('/');

  // Clear service workers and IDB so tests are independent
  await page.evaluate(async () => {
    if (navigator.serviceWorker) {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const r of regs) await r.unregister();
    }
    if (window.caches) {
      const keys = await caches.keys();
      for (const k of keys) await caches.delete(k);
    }
    await new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase('BlockCraftDB');
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      req.onblocked = () => resolve();
    });
  });
  await page.reload();
  await page.waitForTimeout(1500);

  // Use a small render distance for fast tests
  await page.evaluate(() => {
    const ss = (window as any).__bcSettingsStore;
    if (ss) ss.getState().setSettings({ renderDistance: 2 });
  });
});

test('tutorial card should not intercept pointer/click events', async ({ page }) => {
  // Enter world creation
  await page.locator('.menu-btn.new').click();
  await page.waitForTimeout(500);

  // Click create world button
  await page.locator('.btn-primary').click();
  
  // Wait for loading screen and game canvas
  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible({ timeout: 15000 });

  // Wait a bit for chunks and tutorial card to mount
  await page.waitForTimeout(3000);

  // Ensure tutorial card is visible
  const tutorialCard = page.locator('.tutorial-card');
  await expect(tutorialCard).toBeVisible();

  // Get computed style of pointer-events on the tutorial card
  const pointerEvents = await tutorialCard.evaluate((el) => {
    return window.getComputedStyle(el).pointerEvents;
  });

  console.log('Tutorial card pointer-events:', pointerEvents);

  // The tutorial card should not intercept click/pointer events.
  // This ensures clicks pass through to the canvas to handle pointer lock requests.
  expect(pointerEvents).toBe('none');
});
