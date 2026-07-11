import { uuid } from '../../utils';

export type EntityKind = 'monster' | 'animal';

export interface BaseEntity {
  id: string;
  kind: EntityKind;
  species: string;
  pos: [number, number, number];
  vel: [number, number, number];
  health: number;
  maxHealth: number;
  width: number;
  height: number;
  state: string;
  stateTimer: number;
}

export function createEntity(opts: Partial<BaseEntity> & Pick<BaseEntity, 'kind' | 'species'>): BaseEntity {
  return {
    id: opts.id ?? uuid(),
    kind: opts.kind,
    species: opts.species,
    pos: opts.pos ?? [0, 64, 0],
    vel: opts.vel ?? [0, 0, 0],
    health: opts.health ?? 20,
    maxHealth: opts.maxHealth ?? 20,
    width: opts.width ?? 0.6,
    height: opts.height ?? 1.8,
    state: opts.state ?? 'idle',
    stateTimer: opts.stateTimer ?? 0,
  };
}

export function damageEntity(e: BaseEntity, amount: number): boolean {
  e.health -= amount;
  return e.health <= 0;
}

export function isAlive(e: BaseEntity): boolean {
  return e.health > 0;
}