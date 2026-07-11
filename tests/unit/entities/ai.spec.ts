import { describe, it, expect } from 'vitest';
import { MONSTER_SPECS, applyDifficulty, tickMonsterAI } from '@/game/monsters/ai';
import { createEntity } from '@/game/entities/base';

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