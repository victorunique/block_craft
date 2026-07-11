import { useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import './loadingOverlay.css';

export default function LoadingOverlay() {
  const progress = useGameStore((s) => s.loadingProgress);
  const stage = useGameStore((s) => s.loadingStage);

  useEffect(() => {
    document.title = `BlockCraft — ${Math.round(progress * 100)}%`;
  }, [progress]);

  return (
    <div className="loading-overlay" role="status" aria-label="Generating world">
      <div className="loading-card">
        <div className="loading-spinner" aria-hidden />
        <div className="loading-bar-wrap">
          <div className="loading-bar" style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
        <div className="loading-stage">{stage || 'Loading...'}</div>
        <button
          className="loading-cancel"
          onClick={() => useGameStore.getState().setScreen('main-menu')}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}