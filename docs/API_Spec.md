# BlockCraft API Specifications

Version: 1.0  
Status: Initial Release  
Author: Antigravity (AI System Architect)  
Date: 2026-07-11  

---

## 1. Core State Store: Zustand API (`src/game/store/`)

State storage is managed globally via Zustand. The interface exposes getters, actions, and selectors for reactive elements (React HUD, overlay panels, menus) and allows transient updates from the rendering tick runner.

### 1.1. Interface Definition (`IGameState`)

```typescript
export interface InventoryItem {
  id: string;        // Unique instance ID
  blockId: number;   // ID corresponding to block type registry
  count: number;     // Current stack quantity (Max 64 for blocks, 1 for tools)
  durability?: number; // Tool durability remaining (if applicable)
}

export type Difficulty = 'easy' | 'medium' | 'hard';
export type WorldSize = 256 | 512 | 1024;

export interface GameSettings {
  graphicsQuality: 'low' | 'medium' | 'high';
  renderDistance: number;   // 8 to 12 chunks
  soundVolume: number;      // 0.0 to 1.0
  mouseSensitivity: number;  // 0.1 to 2.0
  controlLayout: 'right-handed' | 'left-handed';
}

export interface IGameState {
  // --- Game Session State ---
  isPaused: boolean;
  activeWorldId: string | null;
  worldSeed: number;
  worldSize: WorldSize;
  difficulty: Difficulty;
  timeOfDay: number;       // 0.0 to 24000.0 (representing tick hours)
  
  // --- Player Attributes ---
  health: number;          // 0 to 20 (10 hearts)
  hunger: number;          // 0 to 20 (10 shanks)
  oxygen: number;          // 0 to 100 (for underwater breathing)
  playerPos: [number, number, number];
  playerRot: [number, number]; // pitch, yaw
  
  // --- Inventory Slots ---
  activeSlot: number;      // Selected hotbar index (0-8)
  hotbar: (InventoryItem | null)[]; // 9 slots
  storage: (InventoryItem | null)[]; // 27 slots
  armor: (InventoryItem | null)[];   // 4 slots (0: Helmet, 1: Chestplate, 2: Leggings, 3: Boots)
  
  // --- Settings ---
  settings: GameSettings;

  // --- Core Game Actions ---
  startGame: (seed: number, size: WorldSize, diff: Difficulty) => void;
  continueGame: (worldId: string) => Promise<void>;
  togglePause: () => void;
  tickTime: (delta: number) => void;

  // --- Player Actions ---
  setHealth: (health: number) => void;
  damagePlayer: (amount: number, source: string) => void;
  healPlayer: (amount: number) => void;
  adjustHunger: (amount: number) => void;
  eatFood: (slotIndex: number) => void;
  updatePlayerTransform: (pos: [number, number, number], rot: [number, number]) => void;

  // --- Inventory & Crafting Actions ---
  setActiveSlot: (slot: number) => void;
  addItemToInventory: (blockId: number, count: number) => boolean;
  removeItemFromInventory: (slotIndex: number, slotType: 'hotbar' | 'storage' | 'armor', count: number) => void;
  swapInventorySlots: (fromIdx: number, fromType: 'hotbar' | 'storage' | 'armor', toIdx: number, toType: 'hotbar' | 'storage' | 'armor') => void;
  craftItem: (recipeId: string) => boolean;

  // --- Settings Actions ---
  updateSettings: (newSettings: Partial<GameSettings>) => void;
}
```

---

## 2. Component Subsystem API Signatures

All core modules are instantiated as classes or functional units implementing clear TypeScript interfaces to guarantee testability and test mocks compatibility.

### 2.1. Terrain Subsystem (`ITerrainGenerator`)

Responsible for height calculations, block mapping, and cave configurations.

```typescript
export interface ITerrainGenerator {
  seed: number;
  
  /**
   * Generates heightmap value for a 2D coordinate.
   * Returns elevation in block units (0 to 128 limit).
   */
  getHeightAt: (x: number, z: number) => number;
  
  /**
   * Identifies biome category at specific 2D coordinates.
   */
  getBiomeAt: (x: number, z: number) => 'plains' | 'forest' | 'desert' | 'snow' | 'mountains';

  /**
   * Fills a flat Uint8Array buffer representing a chunk (16x16x16 blocks).
   * Voxel position index in array = x + y * 16 + z * 256.
   */
  generateChunkData: (chunkX: number, chunkY: number, chunkZ: number) => Uint8Array;
}
```

### 2.2. Physics Engine (`IPhysicsEngine`)

Provides step-climbing, velocity decay, and AABB calculations.

```typescript
export interface AABB {
  min: [number, number, number];
  max: [number, number, number];
}

export interface IPhysicsEngine {
  gravityConstant: number;
  terminalVelocity: number;

  /**
   * Computes the bounding box collision displacement relative to the solid voxel neighborhood.
   * Modifies velocity and returns updated movement coords.
   */
  updateEntityPosition: (
    entityPos: [number, number, number],
    entityVel: [number, number, number],
    entityAABB: AABB,
    deltaTime: number,
    getBlockAt: (x: number, y: number, z: number) => number
  ) => {
    newPos: [number, number, number];
    newVel: [number, number, number];
    isOnGround: boolean;
  };
}
```

### 2.3. Save Manager (`ISaveManager`)

Manages backup files formats and IndexedDB storage tasks.

```typescript
export interface SaveBackupFormat {
  version: string;
  metadata: {
    worldId: string;
    seed: number;
    size: number;
    difficulty: string;
    time: number;
    player: {
      position: [number, number, number];
      rotation: [number, number];
      health: number;
      hunger: number;
    };
  };
  inventory: {
    hotbar: (InventoryItem | null)[];
    storage: (InventoryItem | null)[];
  };
  chunkDeltas: {
    // Key format: 'chunkX,chunkY,chunkZ'
    // Value format: Array of [blockIndexWithinChunk, newBlockId]
    [chunkKey: string]: [number, number][];
  };
}

export interface ISaveManager {
  /**
   * Asynchronously serializes the active state and writes modifications to IndexedDB.
   */
  autosave: () => Promise<void>;

  /**
   * Pulls IndexedDB state, bundles into compressed SaveBackupFormat and downloads it.
   */
  exportWorldSave: (worldId: string) => Promise<Blob>;

  /**
   * Accepts a backup blob file, validates version and schemas, then writes to IndexedDB.
   */
  importWorldSave: (fileData: SaveBackupFormat) => Promise<string>; // Returns imported worldId
}
```

---

## 3. Web Worker Thread Communication Protocol

To ensure seamless, lag-free mesh compiles, messages are serialized and moved using Transferable objects (ArrayBuffers).

### 3.1. Main Thread ➔ Web Worker Messages (`WorkerRequest`)

```typescript
export type WorkerRequestType = 'INIT_SEED' | 'GENERATE_CHUNK_DATA' | 'COMPILE_CHUNK_MESH';

export interface WorkerRequest {
  id: string;               // Correlation ID for message dispatch
  type: WorkerRequestType;
  payload: {
    seed?: number;
    chunkX?: number;
    chunkY?: number;
    chunkZ?: number;
    voxelBuffer?: ArrayBuffer; // Used when compiling meshes
    deltaBuffer?: ArrayBuffer; // Array containing modified block indexes
  };
}
```

### 3.2. Web Worker ➔ Main Thread Messages (`WorkerResponse`)

The worker responds with compiled buffer parameters suitable for direct injection into Three.js buffer geometries:

```typescript
export type WorkerResponseType = 'INIT_SUCCESS' | 'CHUNK_DATA_GENERATED' | 'MESH_COMPILED';

export interface WorkerResponse {
  id: string;
  type: WorkerResponseType;
  payload: {
    chunkX: number;
    chunkY: number;
    chunkZ: number;
    voxelBuffer?: ArrayBuffer; // Flat raw voxel IDs array
    // Mesh geometry buffers for drawing:
    positions?: Float32Array;  // Flat coordinates list: [x1, y1, z1, x2, y2, z2...]
    normals?: Float32Array;    // Flat lighting normal lists
    uvs?: Float32Array;        // UV atlas coordinates mapping block faces
    indices?: Uint32Array;     // Triangle index mappings for indexing draws
  };
}
```

*Note: Transferable buffers (like `positions`, `normals`, `uvs`, `indices` arrays) are included in the second parameter of `postMessage` (`postMessage(response, [payload.positions.buffer, ...])`) to shift memory ownership, bypassing serialization delays and reducing main thread garbage collection cycles.*
