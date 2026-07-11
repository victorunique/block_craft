/**
 * Runtime helper for testing the chunkWorker module without spinning up a real Web Worker.
 * It re-uses the same handler logic but injects a fake postMessage and a self-mock.
 */
import { createTerrainGenerator } from '../game/terrain/terrainGenerator';
import { buildChunkMeshGreedy, buildWaterChunkMesh, buildCrossMesh, applyChunkDelta } from '../game/rendering/chunkBuilder';
import { BlockId } from '../config/blocks';
import type { WorkerRequest, WorkerResponse } from './chunkWorker';

export type { WorkerRequest, WorkerResponse } from './chunkWorker';

interface HandlerContext {
  postMessage: (msg: WorkerResponse, transfer?: any[]) => void;
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

export function chunkWorkerHandler(ctx: HandlerContext) {
  return {
    message: async (event: { data: WorkerRequest }) => {
      const req = event.data;
      try {
        if (req.type === 'INIT_SEED') {
          const seed = req.payload.seed ?? 0;
          const worldSize = req.payload.worldSize ?? 512;
          getGenerator(seed, worldSize);
          ctx.postMessage({ id: req.id, type: 'INIT_SUCCESS', payload: { message: `seed=${seed}` } });
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
          const buffer = data.buffer as ArrayBuffer;
          ctx.postMessage({ id: req.id, type: 'CHUNK_DATA_GENERATED', payload: { chunkX: cx, chunkY: cy, chunkZ: cz, voxelBuffer: buffer } });
          return;
        }
        if (req.type === 'COMPILE_CHUNK_MESH' || req.type === 'COMPILE_CHUNK_DELTA_MESH') {
          const cx = req.payload.chunkX ?? 0;
          const cy = req.payload.chunkY ?? 0;
          const cz = req.payload.chunkZ ?? 0;
          const worldSize = req.payload.worldSize ?? 512;
          const buf = req.payload.voxelBuffer;
          if (!buf) throw new Error('voxelBuffer missing');
          let voxels = new Uint8Array(buf);
          if (req.type === 'COMPILE_CHUNK_DELTA_MESH') {
            const dBuf = req.payload.deltaBuffer;
            if (!dBuf) throw new Error('deltaBuffer missing');
            const deltas = JSON.parse(new TextDecoder().decode(dBuf));
            voxels = applyChunkDelta(voxels, deltas);
          }
          const mesh = buildChunkMeshGreedy(voxels, cx, cy, cz, worldSize);
          const water = buildWaterChunkMesh(voxels, cx, cy, cz, worldSize);
          const cross = buildCrossMesh(BlockId.TORCH, cx, cy, cz, voxels, worldSize);
          const flowers = buildCrossMesh(BlockId.FLOWER_RED, cx, cy, cz, voxels, worldSize);
          const dandelions = buildCrossMesh(BlockId.FLOWER_YELLOW, cx, cy, cz, voxels, worldSize);
          ctx.postMessage({
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
          });
          return;
        }
      } catch (err: any) {
        ctx.postMessage({ id: req.id, type: 'ERROR', payload: { message: err?.message ?? String(err) } });
      }
    },
  };
}

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