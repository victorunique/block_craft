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

test('Chunk meshes have CCW winding order for top and bottom faces', async ({ page }) => {
  await page.locator('.menu-btn.new').click();
  await page.waitForTimeout(500);
  await page.locator('.btn-primary').click();
  await page.waitForTimeout(8000); // Wait for chunks to load

  const checkWinding = await page.evaluate(() => {
    const cm = (window as any).__bcChunkManager;
    if (!cm) return { success: false, error: 'No chunk manager' };
    const chunks = Array.from(cm.entries()) as any[];
    const compiled = chunks.filter((c) => c.mesh && c.mesh.indices.length > 0);
    if (compiled.length === 0) return { success: false, error: 'No compiled chunks' };

    for (const chunk of compiled) {
      const m = chunk.mesh;
      for (let i = 0; i < m.indices.length; i += 3) {
        const i0 = m.indices[i];
        const i1 = m.indices[i + 1];
        const i2 = m.indices[i + 2];

        const v0 = [m.positions[i0 * 3], m.positions[i0 * 3 + 1], m.positions[i0 * 3 + 2]];
        const v1 = [m.positions[i1 * 3], m.positions[i1 * 3 + 1], m.positions[i1 * 3 + 2]];
        const v2 = [m.positions[i2 * 3], m.positions[i2 * 3 + 1], m.positions[i2 * 3 + 2]];

        const u = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]];
        const v = [v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]];

        const cross = [
          u[1] * v[2] - u[2] * v[1],
          u[2] * v[0] - u[0] * v[2],
          u[0] * v[1] - u[1] * v[0],
        ];

        const normal = [m.normals[i0 * 3], m.normals[i0 * 3 + 1], m.normals[i0 * 3 + 2]];
        const dot = cross[0] * normal[0] + cross[1] * normal[1] + cross[2] * normal[2];

        // The dot product must be strictly positive (representing CCW order relative to normal)
        if (dot <= 0) {
          return { success: false, error: `Triangle winding CW on face normal: ${normal.join(',')}, dot: ${dot}` };
        }
      }
    }
    return { success: true };
  });

  expect(checkWinding.success).toBe(true);
});

test('Physics engine prevents player from falling or clipping into unloaded chunks', async ({ page }) => {
  await page.locator('.menu-btn.new').click();
  await page.waitForTimeout(500);
  await page.locator('.btn-primary').click();
  await page.waitForTimeout(8000);

  const result = await page.evaluate(() => {
    const cm = (window as any).__bcChunkManager;
    // Query a coordinate far away where chunk is not loaded
    const farX = 80;
    const farY = 64;
    const farZ = 80;
    
    // Unloaded chunk should return BEDROCK (1) when treatUnloadedAsSolid = true
    const blockVal = cm.getBlockAt(farX, farY, farZ, true);
    
    return {
      blockVal,
    };
  });

  expect(result.blockVal).toBe(1); // BlockId.BEDROCK
});
