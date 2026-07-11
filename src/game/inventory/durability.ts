import { DURABILITY_MAX } from '../../config/constants';

export function applyDurability(current: number, amount: number): number {
  return Math.max(0, current - amount);
}

export function durabilityFraction(blockId: number, durability: number | undefined): number {
  const max = DURABILITY_MAX[blockId] ?? 0;
  if (!max || durability === undefined) return 1;
  return Math.max(0, Math.min(1, durability / max));
}

export function durabilityColor(frac: number): string {
  if (frac > 0.5) return '#6BCB77';
  if (frac > 0.25) return '#FFD93D';
  return '#FF6B6B';
}