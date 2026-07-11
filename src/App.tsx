import { useEffect, useState } from 'react';
import MainMenu from './game/ui/MainMenu/MainMenu';
import WorldCreation from './game/ui/WorldCreation/WorldCreation';
import LoadingOverlay from './game/ui/LoadingOverlay/LoadingOverlay';
import Hud from './game/ui/Hud/Hud';
import InventoryDialog from './game/ui/Inventory/InventoryDialog';
import PauseMenu from './game/ui/PauseMenu/PauseMenu';
import GameOver from './game/ui/GameOver/GameOver';
import GameViewport from './game/ui/Hud/GameViewport';
import { useGameStore } from './game/store/gameStore';
import { initSettingsStore, useSettingsStore } from './game/store/settingsStore';
import { initSaveManager } from './game/save/saveManager';
import { runStorageGuard } from './game/save/storageGuard';
import './styles/app.css';

export default function App() {
  const screen = useGameStore((s) => s.screen);
  const isPaused = useGameStore((s) => s.isPaused);
  const health = useGameStore((s) => s.health);
  const showInventory = useGameStore((s) => s.showInventory);
  const showGameOver = useGameStore((s) => s.showGameOver);
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await initSettingsStore();
      await initSaveManager();
      await runStorageGuard();
      if (typeof window !== 'undefined') {
        (window as any).__bcGameStore = useGameStore;
        (window as any).__bcSettingsStore = useSettingsStore;
      }
      if (!cancelled) setBootstrapped(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!bootstrapped) {
    return (
      <div className="boot-screen" role="status" aria-label="Loading BlockCraft">
        <div className="boot-spinner" />
      </div>
    );
  }

  const gameOver = health <= 0 || showGameOver;

  return (
    <div className="app-root">
      {screen === 'main-menu' && <MainMenu />}
      {screen === 'world-creation' && <WorldCreation />}
      {screen === 'loading' && <LoadingOverlay />}
      {screen === 'game' && (
        <>
          <GameViewport />
          <Hud />
          {showInventory && <InventoryDialog />}
          {(isPaused) && <PauseMenu />}
          {gameOver && <GameOver />}
        </>
      )}
      {screen === 'paused' && (
        <>
          <Hud />
          <PauseMenu />
        </>
      )}
      <AutoSaveToast />
    </div>
  );
}

function AutoSaveToast() {
  const lastSave = useGameStore((s) => s.lastSaveTick);
  const [show, setShow] = useState(false);
  const screen = useGameStore((s) => s.screen);
  useEffect(() => {
    if (screen !== 'game' || !lastSave) return;
    setShow(true);
    const t = setTimeout(() => setShow(false), 1500);
    return () => clearTimeout(t);
  }, [lastSave, screen]);
  if (!show) return null;
  return (
    <div className="autosave-toast" role="status" aria-live="polite">
      <span aria-hidden>✓</span> Progress Saved!
    </div>
  );
}

export type { Screen } from './game/store/types';