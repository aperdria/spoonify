
import { supabase } from '@/integrations/supabase/client';
import { Recipe, Ingredient, Tag } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export async function saveRecipe(recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>): Promise<Recipe | null> {
  try {
    const recipeId = uuidv4();
    const now = new Date().toISOString();
    
    console.log('Attempting to save recipe to Supabase:', { 
      id: recipeId, 
      title: recipe.title,
      source_url: recipe.sourceUrl
    });
    
    const { data, error } = await supabase
      .from('recipes')
      .insert({
        id: recipeId,
        title: recipe.title,
        description: recipe.description,
        image_url: recipe.imageUrl,
        source_url: recipe.sourceUrl,
        tags: recipe.tags,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        prep_time: recipe.prepTime || null,
        cook_time: recipe.cookTime || null,
        servings: recipe.servings,
        translated_title: recipe.translatedTitle || null,
        translated_description: recipe.translatedDescription || null,
        translated_ingredients: recipe.translatedIngredients || null,
        translated_steps: recipe.translatedSteps || null,
        nutrition: recipe.nutrition || null,
        created_at: now,
        updated_at: now
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving recipe:', error);
      throw error;
    }

    console.log('Recipe saved successfully:', data);

    // After saving the recipe, update or create tags
    if (recipe.tags && recipe.tags.length > 0) {
      await updateTags(recipe.tags);
    }

    // Format the response to match our Recipe type
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      imageUrl: data.image_url,
      sourceUrl: data.source_url,
      tags: data.tags,
      ingredients: data.ingredients as Ingredient[],
      steps: data.steps,
      prepTime: data.prep_time || undefined,
      cookTime: data.cook_time || undefined,
      servings: data.servings,
      translatedTitle: data.translated_title || undefined,
      translatedDescription: data.translated_description || undefined,
      translatedIngredients: data.translated_ingredients as Ingredient[] | undefined,
      translatedSteps: data.translated_steps || undefined,
      nutrition: data.nutrition || undefined,
      createdAt: new Date(data.created_at).getTime(),
      updatedAt: new Date(data.updated_at).getTime()
    };
  } catch (error) {
    console.error('Error in saveRecipe:', error);
    throw error;
  }
}

export async function getRecipes(): Promise<Recipe[]> {
  try {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching recipes:', error);
      return [];
    }

    // Map from database format to our Recipe type
    return data.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      imageUrl: item.image_url,
      sourceUrl: item.source_url,
      tags: item.tags,
      ingredients: item.ingredients as Ingredient[],
      steps: item.steps,
      prepTime: item.prep_time || undefined,
      cookTime: item.cook_time || undefined,
      servings: item.servings,
      translatedTitle: item.translated_title || undefined,
      translatedDescription: item.translated_description || undefined,
      translatedIngredients: item.translated_ingredients as Ingredient[] | undefined,
      translatedSteps: item.translated_steps || undefined,
      nutrition: item.nutrition || undefined,
      createdAt: new Date(item.created_at).getTime(),
      updatedAt: new Date(item.updated_at).getTime()
    }));
  } catch (error) {
    console.error('Error in getRecipes:', error);
    return [];
  }
}

export async function getRecipeById(id: string): Promise<Recipe | null> {
  try {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching recipe:', error);
      return null;
    }

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      imageUrl: data.image_url,
      sourceUrl: data.source_url,
      tags: data.tags,
      ingredients: data.ingredients as Ingredient[],
      steps: data.steps,
      prepTime: data.prep_time || undefined,
      cookTime: data.cook_time || undefined,
      servings: data.servings,
      translatedTitle: data.translated_title || undefined,
      translatedDescription: data.translated_description || undefined,
      translatedIngredients: data.translated_ingredients as Ingredient[] | undefined,
      translatedSteps: data.translated_steps || undefined,
      nutrition: data.nutrition || undefined,
      createdAt: new Date(data.created_at).getTime(),
      updatedAt: new Date(data.updated_at).getTime()
    };
  } catch (error) {
    console.error('Error in getRecipeById:', error);
    return null;
  }
}

export async function getAllTags(): Promise<Tag[]> {
  try {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('recipe_count', { ascending: false });

    if (error) {
      console.error('Error fetching tags:', error);
      return [];
    }

    return data.map(tag => ({
      id: tag.id,
      name: tag.name,
      count: tag.recipe_count
    }));
  } catch (error) {
    console.error('Error in getAllTags:', error);
    return [];
  }
}

async function updateTags(tagNames: string[]): Promise<void> {
  try {
    // Get existing tags
    const { data: existingTags, error: fetchError } = await supabase
      .from('tags')
      .select('*')
      .in('name', tagNames);

    if (fetchError) {
      console.error('Error fetching existing tags:', fetchError);
      return;
    }

    const existingTagMap = new Map(existingTags.map(tag => [tag.name, tag]));
    
    // For each tag name, either update the count or create a new tag
    for (const tagName of tagNames) {
      if (existingTagMap.has(tagName)) {
        // Update existing tag count
        const tag = existingTagMap.get(tagName)!;
        const { error: updateError } = await supabase
          .from('tags')
          .update({ recipe_count: tag.recipe_count + 1 })
          .eq('id', tag.id);

        if (updateError) {
          console.error(`Error updating tag ${tagName}:`, updateError);
        }
      } else {
        // Create new tag
        const { error: insertError } = await supabase
          .from('tags')
          .insert({
            id: uuidv4(),
            name: tagName,
            recipe_count: 1,
            created_at: new Date().toISOString()
          });

        if (insertError) {
          console.error(`Error creating tag ${tagName}:`, insertError);
        }
      }
    }
  } catch (error) {
    console.error('Error in updateTags:', error);
  }
}
