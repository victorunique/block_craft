import { useGameStore, setCursor, getCursor } from '../../store/gameStore';
import { useEffect, useState } from 'react';
import { dragDrop } from '../../inventory/dragDrop';
import type { InventoryItem } from '../../inventory/slots';
import ItemIcon from '../common/ItemIcon';
import { DurabilityBar, getToolMaxDurability } from '../common/DurabilityBar';
import './inventoryGrid.css';

interface Props {
  onCursorChange?: (item: InventoryItem | null) => void;
}

export default function InventoryGrid({ onCursorChange }: Props) {
  const hotbar = useGameStore((s) => s.hotbar);
  const storage = useGameStore((s) => s.storage);
  const armor = useGameStore((s) => s.armor);
  const activeSlot = useGameStore((s) => s.activeSlot);
  const setHotbar = useGameStore.setState.bind(useGameStore);
  const [dragSource, setDragSource] = useState<{ kind: 'hotbar' | 'storage' | 'armor'; index: number } | { cursor: true } | null>(null);
  const [cursorItem, setCursorItem] = useState<InventoryItem | null>(getCursor());

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

  const syncCursor = (item: InventoryItem | null) => {
    setCursorItem(item);
    setCursor(item);
    onCursorChange?.(item);
  };

  const performDrop = (toKind: 'hotbar' | 'storage' | 'armor', toIndex: number) => {
    if (!dragSource) return;
    const grid = { hotbar: [...useGameStore.getState().hotbar], storage: [...useGameStore.getState().storage], armor: [...useGameStore.getState().armor] };
    const r = dragDrop(grid, dragSource, toKind, toIndex, cursorItem);
    setHotbar({ hotbar: r.grid.hotbar, storage: r.grid.storage, armor: r.grid.armor });
    syncCursor(r.cursor);
    setDragSource(null);
  };

  const onDragStart = (kind: 'hotbar' | 'storage' | 'armor', index: number) => (e: React.DragEvent) => {
    setDragSource({ kind, index });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `${kind}:${index}`);
  };
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const onDrop = (kind: 'hotbar' | 'storage' | 'armor', index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    performDrop(kind, index);
  };
  const onSlotClick = (kind: 'hotbar' | 'storage' | 'armor', index: number) => (e: React.MouseEvent) => {
    if (e.shiftKey) {
      const ok = useGameStore.getState().splitStack(kind, index);
      if (ok) {
        const cur = getCursor();
        syncCursor(cur);
      }
      return;
    }
    performDrop(kind, index);
  };

  const renderSlot = (
    it: InventoryItem | null,
    kind: 'hotbar' | 'storage' | 'armor',
    index: number,
    className = '',
    role?: string,
    ariaLabel?: string,
  ) => (
    <div
      key={`${kind}-${index}`}
      className={`item-slot ${className} ${kind === 'hotbar' && activeSlot === index ? 'selected' : ''}`}
      draggable={!!it}
      onDragStart={onDragStart(kind, index)}
      onDragOver={onDragOver}
      onDrop={onDrop(kind, index)}
      onClick={onSlotClick(kind, index)}
      role={role}
      aria-label={ariaLabel}
    >
      {it && (
        <>
          <ItemIcon blockId={it.blockId} size={36} />
          <span className="stack-count">{it.count}</span>
          {it.durability !== undefined && (
            <DurabilityBar durability={it.durability} maxDurability={getToolMaxDurability(it.blockId)} />
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="inv-grid-panel">
      <PlayerPreview />
      <div className="armor-row">
        {armor.map((it, i) => renderSlot(it, 'armor', i, 'armor', undefined, `Armor slot ${i + 1}`))}
      </div>
      <div className="storage-grid" role="grid" aria-label="Storage">
        {storage.map((it, i) =>
          renderSlot(it, 'storage', i, '', 'gridcell', `Storage slot ${i + 1}: ${it ? `${it.count} items` : 'empty'}`),
        )}
      </div>
      <div className="hotbar-grid" role="grid" aria-label="Hotbar">
        {hotbar.map((it, i) =>
          renderSlot(it, 'hotbar', i, '', 'gridcell', `Hotbar slot ${i + 1}`),
        )}
      </div>
    </div>
  );
}

function PlayerPreview() {
  const health = useGameStore((s) => s.health);
  const hunger = useGameStore((s) => s.hunger);
  return (
    <div className="player-preview" aria-label="Player character preview">
      <div className="player-preview-figure">
        <div className="player-preview-head" />
        <div className="player-preview-body" />
        <div className="player-preview-leg player-preview-leg-left" />
        <div className="player-preview-leg player-preview-leg-right" />
        <div className="player-preview-arm player-preview-arm-left" />
        <div className="player-preview-arm player-preview-arm-right" />
      </div>
      <div className="player-preview-stats">
        <div className="player-preview-stat" title="Health">
          <span className="player-preview-stat-icon">❤</span>
          <span className="player-preview-stat-bar">
            <span
              className="player-preview-stat-fill health"
              style={{ width: `${(health / 20) * 100}%` }}
            />
          </span>
          <span className="player-preview-stat-value">{Math.round(health)}</span>
        </div>
        <div className="player-preview-stat" title="Hunger">
          <span className="player-preview-stat-icon">🍗</span>
          <span className="player-preview-stat-bar">
            <span
              className="player-preview-stat-fill hunger"
              style={{ width: `${(hunger / 20) * 100}%` }}
            />
          </span>
          <span className="player-preview-stat-value">{Math.round(hunger)}</span>
        </div>
      </div>
    </div>
  );
}