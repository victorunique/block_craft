import { useSettingsStore } from '../../store/settingsStore';
import { useGameStore } from '../../store/gameStore';
import { useEffect, useRef, useState } from 'react';
import './mobileControls.css';

export default function MobileControls() {
  const layout = useSettingsStore((s) => s.settings.controlLayout);
  const isLeftHanded = layout === 'left-handed';
  const togglePause = useGameStore((s) => s.togglePause);
  const toggleInventory = useGameStore((s) => s.toggleInventory);
  const setActiveSlot = useGameStore((s) => s.setActiveSlot);
  const hotbar = useGameStore((s) => s.hotbar);
  const [joystick, setJoystick] = useState({ x: 0, y: 0, active: false });
  const [look, setLook] = useState({ x: 0, y: 0, active: false });
  const moveRef = useRef<{ id: number | null; cx: number; cy: number }>({ id: null, cx: 0, cy: 0 });
  const lookRef = useRef<{ id: number | null; lx: number; ly: number }>({ id: null, lx: 0, ly: 0 });
  const movePos = useRef({ x: 0, y: 0 });
  const lookPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        const w = window.innerWidth;
        const joystickZone = isLeftHanded ? w * 0.4 : w * 0.4;
        const inMoveZone = isLeftHanded ? t.clientX > w * 0.6 : t.clientX < w * 0.4;
        if (inMoveZone && moveRef.current.id === null) {
          moveRef.current = { id: t.identifier, cx: t.clientX, cy: t.clientY };
          movePos.current = { x: t.clientX, y: t.clientY };
          setJoystick({ x: 0, y: 0, active: true });
        } else if (!inMoveZone && lookRef.current.id === null) {
          lookRef.current = { id: t.identifier, lx: t.clientX, ly: t.clientY };
          lookPos.current = { x: t.clientX, y: t.clientY };
          setLook({ x: 0, y: 0, active: true });
        }
        void joystickZone;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === moveRef.current.id) {
          const dx = t.clientX - movePos.current.x;
          const dy = t.clientY - movePos.current.y;
          movePos.current = { x: t.clientX, y: t.clientY };
          setJoystick({ x: clamp(dx / 40, -1, 1), y: clamp(dy / 40, -1, 1), active: true });
        }
        if (t.identifier === lookRef.current.id) {
          const dx = t.clientX - lookPos.current.x;
          const dy = t.clientY - lookPos.current.y;
          lookPos.current = { x: t.clientX, y: t.clientY };
          setLook({ x: dx, y: dy, active: true });
          window.dispatchEvent(new CustomEvent('blockcraft-look', { detail: { dx, dy } }));
        }
      }
    };
    const onTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === moveRef.current.id) {
          moveRef.current = { id: null, cx: 0, cy: 0 };
          setJoystick({ x: 0, y: 0, active: false });
        }
        if (t.identifier === lookRef.current.id) {
          lookRef.current = { id: null, lx: 0, ly: 0 };
          setLook({ x: 0, y: 0, active: false });
        }
      }
    };
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [isLeftHanded]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('blockcraft-move', { detail: { x: joystick.x, y: joystick.y } }));
  }, [joystick]);

  return (
    <div className={`mobile-controls ${isLeftHanded ? 'left-handed' : 'right-handed'}`} aria-hidden>
      <div className="joystick-zone">
        <div className="joystick-base">
          <div
            className="joystick-thumb"
            style={{ transform: `translate(${joystick.x * 30}px, ${joystick.y * 30}px)` }}
          />
        </div>
      </div>
      <div className="action-zone">
        <button className="action-btn jump" aria-label="Jump">↑</button>
        <button className="action-btn mine" aria-label="Mine / Attack">⛏</button>
        <button className="action-btn place" aria-label="Place / Interact">+</button>
      </div>
      <div className="hotbar-row" role="listbox" aria-label="Hotbar">
        {hotbar.map((item, i) => (
          <button
            key={i}
            className="hotbar-slot"
            aria-label={`Hotbar ${i + 1}`}
            onClick={() => setActiveSlot(i)}
          >
            {item && <span className="stack-count">{item.count}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}