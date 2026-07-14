import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';

class MockAudioContext {
  destination = {};
  currentTime = 0;
  state = 'running';
  createGain() {
    return { gain: { value: 1, setValueAtTime: () => {}, linearRampToValueAtTime: () => {} }, connect: () => {}, disconnect: () => {} };
  }
  createOscillator() {
    return { type: 'sine', frequency: { value: 440, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, connect: () => {}, start: () => {}, stop: () => {} };
  }
  resume() {
    return Promise.resolve();
  }
  close() {
    return Promise.resolve();
  }
}

if (typeof globalThis.AudioContext === 'undefined') {
  (globalThis as any).AudioContext = MockAudioContext;
  (globalThis as any).webkitAudioContext = MockAudioContext;
}

if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }) as MediaQueryList;
}

if (typeof window !== 'undefined' && !(window as any).PointerLockControls) {
  (window as any).PointerLockControls = class {
    isLocked = false;
    getObject() { return { position: { set: () => {} } }; }
    lock() {}
    unlock() {}
    connect() {}
    disconnect() {}
    addEventListener() {}
    removeEventListener() {}
    dispose() {}
  };
}

// Global Console Filters to suppress React-Three-Fiber JSDOM DOM element warnings
const originalWarn = console.warn;
const originalError = console.error;

console.warn = (...args) => {
  const combined = args.map(a => String(a)).join(' ');
  if (
    combined.includes('casing') ||
    combined.includes('unrecognized') ||
    combined.includes('meshLambertMaterial')
  ) {
    return;
  }
  originalWarn(...args);
};

console.error = (...args) => {
  const combined = args.map(a => String(a)).join(' ');
  if (
    combined.includes('unrecognized') ||
    combined.includes('React does not recognize') ||
    combined.includes('non-boolean attribute') ||
    combined.includes('depthWrite') ||
    combined.includes('frustumCulled') ||
    combined.includes('casing')
  ) {
    return;
  }
  originalError(...args);
};

if (typeof window !== 'undefined') {
  HTMLCanvasElement.prototype.toDataURL = function () {
    return 'data:image/png;base64,';
  };
  HTMLCanvasElement.prototype.getContext = function (type: string) {
    if (type === '2d') {
      return {
        imageSmoothingEnabled: false,
        fillStyle: '',
        fillRect: () => {},
        clearRect: () => {},
        drawImage: () => {},
        putImageData: () => {},
        getImageData: () => ({ data: new Uint8ClampedArray(0) }),
        createImageData: () => ({ data: new Uint8ClampedArray(0) }),
        canvas: this,
      } as any;
    }
    return null;
  } as any;
}