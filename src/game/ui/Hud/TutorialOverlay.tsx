import { useGameStore } from '../../store/gameStore';
import './tutorialOverlay.css';

export default function TutorialOverlay() {
  const health = useGameStore((s) => s.health);
  const playerPos = useGameStore((s) => s.playerPos);
  const showGameOver = useGameStore((s) => s.showGameOver);
  const showInventory = useGameStore((s) => s.showInventory);
  const isPaused = useGameStore((s) => s.isPaused);
  if (health <= 0 || showGameOver || showInventory || isPaused) return null;
  const [x, y, z] = playerPos;
  return (
    <div className="tutorial-overlay" role="status" aria-live="polite">
      <div className="tutorial-card">
        <div className="tutorial-step">
          <div className="tutorial-icon">▶</div>
          <div className="tutorial-text">
            <div className="tutorial-title">Welcome to your world</div>
            <div className="tutorial-sub">You are at ({Math.round(x)}, {Math.round(y)}, {Math.round(z)})</div>
          </div>
        </div>
        <div className="tutorial-tip">
          <strong>Tip:</strong> Break the grass block under your feet with <kbd>L-Click</kbd> to start gathering resources.
        </div>
      </div>
    </div>
  );
}