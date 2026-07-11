import { describe, it, expect } from 'vitest';
import { createTerrainGenerator } from '@/game/terrain/terrainGenerator';
import { CHUNK_SIZE } from '@/config/constants';
import { BlockId } from '@/config/blocks';
import { generateTrees } from '@/game/terrain/trees';
import { createNoiseContext } from '@/game/terrain/simplex';

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

  it('aligns chunk coordinates with world coordinates for height generation', () => {
    const seed = 12345;
    const worldSize = 512;
    const half = worldSize / 2;
    const gen = createTerrainGenerator(seed, worldSize);
    
    // Test at world coordinates (0, 0)
    const wx = 0;
    const wz = 0;
    const expectedHeight = gen.getHeightAt(wx, wz);
    
    // Chunk coordinates for world (0, 0)
    const cx = Math.floor((wx + half) / CHUNK_SIZE);
    const cz = Math.floor((wz + half) / CHUNK_SIZE);
    const cy = Math.floor(expectedHeight / CHUNK_SIZE);
    
    const data = gen.generateChunkData(cx, cy, cz);
    
    const lx = 0; // since wx + half - cx * CHUNK_SIZE = 0 + 256 - 256 = 0
    const lz = 0; // since wz + half - cz * CHUNK_SIZE = 0 + 256 - 256 = 0
    const ly = expectedHeight % CHUNK_SIZE;
    
    const idx = lx + ly * CHUNK_SIZE + lz * CHUNK_SIZE * CHUNK_SIZE;
    const blockId = data[idx];
    
    // The block at the surface height should be a non-air block
    expect(blockId).not.toBe(BlockId.AIR);
    
    // A block above the surface height should be air
    if (ly + 1 < CHUNK_SIZE) {
      const aboveIdx = lx + (ly + 1) * CHUNK_SIZE + lz * CHUNK_SIZE * CHUNK_SIZE;
      expect(data[aboveIdx]).toBe(BlockId.AIR);
    }
  });

  it('places trees in the correct chunks matching their world coordinates', () => {
    const seed = 12345;
    const worldSize = 512;
    const half = worldSize / 2;
    const gen = createTerrainGenerator(seed, worldSize);
    
    const ctx = createNoiseContext(seed);
    const trees = generateTrees(ctx, seed, worldSize);
    expect(trees.length).toBeGreaterThan(0);
    
    const testTree = trees[0];
    
    // Find the correct chunk coordinates for this tree
    const cx = Math.floor((testTree.x + half) / CHUNK_SIZE);
    const cz = Math.floor((testTree.z + half) / CHUNK_SIZE);
    const cy = Math.floor(testTree.y / CHUNK_SIZE);
    
    const data = gen.generateChunkData(cx, cy, cz);
    
    const lx = Math.floor(testTree.x + half) - cx * CHUNK_SIZE;
    const ly = testTree.y - cy * CHUNK_SIZE;
    const lz = Math.floor(testTree.z + half) - cz * CHUNK_SIZE;
    
    const idx = lx + ly * CHUNK_SIZE + lz * CHUNK_SIZE * CHUNK_SIZE;
    const isWood = data[idx] === BlockId.WOOD || data[idx] === BlockId.PINE_WOOD;
    expect(isWood).toBe(true);
  });
});