import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import React from 'react';
import TutorialOverlay from '../../../src/game/ui/Hud/TutorialOverlay';
import { useGameStore } from '../../../src/game/store/gameStore';

describe('TutorialOverlay', () => {
  beforeEach(() => {
    useGameStore.setState({
      health: 20,
      playerPos: [2, 60, 0],
      showGameOver: false,
      showInventory: false,
      isPaused: false,
      showTutorialOverlay: true,
    });
  });

  test('renders welcome title and coordinates when showTutorialOverlay is true', () => {
    render(<TutorialOverlay />);
    expect(screen.getByText('Welcome to your world')).toBeInTheDocument();
    expect(screen.getByText(/You are at \(2, 60, 0\)/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });

  test('does not render when showTutorialOverlay is false', () => {
    act(() => {
      useGameStore.setState({ showTutorialOverlay: false });
    });
    const { container } = render(<TutorialOverlay />);
    expect(container.firstChild).toBeNull();
  });

  test('clicking close button sets showTutorialOverlay to false', () => {
    let calledWith: boolean | null = null;
    useGameStore.setState({
      setShowTutorialOverlay: (show: boolean) => {
        calledWith = show;
        useGameStore.setState({ showTutorialOverlay: show });
      }
    });

    render(<TutorialOverlay />);
    const closeBtn = screen.getByRole('button', { name: /close/i });
    act(() => {
      fireEvent.click(closeBtn);
    });

    expect(calledWith).toBe(false);
    expect(useGameStore.getState().showTutorialOverlay).toBe(false);
  });
});
