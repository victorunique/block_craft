import { useEffect, useState } from 'react';
import GameEngine from './GameEngine';
import { useGameStore } from '../../store/gameStore';
import { useSettingsStore } from '../../store/settingsStore';
import { getActiveChunkManager, getActiveSpawner, setActiveWorld } from '../../world/activeWorld';
import { createChunkManagerForWorld, createSpawner } from './GameEngine';

export default function GameViewport() {
  const worldSeed = useGameStore((s) => s.worldSeed);
  const worldSize = useGameStore((s) => s.worldSize);
  const activeWorldId = useGameStore((s) => s.activeWorldId);
  const screen = useGameStore((s) => s.screen);
  const settings = useSettingsStore((s) => s.settings);

  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!worldSeed) return;
    let cm = getActiveChunkManager();
    if (!cm) {
      cm = createChunkManagerForWorld(worldSeed, worldSize, settings.renderDistance, activeWorldId ?? undefined);
      const sp = createSpawner(cm, worldSeed, worldSize);
      setActiveWorld(cm, sp);
    } else {
      cm.setRenderDistance(settings.renderDistance);
    }
    setInitialized(true);
  }, [worldSeed, worldSize, settings.renderDistance]);

  const cm = getActiveChunkManager();
  const sp = getActiveSpawner();
  if (screen === 'loading' || !initialized || !cm || !sp) {
    return <div className="game-viewport" />;
  }
  return (
    <div className="game-viewport">
      <GameEngine
        key={activeWorldId ?? `${worldSeed}-${worldSize}`}
        chunkManager={cm}
        spawner={sp}
      />
    </div>
  );
}
