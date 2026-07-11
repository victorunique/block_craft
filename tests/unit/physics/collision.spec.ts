import { describe, it, expect } from 'vitest';
import { updateEntityPosition, fallDamageFrom } from '@/game/physics/collision';
import { raycastVoxel } from '@/game/physics/raycast';
import { BlockId } from '@/config/blocks';

function getBlock(map: Map<string, number>) {
  return (x: number, y: number, z: number) => map.get(`${x},${y},${z}`) ?? 0;
}

function emptyMap() {
  return new Map<string, number>();
}

function groundMap(yLevel = 64) {
  const m = new Map<string, number>();
  for (let x = -50; x <= 50; x++) {
    for (let z = -50; z <= 50; z++) {
      m.set(`${x},${yLevel},${z}`, BlockId.STONE);
    }
  }
  return m;
}

describe('AABB Step-Climbing (PH-001)', () => {
  it('tall wall blocks horizontal movement', () => {
    const map = groundMap(64);
    for (let y = 64; y <= 70; y++) map.set(`2,${y},1`, BlockId.STONE);
    const get = getBlock(map);
    let pos: [number, number, number] = [1.0, 65.0, 1.0];
    let vel: [number, number, number] = [5, 0, 0];
    let finalVelX = 0;
    for (let i = 0; i < 5; i++) {
      const r = updateEntityPosition(pos, vel, [0.6, 1.8], 0.05, get);
      pos = r.newPos;
      vel = r.newVel;
      finalVelX = r.newVel[0];
    }
    expect(pos[0]).toBe(1.5);
    expect(finalVelX).toBe(0);
  });

  it('1-block step up allows upward slide', () => {
    const map = new Map<string, number>();
    for (let x = -10; x <= 10; x++) map.set(`${x},64,0`, BlockId.STONE);
    map.set('2,65,0', BlockId.STONE);
    const get = getBlock(map);
    let pos: [number, number, number] = [1.0, 65.0, 0.0];
    let vel: [number, number, number] = [5, 0, 0];
    for (let i = 0; i < 5; i++) {
      const r = updateEntityPosition(pos, vel, [0.6, 1.8], 0.05, get);
      pos = r.newPos;
      vel = r.newVel;
    }
    expect(pos[0]).toBeGreaterThan(1.6);
    expect(pos[1]).toBeGreaterThan(65.0);
  });

  it('gravity terminates at y=0 (bedrock boundary)', () => {
    const get = getBlock(emptyMap());
    const r = updateEntityPosition([0, 0.5, 0], [0, -50, 0], [0.6, 1.8], 0.05, get);
    expect(r.newPos[1]).toBeGreaterThanOrEqual(0);
  });

  it('isOnGround when falling onto solid block', () => {
    const map = new Map<string, number>();
    map.set('0,64,0', BlockId.STONE);
    const get = getBlock(map);
    let pos: [number, number, number] = [0, 66, 0];
    let vel: [number, number, number] = [0, -10, 0];
    let grounded = false;
    let finalY = 0;
    for (let i = 0; i < 30; i++) {
      const r = updateEntityPosition(pos, vel, [0.6, 1.8], 0.05, get);
      pos = r.newPos;
      vel = r.newVel;
      finalY = r.newPos[1];
      if (r.isOnGround) {
        grounded = true;
        break;
      }
    }
    expect(grounded).toBe(true);
    expect(finalY).toBeGreaterThanOrEqual(64);
  });

  it('landing at exact integer Y does not clip into block', () => {
    const map = new Map<string, number>();
    map.set('0,64,0', BlockId.STONE);
    const get = getBlock(map);
    // Start at 65.0, target dy = -1.0 precisely so feet end up at exactly 64.0.
    // Since gravity is 28, we want final vy = -20, so dy = -20 * 0.05 = -1.0.
    // Initial vy should be -20 + (28 * 0.05) = -18.6.
    const r = updateEntityPosition([0, 65.0, 0], [0, -18.6, 0], [0.6, 1.8], 0.05, get);
    expect(r.newPos[1]).toBe(65);
    expect(r.isOnGround).toBe(true);
  });
});

describe('fallDamageFrom', () => {
  it('no damage below threshold', () => {
    expect(fallDamageFrom(1)).toBe(0);
    expect(fallDamageFrom(3)).toBe(0);
  });
  it('damage scales with height above threshold', () => {
    expect(fallDamageFrom(4)).toBe(1);
    expect(fallDamageFrom(10)).toBe(7);
  });
});

describe('Raycast', () => {
  it('hits the nearest solid block from above', () => {
    const map = groundMap(64);
    const get = getBlock(map);
    const hit = raycastVoxel([0, 70, 0], [0, -1, 0], get, 20);
    expect(hit).not.toBeNull();
    expect(hit!.position).toEqual([0, 64, 0]);
    expect(hit!.normal).toEqual([0, 1, 0]);
  });

  it('returns null when no block within reach', () => {
    const get = getBlock(emptyMap());
    const hit = raycastVoxel([0, 70, 0], [0, -1, 0], get, 5);
    expect(hit).toBeNull();
  });

  it('returns correct face normal on side hit', () => {
    const map = new Map<string, number>();
    map.set('3,64,0', BlockId.STONE);
    const get = getBlock(map);
    const hit = raycastVoxel([0, 64.5, 0], [1, 0, 0], get, 10);
    expect(hit).not.toBeNull();
    expect(hit!.normal).toEqual([-1, 0, 0]);
  });
});