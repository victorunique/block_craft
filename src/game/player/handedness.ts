import type { GameSettings } from '../store/types';

export function applyHandedness<T>(layout: GameSettings['controlLayout'], left: T, right: T): T {
  return layout === 'left-handed' ? left : right;
}