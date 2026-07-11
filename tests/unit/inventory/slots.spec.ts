import { describe, it, expect } from 'vitest';
import { addToGrid, countItem, removeFromGrid, splitHalf, swapGridSlots, emptyInventory } from '@/game/inventory/slots';
import { BlockId } from '@/config/blocks';

describe('Inventory slots', () => {
  it('addToGrid stacks up to maxStack', () => {
    let g = emptyInventory();
    g = addToGrid(g, BlockId.STONE, 150, 64);
    expect(countItem(g, BlockId.STONE)).toBe(150);
    const stoneSlots = g.hotbar.concat(g.storage).filter((it) => it?.blockId === BlockId.STONE);
    expect(stoneSlots.length).toBeGreaterThanOrEqual(3);
  });

  it('removeFromGrid clears slot at 0', () => {
    let g = emptyInventory();
    g = addToGrid(g, BlockId.DIRT, 10, 64);
    g = removeFromGrid(g, 'hotbar', 0, 10);
    expect(g.hotbar[0]).toBeNull();
  });

  it('splitHalf divides by 2', () => {
    let g = emptyInventory();
    g = addToGrid(g, BlockId.STONE, 64, 64);
    const r = splitHalf(g, 'hotbar', 0);
    expect(r.cursor).not.toBeNull();
    expect(r.cursor?.count).toBe(32);
    expect(r.grid.hotbar[0]?.count).toBe(32);
  });

  it('swapGridSlots swaps between kinds', () => {
    let g = emptyInventory();
    g = addToGrid(g, BlockId.STONE, 1, 64);
    g.hotbar[0] = { id: 'a', blockId: BlockId.STONE, count: 1 };
    g.storage[0] = { id: 'b', blockId: BlockId.DIRT, count: 5 };
    const next = swapGridSlots(g, 'hotbar', 0, 'storage', 0);
    expect(next.hotbar[0]?.blockId).toBe(BlockId.DIRT);
    expect(next.storage[0]?.blockId).toBe(BlockId.STONE);
  });
});