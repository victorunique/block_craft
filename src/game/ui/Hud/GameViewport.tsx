import { useEffect } from 'react';
import GameEngine from './GameEngine';
import { useGameStore } from '../../store/gameStore';
import { useSettingsStore } from '../../store/settingsStore';
import { getActiveChunkManager, getActiveSpawner, setActiveWorld } from '../../world/activeWorld';
import { createChunkManagerForWorld, createSpawner } from './GameEngine';

export default function GameViewport() {
  const worldSeed = useGameStore((s) => s.worldSeed);
  const worldSize = useGameStore((s) => s.worldSize);
  const playerPos = useGameStore((s) => s.playerPos);
  const settings = useSettingsStore((s) => s.settings);

  useEffect(() => {
    if (!worldSeed) return;
    let cm = getActiveChunkManager();
    if (!cm) {
      cm = createChunkManagerForWorld(worldSeed, worldSize, settings.renderDistance);
      const sp = createSpawner(cm, worldSeed, worldSize);
      setActiveWorld(cm, sp);
    } else {
      cm.setRenderDistance(settings.renderDistance);
    }
  }, [worldSeed, worldSize, settings.renderDistance]);

  const cm = getActiveChunkManager();
  const sp = getActiveSpawner();
  if (!cm || !sp) {
    return <div className="game-viewport" />;
  }
  return (
    <div className="game-viewport">
      <GameEngine
        key={`${worldSeed}-${worldSize}-${settings.renderDistance}-${Math.floor(playerPos[0] / 16)}-${Math.floor(playerPos[2] / 16)}`}
        chunkManager={cm}
        spawner={sp}
      />
    </div>
  );
}
