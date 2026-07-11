import { describe, it, expect } from 'vitest';
import { dragDrop, mergeStacks } from '@/game/inventory/dragDrop';
import { emptyInventory, createItem } from '@/game/inventory/slots';
import { BlockId } from '@/config/blocks';

describe('dragDrop', () => {
  it('swaps items between two slots', () => {
    let g = emptyInventory();
    g.hotbar[0] = createItem(BlockId.STONE, 1);
    g.storage[0] = createItem(BlockId.DIRT, 1);
    const r = dragDrop(g, { kind: 'hotbar', index: 0 }, 'storage', 0, null);
    expect(r.grid.hotbar[0]?.blockId).toBe(BlockId.DIRT);
    expect(r.grid.storage[0]?.blockId).toBe(BlockId.STONE);
  });

  it('merges stackable items into target', () => {
    let g = emptyInventory();
    g.hotbar[0] = createItem(BlockId.STONE, 60);
    g.storage[0] = createItem(BlockId.STONE, 4);
    const r = dragDrop(g, { kind: 'hotbar', index: 0 }, 'storage', 0, null);
    expect(r.grid.storage[0]?.count).toBe(64);
    expect(r.grid.hotbar[0]).toBeNull();
  });

  it('swaps different items (FT-IC-001)', () => {
    let g = emptyInventory();
    g.hotbar[0] = createItem(BlockId.STONE, 5);
    g.storage[0] = createItem(BlockId.DIRT, 5);
    const r = dragDrop(g, { kind: 'hotbar', index: 0 }, 'storage', 0, null);
    expect(r.grid.hotbar[0]?.blockId).toBe(BlockId.DIRT);
    expect(r.grid.storage[0]?.blockId).toBe(BlockId.STONE);
  });

  it('drops cursor item into empty slot', () => {
    let g = emptyInventory();
    const cursor = createItem(BlockId.WOOD, 3);
    const r = dragDrop(g, { cursor: true }, 'hotbar', 4, cursor);
    expect(r.grid.hotbar[4]?.count).toBe(3);
    expect(r.cursor).toBeNull();
  });

  it('does not swap a slot with itself', () => {
    let g = emptyInventory();
    g.hotbar[2] = createItem(BlockId.COAL_ITEM, 5);
    const r = dragDrop(g, { kind: 'hotbar', index: 2 }, 'hotbar', 2, null);
    expect(r.grid.hotbar[2]?.blockId).toBe(BlockId.COAL_ITEM);
    expect(r.grid.hotbar[2]?.count).toBe(5);
  });
});

describe('mergeStacks', () => {
  it('fills to maxStack and reports remainder', () => {
    const target = createItem(BlockId.STONE, 50);
    const source = createItem(BlockId.STONE, 30);
    const r = mergeStacks(target, source);
    expect(r.result?.count).toBe(64);
    expect(r.remaining?.count).toBe(16);
  });
  it('keeps full remainder when target full', () => {
    const target = createItem(BlockId.STONE, 64);
    const source = createItem(BlockId.STONE, 10);
    const r = mergeStacks(target, source);
    expect(r.result?.count).toBe(64);
    expect(r.remaining?.count).toBe(10);
  });
});