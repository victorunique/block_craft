import { describe, it, expect, vi } from 'vitest';
import { ChunkManager } from '@/game/world/chunkManager';
import { BlockId } from '@/config/blocks';

describe('ChunkManager getBlockAt', () => {
  const mockWorker: any = {
    generateChunk: vi.fn(),
    compileMesh: vi.fn(),
    dispose: vi.fn(),
  };

  it('returns 0 (Air) by default for unloaded chunks', () => {
    const cm = new ChunkManager({
      seed: 42,
      worldSize: 256,
      renderDistance: 2,
      worker: mockWorker,
    });
    // Querying coordinate (0, 60, 0) inside an unloaded chunk
    expect(cm.getBlockAt(0, 60, 0)).toBe(0);
    expect(cm.getBlockAt(0, 60, 0, false)).toBe(0);
  });

  it('returns BlockId.BEDROCK when treatUnloadedAsSolid is true and chunk is unloaded', () => {
    const cm = new ChunkManager({
      seed: 42,
      worldSize: 256,
      renderDistance: 2,
      worker: mockWorker,
    });
    // Querying coordinate (0, 60, 0) inside an unloaded chunk with treatUnloadedAsSolid = true
    expect(cm.getBlockAt(0, 60, 0, true)).toBe(BlockId.BEDROCK);
  });

  it('returns BlockId.BEDROCK when treatUnloadedAsSolid is true for out-of-bounds coords', () => {
    const cm = new ChunkManager({
      seed: 42,
      worldSize: 256,
      renderDistance: 2,
      worker: mockWorker,
    });
    // Querying out of bounds (-129, 60, 0) with treatUnloadedAsSolid = true
    expect(cm.getBlockAt(-129, 60, 0, true)).toBe(BlockId.BEDROCK);
    // Querying out of bounds (128, 60, 0) with treatUnloadedAsSolid = true
    expect(cm.getBlockAt(128, 60, 0, true)).toBe(BlockId.BEDROCK);
    // Querying out of bounds (-129, 60, 0) with treatUnloadedAsSolid = false should return 0 (Air)
    expect(cm.getBlockAt(-129, 60, 0, false)).toBe(0);
  });
});

describe('ChunkManager mesh compilation concurrency', () => {
  it('does not overwrite newer mesh with older mesh if resolved out of order', async () => {
    const mockWorker: any = {
      generateChunk: vi.fn().mockResolvedValue({ chunkX: 8, chunkY: 4, chunkZ: 8, voxelBuffer: new ArrayBuffer(4096) }),
      compileMesh: vi.fn(),
      dispose: vi.fn(),
    };

    const cm = new ChunkManager({
      seed: 42,
      worldSize: 256,
      renderDistance: 2,
      worker: mockWorker,
    });

    // Mock initial chunk load compileMesh call to resolve immediately
    mockWorker.compileMesh.mockResolvedValueOnce({ positions: new Float32Array([0]) } as any);
    await cm.ensureChunk(8, 4, 8);

    // Mock compileMesh to simulate out-of-order resolution
    let firstResolve: any;
    let secondResolve: any;

    const firstPromise = new Promise((resolve) => {
      firstResolve = () => resolve({ positions: new Float32Array([1]) } as any);
    });
    const secondPromise = new Promise((resolve) => {
      secondResolve = () => resolve({ positions: new Float32Array([2]) } as any);
    });

    mockWorker.compileMesh.mockImplementationOnce(() => firstPromise);
    mockWorker.compileMesh.mockImplementationOnce(() => secondPromise);

    // Perform first update
    cm.setBlockAt(0, 64, 0, 4); // targetVersion = 1
    const rebuild1 = cm.rebuildDirty(); // launches compileMesh 1 (version 1)

    // Perform second update
    cm.setBlockAt(0, 64, 0, 2); // targetVersion = 2
    const rebuild2 = cm.rebuildDirty(); // launches compileMesh 2 (version 2)

    // Resolve compilation 2 first (version 2)
    secondResolve();
    await rebuild2;

    // Resolve compilation 1 second (version 1)
    firstResolve();
    await rebuild1;

    // Verify chunk mesh is compileMesh 2's mesh, not compileMesh 1's
    const blockValue = cm.getBlockAt(0, 64, 0); // verify block is 2
    expect(blockValue).toBe(2);

    const chunk = (cm as any).chunks.get('8,4,8');
    expect(chunk.mesh.positions[0]).toBe(2); // mesh 2 positions starts with 2
  });
});
