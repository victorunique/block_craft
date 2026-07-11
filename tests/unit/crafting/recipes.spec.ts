import { describe, it, expect } from 'vitest';
import { RECIPES } from '@/game/crafting/recipes';
import { BlockId } from '@/config/blocks';

describe('Crafting recipes (PRD §11.4)', () => {
  it('wood → 4 planks', () => {
    const r = RECIPES.find((x) => x.id === 'planks')!;
    expect(r.input[0].blockId).toBe(BlockId.WOOD);
    expect(r.output.count).toBe(4);
  });
  it('2 planks → 4 sticks', () => {
    const r = RECIPES.find((x) => x.id === 'sticks')!;
    expect(r.input[0].blockId).toBe(BlockId.PLANKS);
    expect(r.input[0].count).toBe(2);
    expect(r.output.count).toBe(4);
  });
  it('1 coal + 1 stick → 4 torches', () => {
    const r = RECIPES.find((x) => x.id === 'torch')!;
    expect(r.input.find((i) => i.blockId === BlockId.COAL_ITEM)?.count).toBe(1);
    expect(r.input.find((i) => i.blockId === BlockId.STICK)?.count).toBe(1);
    expect(r.output.count).toBe(4);
  });
  it('8 cobblestone → 1 furnace', () => {
    const r = RECIPES.find((x) => x.id === 'furnace')!;
    expect(r.input[0].count).toBe(8);
    expect(r.output.blockId).toBe(BlockId.FURNACE);
  });
  it('all tool recipes exist for wooden/stone/iron tiers', () => {
    expect(RECIPES.find((r) => r.id === 'wooden_pickaxe')).toBeTruthy();
    expect(RECIPES.find((r) => r.id === 'stone_pickaxe')).toBeTruthy();
    expect(RECIPES.find((r) => r.id === 'iron_pickaxe')).toBeTruthy();
    expect(RECIPES.find((r) => r.id === 'wooden_axe')).toBeTruthy();
    expect(RECIPES.find((r) => r.id === 'stone_axe')).toBeTruthy();
    expect(RECIPES.find((r) => r.id === 'iron_axe')).toBeTruthy();
    expect(RECIPES.find((r) => r.id === 'wooden_sword')).toBeTruthy();
    expect(RECIPES.find((r) => r.id === 'stone_sword')).toBeTruthy();
    expect(RECIPES.find((r) => r.id === 'iron_sword')).toBeTruthy();
  });
});