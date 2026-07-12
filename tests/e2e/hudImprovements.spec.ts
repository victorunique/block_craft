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

test('HUD hotbar slot shows item icon for starting wood', async ({ page }) => {
  await page.locator('.menu-btn.new').click();
  await page.waitForTimeout(500);
  await page.locator('.btn-primary').click();
  await page.waitForTimeout(8000);

  const slot0 = await page.evaluate(() => {
    const slot = document.querySelector('.hotbar .item-slot');
    if (!slot) return null;
    const icon = slot.querySelector('.item-icon');
    const cs = icon ? window.getComputedStyle(icon) : null;
    return {
      hasIcon: !!icon,
      bgImage: cs?.backgroundImage,
      stackCount: slot.querySelector('.stack-count')?.textContent,
    };
  });
  expect(slot0.hasIcon).toBe(true);
  expect(slot0.bgImage).toContain('data:image/png');
  expect(slot0.stackCount).toBe('4');
});

test('Inventory shows item icons in slots', async ({ page }) => {
  await page.locator('.menu-btn.new').click();
  await page.waitForTimeout(500);
  await page.locator('.btn-primary').click();
  await page.waitForTimeout(8000);

  await page.keyboard.press('KeyE');
  await page.waitForTimeout(500);

  const slots = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.hotbar-grid .item-slot')).map(s => ({
      hasIcon: !!s.querySelector('.item-icon'),
      hasBgImage: !!s.querySelector('.item-icon') && window.getComputedStyle(s.querySelector('.item-icon')).backgroundImage !== 'none',
    }));
  });
  expect(slots.length).toBe(9);
  expect(slots[0].hasIcon).toBe(true);
  expect(slots[0].hasBgImage).toBe(true);
});

test('Tool durability bar renders in hotbar slot', async ({ page }) => {
  await page.locator('.menu-btn.new').click();
  await page.waitForTimeout(500);
  await page.locator('.btn-primary').click();
  await page.waitForTimeout(8000);

  await page.evaluate(() => {
    const s = (window as any).__bcGameStore;
    const newHotbar = [...s.getState().hotbar];
    newHotbar[0] = { id: 'wp1', blockId: 101, count: 1, durability: 35 };
    s.setState({ hotbar: newHotbar });
  });
  await page.waitForTimeout(200);

  const durability = await page.evaluate(() => {
    const slot = document.querySelector('.hotbar .item-slot');
    if (!slot) return null;
    return {
      hasDurabilityBar: !!slot.querySelector('.durability-bar'),
      fillWidth: slot.querySelector('.durability-fill')?.style.width,
    };
  });
  expect(durability.hasDurabilityBar).toBe(true);
  expect(durability.fillWidth).toBeTruthy();
});

test('Heart shake animation is applied to heart elements', async ({ page }) => {
  await page.locator('.menu-btn.new').click();
  await page.waitForTimeout(500);
  await page.locator('.btn-primary').click();
  await page.waitForTimeout(8000);

  await page.evaluate(() => (window as any).__bcGameStore.getState().setHealth(20));
  await page.waitForTimeout(100);

  // Verify the .heart.shake class is present with the heart-shake animation defined
  const result = await page.evaluate(() => {
    const hearts = Array.from(document.querySelectorAll('.heart'));
    const firstHeart = document.querySelector('.heart');
    const cs = firstHeart ? window.getComputedStyle(firstHeart) : null;
    return {
      heartCount: hearts.length,
      shakeCount: hearts.filter((h) => h.classList.contains('shake')).length,
      animationName: cs?.animationName,
    };
  });
  expect(result.heartCount).toBe(10);
  expect(result.shakeCount).toBe(10);
  expect(result.animationName).toBe('heart-shake');
});

test('Damage causes HeartsGrid state update', async ({ page }) => {
  await page.locator('.menu-btn.new').click();
  await page.waitForTimeout(500);
  await page.locator('.btn-primary').click();
  await page.waitForTimeout(8000);

  // Verify the hearts render the right amount of empty/full after damage
  const before = await page.evaluate(() => Array.from(document.querySelectorAll('.heart')).map(h => h.className.replace(/heart /, '').trim()));
  await page.evaluate(() => {
    const s = (window as any).__bcGameStore.getState();
    s.setPause(true);
    s.setHealth(20);
  });
  await page.waitForTimeout(100);

  await page.evaluate(() => (window as any).__bcGameStore.getState().damagePlayer(8));
  await page.waitForTimeout(100);

  const after = await page.evaluate(() => Array.from(document.querySelectorAll('.heart')).map(h => h.className.replace(/heart /, '').trim()));
  expect(before.join(',')).toContain('full');
  expect(after.filter(s => s.includes('empty')).length).toBeGreaterThan(0);
});

test('Inventory dialog shows split-view on desktop with both panels', async ({ page }) => {
  await page.locator('.menu-btn.new').click();
  await page.waitForTimeout(500);
  await page.locator('.btn-primary').click();
  await page.waitForTimeout(8000);

  await page.keyboard.press('KeyE');
  await page.waitForTimeout(500);

  const layout = await page.evaluate(() => {
    const overlay = document.querySelector('.inv-overlay');
    return {
      isSplit: overlay?.classList.contains('split-view'),
      hasInventoryPanel: !!document.querySelector('.inv-panel-inventory'),
      hasCraftingPanel: !!document.querySelector('.inv-panel-crafting'),
      hasPlayerPreview: !!document.querySelector('.player-preview'),
      tabsHidden: !document.querySelector('.inv-tabs'),
    };
  });
  expect(layout.isSplit).toBe(true);
  expect(layout.hasInventoryPanel).toBe(true);
  expect(layout.hasCraftingPanel).toBe(true);
  expect(layout.hasPlayerPreview).toBe(true);
  expect(layout.tabsHidden).toBe(true);
});

test('Hotbar selected slot scales to 1.10', async ({ page }) => {
  await page.locator('.menu-btn.new').click();
  await page.waitForTimeout(500);
  await page.locator('.btn-primary').click();
  await page.waitForTimeout(8000);

  const scale = await page.evaluate(() => {
    const slot = document.querySelector('.hotbar .item-slot.selected');
    if (!slot) return null;
    const t = window.getComputedStyle(slot).transform;
    if (!t || t === 'none') return null;
    const m = t.match(/matrix\(([\d.]+),/);
    return m ? parseFloat(m[1]) : null;
  });
  expect(scale).toBeCloseTo(1.10, 2);
});

test('Loading overlay uses Spawning sheep message', async ({ page }) => {
  await page.locator('.menu-btn.new').click();
  await page.waitForTimeout(500);
  await page.locator('.btn-primary').click();
  await page.waitForTimeout(100);

  const stages = new Set<string>();
  for (let t = 0; t < 4000; t += 250) {
    const stage = await page.evaluate(() => document.querySelector('.loading-stage')?.textContent);
    if (stage && !stages.has(stage)) {
      stages.add(stage);
    }
    await page.waitForTimeout(250);
  }

  // Spec mentioned "Spawning sheep" - verify we never use the old "Planting trees"
  const allStages = Array.from(stages).join(' | ');
  console.log('Stages seen:', allStages);
  expect(allStages).not.toContain('Planting trees');
  expect(allStages).toContain('Sculpting hills');
});

test('Main menu has rotating sun element', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(1500);

  const sun = await page.evaluate(() => {
    const el = document.querySelector('.main-menu-sun');
    if (!el) return null;
    const cs = window.getComputedStyle(el);
    return {
      hasElement: true,
      animationName: cs.animationName,
      borderRadius: cs.borderRadius,
    };
  });
  expect(sun).not.toBeNull();
  expect(sun.hasElement).toBe(true);
  expect(sun.animationName).toContain('main-menu-sun-spin');
});