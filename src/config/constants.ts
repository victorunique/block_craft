import { BlockId } from './blocks';

export const CHUNK_SIZE = 16;
export const WORLD_DEPTH = 128;
export const CHUNK_VOLUME = CHUNK_SIZE * CHUNK_SIZE * CHUNK_SIZE;

export const BIOMES = ['plains', 'forest', 'desert', 'snow', 'mountains'] as const;
export type Biome = (typeof BIOMES)[number];

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const WORLD_SIZES = [256, 512, 1024] as const;
export type WorldSize = (typeof WORLD_SIZES)[number];

export const DAY_LENGTH_TICKS = 24_000;
export const TICKS_PER_SECOND = 20;

export const SEALEVEL = 56;
export const BEDROCK_LEVEL = 0;

export const INTERACTION_REACH = 5;
export const PLAYER_WIDTH = 0.6;
export const PLAYER_HEIGHT = 1.8;
export const PLAYER_EYE_HEIGHT = 1.62;
export const STEP_CLIMB_HEIGHT = 1.0;

export const MAX_HEALTH = 20;
export const MAX_HUNGER = 20;
export const MAX_OXYGEN = 100;

export const HOTBAR_SIZE = 9;
export const STORAGE_SIZE = 27;
export const ARMOR_SIZE = 4;

export const GRAVITY = 28;
export const TERMINAL_VELOCITY = 60;
export const WALK_SPEED = 4.3;
export const SPRINT_SPEED = 6.0;
export const SNEAK_SPEED = 1.3;
export const JUMP_VELOCITY = 9.5;
export const WATER_DRAG = 0.85;

export const FALL_DAMAGE_THRESHOLD = 3;
export const STARVATION_INTERVAL_MS = 2000;

export const MONSTER_CAP = 30;
export const ANIMAL_CAP = 20;
export const MONSTER_DETECT_RADIUS = 16;

export const AUTOSAVE_INTERVAL_MS = 30_000;
export const STORAGE_WARN_PERCENT = 80;

export const STORAGE_VERSION = '1.0';

export interface DifficultyConfig {
  monsterMultiplier: number;
  monsterDamageMultiplier: number;
  monsterSpeedMultiplier: number;
  resourceMultiplier: number;
  hungerDrainMultiplier: number;
  healthRegenMultiplier: number;
}

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: {
    monsterMultiplier: 0.5,
    monsterDamageMultiplier: 0.5,
    monsterSpeedMultiplier: 0.75,
    resourceMultiplier: 1.5,
    hungerDrainMultiplier: 0.6,
    healthRegenMultiplier: 1.5,
  },
  medium: {
    monsterMultiplier: 1.0,
    monsterDamageMultiplier: 1.0,
    monsterSpeedMultiplier: 1.0,
    resourceMultiplier: 1.0,
    hungerDrainMultiplier: 1.0,
    healthRegenMultiplier: 1.0,
  },
  hard: {
    monsterMultiplier: 1.5,
    monsterDamageMultiplier: 1.5,
    monsterSpeedMultiplier: 1.25,
    resourceMultiplier: 0.75,
    hungerDrainMultiplier: 1.4,
    healthRegenMultiplier: 0.5,
  },
};

export interface FoodValue {
  hunger: number;
  saturation?: number;
}

export const FOOD_VALUES: Partial<Record<number, FoodValue>> = {
  [BlockId.BEEF]: { hunger: 3 },
  [BlockId.PORK]: { hunger: 3 },
  [BlockId.CHICKEN]: { hunger: 2 },
  [BlockId.APPLE]: { hunger: 4 },
};

export const DURABILITY_MAX: Partial<Record<number, number>> = {
  [BlockId.WOODEN_PICKAXE]: 60,
  [BlockId.STONE_PICKAXE]: 130,
  [BlockId.IRON_PICKAXE]: 250,
  [BlockId.WOODEN_AXE]: 60,
  [BlockId.STONE_AXE]: 130,
  [BlockId.IRON_AXE]: 250,
  [BlockId.WOODEN_SWORD]: 60,
  [BlockId.STONE_SWORD]: 130,
  [BlockId.IRON_SWORD]: 250,
};

export const HARVEST_LEVEL: Partial<Record<number, number>> = {
  [BlockId.WOODEN_PICKAXE]: 1,
  [BlockId.STONE_PICKAXE]: 2,
  [BlockId.IRON_PICKAXE]: 3,
  [BlockId.WOODEN_AXE]: 1,
  [BlockId.STONE_AXE]: 2,
  [BlockId.IRON_AXE]: 3,
};

export const BLOCK_HARDNESS: Partial<Record<number, number>> = {
  [BlockId.DIRT]: 0.5,
  [BlockId.GRASS]: 0.6,
  [BlockId.STONE]: 1.5,
  [BlockId.WOOD]: 2.0,
  [BlockId.LEAVES]: 0.2,
  [BlockId.SAND]: 0.5,
  [BlockId.CLAY]: 0.6,
  [BlockId.COAL_ORE]: 3.0,
  [BlockId.IRON_ORE]: 3.5,
  [BlockId.GOLD_ORE]: 3.0,
  [BlockId.DIAMOND_ORE]: 4.0,
  [BlockId.PLANKS]: 2.0,
  [BlockId.PINE_WOOD]: 2.0,
  [BlockId.PINE_LEAVES]: 0.2,
  [BlockId.SANDSTONE]: 1.5,
  [BlockId.ICE]: 0.5,
};

export const BLOCK_DROPS: Partial<Record<number, number>> = {
  [BlockId.STONE]: BlockId.COBBLESTONE,
  [BlockId.COAL_ORE]: BlockId.COAL_ITEM,
  [BlockId.IRON_ORE]: BlockId.IRON_INGOT,
  [BlockId.GOLD_ORE]: BlockId.GOLD_INGOT,
  [BlockId.DIAMOND_ORE]: BlockId.DIAMOND,
  [BlockId.GRASS]: BlockId.DIRT,
  [BlockId.WOOD]: BlockId.PLANKS,
  [BlockId.PINE_WOOD]: BlockId.PLANKS,
};

export const BLOCK_MINING_LEVEL: Partial<Record<number, number>> = {
  [BlockId.STONE]: 1,
  [BlockId.COAL_ORE]: 1,
  [BlockId.IRON_ORE]: 2,
  [BlockId.GOLD_ORE]: 2,
  [BlockId.DIAMOND_ORE]: 3,
};

export function isPickaxeRequired(blockId: number): boolean {
  return blockId === BlockId.STONE || blockId === BlockId.COAL_ORE || blockId === BlockId.IRON_ORE || blockId === BlockId.GOLD_ORE || blockId === BlockId.DIAMOND_ORE;
}

export const MINING_TIER: Record<string, number> = {
  hand: 0,
  wooden: 1,
  stone: 2,
  iron: 3,
};

export const TOOL_KIND: Partial<Record<number, 'pickaxe' | 'axe' | 'sword'>> = {
  [BlockId.WOODEN_PICKAXE]: 'pickaxe',
  [BlockId.STONE_PICKAXE]: 'pickaxe',
  [BlockId.IRON_PICKAXE]: 'pickaxe',
  [BlockId.WOODEN_AXE]: 'axe',
  [BlockId.STONE_AXE]: 'axe',
  [BlockId.IRON_AXE]: 'axe',
  [BlockId.WOODEN_SWORD]: 'sword',
  [BlockId.STONE_SWORD]: 'sword',
  [BlockId.IRON_SWORD]: 'sword',
};