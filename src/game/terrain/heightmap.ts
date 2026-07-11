import type { NoiseContext } from './simplex';
import { BEDROCK_LEVEL, SEALEVEL, WORLD_DEPTH } from '../../config/constants';
import type { Biome } from '../../config/constants';
import { BlockId } from '../../config/blocks';

export interface HeightResult {
  height: number;
  biome: Biome;
  temperature: number;
  humidity: number;
}

export function getHeightAt(ctx: NoiseContext, x: number, z: number): number {
  const scale = 0.013;
  const base = (ctx.height2D(x * scale, z * scale) + 1) * 0.5;
  const detail = ctx.height2D(x * scale * 4, z * scale * 4) * 0.18;
  const mountainMask = Math.max(0, ctx.height2D(x * 0.003, z * 0.003));
  const mountainBoost = mountainMask * mountainMask * 36;
  const h = SEALEVEL - 8 + base * 22 + detail * 3 + mountainBoost;
  return Math.max(BEDROCK_LEVEL + 1, Math.min(WORLD_DEPTH - 4, Math.floor(h)));
}

export function getTemperatureAt(ctx: NoiseContext, x: number, z: number): number {
  const t = (ctx.temperature2D(x * 0.0025, z * 0.0025) + 1) * 0.5;
  const lat = 1 - Math.abs(z) / 2000;
  return Math.max(0, Math.min(1, t * 0.6 + lat * 0.4));
}

export function getHumidityAt(ctx: NoiseContext, x: number, z: number): number {
  const h = (ctx.humidity2D(x * 0.004, z * 0.004) + 1) * 0.5;
  return Math.max(0, Math.min(1, h));
}

export function getHumidityOnly(ctx: NoiseContext, x: number): number {
  return getHumidityAt(ctx, x, 0);
}

void getHumidityOnly;

export function getBiomeAt(ctx: NoiseContext, x: number, z: number, height: number): Biome {
  const temp = getTemperatureAt(ctx, x, z);
  const hum = getHumidityAt(ctx, x, z);
  if (height > SEALEVEL + 26) return 'mountains';
  if (temp < 0.18) return 'snow';
  if (temp > 0.65 && hum < 0.4) return 'desert';
  if (hum > 0.55) return 'forest';
  return 'plains';
}

export function getHeightAndBiomeAt(ctx: NoiseContext, x: number, z: number): HeightResult {
  const height = getHeightAt(ctx, x, z);
  const biome = getBiomeAt(ctx, x, z, height);
  return {
    height,
    biome,
    temperature: getTemperatureAt(ctx, x, z),
    humidity: getHumidityAt(ctx, x, z),
  };
}

export function caveDensity(ctx: NoiseContext, x: number, y: number, z: number): number {
  const s = 0.06;
  return ctx.cave3D(x * s, y * s, z * s);
}

export function caveDensityTest(): void {
  void caveDensity;
}

export function isCaveAt(ctx: NoiseContext, x: number, y: number, z: number): boolean {
  if (y <= BEDROCK_LEVEL + 1) return false;
  if (y > SEALEVEL - 4) return false;
  const v = caveDensity(ctx, x, y, z);
  return v > 0.55;
}

export const SURFACE_BLOCKS: Record<Biome, number> = {
  plains: BlockId.GRASS,
  forest: BlockId.GRASS,
  desert: BlockId.SAND,
  snow: BlockId.SNOW_LAYER,
  mountains: BlockId.STONE,
};

export const SUBSURFACE_BLOCKS: Record<Biome, number> = {
  plains: BlockId.DIRT,
  forest: BlockId.DIRT,
  desert: BlockId.SAND,
  snow: BlockId.DIRT,
  mountains: BlockId.STONE,
};

export function isMountainSurface(biome: Biome, height: number): boolean {
  return biome === 'mountains' || height > SEALEVEL + 18;
}