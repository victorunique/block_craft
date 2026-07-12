import { useEffect, useState, useMemo } from 'react';
import { ATLAS_TILE, BlockId } from '../../../config/blocks';
import { ITEM_ICONS, TOOL_ICONS } from '../../rendering/textureAtlas';
import { getAtlas } from '../../rendering/chunkMesh';

export type IconTile = [number, number];

const BLOCK_ICON_TILE: Record<number, IconTile> = {
  [BlockId.GRASS]: ATLAS_TILE.GRASS_TOP,
  [BlockId.DIRT]: ATLAS_TILE.DIRT,
  [BlockId.STONE]: ATLAS_TILE.STONE,
  [BlockId.COBBLESTONE]: ATLAS_TILE.COBBLESTONE,
  [BlockId.WOOD]: ATLAS_TILE.WOOD_TOP,
  [BlockId.PINE_WOOD]: ATLAS_TILE.PINE_WOOD_TOP,
  [BlockId.PLANKS]: ATLAS_TILE.PLANKS,
  [BlockId.SAND]: ATLAS_TILE.SAND,
  [BlockId.SANDSTONE]: ATLAS_TILE.SANDSTONE,
  [BlockId.SNOW_LAYER]: ATLAS_TILE.SNOW_LAYER,
  [BlockId.ICE]: ATLAS_TILE.ICE,
  [BlockId.WATER]: ATLAS_TILE.WATER,
  [BlockId.GLASS]: ATLAS_TILE.GLASS,
  [BlockId.BRICK]: ATLAS_TILE.BRICK,
  [BlockId.LEAVES]: ATLAS_TILE.LEAVES,
  [BlockId.PINE_LEAVES]: ATLAS_TILE.PINE_LEAVES,
  [BlockId.COAL_ORE]: ATLAS_TILE.COAL_ORE,
  [BlockId.IRON_ORE]: ATLAS_TILE.IRON_ORE,
  [BlockId.GOLD_ORE]: ATLAS_TILE.GOLD_ORE,
  [BlockId.DIAMOND_ORE]: ATLAS_TILE.DIAMOND_ORE,
  [BlockId.BEDROCK]: ATLAS_TILE.BEDROCK,
  [BlockId.CLAY]: ATLAS_TILE.CLAY,
  [BlockId.FURNACE]: ATLAS_TILE.FURNACE_TOP,
  [BlockId.TORCH]: ATLAS_TILE.TORCH,
  [BlockId.FLOWER_RED]: ATLAS_TILE.FLOWER_RED,
  [BlockId.FLOWER_YELLOW]: ATLAS_TILE.FLOWER_YELLOW,
  [BlockId.CACTUS]: ATLAS_TILE.CACTUS_TOP,
};

const EMOJI_FALLBACK: Record<number, string> = {
  [BlockId.AIR]: '·',
  [BlockId.BEDROCK]: '⬛',
  [BlockId.DIRT]: '🟫',
  [BlockId.GRASS]: '🟩',
  [BlockId.STONE]: '⬜',
  [BlockId.WOOD]: '🪵',
  [BlockId.LEAVES]: '🌿',
  [BlockId.SAND]: '🟨',
  [BlockId.WATER]: '💧',
  [BlockId.GLASS]: '🔳',
  [BlockId.BRICK]: '🧱',
  [BlockId.COBBLESTONE]: '🪨',
  [BlockId.CLAY]: '🟤',
  [BlockId.COAL_ORE]: '🪨',
  [BlockId.FURNACE]: '🔥',
  [BlockId.TORCH]: '🕯️',
  [BlockId.IRON_ORE]: '🪨',
  [BlockId.GOLD_ORE]: '🪨',
  [BlockId.DIAMOND_ORE]: '💎',
  [BlockId.COAL_ITEM]: '⚫',
  [BlockId.IRON_INGOT]: '⬜',
  [BlockId.GOLD_INGOT]: '🟨',
  [BlockId.DIAMOND]: '💎',
  [BlockId.EMERALD]: '🟢',
  [BlockId.STICK]: '🥢',
  [BlockId.PLANKS]: '🟫',
  [BlockId.SNOW_LAYER]: '⚪',
  [BlockId.ICE]: '🧊',
  [BlockId.CACTUS]: '🌵',
  [BlockId.FLOWER_RED]: '🌹',
  [BlockId.FLOWER_YELLOW]: '🌼',
  [BlockId.PINE_WOOD]: '🪵',
  [BlockId.PINE_LEAVES]: '🌲',
  [BlockId.SANDSTONE]: '🟨',
  [BlockId.WOODEN_PICKAXE]: '⛏️',
  [BlockId.STONE_PICKAXE]: '⛏️',
  [BlockId.IRON_PICKAXE]: '⛏️',
  [BlockId.WOODEN_AXE]: '🪓',
  [BlockId.STONE_AXE]: '🪓',
  [BlockId.IRON_AXE]: '🪓',
  [BlockId.WOODEN_SWORD]: '⚔️',
  [BlockId.STONE_SWORD]: '⚔️',
  [BlockId.IRON_SWORD]: '⚔️',
  [BlockId.BEEF]: '🥩',
  [BlockId.PORK]: '🥓',
  [BlockId.CHICKEN]: '🍗',
  [BlockId.LEATHER]: '🟫',
  [BlockId.FEATHER]: '🪶',
  [BlockId.APPLE]: '🍎',
};

export function tileForBlock(blockId: number): IconTile | null {
  if (TOOL_ICONS[blockId]) return TOOL_ICONS[blockId] as IconTile;
  if (ITEM_ICONS[blockId]) return ITEM_ICONS[blockId] as IconTile;
  if (BLOCK_ICON_TILE[blockId]) return BLOCK_ICON_TILE[blockId];
  return null;
}

let _atlasDataUrl: string | null = null;
let _atlasDataUrlPromise: Promise<string> | null = null;

export function getAtlasDataUrl(): Promise<string> {
  if (_atlasDataUrl) return Promise.resolve(_atlasDataUrl);
  if (!_atlasDataUrlPromise) {
    _atlasDataUrlPromise = getAtlas().then((a) => {
      _atlasDataUrl = a.canvas.toDataURL('image/png');
      return _atlasDataUrl;
    });
  }
  return _atlasDataUrlPromise;
}

interface ItemIconProps {
  blockId: number;
  size?: number;
}

export default function ItemIcon({ blockId, size = 28 }: ItemIconProps) {
  const tile = tileForBlock(blockId);
  const [url, setUrl] = useState<string | null>(_atlasDataUrl);

  useEffect(() => {
    if (url) return;
    let cancelled = false;
    void getAtlasDataUrl().then((u) => {
      if (!cancelled) setUrl(u);
    });
    return () => {
      cancelled = true;
    };
  }, [url]);

  const style = useMemo<React.CSSProperties>(() => {
    if (!tile || !url) return {};
    const [col, row] = tile;
    const atlasPx = 16;
    const scale = size / atlasPx;
    const bgSize = 256 * scale;
    return {
      width: `${size}px`,
      height: `${size}px`,
      backgroundImage: `url(${url})`,
      backgroundSize: `${bgSize}px ${bgSize}px`,
      backgroundPosition: `${-col * size}px ${-row * size}px`,
      backgroundRepeat: 'no-repeat',
      imageRendering: 'pixelated',
    };
  }, [tile, url, size]);

  if (!tile) {
    return (
      <span
        className="item-icon item-icon-emoji"
        style={{ width: `${size}px`, height: `${size}px`, fontSize: `${Math.round(size * 0.7)}px`, lineHeight: 1 }}
        aria-hidden
      >
        {EMOJI_FALLBACK[blockId] ?? '❓'}
      </span>
    );
  }

  return url ? <span className="item-icon" style={style} aria-hidden /> : (
    <span
      className="item-icon item-icon-emoji"
      style={{ width: `${size}px`, height: `${size}px`, fontSize: `${Math.round(size * 0.7)}px`, lineHeight: 1 }}
      aria-hidden
    >
      {EMOJI_FALLBACK[blockId] ?? '❓'}
    </span>
  );
}