import { getMaxStack } from '../../config/blocks';
import { isSameItem, canStack } from './slots';
import type { InventoryItem } from './slots';

export type DragSource =
  | { kind: 'hotbar' | 'storage' | 'armor'; index: number }
  | { cursor: true }
  | null;

export function mergeStacks(target: InventoryItem | null, source: InventoryItem, maxStack = getMaxStack(source.blockId)): { result: InventoryItem | null; remaining: InventoryItem | null } {
  if (!target) return { result: { ...source }, remaining: null };
  if (!canStack(target, source.blockId, maxStack)) return { result: target, remaining: source };
  const space = maxStack - target.count;
  const moved = Math.min(space, source.count);
  const nextTarget = { ...target, count: target.count + moved };
  const remaining = source.count - moved <= 0 ? null : { ...source, count: source.count - moved };
  return { result: nextTarget, remaining };
}

export function dragDrop(
  fromGrid: { hotbar: (InventoryItem | null)[]; storage: (InventoryItem | null)[]; armor: (InventoryItem | null)[] },
  source: DragSource,
  toKind: 'hotbar' | 'storage' | 'armor',
  toIndex: number,
  cursor: InventoryItem | null,
): { grid: typeof fromGrid; cursor: InventoryItem | null } {
  const grid = {
    hotbar: [...fromGrid.hotbar],
    storage: [...fromGrid.storage],
    armor: [...fromGrid.armor],
  };
  if (!source) return { grid, cursor };
  let nextCursor = cursor;
  if ('cursor' in source) {
    const target = grid[toKind][toIndex];
    const { result, remaining } = mergeStacks(target, cursor!);
    grid[toKind] = [...grid[toKind]];
    grid[toKind][toIndex] = result;
    nextCursor = remaining;
    return { grid, cursor: nextCursor };
  }
  const fromArr = [...grid[source.kind]];
  const fromItem = fromArr[source.index];
  if (!fromItem) return { grid, cursor };
  if (source.kind === toKind && source.index === toIndex) return { grid, cursor };
  const toArr = source.kind === toKind ? fromArr : [...grid[toKind]];
  const toItem = toArr[toIndex] ?? null;
  if (toItem && isSameItem(fromItem, toItem)) {
    const { result, remaining } = mergeStacks(toItem, fromItem);
    toArr[toIndex] = result;
    if (source.kind === toKind) {
      fromArr[source.index] = remaining;
    } else {
      fromArr[source.index] = remaining;
    }
    grid[source.kind] = fromArr;
    grid[toKind] = toArr;
    return { grid, cursor };
  }
  toArr[toIndex] = fromItem;
  fromArr[source.index] = toItem;
  grid[source.kind] = fromArr;
  grid[toKind] = toArr;
  return { grid, cursor };
}