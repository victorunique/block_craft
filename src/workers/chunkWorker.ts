/// <reference lib="webworker" />
// Cache invalidate touch
import { createTerrainGenerator } from '../game/terrain/terrainGenerator';
import { buildChunkMeshGreedy, buildWaterChunkMesh, buildCrossMesh } from '../game/rendering/chunkBuilder';
import { applyChunkDelta } from '../game/rendering/chunkBuilder';
import { BlockId } from '../config/blocks';

export type WorkerRequestType =
  | 'INIT_SEED'
  | 'GENERATE_CHUNK_DATA'
  | 'COMPILE_CHUNK_MESH'
  | 'COMPILE_CHUNK_DELTA_MESH';

export interface WorkerRequest {
  id: string;
  type: WorkerRequestType;
  payload: {
    seed?: number;
    worldSize?: number;
    chunkX?: number;
    chunkY?: number;
    chunkZ?: number;
    voxelBuffer?: ArrayBufferLike;
    deltaBuffer?: ArrayBufferLike;
  };
}

export type WorkerResponseType = 'INIT_SUCCESS' | 'CHUNK_DATA_GENERATED' | 'MESH_COMPILED' | 'ERROR';

export interface WorkerResponse {
  id: string;
  type: WorkerResponseType;
  payload: {
    chunkX?: number;
    chunkY?: number;
    chunkZ?: number;
    voxelBuffer?: ArrayBuffer;
    positions?: Float32Array;
    normals?: Float32Array;
    uvs?: Float32Array;
    indices?: Uint32Array;
    waterPositions?: Float32Array;
    waterNormals?: Float32Array;
    waterUvs?: Float32Array;
    waterIndices?: Uint32Array;
    crossPositions?: Float32Array;
    crossNormals?: Float32Array;
    crossUvs?: Float32Array;
    crossIndices?: Uint32Array;
    message?: string;
  };
}

const generators = new Map<string, ReturnType<typeof createTerrainGenerator>>();

function getGenerator(seed: number, worldSize: number) {
  const key = `${seed}|${worldSize}`;
  let g = generators.get(key);
  if (!g) {
    g = createTerrainGenerator(seed, worldSize);
    generators.set(key, g);
  }
  return g;
}

self.addEventListener('message', (event: MessageEvent<WorkerRequest>) => {
  const req = event.data;
  try {
    if (req.type === 'INIT_SEED') {
      const seed = req.payload.seed ?? 0;
      const worldSize = req.payload.worldSize ?? 512;
      getGenerator(seed, worldSize);
      const res: WorkerResponse = { id: req.id, type: 'INIT_SUCCESS', payload: { message: `seed=${seed}` } };
      (self as any).postMessage(res);
      return;
    }
    if (req.type === 'GENERATE_CHUNK_DATA') {
      const seed = req.payload.seed ?? 0;
      const worldSize = req.payload.worldSize ?? 512;
      const cx = req.payload.chunkX ?? 0;
      const cy = req.payload.chunkY ?? 0;
      const cz = req.payload.chunkZ ?? 0;
      const gen = getGenerator(seed, worldSize);
      const data = gen.generateChunkData(cx, cy, cz);
      const buffer = data.buffer;
      const res: WorkerResponse = {
        id: req.id,
        type: 'CHUNK_DATA_GENERATED',
        payload: { chunkX: cx, chunkY: cy, chunkZ: cz, voxelBuffer: buffer as ArrayBuffer },
      };
      (self as any).postMessage(res, [buffer as ArrayBuffer]);
      return;
    }
    if (req.type === 'COMPILE_CHUNK_MESH') {
      const cx = req.payload.chunkX ?? 0;
      const cy = req.payload.chunkY ?? 0;
      const cz = req.payload.chunkZ ?? 0;
      const worldSize = req.payload.worldSize ?? 512;
      const buf = req.payload.voxelBuffer;
      if (!buf) throw new Error('voxelBuffer missing');
      const voxels = new Uint8Array(buf);
      const mesh = buildChunkMeshGreedy(voxels, cx, cy, cz, worldSize);
      const water = buildWaterChunkMesh(voxels, cx, cy, cz, worldSize);
      const cross = buildCrossMesh(BlockId.TORCH, cx, cy, cz, voxels, worldSize);
      const flowers = buildCrossMesh(BlockId.FLOWER_RED, cx, cy, cz, voxels, worldSize);
      const dandelions = buildCrossMesh(BlockId.FLOWER_YELLOW, cx, cy, cz, voxels, worldSize);

      const res: WorkerResponse = {
        id: req.id,
        type: 'MESH_COMPILED',
        payload: {
          chunkX: cx,
          chunkY: cy,
          chunkZ: cz,
          positions: mesh.positions,
          normals: mesh.normals,
          uvs: mesh.uvs,
          indices: mesh.indices,
          waterPositions: water.positions,
          waterNormals: water.normals,
          waterUvs: water.uvs,
          waterIndices: water.indices,
          crossPositions: mergeFloat([cross.positions, flowers.positions, dandelions.positions]),
          crossNormals: mergeFloat([cross.normals, flowers.normals, dandelions.normals]),
          crossUvs: mergeFloat([cross.uvs, flowers.uvs, dandelions.uvs]),
          crossIndices: mergeUint([cross.indices, offsetIndices(flowers.indices, cross.positions.length / 3), offsetIndices(dandelions.indices, cross.positions.length / 3 + flowers.positions.length / 3)]),
        },
      };
      (self as any).postMessage(res, [
        mesh.positions.buffer,
        mesh.normals.buffer,
        mesh.uvs.buffer,
        mesh.indices.buffer,
        water.positions.buffer,
        water.normals.buffer,
        water.uvs.buffer,
        water.indices.buffer,
        res.payload.crossPositions!.buffer,
        res.payload.crossNormals!.buffer,
        res.payload.crossUvs!.buffer,
        res.payload.crossIndices!.buffer,
      ]);
      return;
    }
    if (req.type === 'COMPILE_CHUNK_DELTA_MESH') {
      const cx = req.payload.chunkX ?? 0;
      const cy = req.payload.chunkY ?? 0;
      const cz = req.payload.chunkZ ?? 0;
      const worldSize = req.payload.worldSize ?? 512;
      const buf = req.payload.voxelBuffer;
      const dBuf = req.payload.deltaBuffer;
      if (!buf || !dBuf) throw new Error('buffers missing');
      const voxels = new Uint8Array(buf);
      const deltas = JSON.parse(new TextDecoder().decode(dBuf));
      const merged = applyChunkDelta(voxels, deltas);
      const mesh = buildChunkMeshGreedy(merged, cx, cy, cz, worldSize);
      const water = buildWaterChunkMesh(merged, cx, cy, cz, worldSize);
      const cross = buildCrossMesh(BlockId.TORCH, cx, cy, cz, merged, worldSize);
      const flowers = buildCrossMesh(BlockId.FLOWER_RED, cx, cy, cz, merged, worldSize);
      const dandelions = buildCrossMesh(BlockId.FLOWER_YELLOW, cx, cy, cz, merged, worldSize);
      const res: WorkerResponse = {
        id: req.id,
        type: 'MESH_COMPILED',
        payload: {
          chunkX: cx,
          chunkY: cy,
          chunkZ: cz,
          positions: mesh.positions,
          normals: mesh.normals,
          uvs: mesh.uvs,
          indices: mesh.indices,
          waterPositions: water.positions,
          waterNormals: water.normals,
          waterUvs: water.uvs,
          waterIndices: water.indices,
          crossPositions: mergeFloat([cross.positions, flowers.positions, dandelions.positions]),
          crossNormals: mergeFloat([cross.normals, flowers.normals, dandelions.normals]),
          crossUvs: mergeFloat([cross.uvs, flowers.uvs, dandelions.uvs]),
          crossIndices: mergeUint([cross.indices, offsetIndices(flowers.indices, cross.positions.length / 3), offsetIndices(dandelions.indices, cross.positions.length / 3 + flowers.positions.length / 3)]),
        },
      };
      (self as any).postMessage(res, [
        mesh.positions.buffer,
        mesh.normals.buffer,
        mesh.uvs.buffer,
        mesh.indices.buffer,
        water.positions.buffer,
        water.normals.buffer,
        water.uvs.buffer,
        water.indices.buffer,
        res.payload.crossPositions!.buffer,
        res.payload.crossNormals!.buffer,
        res.payload.crossUvs!.buffer,
        res.payload.crossIndices!.buffer,
      ]);
      return;
    }
  } catch (err: any) {
    const res: WorkerResponse = { id: req.id, type: 'ERROR', payload: { message: err?.message ?? String(err) } };
    (self as any).postMessage(res);
  }
});

function mergeFloat(arrs: Float32Array[]): Float32Array {
  let total = 0;
  for (const a of arrs) total += a.length;
  const out = new Float32Array(total);
  let off = 0;
  for (const a of arrs) {
    out.set(a, off);
    off += a.length;
  }
  return out;
}

function mergeUint(arrs: Uint32Array[]): Uint32Array {
  let total = 0;
  for (const a of arrs) total += a.length;
  const out = new Uint32Array(total);
  let off = 0;
  for (const a of arrs) {
    out.set(a, off);
    off += a.length;
  }
  return out;
}

function offsetIndices(indices: Uint32Array, offset: number): Uint32Array {
  const out = new Uint32Array(indices.length);
  for (let i = 0; i < indices.length; i++) out[i] = indices[i] + offset;
  return out;
}