import { describe, it, expect } from 'vitest';
import { mulberry32, rngInt, rngPick, hashSeed } from '@/utils/rng';
import { clamp, lerp, smoothstep, manhattan, distance2 } from '@/utils/math';
import { uuid } from '@/utils/math';

describe('mulberry32 PRNG', () => {
  it('is deterministic for the same seed', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 100; i++) {
      expect(a()).toBe(b());
    }
  });

  it('returns values in [0, 1)', () => {
    const rng = mulberry32(123);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('produces distinct streams per seed', () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    expect(a()).not.toBe(b());
  });
});

describe('rng helpers', () => {
  it('rngInt bounds', () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 50; i++) {
      const v = rngInt(rng, 5, 8);
      expect(v).toBeGreaterThanOrEqual(5);
      expect(v).toBeLessThanOrEqual(8);
    }
  });

  it('rngPick returns array element', () => {
    const rng = mulberry32(7);
    const arr = ['a', 'b', 'c'];
    for (let i = 0; i < 20; i++) {
      expect(arr).toContain(rngPick(rng, arr));
    }
  });

  it('hashSeed is deterministic', () => {
    expect(hashSeed(123)).toBe(hashSeed(123));
    expect(hashSeed(1)).not.toBe(hashSeed(2));
  });
});

describe('math utilities', () => {
  it('clamp bounds', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });
  it('lerp interpolates', () => {
    expect(lerp(0, 10, 0.5)).toBe(5);
    expect(lerp(0, 10, 0)).toBe(0);
    expect(lerp(0, 10, 1)).toBe(10);
  });
  it('smoothstep eases', () => {
    expect(smoothstep(0, 1, 0)).toBe(0);
    expect(smoothstep(0, 1, 1)).toBe(1);
    expect(smoothstep(0, 1, 0.5)).toBeCloseTo(0.5, 3);
  });
  it('manhattan / distance2', () => {
    expect(manhattan(0, 0, 0, 3, 4, 0)).toBe(7);
    expect(distance2(0, 0, 3, 4)).toBeCloseTo(5, 3);
  });
});

describe('uuid', () => {
  it('produces unique strings', () => {
    const set = new Set<string>();
    for (let i = 0; i < 200; i++) set.add(uuid());
    expect(set.size).toBe(200);
  });
  it('matches uuid v4 format', () => {
    const id = uuid();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });
});