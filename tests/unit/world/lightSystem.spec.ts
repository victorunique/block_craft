import { describe, it, expect } from 'vitest';
import { canMonstersSpawnAt, computeLightLevel } from '@/game/world/lightSystem';
import { BlockId } from '@/config/blocks';

function makeMap(map: Map<string, number>) {
  return (x: number, y: number, z: number) => map.get(`${x},${y},${z}`) ?? 0;
}

describe('Light system', () => {
  it('torch light decays with distance', () => {
    const map = new Map<string, number>();
    map.set('0,64,0', BlockId.TORCH);
    const get = makeMap(map);
    const lvl = computeLightLevel(get, 0, 64, 0, 0);
    expect(lvl).toBe(14);
  });

  it('monsters spawn only when light < 4', () => {
    const map = new Map<string, number>();
    map.set('0,64,0', BlockId.TORCH);
    const get = makeMap(map);
    expect(canMonstersSpawnAt(get, 5, 64, 0, 0)).toBe(false);
    expect(canMonstersSpawnAt(get, 50, 64, 0, 0)).toBe(true);
  });

  it('respects sun light level', () => {
    const get = makeMap(new Map());
    expect(computeLightLevel(get, 0, 64, 0, 15)).toBe(15);
    expect(canMonstersSpawnAt(get, 0, 64, 0, 15)).toBe(false);
  });
});