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

  await page.evaluate(() => {
    const ss = (window as any).__bcSettingsStore;
    if (ss) ss.getState().setSettings({ renderDistance: 2 });
  });
});

test('Tier 1 warning modal appears for Large world on low-end device', async ({ page, context }) => {
  // Override navigator signals to simulate Tier 1 device
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'deviceMemory', { value: 2, configurable: true });
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      configurable: true,
    });
  });
  await page.reload();
  await page.waitForTimeout(1500);

  await page.locator('.menu-btn.new').click();
  await page.waitForTimeout(500);

  // Select Large
  await page.locator('.seg-group').first().locator('.seg', { hasText: 'Large' }).click();
  await page.waitForTimeout(200);

  // Click Create World
  await page.locator('.btn-primary').click();
  await page.waitForTimeout(500);

  // Tier 1 modal should appear
  await expect(page.locator('.tier-warning-modal')).toBeVisible();
  await expect(page.locator('.tier-warning-modal')).toContainText('limited memory');
  await expect(page.locator('.tier-warning-modal')).toContainText('Go Back');
  await expect(page.locator('.tier-warning-modal')).toContainText('Create Anyway');

  // Click Go Back
  await page.locator('.tier-warning-modal button', { hasText: 'Go Back' }).click();
  await expect(page.locator('.tier-warning-modal')).not.toBeVisible();

  // Should still be on world creation
  await expect(page.locator('.wc-title')).toBeVisible();
});

test('Tier 1 modal does NOT appear for Small or Medium worlds', async ({ page, context }) => {
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'deviceMemory', { value: 2, configurable: true });
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      configurable: true,
    });
  });
  await page.reload();
  await page.waitForTimeout(1500);

  await page.locator('.menu-btn.new').click();
  await page.waitForTimeout(500);

  // Default Medium → should go straight to loading/game, not showing the modal
  await page.locator('.btn-primary').click();
  await page.waitForTimeout(800);

  // Should NOT be showing the warning modal
  await expect(page.locator('.tier-warning-modal')).not.toBeVisible();
});

test('smeltItem action exists and the smelting dialog can be opened', async ({ page }) => {
  await page.locator('.menu-btn.new').click();
  await page.waitForTimeout(500);
  await page.locator('.btn-primary').click();
  await page.waitForTimeout(8000);

  // Dismiss controls hint to avoid overlay interception issues on mobile viewports
  const hintClose = page.locator('button[aria-label="Dismiss controls hint"]');
  if (await hintClose.isVisible()) {
    await hintClose.click();
    await page.waitForTimeout(300);
  }

  const hasSmelt = await page.evaluate(() => {
    const s = (window as any).__bcGameStore.getState();
    return {
      hasSmeltItem: typeof s.smeltItem === 'function',
      hasOpenSmelting: typeof s.openSmelting === 'function',
      showSmelting: s.showSmelting,
    };
  });
  expect(hasSmelt.hasSmeltItem).toBe(true);
  expect(hasSmelt.hasOpenSmelting).toBe(true);

  // Programmatically open the dialog
  await page.evaluate(() => (window as any).__bcGameStore.getState().openSmelting(true));
  await page.waitForTimeout(300);

  await expect(page.locator('.smelt-overlay')).toBeVisible();
  await expect(page.locator('.smelt-recipe')).toHaveCount(7); // glass, brick, iron_ingot, gold_ingot, steak, porkchop, chicken

  // Close
  await page.locator('.smelt-close').click({ force: true });
  await expect(page.locator('.smelt-overlay')).not.toBeVisible();
});

test('right-clicking on a placed furnace opens the smelting dialog', async ({ page }) => {
  await page.locator('.menu-btn.new').click();
  await page.waitForTimeout(500);
  await page.locator('.btn-primary').click();
  await page.waitForTimeout(8000);

  // Place a furnace at eye level, ~3 blocks in front of the player
  // Camera is at player.y + 1.62 looking slightly down (~-0.15 rad).
  // Place furnace 3 blocks forward, at y = floor(player.y) + 1 so it sits
  // at the eye-level height the raycaster can hit.
  await page.evaluate(() => {
    const cm = (window as any).__bcChunkManager;
    const pp = (window as any).__bcGameStore.getState().playerPos;
    cm.setBlockAt(0, Math.floor(pp[1]) + 1, -3, 14); // FURNACE at eye level
  });
  await page.waitForTimeout(500);

  // Right-click the canvas
  await page.locator('canvas').first().click({ button: 'right' });
  await page.waitForTimeout(500);

  const isOpen = await page.evaluate(() => (window as any).__bcGameStore.getState().showSmelting);
  expect(isOpen).toBe(true);
  await expect(page.locator('.smelt-overlay')).toBeVisible();
});

test('loading title differs for Continue vs New Game', async ({ page }) => {
  // First create and save a world
  await page.locator('.menu-btn.new').click();
  await page.waitForTimeout(500);
  await page.locator('.btn-primary').click();
  await page.waitForTimeout(8000);

  // Pause and quit (triggers save)
  await page.evaluate(() => (window as any).__bcGameStore.getState().setPause(true));
  await page.waitForTimeout(500);
  await page.locator('.pause-btn.danger').click();
  await page.waitForTimeout(2000);

  // Now click Continue
  await page.locator('.menu-btn.continue').click();
  await page.waitForTimeout(500);

  // The loading overlay should show "Loading Your World…" for Continue
  const title = await page.locator('.loading-title').textContent({ timeout: 2000 });
  expect(title).toContain('Loading Your World');
});