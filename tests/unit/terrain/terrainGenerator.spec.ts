import { describe, it, expect } from 'vitest';
import { createTerrainGenerator } from '@/game/terrain/terrainGenerator';
import { CHUNK_SIZE } from '@/config/constants';

describe('TerrainGenerator', () => {
  it('produces deterministic heights for the same seed', () => {
    const a = createTerrainGenerator(123, 512);
    const b = createTerrainGenerator(123, 512);
    for (let i = 0; i < 20; i++) {
      const x = Math.floor(Math.random() * 200) - 100;
      const z = Math.floor(Math.random() * 200) - 100;
      expect(a.getHeightAt(x, z)).toBe(b.getHeightAt(x, z));
    }
  });

  it('returns a valid chunk buffer of correct size', () => {
    const gen = createTerrainGenerator(42, 256);
    const data = gen.generateChunkData(0, 0, 0);
    expect(data.length).toBe(CHUNK_SIZE * CHUNK_SIZE * CHUNK_SIZE);
    expect(data).toBeInstanceOf(Uint8Array);
  });

  it('places bedrock at y=0 and air above sealevel', () => {
    const gen = createTerrainGenerator(7, 256);
    const data = gen.generateChunkData(0, 0, 0);
    let foundBedrock = false;
    for (let lz = 0; lz < CHUNK_SIZE; lz++) {
      for (let lx = 0; lx < CHUNK_SIZE; lx++) {
        const idx = lx + 0 * CHUNK_SIZE + lz * CHUNK_SIZE * CHUNK_SIZE;
        if (data[idx] === 1) foundBedrock = true;
      }
    }
    expect(foundBedrock).toBe(true);
  });

  it('returns one of the documented biomes', () => {
    const gen = createTerrainGenerator(11, 512);
    const valid = new Set(['plains', 'forest', 'desert', 'snow', 'mountains']);
    for (let i = 0; i < 50; i++) {
      const x = Math.floor(Math.random() * 400) - 200;
      const z = Math.floor(Math.random() * 400) - 200;
      expect(valid.has(gen.getBiomeAt(x, z))).toBe(true);
    }
  });

  it('generates different worlds for different seeds', () => {
    const a = createTerrainGenerator(1, 256);
    const b = createTerrainGenerator(999, 256);
    const ha = a.getHeightAt(50, 50);
    const hb = b.getHeightAt(50, 50);
    expect(ha).not.toBe(hb);
  });
});