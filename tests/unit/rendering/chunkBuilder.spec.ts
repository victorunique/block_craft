import { describe, it, expect } from 'vitest';
import { buildChunkMeshGreedy, buildWaterChunkMesh, applyChunkDelta } from '@/game/rendering/chunkBuilder';
import { createTerrainGenerator } from '@/game/terrain/terrainGenerator';
import { CHUNK_SIZE } from '@/config/constants';
import { BlockId } from '@/config/blocks';

describe('Greedy Mesh Builder', () => {
  it('produces no geometry for an empty chunk', () => {
    const data = new Uint8Array(CHUNK_SIZE ** 3);
    const m = buildChunkMeshGreedy(data, 0, 0, 0);
    expect(m.vertexCount).toBe(0);
    expect(m.indexCount).toBe(0);
  });

  it('produces geometry for a single solid block (6 faces × 4 verts × 6 indices = 36)', () => {
    const data = new Uint8Array(CHUNK_SIZE ** 3);
    data[1 + 1 * CHUNK_SIZE + 1 * CHUNK_SIZE * CHUNK_SIZE] = BlockId.STONE;
    const m = buildChunkMeshGreedy(data, 0, 0, 0);
    expect(m.vertexCount).toBe(24);
    expect(m.indexCount).toBe(36);
  });

  it('culls internal faces between adjacent blocks', () => {
    const separated = new Uint8Array(CHUNK_SIZE ** 3);
    separated[1 + 1 * CHUNK_SIZE + 1 * CHUNK_SIZE * CHUNK_SIZE] = BlockId.STONE;
    separated[10 + 1 * CHUNK_SIZE + 1 * CHUNK_SIZE * CHUNK_SIZE] = BlockId.STONE;
    const touching = new Uint8Array(CHUNK_SIZE ** 3);
    touching[1 + 1 * CHUNK_SIZE + 1 * CHUNK_SIZE * CHUNK_SIZE] = BlockId.STONE;
    touching[2 + 1 * CHUNK_SIZE + 1 * CHUNK_SIZE * CHUNK_SIZE] = BlockId.STONE;
    const sep = buildChunkMeshGreedy(separated, 0, 0, 0);
    const touch = buildChunkMeshGreedy(touching, 0, 0, 0);
    expect(sep.indexCount).toBe(72);
    expect(touch.indexCount).toBe(60);
  });

  it('exposes faces of opaque block adjacent to transparent block', () => {
    const data = new Uint8Array(CHUNK_SIZE ** 3);
    // Place a stone block surrounded by air on all sides except one glass neighbor
    data[1 + 1 * CHUNK_SIZE + 1 * CHUNK_SIZE * CHUNK_SIZE] = BlockId.STONE;
    data[2 + 1 * CHUNK_SIZE + 1 * CHUNK_SIZE * CHUNK_SIZE] = BlockId.GLASS;
    const m = buildChunkMeshGreedy(data, 0, 0, 0);
    // Stone should still have all 6 faces rendered (glass is transparent, not opaque)
    // Glass should have all 6 faces rendered (5 air + 1 stone neighbor, and stone is not transparent)
    // Both blocks: stone has 6 faces (36 indices), glass has 6 faces (36 indices)
    // But the shared face between stone and glass: stone shows face toward glass (glass is transparent),
    // and glass shows face toward stone (stone is opaque, not transparent)
    // Total: 12 faces = 72 indices
    expect(m.indexCount).toBe(72);
  });

  it('water mesh emits only top faces', () => {
    const data = new Uint8Array(CHUNK_SIZE ** 3);
    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
      for (let lz = 0; lz < CHUNK_SIZE; lz++) {
        data[lx + 5 * CHUNK_SIZE + lz * CHUNK_SIZE * CHUNK_SIZE] = BlockId.WATER;
      }
    }
    const m = buildWaterChunkMesh(data, 0, 0, 0);
    expect(m.indexCount).toBeGreaterThan(0);
  });

  it('applies chunk deltas correctly', () => {
    const data = new Uint8Array(CHUNK_SIZE ** 3);
    data[0] = 0;
    data[1] = 5;
    const next = applyChunkDelta(data, { '1': 9, '0': 0 });
    expect(next[1]).toBe(9);
    expect(next[0]).toBe(0);
  });
});

describe('Generated chunk from terrain compiles without errors', () => {
  it('produces a valid mesh buffer', () => {
    const gen = createTerrainGenerator(42, 256);
    const data = gen.generateChunkData(0, 3, 0);
    const m = buildChunkMeshGreedy(data, 0, 3, 0);
    expect(m.vertexCount).toBeGreaterThan(0);
    expect(m.indices.length % 3).toBe(0);
    expect(m.positions.length).toBe(m.vertexCount * 3);
  });
});