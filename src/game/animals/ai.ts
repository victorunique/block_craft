import type { BaseEntity } from '../entities/base';

export interface AnimalSpec {
  species: string;
  health: number;
  speed: number;
  drops: { blockId: number; min: number; max: number }[];
  fleeDuration: number;
}

export const ANIMAL_SPECS: Record<string, AnimalSpec> = {
  cow: {
    species: 'cow',
    health: 16,
    speed: 1.8,
    drops: [
      { blockId: 151, min: 1, max: 3 },
      { blockId: 154, min: 0, max: 2 },
    ],
    fleeDuration: 3000,
  },
  pig: {
    species: 'pig',
    health: 12,
    speed: 2.0,
    drops: [
      { blockId: 152, min: 1, max: 3 },
    ],
    fleeDuration: 3000,
  },
  chicken: {
    species: 'chicken',
    health: 6,
    speed: 1.5,
    drops: [
      { blockId: 153, min: 1, max: 2 },
      { blockId: 155, min: 0, max: 2 },
    ],
    fleeDuration: 3000,
  },
};

export function rollAnimalDrops(spec: AnimalSpec): { blockId: number; count: number }[] {
  const out: { blockId: number; count: number }[] = [];
  for (const d of spec.drops) {
    const count = Math.floor(Math.random() * (d.max - d.min + 1)) + d.min;
    if (count > 0) out.push({ blockId: d.blockId, count });
  }
  return out;
}

export function tickAnimalAI(animal: BaseEntity, spec: AnimalSpec, attacker: [number, number, number] | null, dt: number): BaseEntity {
  animal.stateTimer -= dt;
  if (attacker) {
    const dx = animal.pos[0] - attacker[0];
    const dz = animal.pos[2] - attacker[2];
    const len = Math.hypot(dx, dz) || 1;
    animal.vel[0] = (dx / len) * spec.speed * 1.5;
    animal.vel[2] = (dz / len) * spec.speed * 1.5;
    animal.state = 'flee';
    if (animal.stateTimer <= 0) animal.stateTimer = spec.fleeDuration;
    return animal;
  }
  if (animal.state === 'flee' && animal.stateTimer > 0) return animal;
  if (animal.stateTimer <= 0) {
    animal.vel[0] = (Math.random() - 0.5) * spec.speed;
    animal.vel[2] = (Math.random() - 0.5) * spec.speed;
    animal.state = 'wander';
    animal.stateTimer = 3000 + Math.random() * 3000;
  }
  return animal;
}