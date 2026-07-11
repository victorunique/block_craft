import { SMELTING_RECIPES } from './recipes';
import { addToGrid, countItem, removeFromGrid } from '../inventory/slots';
import type { InventoryGrid } from '../inventory/slots';
import { getMaxStack } from '../../config/blocks';

export interface SmeltResult {
  success: boolean;
  outputBlockId: number;
  outputCount: number;
}

export function findSmeltingRecipe(inputBlockId: number) {
  return SMELTING_RECIPES.find((r) => r.input.blockId === inputBlockId);
}

export function canSmelt(grid: InventoryGrid, recipeId: string, hasFuel: boolean): boolean {
  const recipe = SMELTING_RECIPES.find((r) => r.id === recipeId);
  if (!recipe) return false;
  if (countItem(grid, recipe.input.blockId) < recipe.input.count) return false;
  if (!hasFuel || countItem(grid, recipe.fuel.blockId) < recipe.fuel.count) return false;
  return true;
}

export function smelt(grid: InventoryGrid, recipeId: string, hasFuel: boolean): { grid: InventoryGrid; result: SmeltResult } {
  const recipe = SMELTING_RECIPES.find((r) => r.id === recipeId);
  if (!recipe) return { grid, result: { success: false, outputBlockId: 0, outputCount: 0 } };
  if (!canSmelt(grid, recipeId, hasFuel)) return { grid, result: { success: false, outputBlockId: recipe.output.blockId, outputCount: recipe.output.count } };

  const beforeOutput = countItem(grid, recipe.output.blockId);
  const afterTry = addToGrid(grid, recipe.output.blockId, recipe.output.count, getMaxStack(recipe.output.blockId));
  const afterOutput = countItem(afterTry, recipe.output.blockId);
  if (afterOutput - beforeOutput !== recipe.output.count) {
    return { grid, result: { success: false, outputBlockId: recipe.output.blockId, outputCount: recipe.output.count } };
  }
  let next = removeFromGrid(afterTry, 'hotbar', findFirstIndex(afterTry.hotbar, recipe.fuel.blockId), recipe.fuel.count);
  if (next.hotbar.find((it) => it?.blockId === recipe.fuel.blockId)) {
  } else {
    next = removeFromGrid(next, 'storage', findFirstIndex(next.storage, recipe.fuel.blockId), recipe.fuel.count);
  }
  if (next.hotbar.find((it) => it?.blockId === recipe.input.blockId) || countItem(next, recipe.input.blockId) >= recipe.input.count) {
  } else {
  }
  next = removeInput(next, recipe.input.blockId, recipe.input.count);
  return { grid: next, result: { success: true, outputBlockId: recipe.output.blockId, outputCount: recipe.output.count } };
}

function findFirstIndex(arr: (any | null)[], blockId: number): number {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i]?.blockId === blockId) return i;
  }
  return -1;
}

function removeInput(grid: InventoryGrid, blockId: number, count: number): InventoryGrid {
  let next = grid;
  let remaining = count;
  for (const kind of ['hotbar', 'storage'] as const) {
    if (remaining <= 0) break;
    const arr = [...next[kind]];
    for (let i = 0; i < arr.length && remaining > 0; i++) {
      const it = arr[i];
      if (!it || it.blockId !== blockId) continue;
      const take = Math.min(it.count, remaining);
      arr[i] = it.count - take <= 0 ? null : { ...it, count: it.count - take };
      remaining -= take;
    }
    next = { ...next, [kind]: arr };
  }
  return next;
}