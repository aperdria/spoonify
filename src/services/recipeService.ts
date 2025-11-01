
import { supabase } from '@/integrations/supabase/client';
import { Recipe, Ingredient, Tag } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import type { Json } from '@/types/supabase';

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
        ingredients: recipe.ingredients as unknown as Json,
        steps: recipe.steps,
        prep_time: recipe.prepTime || null,
        cook_time: recipe.cookTime || null,
        servings: recipe.servings,
        translated_title: recipe.translatedTitle || null,
        translated_description: recipe.translatedDescription || null,
        translated_ingredients: recipe.translatedIngredients as unknown as Json || null,
        translated_steps: recipe.translatedSteps || null,
        nutrition: recipe.nutrition as unknown as Json || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving recipe:', error);
      throw error;
    }

    console.log('Recipe saved successfully:', data);

    if (recipe.tags && recipe.tags.length > 0) {
      await updateTags(recipe.tags);
    }

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      imageUrl: data.image_url,
      sourceUrl: data.source_url,
      tags: data.tags as string[],
      ingredients: data.ingredients as unknown as Ingredient[],
      steps: data.steps as string[],
      prepTime: data.prep_time || undefined,
      cookTime: data.cook_time || undefined,
      servings: data.servings,
      translatedTitle: data.translated_title || undefined,
      translatedDescription: data.translated_description || undefined,
      translatedIngredients: data.translated_ingredients as unknown as Ingredient[] | undefined,
      translatedSteps: data.translated_steps as string[] | undefined,
      nutrition: data.nutrition as unknown as Recipe['nutrition'],
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

    return data.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      imageUrl: item.image_url,
      sourceUrl: item.source_url,
      tags: item.tags as string[],
      ingredients: item.ingredients as unknown as Ingredient[],
      steps: item.steps as string[],
      prepTime: item.prep_time || undefined,
      cookTime: item.cook_time || undefined,
      servings: item.servings,
      translatedTitle: item.translated_title || undefined,
      translatedDescription: item.translated_description || undefined,
      translatedIngredients: item.translated_ingredients as unknown as Ingredient[] | undefined,
      translatedSteps: item.translated_steps as string[] | undefined,
      nutrition: item.nutrition as unknown as Recipe['nutrition'],
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
      tags: data.tags as string[],
      ingredients: data.ingredients as unknown as Ingredient[],
      steps: data.steps as string[],
      prepTime: data.prep_time || undefined,
      cookTime: data.cook_time || undefined,
      servings: data.servings,
      translatedTitle: data.translated_title || undefined,
      translatedDescription: data.translated_description || undefined,
      translatedIngredients: data.translated_ingredients as unknown as Ingredient[] | undefined,
      translatedSteps: data.translated_steps as string[] | undefined,
      nutrition: data.nutrition as unknown as Recipe['nutrition'],
      createdAt: new Date(data.created_at).getTime(),
      updatedAt: new Date(data.updated_at).getTime()
    };
  } catch (error) {
    console.error('Error in getRecipeById:', error);
    return null;
  }
}

export async function deleteRecipe(id: string): Promise<boolean> {
  try {
    console.log(`Attempting to delete recipe with ID: ${id}`);
    
    // First, check if the recipe exists
    const { data: checkData, error: checkError } = await supabase
      .from('recipes')
      .select('id, title')
      .eq('id', id)
      .maybeSingle();
      
    if (checkError) {
      console.error('Error checking if recipe exists:', checkError);
      return false;
    }
    
    if (!checkData) {
      console.error(`Recipe with ID ${id} not found`);
      return false;
    }
    
    console.log(`Found recipe to delete: "${checkData.title}" (${checkData.id})`);
    
    // First, fetch the recipe to get its tags (for later cleanup)
    const recipe = await getRecipeById(id);
    if (!recipe) {
      console.error('Recipe not found for deletion');
      return false;
    }

    // Use more detailed logging to track the deletion process
    console.log(`Preparing to delete recipe: ${recipe.title}`);
    
    // Add Prefer header for better response handling
    const { error, count } = await supabase
      .from('recipes')
      .delete()
      .eq('id', id)
      .throwOnError();
      
    if (error) {
      console.error('Error deleting recipe:', error);
      return false;
    }
    
    // Verify the deletion
    const { data: verifyData } = await supabase
      .from('recipes')
      .select('id')
      .eq('id', id)
      .maybeSingle();
      
    if (verifyData) {
      console.error(`Recipe deletion failed: Recipe ${id} still exists in the database`);
      return false;
    }
    
    console.log('Delete operation completed successfully');
    
    // Only proceed with tag cleanup if we successfully deleted the recipe
    if (recipe.tags && recipe.tags.length > 0) {
      console.log(`Cleaning up ${recipe.tags.length} tags`);
      
      for (const tagName of recipe.tags) {
        // Try to get the tag
        const { data: tagData, error: tagError } = await supabase
          .from('tags')
          .select('*')
          .eq('name', tagName)
          .single();

        if (tagError) {
          console.error(`Error fetching tag ${tagName}:`, tagError);
          continue; // Skip to next tag if we can't find this one
        }

        if (tagData) {
          if (tagData.recipe_count <= 1) {
            // Delete tag if this was the last recipe using it
            const { error: deleteTagError } = await supabase
              .from('tags')
              .delete()
              .eq('id', tagData.id);
              
            if (deleteTagError) {
              console.error(`Error deleting tag ${tagName}:`, deleteTagError);
            } else {
              console.log(`Tag ${tagName} deleted as it's no longer used`);
            }
          } else {
            // Decrement tag count
            const { error: updateTagError } = await supabase
              .from('tags')
              .update({ recipe_count: tagData.recipe_count - 1 })
              .eq('id', tagData.id);
              
            if (updateTagError) {
              console.error(`Error updating tag ${tagName} count:`, updateTagError);
            } else {
              console.log(`Tag ${tagName} count decremented to ${tagData.recipe_count - 1}`);
            }
          }
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Error in deleteRecipe:', error);
    return false;
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

/**
 * Delete a tag by id and remove it from any recipes that reference it.
 * Returns true on success, false otherwise.
 */
export async function deleteTagById(id: string): Promise<boolean> {
  try {
    // Fetch the tag first to get its name
    const { data: tagData, error: tagError } = await supabase
      .from('tags')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (tagError) {
      console.error('Error fetching tag for deletion:', tagError);
      return false;
    }

    if (!tagData) {
      console.warn(`Tag with id ${id} not found`);
      return false;
    }

    const tagName: string = tagData.name;

    // Find recipes that contain this tag
    const { data: recipes, error: recipesError } = await supabase
      .from('recipes')
      .select('id, tags')
      .contains('tags', [tagName]);

    if (recipesError) {
      console.error('Error fetching recipes that contain tag:', recipesError);
      return false;
    }

    if (recipes && recipes.length > 0) {
      // For each recipe, remove the tag from its tags array
      for (const r of recipes) {
        const currentTags: string[] = r.tags || [];
        const newTags = currentTags.filter((t: string) => t !== tagName);

        try {
          await supabase
            .from('recipes')
            .update({ tags: newTags })
            .eq('id', r.id);
        } catch (err) {
          console.error(`Error updating recipe ${r.id} while removing tag ${tagName}:`, err);
        }
      }
    }

    // Finally delete the tag row itself
    const { error: deleteError } = await supabase
      .from('tags')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting tag row:', deleteError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteTagById:', error);
    return false;
  }
}

async function updateTags(tagNames: string[]): Promise<void> {
  try {
    const { data: existingTags, error: fetchError } = await supabase
      .from('tags')
      .select('*')
      .in('name', tagNames);

    if (fetchError) {
      console.error('Error fetching existing tags:', fetchError);
      return;
    }

    const existingTagMap = new Map(existingTags.map(tag => [tag.name, tag]));
    
    for (const tagName of tagNames) {
      if (existingTagMap.has(tagName)) {
        const tag = existingTagMap.get(tagName)!;
        const { error: updateError } = await supabase
          .from('tags')
          .update({ recipe_count: tag.recipe_count + 1 })
          .eq('id', tag.id);

        if (updateError) {
          console.error(`Error updating tag ${tagName}:`, updateError);
        }
      } else {
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

export async function updateRecipe(id: string, recipe: Partial<Recipe>): Promise<Recipe | null> {
  try {
    console.log('Updating recipe:', { id, ...recipe });
    
    const originalRecipe = await getRecipeById(id);
    if (!originalRecipe) {
      console.error('Original recipe not found for update');
      return null;
    }
    
    const now = new Date().toISOString();
    
    const updateData: any = {
      updated_at: now
    };
    
    if (recipe.title !== undefined) updateData.title = recipe.title;
    if (recipe.description !== undefined) updateData.description = recipe.description;
    if (recipe.imageUrl !== undefined) updateData.image_url = recipe.imageUrl;
    if (recipe.sourceUrl !== undefined) updateData.source_url = recipe.sourceUrl;
    if (recipe.ingredients !== undefined) updateData.ingredients = recipe.ingredients as unknown as Json;
    if (recipe.steps !== undefined) updateData.steps = recipe.steps;
    if (recipe.prepTime !== undefined) updateData.prep_time = recipe.prepTime;
    if (recipe.cookTime !== undefined) updateData.cook_time = recipe.cookTime;
    if (recipe.servings !== undefined) updateData.servings = recipe.servings;
    if (recipe.translatedTitle !== undefined) updateData.translated_title = recipe.translatedTitle;
    if (recipe.translatedDescription !== undefined) updateData.translated_description = recipe.translatedDescription;
    if (recipe.translatedIngredients !== undefined) updateData.translated_ingredients = recipe.translatedIngredients as unknown as Json;
    if (recipe.translatedSteps !== undefined) updateData.translated_steps = recipe.translatedSteps;
    if (recipe.nutrition !== undefined) updateData.nutrition = recipe.nutrition as unknown as Json;
    
    if (recipe.tags !== undefined) {
      updateData.tags = recipe.tags;
      
      if (originalRecipe.tags && originalRecipe.tags.length > 0) {
        const tagsToRemove = originalRecipe.tags.filter(tag => !recipe.tags?.includes(tag));
        const tagsToAdd = recipe.tags.filter(tag => !originalRecipe.tags.includes(tag));
        
        for (const tagName of tagsToRemove) {
          const { data: tagData } = await supabase
            .from('tags')
            .select('*')
            .eq('name', tagName)
            .single();

          if (tagData) {
            if (tagData.recipe_count <= 1) {
              await supabase
                .from('tags')
                .delete()
                .eq('id', tagData.id);
            } else {
              await supabase
                .from('tags')
                .update({ recipe_count: tagData.recipe_count - 1 })
                .eq('id', tagData.id);
            }
          }
        }
        
        if (tagsToAdd.length > 0) {
          await updateTags(tagsToAdd);
        }
      } else if (recipe.tags.length > 0) {
        await updateTags(recipe.tags);
      }
    }
    
    const { data, error } = await supabase
      .from('recipes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating recipe:', error);
      return null;
    }

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      imageUrl: data.image_url,
      sourceUrl: data.source_url,
      tags: data.tags as string[],
      ingredients: data.ingredients as unknown as Ingredient[],
      steps: data.steps as string[],
      prepTime: data.prep_time || undefined,
      cookTime: data.cook_time || undefined,
      servings: data.servings,
      translatedTitle: data.translated_title || undefined,
      translatedDescription: data.translated_description || undefined,
      translatedIngredients: data.translated_ingredients as unknown as Ingredient[] | undefined,
      translatedSteps: data.translated_steps as string[] | undefined,
      nutrition: data.nutrition as unknown as Recipe['nutrition'],
      createdAt: new Date(data.created_at).getTime(),
      updatedAt: new Date(data.updated_at).getTime()
    };
  } catch (error) {
    console.error('Error in updateRecipe:', error);
    return null;
  }
}
