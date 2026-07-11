import { useEffect, useState } from 'react';
import GameEngine, { createChunkManagerForWorld, createSpawner } from './GameEngine';
import { useGameStore } from '../../store/gameStore';
import { createTerrainGenerator } from '../../terrain/terrainGenerator';
import { useSettingsStore } from '../../store/settingsStore';

export default function GameViewport() {
  const [chunkManager, setChunkManager] = useState<ReturnType<typeof createChunkManagerForWorld> | null>(null);
  const [spawner, setSpawner] = useState<ReturnType<typeof createSpawner> | null>(null);
  const worldSeed = useGameStore((s) => s.worldSeed);
  const worldSize = useGameStore((s) => s.worldSize);
  const settings = useSettingsStore((s) => s.settings);

  useEffect(() => {
    if (!worldSeed) return;
    const cm = createChunkManagerForWorld(worldSeed, worldSize, settings.renderDistance);
    const sp = createSpawner(cm, worldSeed, worldSize);
    setChunkManager(cm);
    setSpawner(sp);
    return () => {
      void cm;
    };
  }, [worldSeed, worldSize, settings.renderDistance]);

  if (!chunkManager || !spawner) return null;
  return <GameEngine chunkManager={chunkManager} spawner={spawner} />;
}