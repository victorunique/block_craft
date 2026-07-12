import type { AABB } from './types';
import { collidesWithWorld, expandAABB, isInLiquid, type BlockLookup } from './aabb';
import { GRAVITY, JUMP_VELOCITY, TERMINAL_VELOCITY, WATER_DRAG } from '../../config/constants';
import { isLiquid } from '../../config/blocks';

export interface PhysicsResult {
  newPos: [number, number, number];
  newVel: [number, number, number];
  isOnGround: boolean;
  inLiquid: boolean;
}

export function createPlayerAABB(pos: [number, number, number], width = 0.6, height = 1.8): AABB {
  const halfW = width / 2;
  return {
    min: [pos[0] - halfW, pos[1], pos[2] - halfW],
    max: [pos[0] + halfW, pos[1] + height, pos[2] + halfW],
  };
}

export interface MoveOpts {
  inLiquidOverride?: boolean;
  jumpRequested?: boolean;
  jumpHeld?: boolean;
}

export function updateEntityPosition(
  pos: [number, number, number],
  vel: [number, number, number],
  aabbSize: [number, number],
  dt: number,
  getBlock: BlockLookup,
  opts: MoveOpts = {},
): PhysicsResult {
  let [vx, vy, vz] = vel;
  const [w, h] = aabbSize;

  const box = createPlayerAABB(pos, w, h);
  const inLiquid = opts.inLiquidOverride ?? isInLiquid(box, getBlock);

  vy -= GRAVITY * dt;
  if (inLiquid) {
    vy *= WATER_DRAG;
    vx *= WATER_DRAG;
    vz *= WATER_DRAG;
  }
  if (vy < -TERMINAL_VELOCITY) vy = -TERMINAL_VELOCITY;

  const jump = opts.jumpRequested || (opts.jumpHeld && inLiquid);
  if (jump) {
    if (inLiquid) {
      const cx = Math.floor(pos[0]);
      const cz = Math.floor(pos[2]);
      const headY = Math.floor(pos[1] + 1.2);
      const headInLiquid = isLiquid(getBlock(cx, headY, cz));
      if (!headInLiquid) {
        vy = JUMP_VELOCITY;
      } else {
        vy = JUMP_VELOCITY * 0.4;
      }
    } else if (opts.jumpRequested && isGroundedAt(pos, getBlock)) {
      vy = JUMP_VELOCITY;
    }
  }

  const dx = vx * dt;
  const dy = vy * dt;
  const dz = vz * dt;

  let [nx, ny, nz] = pos;

  nx += dx;
  let testBox = createPlayerAABB([nx, ny, nz], w, h);
  if (collidesWithWorld(testBox, getBlock)) {
    nx = pos[0];
    vx = 0;
  }

  ny += dy;
  testBox = createPlayerAABB([nx, ny, nz], w, h);
  let isOnGround = false;
  if (collidesWithWorld(testBox, getBlock)) {
    if (dy < 0) {
      isOnGround = true;
      const top = Math.floor(testBox.min[1]) + 1;
      ny = top;
    } else {
      ny = pos[1];
    }
    vy = 0;
  }

  nz += dz;
  testBox = createPlayerAABB([nx, ny, nz], w, h);
  if (collidesWithWorld(testBox, getBlock)) {
    nz = pos[2];
    vz = 0;
  }

  if (ny < 0) {
    ny = 0;
    vy = 0;
  }

  return { newPos: [nx, ny, nz], newVel: [vx, vy, vz], isOnGround, inLiquid };
}

function isGroundedAt(pos: [number, number, number], getBlock: BlockLookup): boolean {
  const test = createPlayerAABB([pos[0], pos[1] - 0.05, pos[2]]);
  return collidesWithWorld(test, getBlock);
}



export function fallDamageFrom(deltaY: number): number {
  if (deltaY <= 3) return 0;
  return Math.floor(deltaY - 3);
}