export interface TouchState {
  moveX: number;
  moveY: number;
  lookX: number;
  lookY: number;
  jump: boolean;
  action: 'mine' | 'place' | null;
}

export function emptyTouch(): TouchState {
  return { moveX: 0, moveY: 0, lookX: 0, lookY: 0, jump: false, action: null };
}

const touches = new Map<number, { x: number; y: number; side: 'left' | 'right' }>();
const state: TouchState = emptyTouch();

export function getTouchState(): TouchState {
  return { ...state };
}

export function resetTouch() {
  state.moveX = 0;
  state.moveY = 0;
  state.lookX = 0;
  state.lookY = 0;
}

export function attachTouchListeners(layout: 'left-handed' | 'right-handed') {
  if (typeof window === 'undefined') return () => {};
  const onStart = (e: TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      const side = determineSide(t.clientX, t.clientY, layout);
      touches.set(t.identifier, { x: t.clientX, y: t.clientY, side });
    }
  };
  const onMove = (e: TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      const prev = touches.get(t.identifier);
      if (!prev) continue;
      const dx = t.clientX - prev.x;
      const dy = t.clientY - prev.y;
      prev.x = t.clientX;
      prev.y = t.clientY;
      if (prev.side === 'left') {
        state.moveX += dx;
        state.moveY += dy;
      } else {
        state.lookX += dx;
        state.lookY += dy;
      }
    }
  };
  const onEnd = (e: TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      touches.delete(e.changedTouches[i].identifier);
    }
  };
  window.addEventListener('touchstart', onStart, { passive: true });
  window.addEventListener('touchmove', onMove, { passive: true });
  window.addEventListener('touchend', onEnd);
  window.addEventListener('touchcancel', onEnd);
  return () => {
    window.removeEventListener('touchstart', onStart);
    window.removeEventListener('touchmove', onMove);
    window.removeEventListener('touchend', onEnd);
    window.removeEventListener('touchcancel', onEnd);
  };
}

function determineSide(x: number, y: number, layout: 'left-handed' | 'right-handed'): 'left' | 'right' {
  const w = window.innerWidth;
  if (layout === 'right-handed') {
    return x < w / 2 ? 'left' : 'right';
  }
  return x < w / 2 ? 'right' : 'left';
}

export function setTouchJump(v: boolean) {
  state.jump = v;
}

export function setTouchAction(a: 'mine' | 'place' | null) {
  state.action = a;
}

export function consumeTouch(): { moveX: number; moveY: number; lookX: number; lookY: number } {
  const v = { moveX: state.moveX, moveY: state.moveY, lookX: state.lookX, lookY: state.lookY };
  state.moveX = 0;
  state.moveY = 0;
  state.lookX = 0;
  state.lookY = 0;
  return v;
}