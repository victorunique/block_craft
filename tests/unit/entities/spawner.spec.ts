import { describe, it, expect } from 'vitest';
import { EntitySpawner } from '@/game/entities/spawner';

function opts(): any {
  return {
    seed: 42,
    difficulty: 'medium' as const,
    getHeight: (x: number, z: number) => 65,
    getBiome: () => 'plains',
    isLit: () => false,
    playerPos: () => [0, 70, 0],
    timeOfDay: () => 15000,
    worldSize: 256,
  };
}

describe('EntitySpawner', () => {
  it('isNight at time > 14000', () => {
    const s = new EntitySpawner(opts());
    expect(s.isNight()).toBe(true);
  });

  it('respects monster cap (30) when spawning', () => {
    const s = new EntitySpawner(opts());
    const monsters = Array.from({ length: 30 }, (_, i) => ({
      id: `m${i}`, kind: 'monster' as const, species: 'zombie', pos: [i, 70, 0] as [number, number, number], vel: [0, 0, 0] as [number, number, number], health: 20, maxHealth: 20, width: 0.6, height: 1.95, state: 'idle', stateTimer: 1000,
    }));
    s.setMonsters(monsters);
    s.tick(5000);
    expect(s.getMonsters().length).toBeLessThanOrEqual(30);
  });

  it('respects animal cap (20) when spawning', () => {
    const o = opts();
    o.timeOfDay = () => 6000;
    const s = new EntitySpawner(o);
    const animals = Array.from({ length: 20 }, (_, i) => ({
      id: `a${i}`, kind: 'animal' as const, species: 'cow', pos: [i, 70, 0] as [number, number, number], vel: [0, 0, 0] as [number, number, number], health: 10, maxHealth: 10, width: 0.6, height: 0.9, state: 'wander', stateTimer: 1000,
    }));
    s.setAnimals(animals);
    s.tick(5000);
    expect(s.getAnimals().length).toBeLessThanOrEqual(20);
  });

  it('does not spawn monsters in bright areas', () => {
    const o = opts();
    o.isLit = () => true;
    const s = new EntitySpawner(o);
    for (let i = 0; i < 100; i++) s.tick(1000);
    expect(s.getMonsters().length).toBe(0);
  });
});