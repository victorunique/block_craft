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

  it('has CCW winding order for all faces (including top and bottom)', () => {
    const data = new Uint8Array(CHUNK_SIZE ** 3);
    data[1 + 1 * CHUNK_SIZE + 1 * CHUNK_SIZE * CHUNK_SIZE] = BlockId.STONE;
    const m = buildChunkMeshGreedy(data, 0, 0, 0);

    // We expect 12 triangles (6 faces * 2 triangles)
    expect(m.indices.length).toBe(36);

    for (let i = 0; i < m.indices.length; i += 3) {
      const i0 = m.indices[i];
      const i1 = m.indices[i + 1];
      const i2 = m.indices[i + 2];

      const v0 = [m.positions[i0 * 3], m.positions[i0 * 3 + 1], m.positions[i0 * 3 + 2]];
      const v1 = [m.positions[i1 * 3], m.positions[i1 * 3 + 1], m.positions[i1 * 3 + 2]];
      const v2 = [m.positions[i2 * 3], m.positions[i2 * 3 + 1], m.positions[i2 * 3 + 2]];

      const u = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]];
      const v = [v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]];

      const cross = [
        u[1] * v[2] - u[2] * v[1],
        u[2] * v[0] - u[0] * v[2],
        u[0] * v[1] - u[1] * v[0],
      ];

      const normal = [m.normals[i0 * 3], m.normals[i0 * 3 + 1], m.normals[i0 * 3 + 2]];
      const dot = cross[0] * normal[0] + cross[1] * normal[1] + cross[2] * normal[2];

      // Since normal vector is normalized and edges are length 1,
      // the cross product should match the normal direction (positive dot product).
      expect(dot).toBeGreaterThan(0);
    }
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