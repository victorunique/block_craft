import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActiveWorld, getActiveChunkManager, getActiveSpawner, clearActiveWorld } from '@/game/world/activeWorld';
import type { ChunkManager } from '@/game/world/chunkManager';
import type { EntitySpawner } from '@/game/entities/spawner';

describe('activeWorld lifecycle', () => {
  beforeEach(() => {
    clearActiveWorld();
  });

  it('initially returns null for active world manager and spawner', () => {
    expect(getActiveChunkManager()).toBeNull();
    expect(getActiveSpawner()).toBeNull();
  });

  it('can set and get active world and spawner', () => {
    const mockDispose = vi.fn();
    const mockCM = { dispose: mockDispose } as unknown as ChunkManager;
    const mockSP = {} as unknown as EntitySpawner;

    setActiveWorld(mockCM, mockSP);
    expect(getActiveChunkManager()).toBe(mockCM);
    expect(getActiveSpawner()).toBe(mockSP);
  });

  it('disposes of the old chunk manager when setting a new one', () => {
    const mockDispose1 = vi.fn();
    const mockCM1 = { dispose: mockDispose1 } as unknown as ChunkManager;
    const mockDispose2 = vi.fn();
    const mockCM2 = { dispose: mockDispose2 } as unknown as ChunkManager;

    setActiveWorld(mockCM1, null);
    setActiveWorld(mockCM2, null);

    expect(mockDispose1).toHaveBeenCalledTimes(1);
    expect(mockDispose2).not.toHaveBeenCalled();
    expect(getActiveChunkManager()).toBe(mockCM2);
  });

  it('clears references and disposes chunk manager when calling clearActiveWorld', () => {
    const mockDispose = vi.fn();
    const mockCM = { dispose: mockDispose } as unknown as ChunkManager;
    const mockSP = {} as unknown as EntitySpawner;

    setActiveWorld(mockCM, mockSP);
    clearActiveWorld();

    expect(mockDispose).toHaveBeenCalledTimes(1);
    expect(getActiveChunkManager()).toBeNull();
    expect(getActiveSpawner()).toBeNull();
  });
});
