import { describe, test, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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
});
