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
});
