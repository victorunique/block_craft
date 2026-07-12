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

test('Escape key opens the pause menu', async ({ page }) => {
  await page.locator('.menu-btn.new').click();
  await page.waitForTimeout(500);
  await page.locator('.btn-primary').click();
  await page.waitForTimeout(8000);

  // Confirm we're in-game first
  let screen = await page.evaluate(() => (window as any).__bcGameStore.getState().screen);
  expect(screen).toBe('game');

  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  screen = await page.evaluate(() => (window as any).__bcGameStore.getState().screen);
  expect(screen).toBe('paused');
  await expect(page.locator('.pause-card')).toBeVisible();
});

test('E key opens the inventory', async ({ page }) => {
  await page.locator('.menu-btn.new').click();
  await page.waitForTimeout(500);
  await page.locator('.btn-primary').click();
  await page.waitForTimeout(8000);

  // Click canvas to ensure focus
  await page.locator('canvas').first().click();
  await page.waitForTimeout(200);

  await page.keyboard.press('KeyE');
  await page.waitForTimeout(400);

  const showInventory = await page.evaluate(() => (window as any).__bcGameStore.getState().showInventory);
  expect(showInventory).toBe(true);
  await expect(page.locator('.inv-overlay')).toBeVisible();
});

test('oxygen drains when head is in water', async ({ page }) => {
  await page.locator('.menu-btn.new').click();
  await page.waitForTimeout(500);
  await page.locator('.btn-primary').click();
  await page.waitForTimeout(8000);

  // Simulate the player submerged: directly invoke tickOxygen with underwater=true
  const result = await page.evaluate(() => {
    const store = (window as any).__bcGameStore;
    store.getState().setOxygen(100);
    for (let i = 0; i < 5; i++) store.getState().tickOxygen(2, true);
    return store.getState().oxygen;
  });
  // 5 * 2s * 5/s = 50 oxygen lost
  expect(result).toBeLessThan(100);
  expect(result).toBeGreaterThanOrEqual(40);

  // And recovers on the surface
  const recovered = await page.evaluate(() => {
    const store = (window as any).__bcGameStore;
    store.getState().tickOxygen(2, false);
    return store.getState().oxygen;
  });
  expect(recovered).toBeGreaterThan(result);
});

test('Backup World downloads a valid .blockcraft file', async ({ page }) => {
  test.setTimeout(60000);
  await page.locator('.menu-btn.new').click();
  await page.waitForTimeout(500);
  await page.locator('.btn-primary').click();
  await page.waitForTimeout(8000);

  // Pause
  await page.evaluate(() => (window as any).__bcGameStore.getState().setPause(true));
  await page.waitForTimeout(500);

  const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
  await page.locator('.pause-btn.amber').click();
  const download = await downloadPromise;

  // Verify the suggested filename ends with .blockcraft (not .json)
  expect(download.suggestedFilename()).toMatch(/\.blockcraft$/);

  // Verify the button label says .blockcraft
  const label = await page.locator('.pause-btn.amber').textContent();
  expect(label).toContain('.blockcraft');

  // Verify the toast appears
  await page.waitForTimeout(500);
  const toast = await page.locator('.pause-toast').textContent();
  expect(toast).toContain('Backup saved');
});

test('Import Save shows a Play Now! modal with Stay on Menu', async ({ page }) => {
  await page.evaluate(async () => {
    // ensure no leftover worlds from earlier tests
    await new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase('BlockCraftDB');
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      req.onblocked = () => resolve();
    });
  });
  await page.reload();
  await page.waitForTimeout(1500);

  // Build a valid save blob in memory and write to a temp file
  const fs = await import('node:fs');
  const validSave = {
    version: '1.1',
    metadata: {
      worldId: 'e2e-import-1',
      worldName: 'E2E Imported',
      seed: 7,
      size: 256,
      difficulty: 'easy',
      time: 6000,
      dayCount: 1,
      player: { position: [5, 70, -2], rotation: [0, 0], health: 18, hunger: 14, oxygen: 100 },
    },
    inventory: { hotbar: [{ id: 'a', blockId: 5, count: 4 }], storage: Array(27).fill(null), armor: Array(4).fill(null), activeSlot: 0 },
    chunkDeltas: {},
  };
  fs.writeFileSync('/tmp/e2e-import.blockcraft', JSON.stringify(validSave));

  page.once('filechooser', async (chooser) => {
    await chooser.setFiles('/tmp/e2e-import.blockcraft');
  });
  await page.locator('.menu-btn.import').click();
  await page.waitForTimeout(800);

  await expect(page.locator('.import-success-modal')).toBeVisible();
  await expect(page.locator('.import-success-modal')).toContainText('E2E Imported');
  await expect(page.locator('.import-success-modal')).toContainText('Play Now!');
  await expect(page.locator('.import-success-modal')).toContainText('Stay on Menu');

  // Click Stay on Menu
  await page.locator('.import-success-modal button', { hasText: 'Stay on Menu' }).click();
  await expect(page.locator('.import-success-modal')).not.toBeVisible();

  // Continue button should now show the imported world
  await expect(page.locator('.menu-btn.continue')).toContainText('E2E Imported');
});