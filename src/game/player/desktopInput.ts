import type { GameSettings } from '../store/types';

export interface InputState {
  forward: number;
  strafe: number;
  jump: boolean;
  sneak: boolean;
  breaking: boolean;
  placing: boolean;
  yawDelta: number;
  pitchDelta: number;
  cameraYawOverride?: number;
  cameraPitchOverride?: number;
}

export function emptyInputState(): InputState {
  return { forward: 0, strafe: 0, jump: false, sneak: false, breaking: false, placing: false, yawDelta: 0, pitchDelta: 0 };
}

const keys: Record<string, boolean> = {};

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
  });
  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
  });
  window.addEventListener('blur', () => {
    for (const k of Object.keys(keys)) keys[k] = false;
  });
}

export function pollDesktopKeyboard(): InputState {
  const fwd = (keys['KeyW'] ? 1 : 0) - (keys['KeyS'] ? 1 : 0);
  const strafe = (keys['KeyD'] ? 1 : 0) - (keys['KeyA'] ? 1 : 0);
  const jump = !!keys['Space'];
  const sneak = !!keys['ShiftLeft'] || !!keys['ShiftRight'];
  return {
    forward: fwd,
    strafe,
    jump,
    sneak,
    breaking: !!keys['Mouse0'] || false,
    placing: !!keys['Mouse2'] || false,
    yawDelta: 0,
    pitchDelta: 0,
  };
}

export function setDigitKey(index: number, down: boolean) {
  const code = `Digit${index + 1}`;
  keys[code] = down;
}

export function isDigitPressed(index: number): boolean {
  return !!keys[`Digit${index + 1}`];
}

let mouseDx = 0;
let mouseDy = 0;
if (typeof window !== 'undefined') {
  window.addEventListener('mousemove', (e) => {
    if ((document as any).pointerLockElement) {
      mouseDx += e.movementX;
      mouseDy += e.movementY;
    }
  });
}

export function consumeMouseDelta(settings: GameSettings): { dx: number; dy: number } {
  const dx = mouseDx * settings.mouseSensitivity * 0.002;
  const dy = mouseDy * settings.mouseSensitivity * 0.002;
  mouseDx = 0;
  mouseDy = 0;
  return { dx, dy };
}

export function getWheelDelta(): number {
  let delta = 0;
  const handler = (e: WheelEvent) => {
    delta += e.deltaY;
  };
  window.addEventListener('wheel', handler, { once: true, passive: true });
  return delta;
}

export function attachWheelListener(cb: (delta: number) => void): () => void {
  const handler = (e: WheelEvent) => cb(e.deltaY);
  window.addEventListener('wheel', handler, { passive: true });
  return () => window.removeEventListener('wheel', handler);
}

export function attachClickListener(cb: (button: 'left' | 'right') => void): () => void {
  const handler = (e: MouseEvent) => {
    if (e.button === 0) cb('left');
    if (e.button === 2) cb('right');
  };
  window.addEventListener('mousedown', handler);
  window.addEventListener('contextmenu', (e) => e.preventDefault());
  return () => window.removeEventListener('mousedown', handler);
}