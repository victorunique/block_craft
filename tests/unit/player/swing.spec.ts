import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '@/game/store/gameStore';

describe('Player Swing Animation State', () => {
  beforeEach(() => {
    useGameStore.setState({ swingProgress: 0 });
  });

  it('initially has swingProgress = 0', () => {
    expect(useGameStore.getState().swingProgress).toBe(0);
  });

  it('triggerSwing sets swingProgress to 1.0', () => {
    useGameStore.getState().triggerSwing();
    expect(useGameStore.getState().swingProgress).toBe(1.0);
  });
});
