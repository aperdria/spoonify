
import { Recipe, Ingredient } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export async function extractRecipeFromUrl(url: string): Promise<Recipe | null> {
  try {
    console.log(`Extracting recipe from URL: ${url}`);
    
    // First, try to extract using Supabase Edge Function
    try {
      const { data, error } = await supabase.functions.invoke('extract-recipe', {
        body: JSON.stringify({ url })
      });
      
      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }
      
      if (data) {
        console.log('Recipe extracted successfully from edge function');
        
        // Format the response to match our Recipe type
        return {
          id: generateId(),
          title: data.title || '',
          description: data.description || '',
          imageUrl: data.imageUrl || '',
          sourceUrl: url,
          tags: Array.isArray(data.tags) ? data.tags : [],
          ingredients: Array.isArray(data.ingredients) ? data.ingredients.map(formatIngredient) : [],
          steps: Array.isArray(data.steps) ? data.steps : [],
          prepTime: data.prepTime || undefined,
          cookTime: data.cookTime || undefined,
          servings: data.servings || 4,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
      }
    } catch (error) {
      console.error('Failed to extract recipe using edge function:', error);
      // Don't throw here, let it fall through to the fallback
    }
    
  } catch (error) {
    console.error("Error extracting recipe:", error);
    return null;
  }
}

function formatIngredient(ingredient: any): Ingredient {
  return {
    name: ingredient.name || '',
    amount: typeof ingredient.amount === 'number' ? ingredient.amount : undefined,
    unit: ingredient.unit || '',
    notes: ingredient.notes || ''
  };
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}
