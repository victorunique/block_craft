import { describe, it, expect } from 'vitest';
import { BlockId, isSolid, isAir, isTransparent, isLiquid, isBlockStackable, getMaxStack, BLOCK_STACK_MAX, blockEmitsLight } from '@/config/blocks';

describe('Block Registry', () => {
  it('exposes documented Block IDs', () => {
    expect(BlockId.CLAY).toBe(12);
    expect(BlockId.COAL_ORE).toBe(13);
    expect(BlockId.FURNACE).toBe(14);
  });

  it('derives sensible adjacent IDs', () => {
    expect(BlockId.AIR).toBe(0);
    expect(BlockId.STONE).toBe(4);
    expect(BlockId.BRICK).toBe(10);
  });

  it('classifies solid / liquid / transparent / air', () => {
    expect(isAir(BlockId.AIR)).toBe(true);
    expect(isAir(BlockId.STONE)).toBe(false);
    expect(isSolid(BlockId.STONE)).toBe(true);
    expect(isSolid(BlockId.WATER)).toBe(false);
    expect(isLiquid(BlockId.WATER)).toBe(true);
    expect(isTransparent(BlockId.GLASS)).toBe(true);
    expect(isTransparent(BlockId.STONE)).toBe(false);
  });

  it('stack rules: blocks 64, tools 1', () => {
    expect(isBlockStackable(BlockId.STONE)).toBe(true);
    expect(isBlockStackable(BlockId.WOODEN_PICKAXE)).toBe(false);
    expect(getMaxStack(BlockId.STONE)).toBe(BLOCK_STACK_MAX);
    expect(getMaxStack(BlockId.WOODEN_PICKAXE)).toBe(1);
  });

  it('light emissions', () => {
    expect(blockEmitsLight(BlockId.TORCH)).toBe(14);
    expect(blockEmitsLight(BlockId.FURNACE)).toBe(12);
    expect(blockEmitsLight(BlockId.STONE)).toBe(0);
  });
});