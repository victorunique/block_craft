import type { Recipe } from './types';
import { BlockId } from '../../config/blocks';

export const RECIPES: Recipe[] = [
  {
    id: 'planks',
    output: { blockId: BlockId.PLANKS, count: 4 },
    input: [{ blockId: BlockId.WOOD, count: 1 }],
  },
  {
    id: 'sticks',
    output: { blockId: BlockId.STICK, count: 4 },
    input: [{ blockId: BlockId.PLANKS, count: 2 }],
  },
  {
    id: 'torch',
    output: { blockId: BlockId.TORCH, count: 4 },
    input: [
      { blockId: BlockId.COAL_ITEM, count: 1 },
      { blockId: BlockId.STICK, count: 1 },
    ],
  },
  {
    id: 'wooden_pickaxe',
    output: { blockId: BlockId.WOODEN_PICKAXE, count: 1, durability: 60 },
    input: [
      { blockId: BlockId.PLANKS, count: 3 },
      { blockId: BlockId.STICK, count: 2 },
    ],
  },
  {
    id: 'stone_pickaxe',
    output: { blockId: BlockId.STONE_PICKAXE, count: 1, durability: 130 },
    input: [
      { blockId: BlockId.COBBLESTONE, count: 3 },
      { blockId: BlockId.STICK, count: 2 },
    ],
  },
  {
    id: 'iron_pickaxe',
    output: { blockId: BlockId.IRON_PICKAXE, count: 1, durability: 250 },
    input: [
      { blockId: BlockId.IRON_INGOT, count: 3 },
      { blockId: BlockId.STICK, count: 2 },
    ],
  },
  {
    id: 'wooden_axe',
    output: { blockId: BlockId.WOODEN_AXE, count: 1, durability: 60 },
    input: [
      { blockId: BlockId.PLANKS, count: 3 },
      { blockId: BlockId.STICK, count: 2 },
    ],
  },
  {
    id: 'stone_axe',
    output: { blockId: BlockId.STONE_AXE, count: 1, durability: 130 },
    input: [
      { blockId: BlockId.COBBLESTONE, count: 3 },
      { blockId: BlockId.STICK, count: 2 },
    ],
  },
  {
    id: 'iron_axe',
    output: { blockId: BlockId.IRON_AXE, count: 1, durability: 250 },
    input: [
      { blockId: BlockId.IRON_INGOT, count: 3 },
      { blockId: BlockId.STICK, count: 2 },
    ],
  },
  {
    id: 'wooden_sword',
    output: { blockId: BlockId.WOODEN_SWORD, count: 1, durability: 60 },
    input: [
      { blockId: BlockId.PLANKS, count: 2 },
      { blockId: BlockId.STICK, count: 1 },
    ],
  },
  {
    id: 'stone_sword',
    output: { blockId: BlockId.STONE_SWORD, count: 1, durability: 130 },
    input: [
      { blockId: BlockId.COBBLESTONE, count: 2 },
      { blockId: BlockId.STICK, count: 1 },
    ],
  },
  {
    id: 'iron_sword',
    output: { blockId: BlockId.IRON_SWORD, count: 1, durability: 250 },
    input: [
      { blockId: BlockId.IRON_INGOT, count: 2 },
      { blockId: BlockId.STICK, count: 1 },
    ],
  },
  {
    id: 'furnace',
    output: { blockId: BlockId.FURNACE, count: 1 },
    input: [{ blockId: BlockId.COBBLESTONE, count: 8 }],
  },
];

export const SMELTING_RECIPES: SmeltingRecipe[] = [
  {
    id: 'glass',
    output: { blockId: BlockId.GLASS, count: 1 },
    input: { blockId: BlockId.SAND, count: 1 },
    fuel: { blockId: BlockId.COAL_ITEM, count: 1 },
  },
  {
    id: 'brick',
    output: { blockId: BlockId.BRICK, count: 1 },
    input: { blockId: BlockId.CLAY, count: 1 },
    fuel: { blockId: BlockId.COAL_ITEM, count: 1 },
  },
  {
    id: 'iron_ingot_smelting',
    output: { blockId: BlockId.IRON_INGOT, count: 1 },
    input: { blockId: BlockId.IRON_ORE, count: 1 },
    fuel: { blockId: BlockId.COAL_ITEM, count: 1 },
  },
  {
    id: 'gold_ingot_smelting',
    output: { blockId: BlockId.GOLD_INGOT, count: 1 },
    input: { blockId: BlockId.GOLD_ORE, count: 1 },
    fuel: { blockId: BlockId.COAL_ITEM, count: 1 },
  },
];

import type { SmeltingRecipe } from './types';