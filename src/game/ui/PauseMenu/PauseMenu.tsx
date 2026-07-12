import { useGameStore } from '../../store/gameStore';
import { exportWorldSave, saveCurrentWorldNow } from '../../save/saveManager';
import SettingsModal from './SettingsModal';
import './pauseMenu.css';
import { useState } from 'react';

export default function PauseMenu() {
  const togglePause = useGameStore((s) => s.togglePause);
  const quitToMenu = useGameStore((s) => s.quitToMenu);
  const worldName = useGameStore((s) => s.worldName);
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState<string>('');

  const onExport = async () => {
    const id = useGameStore.getState().activeWorldId;
    if (!id) return;
    const blob = await exportWorldSave(id);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${worldName.replace(/\s+/g, '_')}.blockcraft`;
    a.click();
    URL.revokeObjectURL(url);
    setToast('Backup saved! Save this file to keep your progress safe.');
    setTimeout(() => setToast(''), 3000);
  };

  const onQuit = async () => {
    await saveCurrentWorldNow();
    quitToMenu();
  };

  return (
    <div className="pause-overlay" role="dialog" aria-label="Game Paused">
      <div className="pause-card">
        <h1 className="pause-title">Game Paused</h1>
        <button className="pause-btn primary" onClick={togglePause}>Resume Game</button>
        <button className="pause-btn" onClick={() => setShowSettings(true)}>Settings</button>
        <button className="pause-btn amber" onClick={onExport}>Backup World (.blockcraft)</button>
        <button className="pause-btn danger" onClick={onQuit}>Quit to Title Menu</button>
        {toast && <div className="pause-toast">{toast}</div>}
      </div>
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}