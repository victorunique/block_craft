import type { NoiseContext } from './simplex';
import { CHUNK_SIZE, SEALEVEL } from '../../config/constants';
import { BlockId } from '../../config/blocks';
import { mulberry32, hashSeed } from '../../utils/rng';
import { getHeightAt, getBiomeAt } from './heightmap';

interface TreePlacement {
  x: number;
  y: number;
  z: number;
  height: number;
  kind: 'oak' | 'pine';
}

export function generateTrees(ctx: NoiseContext, seed: number, worldSize: number): TreePlacement[] {
  const trees: TreePlacement[] = [];
  const rng = mulberry32(hashSeed(seed + 991));
  const half = worldSize / 2;
  const count = Math.floor((worldSize * worldSize) / 600);
  for (let i = 0; i < count; i++) {
    const lx = Math.floor(rng() * worldSize) - half;
    const lz = Math.floor(rng() * worldSize) - half;
    const h = getHeightAt(ctx, lx, lz);
    const biome = getBiomeAt(ctx, lx, lz, h);
    if (h <= SEALEVEL) continue;
    const kind: 'oak' | 'pine' = biome === 'snow' || biome === 'mountains' ? 'pine' : rng() < 0.7 ? 'oak' : 'pine';
    if (biome === 'desert') continue;
    const treeHeight = kind === 'pine' ? 5 + Math.floor(rng() * 4) : 4 + Math.floor(rng() * 3);
    trees.push({ x: lx, y: h + 1, z: lz, height: treeHeight, kind });
  }
  return trees;
}

export function placeTreeIntoChunk(chunkData: Uint8Array, chunkX: number, chunkY: number, chunkZ: number, tree: TreePlacement): void {
  const lx = ((tree.x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
  const lz = ((tree.z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
  if (tree.y < chunkY * CHUNK_SIZE || tree.y >= (chunkY + 1) * CHUNK_SIZE) return;
  if (tree.x < chunkX * CHUNK_SIZE || tree.x >= (chunkX + 1) * CHUNK_SIZE) return;
  if (tree.z < chunkZ * CHUNK_SIZE || tree.z >= (chunkZ + 1) * CHUNK_SIZE) return;
  const setBlock = (x: number, y: number, z: number, id: number) => {
    if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE) return;
    chunkData[x + y * CHUNK_SIZE + z * CHUNK_SIZE * CHUNK_SIZE] = id;
  };
  const trunkId = tree.kind === 'pine' ? BlockId.PINE_WOOD : BlockId.WOOD;
  const leavesId = tree.kind === 'pine' ? BlockId.PINE_LEAVES : BlockId.LEAVES;
  for (let i = 0; i < tree.height; i++) {
    setBlock(lx, tree.y + i - chunkY * CHUNK_SIZE, lz, trunkId);
  }
  if (tree.kind === 'pine') {
    for (let dy = -1; dy <= 2; dy++) {
      const radius = dy === 2 ? 1 : 2;
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dz = -radius; dz <= radius; dz++) {
          if (Math.abs(dx) === radius && Math.abs(dz) === radius) continue;
          setBlock(lx + dx, tree.y + tree.height + dy - chunkY * CHUNK_SIZE, lz + dz, leavesId);
        }
      }
    }
  } else {
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        for (let dy = 0; dy <= 2; dy++) {
          if (Math.abs(dx) === 2 && Math.abs(dz) === 2 && dy < 2) continue;
          setBlock(lx + dx, tree.y + tree.height - 1 + dy - chunkY * CHUNK_SIZE, lz + dz, leavesId);
        }
      }
    }
  }
}

export function generateDecorations(ctx: NoiseContext, seed: number, worldSize: number): { x: number; y: number; z: number; id: number }[] {
  const out: { x: number; y: number; z: number; id: number }[] = [];
  const rng = mulberry32(hashSeed(seed + 3337));
  const half = worldSize / 2;
  const count = Math.floor((worldSize * worldSize) / 1500);
  for (let i = 0; i < count; i++) {
    const lx = Math.floor(rng() * worldSize) - half;
    const lz = Math.floor(rng() * worldSize) - half;
    const h = getHeightAt(ctx, lx, lz);
    const biome = getBiomeAt(ctx, lx, lz, h);
    if (h <= SEALEVEL) continue;
    if (biome === 'plains') {
      out.push({ x: lx, y: h + 1, z: lz, id: rng() < 0.5 ? BlockId.FLOWER_RED : BlockId.FLOWER_YELLOW });
    } else if (biome === 'desert') {
      if (rng() < 0.3) out.push({ x: lx, y: h + 1, z: lz, id: BlockId.CACTUS });
    }
  }
  return out;
}

export function placeDecorationIntoChunk(chunkData: Uint8Array, chunkX: number, chunkY: number, chunkZ: number, dec: { x: number; y: number; z: number; id: number }): void {
  if (dec.x < chunkX * CHUNK_SIZE || dec.x >= (chunkX + 1) * CHUNK_SIZE) return;
  if (dec.z < chunkZ * CHUNK_SIZE || dec.z >= (chunkZ + 1) * CHUNK_SIZE) return;
  if (dec.y < chunkY * CHUNK_SIZE || dec.y >= (chunkY + 1) * CHUNK_SIZE) return;
  const lx = ((dec.x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
  const ly = dec.y - chunkY * CHUNK_SIZE;
  const lz = ((dec.z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
  chunkData[lx + ly * CHUNK_SIZE + lz * CHUNK_SIZE * CHUNK_SIZE] = dec.id;
}