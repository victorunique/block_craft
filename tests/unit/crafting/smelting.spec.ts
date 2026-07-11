import { describe, it, expect } from 'vitest';
import { smelt, canSmelt, findSmeltingRecipe } from '@/game/crafting/smelting';
import { emptyInventory, createItem } from '@/game/inventory/slots';
import { BlockId } from '@/config/blocks';

describe('Smelting (ZS-002)', () => {
  it('produces 1 glass from 1 sand + 1 coal', () => {
    let g = emptyInventory();
    g.storage[0] = createItem(BlockId.FURNACE, 1);
    g.storage[1] = createItem(BlockId.SAND, 1);
    g.storage[2] = createItem(BlockId.COAL_ITEM, 1);
    const r = smelt(g, 'glass', true);
    expect(r.result.success).toBe(true);
    const glassCount = [r.grid.hotbar, r.grid.storage].flat().filter((it) => it?.blockId === BlockId.GLASS).reduce((a, it) => a + (it?.count ?? 0), 0);
    expect(glassCount).toBe(1);
  });

  it('produces 1 brick from 1 clay + 1 coal', () => {
    let g = emptyInventory();
    g.storage[0] = createItem(BlockId.CLAY, 1);
    g.storage[1] = createItem(BlockId.COAL_ITEM, 1);
    const r = smelt(g, 'brick', true);
    expect(r.result.success).toBe(true);
  });

  it('refuses without fuel', () => {
    let g = emptyInventory();
    g.storage[0] = createItem(BlockId.SAND, 1);
    const r = smelt(g, 'glass', false);
    expect(r.result.success).toBe(false);
  });

  it('preserves inputs when output cannot fit', () => {
    let g = emptyInventory();
    for (let i = 0; i < 9; i++) g.hotbar[i] = createItem(BlockId.GLASS, 64);
    for (let i = 0; i < 27; i++) g.storage[i] = createItem(BlockId.GLASS, 64);
    g.armor[0] = createItem(BlockId.GLASS, 64);
    g.hotbar[0] = createItem(BlockId.SAND, 1);
    g.hotbar[1] = createItem(BlockId.COAL_ITEM, 1);
    const beforeSand = g.hotbar[0].count;
    const beforeCoal = g.hotbar[1].count;
    const r = smelt(g, 'glass', true);
    expect(r.result.success).toBe(false);
    expect(r.grid.hotbar[0]?.count).toBe(beforeSand);
    expect(r.grid.hotbar[1]?.count).toBe(beforeCoal);
  });

  it('canSmelt respects furnace presence', () => {
    let g = emptyInventory();
    g.storage[0] = createItem(BlockId.SAND, 1);
    g.storage[1] = createItem(BlockId.COAL_ITEM, 1);
    expect(canSmelt(g, 'glass', true)).toBe(true);
  });

  it('findSmeltingRecipe returns glass for sand', () => {
    expect(findSmeltingRecipe(BlockId.SAND)?.id).toBe('glass');
    expect(findSmeltingRecipe(BlockId.CLAY)?.id).toBe('brick');
  });
});