import { describe, it, expect } from 'vitest';
import { buildChunkMeshGreedy } from '@/game/rendering/chunkBuilder';
import { createTerrainGenerator } from '@/game/terrain/terrainGenerator';
import { CHUNK_SIZE } from '@/config/constants';
import type { WorkerRequest, WorkerResponse } from '@/workers/chunkWorker';

async function runWorker(input: WorkerRequest['payload'], reqType: WorkerRequest['type']): Promise<WorkerResponse> {
  const { chunkWorkerHandler } = await import('@/workers/chunkWorker.runtime');
  return new Promise((resolve, reject) => {
    let result: WorkerResponse | undefined;
    let error: any;
    const handlers = chunkWorkerHandler({
      postMessage: (msg: WorkerResponse) => (result = msg),
    });
    handlers.message({ data: { id: 'req_99', type: reqType, payload: input } as WorkerRequest })
      .catch((e) => (error = e))
      .finally(() => {
        if (error) reject(error);
        else if (result) resolve(result);
        else reject(new Error('no result'));
      });
  });
}

describe('WorkerRequest/WorkerResponse protocol', () => {
  it('initialises a generator seed', async () => {
    const res = await runWorker({ seed: 12345, worldSize: 256 }, 'INIT_SEED');
    expect(res.type).toBe('INIT_SUCCESS');
    expect(res.payload.message).toContain('seed=12345');
  });

  it('generates chunk data with correct format', async () => {
    const res = await runWorker({ seed: 7, worldSize: 256, chunkX: 2, chunkY: 1, chunkZ: 0 }, 'GENERATE_CHUNK_DATA');
    expect(res.type).toBe('CHUNK_DATA_GENERATED');
    expect(res.payload.chunkX).toBe(2);
    const buf = res.payload.voxelBuffer!;
    expect(buf.byteLength).toBe(CHUNK_SIZE ** 3);
  });

  it('compiles chunk mesh from voxel buffer', async () => {
    const gen = createTerrainGenerator(7, 256);
    const data = gen.generateChunkData(2, 1, 0);
    const res = await runWorker({ chunkX: 2, chunkY: 1, chunkZ: 0, voxelBuffer: data.buffer.slice(0) }, 'COMPILE_CHUNK_MESH');
    expect(res.type).toBe('MESH_COMPILED');
    expect(res.payload.positions).toBeDefined();
    expect(res.payload.positions!.byteLength).toBeGreaterThan(0);
    expect(res.payload.indices!.byteLength % 4).toBe(0);
  });

  it('worker output matches direct buildChunkMeshGreedy output', async () => {
    const gen = createTerrainGenerator(42, 256);
    const data = gen.generateChunkData(0, 3, 0);
    const direct = buildChunkMeshGreedy(data, 0, 3, 0);
    const res = await runWorker({ chunkX: 0, chunkY: 3, chunkZ: 0, voxelBuffer: data.buffer.slice(0) }, 'COMPILE_CHUNK_MESH');
    expect(res.payload.positions!.length).toBe(direct.positions.length);
    expect(res.payload.indices!.length).toBe(direct.indices.length);
  });

  it('delta recompilation produces a mesh', async () => {
    const gen = createTerrainGenerator(11, 256);
    const data = gen.generateChunkData(0, 3, 0);
    const deltas = { [String(1 + 4 * 16 + 4 * 256)]: 9 };
    const deltaBuffer = new TextEncoder().encode(JSON.stringify(deltas)).buffer;
    const res = await runWorker({ chunkX: 0, chunkY: 3, chunkZ: 0, voxelBuffer: data.buffer.slice(0), deltaBuffer }, 'COMPILE_CHUNK_DELTA_MESH');
    expect(res.type).toBe('MESH_COMPILED');
    expect(res.payload.positions!.length).toBeGreaterThan(0);
  });

  it('error path returns ERROR response', async () => {
    const res = await runWorker({ chunkX: 0, chunkY: 0, chunkZ: 0 }, 'COMPILE_CHUNK_MESH');
    expect(res.type).toBe('ERROR');
  });
});