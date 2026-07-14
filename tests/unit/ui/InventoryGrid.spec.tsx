import { describe, test, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import InventoryGrid from '../../../src/game/ui/Inventory/InventoryGrid';
import { useGameStore } from '../../../src/game/store/gameStore';

describe('InventoryGrid Stats Display', () => {
  beforeEach(() => {
    useGameStore.setState({
      health: 20,
      hunger: 20,
      hotbar: Array(9).fill(null),
      storage: Array(27).fill(null),
      armor: Array(4).fill(null),
      activeSlot: 0,
    });
  });

  test('rounds health and hunger to integers in the player preview stats', () => {
    useGameStore.setState({
      health: 19.3456789,
      hunger: 18.9750583333334054,
    });

    render(<InventoryGrid />);

    // Get the elements displaying health and hunger values
    const healthStat = screen.getByTitle('Health');
    const hungerStat = screen.getByTitle('Hunger');

    const healthValue = healthStat.querySelector('.player-preview-stat-value');
    const hungerValue = hungerStat.querySelector('.player-preview-stat-value');

    expect(healthValue?.textContent).toBe('19');
    expect(hungerValue?.textContent).toBe('19');
  });

  test('renders item slot with correct title attribute representing item block name', async () => {
    useGameStore.setState({
      hotbar: [
        { id: 'item-wood', blockId: 5, count: 4 }, // 5 is BlockId.WOOD
        ...Array(8).fill(null),
      ],
      storage: Array(27).fill(null),
      armor: Array(4).fill(null),
    });

    await act(async () => {
      render(<InventoryGrid />);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const firstHotbarSlot = screen.getByLabelText('Hotbar slot 1');
    expect(firstHotbarSlot.getAttribute('title')).toBe('Wood');
  });
});
