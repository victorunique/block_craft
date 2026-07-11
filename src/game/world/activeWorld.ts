import type { ChunkManager } from './chunkManager';
import type { EntitySpawner } from '../entities/spawner';

let _chunkManager: ChunkManager | null = null;
let _spawner: EntitySpawner | null = null;

export function setActiveWorld(cm: ChunkManager | null, sp: EntitySpawner | null): void {
  if (_chunkManager && _chunkManager !== cm) {
    _chunkManager.dispose?.();
  }
  _chunkManager = cm;
  _spawner = sp;
}

export function getActiveChunkManager(): ChunkManager | null {
  return _chunkManager;
}

export function getActiveSpawner(): EntitySpawner | null {
  return _spawner;
}

export function clearActiveWorld(): void {
  if (_chunkManager) _chunkManager.dispose?.();
  _chunkManager = null;
  _spawner = null;
}
