import { describe, it, expect } from 'vitest';
import { collidesWithWorld, createPlayerAABB, expandAABB } from '@/game/physics/aabb';
import { BlockId } from '@/config/blocks';

function solidMap(blocks: Array<[number, number, number]>) {
  const map = new Map<string, number>();
  for (const [x, y, z] of blocks) map.set(`${x},${y},${z}`, BlockId.STONE);
  return (x: number, y: number, z: number) => map.get(`${x},${y},${z}`) ?? 0;
}

describe('AABB collisions', () => {
  it('detects collision with adjacent solid block', () => {
    const box = createPlayerAABB([1.5, 64, 1.5]);
    const get = solidMap([[1, 64, 1]]);
    expect(collidesWithWorld(box, get)).toBe(true);
  });

  it('no collision when block is far away', () => {
    const box = createPlayerAABB([0.5, 64, 0.5]);
    const get = solidMap([[10, 64, 10]]);
    expect(collidesWithWorld(box, get)).toBe(false);
  });

  it('no collision with air block', () => {
    const box = createPlayerAABB([1.5, 64, 1.5]);
    const get = solidMap([]);
    expect(collidesWithWorld(box, get)).toBe(false);
  });

  it('does not collide with non-solid (water)', () => {
    const box = createPlayerAABB([0.5, 64, 0.5]);
    const map = new Map<string, number>();
    map.set('0,64,0', BlockId.WATER);
    const get = (x: number, y: number, z: number) => map.get(`${x},${y},${z}`) ?? 0;
    expect(collidesWithWorld(box, get)).toBe(false);
  });
});

describe('expandAABB', () => {
  it('grows symmetrically', () => {
    const expanded = expandAABB({ min: [0, 0, 0], max: [1, 1, 1] }, 1, 0.5, 2);
    expect(expanded.min).toEqual([-1, -0.5, -2]);
    expect(expanded.max).toEqual([2, 1.5, 3]);
  });
});