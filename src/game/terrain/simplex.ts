import { createNoise2D, createNoise3D, type NoiseFunction2D, type NoiseFunction3D } from 'simplex-noise';
import { hashSeed } from '../../utils/rng';

export interface NoiseContext {
  height2D: NoiseFunction2D;
  temperature2D: NoiseFunction2D;
  humidity2D: NoiseFunction2D;
  cave3D: NoiseFunction3D;
}

function seededRand(seed: number) {
  let s = hashSeed(seed);
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function createNoiseContext(seed: number): NoiseContext {
  const rng = seededRand(seed);
  return {
    height2D: createNoise2D(rng),
    temperature2D: createNoise2D(rng),
    humidity2D: createNoise2D(rng),
    cave3D: createNoise3D(rng),
  };
}