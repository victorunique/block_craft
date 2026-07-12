import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log('PAGE ERROR:', msg.text());
  });
  page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message));

  await page.goto('/');

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

  await page.evaluate(() => {
    const ss = (window as any).__bcSettingsStore;
    if (ss) ss.getState().setSettings({ renderDistance: 2 });
  });
});

test('GameOver renders when health reaches 0', async ({ page }) => {
  await page.locator('.menu-btn.new').click();
  await page.waitForTimeout(500);
  await page.locator('.btn-primary').click();
  await page.waitForTimeout(8000);

  let screen = await page.evaluate(() => (window as any).__bcGameStore.getState().screen);
  expect(screen).toBe('game');

  await page.evaluate(() => (window as any).__bcGameStore.getState().damagePlayer(999));
  await page.waitForTimeout(500);

  const state = await page.evaluate(() => (window as any).__bcGameStore.getState());
  expect(state.health).toBeLessThanOrEqual(1);
  expect(state.showGameOver).toBe(true);

  await expect(page.locator('.game-over')).toBeVisible();
  await expect(page.locator('.game-over-card h1')).toContainText('You died');
  await expect(page.locator('.game-over .go-btn.primary')).toContainText('Respawn');
  await expect(page.locator('.game-over .go-btn:not(.primary)')).toContainText('Quit to Title Menu');

  // Pause menu should NOT be shown on top of game over
  const pauseCardVisible = await page.evaluate(() => {
    const el = document.querySelector('.pause-card');
    if (!el) return false;
    return el.offsetParent !== null;
  });
  expect(pauseCardVisible).toBe(false);
});

test('Respawn from GameOver returns to game screen', async ({ page }) => {
  await page.locator('.menu-btn.new').click();
  await page.waitForTimeout(500);
  await page.locator('.btn-primary').click();
  await page.waitForTimeout(8000);

  await page.evaluate(() => (window as any).__bcGameStore.getState().damagePlayer(999));
  await page.waitForTimeout(400);

  await expect(page.locator('.game-over')).toBeVisible();
  await page.locator('.game-over .go-btn.primary').click({ force: true });
  await page.waitForTimeout(500);

  const state = await page.evaluate(() => (window as any).__bcGameStore.getState());
  expect(state.health).toBeGreaterThan(0);
  expect(state.showGameOver).toBe(false);
  expect(state.screen).toBe('game');
});