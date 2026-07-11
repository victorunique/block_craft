import { create } from 'zustand';
import type { IGameState, GameSettings, SlotKind, InventoryItem } from './types';
import {
  ARMOR_SIZE,
  HOTBAR_SIZE,
  MAX_HEALTH,
  MAX_HUNGER,
  MAX_OXYGEN,
  STORAGE_SIZE,
  DAY_LENGTH_TICKS,
  DIFFICULTY_CONFIG,
  TICKS_PER_SECOND,
  FOOD_VALUES,
} from '../../config/constants';
import { getMaxStack } from '../../config/blocks';
import {
  addToGrid,
  countItem,
  createItem,
  emptyInventory,
  removeFromGrid,
  splitHalf,
  swapGridSlots,
} from '../inventory/slots';
import { RECIPES } from '../crafting/recipes';

const defaultSettings: GameSettings = {
  graphicsQuality: 'medium',
  renderDistance: 10,
  soundVolume: 0.8,
  mouseSensitivity: 1.0,
  controlLayout: 'right-handed',
};

let _cursor: InventoryItem | null = null;
export function setCursor(item: InventoryItem | null) {
  _cursor = item;
}
export function getCursor(): InventoryItem | null {
  return _cursor;
}

export const useGameStore = create<IGameState>((set, get) => ({
  screen: 'main-menu',
  isPaused: false,
  showInventory: false,
  showGameOver: false,
  activeWorldId: null,
  worldName: 'My World',
  worldSeed: 0,
  worldSize: 512,
  difficulty: 'medium',
  timeOfDay: 6000,
  dayCount: 0,
  health: MAX_HEALTH,
  hunger: MAX_HUNGER,
  oxygen: MAX_OXYGEN,
  playerPos: [0, 72, 0],
  playerRot: [0, 0],
  activeSlot: 0,
  hotbar: Array(HOTBAR_SIZE).fill(null),
  storage: Array(STORAGE_SIZE).fill(null),
  armor: Array(ARMOR_SIZE).fill(null),
  settings: defaultSettings,
  loadingProgress: 0,
  loadingStage: '',
  lastSaveTick: 0,
  generated: false,
  pauseReason: null,

  setScreen: (screen) => set({ screen }),

  startGame: ({ worldId, worldName, seed, size, difficulty, playerPos }) => {
    const inv = emptyInventory();
    inv.hotbar[0] = createItem(5, 4);
    set({
      activeWorldId: worldId,
      worldName,
      worldSeed: seed,
      worldSize: size,
      difficulty,
      playerPos,
      playerRot: [0, 0],
      health: MAX_HEALTH,
      hunger: MAX_HUNGER,
      oxygen: MAX_OXYGEN,
      hotbar: inv.hotbar,
      storage: inv.storage,
      armor: inv.armor,
      activeSlot: 0,
      timeOfDay: 6000,
      dayCount: 1,
      isPaused: false,
      showInventory: false,
      showGameOver: false,
      pauseReason: null,
      screen: 'loading',
      loadingProgress: 0,
      loadingStage: 'Sculpting hills...',
    });
  },

  continueGame: async () => {
    const lastId = typeof localStorage !== 'undefined' ? localStorage.getItem('blockcraft_last_played') : null;
    if (!lastId) return false;
    const { loadWorld } = await import('../save/saveManager');
    const loaded = await loadWorld(lastId);
    if (!loaded) return false;
    return true;
  },

  togglePause: () =>
    set((s) => {
      if (s.screen !== 'game' && s.screen !== 'paused') return s;
      if (s.isPaused) {
        return { isPaused: false, pauseReason: null, screen: 'game' as const };
      }
      return { isPaused: true, pauseReason: 'manual' as const, screen: 'paused' as const };
    }),

  setPause: (paused, reason) =>
    set((s) => ({
      isPaused: paused,
      pauseReason: paused ? reason ?? 'manual' : null,
      screen: paused ? 'paused' : 'game',
    })),

  tickTime: (delta) =>
    set((s) => {
      if (s.isPaused || s.screen !== 'game') return s;
      let t = s.timeOfDay + delta;
      let days = s.dayCount;
      while (t >= DAY_LENGTH_TICKS) {
        t -= DAY_LENGTH_TICKS;
        days += 1;
      }
      return { timeOfDay: t, dayCount: days };
    }),

  setHealth: (health) =>
    set(() => ({ health: Math.max(0, Math.min(MAX_HEALTH, health)) })),

  damagePlayer: (amount) =>
    set((s) => {
      const next = Math.max(0, s.health - amount);
      if (next <= 0) {
        return { health: 0, isPaused: true, pauseReason: 'health', screen: 'paused', showGameOver: true };
      }
      return { health: next };
    }),

  healPlayer: (amount) =>
    set((s) => ({ health: Math.min(MAX_HEALTH, s.health + amount) })),

  adjustHunger: (amount) =>
    set((s) => ({ hunger: Math.max(0, Math.min(MAX_HUNGER, s.hunger + amount)) })),

  tickHunger: (deltaSeconds, difficulty) =>
    set((s) => {
      const cfg = DIFFICULTY_CONFIG[difficulty];
      const mult = cfg.hungerDrainMultiplier;
      const drain = (deltaSeconds / 60) * mult;
      const next = Math.max(0, s.hunger - drain);
      let health = s.health;
      let showGameOver = s.showGameOver;
      let isPaused = s.isPaused;
      let pauseReason = s.pauseReason;
      let screen = s.screen;
      if (next <= 0 && s.health > 0) {
        const tickDrain = 1;
        const starveTicks = Math.floor((s.hunger - next) * 2);
        for (let i = 0; i < starveTicks; i++) {
          health = Math.max(0, health - tickDrain);
          if (health <= 0) {
            showGameOver = true;
            isPaused = true;
            pauseReason = 'health';
            screen = 'paused';
            break;
          }
        }
      } else if (next > 18 && s.health < MAX_HEALTH) {
        const regen = (deltaSeconds / 4) * cfg.healthRegenMultiplier;
        health = Math.min(MAX_HEALTH, health + regen);
      }
      return { hunger: next, health, showGameOver, isPaused, pauseReason, screen };
    }),

  eatFood: (slotKind, slotIndex) => {
    const s = get();
    const arr = s[slotKind];
    const item = arr[slotIndex];
    if (!item) return false;
    const food = FOOD_VALUES[item.blockId];
    if (!food) return false;
    const newHunger = Math.min(MAX_HUNGER, s.hunger + food.hunger);
    const nextArr = [...arr];
    if (item.count <= 1) nextArr[slotIndex] = null;
    else nextArr[slotIndex] = { ...item, count: item.count - 1 };
    set({ [slotKind]: nextArr, hunger: newHunger });
    return true;
  },

  setOxygen: (oxygen) =>
    set(() => ({ oxygen: Math.max(0, Math.min(MAX_OXYGEN, oxygen)) })),

  updatePlayerTransform: (pos, rot) => set({ playerPos: pos, playerRot: rot }),

  setActiveSlot: (slot) =>
    set(() => ({ activeSlot: Math.max(0, Math.min(HOTBAR_SIZE - 1, slot)) })),

  addItemToInventory: (blockId, count) => {
    const maxStack = getMaxStack(blockId);
    const next = addToGrid(
      { hotbar: [...get().hotbar], storage: [...get().storage], armor: [...get().armor] },
      blockId,
      count,
      maxStack,
    );
    const before = get();
    const had = countItem({ hotbar: before.hotbar, storage: before.storage, armor: before.armor }, blockId);
    const after = countItem(next, blockId);
    if (after - had < count) return false;
    set({ hotbar: next.hotbar, storage: next.storage, armor: next.armor });
    return true;
  },

  removeItemFromInventory: (slotKind, slotIndex, count) => {
    const grid = {
      hotbar: [...get().hotbar],
      storage: [...get().storage],
      armor: [...get().armor],
    };
    const next = removeFromGrid(grid, slotKind, slotIndex, count);
    set({ hotbar: next.hotbar, storage: next.storage, armor: next.armor });
  },

  swapInventorySlots: (fromIdx, fromType, toIdx, toType) => {
    const grid = {
      hotbar: [...get().hotbar],
      storage: [...get().storage],
      armor: [...get().armor],
    };
    const next = swapGridSlots(grid, fromType, fromIdx, toType, toIdx);
    set({ hotbar: next.hotbar, storage: next.storage, armor: next.armor });
  },

  splitStack: (fromKind, fromIdx) => {
    const grid = {
      hotbar: [...get().hotbar],
      storage: [...get().storage],
      armor: [...get().armor],
    };
    const result = splitHalf(grid, fromKind, fromIdx);
    if (!result.cursor) return false;
    set({ hotbar: result.grid.hotbar, storage: result.grid.storage, armor: result.grid.armor });
    setCursor(result.cursor);
    return true;
  },

  craftItem: (recipeId) => {
    const recipe = RECIPES.find((r) => r.id === recipeId);
    if (!recipe) return false;
    const before = get();
    const grid = { hotbar: before.hotbar, storage: before.storage, armor: before.armor };
    for (const inp of recipe.input) {
      if (countItem(grid, inp.blockId) < inp.count) return false;
    }
    const totalBefore = countItem(grid, recipe.output.blockId);
    const ok = before.addItemToInventory(recipe.output.blockId, recipe.output.count);
    if (!ok) return false;
    let after = get();
    let newHotbar = [...after.hotbar];
    let newStorage = [...after.storage];
    for (const inp of recipe.input) {
      let remaining = inp.count;
      for (const kind of ['hotbar', 'storage'] as const) {
        const arr = kind === 'hotbar' ? newHotbar : newStorage;
        for (let i = 0; i < arr.length && remaining > 0; i++) {
          const it = arr[i];
          if (!it || it.blockId !== inp.blockId) continue;
          const take = Math.min(it.count, remaining);
          arr[i] = it.count - take <= 0 ? null : { ...it, count: it.count - take };
          remaining -= take;
        }
      }
    }
    if (recipe.output.durability !== undefined) {
      for (let i = 0; i < newHotbar.length; i++) {
        const it = newHotbar[i];
        if (it && it.blockId === recipe.output.blockId && it.durability === undefined) {
          newHotbar[i] = { ...it, durability: recipe.output.durability };
          break;
        }
      }
      for (let i = 0; i < newStorage.length; i++) {
        const it = newStorage[i];
        if (it && it.blockId === recipe.output.blockId && it.durability === undefined) {
          newStorage[i] = { ...it, durability: recipe.output.durability };
          break;
        }
      }
    }
    const finalGrid = { hotbar: newHotbar, storage: newStorage, armor: after.armor };
    const totalAfter = countItem(finalGrid, recipe.output.blockId);
    if (totalAfter - totalBefore !== recipe.output.count) {
      set({ hotbar: before.hotbar, storage: before.storage });
      return false;
    }
    set({ hotbar: newHotbar, storage: newStorage });
    return true;
  },

  applyDamageToTool: (slotKind, slotIndex, amount) =>
    set((s) => {
      const arr = [...s[slotKind]];
      const it = arr[slotIndex];
      if (!it || it.durability === undefined) return s;
      const next = Math.max(0, it.durability - amount);
      arr[slotIndex] = next <= 0 ? null : { ...it, durability: next };
      return { [slotKind]: arr } as Partial<IGameState>;
    }),

  updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

  setLoading: (progress, stage) =>
    set({ loadingProgress: Math.max(0, Math.min(1, progress)), loadingStage: stage }),

  setGenerated: (v) => set({ generated: v }),

  toggleInventory: (open) =>
    set((s) => ({ showInventory: open ?? !s.showInventory })),

  respawn: () =>
    set((s) => ({
      health: MAX_HEALTH,
      hunger: Math.max(8, s.hunger),
      oxygen: MAX_OXYGEN,
      playerPos: [0, s.playerPos[1], 0],
      showGameOver: false,
      isPaused: false,
      pauseReason: null,
      screen: 'game',
    })),

  quitToMenu: () => {
    set({
      screen: 'main-menu',
      isPaused: false,
      showInventory: false,
      showGameOver: false,
      pauseReason: null,
    });
  },

  markSaved: () => {
    set({ lastSaveTick: Date.now() });
    return Date.now();
  },
}));

export type { IGameState };
export { TICKS_PER_SECOND };