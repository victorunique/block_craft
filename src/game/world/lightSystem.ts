import { blockEmitsLight } from '../../config/blocks';

export const MAX_LIGHT_LEVEL = 15;
export const MONSTER_SPAWN_LIGHT_THRESHOLD = 4;

const SCAN_RADIUS = 16;

export function computeLightLevel(getBlock: (x: number, y: number, z: number) => number, x: number, y: number, z: number, sunLight: number): number {
  let level = sunLight;
  const own = blockEmitsLight(getBlock(x, y, z));
  if (own > level) level = own;
  const sources: Array<[number, number, number, number]> = [];
  for (let dy = -SCAN_RADIUS; dy <= SCAN_RADIUS; dy++) {
    for (let dz = -SCAN_RADIUS; dz <= SCAN_RADIUS; dz++) {
      for (let dx = -SCAN_RADIUS; dx <= SCAN_RADIUS; dx++) {
        if (dx === 0 && dy === 0 && dz === 0) continue;
        const b = getBlock(x + dx, y + dy, z + dz);
        const emit = blockEmitsLight(b);
        if (emit <= 0) continue;
        const dist = Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz));
        const contribution = Math.max(0, emit - dist);
        if (contribution > 0) sources.push([x + dx, y + dy, z + dz, contribution]);
      }
    }
  }
  if (sources.length === 0) {
    if (level > MAX_LIGHT_LEVEL) level = MAX_LIGHT_LEVEL;
    return Math.max(0, level);
  }
  const visited = new Map<string, number>();
  const queue: Array<[number, number, number, number]> = sources.slice();
  for (const s of sources) {
    const key = `${s[0]},${s[1]},${s[2]}`;
    const prev = visited.get(key);
    if (prev === undefined || prev < s[3]) visited.set(key, s[3]);
  }
  while (queue.length > 0) {
    const [bx, by, bz, bl] = queue.shift()!;
    if (bl <= 0) continue;
    for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]] as const) {
      const nx = bx + dx;
      const ny = by + dy;
      const nz = bz + dz;
      const key = `${nx},${ny},${nz}`;
      const propagated = bl - 1;
      if (propagated <= 0) continue;
      const prev = visited.get(key);
      if (prev !== undefined && prev >= propagated) continue;
      visited.set(key, propagated);
      if (propagated > level) level = propagated;
      queue.push([nx, ny, nz, propagated]);
    }
  }
  if (level > MAX_LIGHT_LEVEL) level = MAX_LIGHT_LEVEL;
  if (level < 0) level = 0;
  return level;
}

export function canMonstersSpawnAt(getBlock: (x: number, y: number, z: number) => number, x: number, y: number, z: number, sunLight: number): boolean {
  return computeLightLevel(getBlock, x, y, z, sunLight) < MONSTER_SPAWN_LIGHT_THRESHOLD;
}