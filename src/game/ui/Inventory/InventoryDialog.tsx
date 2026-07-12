import { useGameStore, getCursor } from '../../store/gameStore';
import { useState, useEffect } from 'react';
import RecipePanel from './RecipePanel';
import InventoryGrid from './InventoryGrid';
import ItemIcon from '../common/ItemIcon';
import { DurabilityBar, getToolMaxDurability } from '../common/DurabilityBar';
import { useViewport } from '../../../hooks/useViewport';
import './inventoryDialog.css';
import type { InventoryItem } from '../../inventory/slots';

export default function InventoryDialog() {
  const showInventory = useGameStore((s) => s.showInventory);
  const toggleInventory = useGameStore((s) => s.toggleInventory);
  const viewport = useViewport();
  const isWide = viewport.width >= 768;
  const [tab, setTab] = useState<'inventory' | 'crafting'>(isWide ? 'inventory' : 'inventory');
  const [cursor, setCursorState] = useState<InventoryItem | null>(getCursor());

  useEffect(() => {
    if (!showInventory) return;
    setCursorState(getCursor());
  }, [showInventory, tab]);

  if (!showInventory) return null;

  const showInventoryPanel = isWide || tab === 'inventory';
  const showCraftingPanel = isWide || tab === 'crafting';

  return (
    <div className={`inv-overlay ${isWide ? 'split-view' : 'tab-view'}`} role="dialog" aria-label="Inventory and Crafting">
      <button
        className="inv-close"
        onClick={() => toggleInventory(false)}
        aria-label="Close inventory"
      >
        ×
      </button>
      {!isWide && (
        <div className="inv-tabs">
          <button className={tab === 'inventory' ? 'active' : ''} onClick={() => setTab('inventory')}>1. Inventory</button>
          <button className={tab === 'crafting' ? 'active' : ''} onClick={() => setTab('crafting')}>2. Crafting</button>
        </div>
      )}
      <div className="inv-panels">
        {showInventoryPanel && (
          <section className="inv-panel inv-panel-inventory" aria-label="Player Storage">
            <InventoryGrid onCursorChange={setCursorState} />
          </section>
        )}
        {showCraftingPanel && (
          <section className="inv-panel inv-panel-crafting" aria-label="Crafting Recipes">
            <RecipePanel />
          </section>
        )}
      </div>
      {cursor && (
        <div className="cursor-preview" aria-hidden>
          <CursorRender item={cursor} />
        </div>
      )}
    </div>
  );
}

function CursorRender({ item }: { item: InventoryItem }) {
  return (
    <div className="cursor-item">
      <ItemIcon blockId={item.blockId} size={40} />
      <span className="stack-count">{item.count}</span>
      {item.durability !== undefined && (
        <DurabilityBar durability={item.durability} maxDurability={getToolMaxDurability(item.blockId)} />
      )}
    </div>
  );
}