import type { AABB } from './types';
import { collidesWithWorld, expandAABB, isInLiquid, type BlockLookup } from './aabb';
import { GRAVITY, JUMP_VELOCITY, STEP_CLIMB_HEIGHT, TERMINAL_VELOCITY, WATER_DRAG } from '../../config/constants';

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

  if (opts.jumpRequested) {
    if (inLiquid) vy = JUMP_VELOCITY * 0.4;
    else if (isGroundedAt(pos, getBlock)) vy = JUMP_VELOCITY;
  }

  const dx = vx * dt;
  const dy = vy * dt;
  const dz = vz * dt;

  let [nx, ny, nz] = pos;

  nx += dx;
  let testBox = createPlayerAABB([nx, ny, nz], w, h);
  if (collidesWithWorld(testBox, getBlock)) {
    if (opts.jumpRequested && false) {
    }
    const stepUp = tryStepUp([nx, ny, nz], pos, getBlock, w, h);
    if (stepUp) {
      nx = stepUp[0];
      ny = stepUp[1];
      nz = stepUp[2];
      vx = 0;
    } else {
      nx = pos[0];
      vx = 0;
    }
  }

  ny += dy;
  testBox = createPlayerAABB([nx, ny, nz], w, h);
  let isOnGround = false;
  if (collidesWithWorld(testBox, getBlock)) {
    if (dy < 0) isOnGround = true;
    ny = pos[1];
    vy = 0;
  }

  nz += dz;
  testBox = createPlayerAABB([nx, ny, nz], w, h);
  if (collidesWithWorld(testBox, getBlock)) {
    const stepUp = tryStepUp([nx, ny, nz], [nx, pos[1], nz], getBlock, w, h);
    if (stepUp) {
      ny = stepUp[1];
    } else {
      nz = pos[2];
      vz = 0;
    }
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

function tryStepUp(candidate: [number, number, number], base: [number, number, number], getBlock: BlockLookup, w: number, h: number): [number, number, number] | null {
  const stepBox = createPlayerAABB([candidate[0], candidate[1] + STEP_CLIMB_HEIGHT, candidate[2]], w, h);
  if (!collidesWithWorld(stepBox, getBlock)) {
    return [candidate[0], candidate[1] + STEP_CLIMB_HEIGHT, candidate[2]];
  }
  return null;
}

export function fallDamageFrom(deltaY: number): number {
  if (deltaY <= 3) return 0;
  return Math.floor(deltaY - 3);
}