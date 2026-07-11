import { openDB, type IDBPDatabase } from 'idb';
import { useGameStore } from '../store/gameStore';
import type { SaveBackupFormat } from '../store/types';
import { AUTOSAVE_INTERVAL_MS } from '../../config/constants';

const DB_NAME = 'BlockCraftDB';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;
let autosaveTimer: ReturnType<typeof setInterval> | null = null;
let autosaveInFlight = false;
let autosaveRetry = 0;

export function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('worlds')) db.createObjectStore('worlds', { keyPath: 'worldId' });
        if (!db.objectStoreNames.contains('chunk_deltas')) {
          const store = db.createObjectStore('chunk_deltas', { keyPath: 'id' });
          store.createIndex('by_world', 'worldId');
        }
        if (!db.objectStoreNames.contains('inventories')) db.createObjectStore('inventories', { keyPath: 'worldId' });
      },
    });
  }
  return dbPromise;
}

export async function initSaveManager(): Promise<void> {
  await getDb();
  if (autosaveTimer) return;
  autosaveTimer = setInterval(() => {
    void runAutosave();
  }, AUTOSAVE_INTERVAL_MS);
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      void saveCurrentWorldNow();
    });
  }
}

export interface WorldMetadataRecord {
  worldId: string;
  name: string;
  seed: number;
  size: number;
  difficulty: string;
  timeOfDay: number;
  dayCount: number;
  playerPos: [number, number, number];
  playerRot: [number, number];
  health: number;
  hunger: number;
  oxygen: number;
  lastSaved: number;
}

export interface ChunkDeltaRecord {
  id: string;
  worldId: string;
  x: number;
  y: number;
  z: number;
  deltas: Record<string, number>;
}

export interface InventoryRecord {
  worldId: string;
  activeSlot: number;
  hotbar: (any | null)[];
  storage: (any | null)[];
  armor: (any | null)[];
}

export interface SaveSnapshot {
  metadata: WorldMetadataRecord;
  inventory: InventoryRecord;
  chunkDeltas: Record<string, [number, number][]>;
}

export function snapshotSave(format: 'full' | 'metadata+inv' = 'full'): SaveSnapshot {
  const s = useGameStore.getState();
  return {
    metadata: {
      worldId: s.activeWorldId ?? 'unknown',
      name: s.worldName,
      seed: s.worldSeed,
      size: s.worldSize,
      difficulty: s.difficulty,
      timeOfDay: s.timeOfDay,
      dayCount: s.dayCount,
      playerPos: s.playerPos,
      playerRot: s.playerRot,
      health: s.health,
      hunger: s.hunger,
      oxygen: s.oxygen,
      lastSaved: Date.now(),
    },
    inventory: {
      worldId: s.activeWorldId ?? 'unknown',
      activeSlot: s.activeSlot,
      hotbar: s.hotbar,
      storage: s.storage,
      armor: s.armor,
    },
    chunkDeltas: {},
  };
}

let inMemoryChunkDeltas = new Map<string, Record<string, number>>();

export function recordChunkDelta(worldId: string, chunkKey: string, localIndex: number, blockId: number) {
  let bag = inMemoryChunkDeltas.get(`${worldId}|${chunkKey}`);
  if (!bag) {
    bag = {};
    inMemoryChunkDeltas.set(`${worldId}|${chunkKey}`, bag);
  }
  if (blockId === 0) {
    delete bag[String(localIndex)];
  } else {
    bag[String(localIndex)] = blockId;
  }
}

export function getInMemoryChunkDeltas(): Map<string, Record<string, number>> {
  return inMemoryChunkDeltas;
}

export function clearInMemoryChunkDeltas() {
  inMemoryChunkDeltas = new Map();
}

export async function saveCurrentWorldNow(): Promise<void> {
  const s = useGameStore.getState();
  if (!s.activeWorldId) return;
  const snap = snapshotSave();
  const db = await getDb();
  const tx = db.transaction(['worlds', 'inventories', 'chunk_deltas'], 'readwrite');
  await tx.objectStore('worlds').put(snap.metadata);
  await tx.objectStore('inventories').put(snap.inventory);
  const deltas = inMemoryChunkDeltas;
  for (const [compositeKey, bag] of deltas.entries()) {
    const [wid, chunkKey] = compositeKey.split('|');
    const [cx, cy, cz] = chunkKey.split(',').map(Number);
    const record: ChunkDeltaRecord = { id: `${wid}_${cx}_${cy}_${cz}`, worldId: wid, x: cx, y: cy, z: cz, deltas: bag };
    await tx.objectStore('chunk_deltas').put(record);
  }
  await tx.done;
  inMemoryChunkDeltas = new Map();
  if (typeof localStorage !== 'undefined' && s.activeWorldId) {
    localStorage.setItem('blockcraft_last_played', s.activeWorldId);
  }
  useGameStore.getState().markSaved();
}

async function runAutosave(): Promise<void> {
  if (autosaveInFlight) return;
  autosaveInFlight = true;
  try {
    await saveCurrentWorldNow();
    autosaveRetry = 0;
  } catch (err) {
    autosaveRetry += 1;
    if (autosaveRetry <= 3) {
      console.warn('autosave retry', autosaveRetry, err);
    } else {
      console.error('autosave failed', err);
    }
  } finally {
    autosaveInFlight = false;
  }
}

export async function listWorlds(): Promise<WorldMetadataRecord[]> {
  const db = await getDb();
  return db.getAll('worlds');
}

export async function loadWorld(worldId: string): Promise<boolean> {
  const db = await getDb();
  const meta = await db.get('worlds', worldId);
  if (!meta) return false;
  const inv = await db.get('inventories', worldId);
  const allDeltas = await db.getAllFromIndex('chunk_deltas', 'by_world', worldId);
  const chunkDeltas: Record<string, [number, number][] | Record<string, number>> = {};
  for (const d of allDeltas) {
    const key = `${d.x},${d.y},${d.z}`;
    chunkDeltas[key] = Object.entries(d.deltas).map(([k, v]) => [Number(k), v as number]) as [number, number][];
    inMemoryChunkDeltas.set(`${worldId}|${key}`, d.deltas);
  }
  useGameStore.setState({
    screen: 'game',
    activeWorldId: meta.worldId,
    worldName: meta.name,
    worldSeed: meta.seed,
    worldSize: meta.size,
    difficulty: meta.difficulty,
    timeOfDay: meta.timeOfDay,
    dayCount: meta.dayCount,
    playerPos: meta.playerPos,
    playerRot: meta.playerRot,
    health: meta.health,
    hunger: meta.hunger,
    oxygen: meta.oxygen,
    activeSlot: inv?.activeSlot ?? 0,
    hotbar: inv?.hotbar ?? [],
    storage: inv?.storage ?? [],
    armor: inv?.armor ?? [],
    isPaused: false,
    showInventory: false,
    showGameOver: false,
    pauseReason: null,
  });
  if (typeof localStorage !== 'undefined') localStorage.setItem('blockcraft_last_played', worldId);
  return true;
}

export async function deleteWorld(worldId: string): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(['worlds', 'inventories', 'chunk_deltas'], 'readwrite');
  await tx.objectStore('worlds').delete(worldId);
  await tx.objectStore('inventories').delete(worldId);
  const idx = tx.objectStore('chunk_deltas').index('by_world');
  let cursor = await idx.openCursor(worldId);
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
}

export async function exportWorldSave(worldId: string): Promise<Blob> {
  const db = await getDb();
  const meta = await db.get('worlds', worldId);
  if (!meta) throw new Error('world not found');
  const inv = await db.get('inventories', worldId);
  const allDeltas = await db.getAllFromIndex('chunk_deltas', 'by_world', worldId);
  const chunkDeltas: Record<string, [number, number][]> = {};
  for (const d of allDeltas) {
    chunkDeltas[`${d.x}_${d.y}_${d.z}`] = Object.entries(d.deltas).map(([k, v]) => [Number(k), v as number]);
  }
  const payload: SaveBackupFormat = {
    version: '1.0',
    metadata: {
      worldId: meta.worldId,
      worldName: meta.name,
      seed: meta.seed,
      size: meta.size,
      difficulty: meta.difficulty,
      time: meta.timeOfDay,
      dayCount: meta.dayCount,
      player: {
        position: meta.playerPos,
        rotation: meta.playerRot,
        health: meta.health,
        hunger: meta.hunger,
        oxygen: meta.oxygen,
      },
    },
    inventory: {
      hotbar: inv?.hotbar ?? [],
      storage: inv?.storage ?? [],
      armor: inv?.armor ?? [],
      activeSlot: inv?.activeSlot ?? 0,
    },
    chunkDeltas,
  };
  return new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
}

export async function importWorldSave(fileData: SaveBackupFormat): Promise<string> {
  if (!fileData || fileData.version !== '1.0') throw new Error('Invalid save format version');
  if (!fileData.metadata || !fileData.inventory) throw new Error('Invalid save format');
  const worldId = fileData.metadata.worldId;
  const db = await getDb();
  const tx = db.transaction(['worlds', 'inventories', 'chunk_deltas'], 'readwrite');
  await tx.objectStore('worlds').put({
    worldId,
    name: fileData.metadata.worldName,
    seed: fileData.metadata.seed,
    size: fileData.metadata.size,
    difficulty: fileData.metadata.difficulty,
    timeOfDay: fileData.metadata.time,
    dayCount: fileData.metadata.dayCount ?? 1,
    playerPos: fileData.metadata.player.position,
    playerRot: fileData.metadata.player.rotation,
    health: fileData.metadata.player.health,
    hunger: fileData.metadata.player.hunger,
    oxygen: fileData.metadata.player.oxygen ?? 100,
    lastSaved: Date.now(),
  } satisfies WorldMetadataRecord);
  await tx.objectStore('inventories').put({
    worldId,
    activeSlot: fileData.inventory.activeSlot,
    hotbar: fileData.inventory.hotbar,
    storage: fileData.inventory.storage,
    armor: fileData.inventory.armor ?? [null, null, null, null],
  } satisfies InventoryRecord);
  for (const [key, list] of Object.entries(fileData.chunkDeltas)) {
    const parts = key.includes(',') ? key.split(',') : key.split('_');
    const [x, y, z] = parts.map(Number);
    const deltas: Record<string, number> = {};
    for (const [i, v] of list) deltas[String(i)] = v;
    await tx.objectStore('chunk_deltas').put({
      id: `${worldId}_${x}_${y}_${z}`,
      worldId,
      x,
      y,
      z,
      deltas,
    } satisfies ChunkDeltaRecord);
  }
  await tx.done;
  if (typeof localStorage !== 'undefined') localStorage.setItem('blockcraft_last_played', worldId);
  return worldId;
}