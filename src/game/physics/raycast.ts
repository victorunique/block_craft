import * as THREE from 'three';
import { INTERACTION_REACH } from '../../config/constants';
import { isSolid } from '../../config/blocks';
import type { BlockLookup } from './aabb';

export interface RaycastHit {
  position: [number, number, number];
  normal: [number, number, number];
  block: number;
}

const FACES: Array<{ dir: [number, number, number]; normal: [number, number, number] }> = [
  { dir: [1, 0, 0], normal: [1, 0, 0] },
  { dir: [-1, 0, 0], normal: [-1, 0, 0] },
  { dir: [0, 1, 0], normal: [0, 1, 0] },
  { dir: [0, -1, 0], normal: [0, -1, 0] },
  { dir: [0, 0, 1], normal: [0, 0, 1] },
  { dir: [0, 0, -1], normal: [0, 0, -1] },
];

export function raycastVoxel(origin: [number, number, number], direction: [number, number, number], getBlock: BlockLookup, maxDist = INTERACTION_REACH): RaycastHit | null {
  const ox = origin[0];
  const oy = origin[1];
  const oz = origin[2];
  let dx = direction[0];
  let dy = direction[1];
  let dz = direction[2];
  const len = Math.hypot(dx, dy, dz);
  if (len === 0) return null;
  dx /= len;
  dy /= len;
  dz /= len;

  let x = Math.floor(ox);
  let y = Math.floor(oy);
  let z = Math.floor(oz);

  const stepX = dx > 0 ? 1 : -1;
  const stepY = dy > 0 ? 1 : -1;
  const stepZ = dz > 0 ? 1 : -1;

  const tDeltaX = dx === 0 ? Infinity : Math.abs(1 / dx);
  const tDeltaY = dy === 0 ? Infinity : Math.abs(1 / dy);
  const tDeltaZ = dz === 0 ? Infinity : Math.abs(1 / dz);

  const fracX = dx > 0 ? 1 - (ox - Math.floor(ox)) : ox - Math.floor(ox);
  const fracY = dy > 0 ? 1 - (oy - Math.floor(oy)) : oy - Math.floor(oy);
  const fracZ = dz > 0 ? 1 - (oz - Math.floor(oz)) : oz - Math.floor(oz);

  let tMaxX = dx === 0 ? Infinity : tDeltaX * fracX;
  let tMaxY = dy === 0 ? Infinity : tDeltaY * fracY;
  let tMaxZ = dz === 0 ? Infinity : tDeltaZ * fracZ;

  let lastNormal: [number, number, number] = [0, 0, 0];
  let t = 0;

  while (t <= maxDist) {
    const block = getBlock(x, y, z);
    if (isSolid(block)) {
      return {
        position: [x, y, z],
        normal: lastNormal,
        block,
      };
    }
    if (tMaxX < tMaxY && tMaxX < tMaxZ) {
      x += stepX;
      t = tMaxX;
      tMaxX += tDeltaX;
      lastNormal = stepX > 0 ? [-1, 0, 0] : [1, 0, 0];
    } else if (tMaxY < tMaxZ) {
      y += stepY;
      t = tMaxY;
      tMaxY += tDeltaY;
      lastNormal = stepY > 0 ? [0, -1, 0] : [0, 1, 0];
    } else {
      z += stepZ;
      t = tMaxZ;
      tMaxZ += tDeltaZ;
      lastNormal = stepZ > 0 ? [0, 0, -1] : [0, 0, 1];
    }
  }
  return null;
}

export function raycastFromCamera(camera: THREE.Camera, getBlock: BlockLookup, maxDist = INTERACTION_REACH): RaycastHit | null {
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  const origin: [number, number, number] = [camera.position.x, camera.position.y, camera.position.z];
  return raycastVoxel(origin, [dir.x, dir.y, dir.z], getBlock, maxDist);
}

export function placeTargetFromHit(hit: RaycastHit): [number, number, number] {
  return [hit.position[0] + hit.normal[0], hit.position[1] + hit.normal[1], hit.position[2] + hit.normal[2]];
}