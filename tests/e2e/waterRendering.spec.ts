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

test('Water meshes are double-sided and all dynamic geometries compute bounding spheres', async ({ page }) => {
  await page.locator('.menu-btn.new').click();
  await page.waitForTimeout(500);
  await page.locator('.btn-primary').click();
  await page.waitForTimeout(8000); // Wait for chunks to load

  const renderingSpecs = await page.evaluate(() => {
    const scene = (window as any).__bcScene;
    if (!scene) return { error: 'No scene found' };

    let waterMeshesCount = 0;
    let waterMeshesWithDoubleSide = 0;
    let waterGeometriesWithBoundingSphere = 0;
    let crossMeshesCount = 0;
    let crossGeometriesWithBoundingSphere = 0;

    scene.traverse((child: any) => {
      if (child.isMesh && child.material) {
        const mat = child.material;
        const mats = Array.isArray(mat) ? mat : [mat];
        for (const m of mats) {
          // Check if it's the water mesh
          if (m.transparent === true && m.opacity === 0.7 && m.depthWrite === false) {
            waterMeshesCount++;
            if (m.side === 2) { // THREE.DoubleSide is 2
              waterMeshesWithDoubleSide++;
            }
            if (child.geometry && child.geometry.boundingSphere !== null) {
              const cachedSphere = child.geometry.boundingSphere.clone();
              // Force recalculation
              child.geometry.computeBoundingSphere();
              const freshSphere = child.geometry.boundingSphere;
              const dist = cachedSphere.center.distanceTo(freshSphere.center);
              const radiusDiff = Math.abs(cachedSphere.radius - freshSphere.radius);
              // If the cached sphere matches the fresh sphere, then computeBoundingSphere was called on update
              if (dist < 0.001 && radiusDiff < 0.001) {
                waterGeometriesWithBoundingSphere++;
              }
            }
          }
          // Check if it's the cross mesh (plant/torch)
          if (m.transparent === true && m.opacity !== 0.7 && m.depthWrite === false && m.side === 2) {
            crossMeshesCount++;
            if (child.geometry && child.geometry.boundingSphere !== null) {
              const cachedSphere = child.geometry.boundingSphere.clone();
              // Force recalculation
              child.geometry.computeBoundingSphere();
              const freshSphere = child.geometry.boundingSphere;
              const dist = cachedSphere.center.distanceTo(freshSphere.center);
              const radiusDiff = Math.abs(cachedSphere.radius - freshSphere.radius);
              if (dist < 0.001 && radiusDiff < 0.001) {
                crossGeometriesWithBoundingSphere++;
              }
            }
          }
        }
      }
    });

    return {
      waterMeshesCount,
      waterMeshesWithDoubleSide,
      waterGeometriesWithBoundingSphere,
      crossMeshesCount,
      crossGeometriesWithBoundingSphere
    };
  });

  console.log('Rendering specs output:', renderingSpecs);

  // We expect that we found water meshes
  expect(renderingSpecs.waterMeshesCount).toBeGreaterThan(0);
  // We expect every water mesh material to be DoubleSide
  expect(renderingSpecs.waterMeshesWithDoubleSide).toBe(renderingSpecs.waterMeshesCount);
  // We expect every water mesh geometry to have its boundingSphere calculated (not null and up-to-date)
  expect(renderingSpecs.waterGeometriesWithBoundingSphere).toBe(renderingSpecs.waterMeshesCount);

  // We also expect that if we have cross meshes (plants/flowers), their geometries also have boundingSphere calculated
  if (renderingSpecs.crossMeshesCount > 0) {
    expect(renderingSpecs.crossGeometriesWithBoundingSphere).toBe(renderingSpecs.crossMeshesCount);
  }
});
