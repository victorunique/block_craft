import { useGameStore } from '../../store/gameStore';
import { SMELTING_RECIPES } from '../../crafting/recipes';
import { countItem } from '../../inventory/slots';
import { BLOCK_NAMES } from '../../../config/blocks';
import { audio } from '../../audio/audioManager';
import './smeltingDialog.css';

export default function SmeltingDialog() {
  const showSmelting = useGameStore((s) => s.showSmelting);
  const openSmelting = useGameStore((s) => s.openSmelting);
  const smeltItem = useGameStore((s) => s.smeltItem);
  const hotbar = useGameStore((s) => s.hotbar);
  const storage = useGameStore((s) => s.storage);
  const armor = useGameStore((s) => s.armor);

  if (!showSmelting) return null;

  const grid = { hotbar, storage, armor };

  const onSmelt = (recipeId: string) => {
    const ok = smeltItem(recipeId);
    if (ok) audio.playPop();
  };

  return (
    <div className="smelt-overlay" role="dialog" aria-label="Furnace smelting">
      <div className="smelt-card">
        <button
          className="smelt-close"
          onClick={() => openSmelting(false)}
          aria-label="Close furnace"
        >
          ×
        </button>
        <h2 className="smelt-title">Furnace</h2>
        <p className="smelt-subtitle">Smelt items using coal as fuel.</p>
        <div className="smelt-recipes" role="listbox" aria-label="Smelting recipes">
          {SMELTING_RECIPES.map((r) => {
            const ownedInput = countItem(grid, r.input.blockId);
            const ownedFuel = countItem(grid, r.fuel.blockId);
            const can = ownedInput >= r.input.count && ownedFuel >= r.fuel.count;
            return (
              <div
                key={r.id}
                className={`smelt-recipe ${can ? 'available' : 'locked'}`}
                role="option"
                aria-selected={false}
                aria-disabled={!can}
              >
                <div className="smelt-recipe-name">{BLOCK_NAMES[r.output.blockId] ?? r.output.blockId}</div>
                <div className="smelt-ingredients">
                  <span className={ownedInput >= r.input.count ? 'ok' : 'missing'}>
                    {BLOCK_NAMES[r.input.blockId] ?? r.input.blockId}: {ownedInput}/{r.input.count}
                  </span>
                  <span className={ownedFuel >= r.fuel.count ? 'ok' : 'missing'}>
                    {BLOCK_NAMES[r.fuel.blockId] ?? r.fuel.blockId}: {ownedFuel}/{r.fuel.count}
                  </span>
                </div>
                <button
                  className="smelt-btn"
                  disabled={!can}
                  onClick={() => onSmelt(r.id)}
                  aria-label={`Smelt ${BLOCK_NAMES[r.output.blockId] ?? r.output.blockId}`}
                >
                  Smelt
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}