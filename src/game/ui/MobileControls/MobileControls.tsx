import { useSettingsStore } from '../../store/settingsStore';
import { useGameStore } from '../../store/gameStore';
import { useInputStore } from '../../store/inputStore';
import { useEffect, useRef, useState } from 'react';
import ItemIcon from '../common/ItemIcon';
import { DurabilityBar, getToolMaxDurability } from '../common/DurabilityBar';
import './mobileControls.css';

export default function MobileControls() {
  const layout = useSettingsStore((s) => s.settings.controlLayout);
  const isLeftHanded = layout === 'left-handed';
  const togglePause = useGameStore((s) => s.togglePause);
  const toggleInventory = useGameStore((s) => s.toggleInventory);
  const setActiveSlot = useGameStore((s) => s.setActiveSlot);
  const hotbar = useGameStore((s) => s.hotbar);
  const activeSlot = useGameStore((s) => s.activeSlot);

  const lookRef = useRef<{ id: number | null; lx: number; ly: number }>({ id: null, lx: 0, ly: 0 });
  const lookPos = useRef({ x: 0, y: 0 });
  const dpadRef = useRef<HTMLDivElement>(null);

  const [activeDirs, setActiveDirs] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
  });

  const activeDirectionsRef = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
  });

  const updateMovement = (dirs: { forward: boolean; backward: boolean; left: boolean; right: boolean }) => {
    activeDirectionsRef.current = dirs;
    setActiveDirs(dirs);

    let dx = 0;
    let dy = 0;
    if (dirs.left) dx -= 1;
    if (dirs.right) dx += 1;
    if (dirs.forward) dy -= 1;
    if (dirs.backward) dy += 1;

    useInputStore.getState().setMove(dx, dy);
  };

  // Track window touches for looking around (excluding interactive elements)
  useEffect(() => {
    const onWindowTouchStart = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        const target = t.target as HTMLElement;
        const isInteractive = target.closest('button, .dpad-container, .action-zone, .hotbar-row');
        
        if (!isInteractive && lookRef.current.id === null) {
          lookRef.current = { id: t.identifier, lx: t.clientX, ly: t.clientY };
          lookPos.current = { x: t.clientX, y: t.clientY };
        }
      }
    };

    const onWindowTouchMove = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === lookRef.current.id) {
          const dx = t.clientX - lookPos.current.x;
          const dy = t.clientY - lookPos.current.y;
          lookPos.current = { x: t.clientX, y: t.clientY };
          useInputStore.getState().setLook(dx, dy);
        }
      }
    };

    const onWindowTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === lookRef.current.id) {
          lookRef.current = { id: null, lx: 0, ly: 0 };
        }
      }
    };

    window.addEventListener('touchstart', onWindowTouchStart, { passive: true });
    window.addEventListener('touchmove', onWindowTouchMove, { passive: true });
    window.addEventListener('touchend', onWindowTouchEnd);
    window.addEventListener('touchcancel', onWindowTouchEnd);

    return () => {
      window.removeEventListener('touchstart', onWindowTouchStart);
      window.removeEventListener('touchmove', onWindowTouchMove);
      window.removeEventListener('touchend', onWindowTouchEnd);
      window.removeEventListener('touchcancel', onWindowTouchEnd);
    };
  }, []);

  // Track touches on the D-pad for continuous sliding movement
  useEffect(() => {
    const handleTouch = (e: TouchEvent) => {
      const newDirections = { forward: false, backward: false, left: false, right: false };

      for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        if (element) {
          const button = element.closest('.dpad-btn');
          if (button && dpadRef.current && dpadRef.current.contains(button)) {
            const dir = button.getAttribute('data-direction') as 'forward' | 'backward' | 'left' | 'right';
            if (dir) {
              newDirections[dir] = true;
            }
          }
        }
      }

      updateMovement(newDirections);
    };

    const dpad = dpadRef.current;
    if (dpad) {
      dpad.addEventListener('touchstart', handleTouch, { passive: true });
      dpad.addEventListener('touchmove', handleTouch, { passive: true });
      dpad.addEventListener('touchend', handleTouch, { passive: true });
      dpad.addEventListener('touchcancel', handleTouch, { passive: true });
    }

    return () => {
      if (dpad) {
        dpad.removeEventListener('touchstart', handleTouch);
        dpad.removeEventListener('touchmove', handleTouch);
        dpad.removeEventListener('touchend', handleTouch);
        dpad.removeEventListener('touchcancel', handleTouch);
      }
      useInputStore.getState().setMove(0, 0);
    };
  }, []);

  // Mouse/pointer events for non-touch testing in desktop browser
  const handlePointerDown = (dir: 'forward' | 'backward' | 'left' | 'right', e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    const newDirs = { ...activeDirectionsRef.current, [dir]: true };
    updateMovement(newDirs);
  };

  const handlePointerUp = (dir: 'forward' | 'backward' | 'left' | 'right', e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    const newDirs = { ...activeDirectionsRef.current, [dir]: false };
    updateMovement(newDirs);
  };

  const handlePointerLeave = (dir: 'forward' | 'backward' | 'left' | 'right', e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    const newDirs = { ...activeDirectionsRef.current, [dir]: false };
    updateMovement(newDirs);
  };

  const onJump = (e: React.PointerEvent | React.TouchEvent) => {
    e.preventDefault();
    useInputStore.getState().queueJump();
  };
  const onMine = (e: React.PointerEvent | React.TouchEvent) => {
    e.preventDefault();
    useInputStore.getState().queueMine();
  };
  const onPlace = (e: React.PointerEvent | React.TouchEvent) => {
    e.preventDefault();
    useInputStore.getState().queuePlace();
  };

  return (
    <div className={`mobile-controls ${isLeftHanded ? 'left-handed' : 'right-handed'}`} aria-hidden>
      <div className="joystick-zone">
        <div ref={dpadRef} className="dpad-container">
          <button
            className={`dpad-btn forward ${activeDirs.forward ? 'active' : ''}`}
            data-direction="forward"
            aria-label="Move Forward"
            onPointerDown={(e) => handlePointerDown('forward', e)}
            onPointerUp={(e) => handlePointerUp('forward', e)}
            onPointerLeave={(e) => handlePointerLeave('forward', e)}
            onPointerCancel={(e) => handlePointerLeave('forward', e)}
          >
            <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
          </button>
          <button
            className={`dpad-btn left ${activeDirs.left ? 'active' : ''}`}
            data-direction="left"
            aria-label="Move Left"
            onPointerDown={(e) => handlePointerDown('left', e)}
            onPointerUp={(e) => handlePointerUp('left', e)}
            onPointerLeave={(e) => handlePointerLeave('left', e)}
            onPointerCancel={(e) => handlePointerLeave('left', e)}
          >
            <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <div className="dpad-center" />
          <button
            className={`dpad-btn right ${activeDirs.right ? 'active' : ''}`}
            data-direction="right"
            aria-label="Move Right"
            onPointerDown={(e) => handlePointerDown('right', e)}
            onPointerUp={(e) => handlePointerUp('right', e)}
            onPointerLeave={(e) => handlePointerLeave('right', e)}
            onPointerCancel={(e) => handlePointerLeave('right', e)}
          >
            <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
          <button
            className={`dpad-btn backward ${activeDirs.backward ? 'active' : ''}`}
            data-direction="backward"
            aria-label="Move Backward"
            onPointerDown={(e) => handlePointerDown('backward', e)}
            onPointerUp={(e) => handlePointerUp('backward', e)}
            onPointerLeave={(e) => handlePointerLeave('backward', e)}
            onPointerCancel={(e) => handlePointerLeave('backward', e)}
          >
            <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        </div>
      </div>
      <div className="action-zone">
        <button className="action-btn jump" aria-label="Jump" onPointerDown={onJump}>↑</button>
        <button className="action-btn mine" aria-label="Mine / Attack" onPointerDown={onMine}>⛏</button>
        <button className="action-btn place" aria-label="Place / Interact" onPointerDown={onPlace}>+</button>
      </div>
      <div className="hotbar-row" role="listbox" aria-label="Hotbar">
        {hotbar.map((item, i) => (
          <button
            key={i}
            role="option"
            aria-selected={activeSlot === i}
            aria-label={`Hotbar Slot ${i + 1}: ${item ? `${item.count} item${item.count > 1 ? 's' : ''}` : 'empty'}`}
            className={`hotbar-slot ${activeSlot === i ? 'selected' : ''}`}
            onClick={() => setActiveSlot(i)}
          >
            {item && (
              <>
                <ItemIcon blockId={item.blockId} size={28} />
                <span className="stack-count">{item.count}</span>
                {item.durability !== undefined && (
                  <DurabilityBar
                    durability={item.durability}
                    maxDurability={getToolMaxDurability(item.blockId)}
                  />
                )}
              </>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}