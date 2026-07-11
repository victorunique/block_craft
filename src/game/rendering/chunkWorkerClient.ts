import type { WorkerRequest, WorkerResponse } from '../../workers/chunkWorker';

export type { WorkerRequest, WorkerResponse };

export interface ChunkMeshData {
  chunkX: number;
  chunkY: number;
  chunkZ: number;
  positions: Float32Array;
  normals: Float32Array;
  uvs: Float32Array;
  indices: Uint32Array;
  waterPositions: Float32Array;
  waterNormals: Float32Array;
  waterUvs: Float32Array;
  waterIndices: Uint32Array;
  crossPositions: Float32Array;
  crossNormals: Float32Array;
  crossUvs: Float32Array;
  crossIndices: Uint32Array;
}

export interface ChunkDataResult {
  chunkX: number;
  chunkY: number;
  chunkZ: number;
  voxelBuffer: ArrayBuffer;
}

export class ChunkWorkerClient {
  private worker: Worker;
  private nextId = 0;
  private pending = new Map<string, { resolve: (v: any) => void; reject: (e: any) => void }>();

  constructor() {
    this.worker = new Worker(new URL('../../workers/chunkWorker.ts', import.meta.url), { type: 'module' });
    this.worker.addEventListener('message', (e: MessageEvent<WorkerResponse>) => {
      const res = e.data;
      const p = this.pending.get(res.id);
      if (!p) return;
      this.pending.delete(res.id);
      if (res.type === 'ERROR') p.reject(new Error(res.payload.message ?? 'worker error'));
      else p.resolve(res);
    });
  }

  private genId(): string {
    return `req_${this.nextId++}`;
  }

  init(seed: number, worldSize: number): Promise<void> {
    const id = this.genId();
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve: (v) => resolve(v.payload.message), reject });
      const req: WorkerRequest = { id, type: 'INIT_SEED', payload: { seed, worldSize } };
      this.worker.postMessage(req);
    });
  }

  generateChunk(seed: number, worldSize: number, cx: number, cy: number, cz: number): Promise<ChunkDataResult> {
    const id = this.genId();
    return new Promise((resolve, reject) => {
      this.pending.set(id, {
        resolve: (v: WorkerResponse) => {
          const buf = v.payload.voxelBuffer;
          if (!buf) return reject(new Error('no buffer'));
          resolve({ chunkX: v.payload.chunkX!, chunkY: v.payload.chunkY!, chunkZ: v.payload.chunkZ!, voxelBuffer: buf });
        },
        reject,
      });
      const req: WorkerRequest = { id, type: 'GENERATE_CHUNK_DATA', payload: { seed, worldSize, chunkX: cx, chunkY: cy, chunkZ: cz } };
      this.worker.postMessage(req);
    });
  }

  compileMesh(voxelBuffer: ArrayBuffer, cx: number, cy: number, cz: number): Promise<ChunkMeshData> {
    const id = this.genId();
    return new Promise((resolve, reject) => {
      this.pending.set(id, {
        resolve: (v: WorkerResponse) => {
          resolve({
            chunkX: v.payload.chunkX!,
            chunkY: v.payload.chunkY!,
            chunkZ: v.payload.chunkZ!,
            positions: v.payload.positions!,
            normals: v.payload.normals!,
            uvs: v.payload.uvs!,
            indices: v.payload.indices!,
            waterPositions: v.payload.waterPositions!,
            waterNormals: v.payload.waterNormals!,
            waterUvs: v.payload.waterUvs!,
            waterIndices: v.payload.waterIndices!,
            crossPositions: v.payload.crossPositions!,
            crossNormals: v.payload.crossNormals!,
            crossUvs: v.payload.crossUvs!,
            crossIndices: v.payload.crossIndices!,
          });
        },
        reject,
      });
      const req: WorkerRequest = { id, type: 'COMPILE_CHUNK_MESH', payload: { chunkX: cx, chunkY: cy, chunkZ: cz, voxelBuffer } };
      this.worker.postMessage(req, [voxelBuffer]);
    });
  }

  compileMeshDelta(seed: number, worldSize: number, cx: number, cy: number, cz: number, deltas: Record<string, number>): Promise<ChunkMeshData> {
    const id = this.genId();
    return new Promise(async (resolve, reject) => {
      try {
        const gen = await this.generateChunk(seed, worldSize, cx, cy, cz);
        const deltaBuffer = new TextEncoder().encode(JSON.stringify(deltas)).buffer;
        this.pending.set(id, {
          resolve: (v: WorkerResponse) => {
            resolve({
              chunkX: v.payload.chunkX!,
              chunkY: v.payload.chunkY!,
              chunkZ: v.payload.chunkZ!,
              positions: v.payload.positions!,
              normals: v.payload.normals!,
              uvs: v.payload.uvs!,
              indices: v.payload.indices!,
              waterPositions: v.payload.waterPositions!,
              waterNormals: v.payload.waterNormals!,
              waterUvs: v.payload.waterUvs!,
              waterIndices: v.payload.waterIndices!,
              crossPositions: v.payload.crossPositions!,
              crossNormals: v.payload.crossNormals!,
              crossUvs: v.payload.crossUvs!,
              crossIndices: v.payload.crossIndices!,
            });
          },
          reject,
        });
        const req: WorkerRequest = {
          id,
          type: 'COMPILE_CHUNK_DELTA_MESH',
          payload: { chunkX: cx, chunkY: cy, chunkZ: cz, voxelBuffer: gen.voxelBuffer, deltaBuffer },
        };
        this.worker.postMessage(req, [gen.voxelBuffer, deltaBuffer]);
      } catch (err) {
        reject(err);
      }
    });
  }

  dispose() {
    this.worker.terminate();
    this.pending.clear();
  }
}

let clientInstance: ChunkWorkerClient | null = null;
export function getChunkWorker(): ChunkWorkerClient {
  if (!clientInstance) clientInstance = new ChunkWorkerClient();
  return clientInstance;
}