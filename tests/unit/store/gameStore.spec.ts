import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGameStore } from '@/game/store/gameStore';
import { BlockId } from '@/config/blocks';
import { MAX_HEALTH, MAX_HUNGER, MAX_OXYGEN, HOTBAR_SIZE, STORAGE_SIZE, ARMOR_SIZE } from '@/config/constants';
import { RECIPES as RECIPES_CONST } from '@/game/crafting/recipes';
import { clearActiveWorld } from '@/game/world/activeWorld';

vi.mock('@/game/world/activeWorld', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/game/world/activeWorld')>();
  return {
    ...original,
    clearActiveWorld: vi.fn(original.clearActiveWorld),
  };
});


const ZS = 'blockcraft_settings';

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.removeItem(ZS);
  useGameStore.setState({
    screen: 'main-menu',
    isPaused: false,
    showInventory: false,
    showGameOver: false,
    activeWorldId: null,
    worldName: 'Test',
    worldSeed: 1,
    worldSize: 512,
    difficulty: 'medium',
    timeOfDay: 6000,
    dayCount: 1,
    health: MAX_HEALTH,
    hunger: MAX_HUNGER,
    oxygen: MAX_OXYGEN,
    playerPos: [0, 72, 0],
    playerRot: [0, 0],
    activeSlot: 0,
    hotbar: Array(HOTBAR_SIZE).fill(null),
    storage: Array(STORAGE_SIZE).fill(null),
    armor: Array(ARMOR_SIZE).fill(null),
    settings: { graphicsQuality: 'medium', renderDistance: 10, soundVolume: 0.8, mouseSensitivity: 1, controlLayout: 'right-handed' },
    loadingProgress: 0,
    loadingStage: '',
    lastSaveTick: 0,
    generated: false,
    pauseReason: null,
    showTutorialOverlay: true,
  });
});

describe('IGameState — player actions', () => {
  it('damagePlayer clamps at 0 and triggers game over', () => {
    useGameStore.setState({ screen: 'game', health: 20 });
    useGameStore.getState().damagePlayer(15, 'fall');
    expect(useGameStore.getState().health).toBe(5);
    useGameStore.getState().damagePlayer(10, 'zombie');
    const s = useGameStore.getState();
    expect(s.health).toBe(0);
    expect(s.showGameOver).toBe(true);
    expect(s.isPaused).toBe(true);
    expect(s.pauseReason).toBe('health');
  });

  it('damagePlayer never goes below 0', () => {
    useGameStore.setState({ health: 10 });
    useGameStore.getState().damagePlayer(1000);
    expect(useGameStore.getState().health).toBe(0);
  });

  it('healPlayer caps at MAX_HEALTH', () => {
    useGameStore.setState({ health: 18 });
    useGameStore.getState().healPlayer(50);
    expect(useGameStore.getState().health).toBe(MAX_HEALTH);
  });

  it('setHealth clamps range', () => {
    useGameStore.getState().setHealth(-5);
    expect(useGameStore.getState().health).toBe(0);
    useGameStore.getState().setHealth(1000);
    expect(useGameStore.getState().health).toBe(MAX_HEALTH);
  });

  it('adjustHunger / setOxygen bounds', () => {
    useGameStore.getState().adjustHunger(-50);
    expect(useGameStore.getState().hunger).toBe(0);
    useGameStore.getState().adjustHunger(50);
    expect(useGameStore.getState().hunger).toBe(MAX_HUNGER);
    useGameStore.getState().setOxygen(-50);
    expect(useGameStore.getState().oxygen).toBe(0);
    useGameStore.getState().setOxygen(500);
    expect(useGameStore.getState().oxygen).toBe(MAX_OXYGEN);
  });

  it('tickTime advances day and wraps', () => {
    useGameStore.setState({ screen: 'game', isPaused: false, timeOfDay: 23900, dayCount: 1 });
    useGameStore.getState().tickTime(200);
    const s = useGameStore.getState();
    expect(s.timeOfDay).toBe(100);
    expect(s.dayCount).toBe(2);
  });

  it('setActiveSlot bounds', () => {
    useGameStore.getState().setActiveSlot(99);
    expect(useGameStore.getState().activeSlot).toBe(HOTBAR_SIZE - 1);
    useGameStore.getState().setActiveSlot(-1);
    expect(useGameStore.getState().activeSlot).toBe(0);
  });
});

describe('IGameState — inventory & crafting', () => {
  it('addItemToInventory fills existing stack then empty slot', () => {
    useGameStore.getState().addItemToInventory(BlockId.STONE, 30);
    useGameStore.getState().addItemToInventory(BlockId.STONE, 40);
    const s = useGameStore.getState();
    const stoneTotal = [...s.hotbar, ...s.storage].filter((it) => it?.blockId === BlockId.STONE).reduce((acc, it) => acc + (it?.count ?? 0), 0);
    expect(stoneTotal).toBe(70);
  });

  it('addItemToInventory stacks feathers in a single slot', () => {
    useGameStore.getState().addItemToInventory(BlockId.FEATHER, 1);
    useGameStore.getState().addItemToInventory(BlockId.FEATHER, 1);
    const s = useGameStore.getState();
    const featherSlots = [...s.hotbar, ...s.storage].filter((it) => it !== null && it.blockId === BlockId.FEATHER);
    expect(featherSlots.length).toBe(1);
    expect(featherSlots[0]?.count).toBe(2);
  });

  it('addItemToInventory returns false when full and does not lose items', () => {
    for (let i = 0; i < 36; i++) useGameStore.getState().addItemToInventory(BlockId.STONE, 64);
    const before = [...useGameStore.getState().hotbar, ...useGameStore.getState().storage].filter((it) => it?.blockId === BlockId.STONE).reduce((a, it) => a + (it?.count ?? 0), 0);
    const ok = useGameStore.getState().addItemToInventory(BlockId.STONE, 10);
    expect(ok).toBe(false);
    const after = [...useGameStore.getState().hotbar, ...useGameStore.getState().storage].filter((it) => it?.blockId === BlockId.STONE).reduce((a, it) => a + (it?.count ?? 0), 0);
    expect(after).toBe(before);
  });

  it('removeItemFromInventory subtracts count', () => {
    useGameStore.getState().addItemToInventory(BlockId.DIRT, 10);
    useGameStore.getState().removeItemFromInventory('hotbar', 0, 3);
    expect(useGameStore.getState().hotbar[0]?.count).toBe(7);
  });

  it('swapInventorySlots swaps contents', () => {
    useGameStore.getState().addItemToInventory(BlockId.STONE, 1);
    useGameStore.getState().addItemToInventory(BlockId.DIRT, 1);
    useGameStore.getState().swapInventorySlots(0, 'hotbar', 1, 'hotbar');
    expect(useGameStore.getState().hotbar[0]?.blockId).toBe(BlockId.DIRT);
    expect(useGameStore.getState().hotbar[1]?.blockId).toBe(BlockId.STONE);
  });

  it('craftItem deducts ingredients and adds output', () => {
    useGameStore.setState({ hotbar: Array(HOTBAR_SIZE).fill(null), storage: Array(STORAGE_SIZE).fill(null), armor: Array(ARMOR_SIZE).fill(null) });
    useGameStore.getState().addItemToInventory(BlockId.COBBLESTONE, 8);
    const ok = useGameStore.getState().craftItem('furnace');
    expect(ok).toBe(true);
    const s = useGameStore.getState();
    const cobble = [...s.hotbar, ...s.storage].filter((it) => it?.blockId === BlockId.COBBLESTONE).reduce((a, it) => a + (it?.count ?? 0), 0);
    expect(cobble).toBe(0);
    const furnace = [...s.hotbar, ...s.storage].find((it) => it?.blockId === BlockId.FURNACE);
    expect(furnace).toBeTruthy();
    expect(furnace?.count).toBe(1);
  });

  it('craftItem refuses if materials missing', () => {
    expect(useGameStore.getState().craftItem('furnace')).toBe(false);
  });

  it('craftItem rolls back if inventory cannot accept output', () => {
    for (let i = 0; i < 36; i++) useGameStore.getState().addItemToInventory(BlockId.STONE, 64);
    useGameStore.setState((s) => {
      const newHotbar = [...s.hotbar];
      const newStorage = [...s.storage];
      for (let i = 0; i < newStorage.length; i++) {
        newStorage[i] = { id: 'x' + i, blockId: BlockId.COBBLESTONE, count: 64 };
      }
      return { hotbar: newHotbar, storage: newStorage };
    });
    const before = [...useGameStore.getState().hotbar, ...useGameStore.getState().storage].filter((it) => it?.blockId === BlockId.COBBLESTONE).reduce((a, it) => a + (it?.count ?? 0), 0);
    const ok = useGameStore.getState().craftItem('furnace');
    expect(ok).toBe(false);
    const after = [...useGameStore.getState().hotbar, ...useGameStore.getState().storage].filter((it) => it?.blockId === BlockId.COBBLESTONE).reduce((a, it) => a + (it?.count ?? 0), 0);
    expect(after).toBe(before);
  });

  it('craftItem torch: 1 coal + 1 stick → 4 torches', () => {
    useGameStore.getState().addItemToInventory(BlockId.COAL_ITEM, 1);
    useGameStore.getState().addItemToInventory(BlockId.STICK, 1);
    expect(useGameStore.getState().craftItem('torch')).toBe(true);
    const torches = [...useGameStore.getState().hotbar, ...useGameStore.getState().storage].filter((it) => it?.blockId === BlockId.TORCH).reduce((a, it) => a + (it?.count ?? 0), 0);
    expect(torches).toBe(4);
  });

  it('craftItem wooden_pickaxe assigns durability', () => {
    useGameStore.getState().addItemToInventory(BlockId.PLANKS, 3);
    useGameStore.getState().addItemToInventory(BlockId.STICK, 2);
    expect(useGameStore.getState().craftItem('wooden_pickaxe')).toBe(true);
    const pick = [...useGameStore.getState().hotbar, ...useGameStore.getState().storage].find((it) => it?.blockId === BlockId.WOODEN_PICKAXE);
    expect(pick?.durability).toBe(60);
  });

  it('splitStack halves a stack', () => {
    useGameStore.getState().addItemToInventory(BlockId.STONE, 64);
    const ok = useGameStore.getState().splitStack('hotbar', 0);
    expect(ok).toBe(true);
    expect(useGameStore.getState().hotbar[0]?.count).toBe(32);
  });

  it('applyDamageToTool breaks tool at 0 durability', () => {
    useGameStore.setState((s) => {
      const h = [...s.hotbar];
      h[0] = { id: 't1', blockId: BlockId.WOODEN_PICKAXE, count: 1, durability: 5 };
      return { hotbar: h };
    });
    useGameStore.getState().applyDamageToTool('hotbar', 0, 5);
    expect(useGameStore.getState().hotbar[0]).toBeNull();
  });

  it('eatFood restores hunger and consumes one food item', () => {
    useGameStore.setState({ hunger: 5 });
    useGameStore.setState((s) => {
      const h = [...s.hotbar];
      h[0] = { id: 'food', blockId: BlockId.BEEF, count: 1 };
      return { hotbar: h };
    });
    expect(useGameStore.getState().eatFood('hotbar', 0)).toBe(true);
    expect(useGameStore.getState().hunger).toBe(8);
    expect(useGameStore.getState().hotbar[0]).toBeNull();
  });

  it('eatFood rejects non-food', () => {
    useGameStore.setState((s) => {
      const h = [...s.hotbar];
      h[0] = { id: 's', blockId: BlockId.STONE, count: 1 };
      return { hotbar: h };
    });
    expect(useGameStore.getState().eatFood('hotbar', 0)).toBe(false);
  });
});

describe('IGameState — screen and pause', () => {
  it('togglePause flips isPaused only during game/paused screen', () => {
    useGameStore.setState({ screen: 'main-menu' });
    useGameStore.getState().togglePause();
    expect(useGameStore.getState().isPaused).toBe(false);
    useGameStore.setState({ screen: 'game', isPaused: false });
    useGameStore.getState().togglePause();
    expect(useGameStore.getState().isPaused).toBe(true);
    expect(useGameStore.getState().screen).toBe('paused');
    useGameStore.getState().togglePause();
    expect(useGameStore.getState().isPaused).toBe(false);
    expect(useGameStore.getState().screen).toBe('game');
  });

  it('setPause toggles pauseReason and screen', () => {
    useGameStore.setState({ screen: 'game' });
    useGameStore.getState().setPause(true, 'manual');
    expect(useGameStore.getState().isPaused).toBe(true);
    expect(useGameStore.getState().pauseReason).toBe('manual');
    expect(useGameStore.getState().screen).toBe('paused');
    useGameStore.getState().setPause(false);
    expect(useGameStore.getState().screen).toBe('game');
  });

  it('quitToMenu returns to main-menu and clears active world', () => {
    useGameStore.setState({ screen: 'game', isPaused: true });
    useGameStore.getState().quitToMenu();
    expect(useGameStore.getState().screen).toBe('main-menu');
    expect(useGameStore.getState().isPaused).toBe(false);
    expect(clearActiveWorld).toHaveBeenCalledTimes(1);
  });

  it('startGame clears active world and transitions to loading', () => {
    useGameStore.getState().startGame({
      worldId: 'new-world',
      worldName: 'My New World',
      seed: 42,
      size: 256,
      difficulty: 'easy',
      playerPos: [10, 80, 10],
    });
    expect(useGameStore.getState().screen).toBe('loading');
    expect(clearActiveWorld).toHaveBeenCalledTimes(1);
  });

  it('toggleInventory flips showInventory', () => {
    useGameStore.getState().toggleInventory();
    expect(useGameStore.getState().showInventory).toBe(true);
    useGameStore.getState().toggleInventory(false);
    expect(useGameStore.getState().showInventory).toBe(false);
  });

  it('respawn clears game over and restores health', () => {
    useGameStore.setState({ health: 0, hunger: 0, showGameOver: true, isPaused: true, pauseReason: 'health', screen: 'paused' });
    useGameStore.getState().respawn();
    const s = useGameStore.getState();
    expect(s.health).toBe(MAX_HEALTH);
    expect(s.showGameOver).toBe(false);
    expect(s.screen).toBe('game');
    expect(s.hunger).toBeGreaterThan(0);
  });

  it('handles showTutorialOverlay state and actions', () => {
    // 1. Defaults to true (in types/state)
    expect(useGameStore.getState().showTutorialOverlay).toBe(true);

    // 2. setShowTutorialOverlay can toggle it
    useGameStore.getState().setShowTutorialOverlay(false);
    expect(useGameStore.getState().showTutorialOverlay).toBe(false);

    // 3. startGame resets showTutorialOverlay to true
    useGameStore.getState().startGame({
      worldId: 'new-world',
      worldName: 'My New World',
      seed: 42,
      size: 256,
      difficulty: 'easy',
      playerPos: [10, 80, 10],
    });
    expect(useGameStore.getState().showTutorialOverlay).toBe(true);

    // 4. quitToMenu resets showTutorialOverlay to true
    useGameStore.getState().setShowTutorialOverlay(false);
    useGameStore.getState().quitToMenu();
    expect(useGameStore.getState().showTutorialOverlay).toBe(true);
  });
});

describe('IGameState — recipes are exported', () => {
  it('contains all required recipes', () => {
    const ids = new Set(RECIPES_CONST.map((r) => r.id));
    ['planks', 'sticks', 'torch', 'furnace', 'wooden_pickaxe', 'stone_pickaxe', 'iron_pickaxe', 'wooden_axe', 'stone_axe', 'iron_axe', 'wooden_sword', 'stone_sword', 'iron_sword'].forEach((id) => expect(ids.has(id)).toBe(true));
  });
});