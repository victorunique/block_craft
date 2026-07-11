import type { AABB } from './types';
import { isSolid, isLiquid } from '../../config/blocks';
import { PLAYER_HEIGHT, PLAYER_WIDTH } from '../../config/constants';

export interface BlockLookup {
  (x: number, y: number, z: number): number;
}

export function blockAABB(x: number, y: number, z: number): AABB {
  return { min: [x, y, z], max: [x + 1, y + 1, z + 1] };
}

export function aabbOverlap(a: AABB, b: AABB): boolean {
  return a.min[0] < b.max[0] && a.max[0] > b.min[0] && a.min[1] < b.max[1] && a.max[1] > b.min[1] && a.min[2] < b.max[2] && a.max[2] > b.min[2];
}

export function expandAABB(a: AABB, dx: number, dy: number, dz: number): AABB {
  return { min: [a.min[0] - dx, a.min[1] - dy, a.min[2] - dz], max: [a.max[0] + dx, a.max[1] + dy, a.max[2] + dz] };
}

export function collidesWithWorld(box: AABB, getBlock: BlockLookup): boolean {
  const minX = Math.floor(box.min[0]);
  const maxX = Math.floor(box.max[0] - 1e-6);
  const minY = Math.floor(box.min[1]);
  const maxY = Math.floor(box.max[1] - 1e-6);
  const minZ = Math.floor(box.min[2]);
  const maxZ = Math.floor(box.max[2] - 1e-6);
  for (let y = minY; y <= maxY; y++) {
    for (let z = minZ; z <= maxZ; z++) {
      for (let x = minX; x <= maxX; x++) {
        const b = getBlock(x, y, z);
        if (isSolid(b) && aabbOverlap(box, blockAABB(x, y, z))) return true;
      }
    }
  }
  return false;
}

export function isInLiquid(box: AABB, getBlock: BlockLookup): boolean {
  const cx = Math.floor((box.min[0] + box.max[0]) / 2);
  const cy = Math.floor(box.min[1] + 0.3);
  const cz = Math.floor((box.min[2] + box.max[2]) / 2);
  return isLiquid(getBlock(cx, cy, cz));
}

export function createPlayerAABB(pos: [number, number, number], width = PLAYER_WIDTH, height = PLAYER_HEIGHT): AABB {
  const halfW = width / 2;
  return {
    min: [pos[0] - halfW, pos[1], pos[2] - halfW],
    max: [pos[0] + halfW, pos[1] + height, pos[2] + halfW],
  };
}