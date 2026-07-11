import { useGameStore } from '../../store/gameStore';
import { useEffect, useState } from 'react';
import { dragDrop } from '../../inventory/dragDrop';
import type { InventoryItem } from '../../inventory/slots';
import './inventoryGrid.css';

export default function InventoryGrid() {
  const hotbar = useGameStore((s) => s.hotbar);
  const storage = useGameStore((s) => s.storage);
  const armor = useGameStore((s) => s.armor);
  const setHotbar = useGameStore.setState.bind(useGameStore);
  const [dragSource, setDragSource] = useState<{ kind: 'hotbar' | 'storage' | 'armor'; index: number } | { cursor: true } | null>(null);
  const [cursorItem, setCursorItem] = useState<InventoryItem | null>(null);

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      const preview = document.querySelector('.cursor-preview') as HTMLElement | null;
      if (preview) {
        preview.style.left = `${e.clientX + 12}px`;
        preview.style.top = `${e.clientY + 12}px`;
      }
    }
    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, []);

  const onDragStart = (kind: 'hotbar' | 'storage' | 'armor', index: number) => () => {
    setDragSource({ kind, index });
  };
  const onDragOver = () => {};
  const onDrop = (kind: 'hotbar' | 'storage' | 'armor', index: number) => () => {
    if (!dragSource) return;
    const grid = { hotbar: [...useGameStore.getState().hotbar], storage: [...useGameStore.getState().storage], armor: [...useGameStore.getState().armor] };
    const r = dragDrop(grid, dragSource, kind, index, cursorItem);
    setHotbar({ hotbar: r.grid.hotbar, storage: r.grid.storage, armor: r.grid.armor });
    setCursorItem(r.cursor);
    setDragSource(null);
  };

  return (
    <div className="inv-grid-panel">
      <div className="armor-row">
        {armor.map((it, i) => (
          <div
            key={i}
            className="item-slot armor"
            onClick={onDrop('armor', i)}
            onMouseEnter={onDragOver}
            aria-label={`Armor slot ${i + 1}`}
          >
            {it && <span className="stack-count">{it.count}</span>}
          </div>
        ))}
      </div>
      <div className="storage-grid" role="grid" aria-label="Storage">
        {storage.map((it, i) => (
          <div
            key={i}
            className="item-slot"
            onClick={onDrop('storage', i)}
            onMouseEnter={onDragOver}
            role="gridcell"
            aria-label={`Storage slot ${i + 1}: ${it ? `${it.count} items` : 'empty'}`}
          >
            {it && <span className="stack-count">{it.count}</span>}
          </div>
        ))}
      </div>
      <div className="hotbar-grid" role="grid" aria-label="Hotbar">
        {hotbar.map((it, i) => (
          <div
            key={i}
            className={`item-slot ${useGameStore.getState().activeSlot === i ? 'selected' : ''}`}
            onClick={onDrop('hotbar', i)}
            onMouseEnter={onDragOver}
            role="gridcell"
            aria-label={`Hotbar slot ${i + 1}`}
          >
            {it && <span className="stack-count">{it.count}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}