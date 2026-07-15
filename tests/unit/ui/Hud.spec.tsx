import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import Hud from '../../../src/game/ui/Hud/Hud';
import { useGameStore } from '../../../src/game/store/gameStore';

// Mock useViewport to avoid window resize dependency and control isMobile state
vi.mock('../../../src/hooks/useViewport', () => ({
  useViewport: () => ({
    width: 1024,
    height: 768,
    isMobile: false,
    isTouch: false,
  }),
}));

describe('Hud', () => {
  beforeEach(() => {
    useGameStore.setState({
      health: 20,
      hunger: 20,
      oxygen: 100,
      timeOfDay: 6000,
      playerPos: [2, 60.4, -4.8],
      activeSlot: 0,
      hotbar: Array(9).fill(null),
      storage: Array(27).fill(null),
      armor: Array(4).fill(null),
      showGameOver: false,
      showInventory: false,
      isPaused: false,
      showTutorialOverlay: true,
    });
  });

  test('does not render coordinates in top-right when showTutorialOverlay is true', () => {
    render(<Hud />);
    // FPS counter should be there
    expect(screen.getByText(/FPS/)).toBeInTheDocument();
    // Coordinates (Pos: ...) should not be there
    expect(screen.queryByText(/Pos:/)).not.toBeInTheDocument();
  });

  test('renders coordinates in top-right when showTutorialOverlay is false', () => {
    act(() => {
      useGameStore.setState({ showTutorialOverlay: false });
    });
    render(<Hud />);
    // FPS counter should be there
    expect(screen.getByText(/FPS/)).toBeInTheDocument();
    // Coordinates (Pos: ...) should be there, rounded correctly (2, 60, -5)
    expect(screen.getByText(/Pos: 2, 60, -5/)).toBeInTheDocument();
  });
});
