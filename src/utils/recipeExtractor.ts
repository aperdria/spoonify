import { Recipe, Ingredient } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export async function extractRecipeFromUrl(url: string): Promise<Recipe | null> {
  try {
    console.log(`Extracting recipe from URL: ${url}`);
    
    // First, try to extract using Supabase Edge Function
    try {
      const { data, error } = await supabase.functions.invoke('extract-recipe', {
        body: { url }
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
  const mockRecipe: Recipe = {
    id: generateId(),
    title: "Authentic Italian Pasta Carbonara",
    description: "A creamy traditional pasta carbonara with pancetta, eggs, and Parmesan cheese. Simple ingredients transformed into a luxurious sauce coating perfectly al dente spaghetti.",
    imageUrl: "https://images.unsplash.com/photo-1612874742237-6526221588e3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1771&q=80",
    sourceUrl: url,
    tags: ["Italian", "Pasta", "Dinner"],
    ingredients: [
      { name: "spaghetti", amount: 500, unit: "g" },
      { name: "pancetta", amount: 150, unit: "g", notes: "diced" },
      { name: "egg yolks", amount: 6, unit: "" },
      { name: "Parmesan cheese", amount: 50, unit: "g", notes: "grated, plus extra for serving" },
      { name: "black pepper", amount: 1, unit: "tsp", notes: "freshly ground" },
      { name: "salt", amount: 1, unit: "tsp" },
    ],
    steps: [
      "Bring a large pot of salted water to a boil. Add the spaghetti and cook until al dente, following package instructions.",
      "While the pasta is cooking, heat a large skillet over medium heat. Add the pancetta and cook until crispy, about 5-7 minutes.",
      "In a bowl, whisk together the egg yolks, grated Parmesan, and plenty of black pepper.",
      "Drain the pasta, reserving about 1/2 cup of the pasta water. Immediately add the hot pasta to the skillet with the pancetta, tossing to combine.",
      "Remove the skillet from the heat and quickly add the egg mixture, tossing constantly to create a creamy sauce. If needed, add a splash of the reserved pasta water to loosen the sauce.",
      "Serve immediately, topped with additional grated Parmesan and freshly ground black pepper."
    ],
    prepTime: 15,
    cookTime: 20,
    servings: 4,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  if (url.includes('chocolate') || url.includes('cake')) {
    mockRecipe.title = "Triple Chocolate Cake";
    mockRecipe.description = "A rich and decadent triple chocolate cake that's perfect for special occasions. This cake features layers of moist chocolate cake with creamy chocolate ganache.";
    mockRecipe.tags = ["Dessert", "Chocolate", "Baking"];
    mockRecipe.ingredients = [
      { name: "all-purpose flour", amount: 2, unit: "cups" },
      { name: "granulated sugar", amount: 1.5, unit: "cups" },
      { name: "unsweetened cocoa powder", amount: 3/4, unit: "cup" },
      { name: "baking soda", amount: 2, unit: "tsp" },
      { name: "baking powder", amount: 1.5, unit: "tsp" },
      { name: "salt", amount: 1, unit: "tsp" },
      { name: "eggs", amount: 2, unit: "large" },
      { name: "milk", amount: 1, unit: "cup" },
      { name: "vegetable oil", amount: 1/2, unit: "cup" },
      { name: "vanilla extract", amount: 2, unit: "tsp" },
      { name: "boiling water", amount: 1, unit: "cup" },
      { name: "dark chocolate", amount: 200, unit: "g", notes: "for ganache" },
      { name: "heavy cream", amount: 1, unit: "cup", notes: "for ganache" },
    ];
    mockRecipe.steps = [
      "Preheat oven to 350°F (175°C). Grease and flour two 9-inch cake pans.",
      "In a large bowl, whisk together flour, sugar, cocoa powder, baking soda, baking powder, and salt.",
      "Add eggs, milk, oil, and vanilla. Beat with mixer on medium speed for 2 minutes.",
      "Stir in boiling water (batter will be thin). Pour into prepared pans.",
      "Bake for 30-35 minutes or until a toothpick inserted comes out clean.",
      "Cool in pans for 10 minutes, then remove to wire racks to cool completely.",
      "For ganache, heat cream until just simmering. Pour over chopped chocolate and let sit for 5 minutes. Stir until smooth.",
      "When cake is cool, spread ganache between layers and over top and sides of cake."
    ];
    mockRecipe.prepTime = 30;
    mockRecipe.cookTime = 35;
    mockRecipe.imageUrl = "https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1089&q=80";
  } else if (url.includes('salad') || url.includes('vegetarian') || url.includes('vegan')) {
    mockRecipe.title = "Mediterranean Quinoa Salad";
    mockRecipe.description = "A refreshing and nutritious Mediterranean quinoa salad packed with vegetables, feta cheese, and a zesty lemon dressing. Perfect for a light lunch or as a side dish.";
    mockRecipe.tags = ["Vegetarian", "Salad", "Healthy", "Mediterranean"];
    mockRecipe.ingredients = [
      { name: "quinoa", amount: 1, unit: "cup", notes: "rinsed" },
      { name: "water", amount: 2, unit: "cups" },
      { name: "cucumber", amount: 1, unit: "medium", notes: "diced" },
      { name: "cherry tomatoes", amount: 1, unit: "cup", notes: "halved" },
      { name: "red bell pepper", amount: 1, unit: "medium", notes: "diced" },
      { name: "red onion", amount: 1/2, unit: "small", notes: "finely diced" },
      { name: "kalamata olives", amount: 1/3, unit: "cup", notes: "pitted and sliced" },
      { name: "feta cheese", amount: 1/2, unit: "cup", notes: "crumbled" },
      { name: "fresh parsley", amount: 1/4, unit: "cup", notes: "chopped" },
      { name: "fresh mint", amount: 2, unit: "tbsp", notes: "chopped" },
      { name: "extra virgin olive oil", amount: 1/4, unit: "cup" },
      { name: "lemon juice", amount: 3, unit: "tbsp", notes: "freshly squeezed" },
      { name: "garlic", amount: 1, unit: "clove", notes: "minced" },
      { name: "dried oregano", amount: 1, unit: "tsp" },
      { name: "salt", amount: 1/2, unit: "tsp" },
      { name: "black pepper", amount: 1/4, unit: "tsp" },
    ];
    mockRecipe.steps = [
      "Rinse quinoa thoroughly under cold water. In a medium saucepan, combine quinoa and water. Bring to a boil, then reduce heat to low, cover, and simmer for 15 minutes or until water is absorbed.",
      "Remove from heat and let stand, covered, for 5 minutes. Fluff with a fork and transfer to a large bowl to cool.",
      "In a small bowl, whisk together olive oil, lemon juice, garlic, oregano, salt, and pepper to make the dressing.",
      "Once quinoa has cooled to room temperature, add cucumber, tomatoes, bell pepper, red onion, olives, feta cheese, parsley, and mint.",
      "Pour the dressing over the salad and toss gently to combine. Taste and adjust seasoning if necessary.",
      "Cover and refrigerate for at least 30 minutes to allow flavors to meld. Serve chilled or at room temperature."
    ];
    mockRecipe.prepTime = 20;
    mockRecipe.cookTime = 15;
    mockRecipe.imageUrl = "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80";
  } else if (url.includes('indian') || url.includes('tikka') || url.includes('masala')) {
    mockRecipe.title = "Chicken Tikka Masala";
    mockRecipe.description = "A popular Indian dish featuring tender chunks of marinated chicken in a creamy, aromatic tomato sauce with warm spices.",
    mockRecipe.tags = ["Indian", "Curry", "Chicken", "Spicy"];
    mockRecipe.ingredients = [
      { name: "boneless chicken breast", amount: 1.5, unit: "lbs", notes: "cut into 1-inch cubes" },
      { name: "plain yogurt", amount: 1, unit: "cup", notes: "for marinade" },
      { name: "lemon juice", amount: 2, unit: "tbsp" },
      { name: "garam masala", amount: 2, unit: "tsp" },
      { name: "ground cumin", amount: 1, unit: "tsp" },
      { name: "ground coriander", amount: 1, unit: "tsp" },
      { name: "ground turmeric", amount: 1/2, unit: "tsp" },
      { name: "paprika", amount: 1, unit: "tsp" },
      { name: "garlic", amount: 4, unit: "cloves", notes: "minced" },
      { name: "ginger", amount: 1, unit: "tbsp", notes: "grated" },
      { name: "butter", amount: 2, unit: "tbsp" },
      { name: "onion", amount: 1, unit: "large", notes: "finely chopped" },
      { name: "tomato puree", amount: 1, unit: "cup" },
      { name: "heavy cream", amount: 1/2, unit: "cup" },
      { name: "salt", amount: 1, unit: "tsp", notes: "or to taste" },
      { name: "fresh cilantro", amount: 1/4, unit: "cup", notes: "chopped, for garnish" },
    ];
    mockRecipe.steps = [
      "In a large bowl, combine yogurt, lemon juice, garam masala, cumin, coriander, turmeric, paprika, garlic, and ginger. Add chicken pieces and stir to coat. Cover and refrigerate for at least 2 hours, or overnight.",
      "Preheat oven to 450°F (230°C). Thread marinated chicken onto skewers and place on a baking sheet lined with foil. Bake for 15-20 minutes until chicken is cooked through and slightly charred.",
      "While chicken is cooking, melt butter in a large saucepan over medium heat. Add onions and cook until soft and translucent, about 5-7 minutes.",
      "Add remaining spices (1 tsp garam masala, 1/2 tsp cumin, 1/2 tsp coriander) and cook for another minute until fragrant.",
      "Add tomato puree and bring to a simmer. Cook for 10-15 minutes until sauce thickens slightly.",
      "Stir in heavy cream and salt. Simmer for another 5 minutes.",
      "Remove cooked chicken from skewers and add to the sauce. Simmer for an additional 5 minutes to let flavors meld.",
      "Garnish with fresh cilantro and serve hot with rice or naan bread."
    ];
    mockRecipe.prepTime = 30;
    mockRecipe.cookTime = 45;
    mockRecipe.imageUrl = "https://images.unsplash.com/photo-1565557623262-b51c2513a641?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1071&q=80";
  }
  
  return mockRecipe;
}
