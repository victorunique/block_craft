/**
 * Block-ID registry.
 *
 * The docs explicitly number: Clay=12, Coal Ore=13, Furnace=14 (Test-Strategy.md §6),
 * Brick=10 (Database.md example), and Stone=4 (Database.md example).
 * Other block IDs are derived from the registry below; the mapping rationale is
 * recorded in artifacts/Documentation_Conflict_Report.md.
 */

export const ATLAS_TILE = {
  STONE: [1, 0] as [number, number],
  DIRT: [2, 0] as [number, number],
  GRASS_TOP: [3, 0] as [number, number],
  GRASS_SIDE: [0, 1] as [number, number],
  COBBLESTONE: [4, 0] as [number, number],
  WOOD_TOP: [5, 0] as [number, number],
  WOOD_SIDE: [6, 0] as [number, number],
  PINE_WOOD_TOP: [7, 0] as [number, number],
  PINE_WOOD_SIDE: [8, 0] as [number, number],
  PLANKS: [9, 0] as [number, number],
  SAND: [10, 0] as [number, number],
  SANDSTONE: [11, 0] as [number, number],
  SNOW_LAYER: [12, 0] as [number, number],
  ICE: [13, 0] as [number, number],
  GLASS: [14, 0] as [number, number],
  BRICK: [15, 0] as [number, number],
  LEAVES: [0, 2] as [number, number],
  PINE_LEAVES: [1, 2] as [number, number],
  COAL_ORE: [2, 2] as [number, number],
  IRON_ORE: [3, 2] as [number, number],
  GOLD_ORE: [4, 2] as [number, number],
  DIAMOND_ORE: [5, 2] as [number, number],
  BEDROCK: [6, 2] as [number, number],
  CLAY: [7, 2] as [number, number],
  FURNACE_TOP: [8, 2] as [number, number],
  FURNACE_SIDE: [9, 2] as [number, number],
  FURNACE_BOTTOM: [10, 2] as [number, number],
  CACTUS_TOP: [11, 2] as [number, number],
  CACTUS_SIDE: [12, 2] as [number, number],
  CACTUS_BOTTOM: [13, 2] as [number, number],
  FLOWER_RED: [14, 2] as [number, number],
  FLOWER_YELLOW: [15, 2] as [number, number],
  WATER: [11, 1] as [number, number],
  TORCH: [12, 3] as [number, number],
};

export const BlockId = {
  AIR: 0,
  BEDROCK: 1,
  DIRT: 2,
  GRASS: 3,
  STONE: 4,
  WOOD: 5,
  LEAVES: 6,
  SAND: 7,
  WATER: 8,
  GLASS: 9,
  BRICK: 10,
  COBBLESTONE: 11,
  CLAY: 12,
  COAL_ORE: 13,
  FURNACE: 14,
  TORCH: 15,
  IRON_ORE: 16,
  GOLD_ORE: 17,
  DIAMOND_ORE: 18,
  COAL_ITEM: 19,
  IRON_INGOT: 20,
  GOLD_INGOT: 21,
  DIAMOND: 22,
  EMERALD: 23,
  STICK: 24,
  PLANKS: 25,
  SNOW_LAYER: 26,
  ICE: 27,
  CACTUS: 28,
  FLOWER_RED: 29,
  FLOWER_YELLOW: 30,
  PINE_WOOD: 31,
  PINE_LEAVES: 32,
  SANDSTONE: 33,
  TOOL_BASE: 100,
  WOODEN_PICKAXE: 101,
  STONE_PICKAXE: 102,
  IRON_PICKAXE: 103,
  WOODEN_AXE: 104,
  STONE_AXE: 105,
  IRON_AXE: 106,
  WOODEN_SWORD: 107,
  STONE_SWORD: 108,
  IRON_SWORD: 109,
  FOOD_BASE: 150,
  BEEF: 151,
  PORK: 152,
  CHICKEN: 153,
  LEATHER: 154,
  FEATHER: 155,
  APPLE: 156,
  COOKED_BEEF: 157,
  COOKED_PORK: 158,
  COOKED_CHICKEN: 159,
} as const;

export type BlockIdValue = (typeof BlockId)[keyof typeof BlockId];

export const BLOCK_NAMES: Record<number, string> = {
  [BlockId.AIR]: 'Air',
  [BlockId.BEDROCK]: 'Bedrock',
  [BlockId.DIRT]: 'Dirt',
  [BlockId.GRASS]: 'Grass',
  [BlockId.STONE]: 'Stone',
  [BlockId.WOOD]: 'Wood',
  [BlockId.LEAVES]: 'Leaves',
  [BlockId.SAND]: 'Sand',
  [BlockId.WATER]: 'Water',
  [BlockId.GLASS]: 'Glass',
  [BlockId.BRICK]: 'Brick',
  [BlockId.COBBLESTONE]: 'Cobblestone',
  [BlockId.CLAY]: 'Clay',
  [BlockId.COAL_ORE]: 'Coal Ore',
  [BlockId.FURNACE]: 'Furnace',
  [BlockId.TORCH]: 'Torch',
  [BlockId.IRON_ORE]: 'Iron Ore',
  [BlockId.GOLD_ORE]: 'Gold Ore',
  [BlockId.DIAMOND_ORE]: 'Diamond Ore',
  [BlockId.COAL_ITEM]: 'Coal',
  [BlockId.IRON_INGOT]: 'Iron Ingot',
  [BlockId.GOLD_INGOT]: 'Gold Ingot',
  [BlockId.DIAMOND]: 'Diamond',
  [BlockId.EMERALD]: 'Emerald',
  [BlockId.STICK]: 'Stick',
  [BlockId.PLANKS]: 'Planks',
  [BlockId.SNOW_LAYER]: 'Snow Layer',
  [BlockId.ICE]: 'Ice',
  [BlockId.CACTUS]: 'Cactus',
  [BlockId.FLOWER_RED]: 'Poppy',
  [BlockId.FLOWER_YELLOW]: 'Dandelion',
  [BlockId.PINE_WOOD]: 'Pine Wood',
  [BlockId.PINE_LEAVES]: 'Pine Leaves',
  [BlockId.SANDSTONE]: 'Sandstone',
  [BlockId.WOODEN_PICKAXE]: 'Wooden Pickaxe',
  [BlockId.STONE_PICKAXE]: 'Stone Pickaxe',
  [BlockId.IRON_PICKAXE]: 'Iron Pickaxe',
  [BlockId.WOODEN_AXE]: 'Wooden Axe',
  [BlockId.STONE_AXE]: 'Stone Axe',
  [BlockId.IRON_AXE]: 'Iron Axe',
  [BlockId.WOODEN_SWORD]: 'Wooden Sword',
  [BlockId.STONE_SWORD]: 'Stone Sword',
  [BlockId.IRON_SWORD]: 'Iron Sword',
  [BlockId.BEEF]: 'Raw Beef',
  [BlockId.PORK]: 'Raw Pork',
  [BlockId.CHICKEN]: 'Raw Chicken',
  [BlockId.LEATHER]: 'Leather',
  [BlockId.FEATHER]: 'Feather',
  [BlockId.APPLE]: 'Apple',
  [BlockId.COOKED_BEEF]: 'Steak',
  [BlockId.COOKED_PORK]: 'Cooked Porkchop',
  [BlockId.COOKED_CHICKEN]: 'Cooked Chicken',
};

export const SOLID_BLOCKS = new Set<number>([
  BlockId.BEDROCK,
  BlockId.DIRT,
  BlockId.GRASS,
  BlockId.STONE,
  BlockId.WOOD,
  BlockId.LEAVES,
  BlockId.SAND,
  BlockId.BRICK,
  BlockId.COBBLESTONE,
  BlockId.CLAY,
  BlockId.COAL_ORE,
  BlockId.FURNACE,
  BlockId.IRON_ORE,
  BlockId.GOLD_ORE,
  BlockId.DIAMOND_ORE,
  BlockId.PLANKS,
  BlockId.ICE,
  BlockId.CACTUS,
  BlockId.PINE_WOOD,
  BlockId.PINE_LEAVES,
  BlockId.SANDSTONE,
  BlockId.GLASS,
]);

export const TRANSPARENT_BLOCKS = new Set<number>([
  BlockId.AIR,
  BlockId.GLASS,
  BlockId.WATER,
  BlockId.TORCH,
  BlockId.SNOW_LAYER,
  BlockId.FLOWER_RED,
  BlockId.FLOWER_YELLOW,
  BlockId.LEAVES,
]);

export const LIQUID_BLOCKS = new Set<number>([BlockId.WATER]);

export const BLOCK_STACK_MAX = 64;

export function isBlockStackable(blockId: number): boolean {
  if (blockId >= BlockId.TOOL_BASE && blockId < BlockId.FOOD_BASE) return false;
  if (blockId >= BlockId.FOOD_BASE) return false;
  return true;
}

export function getMaxStack(blockId: number): number {
  return isBlockStackable(blockId) ? BLOCK_STACK_MAX : 1;
}

export function isAir(blockId: number): boolean {
  return blockId === BlockId.AIR;
}

export function isLiquid(blockId: number): boolean {
  return LIQUID_BLOCKS.has(blockId);
}

export function isTransparent(blockId: number): boolean {
  return TRANSPARENT_BLOCKS.has(blockId);
}

export function isSolid(blockId: number): boolean {
  return SOLID_BLOCKS.has(blockId);
}

export function blockEmitsLight(blockId: number): number {
  if (blockId === BlockId.TORCH) return 14;
  if (blockId === BlockId.FURNACE) return 12;
  return 0;
}