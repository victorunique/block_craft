import { useGameStore } from '../../store/gameStore';
import { useEffect, useState } from 'react';
import { useViewport } from '../../../hooks/useViewport';
import { getBiomeName } from '../../world/biome';
import MobileControls from '../MobileControls/MobileControls';
import ControlsHint from './ControlsHint';
import TutorialOverlay from './TutorialOverlay';
import './hud.css';

function HeartsGrid({ health }: { health: number }) {
  const slots = [];
  for (let i = 0; i < 10; i++) {
    const v = health - i * 2;
    let state: 'full' | 'half' | 'empty' = 'empty';
    if (v >= 2) state = 'full';
    else if (v >= 1) state = 'half';
    slots.push(state);
  }
  return (
    <div className="hearts" aria-label={`Health ${health} of 20`}>
      {slots.map((s, i) => (
        <span key={i} className={`heart ${s}`} aria-hidden>❤</span>
      ))}
    </div>
  );
}

function HungerGrid({ hunger }: { hunger: number }) {
  const slots = [];
  for (let i = 0; i < 10; i++) {
    const v = hunger - i * 2;
    let state: 'full' | 'half' | 'empty' = 'empty';
    if (v >= 2) state = 'full';
    else if (v >= 1) state = 'half';
    slots.push(state);
  }
  return (
    <div className={`hunger ${hunger <= 4 ? 'warning' : ''}`} aria-label={`Hunger ${hunger} of 20`}>
      {slots.map((s, i) => (
        <span key={i} className={`drumstick ${s}`} aria-hidden>🍗</span>
      ))}
    </div>
  );
}

function OxygenBubbles({ oxygen }: { oxygen: number }) {
  if (oxygen >= 100) return null;
  const slots = [];
  for (let i = 0; i < 10; i++) {
    const v = oxygen - i * 10;
    const state = v >= 10 ? 'full' : v >= 5 ? 'half' : 'empty';
    slots.push(state);
  }
  return (
    <div className="oxygen" aria-label={`Oxygen ${oxygen} of 100`}>
      {slots.map((s, i) => (
        <span key={i} className={`bubble ${s}`} aria-hidden>○</span>
      ))}
    </div>
  );
}

function Hotbar() {
  const hotbar = useGameStore((s) => s.hotbar);
  const activeSlot = useGameStore((s) => s.activeSlot);
  const setActiveSlot = useGameStore((s) => s.setActiveSlot);
  return (
    <div className="hotbar" role="listbox" aria-label="Hotbar">
      {hotbar.map((item, i) => (
        <button
          key={i}
          role="option"
          aria-selected={activeSlot === i}
          aria-label={`Hotbar Slot ${i + 1}: ${item ? `${item.count} item${item.count > 1 ? 's' : ''}` : 'empty'}`}
          className={`item-slot ${activeSlot === i ? 'selected' : ''}`}
          onClick={() => setActiveSlot(i)}
        >
          {item && (
            <>
              <span className="stack-count">{item.count}</span>
            </>
          )}
        </button>
      ))}
    </div>
  );
}

function TimeWheel({ timeOfDay }: { timeOfDay: number }) {
  const ratio = timeOfDay / 24000;
  const angle = ratio * 360;
  const isDay = ratio < 0.5;
  return (
    <div className="time-wheel" title={`Time: ${Math.floor((ratio * 24))}:00`} aria-label={`Time of day`}>
      <div className="time-icon" style={{ transform: `rotate(${angle}deg)` }}>
        {isDay ? '☀' : '🌙'}
      </div>
    </div>
  );
}

export default function Hud() {
  const health = useGameStore((s) => s.health);
  const hunger = useGameStore((s) => s.hunger);
  const oxygen = useGameStore((s) => s.oxygen);
  const timeOfDay = useGameStore((s) => s.timeOfDay);
  const playerPos = useGameStore((s) => s.playerPos);
  const toggleInventory = useGameStore((s) => s.toggleInventory);
  const togglePause = useGameStore((s) => s.togglePause);
  const viewport = useViewport();
  const [fps, setFps] = useState(60);

  useEffect(() => {
    let frames = 0;
    let last = performance.now();
    let raf = 0;
    const tick = () => {
      frames++;
      const now = performance.now();
      if (now - last >= 1000) {
        setFps(Math.round((frames * 1000) / (now - last)));
        frames = 0;
        last = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const biome = getBiomeName(playerPos[0], playerPos[2]);

  return (
    <>
      <div className="hud-top-left">
        <TimeWheel timeOfDay={timeOfDay} />
        <div className="biome-label">{biome}</div>
      </div>
      <div className="hud-top-right">
        <div className="fps-counter">{fps} FPS</div>
        {viewport.isMobile && (
          <div className="top-actions">
            <button className="hud-icon-btn" onClick={() => toggleInventory(true)} aria-label="Open inventory">🎒</button>
            <button className="hud-icon-btn" onClick={togglePause} aria-label="Pause">⏸</button>
          </div>
        )}
      </div>
      <ControlsHint />
      <TutorialOverlay />
      <div className="crosshair" aria-hidden>+</div>
      <div className="hud-bottom">
        <div className="status-bars">
          <OxygenBubbles oxygen={oxygen} />
          <HeartsGrid health={health} />
          <HungerGrid hunger={hunger} />
        </div>
        <Hotbar />
      </div>
      {viewport.isMobile && <MobileControls />}
    </>
  );
}