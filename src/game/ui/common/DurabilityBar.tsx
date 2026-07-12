import { DURABILITY_MAX } from '../../../config/constants';
import { BlockId } from '../../../config/blocks';

export function getToolMaxDurability(blockId: number): number {
  return DURABILITY_MAX[blockId] ?? 1;
}

export function DurabilityBar({
  durability,
  maxDurability,
}: {
  durability: number;
  maxDurability: number;
}) {
  const pct = Math.max(0, Math.min(1, durability / maxDurability));
  const color =
    pct > 0.6
      ? 'var(--color-success)'
      : pct > 0.3
      ? 'var(--color-warning)'
      : 'var(--color-danger)';
  return (
    <span className="durability-bar" aria-hidden>
      <span
        className="durability-fill"
        style={{ width: `${pct * 100}%`, backgroundColor: color }}
      />
    </span>
  );
}

export function isTool(blockId: number): boolean {
  return blockId >= BlockId.TOOL_BASE && blockId < BlockId.FOOD_BASE;
}