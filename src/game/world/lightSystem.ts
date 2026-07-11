import { blockEmitsLight } from '../../config/blocks';

export function computeLightLevel(getBlock: (x: number, y: number, z: number) => number, x: number, y: number, z: number, sunLight: number): number {
  let level = sunLight;
  const own = blockEmitsLight(getBlock(x, y, z));
  if (own > level) level = own;
  const radius = own > 0 ? own : 14;
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dz = -radius; dz <= radius; dz++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx === 0 && dy === 0 && dz === 0) continue;
        const b = getBlock(x + dx, y + dy, z + dz);
        const emit = blockEmitsLight(b);
        if (emit > 0) {
          const dist = Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz));
          const contribution = Math.max(0, emit - dist);
          if (contribution > level) level = contribution;
        }
      }
    }
  }
  if (level > 15) level = 15;
  if (level < 0) level = 0;
  return level;
}

export function canMonstersSpawnAt(getBlock: (x: number, y: number, z: number) => number, x: number, y: number, z: number, sunLight: number): boolean {
  return computeLightLevel(getBlock, x, y, z, sunLight) < 4;
}