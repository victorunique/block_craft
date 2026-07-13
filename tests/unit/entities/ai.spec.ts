import { describe, it, expect } from 'vitest';
import { MONSTER_SPECS, applyDifficulty, tickMonsterAI } from '@/game/monsters/ai';
import { createEntity } from '@/game/entities/base';
import { ANIMAL_SPECS, tickAnimalAI, rollAnimalDrops } from '@/game/animals/ai';
import { updateEntityPosition } from '@/game/physics/collision';
import { BlockId } from '@/config/blocks';

describe('Monster AI', () => {
  it('wander when no target', () => {
    const m = createEntity({ kind: 'monster', species: 'zombie', pos: [0, 64, 0] });
    const out = tickMonsterAI(m, MONSTER_SPECS.zombie, null, 100);
    expect(out.state === 'wander' || out.state === 'idle').toBe(true);
  });

  it('chase when target within detect radius', () => {
    const m = createEntity({ kind: 'monster', species: 'zombie', pos: [0, 64, 0] });
    const out = tickMonsterAI(m, MONSTER_SPECS.zombie, [3, 64, 0], 100);
    expect(out.state).toBe('chase');
    expect(out.vel[0]).toBeGreaterThan(0);
  });

  it('idle when target outside detect radius', () => {
    const m = createEntity({ kind: 'monster', species: 'zombie', pos: [0, 64, 0] });
    const out = tickMonsterAI(m, MONSTER_SPECS.zombie, [100, 64, 0], 100);
    expect(out.state).toBe('idle');
  });

  it('applies difficulty multipliers (easy = weaker)', () => {
    const normal = applyDifficulty(MONSTER_SPECS.zombie, 'medium');
    const easy = applyDifficulty(MONSTER_SPECS.zombie, 'easy');
    expect(easy.damage).toBeLessThan(normal.damage);
    expect(easy.health).toBeLessThan(normal.health);
  });
});

describe('Animal AI & Physics', () => {
  it('wander when no attacker', () => {
    const a = createEntity({ kind: 'animal', species: 'cow', pos: [0, 64, 0] });
    const out = tickAnimalAI(a, ANIMAL_SPECS.cow, null, 100);
    expect(out.state).toBe('wander');
  });

  it('flee when attacker is present', () => {
    const a = createEntity({ kind: 'animal', species: 'cow', pos: [0, 64, 0] });
    const out = tickAnimalAI(a, ANIMAL_SPECS.cow, [5, 64, 5], 100);
    expect(out.state).toBe('flee');
    expect(out.vel[0]).toBeLessThan(0); // moving away from (5, 5)
    expect(out.vel[2]).toBeLessThan(0);
  });

  it('entity physics update moves entity and obeys gravity', () => {
    const pos: [number, number, number] = [0, 64, 0];
    const vel: [number, number, number] = [2, 0, 0];
    const getBlock = () => 0; // all air
    const res = updateEntityPosition(pos, vel, [0.6, 0.9], 0.1, getBlock);
    
    expect(res.newPos[0]).toBeGreaterThan(0); // moved forward
    expect(res.newPos[1]).toBeLessThan(64); // fell under gravity
  });

  it('rolls cow drops within valid bounds (beef & leather)', () => {
    const drops = rollAnimalDrops(ANIMAL_SPECS.cow);
    
    const beef = drops.find((d: any) => d.blockId === BlockId.BEEF);
    const leather = drops.find((d: any) => d.blockId === BlockId.LEATHER);
    
    if (beef) {
      expect(beef.count).toBeGreaterThanOrEqual(1);
      expect(beef.count).toBeLessThanOrEqual(3);
    }
    if (leather) {
      expect(leather.count).toBeGreaterThanOrEqual(0);
      expect(leather.count).toBeLessThanOrEqual(2);
    }
  });
});