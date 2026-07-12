import { create } from 'zustand';

export interface InputState {
  jumpQueued: boolean;
  mineQueued: boolean;
  placeQueued: boolean;
  move: { x: number; y: number };
  look: { dx: number; dy: number };

  queueJump: () => void;
  queueMine: () => void;
  queuePlace: () => void;
  setMove: (x: number, y: number) => void;
  setLook: (dx: number, dy: number) => void;
  consumeJump: () => boolean;
  consumeMine: () => boolean;
  consumePlace: () => boolean;
  consumeLook: () => { dx: number; dy: number };
}

export const useInputStore = create<InputState>((set, get) => ({
  jumpQueued: false,
  mineQueued: false,
  placeQueued: false,
  move: { x: 0, y: 0 },
  look: { dx: 0, dy: 0 },

  queueJump: () => set({ jumpQueued: true }),
  queueMine: () => set({ mineQueued: true }),
  queuePlace: () => set({ placeQueued: true }),
  setMove: (x, y) => set({ move: { x, y } }),
  setLook: (dx, dy) => set((s) => ({ look: { dx: s.look.dx + dx, dy: s.look.dy + dy } })),

  consumeJump: () => {
    if (!get().jumpQueued) return false;
    set({ jumpQueued: false });
    return true;
  },
  consumeMine: () => {
    if (!get().mineQueued) return false;
    set({ mineQueued: false });
    return true;
  },
  consumePlace: () => {
    if (!get().placeQueued) return false;
    set({ placeQueued: false });
    return true;
  },
  consumeLook: () => {
    const { dx, dy } = get().look;
    set({ look: { dx: 0, dy: 0 } });
    return { dx, dy };
  },
}));