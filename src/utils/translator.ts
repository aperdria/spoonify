
import { Recipe, Ingredient } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export async function translateRecipe(recipe: Recipe, targetLanguage = 'French'): Promise<Partial<Recipe>> {
  try {
    console.log(`Translating recipe: ${recipe.title} to ${targetLanguage}`);
    
    // Use our Supabase Edge Function for translation
    const { data, error } = await supabase.functions.invoke('translate-recipe', {
      body: { recipe, targetLanguage }
    });

    if (error) {
      console.error("Translation error:", error);
      throw new Error(`Translation failed: ${error.message}`);
    }
    
    return {
      translatedTitle: data.translatedTitle,
      translatedDescription: data.translatedDescription,
      translatedIngredients: data.translatedIngredients,
      translatedSteps: data.translatedSteps
    };
  } catch (error) {
    console.error("Error in translateRecipe:", error);
    throw error;
  }
}

export function convertMeasurements(ingredient: Ingredient): Ingredient {
  // This would convert imperial to metric measurements
  // For now, we're just returning the original ingredient
  return { ...ingredient };
}
