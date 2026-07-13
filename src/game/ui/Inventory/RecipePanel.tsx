import { useGameStore } from '../../store/gameStore';
import { useState, useMemo } from 'react';
import { RECIPES } from '../../crafting/recipes';
import { countItem } from '../../inventory/slots';
import { audio } from '../../audio/audioManager';
import { BLOCK_NAMES } from '../../../config/blocks';
import './recipePanel.css';

export default function RecipePanel() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(RECIPES[0]?.id ?? '');
  const hotbar = useGameStore((s) => s.hotbar);
  const storage = useGameStore((s) => s.storage);
  const armor = useGameStore((s) => s.armor);
  const craftItem = useGameStore((s) => s.craftItem);
  const [toast, setToast] = useState<string>('');

  const grid = { hotbar, storage, armor };

  const filtered = useMemo(
    () => RECIPES.filter((r) => r.id.includes(search.toLowerCase())),
    [search],
  );

  const sel = RECIPES.find((r) => r.id === selected);

  const canCraft = sel ? sel.input.every((i) => countItem(grid, i.blockId) >= i.count) : false;

  const onCraft = () => {
    if (!sel) return;
    const ok = craftItem(sel.id);
    if (ok) {
      audio.playPop();
      setToast('Crafted!');
      setTimeout(() => setToast(''), 1200);
    } else {
      setToast('Cannot craft');
      setTimeout(() => setToast(''), 1200);
    }
  };

  return (
    <div className="recipe-panel">
      <input
        type="text"
        placeholder="Search recipes..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="recipe-search"
        aria-label="Filter recipes"
      />
      <div className="recipe-list" role="listbox" aria-label="Craftable recipes">
        {filtered.map((r) => {
          const available = r.input.every((i) => countItem(grid, i.blockId) >= i.count);
          return (
            <button
              key={r.id}
              className={`recipe-item ${selected === r.id ? 'selected' : ''} ${available ? 'available' : 'locked'}`}
              onClick={() => setSelected(r.id)}
              role="option"
              aria-selected={selected === r.id}
              aria-label={`Recipe ${r.id}`}
            >
              <span className="recipe-name">{r.id.replace(/_/g, ' ')}</span>
              {!available && <span className="recipe-lock" aria-hidden>🔒</span>}
            </button>
          );
        })}
      </div>
      <div className="recipe-detail">
        {sel && (
          <>
            <h3>{sel.id.replace(/_/g, ' ')}</h3>
            <div className="ingredients">
              {sel.input.map((ing) => {
                const owned = countItem(grid, ing.blockId);
                const ok = owned >= ing.count;
                return (
                  <div key={ing.blockId} className={`ingredient ${ok ? 'ok' : 'missing'}`}>
                    <span>{BLOCK_NAMES[ing.blockId] ?? ing.blockId} x{ing.count}</span>
                    <span className="ing-count">{owned}/{ing.count}</span>
                  </div>
                );
              })}
            </div>
            <button
              className={`craft-btn ${canCraft ? '' : 'disabled'}`}
              disabled={!canCraft}
              onClick={onCraft}
              aria-label="Craft selected item"
            >
              Craft Item
            </button>
            {toast && <div className="craft-toast">{toast}</div>}
          </>
        )}
      </div>
    </div>
  );
}