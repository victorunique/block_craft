import * as THREE from 'three';
import { CHUNK_SIZE, CHUNK_VOLUME } from '../../config/constants';
import { BlockId, isAir, isTransparent, isLiquid } from '../../config/blocks';
import { blockAllFacesUV, blockFaceUV, tileUV, ATLAS_MAP, type AtlasFaceSlot } from './textureAtlas';

export interface ChunkMeshBuffers {
  positions: Float32Array;
  normals: Float32Array;
  uvs: Float32Array;
  indices: Uint32Array;
  vertexCount: number;
  indexCount: number;
}

const FACES = {
  top: { dir: [0, 1, 0], corners: [[0, 1, 0], [1, 1, 0], [1, 1, 1], [0, 1, 1]] },
  bottom: { dir: [0, -1, 0], corners: [[0, 0, 1], [1, 0, 1], [1, 0, 0], [0, 0, 0]] },
  north: { dir: [0, 0, -1], corners: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]] },
  south: { dir: [0, 0, 1], corners: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]] },
  west: { dir: [-1, 0, 0], corners: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]] },
  east: { dir: [1, 0, 0], corners: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]] },
} as const;

type FaceKey = keyof typeof FACES;

const FACE_NORMAL: Record<FaceKey, [number, number, number]> = {
  top: [0, 1, 0],
  bottom: [0, -1, 0],
  north: [0, 0, -1],
  south: [0, 0, 1],
  west: [-1, 0, 0],
  east: [1, 0, 0],
};

const FACE_UV_INDEX: Record<FaceKey, 'top' | 'side' | 'bottom'> = {
  top: 'top',
  bottom: 'bottom',
  north: 'side',
  south: 'side',
  west: 'side',
  east: 'side',
};

function isFaceExposed(blockA: number, blockB: number): boolean {
  if (blockB === 0) return true;
  if (isLiquid(blockA) && isLiquid(blockB)) return false;
  if (isTransparent(blockB) && !isLiquid(blockB)) return true;
  if (isLiquid(blockB) && !isLiquid(blockA)) return true;
  if (isTransparent(blockA) && !isLiquid(blockA) && !isTransparent(blockB)) return true;
  return false;
}

interface BuilderState {
  positions: number[];
  normals: number[];
  uvs: number[];
  indices: number[];
}

function pushFace(state: BuilderState, baseX: number, baseY: number, baseZ: number, face: FaceKey, uv: { u0: number; v0: number; u1: number; v1: number }, sizeX = 1, sizeZ = 1, faceY = 0) {
  const faceDef = FACES[face];
  const normal = FACE_NORMAL[face];
  const startIndex = state.positions.length / 3;
  for (const corner of faceDef.corners) {
    let x = corner[0];
    let y = corner[1];
    let z = corner[2];
    if (face === 'top' || face === 'bottom') {
      x = corner[0] * sizeX;
      z = corner[2] * sizeZ;
    } else {
      if (corner[2] !== corner[0]) {
        z = corner[2] * sizeZ;
      } else {
        x = corner[0] * sizeX;
      }
      y = corner[1];
    }
    state.positions.push(baseX + x, baseY + y + faceY, baseZ + z);
    state.normals.push(normal[0], normal[1], normal[2]);
  }
  state.uvs.push(uv.u0, uv.v0, uv.u1, uv.v0, uv.u1, uv.v1, uv.u0, uv.v1);
  state.indices.push(startIndex, startIndex + 1, startIndex + 2, startIndex, startIndex + 2, startIndex + 3);
}

function getVoxel(voxels: Uint8Array, x: number, y: number, z: number): number {
  if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE) return 0;
  return voxels[x + y * CHUNK_SIZE + z * CHUNK_SIZE * CHUNK_SIZE];
}

function getNeighbor(voxels: Uint8Array, x: number, y: number, z: number, face: FaceKey): number {
  const d = FACES[face].dir;
  return getVoxel(voxels, x + d[0], y + d[1], z + d[2]);
}

export function buildChunkMeshGreedy(voxels: Uint8Array, chunkX: number, chunkY: number, chunkZ: number, worldSize = 512): ChunkMeshBuffers {
  const state: BuilderState = { positions: [], normals: [], uvs: [], indices: [] };
  const half = worldSize / 2;

  for (let y = 0; y < CHUNK_SIZE; y++) {
    for (let z = 0; z < CHUNK_SIZE; z++) {
      for (let x = 0; x < CHUNK_SIZE; x++) {
        const block = voxels[x + y * CHUNK_SIZE + z * CHUNK_SIZE * CHUNK_SIZE];
        if (block === 0) continue;
        const mapEntry = ATLAS_MAP[block];
        const isCross = mapEntry && 'pattern' in mapEntry && (mapEntry.pattern === 'cross' || mapEntry.pattern === 'plant' || mapEntry.pattern === 'torch');
        if (isCross) continue;

        const wx = chunkX * CHUNK_SIZE - half + x;
        const wy = chunkY * CHUNK_SIZE + y;
        const wz = chunkZ * CHUNK_SIZE - half + z;

        for (const face of Object.keys(FACES) as FaceKey[]) {
          const neighbor = getNeighbor(voxels, x, y, z, face);
          if (!isFaceExposed(block, neighbor)) continue;
          const uv = blockFaceUV(block, FACE_UV_INDEX[face]) ?? blockAllFacesUV(block);
          if (!uv) continue;
          pushFace(state, wx, wy, wz, face, uv);
        }
      }
    }
  }

  return finalizeBuffers(state);
}

export function buildWaterChunkMesh(voxels: Uint8Array, chunkX: number, chunkY: number, chunkZ: number, worldSize = 512): ChunkMeshBuffers {
  const state: BuilderState = { positions: [], normals: [], uvs: [], indices: [] };
  const waterUV = tileUV(0, 3);
  const half = worldSize / 2;
  for (let y = 0; y < CHUNK_SIZE; y++) {
    for (let z = 0; z < CHUNK_SIZE; z++) {
      for (let x = 0; x < CHUNK_SIZE; x++) {
        const block = voxels[x + y * CHUNK_SIZE + z * CHUNK_SIZE * CHUNK_SIZE];
        if (block !== BlockId.WATER) continue;
        const wx = chunkX * CHUNK_SIZE - half + x;
        const wy = chunkY * CHUNK_SIZE + y;
        const wz = chunkZ * CHUNK_SIZE - half + z;
        const topNeighbor = getNeighbor(voxels, x, y, z, 'top');
        if (!isLiquid(topNeighbor) || topNeighbor === 0) {
          pushFace(state, wx, wy, wz, 'top', waterUV);
        }
      }
    }
  }
  return finalizeBuffers(state);
}

export function buildCrossMesh(blockId: number, chunkX: number, chunkY: number, chunkZ: number, voxels: Uint8Array, worldSize = 512): ChunkMeshBuffers {
  const state: BuilderState = { positions: [], normals: [], uvs: [], indices: [] };
  const uv = tileUV(14, 2);
  const half = worldSize / 2;
  for (let y = 0; y < CHUNK_SIZE; y++) {
    for (let z = 0; z < CHUNK_SIZE; z++) {
      for (let x = 0; x < CHUNK_SIZE; x++) {
        if (voxels[x + y * CHUNK_SIZE + z * CHUNK_SIZE * CHUNK_SIZE] !== blockId) continue;
        const wx = chunkX * CHUNK_SIZE - half + x;
        const wy = chunkY * CHUNK_SIZE + y;
        const wz = chunkZ * CHUNK_SIZE - half + z;
        const pattern = (ATLAS_MAP[blockId] as any)?.pattern as AtlasFaceSlot;
        if (pattern === 'plant') {
          const plantUV = tileUV(blockId === BlockId.FLOWER_RED ? 14 : 15, 2);
          addCrossQuad(state, wx, wy, wz, plantUV, 0.4);
        } else if (pattern === 'torch') {
          const torchUV = tileUV(12, 3);
          addCrossQuad(state, wx, wy, wz, torchUV, 0.15, 0.6);
        }
      }
    }
  }
  return finalizeBuffers(state);
}

function addCrossQuad(state: BuilderState, wx: number, wy: number, wz: number, uv: { u0: number; v0: number; u1: number; v1: number }, half: number, height = 1) {
  const startIndex = state.positions.length / 3;
  const corners = [
    [wx - half, wy, wz - half],
    [wx + half, wy, wz + half],
    [wx + half, wy + height, wz + half],
    [wx - half, wy + height, wz - half],
  ];
  for (const c of corners) {
    state.positions.push(c[0], c[1], c[2]);
    state.normals.push(0, 0, 1);
  }
  state.uvs.push(uv.u0, uv.v0, uv.u1, uv.v0, uv.u1, uv.v1, uv.u0, uv.v1);
  state.indices.push(startIndex, startIndex + 1, startIndex + 2, startIndex, startIndex + 2, startIndex + 3);

  const start2 = state.positions.length / 3;
  const corners2 = [
    [wx - half, wy, wz + half],
    [wx + half, wy, wz - half],
    [wx + half, wy + height, wz - half],
    [wx - half, wy + height, wz + half],
  ];
  for (const c of corners2) {
    state.positions.push(c[0], c[1], c[2]);
    state.normals.push(0, 0, -1);
  }
  state.uvs.push(uv.u0, uv.v0, uv.u1, uv.v0, uv.u1, uv.v1, uv.u0, uv.v1);
  state.indices.push(start2, start2 + 1, start2 + 2, start2, start2 + 2, start2 + 3);
}

function finalizeBuffers(state: BuilderState): ChunkMeshBuffers {
  const positions = new Float32Array(state.positions);
  const normals = new Float32Array(state.normals);
  const uvs = new Float32Array(state.uvs);
  const indices = new Uint32Array(state.indices);
  return {
    positions,
    normals,
    uvs,
    indices,
    vertexCount: positions.length / 3,
    indexCount: indices.length,
  };
}

export function applyChunkDelta(voxels: Uint8Array, deltas: Record<string, number>): Uint8Array {
  const next = new Uint8Array(voxels);
  for (const [k, v] of Object.entries(deltas)) {
    const i = Number(k);
    if (i >= 0 && i < next.length) next[i] = v;
  }
  return next;
}