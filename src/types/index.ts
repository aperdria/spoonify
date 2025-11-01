
export interface Recipe {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  sourceUrl: string;
  tags: string[];
  ingredients: Ingredient[];
  steps: string[];
  prepTime?: number; // in minutes
  cookTime?: number; // in minutes
  servings: number;
  translatedTitle?: string;
  translatedDescription?: string;
  translatedIngredients?: Ingredient[];
  translatedSteps?: string[];
  nutrition?: NutritionInfo;
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
}

export interface Ingredient {
  name: string;
  amount?: number;
  unit?: string;
  notes?: string;
}

export interface NutritionInfo {
  calories: number; // kcal
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  fiber?: number; // grams
  sugar?: number; // grams
  sodium?: number; // mg
}

export interface Tag {
  id: string;
  name: string;
  count: number; // number of recipes with this tag
}

export interface GroceryItem {
  id: string;
  name: string;
  amount?: number;
  unit?: string;
  recipeIds: string[]; // which recipes this item belongs to
  checked: boolean;
  category?: string;
}

export interface GroceryBasket {
  id: string;
  items: GroceryItem[];
  recipes: {
    id: string;
    title: string;
    servings: number;
    originalServings: number;
  }[];
  createdAt: number;
  updatedAt: number;
  shareUrl?: string;
}
