import { useEffect, useState, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';
import { getActiveChunkManager } from '../../world/activeWorld';
import './loadingOverlay.css';

const MAX_WAIT_MS = 20000;

export default function LoadingOverlay() {
  const progress = useGameStore((s) => s.loadingProgress);
  const stage = useGameStore((s) => s.loadingStage);
  const setScreen = useGameStore((s) => s.setScreen);
  const setLoading = useGameStore((s) => s.setLoading);
  const [loaded, setLoaded] = useState(0);
  const [hint, setHint] = useState<string>('');
  const [title, setTitle] = useState<string>('Building your world…');
  const startedAtRef = useRef<number>(Date.now());
  const targetRef = useRef<{ cx: number; cy: number; cz: number } | null>(null);

  useEffect(() => {
    const isResume = useGameStore.getState().generated;
    setTitle(isResume ? 'Loading Your World…' : 'Building your world…');
    startedAtRef.current = Date.now();
    const id = setInterval(() => {
      const cm = getActiveChunkManager();
      if (!cm) {
        setLoaded(0);
        setHint(isResume ? 'Loading your world…' : 'Booting world engine…');
        return;
      }
      if (!targetRef.current) {
        const playerPos = useGameStore.getState().playerPos;
        targetRef.current = cm.worldToChunk(playerPos[0], playerPos[1], playerPos[2]);
        void cm.ensureChunk(targetRef.current.cx, targetRef.current.cy, targetRef.current.cz);
      }
      const l = cm.loadedCount();
      setLoaded(l);
      const elapsed = Date.now() - startedAtRef.current;
      const target = targetRef.current;
      const spawnReady = target ? !!cm.getChunk(target.cx, target.cy, target.cz)?.mesh : false;
      if (spawnReady && l >= 80) {
        setLoading(1, 'Ready!');
        clearInterval(id);
        setTimeout(() => setScreen('game'), 60);
        return;
      }
      if (elapsed > MAX_WAIT_MS) {
        setLoading(1, 'Ready (some terrain may load as you walk).');
        clearInterval(id);
        setTimeout(() => setScreen('game'), 60);
        return;
      }
      if (isResume) {
        if (!spawnReady) setHint('Restoring chunks…');
        else if (l < 80) setHint('Rebuilding meshes…');
        else setHint('Almost there…');
      } else {
        if (!spawnReady) setHint('Sculpting hills…');
        else if (l < 40) setHint('Spawning sheep…');
        else if (l < 80) setHint('Hiding diamonds…');
        else setHint('Populating animals…');
      }
      const frac = Math.min(0.95, 0.1 + (l / 200) * 0.85);
      setLoading(frac, hint);
    }, 120);
    return () => clearInterval(id);
  }, [setLoading, setScreen, hint]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  }, []);

  return (
    <div className="loading-overlay" role="status" aria-label="Generating world">
      <div className="loading-card">
        <div className="loading-spinner" aria-hidden />
        <h2 className="loading-title">{title}</h2>
        <div className="loading-bar-wrap">
          <div className="loading-bar" style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
        <div className="loading-stage">{stage || hint || 'Initialising…'}</div>
        <div className="loading-count" aria-live="polite">
          {loaded} chunk{loaded === 1 ? '' : 's'} ready
        </div>
        <button
          className="loading-cancel"
          onClick={() => {
            useGameStore.getState().quitToMenu();
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
