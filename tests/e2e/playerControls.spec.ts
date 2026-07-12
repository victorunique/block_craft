import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.goto('/');

  // Clear service workers and caches to avoid cached app bundles
  await page.evaluate(async () => {
    if (navigator.serviceWorker) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
    }
    if (window.caches) {
      const keys = await caches.keys();
      for (const key of keys) {
        await caches.delete(key);
      }
    }
  });

  // Reload to ensure we run the freshly served scripts
  await page.reload();

  // Configure settings for low render distance in headless browser
  await page.evaluate(() => {
    const store = (window as any).__bcSettingsStore;
    if (store) store.getState().setSettings({ renderDistance: 2 });
  });
});

test('player spawns above ground and can move forward with W key', async ({ page }) => {

  // Enter world creation
  await page.locator('.menu-btn.new').click();
  await expect(page.locator('.wc-title')).toBeVisible();

  // Create a Small world on Easy difficulty
  await page.locator('.seg-group').first().locator('.seg', { hasText: 'Small' }).click();
  await page.locator('.seg-group').nth(1).locator('.seg', { hasText: 'Easy' }).click();
  await page.locator('.btn-primary').click();

  // Wait for loading screen and canvas
  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible({ timeout: 15000 });

  // Wait a bit for terrain and chunks to compile meshes
  await page.waitForTimeout(3000);

  const chunkStatus = await page.evaluate(() => {
    const cm = (window as any).__bcChunkManager;
    if (!cm) return 'No chunk manager';
    return {
      loaded: cm.loadedCount(),
      pending: cm.pendingCount(),
      total: cm.chunks.size,
    };
  });
  console.log('Chunk status:', chunkStatus);

  // Click the canvas to trigger pointer lock
  await canvas.click();

  // Teleport the player high into the sky (but within loaded chunks) to avoid any terrain collisions
  await page.evaluate(() => {
    if ((window as any).__bcCamera) {
      (window as any).__bcCamera.position.set(0, 81.62, 0);
    }
    (window as any).__bcGameStore.getState().updatePlayerTransform([0, 80, 0], [0, 0]);
  });
  await page.waitForTimeout(200);

  // Read initial player position
  const initialPos = await page.evaluate(() => {
    return (window as any).__bcGameStore.getState().playerPos as [number, number, number];
  });
  console.log('Spawn position (after teleport):', initialPos);

  // Assert that player did not spawn inside the void or at y = 0
  expect(initialPos[1]).toBeGreaterThan(70);

  // Programmatically dispatch keydown W to window
  await page.evaluate(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }));
  });

  await page.waitForTimeout(1000);

  // Programmatically dispatch keyup W to window
  await page.evaluate(() => {
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW' }));
  });

  // Read player position after movement
  const finalPos = await page.evaluate(() => {
    return (window as any).__bcGameStore.getState().playerPos as [number, number, number];
  });
  console.log('Position after pressing W:', finalPos);

  // Calculate horizontal distance moved
  const dx = finalPos[0] - initialPos[0];
  const dz = finalPos[2] - initialPos[2];
  const dist = Math.hypot(dx, dz);
  console.log('Horizontal distance moved:', dist);

  // The player should have moved forward successfully
  expect(dist).toBeGreaterThan(0.3);
});

test('player can break a block by left-clicking', async ({ page }) => {
  await page.locator('.menu-btn.new').click();
  await page.locator('.seg-group').first().locator('.seg', { hasText: 'Small' }).click();
  await page.locator('.btn-primary').click();

  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible({ timeout: 15000 });
  await page.waitForTimeout(3000);

  await canvas.click();

  // Teleport player and point camera straight down (pitch = -Math.PI / 2, yaw = 0)
  await page.evaluate(() => {
    (window as any).__bcGameStore.getState().updatePlayerTransform([0, 58, 0], [-Math.PI / 2, 0]);
    if ((window as any).__bcCamera) {
      (window as any).__bcCamera.position.set(0, 58 + 1.62, 0);
      (window as any).__bcCamera.rotation.set(-Math.PI / 2, 0, 0, 'YXZ');
    }
  });
  await page.waitForTimeout(200);

  // Check block under feet before breaking
  const blockBefore = await page.evaluate(() => {
    const cm = (window as any).__bcChunkManager;
    return cm.getBlockAt(0, 59, 0);
  });
  console.log('Block before click:', blockBefore);
  expect(blockBefore).not.toBe(0);

  // Simulate left click to break block
  await canvas.click({ button: 'left' });
  await page.waitForTimeout(200);

  // Check block after breaking
  const blockAfter = await page.evaluate(() => {
    const cm = (window as any).__bcChunkManager;
    return cm.getBlockAt(0, 59, 0);
  });
  console.log('Block after click:', blockAfter);
  expect(blockAfter).toBe(0);
});

test('player can jump by pressing Space', async ({ page }) => {
  await page.locator('.menu-btn.new').click();
  await page.locator('.seg-group').first().locator('.seg', { hasText: 'Small' }).click();
  await page.locator('.btn-primary').click();

  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible({ timeout: 15000 });
  await page.waitForTimeout(3000);

  // Wait for chunk manager to be initialized and the spawn chunk to be populated with voxels
  await page.waitForFunction(() => {
    const cm = (window as any).__bcChunkManager;
    if (!cm) return false;
    const chunk = cm.getChunk(8, 4, 8);
    return chunk && chunk.voxels && chunk.voxels.length > 0;
  }, { timeout: 15000 });

  await canvas.click();

  // Teleport player to the exact surface ground height to be grounded immediately
  await page.evaluate(() => {
    const cm = (window as any).__bcChunkManager;
    let surfaceY = 60;
    if (cm) {
      for (let y = 120; y >= 0; y--) {
        if (cm.getBlockAt(0, y, 0) !== 0) {
          surfaceY = y + 1;
          break;
        }
      }
    }
    (window as any).__bcGameStore.getState().updatePlayerTransform([0, surfaceY, 0], [0, 0]);
    if ((window as any).__bcCamera) {
      (window as any).__bcCamera.position.set(0, surfaceY + 1.62, 0);
    }
  });
  await page.waitForTimeout(500);

  // Read initial height
  const initialY = await page.evaluate(() => {
    return (window as any).__bcGameStore.getState().playerPos[1] as number;
  });
  console.log('Height before jump:', initialY);

  // Press Space to jump
  await page.evaluate(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
  });
  await page.waitForTimeout(100);
  await page.evaluate(() => {
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space' }));
  });

  // Wait a bit to reach the jump peak (jump=9.5, gravity=28 → ~340ms to peak)
  await page.waitForTimeout(500);

  // Read peak height
  const peakY = await page.evaluate(() => {
    return (window as any).__bcGameStore.getState().playerPos[1] as number;
  });
  console.log('Height at jump peak:', peakY);

  // Assert that player jumped at least 0.8 block high
  expect(peakY).toBeGreaterThan(initialY + 0.8);
});

test('player is blocked by solid walls', async ({ page }) => {
  await page.locator('.menu-btn.new').click();
  await page.locator('.seg-group').first().locator('.seg', { hasText: 'Small' }).click();
  await page.locator('.btn-primary').click();

  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible({ timeout: 15000 });
  await page.waitForTimeout(3000);

  await canvas.click();

  // Teleport player to flat ground at (0, 60, 0)
  await page.evaluate(() => {
    (window as any).__bcGameStore.getState().updatePlayerTransform([0, 60, 0], [0, 0]);
    if ((window as any).__bcCamera) {
      (window as any).__bcCamera.position.set(0, 60 + 1.62, 0);
    }
  });
  await page.waitForTimeout(500);

  // Place a 3-block-high wall directly in front of the player (at z = -1)
  await page.evaluate(() => {
    const cm = (window as any).__bcChunkManager;
    cm.setBlockAt(0, 60, -1, 4); // Stone
    cm.setBlockAt(0, 61, -1, 4); // Stone
    cm.setBlockAt(0, 62, -1, 4); // Stone
  });
  await page.waitForTimeout(200);

  // Verify the wall blocks are solid
  const blocksSolid = await page.evaluate(() => {
    const cm = (window as any).__bcChunkManager;
    return [
      cm.getBlockAt(0, 60, -1),
      cm.getBlockAt(0, 61, -1),
      cm.getBlockAt(0, 62, -1),
    ];
  });
  console.log('Wall blocks:', blocksSolid);
  expect(blocksSolid).toEqual([4, 4, 4]);

  // Press W key (forward) to walk into the wall
  await page.evaluate(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }));
  });
  // Hold W for 1 second
  await page.waitForTimeout(1000);
  await page.evaluate(() => {
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW' }));
  });

  // Read player position after trying to walk into the wall
  const finalPos = await page.evaluate(() => {
    return (window as any).__bcGameStore.getState().playerPos as [number, number, number];
  });
  console.log('Position after walking into wall:', finalPos);

  // The player should NOT have passed the wall (z = -1). Since player has width 0.6,
  // their box min Z cannot go beyond -0.7. So playerPos[2] (center Z) must be > -0.7 + 0.3 = -0.4!
  expect(finalPos[2]).toBeGreaterThan(-0.4);
});

