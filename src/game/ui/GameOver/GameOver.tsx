import { useGameStore } from '../../store/gameStore';
import './gameOver.css';

export default function GameOver() {
  const respawn = useGameStore((s) => s.respawn);
  const quitToMenu = useGameStore((s) => s.quitToMenu);
  return (
    <div className="game-over" role="dialog" aria-label="Game Over">
      <div className="game-over-card">
        <h1>You died!</h1>
        <p>Your adventure has come to an end... for now.</p>
        <div className="game-over-actions">
          <button className="go-btn primary" onClick={respawn}>Respawn</button>
          <button className="go-btn" onClick={quitToMenu}>Quit to Title Menu</button>
        </div>
      </div>
    </div>
  );
}