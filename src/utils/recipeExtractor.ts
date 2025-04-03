
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
    }
    
    // Fallback to mock data if edge function fails
    console.log('Falling back to mock data extraction');
    return generateMockRecipe(url);
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

function generateMockRecipe(url: string): Recipe {
  const mockRecipes = [
    {
      title: "Chicken Tikka Masala",
      description: "A popular Indian dish featuring tender chunks of marinated chicken in a creamy, aromatic tomato sauce with warm spices.",
      tags: ["Indian", "Curry", "Chicken", "Spicy"],
      ingredients: [
        { name: "boneless chicken breast", amount: 1.5, unit: "lbs", notes: "cut into 1-inch cubes" },
        { name: "plain yogurt", amount: 1, unit: "cup", notes: "for marinade" },
        { name: "lemon juice", amount: 2, unit: "tbsp" },
        { name: "garam masala", amount: 2, unit: "tsp" },
        { name: "ground cumin", amount: 1, unit: "tsp" },
        { name: "ground coriander", amount: 1, unit: "tsp" },
        { name: "ground turmeric", amount: 0.5, unit: "tsp" },
        { name: "paprika", amount: 1, unit: "tsp" },
        { name: "garlic", amount: 4, unit: "cloves", notes: "minced" },
        { name: "ginger", amount: 1, unit: "tbsp", notes: "grated" },
        { name: "butter", amount: 2, unit: "tbsp" },
        { name: "onion", amount: 1, unit: "large", notes: "finely chopped" },
        { name: "tomato puree", amount: 1, unit: "cup" },
        { name: "heavy cream", amount: 0.5, unit: "cup" },
        { name: "salt", amount: 1, unit: "tsp", notes: "or to taste" },
        { name: "fresh cilantro", amount: 0.25, unit: "cup", notes: "chopped, for garnish" },
      ],
      steps: [
        "In a large bowl, combine yogurt, lemon juice, garam masala, cumin, coriander, turmeric, paprika, garlic, and ginger. Add chicken pieces and stir to coat. Cover and refrigerate for at least 2 hours, or overnight.",
        "Preheat oven to 450°F (230°C). Thread marinated chicken onto skewers and place on a baking sheet lined with foil. Bake for 15-20 minutes until chicken is cooked through and slightly charred.",
        "While chicken is cooking, melt butter in a large saucepan over medium heat. Add onions and cook until soft and translucent, about 5-7 minutes.",
        "Add remaining spices (1 tsp garam masala, 1/2 tsp cumin, 1/2 tsp coriander) and cook for another minute until fragrant.",
        "Add tomato puree and bring to a simmer. Cook for 10-15 minutes until sauce thickens slightly.",
        "Stir in heavy cream and salt. Simmer for another 5 minutes.",
        "Remove cooked chicken from skewers and add to the sauce. Simmer for an additional 5 minutes to let flavors meld.",
        "Garnish with fresh cilantro and serve hot with rice or naan bread."
      ],
      prepTime: 30,
      cookTime: 45,
      servings: 4,
      imageUrl: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1071&q=80"
    }
  ];

  // Find a matching recipe based on URL keywords
  const matchedRecipe = mockRecipes.find(recipe => 
    url.toLowerCase().includes(recipe.title.toLowerCase().replace(/\s+/g, '-'))
  );

  return matchedRecipe || {
    id: generateId(),
    title: "Recipe Not Found",
    description: "Unable to extract recipe details from the provided URL",
    imageUrl: "",
    sourceUrl: url,
    tags: [],
    ingredients: [],
    steps: [],
    prepTime: undefined,
    cookTime: undefined,
    servings: 4,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}
