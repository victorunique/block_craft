import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { GameSettings } from './types';

const SETTINGS_KEY = 'blockcraft_settings';

const defaults: GameSettings = {
  graphicsQuality: 'medium',
  renderDistance: 10,
  soundVolume: 0.8,
  mouseSensitivity: 1.0,
  controlLayout: 'right-handed',
};

interface SettingsStore {
  settings: GameSettings;
  setSettings: (patch: Partial<GameSettings>) => void;
  reset: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: defaults,
      setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      reset: () => set({ settings: defaults }),
    }),
    {
      name: SETTINGS_KEY,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export async function initSettingsStore(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ state: { settings: defaults }, version: 0 }));
    }
  } catch (err) {
    console.warn('initSettingsStore failed', err);
  }
}