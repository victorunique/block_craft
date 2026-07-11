import { CHUNK_SIZE, SEALEVEL, WORLD_DEPTH } from '../../config/constants';
import { BlockId } from '../../config/blocks';
import { mulberry32, hashSeed } from '../../utils/rng';
import { createNoiseContext, type NoiseContext } from './simplex';
import { getHeightAt, getBiomeAt, SUBSURFACE_BLOCKS, SURFACE_BLOCKS, isCaveAt } from './heightmap';
import { generateTrees, placeTreeIntoChunk, generateDecorations, placeDecorationIntoChunk } from './trees';

export interface TerrainGenerator {
  seed: number;
  worldSize: number;
  getHeightAt: (x: number, z: number) => number;
  getBiomeAt: (x: number, z: number) => 'plains' | 'forest' | 'desert' | 'snow' | 'mountains';
  generateChunkData: (chunkX: number, chunkY: number, chunkZ: number) => Uint8Array;
}

interface OreVein {
  blockId: number;
  maxY: number;
  veinSize: number;
  veinsPerChunk: number;
}

const ORES: OreVein[] = [
  { blockId: BlockId.COAL_ORE, maxY: 80, veinSize: 8, veinsPerChunk: 12 },
  { blockId: BlockId.IRON_ORE, maxY: 60, veinSize: 6, veinsPerChunk: 8 },
  { blockId: BlockId.GOLD_ORE, maxY: 32, veinSize: 4, veinsPerChunk: 4 },
  { blockId: BlockId.DIAMOND_ORE, maxY: 16, veinSize: 3, veinsPerChunk: 2 },
];

function fillOres(chunkData: Uint8Array, chunkX: number, chunkY: number, chunkZ: number, rng: () => number) {
  for (const ore of ORES) {
    const baseY = chunkY * CHUNK_SIZE;
    if (baseY > ore.maxY) continue;
    for (let v = 0; v < ore.veinsPerChunk; v++) {
      const cx = Math.floor(rng() * CHUNK_SIZE);
      const cy = Math.floor(rng() * Math.min(CHUNK_SIZE, ore.maxY - baseY + 1));
      const cz = Math.floor(rng() * CHUNK_SIZE);
      const size = 1 + Math.floor(rng() * ore.veinSize);
      for (let s = 0; s < size; s++) {
        const x = cx + Math.floor(rng() * 3) - 1;
        const y = cy + Math.floor(rng() * 2);
        const z = cz + Math.floor(rng() * 3) - 1;
        if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE) continue;
        const idx = x + y * CHUNK_SIZE + z * CHUNK_SIZE * CHUNK_SIZE;
        if (chunkData[idx] === BlockId.STONE) chunkData[idx] = ore.blockId;
      }
    }
  }
}

export function createTerrainGenerator(seed: number, worldSize: number): TerrainGenerator {
  const ctx = createNoiseContext(seed);
  const treeRng = mulberry32(hashSeed(seed + 991));
  const decRng = mulberry32(hashSeed(seed + 3337));
  const treeCells = new Map<string, { x: number; z: number; y: number; height: number; kind: 'oak' | 'pine' }>();
  const half = worldSize / 2;

  return {
    seed,
    worldSize,
    getHeightAt: (x, z) => getHeightAt(ctx, x, z),
    getBiomeAt: (x, z) => getBiomeAt(ctx, x, z, getHeightAt(ctx, x, z)),
    generateChunkData: (chunkX, chunkY, chunkZ) => {
      const data = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_SIZE);
      const rng = mulberry32(hashSeed(seed + chunkX * 73856093 + chunkY * 19349663 + chunkZ * 83492791));

      for (let lz = 0; lz < CHUNK_SIZE; lz++) {
        for (let lx = 0; lx < CHUNK_SIZE; lx++) {
          const wx = chunkX * CHUNK_SIZE - half + lx;
          const wz = chunkZ * CHUNK_SIZE - half + lz;
          const height = getHeightAt(ctx, wx, wz);
          const biome = getBiomeAt(ctx, wx, wz, height);
          const surfaceBlock = SURFACE_BLOCKS[biome];
          const subBlock = SUBSURFACE_BLOCKS[biome];
          for (let ly = 0; ly < CHUNK_SIZE; ly++) {
            const wy = chunkY * CHUNK_SIZE + ly;
            if (wy < 0 || wy >= WORLD_DEPTH) continue;
            if (wy === 0) {
              data[lx + ly * CHUNK_SIZE + lz * CHUNK_SIZE * CHUNK_SIZE] = BlockId.BEDROCK;
              continue;
            }
            if (wy > height) {
              if (wy <= SEALEVEL) {
                data[lx + ly * CHUNK_SIZE + lz * CHUNK_SIZE * CHUNK_SIZE] = BlockId.WATER;
              } else {
                data[lx + ly * CHUNK_SIZE + lz * CHUNK_SIZE * CHUNK_SIZE] = BlockId.AIR;
              }
              continue;
            }
            if (wy === height) {
              if (biome === 'snow' && height < SEALEVEL + 26) {
                data[lx + ly * CHUNK_SIZE + lz * CHUNK_SIZE * CHUNK_SIZE] = surfaceBlock;
              } else if (height >= SEALEVEL + 18 && biome !== 'desert') {
                data[lx + ly * CHUNK_SIZE + lz * CHUNK_SIZE * CHUNK_SIZE] = BlockId.STONE;
              } else if (height <= SEALEVEL - 1) {
                data[lx + ly * CHUNK_SIZE + lz * CHUNK_SIZE * CHUNK_SIZE] = subBlock;
              } else {
                data[lx + ly * CHUNK_SIZE + lz * CHUNK_SIZE * CHUNK_SIZE] = surfaceBlock;
              }
              continue;
            }
            if (wy >= height - 3) {
              data[lx + ly * CHUNK_SIZE + lz * CHUNK_SIZE * CHUNK_SIZE] = subBlock;
              continue;
            }
            if (isCaveAt(ctx, wx, wy, wz) && wy > 1) {
              data[lx + ly * CHUNK_SIZE + lz * CHUNK_SIZE * CHUNK_SIZE] = BlockId.AIR;
              continue;
            }
            data[lx + ly * CHUNK_SIZE + lz * CHUNK_SIZE * CHUNK_SIZE] = BlockId.STONE;
          }
        }
      }

      fillOres(data, chunkX, chunkY, chunkZ, rng);

      if (chunkY === Math.floor(SEALEVEL / CHUNK_SIZE)) {
        const oreRng = mulberry32(hashSeed(seed + chunkX * 19349663 + chunkZ * 73856093));
        for (let lz = 0; lz < CHUNK_SIZE; lz++) {
          for (let lx = 0; lx < CHUNK_SIZE; lx++) {
            const wx = chunkX * CHUNK_SIZE + lx;
            const wz = chunkZ * CHUNK_SIZE + lz;
            const ly = SEALEVEL - 2 - chunkY * CHUNK_SIZE;
            const idx = lx + ly * CHUNK_SIZE + lz * CHUNK_SIZE * CHUNK_SIZE;
            const surfaceIdx = lx + (ly + 1) * CHUNK_SIZE + lz * CHUNK_SIZE * CHUNK_SIZE;
            if (surfaceIdx >= 0 && surfaceIdx < data.length && data[surfaceIdx] === BlockId.SAND && oreRng() < 0.04) {
              if (ly >= 0 && ly < CHUNK_SIZE) data[idx] = BlockId.CLAY;
            }
          }
        }
      }

      const treesHere = generateTrees(ctx, seed, worldSize);
      for (const t of treesHere) {
        placeTreeIntoChunk(data, chunkX, chunkY, chunkZ, t, worldSize);
      }
      const decs = generateDecorations(ctx, seed, worldSize);
      for (const d of decs) {
        placeDecorationIntoChunk(data, chunkX, chunkY, chunkZ, d, worldSize);
      }
      return data;
    },
  };
}