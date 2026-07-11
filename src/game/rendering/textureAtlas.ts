import * as THREE from 'three';
import { BlockId, isTransparent, isLiquid } from '../../config/blocks';

export const ATLAS_COLS = 16;
export const ATLAS_ROWS = 16;
export const ATLAS_TILE_SIZE = 16;

const TILE = ATLAS_TILE_SIZE;
const COLS = ATLAS_COLS;

export type AtlasFaceSlot =
  | 'top'
  | 'side'
  | 'bottom'
  | 'all'
  | 'cross'
  | 'plant'
  | 'torch'
  | 'liquid-top';

interface BlockFaceUV {
  top?: [number, number];
  side?: [number, number];
  bottom?: [number, number];
}

export const FACE_TOP: [number, number] = [0, 0];
export const FACE_SIDE: [number, number] = [1, 0];
export const FACE_BOTTOM: [number, number] = [2, 0];

export const ATLAS_MAP: Record<number, BlockFaceUV | { pattern: 'cross' | 'plant' | 'torch' | 'liquid-top' }> = {
  [BlockId.GRASS]: { top: [3, 0], side: [0, 1], bottom: [2, 0] },
  [BlockId.DIRT]: { top: [2, 0], side: [2, 0], bottom: [2, 0] },
  [BlockId.STONE]: { top: [1, 0], side: [1, 0], bottom: [1, 0] },
  [BlockId.COBBLESTONE]: { top: [4, 0], side: [4, 0], bottom: [4, 0] },
  [BlockId.WOOD]: { top: [5, 0], side: [6, 0], bottom: [5, 0] },
  [BlockId.PINE_WOOD]: { top: [7, 0], side: [8, 0], bottom: [7, 0] },
  [BlockId.PLANKS]: { top: [9, 0], side: [9, 0], bottom: [9, 0] },
  [BlockId.SAND]: { top: [10, 0], side: [10, 0], bottom: [10, 0] },
  [BlockId.SANDSTONE]: { top: [11, 0], side: [11, 0], bottom: [11, 0] },
  [BlockId.SNOW_LAYER]: { top: [12, 0], side: [12, 0], bottom: [12, 0] },
  [BlockId.ICE]: { top: [13, 0], side: [13, 0], bottom: [13, 0] },
  [BlockId.WATER]: { pattern: 'liquid-top' },
  [BlockId.GLASS]: { top: [14, 0], side: [14, 0], bottom: [14, 0] },
  [BlockId.BRICK]: { top: [15, 0], side: [15, 0], bottom: [15, 0] },
  [BlockId.LEAVES]: { top: [0, 2], side: [0, 2], bottom: [0, 2] },
  [BlockId.PINE_LEAVES]: { top: [1, 2], side: [1, 2], bottom: [1, 2] },
  [BlockId.COAL_ORE]: { top: [2, 2], side: [2, 2], bottom: [2, 2] },
  [BlockId.IRON_ORE]: { top: [3, 2], side: [3, 2], bottom: [3, 2] },
  [BlockId.GOLD_ORE]: { top: [4, 2], side: [4, 2], bottom: [4, 2] },
  [BlockId.DIAMOND_ORE]: { top: [5, 2], side: [5, 2], bottom: [5, 2] },
  [BlockId.BEDROCK]: { top: [6, 2], side: [6, 2], bottom: [6, 2] },
  [BlockId.CLAY]: { top: [7, 2], side: [7, 2], bottom: [7, 2] },
  [BlockId.FURNACE]: { top: [8, 2], side: [9, 2], bottom: [10, 2] },
  [BlockId.TORCH]: { pattern: 'torch' },
  [BlockId.FLOWER_RED]: { pattern: 'plant' },
  [BlockId.FLOWER_YELLOW]: { pattern: 'plant' },
  [BlockId.CACTUS]: { top: [11, 2], side: [12, 2], bottom: [13, 2] },
};

export const TOOL_ICONS: Record<number, [number, number]> = {
  [BlockId.WOODEN_PICKAXE]: [0, 4],
  [BlockId.STONE_PICKAXE]: [1, 4],
  [BlockId.IRON_PICKAXE]: [2, 4],
  [BlockId.WOODEN_AXE]: [3, 4],
  [BlockId.STONE_AXE]: [4, 4],
  [BlockId.IRON_AXE]: [5, 4],
  [BlockId.WOODEN_SWORD]: [6, 4],
  [BlockId.STONE_SWORD]: [7, 4],
  [BlockId.IRON_SWORD]: [8, 4],
};

export const ITEM_ICONS: Record<number, [number, number]> = {
  [BlockId.COAL_ITEM]: [0, 3],
  [BlockId.IRON_INGOT]: [1, 3],
  [BlockId.GOLD_INGOT]: [2, 3],
  [BlockId.DIAMOND]: [3, 3],
  [BlockId.EMERALD]: [4, 3],
  [BlockId.STICK]: [5, 3],
  [BlockId.BEEF]: [6, 3],
  [BlockId.PORK]: [7, 3],
  [BlockId.CHICKEN]: [8, 3],
  [BlockId.LEATHER]: [9, 3],
  [BlockId.FEATHER]: [10, 3],
  [BlockId.APPLE]: [11, 3],
};

function rgba(r: number, g: number, b: number, a = 255): [number, number, number, number] {
  return [r, g, b, a];
}

const PALETTE: Record<number, [number, number, number]> = {
  [BlockId.GRASS]: [107, 188, 89],
  [BlockId.DIRT]: [134, 96, 67],
  [BlockId.STONE]: [128, 128, 128],
  [BlockId.COBBLESTONE]: [105, 105, 105],
  [BlockId.WOOD]: [110, 79, 51],
  [BlockId.PINE_WOOD]: [88, 65, 44],
  [BlockId.PLANKS]: [196, 152, 86],
  [BlockId.SAND]: [225, 208, 151],
  [BlockId.SANDSTONE]: [200, 175, 120],
  [BlockId.SNOW_LAYER]: [240, 248, 255],
  [BlockId.ICE]: [160, 220, 245],
  [BlockId.WATER]: [60, 110, 200],
  [BlockId.GLASS]: [220, 240, 255],
  [BlockId.BRICK]: [170, 80, 60],
  [BlockId.LEAVES]: [73, 145, 60],
  [BlockId.PINE_LEAVES]: [40, 100, 50],
  [BlockId.COAL_ORE]: [70, 70, 70],
  [BlockId.IRON_ORE]: [180, 140, 110],
  [BlockId.GOLD_ORE]: [240, 210, 90],
  [BlockId.DIAMOND_ORE]: [110, 235, 235],
  [BlockId.BEDROCK]: [40, 40, 40],
  [BlockId.CLAY]: [160, 170, 180],
  [BlockId.FURNACE]: [120, 110, 105],
  [BlockId.TORCH]: [255, 200, 90],
  [BlockId.FLOWER_RED]: [220, 70, 70],
  [BlockId.FLOWER_YELLOW]: [240, 220, 60],
  [BlockId.CACTUS]: [80, 140, 70],
  [BlockId.STICK]: [170, 130, 80],
  [BlockId.COAL_ITEM]: [50, 50, 50],
  [BlockId.IRON_INGOT]: [220, 220, 230],
  [BlockId.GOLD_INGOT]: [255, 220, 90],
  [BlockId.DIAMOND]: [130, 240, 240],
  [BlockId.EMERALD]: [80, 220, 120],
  [BlockId.WOODEN_PICKAXE]: [180, 130, 80],
  [BlockId.STONE_PICKAXE]: [140, 140, 140],
  [BlockId.IRON_PICKAXE]: [220, 220, 230],
  [BlockId.WOODEN_AXE]: [180, 130, 80],
  [BlockId.STONE_AXE]: [140, 140, 140],
  [BlockId.IRON_AXE]: [220, 220, 230],
  [BlockId.WOODEN_SWORD]: [180, 130, 80],
  [BlockId.STONE_SWORD]: [140, 140, 140],
  [BlockId.IRON_SWORD]: [220, 220, 230],
  [BlockId.BEEF]: [200, 110, 90],
  [BlockId.PORK]: [240, 180, 170],
  [BlockId.CHICKEN]: [245, 220, 200],
  [BlockId.LEATHER]: [140, 90, 50],
  [BlockId.FEATHER]: [240, 240, 240],
  [BlockId.APPLE]: [220, 50, 50],
};

function drawTile(ctx: CanvasRenderingContext2D, col: number, row: number, blockId: number) {
  const [r, g, b] = PALETTE[blockId] ?? [255, 0, 255];
  const x = col * TILE;
  const y = row * TILE;
  ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
  ctx.fillRect(x, y, TILE, TILE);
  for (let py = 0; py < TILE; py++) {
    for (let px = 0; px < TILE; px++) {
      const h = (Math.sin((px * 12.9898 + py * 78.233 + blockId * 0.7)) * 43758.5453) % 1;
      const noise = h < 0 ? -h : h;
      const tint = Math.floor(noise * 24) - 12;
      ctx.fillStyle = `rgba(${Math.max(0, Math.min(255, r + tint))}, ${Math.max(0, Math.min(255, g + tint))}, ${Math.max(0, Math.min(255, b + tint))}, 0.5)`;
      ctx.fillRect(x + px, y + py, 1, 1);
    }
  }
}

function drawGrass(ctx: CanvasRenderingContext2D, col: number, row: number) {
  const x = col * TILE;
  const y = row * TILE;
  ctx.fillStyle = `rgb(107, 188, 89)`;
  ctx.fillRect(x, y, TILE, 6);
  for (let py = 6; py < TILE; py++) {
    for (let px = 0; px < TILE; px++) {
      const h = (Math.sin((px * 12.9898 + py * 78.233)) * 43758.5453) % 1;
      const noise = h < 0 ? -h : h;
      const c = 134 + Math.floor(noise * 30);
      ctx.fillStyle = `rgb(${c}, ${96 + Math.floor(noise * 18)}, 67)`;
      ctx.fillRect(x + px, y + py, 1, 1);
    }
  }
  ctx.fillStyle = `rgba(80, 160, 70, 0.7)`;
  for (let i = 0; i < 8; i++) {
    const px = Math.floor(Math.random() * TILE);
    const py = Math.floor(Math.random() * 6);
    ctx.fillRect(x + px, y + py, 2, 1);
  }
}

function drawOre(ctx: CanvasRenderingContext2D, col: number, row: number, oreColor: [number, number, number]) {
  const x = col * TILE;
  const y = row * TILE;
  ctx.fillStyle = `rgb(128, 128, 128)`;
  ctx.fillRect(x, y, TILE, TILE);
  for (let i = 0; i < 6; i++) {
    const cx = Math.floor(Math.random() * (TILE - 6)) + 1;
    const cy = Math.floor(Math.random() * (TILE - 6)) + 1;
    ctx.fillStyle = `rgb(${oreColor[0]}, ${oreColor[1]}, ${oreColor[2]})`;
    ctx.fillRect(x + cx, y + cy, 4, 4);
  }
}

function drawPlant(ctx: CanvasRenderingContext2D, col: number, row: number, color: [number, number, number]) {
  const x = col * TILE;
  const y = row * TILE;
  ctx.clearRect(x, y, TILE, TILE);
  ctx.fillStyle = `rgb(80, 140, 70)`;
  ctx.fillRect(x + 7, y + 4, 2, TILE - 4);
  ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
  ctx.fillRect(x + 4, y + 2, 8, 4);
  ctx.fillRect(x + 6, y + 0, 4, 3);
}

function drawTorch(ctx: CanvasRenderingContext2D, col: number, row: number) {
  const x = col * TILE;
  const y = row * TILE;
  ctx.clearRect(x, y, TILE, TILE);
  ctx.fillStyle = `rgb(170, 130, 80)`;
  ctx.fillRect(x + 7, y + 4, 2, TILE - 4);
  ctx.fillStyle = `rgb(255, 200, 90)`;
  ctx.fillRect(x + 6, y + 2, 4, 4);
  ctx.fillStyle = `rgba(255, 220, 120, 0.5)`;
  ctx.fillRect(x + 4, y + 0, 8, 2);
}

function drawWaterTile(ctx: CanvasRenderingContext2D, col: number, row: number) {
  const x = col * TILE;
  const y = row * TILE;
  ctx.fillStyle = `rgba(60, 110, 200, 0.7)`;
  ctx.fillRect(x, y, TILE, TILE);
  ctx.fillStyle = `rgba(140, 180, 230, 0.6)`;
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(x + i * 4, y + (i % 2) * 4, 2, 1);
  }
}

function drawToolIcon(ctx: CanvasRenderingContext2D, col: number, row: number, head: [number, number, number], handle: [number, number, number]) {
  const x = col * TILE;
  const y = row * TILE;
  ctx.clearRect(x, y, TILE, TILE);
  ctx.fillStyle = `rgb(${handle[0]}, ${handle[1]}, ${handle[2]})`;
  ctx.fillRect(x + 7, y + 8, 2, TILE - 8);
  ctx.fillStyle = `rgb(${head[0]}, ${head[1]}, ${head[2]})`;
  ctx.fillRect(x + 2, y + 2, 12, 6);
  ctx.fillRect(x + 5, y + 8, 6, 4);
}

function drawSwordIcon(ctx: CanvasRenderingContext2D, col: number, row: number, head: [number, number, number]) {
  const x = col * TILE;
  const y = row * TILE;
  ctx.clearRect(x, y, TILE, TILE);
  ctx.fillStyle = `rgb(160, 110, 70)`;
  ctx.fillRect(x + 6, y + 11, 4, 4);
  ctx.fillStyle = `rgb(${head[0]}, ${head[1]}, ${head[2]})`;
  ctx.fillRect(x + 7, y + 1, 2, 11);
  ctx.fillRect(x + 5, y + 3, 6, 1);
}

function drawStackIcon(ctx: CanvasRenderingContext2D, col: number, row: number, color: [number, number, number]) {
  const x = col * TILE;
  const y = row * TILE;
  ctx.clearRect(x, y, TILE, TILE);
  ctx.fillStyle = `rgba(0, 0, 0, 0.2)`;
  ctx.fillRect(x + 4, y + 4, TILE - 8, TILE - 8);
  ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
  ctx.fillRect(x + 3, y + 3, TILE - 8, TILE - 8);
}

export function buildTextureAtlas(): { canvas: HTMLCanvasElement; texture: THREE.Texture } {
  const canvas = document.createElement('canvas');
  canvas.width = ATLAS_COLS * TILE;
  canvas.height = ATLAS_ROWS * TILE;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  drawTile(ctx, 0, 0, BlockId.STONE);
  drawTile(ctx, 1, 0, BlockId.STONE);
  drawTile(ctx, 2, 0, BlockId.DIRT);
  drawGrass(ctx, 3, 0);
  drawTile(ctx, 4, 0, BlockId.COBBLESTONE);
  drawTile(ctx, 5, 0, BlockId.WOOD);
  drawTile(ctx, 6, 0, BlockId.WOOD);
  drawTile(ctx, 7, 0, BlockId.PINE_WOOD);
  drawTile(ctx, 8, 0, BlockId.PINE_WOOD);
  drawTile(ctx, 9, 0, BlockId.PLANKS);
  drawTile(ctx, 10, 0, BlockId.SAND);
  drawTile(ctx, 11, 0, BlockId.SANDSTONE);
  drawTile(ctx, 12, 0, BlockId.SNOW_LAYER);
  drawTile(ctx, 13, 0, BlockId.ICE);
  drawTile(ctx, 14, 0, BlockId.GLASS);
  ctx.fillStyle = `rgba(220, 240, 255, 0.4)`;
  ctx.fillRect(14 * TILE, 0, TILE, TILE);
  drawTile(ctx, 15, 0, BlockId.BRICK);

  drawTile(ctx, 0, 1, BlockId.GRASS);
  drawTile(ctx, 1, 1, BlockId.STONE);
  drawTile(ctx, 2, 1, BlockId.DIRT);
  drawTile(ctx, 3, 1, BlockId.SAND);
  drawTile(ctx, 4, 1, BlockId.PLANKS);
  drawTile(ctx, 5, 1, BlockId.WOOD);
  drawTile(ctx, 6, 1, BlockId.PINE_WOOD);
  drawTile(ctx, 7, 1, BlockId.COBBLESTONE);
  drawTile(ctx, 8, 1, BlockId.ICE);
  drawTile(ctx, 9, 1, BlockId.SNOW_LAYER);
  drawTile(ctx, 10, 1, BlockId.BRICK);
  drawTile(ctx, 11, 1, BlockId.CACTUS);
  drawTile(ctx, 12, 1, BlockId.FURNACE);
  drawTile(ctx, 13, 1, BlockId.FURNACE);
  drawTile(ctx, 14, 1, BlockId.FURNACE);
  drawTile(ctx, 15, 1, BlockId.BEDROCK);

  drawTile(ctx, 0, 2, BlockId.LEAVES);
  drawTile(ctx, 1, 2, BlockId.PINE_LEAVES);
  drawOre(ctx, 2, 2, [40, 40, 40]);
  drawOre(ctx, 3, 2, [200, 170, 140]);
  drawOre(ctx, 4, 2, [240, 220, 100]);
  drawOre(ctx, 5, 2, [130, 240, 240]);
  drawTile(ctx, 6, 2, BlockId.BEDROCK);
  drawTile(ctx, 7, 2, BlockId.CLAY);
  drawTile(ctx, 8, 2, BlockId.FURNACE);
  drawTile(ctx, 9, 2, BlockId.FURNACE);
  drawTile(ctx, 10, 2, BlockId.FURNACE);
  drawTile(ctx, 11, 2, BlockId.CACTUS);
  drawTile(ctx, 12, 2, BlockId.CACTUS);
  drawTile(ctx, 13, 2, BlockId.CACTUS);
  drawPlant(ctx, 14, 2, [220, 70, 70]);
  drawPlant(ctx, 15, 2, [240, 220, 60]);

  drawWaterTile(ctx, 0, 3);

  drawStackIcon(ctx, 0, 3, [50, 50, 50]);
  drawStackIcon(ctx, 1, 3, [220, 220, 230]);
  drawStackIcon(ctx, 2, 3, [255, 220, 90]);
  drawStackIcon(ctx, 3, 3, [130, 240, 240]);
  drawStackIcon(ctx, 4, 3, [80, 220, 120]);
  drawStackIcon(ctx, 5, 3, [170, 130, 80]);
  drawStackIcon(ctx, 6, 3, [200, 110, 90]);
  drawStackIcon(ctx, 7, 3, [240, 180, 170]);
  drawStackIcon(ctx, 8, 3, [245, 220, 200]);
  drawStackIcon(ctx, 9, 3, [140, 90, 50]);
  drawStackIcon(ctx, 10, 3, [240, 240, 240]);
  drawStackIcon(ctx, 11, 3, [220, 50, 50]);

  drawTorch(ctx, 12, 3);
  drawPlant(ctx, 13, 3, [220, 70, 70]);
  drawPlant(ctx, 14, 3, [240, 220, 60]);
  drawToolIcon(ctx, 15, 3, [180, 130, 80], [120, 80, 50]);

  drawToolIcon(ctx, 0, 4, [180, 130, 80], [120, 80, 50]);
  drawToolIcon(ctx, 1, 4, [140, 140, 140], [120, 80, 50]);
  drawToolIcon(ctx, 2, 4, [220, 220, 230], [120, 80, 50]);
  drawToolIcon(ctx, 3, 4, [180, 130, 80], [120, 80, 50]);
  drawToolIcon(ctx, 4, 4, [140, 140, 140], [120, 80, 50]);
  drawToolIcon(ctx, 5, 4, [220, 220, 230], [120, 80, 50]);
  drawSwordIcon(ctx, 6, 4, [180, 130, 80]);
  drawSwordIcon(ctx, 7, 4, [140, 140, 140]);
  drawSwordIcon(ctx, 8, 4, [220, 220, 230]);
  ctx.clearRect(9 * TILE, 4 * TILE, TILE, TILE);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return { canvas, texture };
}

export function tileUV(col: number, row: number): { u0: number; v0: number; u1: number; v1: number } {
  const u0 = (col * TILE) / (COLS * TILE);
  const v0 = 1 - ((row + 1) * TILE) / (COLS * TILE);
  const u1 = ((col + 1) * TILE) / (COLS * TILE);
  const v1 = 1 - (row * TILE) / (COLS * TILE);
  return { u0, v0, u1, v1 };
}

export function blockFaceUV(blockId: number, face: 'top' | 'side' | 'bottom'): { u0: number; v0: number; u1: number; v1: number } | null {
  const entry = ATLAS_MAP[blockId];
  if (!entry || 'pattern' in entry) return null;
  const slot = entry[face];
  if (!slot) return null;
  return tileUV(slot[0], slot[1]);
}

export function blockAllFacesUV(blockId: number): { u0: number; v0: number; u1: number; v1: number } | null {
  const entry = ATLAS_MAP[blockId];
  if (!entry || 'pattern' in entry) return null;
  const slot = entry.top ?? entry.side ?? entry.bottom;
  if (!slot) return null;
  return tileUV(slot[0], slot[1]);
}

export function itemIconUV(blockId: number): { u0: number; v0: number; u1: number; v1: number } | null {
  const slot = ITEM_ICONS[blockId] ?? TOOL_ICONS[blockId];
  if (!slot) return null;
  return tileUV(slot[0], slot[1]);
}

export function isBlockOpaque(blockId: number): boolean {
  return !isTransparent(blockId);
}

export function isBlockSeeThrough(blockId: number): boolean {
  return isTransparent(blockId) && !isLiquid(blockId);
}