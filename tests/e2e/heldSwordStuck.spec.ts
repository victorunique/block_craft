import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  page.on('console', (msg) => {
    console.log('PAGE LOG:', msg.text());
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

test('selecting wooden sword should not cause camera lock or errors', async ({ page }) => {
  // Enter world creation
  await page.locator('.menu-btn.new').click();
  await page.waitForTimeout(500);

  // Click create world button
  await page.locator('.btn-primary').click();
  
  // Wait for loading screen and game canvas
  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible({ timeout: 15000 });

  // Wait a bit for chunks to load
  await page.waitForTimeout(3000);

  // Programmatically add wooden sword to hotbar slot 4 (index 3) and select it
  await page.evaluate(() => {
    const store = (window as any).__bcGameStore;
    if (store) {
      const s = store.getState();
      const newHotbar = [...s.hotbar];
      // 107 is BlockId.WOODEN_SWORD
      newHotbar[3] = { id: 'sword-test', blockId: 107, count: 1, durability: 60 };
      store.setState({ hotbar: newHotbar, activeSlot: 3 });
    }
  });

  await page.waitForTimeout(500);

  // Click canvas to ensure it is focused / locked
  await canvas.click();
  await page.waitForTimeout(500);

  // Stub pointerLockElement to mock active pointer lock in headless test environment
  await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    Object.defineProperty(document, 'pointerLockElement', {
      get() { return canvas; },
      configurable: true
    });
  });

  // Read initial camera rotation (yaw)
  const initialYaw = await page.evaluate(() => {
    const camera = (window as any).__bcCamera;
    return camera ? camera.rotation.y : null;
  });
  console.log('Initial yaw:', initialYaw);

  // Simulate mouse movement (look around)
  await page.evaluate(() => {
    window.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, cancelable: true, movementX: 50, movementY: 0 }));
  });

  await page.waitForTimeout(500);

  // Read yaw after first rotation
  const intermediateYaw = await page.evaluate(() => {
    const camera = (window as any).__bcCamera;
    return camera ? camera.rotation.y : null;
  });
  console.log('Intermediate yaw:', intermediateYaw);
  expect(intermediateYaw).not.toBeNull();
  expect(intermediateYaw).not.toEqual(initialYaw);

  // Simulate multiple clicks (left and right clicks) to trigger onMouseDown & tryLock
  await page.evaluate(() => {
    window.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 }));
    window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, button: 0 }));
    window.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    window.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 2 }));
    window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, button: 2 }));
  });

  await page.waitForTimeout(500);

  // Simulate another mouse movement to verify camera still rotates after clicking
  await page.evaluate(() => {
    window.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, cancelable: true, movementX: 50, movementY: 0 }));
  });

  await page.waitForTimeout(500);

  // Read final camera rotation (yaw)
  const finalYaw = await page.evaluate(() => {
    const camera = (window as any).__bcCamera;
    return camera ? camera.rotation.y : null;
  });
  console.log('Final yaw:', finalYaw);

  // Verify camera rotated again after clicks and did not lock up
  expect(finalYaw).not.toBeNull();
  expect(finalYaw).not.toEqual(intermediateYaw);
});
