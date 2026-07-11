import { CHUNK_SIZE } from '../../config/constants';
import { ChunkWorkerClient, type ChunkMeshData } from '../rendering/chunkWorkerClient';
import { recordChunkDelta, getInMemoryChunkDeltas } from '../save/saveManager';

export interface ChunkEntry {
  cx: number;
  cy: number;
  cz: number;
  voxels: Uint8Array;
  mesh: ChunkMeshData | null;
  generation: Promise<ChunkEntry> | null;
}

export interface ChunkManagerOptions {
  seed: number;
  worldSize: number;
  renderDistance: number;
  worker: ChunkWorkerClient;
}

export class ChunkManager {
  readonly seed: number;
  readonly worldSize: number;
  renderDistance: number;
  readonly worker: ChunkWorkerClient;

  private chunks = new Map<string, ChunkEntry>();
  private dirty = new Set<string>();

  constructor(opts: ChunkManagerOptions) {
    this.seed = opts.seed;
    this.worldSize = opts.worldSize;
    this.renderDistance = opts.renderDistance;
    this.worker = opts.worker;
  }

  setRenderDistance(d: number) {
    this.renderDistance = d;
  }

  key(cx: number, cy: number, cz: number): string {
    return `${cx},${cy},${cz}`;
  }

  private chunkCoordsFromWorld(x: number, z: number) {
    const half = this.worldSize / 2;
    const cx = Math.floor((x + half) / CHUNK_SIZE);
    const cz = Math.floor((z + half) / CHUNK_SIZE);
    return { cx, cz };
  }

  worldToChunk(x: number, y: number, z: number) {
    const half = this.worldSize / 2;
    const cx = Math.floor((x + half) / CHUNK_SIZE);
    const cy = Math.floor(y / CHUNK_SIZE);
    const cz = Math.floor((z + half) / CHUNK_SIZE);
    return { cx, cy, cz };
  }

  localCoords(x: number, y: number, z: number) {
    const half = this.worldSize / 2;
    const lx = ((x + half) % CHUNK_SIZE + CHUNK_SIZE) % CHUNK_SIZE;
    const ly = ((y % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((z + half) % CHUNK_SIZE + CHUNK_SIZE) % CHUNK_SIZE;
    return { lx, ly, lz };
  }

  voxelIndexLocal(lx: number, ly: number, lz: number): number {
    return lx + ly * CHUNK_SIZE + lz * CHUNK_SIZE * CHUNK_SIZE;
  }

  async ensureChunk(cx: number, cy: number, cz: number): Promise<ChunkEntry> {
    const k = this.key(cx, cy, cz);
    let entry = this.chunks.get(k);
    if (entry && entry.mesh) return entry;
    if (entry && entry.generation) return entry.generation;

    entry = { cx, cy, cz, voxels: new Uint8Array(0), mesh: null, generation: null };
  entry.generation = (async () => {
    const data = await this.worker.generateChunk(this.seed, this.worldSize, cx, cy, cz);
    const safeBuffer = data.voxelBuffer.slice(0);
    const merged = new Uint8Array(safeBuffer);
    const deltas = getInMemoryChunkDeltas().get(`${this.getWorldIdFromAnywhere()}|${k}`);
    if (deltas) {
      for (const [idx, v] of Object.entries(deltas)) {
        const i = Number(idx);
        if (i >= 0 && i < merged.length) merged[i] = v;
      }
    }
    entry!.voxels = merged;
    const mesh = await this.worker.compileMesh(data.voxelBuffer, cx, cy, cz);
    entry!.mesh = mesh;
    entry!.generation = null;
    return entry!;
  })();
    this.chunks.set(k, entry);
    return entry.generation;
  }

  private getWorldIdFromAnywhere(): string {
    try {
      const { activeWorldId } = require('../store/gameStore').useGameStore.getState();
      return activeWorldId ?? 'default';
    } catch {
      return 'default';
    }
  }

  setBlockAt(x: number, y: number, z: number, blockId: number): boolean {
    const half = this.worldSize / 2;
    if (x < -half || x >= half || z < -half || z >= half) return false;
    if (y < 0 || y >= 128) return false;
    const { cx, cy, cz } = this.worldToChunk(x, y, z);
    const { lx, ly, lz } = this.localCoords(x, y, z);
    const entry = this.chunks.get(this.key(cx, cy, cz));
    if (!entry) {
      recordChunkDelta(this.getWorldIdFromAnywhere(), `${cx},${cy},${cz}`, this.voxelIndexLocal(lx, ly, lz), blockId);
      this.dirty.add(this.key(cx, cy, cz));
      return true;
    }
    const idx = this.voxelIndexLocal(lx, ly, lz);
    entry.voxels[idx] = blockId;
    recordChunkDelta(this.getWorldIdFromAnywhere(), `${cx},${cy},${cz}`, idx, blockId);
    this.dirty.add(this.key(cx, cy, cz));
    return true;
  }

  getBlockAt(x: number, y: number, z: number): number {
    const half = this.worldSize / 2;
    if (x < -half || x >= half || z < -half || z >= half) return 0;
    if (y < 0 || y >= 128) return 0;
    const { cx, cy, cz } = this.worldToChunk(x, y, z);
    const entry = this.chunks.get(this.key(cx, cy, cz));
    if (!entry || entry.voxels.length === 0) return 0;
    const { lx, ly, lz } = this.localCoords(x, y, z);
    return entry.voxels[this.voxelIndexLocal(lx, ly, lz)];
  }

  async rebuildDirty(): Promise<void> {
    const dirtyKeys = Array.from(this.dirty);
    this.dirty.clear();
    await Promise.all(
      dirtyKeys.map(async (k) => {
        const [cx, cy, cz] = k.split(',').map(Number);
        const entry = this.chunks.get(k);
        if (!entry) return;
        const mesh = await this.worker.compileMesh(entry.voxels.buffer.slice(0) as ArrayBuffer, cx, cy, cz);
        entry.mesh = mesh;
      }),
    );
  }

  async updateAroundPlayer(playerX: number, playerY: number, playerZ: number): Promise<void> {
    const { cx: pcx, cz: pcz } = this.chunkCoordsFromWorld(playerX, playerZ);
    const cy = Math.floor(playerY / CHUNK_SIZE);
    const r = this.renderDistance;
    const tasks: Promise<any>[] = [];
    for (let dx = -r; dx <= r; dx++) {
      for (let dz = -r; dz <= r; dz++) {
        for (let dy = -2; dy <= 2; dy++) {
          const cx = pcx + dx;
          const cz = pcz + dz;
          const ccy = cy + dy;
          if (cx < 0 || cx * CHUNK_SIZE >= this.worldSize) continue;
          if (cz < 0 || cz * CHUNK_SIZE >= this.worldSize) continue;
          if (ccy < 0 || ccy >= 8) continue;
          if (dx * dx + dz * dz > r * r + 1) continue;
          tasks.push(this.ensureChunk(cx, ccy, cz));
        }
      }
    }
    await Promise.all(tasks);
    this.evictFarChunks(pcx, pcz, cy, r + 2);
  }

  private evictFarChunks(pcx: number, pcz: number, pcy: number, keep: number) {
    for (const [k, entry] of this.chunks.entries()) {
      const dx = entry.cx - pcx;
      const dz = entry.cz - pcz;
      const dy = entry.cy - pcy;
      if (Math.abs(dx) > keep || Math.abs(dz) > keep || Math.abs(dy) > 4) {
        this.chunks.delete(k);
      }
    }
  }

  entries(): IterableIterator<ChunkEntry> {
    return this.chunks.values();
  }

  hasChunk(cx: number, cy: number, cz: number): boolean {
    return this.chunks.has(this.key(cx, cy, cz));
  }

  getChunk(cx: number, cy: number, cz: number): ChunkEntry | undefined {
    return this.chunks.get(this.key(cx, cy, cz));
  }

  loadedCount(): number {
    let n = 0;
    for (const e of this.chunks.values()) if (e.mesh) n++;
    return n;
  }

  pendingCount(): number {
    let n = 0;
    for (const e of this.chunks.values()) if (!e.mesh) n++;
    return n;
  }

  dispose(): void {
    this.chunks.clear();
    this.dirty.clear();
    this.worker.dispose();
  }
}