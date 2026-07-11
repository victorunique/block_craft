import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { saveCurrentWorldNow, exportWorldSave, importWorldSave, listWorlds, loadWorld, getDb } from '@/game/save/saveManager';
import { useGameStore } from '@/game/store/gameStore';
import { recordChunkDelta } from '@/game/save/saveManager';

beforeEach(async () => {
  localStorage.clear();
  const db = await getDb();
  const tx = db.transaction(['worlds', 'inventories', 'chunk_deltas'], 'readwrite');
  await tx.objectStore('worlds').clear();
  await tx.objectStore('inventories').clear();
  await tx.objectStore('chunk_deltas').clear();
  await tx.done;
  useGameStore.setState({
    screen: 'main-menu',
    activeWorldId: null,
    worldName: 'TestWorld',
    worldSeed: 12345,
    worldSize: 256,
    difficulty: 'medium',
    timeOfDay: 6000,
    dayCount: 1,
    health: 20,
    hunger: 20,
    oxygen: 100,
    playerPos: [0, 70, 0],
    playerRot: [0, 0],
    activeSlot: 0,
    hotbar: [],
    storage: [],
    armor: [],
  });
});

describe('Save Manager (SM-001)', () => {
  it('persists world metadata and chunk deltas to IndexedDB', async () => {
    useGameStore.setState({
      activeWorldId: 'test-world',
      worldName: 'Alpha',
      worldSeed: 999,
      worldSize: 256,
      difficulty: 'medium',
      playerPos: [12.5, 68.0, -45.2],
      health: 20,
      hunger: 20,
      oxygen: 100,
    });
    recordChunkDelta('test-world', '0,4,-1', 5 + 2 * 16 + 7 * 256, 4);
    await saveCurrentWorldNow();

    const db = await getDb();
    const meta = await db.get('worlds', 'test-world');
    expect(meta).toBeTruthy();
    expect(meta.name).toBe('Alpha');
    expect(meta.playerPos).toEqual([12.5, 68.0, -45.2]);

    const deltas = await db.getAllFromIndex('chunk_deltas', 'by_world', 'test-world');
    expect(deltas.length).toBe(1);
    const d = deltas[0];
    const expectedIndex = String(5 + 2 * 16 + 7 * 256);
    expect(d.deltas[expectedIndex]).toBe(4);
  });

  it('writes to localStorage last_played after save', async () => {
    useGameStore.setState({ activeWorldId: 'world-A' });
    await saveCurrentWorldNow();
    expect(localStorage.getItem('blockcraft_last_played')).toBe('world-A');
  });

  it('lists worlds from IndexedDB', async () => {
    useGameStore.setState({ activeWorldId: 'a' });
    await saveCurrentWorldNow();
    useGameStore.setState({ activeWorldId: 'b', worldName: 'Bravo' });
    await saveCurrentWorldNow();
    const list = await listWorlds();
    expect(list.length).toBe(2);
  });

  it('roundtrip: save → load → continue restores state exactly', async () => {
    useGameStore.setState({
      activeWorldId: 'rt',
      worldName: 'Roundtrip',
      worldSeed: 555,
      worldSize: 256,
      difficulty: 'hard',
      timeOfDay: 12345,
      dayCount: 4,
      playerPos: [5.5, 70.1, -3.3],
      health: 14,
      hunger: 18,
      oxygen: 95,
    });
    await saveCurrentWorldNow();
    useGameStore.setState({
      screen: 'main-menu',
      activeWorldId: null,
      playerPos: [0, 0, 0],
      health: 20,
    });
    const ok = await loadWorld('rt');
    expect(ok).toBe(true);
    const s = useGameStore.getState();
    expect(s.activeWorldId).toBe('rt');
    expect(s.worldName).toBe('Roundtrip');
    expect(s.worldSeed).toBe(555);
    expect(s.playerPos).toEqual([5.5, 70.1, -3.3]);
    expect(s.health).toBe(14);
    expect(s.hunger).toBe(18);
    expect(s.timeOfDay).toBe(12345);
    expect(s.dayCount).toBe(4);
    expect(s.screen).toBe('game');
  });
});

describe('Export / Import (.blockcraft)', () => {
  it('exports a JSON blob matching SaveBackupFormat', async () => {
    useGameStore.setState({
      activeWorldId: 'exp',
      worldName: 'ExpWorld',
      worldSeed: 777,
      worldSize: 256,
      difficulty: 'easy',
      playerPos: [1, 2, 3],
      health: 18,
      hunger: 16,
      oxygen: 100,
    });
    await saveCurrentWorldNow();
    const blob = await exportWorldSave('exp');
    const text = await blob.text();
    const data = JSON.parse(text);
    expect(data.version).toBe('1.0');
    expect(data.metadata.worldId).toBe('exp');
    expect(data.metadata.player.position).toEqual([1, 2, 3]);
  });

  it('imports a valid .blockcraft blob and adds world to IDB', async () => {
    const data = {
      version: '1.0',
      metadata: {
        worldId: 'imp1',
        worldName: 'Imported',
        seed: 12,
        size: 256,
        difficulty: 'medium',
        time: 5000,
        dayCount: 1,
        player: { position: [1, 2, 3] as [number, number, number], rotation: [0, 0] as [number, number], health: 20, hunger: 20, oxygen: 100 },
      },
      inventory: { hotbar: [], storage: [], armor: [], activeSlot: 0 },
      chunkDeltas: { '0_3_0': [[10, 4]] as [number, number][] },
    };
    const worldId = await importWorldSave(data as any);
    expect(worldId).toBe('imp1');
    const list = await listWorlds();
    expect(list.find((x) => x.worldId === 'imp1')).toBeTruthy();
  });

  it('rejects invalid backup with missing version', async () => {
    await expect(importWorldSave({} as any)).rejects.toThrow(/Invalid/);
  });
});

describe('Storage Guard (SM-002)', () => {
  it('does not throw when navigator.storage is unavailable', async () => {
    const orig = (navigator as any).storage;
    (navigator as any).storage = undefined;
    try {
      const { runStorageGuard } = await import('@/game/save/storageGuard');
      await runStorageGuard();
    } finally {
      (navigator as any).storage = orig;
    }
  });
});