import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { uuid } from '../../../utils';
import { createTerrainGenerator } from '../../terrain/terrainGenerator';
import { createChunkManagerForWorld } from '../Hud/GameEngine';
import { createSpawner } from '../Hud/GameEngine';
import { setActiveWorld } from '../../world/activeWorld';
import { SEALEVEL, type Difficulty, type WorldSize } from '../../../config/constants';
import { classifyDevice, getLiveDeviceSignals, type DeviceTier } from '../../save/tierDetection';
import './worldCreation.css';

export default function WorldCreation() {
  const setScreen = useGameStore((s) => s.setScreen);
  const startGame = useGameStore((s) => s.startGame);
  const setLoading = useGameStore((s) => s.setLoading);
  const [name, setName] = useState('My Voxel World');
  const [size, setSize] = useState<WorldSize>(512);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [seedStr, setSeedStr] = useState('');
  const [tier, setTier] = useState<DeviceTier | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<{
    seed: number;
    worldId: string;
    worldName: string;
    spawnPos: [number, number, number];
  } | null>(null);

  useEffect(() => {
    void getLiveDeviceSignals().then((signals) => {
      setTier(classifyDevice(signals));
    });
  }, []);

  const actuallyStart = (
    seed: number,
    worldId: string,
    worldName: string,
    spawnPos: [number, number, number],
  ) => {
    startGame({ worldId, worldName, seed, size, difficulty, playerPos: spawnPos });
    const cm = createChunkManagerForWorld(seed, size, 8, worldId);
    const sp = createSpawner(cm, seed, size);
    setActiveWorld(cm, sp);
    setLoading(0.05, 'Generating terrain...');
    const { cx, cy, cz } = cm.worldToChunk(spawnPos[0], spawnPos[1], spawnPos[2]);
    void cm.ensureChunk(cx, cy, cz);
    void cm.updateAroundPlayer(spawnPos[0], spawnPos[1], spawnPos[2]);
    setScreen('loading');
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const seed = seedStr ? parseInt(seedStr, 10) : Math.floor(Math.random() * 90000000) + 10000000;
    const validSeed = Number.isFinite(seed) ? Math.abs(seed) : Math.floor(Math.random() * 90000000) + 10000000;
    const worldId = uuid();
    const worldName = name.trim() || 'My World';

    const gen = createTerrainGenerator(validSeed, size);
    const spawnX = 0;
    const spawnZ = 0;
    const spawnY = Math.max(SEALEVEL + 1, gen.getHeightAt(spawnX, spawnZ) + 1.2);
    const spawnPos: [number, number, number] = [spawnX, spawnY, spawnZ];

    if (size === 1024 && tier?.tier === 1) {
      setPendingConfirm({ seed: validSeed, worldId, worldName, spawnPos });
      return;
    }
    actuallyStart(validSeed, worldId, worldName, spawnPos);
  };

  const onConfirmAnyway = () => {
    if (!pendingConfirm) return;
    const { seed, worldId, worldName, spawnPos } = pendingConfirm;
    setPendingConfirm(null);
    actuallyStart(seed, worldId, worldName, spawnPos);
  };

  const onGoBack = () => setPendingConfirm(null);

  return (
    <div className="world-creation">
      <form className="wc-card" onSubmit={onSubmit} aria-labelledby="wc-title">
        <h1 id="wc-title" className="wc-title">Create a New World</h1>
        {tier?.tier === 1 && (
          <p className="wc-tier-note" aria-live="polite">
            Low-end device detected: rendering quality will be adjusted automatically.
          </p>
        )}
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
      {pendingConfirm && (
        <div className="modal tier-warning-modal" role="dialog" aria-labelledby="tier-warning-title">
          <div className="modal-card">
            <h2 id="tier-warning-title">This device has limited memory.</h2>
            <p>
              We recommend a Small or Medium world for the best performance. A Large world might cause the browser tab to restart.
            </p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={onGoBack}>Go Back</button>
              <button className="btn-primary" onClick={onConfirmAnyway}>Create Anyway</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
