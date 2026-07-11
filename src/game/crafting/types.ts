export interface RecipeInput {
  blockId: number;
  count: number;
}

export interface RecipeOutput extends RecipeInput {
  durability?: number;
}

export interface Recipe {
  id: string;
  output: RecipeOutput;
  input: RecipeInput[];
}

export interface SmeltingRecipe {
  id: string;
  output: RecipeOutput;
  input: RecipeInput;
  fuel: RecipeInput;
}