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

  // Use small render distance for fast loading in E2E tests
  await page.evaluate(() => {
    const ss = (window as any).__bcSettingsStore;
    if (ss) ss.getState().setSettings({ renderDistance: 2 });
  });
});

test('held tool (arm/weapon) is added to the scene graph and tracks camera position', async ({ page }) => {
  // Enter world creation
  await page.locator('.menu-btn.new').click();
  await expect(page.locator('.wc-title')).toBeVisible();

  // Create a Small world on Easy difficulty
  await page.locator('.seg-group').first().locator('.seg', { hasText: 'Small' }).click();
  await page.locator('.btn-primary').click();

  // Wait for loading screen and canvas
  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible({ timeout: 15000 });

  // Wait for chunks to load/compile
  await page.waitForTimeout(6000);

  const checkHeldTool = await page.evaluate(() => {
    console.log('E2E DEBUG: window __bc keys:', Object.keys(window).filter(k => k.startsWith('__bc')));
    const camera = (window as any).__bcCamera;
    const scene = (window as any).__bcScene;
    if (!camera) {
      return { success: false, reason: 'Camera not found on window' };
    }
    if (!scene) {
      return { success: false, reason: 'Scene not found on window' };
    }

    console.log('E2E DEBUG: Scene children:', scene.children.map((c: any) => ({
      type: c.type,
      uuid: c.uuid,
      childrenCount: c.children?.length
    })));

    // Find the group which is positioned exactly at the camera's position (or very close)
    let foundGroup = false;
    let distanceToCamera = -1;

    for (const child of scene.children) {
      if (child.type === 'Group' && child.children && child.children.length > 0) {
        // Our tool group copies the camera position on every frame, so it should be exactly at the camera's position before translating
        // Let's compute distance between the child's position (which was copied from camera) and camera position
        // Note: the position is copied and then translated locally. However, Three.js's translateX/Y/Z directly changes position.
        // The local offset translated position is:
        // x offset is 0.25 (right hand)
        // y offset is -0.25
        // z offset is -0.45
        // So the distance in 3D space is sqrt(0.25^2 + (-0.25)^2 + (-0.45)^2) = sqrt(0.0625 + 0.0625 + 0.2025) = sqrt(0.3275) ≈ 0.57 units.
        // Therefore, the distance should be very close to 0.57!
        const dx = child.position.x - camera.position.x;
        const dy = child.position.y - camera.position.y;
        const dz = child.position.z - camera.position.z;
        const dist = Math.hypot(dx, dy, dz);
        
        console.log('E2E DEBUG: Found group with child count', child.children.length, 'at distance', dist);

        if (dist > 0.4 && dist < 0.8) {
          foundGroup = true;
          distanceToCamera = dist;
          break;
        }
      }
    }

    return {
      success: true,
      foundGroup,
      distanceToCamera,
    };
  });

  if (!checkHeldTool.success) {
    console.log('E2E FAILURE REASON:', (checkHeldTool as any).reason);
  }

  expect(checkHeldTool.success).toBe(true);
  expect(checkHeldTool.foundGroup).toBe(true); // Should find the tool group tracking the camera!
  expect(checkHeldTool.distanceToCamera).toBeGreaterThan(0.4);
  expect(checkHeldTool.distanceToCamera).toBeLessThan(0.8);
});
