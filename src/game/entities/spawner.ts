import type { BaseEntity } from './base';
import { ANIMAL_CAP, MONSTER_CAP, MONSTER_DETECT_RADIUS, SEALEVEL } from '../../config/constants';
import type { Difficulty } from '../../config/constants';
import { mulberry32 } from '../../utils/rng';

export interface SpawnerOpts {
  seed: number;
  difficulty: Difficulty;
  getHeight: (x: number, z: number) => number;
  getBiome: (x: number, z: number) => string;
  isLit: (x: number, y: number, z: number) => boolean;
  playerPos: () => [number, number, number];
  timeOfDay: () => number;
  worldSize: number;
}

export class EntitySpawner {
  private rng: () => number;
  private monsters: BaseEntity[] = [];
  private animals: BaseEntity[] = [];
  private opts: SpawnerOpts;
  private dayStartTime = 6000;
  private nightStartTime = 14000;

  constructor(opts: SpawnerOpts) {
    this.opts = opts;
    this.rng = mulberry32(opts.seed * 31 + 7);
  }

  isNight(): boolean {
    const t = this.opts.timeOfDay();
    return t >= this.nightStartTime || t < this.dayStartTime;
  }

  tick(deltaMs: number): { monstersSpawned: number; animalsSpawned: number } {
    const p = this.opts.playerPos();
    const playerChunkX = Math.floor(p[0] / 16);
    const playerChunkZ = Math.floor(p[2] / 16);
    const night = this.isNight();
    let monstersSpawned = 0;
    let animalsSpawned = 0;
    if (night && this.monsters.length < MONSTER_CAP) {
      if (this.rng() < 0.05 * (deltaMs / 1000)) {
        const angle = this.rng() * Math.PI * 2;
        const dist = MONSTER_DETECT_RADIUS + this.rng() * 8;
        const x = p[0] + Math.cos(angle) * dist;
        const z = p[2] + Math.sin(angle) * dist;
        const y = this.opts.getHeight(Math.floor(x), Math.floor(z));
        if (!this.opts.isLit(Math.floor(x), y, Math.floor(z))) {
          const species = this.rng() < 0.4 ? 'spider' : this.rng() < 0.6 ? 'skeleton' : 'zombie';
          this.monsters.push({
            id: `m_${Date.now()}_${this.rng().toString(36).slice(2, 6)}`,
            kind: 'monster',
            species,
            pos: [x, y + 1, z],
            vel: [0, 0, 0],
            health: 20,
            maxHealth: 20,
            width: 0.6,
            height: 1.95,
            state: 'idle',
            stateTimer: 1000,
          });
          monstersSpawned++;
        }
        void playerChunkX; void playerChunkZ;
      }
    }
    if (!night && this.animals.length < ANIMAL_CAP) {
      if (this.rng() < 0.04 * (deltaMs / 1000)) {
        const angle = this.rng() * Math.PI * 2;
        const dist = 6 + this.rng() * 8;
        const x = p[0] + Math.cos(angle) * dist;
        const z = p[2] + Math.sin(angle) * dist;
        const y = this.opts.getHeight(Math.floor(x), Math.floor(z));
        if (y > SEALEVEL) {
          const biome = this.opts.getBiome(Math.floor(x), Math.floor(z));
          if (biome === 'plains' || biome === 'forest') {
            const species = this.rng() < 0.4 ? 'cow' : this.rng() < 0.6 ? 'pig' : 'chicken';
            this.animals.push({
              id: `a_${Date.now()}_${this.rng().toString(36).slice(2, 6)}`,
              kind: 'animal',
              species,
              pos: [x, y + 1, z],
              vel: [0, 0, 0],
              health: 10,
              maxHealth: 10,
              width: 0.6,
              height: 0.9,
              state: 'wander',
              stateTimer: 2000,
            });
            animalsSpawned++;
          }
        }
      }
    }
    for (let i = this.monsters.length - 1; i >= 0; i--) {
      const m = this.monsters[i];
      if (m.health <= 0) this.monsters.splice(i, 1);
    }
    for (let i = this.animals.length - 1; i >= 0; i--) {
      const a = this.animals[i];
      if (a.health <= 0) this.animals.splice(i, 1);
    }
    return { monstersSpawned, animalsSpawned };
  }

  getMonsters() { return this.monsters; }
  getAnimals() { return this.animals; }

  setMonsters(list: BaseEntity[]) { this.monsters = list; }
  setAnimals(list: BaseEntity[]) { this.animals = list; }
}