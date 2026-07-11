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