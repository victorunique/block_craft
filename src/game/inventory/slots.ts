import { uuid } from '../../utils';

export interface InventoryItem {
  id: string;
  blockId: number;
  count: number;
  durability?: number;
}

export interface InventoryGrid {
  hotbar: (InventoryItem | null)[];
  storage: (InventoryItem | null)[];
  armor: (InventoryItem | null)[];
}

export function emptyInventory(): InventoryGrid {
  return {
    hotbar: Array(9).fill(null),
    storage: Array(27).fill(null),
    armor: Array(4).fill(null),
  };
}

export function createItem(blockId: number, count = 1, durability?: number): InventoryItem {
  return { id: uuid(), blockId, count, durability };
}

export function isSameItem(a: InventoryItem | null, b: InventoryItem | null): boolean {
  if (!a || !b) return false;
  if (a.blockId !== b.blockId) return false;
  if (a.durability !== b.durability) return false;
  return true;
}

export function canStack(item: InventoryItem | null, blockId: number, maxStack: number): boolean {
  if (!item) return false;
  if (item.blockId !== blockId) return false;
  if (maxStack <= 1) return false;
  return item.count < maxStack;
}

export function findSlot(grid: InventoryGrid, blockId: number, maxStack: number): { kind: 'hotbar' | 'storage' | 'armor'; index: number } | null {
  const all: { kind: 'hotbar' | 'storage' | 'armor'; arr: (InventoryItem | null)[] }[] = [
    { kind: 'hotbar', arr: grid.hotbar },
    { kind: 'storage', arr: grid.storage },
  ];
  for (const { kind, arr } of all) {
    for (let i = 0; i < arr.length; i++) {
      const it = arr[i];
      if (!it) continue;
      if (it.blockId === blockId && it.count < maxStack && maxStack > 1) {
        return { kind, index: i };
      }
    }
  }
  return null;
}

export function findEmptySlot(grid: InventoryGrid): { kind: 'hotbar' | 'storage' | 'armor'; index: number } | null {
  for (let i = 0; i < grid.hotbar.length; i++) {
    if (!grid.hotbar[i]) return { kind: 'hotbar', index: i };
  }
  for (let i = 0; i < grid.storage.length; i++) {
    if (!grid.storage[i]) return { kind: 'storage', index: i };
  }
  return null;
}

export function getArray(grid: InventoryGrid, kind: 'hotbar' | 'storage' | 'armor'): (InventoryItem | null)[] {
  return grid[kind];
}

export function setArray(grid: InventoryGrid, kind: 'hotbar' | 'storage' | 'armor', next: (InventoryItem | null)[]): InventoryGrid {
  return { ...grid, [kind]: next };
}

export function addToGrid(grid: InventoryGrid, blockId: number, count: number, maxStack: number): InventoryGrid {
  let remaining = count;
  let next = grid;
  while (remaining > 0) {
    const slot = findSlot(next, blockId, maxStack);
    if (slot) {
      const arr = [...getArray(next, slot.kind)];
      const item = arr[slot.index]!;
      const space = maxStack - item.count;
      const add = Math.min(space, remaining);
      arr[slot.index] = { ...item, count: item.count + add };
      remaining -= add;
      next = setArray(next, slot.kind, arr);
    } else {
      const empty = findEmptySlot(next);
      if (!empty) return next;
      const arr = [...getArray(next, empty.kind)];
      arr[empty.index] = createItem(blockId, Math.min(maxStack, remaining));
      remaining -= Math.min(maxStack, remaining);
      next = setArray(next, empty.kind, arr);
    }
  }
  return next;
}

export function removeFromGrid(grid: InventoryGrid, kind: 'hotbar' | 'storage' | 'armor', index: number, count: number): InventoryGrid {
  const arr = [...getArray(grid, kind)];
  const item = arr[index];
  if (!item) return grid;
  if (item.count <= count) {
    arr[index] = null;
  } else {
    arr[index] = { ...item, count: item.count - count };
  }
  return setArray(grid, kind, arr);
}

export function swapGridSlots(grid: InventoryGrid, fromKind: 'hotbar' | 'storage' | 'armor', fromIdx: number, toKind: 'hotbar' | 'storage' | 'armor', toIdx: number): InventoryGrid {
  if (fromKind === toKind && fromIdx === toIdx) return grid;
  const fromArr = [...getArray(grid, fromKind)];
  const toArr = fromKind === toKind ? fromArr : [...getArray(grid, toKind)];
  const tmp = fromArr[fromIdx];
  fromArr[fromIdx] = toArr[toIdx];
  toArr[toIdx] = tmp;
  let next = setArray(grid, fromKind, fromArr);
  if (fromKind !== toKind) next = setArray(next, toKind, toArr);
  return next;
}

export function countItem(grid: InventoryGrid, blockId: number): number {
  let total = 0;
  for (const arr of [grid.hotbar, grid.storage, grid.armor]) {
    for (const it of arr) {
      if (it && it.blockId === blockId) total += it.count;
    }
  }
  return total;
}

export function splitHalf(grid: InventoryGrid, kind: 'hotbar' | 'storage' | 'armor', idx: number): { grid: InventoryGrid; cursor: InventoryItem | null } {
  const arr = [...getArray(grid, kind)];
  const item = arr[idx];
  if (!item || item.count <= 1) return { grid, cursor: null };
  const half = Math.floor(item.count / 2);
  if (half < 1) return { grid, cursor: null };
  arr[idx] = { ...item, count: item.count - half };
  const cursor = createItem(item.blockId, half, item.durability);
  return { grid: setArray(grid, kind, arr), cursor };
}