import type { Difficulty, WorldSize } from '../../config/constants';

export type Screen = 'main-menu' | 'world-creation' | 'loading' | 'game' | 'paused';

export interface InventoryItem {
  id: string;
  blockId: number;
  count: number;
  durability?: number;
}

export type SlotKind = 'hotbar' | 'storage' | 'armor';

export interface GameSettings {
  graphicsQuality: 'low' | 'medium' | 'high';
  renderDistance: number;
  soundVolume: number;
  mouseSensitivity: number;
  controlLayout: 'right-handed' | 'left-handed';
}

export interface IGameState {
  screen: Screen;
  isPaused: boolean;
  showInventory: boolean;
  showGameOver: boolean;
  activeWorldId: string | null;
  worldName: string;
  worldSeed: number;
  worldSize: WorldSize;
  difficulty: Difficulty;
  timeOfDay: number;
  dayCount: number;
  health: number;
  hunger: number;
  oxygen: number;
  playerPos: [number, number, number];
  playerRot: [number, number];
  activeSlot: number;
  hotbar: (InventoryItem | null)[];
  storage: (InventoryItem | null)[];
  armor: (InventoryItem | null)[];
  settings: GameSettings;
  loadingProgress: number;
  loadingStage: string;
  lastSaveTick: number;
  generated: boolean;
  pauseReason: 'manual' | 'health' | null;

  setScreen: (screen: Screen) => void;
  startGame: (params: {
    worldId: string;
    worldName: string;
    seed: number;
    size: WorldSize;
    difficulty: Difficulty;
    playerPos: [number, number, number];
  }) => void;
  continueGame: () => Promise<boolean>;
  togglePause: () => void;
  setPause: (paused: boolean, reason?: 'manual' | 'health') => void;
  tickTime: (delta: number) => void;

  setHealth: (health: number) => void;
  damagePlayer: (amount: number, source?: string) => void;
  healPlayer: (amount: number) => void;
  adjustHunger: (amount: number) => void;
  tickHunger: (deltaSeconds: number, difficulty: Difficulty) => void;
  eatFood: (slotKind: SlotKind, slotIndex: number) => boolean;
  setOxygen: (oxygen: number) => void;
  updatePlayerTransform: (pos: [number, number, number], rot: [number, number]) => void;

  setActiveSlot: (slot: number) => void;
  addItemToInventory: (blockId: number, count: number) => boolean;
  removeItemFromInventory: (slotKind: SlotKind, slotIndex: number, count: number) => void;
  swapInventorySlots: (fromIdx: number, fromType: SlotKind, toIdx: number, toType: SlotKind) => void;
  splitStack: (fromKind: SlotKind, fromIdx: number) => boolean;
  craftItem: (recipeId: string) => boolean;
  applyDamageToTool: (slotKind: SlotKind, slotIndex: number, amount: number) => void;

  updateSettings: (patch: Partial<GameSettings>) => void;

  setLoading: (progress: number, stage: string) => void;
  setGenerated: (v: boolean) => void;
  toggleInventory: (open?: boolean) => void;
  respawn: () => void;
  quitToMenu: () => void;
  markSaved: () => number;
}

export interface SaveBackupFormat {
  version: string;
  metadata: {
    worldId: string;
    worldName: string;
    seed: number;
    size: number;
    difficulty: string;
    time: number;
    dayCount: number;
    player: {
      position: [number, number, number];
      rotation: [number, number];
      health: number;
      hunger: number;
      oxygen: number;
    };
  };
  inventory: {
    hotbar: (InventoryItem | null)[];
    storage: (InventoryItem | null)[];
    armor: (InventoryItem | null)[];
    activeSlot: number;
  };
  chunkDeltas: Record<string, [number, number][]>;
}