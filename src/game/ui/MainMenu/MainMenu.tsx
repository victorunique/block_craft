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
    if (!ok) setImportError('No save file found on this browser.');
  };

  const onNewGame = () => setScreen('world-creation');

  const onImport = async () => {
    setImportError('');
    setImportSuccess('');
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
        setHasSave(true);
        setWorldName(w?.name ?? '');
        setTimeout(() => {
          useGameStore.setState({
            activeWorldId: worldId,
            worldName: w?.name ?? '',
            worldSeed: w?.seed ?? 0,
            worldSize: (w?.size ?? 256) as any,
            difficulty: (w?.difficulty ?? 'medium') as any,
            playerPos: w?.playerPos ?? [0, 72, 0],
            screen: 'game',
          });
        }, 800);
      } catch (err: any) {
        setImportError("Oops! We couldn't read that backup file. Make sure it's a valid BlockCraft save.");
      }
    };
    input.click();
  };

  return (
    <div className="main-menu">
      <div className="main-menu-bg" />
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
      {importSuccess && (
        <div className="toast success" role="status" aria-live="polite">
          {importSuccess}
        </div>
      )}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}