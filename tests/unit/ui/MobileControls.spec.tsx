import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import MobileControls from '../../../src/game/ui/MobileControls/MobileControls';
import { useInputStore } from '../../../src/game/store/inputStore';
import { useGameStore } from '../../../src/game/store/gameStore';
import { useSettingsStore } from '../../../src/game/store/settingsStore';

// Mock useViewport to control environment
vi.mock('../../../src/hooks/useViewport', () => ({
  useViewport: () => ({
    width: 1024,
    height: 768,
    isMobile: true,
    isTouch: true,
  }),
}));

describe('MobileControls D-pad', () => {
  let originalElementFromPoint: typeof document.elementFromPoint;

  beforeEach(() => {
    // Reset stores
    useInputStore.setState({
      move: { x: 0, y: 0 },
      look: { dx: 0, dy: 0 },
    });
    useGameStore.setState({
      hotbar: Array(9).fill(null),
      activeSlot: 0,
    });
    useSettingsStore.setState({
      settings: {
        graphicsQuality: 'medium',
        renderDistance: 10,
        soundVolume: 0.8,
        mouseSensitivity: 1.0,
        controlLayout: 'right-handed',
      },
    });

    originalElementFromPoint = document.elementFromPoint;
  });

  afterEach(() => {
    document.elementFromPoint = originalElementFromPoint;
    vi.restoreAllMocks();
  });

  test('renders 4 D-pad buttons: forward, backward, left, right', () => {
    const { container } = render(<MobileControls />);
    expect(container.querySelector('[data-direction="forward"]')).toBeInTheDocument();
    expect(container.querySelector('[data-direction="backward"]')).toBeInTheDocument();
    expect(container.querySelector('[data-direction="left"]')).toBeInTheDocument();
    expect(container.querySelector('[data-direction="right"]')).toBeInTheDocument();
  });

  test('mouse/pointer events set movement in store', () => {
    const { container } = render(<MobileControls />);
    const forwardBtn = container.querySelector('[data-direction="forward"]')!;
    const leftBtn = container.querySelector('[data-direction="left"]')!;

    // PointerDown on forwardBtn using mouse
    fireEvent.pointerDown(forwardBtn, { pointerType: 'mouse' });
    expect(useInputStore.getState().move).toEqual({ x: 0, y: -1 });

    // PointerUp resets movement
    fireEvent.pointerUp(forwardBtn, { pointerType: 'mouse' });
    expect(useInputStore.getState().move).toEqual({ x: 0, y: 0 });

    // PointerDown on leftBtn using mouse
    fireEvent.pointerDown(leftBtn, { pointerType: 'mouse' });
    expect(useInputStore.getState().move).toEqual({ x: -1, y: 0 });

    // PointerLeave resets movement
    fireEvent.pointerLeave(leftBtn, { pointerType: 'mouse' });
    expect(useInputStore.getState().move).toEqual({ x: 0, y: 0 });
  });

  test('touch events set movement based on elementFromPoint', () => {
    const { container } = render(<MobileControls />);
    const dpad = container.querySelector('.dpad-container')!;
    const forwardBtn = container.querySelector('[data-direction="forward"]')!;
    const rightBtn = container.querySelector('[data-direction="right"]')!;

    // Touch start on forward button area
    document.elementFromPoint = vi.fn().mockReturnValue(forwardBtn);
    fireEvent.touchStart(dpad, {
      touches: [{ clientX: 100, clientY: 100 }],
    });
    expect(useInputStore.getState().move).toEqual({ x: 0, y: -1 });

    // Touch move onto right button area
    document.elementFromPoint = vi.fn().mockReturnValue(rightBtn);
    fireEvent.touchMove(dpad, {
      touches: [{ clientX: 120, clientY: 100 }],
    });
    expect(useInputStore.getState().move).toEqual({ x: 1, y: 0 });

    // Touch end stops movement
    fireEvent.touchEnd(dpad, {
      touches: [],
    });
    expect(useInputStore.getState().move).toEqual({ x: 0, y: 0 });
  });
});
