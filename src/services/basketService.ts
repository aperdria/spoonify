
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { Recipe, Ingredient, GroceryBasket, GroceryItem } from '@/types';

// Create a new basket
export async function createBasket(): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('grocery_baskets')
      .insert({})
      .select('id')
      .single();

    if (error) {
      console.error('Error creating basket:', error);
      throw error;
    }

    return data.id;
  } catch (error) {
    console.error('Error in createBasket:', error);
    return null;
  }
}

// Get the current user's active basket
export async function getCurrentBasket(): Promise<GroceryBasket | null> {
  try {
    // Get the most recent basket
    const { data: basketData, error: basketError } = await supabase
      .from('grocery_baskets')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (basketError) {
      if (basketError.code === 'PGRST116') {
        // No basket found, create a new one
        const basketId = await createBasket();
        if (!basketId) return null;
        
        return {
          id: basketId,
          items: [],
          recipes: [],
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
      }
      console.error('Error fetching basket:', basketError);
      throw basketError;
    }

    // Get basket recipes
    const { data: recipesData, error: recipesError } = await supabase
      .from('basket_recipes')
      .select(`
        id, 
        servings, 
        original_servings,
        recipes:recipe_id (
          id, 
          title
        )
      `)
      .eq('basket_id', basketData.id);

    if (recipesError) {
      console.error('Error fetching basket recipes:', recipesError);
      throw recipesError;
    }

    // Get basket items
    const { data: itemsData, error: itemsError } = await supabase
      .from('basket_items')
      .select('*')
      .eq('basket_id', basketData.id);

    if (itemsError) {
      console.error('Error fetching basket items:', itemsError);
      throw itemsError;
    }

    // Format recipes
    const formattedRecipes = recipesData.map((item) => ({
      id: item.recipes.id,
      title: item.recipes.title,
      servings: item.servings,
      originalServings: item.original_servings
    }));

    // Format items
    const formattedItems = itemsData.map((item) => ({
      id: item.id,
      name: item.name,
      amount: item.amount,
      unit: item.unit,
      recipeIds: item.recipe_ids,
      checked: item.checked,
      category: item.category
    }));

    return {
      id: basketData.id,
      items: formattedItems,
      recipes: formattedRecipes,
      createdAt: new Date(basketData.created_at).getTime(),
      updatedAt: new Date(basketData.updated_at).getTime()
    };
  } catch (error) {
    console.error('Error in getCurrentBasket:', error);
    return null;
  }
}

// Add a recipe to the basket
export async function addRecipeToBasket(recipeId: string, recipe: Recipe, servings: number): Promise<boolean> {
  try {
    // Get or create basket
    let basketId;
    const { data: basketData, error: basketError } = await supabase
      .from('grocery_baskets')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (basketError) {
      if (basketError.code === 'PGRST116') {
        // No basket found, create a new one
        basketId = await createBasket();
        if (!basketId) return false;
      } else {
        console.error('Error fetching basket:', basketError);
        throw basketError;
      }
    } else {
      basketId = basketData.id;
    }

    // Check if recipe already exists in basket
    const { data: existingRecipe, error: checkError } = await supabase
      .from('basket_recipes')
      .select('*')
      .eq('basket_id', basketId)
      .eq('recipe_id', recipeId)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing recipe:', checkError);
      throw checkError;
    }

    if (existingRecipe) {
      // Update servings if recipe already exists
      const { error: updateError } = await supabase
        .from('basket_recipes')
        .update({ servings })
        .eq('id', existingRecipe.id);

      if (updateError) {
        console.error('Error updating recipe in basket:', updateError);
        throw updateError;
      }
    } else {
      // Add recipe to basket
      const { error: addError } = await supabase
        .from('basket_recipes')
        .insert({
          basket_id: basketId,
          recipe_id: recipeId,
          servings: servings,
          original_servings: recipe.servings
        });

      if (addError) {
        console.error('Error adding recipe to basket:', addError);
        throw addError;
      }

      // Process ingredients and add them to basket items
      const scale = servings / recipe.servings;
      
      for (const ingredient of recipe.ingredients) {
        // Calculate scaled amount and round to 2 decimal places if present
        const scaledRaw = ingredient.amount != null ? Number(ingredient.amount) * scale : null;
        const scaled = scaledRaw != null ? Math.round(scaledRaw * 100) / 100 : null;

        const { error: itemError } = await supabase
          .from('basket_items')
          .insert({
            basket_id: basketId,
            name: ingredient.name,
            amount: scaled,
            unit: ingredient.unit || null,
            recipe_ids: [recipeId],
            category: determineCategory(ingredient.name)
          });

        if (itemError) {
          console.error('Error adding ingredient to basket:', itemError);
          // Continue with other ingredients even if one fails
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Error in addRecipeToBasket:', error);
    return false;
  }
}

// Remove a recipe from the basket
export async function removeRecipeFromBasket(recipeId: string): Promise<boolean> {
  try {
    const { data: basketData, error: basketError } = await supabase
      .from('grocery_baskets')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (basketError) {
      console.error('Error fetching basket:', basketError);
      return false;
    }

    // Remove recipe from basket_recipes
    const { error: removeError } = await supabase
      .from('basket_recipes')
      .delete()
      .eq('basket_id', basketData.id)
      .eq('recipe_id', recipeId);

    if (removeError) {
      console.error('Error removing recipe from basket:', removeError);
      throw removeError;
    }

    // Remove or update basket_items
    const { data: items, error: itemsError } = await supabase
      .from('basket_items')
      .select('*')
      .eq('basket_id', basketData.id)
      .contains('recipe_ids', [recipeId]);

    if (itemsError) {
      console.error('Error fetching basket items:', itemsError);
      throw itemsError;
    }

    for (const item of items) {
      if (item.recipe_ids.length === 1) {
        // If this is the only recipe for this item, delete it
        const { error: deleteError } = await supabase
          .from('basket_items')
          .delete()
          .eq('id', item.id);

        if (deleteError) {
          console.error('Error deleting basket item:', deleteError);
        }
      } else {
        // Remove this recipe from the recipe_ids array
        const newRecipeIds = item.recipe_ids.filter((id: string) => id !== recipeId);
        
        const { error: updateError } = await supabase
          .from('basket_items')
          .update({ recipe_ids: newRecipeIds })
          .eq('id', item.id);

        if (updateError) {
          console.error('Error updating basket item:', updateError);
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Error in removeRecipeFromBasket:', error);
    return false;
  }
}

// Update item checked status
export async function updateItemChecked(itemId: string, checked: boolean): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('basket_items')
      .update({ checked })
      .eq('id', itemId);

    if (error) {
      console.error('Error updating item checked status:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in updateItemChecked:', error);
    return false;
  }
}

// Clear all checked items
export async function clearCheckedItems(basketId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('basket_items')
      .delete()
      .eq('basket_id', basketId)
      .eq('checked', true);

    if (error) {
      console.error('Error clearing checked items:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in clearCheckedItems:', error);
    return false;
  }
}

// Clear entire basket
export async function clearBasket(basketId: string): Promise<boolean> {
  try {
    // First, delete all basket items
    const { error: itemsError } = await supabase
      .from('basket_items')
      .delete()
      .eq('basket_id', basketId);

    if (itemsError) {
      console.error('Error clearing basket items:', itemsError);
      throw itemsError;
    }

    // Then delete all basket recipes
    const { error: recipesError } = await supabase
      .from('basket_recipes')
      .delete()
      .eq('basket_id', basketId);

    if (recipesError) {
      console.error('Error clearing basket recipes:', recipesError);
      throw recipesError;
    }

    return true;
  } catch (error) {
    console.error('Error in clearBasket:', error);
    return false;
  }
}

// Determine ingredient category (simple version)
function determineCategory(ingredientName: string): string {
  const lowerName = ingredientName.toLowerCase();
  
  // Dairy (English + French) - add plant milks and cheeses
  if (/milk|lait|almond|amande|soy|soja|soy(?:a)?milk|cream|cr(e|è)me|cheese|fromage|yogurt|yaourt|butter|beurre|fromage\s+frais/.test(lowerName)) return 'Dairy';
  // Meat - include common cuts and processed meats
  if (/beef|b(o|œ)uf|steak|chicken|poulet|poulet\s+grille|pork|porc|lamb|agneau|turkey|dinde|sausage|saucisse|bacon|ham|jambon|meat|viande/.test(lowerName)) return 'Meat';
  // Fruits - add more common fruits
  if (/apple|pomme|pear|poire|banana|banane|orange|lemon|citron|lime|kiwi|mangue|mango|raisin|grape|fruit|berry|baie|fraise|mûre|mure/.test(lowerName)) return 'Fruits';
  // Vegetables - add courgette, aubergine, greens
  if (/carrot|carotte|potato|pomme\s*de\s*terre|patate|onion|oignon|garlic|ail|pepper|poivron|courgette|zucchini|aubergine|eggplant|celery|c(e|é)leri|chou|cabbage|lettuce|salade|spinach|\b(é|e)pinard\b|vegetable|l(e|è)gume|legume/.test(lowerName)) return 'Vegetables';
  // Grains and bakery - include quinoa, semolina, pastries
  if (/bread|baguette|croissant|pain|flour|farine|rice|riz|pasta|pates|p(â|a)tes|quinoa|semoule|grits|grain|cereal|c(e|é)r(e|é)ale|cereale/.test(lowerName)) return 'Grains';
  // Sweeteners - include maple syrup and powdered sugar
  if (/sugar|sucre|honey|miel|syrup|sirop|maple|erable|(\b)sirop\s*d['’]?erable|sirop\s*d['’]?(é|e)rable|powdered|icing|sucre\s+glace|sweetener|edulcorant|(é|e)dulcorant/.test(lowerName)) return 'Sweeteners';
  // Condiments & oils - add mustard, soy sauce, mayonnaise, olive
  if (/oil|huile|olive|huile\s+d['’]?olive|vinegar|vinaigre|soy|soja|soy\s*sauce|sauce\s+soja|mayonnaise|moutarde|mustard|sauce|dressing|vinaigrette/.test(lowerName)) return 'Condiments';
  // Beverages - add tea and coffee
  if (/water|eau|juice|jus|soda|boisson|beverage|drink|tea|th[eé]|cafe|caf[eé]|coffee/.test(lowerName)) return 'Beverages';
  // Spices & herbs - add curcuma, cumin, ginger, paprika, cinnamon, rosemary, basil
  if (/salt|sel|pepper|poivre|spice|epice|(é|e)pice|herb|herbe|herbes|curcuma|turmeric|cumin|cumin|gingembre|ginger|paprika|cannelle|cinnamon|romarin|rosemary|basilic|basil|anise|anis/.test(lowerName)) return 'Spices';
  
  return 'Other';
}

// Share basket - generate a shareable URL
export async function shareBasket(basketId: string): Promise<string | null> {
  try {
    // In a real implementation, this would create a shareable link via some sharing mechanism
    // For this demo, we'll just return a mock URL
    return `${window.location.origin}/shared-basket/${basketId}`;
  } catch (error) {
    console.error('Error sharing basket:', error);
    return null;
  }
}
