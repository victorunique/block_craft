import { useGameStore } from '../../store/gameStore';
import { listWorlds, importWorldSave } from '../../save/saveManager';
import { useEffect, useState } from 'react';
import { importWorldSave as importSaveFn } from '../../save/saveManager';
import { useSettingsStore } from '../../store/settingsStore';
import SettingsModal from '../PauseMenu/SettingsModal';
import './mainMenu.css';

export default function MainMenu() {
  const [hasSave, setHasSave] = useState(false);
  const [worldName, setWorldName] = useState<string>('');
  const [importError, setImportError] = useState<string>('');
  const [importSuccess, setImportSuccess] = useState<string>('');
  const [importedWorldId, setImportedWorldId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const setScreen = useGameStore((s) => s.setScreen);
  const continueGame = useGameStore((s) => s.continueGame);
  const startGame = useGameStore((s) => s.startGame);

  useEffect(() => {
    (async () => {
      const worlds = await listWorlds();
      setHasSave(worlds.length > 0);
      if (worlds.length > 0) setWorldName(worlds[0].name);
    })();
  }, []);

  const onContinue = async () => {
    const ok = await continueGame();
    if (!ok) {
      setImportError('No save file found on this browser.');
      return;
    }
    // After loadWorld has populated the store with playerPos/seed/size,
    // construct the chunk manager + spawner and prime the spawn chunk.
    try {
      const { setActiveWorld } = await import('../../world/activeWorld');
      const { createChunkManagerForWorld, createSpawner } = await import('../Hud/GameEngine');
      const s = useGameStore.getState();
      if (s.worldSeed) {
        const cm = createChunkManagerForWorld(s.worldSeed, s.worldSize, 8, s.activeWorldId ?? undefined);
        const sp = createSpawner(cm, s.worldSeed, s.worldSize);
        setActiveWorld(cm, sp);
        const pos = s.playerPos;
        const { cx, cy, cz } = cm.worldToChunk(pos[0], pos[1], pos[2]);
        void cm.ensureChunk(cx, cy, cz);
        void cm.updateAroundPlayer(pos[0], pos[1], pos[2]);
      }
    } catch (err) {
      // Continue without an active world if construction fails (e.g. no Worker support).
      console.warn('Could not initialize active world on Continue', err);
    }
  };

  const onNewGame = () => setScreen('world-creation');

  const onImport = async () => {
    setImportError('');
    setImportSuccess('');
    setImportedWorldId(null);
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.blockcraft,.json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        const worldId = await importSaveFn(data);
        const worlds = await listWorlds();
        const w = worlds.find((x) => x.worldId === worldId);
        setImportSuccess(`World '${w?.name ?? 'Imported'}' imported successfully!`);
        setImportedWorldId(worldId);
        setHasSave(true);
        if (w) setWorldName(w.name);
      } catch (err: any) {
        setImportError("Oops! We couldn't read that backup file. Make sure it's a valid BlockCraft save.");
      }
    };
    input.click();
  };

  const onPlayImportedNow = async () => {
    if (!importedWorldId) return;
    const { loadWorld } = await import('../../save/saveManager');
    await loadWorld(importedWorldId);
    // Construct active world from the imported metadata
    try {
      const { setActiveWorld } = await import('../../world/activeWorld');
      const { createChunkManagerForWorld, createSpawner } = await import('../Hud/GameEngine');
      const s = useGameStore.getState();
      if (s.worldSeed) {
        const cm = createChunkManagerForWorld(s.worldSeed, s.worldSize, 8, s.activeWorldId ?? undefined);
        const sp = createSpawner(cm, s.worldSeed, s.worldSize);
        setActiveWorld(cm, sp);
        const pos = s.playerPos;
        const { cx, cy, cz } = cm.worldToChunk(pos[0], pos[1], pos[2]);
        void cm.ensureChunk(cx, cy, cz);
        void cm.updateAroundPlayer(pos[0], pos[1], pos[2]);
      }
    } catch (err) {
      console.warn('Could not initialize active world on Play Now', err);
    }
    setImportedWorldId(null);
    setImportSuccess('');
  };

  const onDismissImported = () => {
    setImportedWorldId(null);
    setImportSuccess('');
  };

  return (
    <div className="main-menu">
      <div className="main-menu-bg" />
      <div className="main-menu-sun" aria-hidden />
      <div className="main-menu-logo">
        <span className="logo-icon" aria-hidden>🟩</span>
        <span className="logo-text">BlockCraft</span>
      </div>
      <div className="main-menu-card">
        <button
          className={`menu-btn continue ${hasSave ? '' : 'disabled'}`}
          disabled={!hasSave}
          onClick={onContinue}
          aria-label="Continue last saved world"
        >
          Continue
          {hasSave && <span className="menu-sub">Resume: {worldName || 'Saved World'}</span>}
          {!hasSave && <span className="menu-sub">No save file found on this browser.</span>}
        </button>
        <button className="menu-btn new" onClick={onNewGame} aria-label="Create new world">
          New Game
        </button>
        <button className="menu-btn import" onClick={onImport} aria-label="Import .blockcraft save">
          Import Save
        </button>
        <button className="menu-btn settings" onClick={() => setShowSettings(true)} aria-label="Open settings">
          Settings
        </button>
      </div>
      <div className="main-menu-footer">
        <span>v1.0 Beta</span>
        <span>100% Offline · No Accounts Required!</span>
      </div>
      {importError && (
        <div className="toast error" role="alert" aria-live="assertive">
          {importError}
        </div>
      )}
      {importedWorldId && (
        <div className="modal import-success-modal" role="dialog" aria-labelledby="import-success-title">
          <div className="modal-card">
            <h2 id="import-success-title">{importSuccess}</h2>
            <div className="modal-actions">
              <button className="btn-primary" onClick={onPlayImportedNow} autoFocus>Play Now!</button>
              <button className="btn-secondary" onClick={onDismissImported}>Stay on Menu</button>
            </div>
          </div>
        </div>
      )}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}