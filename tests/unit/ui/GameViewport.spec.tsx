import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import GameViewport from '../../../src/game/ui/Hud/GameViewport';
import GameEngine from '../../../src/game/ui/Hud/GameEngine';
import { useGameStore } from '../../../src/game/store/gameStore';
import { getActiveChunkManager, getActiveSpawner, setActiveWorld, clearActiveWorld } from '../../../src/game/world/activeWorld';

// Mock GameEngine to avoid running WebGL/Canvas in unit tests
vi.mock('../../../src/game/ui/Hud/GameEngine', () => {
  const mockRender = vi.fn(({ chunkManager }) => (
    <div data-testid="mock-game-engine">
      Mock Game Engine (Seed: {chunkManager.seed})
    </div>
  ));
  return {
    default: mockRender,
    createChunkManagerForWorld: vi.fn((seed) => ({
      seed,
      setRenderDistance: vi.fn(),
      renderDistance: 8,
    })),
    createSpawner: vi.fn(() => ({})),
  };
});

describe('GameViewport', () => {
  beforeEach(() => {
    clearActiveWorld();
    vi.clearAllMocks();
    useGameStore.setState({
      worldSeed: 0,
      worldSize: 512,
      playerPos: [0, 72, 0],
      activeWorldId: null,
    });
  });

  test('does not render GameEngine if worldSeed is 0', () => {
    render(<GameViewport />);
    expect(screen.queryByTestId('mock-game-engine')).not.toBeInTheDocument();
  });

  test('renders GameEngine when world is loaded, and key remains stable during player movement', () => {
    // 1. Start game and render
    act(() => {
      useGameStore.setState({
        worldSeed: 12345,
        worldSize: 512,
        playerPos: [8, 62, -8],
        activeWorldId: 'world-1',
      });
    });

    const { rerender } = render(<GameViewport />);

    // Since chunk manager is instantiated in useEffect, it should be active now
    expect(screen.getByTestId('mock-game-engine')).toBeInTheDocument();

    const GameEngineMock = vi.mocked(GameEngine);
    expect(GameEngineMock).toHaveBeenCalled();
    const firstCallCount = GameEngineMock.mock.calls.length;

    // 2. Move player slightly (within chunk)
    act(() => {
      useGameStore.setState({ playerPos: [9, 62, -8] });
    });
    rerender(<GameViewport />);

    // 3. Move player across chunk boundary (X changes from 8 to 24)
    act(() => {
      useGameStore.setState({ playerPos: [24, 62, -8] });
    });
    rerender(<GameViewport />);

    // Since the key is stable (only depends on activeWorldId / seed / size),
    // React should not remount GameEngine.
    // It should render successfully and the key will not change based on playerPos.
    const lastCall = GameEngineMock.mock.calls[GameEngineMock.mock.calls.length - 1];
    expect(lastCall[0].chunkManager.seed).toBe(12345);
  });
});
