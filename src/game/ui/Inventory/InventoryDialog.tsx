import { useGameStore, getCursor, setCursor } from '../../store/gameStore';
import { useState } from 'react';
import RecipePanel from './RecipePanel';
import InventoryGrid from './InventoryGrid';
import './inventoryDialog.css';
import type { InventoryItem } from '../../inventory/slots';

export default function InventoryDialog() {
  const showInventory = useGameStore((s) => s.showInventory);
  const toggleInventory = useGameStore((s) => s.toggleInventory);
  const [tab, setTab] = useState<'inventory' | 'crafting'>('inventory');
  if (!showInventory) return null;

  return (
    <div className="inv-overlay" role="dialog" aria-label="Inventory and Crafting">
      <button
        className="inv-close"
        onClick={() => toggleInventory(false)}
        aria-label="Close inventory"
      >
        ×
      </button>
      <div className="inv-tabs">
        <button className={tab === 'inventory' ? 'active' : ''} onClick={() => setTab('inventory')}>1. Inventory</button>
        <button className={tab === 'crafting' ? 'active' : ''} onClick={() => setTab('crafting')}>2. Crafting</button>
      </div>
      {tab === 'inventory' && <InventoryGrid />}
      {tab === 'crafting' && <RecipePanel />}
      {getCursor() && (
        <div className="cursor-preview" aria-hidden>
          <CursorRender item={getCursor()!} />
        </div>
      )}
    </div>
  );
}

function CursorRender({ item }: { item: InventoryItem }) {
  return (
    <div className="cursor-item">
      <span className="stack-count">{item.count}</span>
    </div>
  );
}