import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { uuid } from '../../../utils';
import { createTerrainGenerator } from '../../terrain/terrainGenerator';
import { SEALEVEL, type Difficulty, type WorldSize } from '../../../config/constants';
import './worldCreation.css';

export default function WorldCreation() {
  const setScreen = useGameStore((s) => s.setScreen);
  const startGame = useGameStore((s) => s.startGame);
  const setLoading = useGameStore((s) => s.setLoading);
  const [name, setName] = useState('My Voxel World');
  const [size, setSize] = useState<WorldSize>(512);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [seedStr, setSeedStr] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const seed = seedStr ? parseInt(seedStr, 10) : Math.floor(Math.random() * 90000000) + 10000000;
    const validSeed = Number.isFinite(seed) ? Math.abs(seed) : Math.floor(Math.random() * 90000000) + 10000000;
    const worldId = uuid();
    const worldName = name.trim() || 'My World';
    startGame({ worldId, worldName, seed: validSeed, size, difficulty, playerPos: [0, 72, 0] });
    setLoading(0.05, 'Sculpting hills...');
    setTimeout(() => setLoading(0.3, 'Planting trees...'), 80);
    setTimeout(() => setLoading(0.6, 'Hiding diamonds...'), 160);
    setTimeout(() => setLoading(0.9, 'Populating animals...'), 240);
    setTimeout(() => {
      const gen = createTerrainGenerator(validSeed, size);
      const spawnY = gen.getHeightAt(0, 0) + 2;
      useGameStore.setState({ playerPos: [0, spawnY, 0] });
      setLoading(1, 'Ready!');
      setTimeout(() => setScreen('game'), 80);
    }, 320);
  };

  return (
    <div className="world-creation">
      <form className="wc-card" onSubmit={onSubmit} aria-labelledby="wc-title">
        <h1 id="wc-title" className="wc-title">Create a New World</h1>
        <label className="wc-field">
          <span className="wc-label">World Name</span>
          <input
            type="text"
            maxLength={24}
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 24))}
            placeholder="My Voxel World"
          />
        </label>
        <div className="wc-field">
          <span className="wc-label">World Size</span>
          <div className="seg-group">
            {([256, 512, 1024] as WorldSize[]).map((s) => (
              <button
                key={s}
                type="button"
                className={`seg ${size === s ? 'selected' : ''}`}
                onClick={() => setSize(s)}
                aria-pressed={size === s}
              >
                {s === 256 ? 'Small' : s === 512 ? 'Medium' : 'Large'} ({s}×{s})
              </button>
            ))}
          </div>
        </div>
        <div className="wc-field">
          <span className="wc-label">Difficulty</span>
          <div className="seg-group">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
              <button
                key={d}
                type="button"
                className={`seg diff ${difficulty === d ? 'selected ' + d : d}`}
                onClick={() => setDifficulty(d)}
                aria-pressed={difficulty === d}
              >
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <label className="wc-field">
          <span className="wc-label">Seed (optional, numbers only)</span>
          <input
            type="text"
            value={seedStr}
            onChange={(e) => setSeedStr(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="Leave blank for random"
          />
        </label>
        <div className="wc-actions">
          <button type="button" className="btn-secondary" onClick={() => setScreen('main-menu')}>
            Cancel
          </button>
          <button type="submit" className="btn-primary">Create World</button>
        </div>
      </form>
    </div>
  );
}