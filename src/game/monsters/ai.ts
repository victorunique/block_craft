import type { BaseEntity } from '../entities/base';
import type { Difficulty } from '../../config/constants';
import { DIFFICULTY_CONFIG } from '../../config/constants';

export interface MonsterSpec {
  species: string;
  health: number;
  damage: number;
  speed: number;
  attackRange: number;
  attackCooldown: number;
  detectRadius: number;
  climb: boolean;
  ranged: boolean;
}

export const MONSTER_SPECS: Record<string, MonsterSpec> = {
  zombie: { species: 'zombie', health: 20, damage: 3, speed: 2.4, attackRange: 1.5, attackCooldown: 1000, detectRadius: 16, climb: false, ranged: false },
  skeleton: { species: 'skeleton', health: 16, damage: 2, speed: 2.6, attackRange: 8, attackCooldown: 1500, detectRadius: 16, climb: false, ranged: true },
  spider: { species: 'spider', health: 12, damage: 2, speed: 3.2, attackRange: 1.5, attackCooldown: 800, detectRadius: 16, climb: true, ranged: false },
};

export function applyDifficulty(spec: MonsterSpec, difficulty: Difficulty): MonsterSpec {
  const cfg = DIFFICULTY_CONFIG[difficulty];
  return {
    ...spec,
    health: Math.round(spec.health * cfg.monsterMultiplier),
    damage: Math.round(spec.damage * cfg.monsterDamageMultiplier),
    speed: spec.speed * cfg.monsterSpeedMultiplier,
  };
}

export function tickMonsterAI(monster: BaseEntity, spec: MonsterSpec, target: [number, number, number] | null, dt: number): BaseEntity {
  monster.stateTimer -= dt;
  if (!target) {
    if (monster.stateTimer <= 0) {
      monster.vel[0] = (Math.random() - 0.5) * spec.speed;
      monster.vel[2] = (Math.random() - 0.5) * spec.speed;
      monster.state = 'wander';
      monster.stateTimer = 2000 + Math.random() * 3000;
    }
    return monster;
  }
  const dx = target[0] - monster.pos[0];
  const dy = target[1] - monster.pos[1];
  const dz = target[2] - monster.pos[2];
  const distSq = dx * dx + dy * dy + dz * dz;
  const detectSq = spec.detectRadius * spec.detectRadius;
  if (distSq > detectSq) {
    monster.state = 'idle';
    return monster;
  }
  if (distSq < spec.attackRange * spec.attackRange) {
    monster.state = 'attack';
    if (monster.stateTimer <= 0) {
      monster.stateTimer = spec.attackCooldown;
      return { ...monster, state: 'attack', pendingAttack: true } as any;
    }
    monster.vel[0] = 0;
    monster.vel[2] = 0;
  } else {
    const len = Math.sqrt(distSq) || 1;
    monster.vel[0] = (dx / len) * spec.speed;
    monster.vel[2] = (dz / len) * spec.speed;
    monster.state = 'chase';
  }
  return monster;
}