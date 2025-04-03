
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4.28.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Extracting recipe from: ${url}`);
    
    // Fetch the webpage content
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch webpage: ${response.status} ${response.statusText}`);
    }
    
    const html = await response.text();
    
    // Use OpenAI to extract recipe information
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY') || '',
    });
    
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system", 
          content: `You are a recipe extraction expert. Extract the complete recipe from the HTML content provided. Return ONLY a JSON object with the following structure:
          {
            "title": "Recipe Title",
            "description": "Brief description of the recipe",
            "imageUrl": "URL to the main recipe image if available, or empty string",
            "sourceUrl": "Original URL of the recipe",
            "tags": ["tag1", "tag2"], // Cuisine type, meal type, dietary restrictions, etc.
            "ingredients": [
              { 
                "name": "ingredient name", 
                "amount": number or null,  
                "unit": "unit of measurement or empty string", 
                "notes": "additional notes about the ingredient or empty string" 
              }
            ],
            "steps": ["step 1 instruction", "step 2 instruction"],
            "prepTime": number in minutes or null,
            "cookTime": number in minutes or null,
            "servings": number or null
          }
          
          Be accurate and extract all available information. For ingredients, try to separate the quantity, unit, and notes.
          If some information is not available, use null or empty arrays/strings as appropriate.
          IMPORTANT: Return ONLY the JSON object, with no additional text.`
        },
        {
          role: "user",
          content: `Extract the recipe from this HTML: ${html.substring(0, 100000)}`
        }
      ],
      temperature: 0.2,
      max_tokens: 4000
    });
    
    // Extract the JSON from the response
    const recipeText = chatCompletion.choices[0].message.content?.trim();
    let recipe;
    
    try {
      recipe = JSON.parse(recipeText || '{}');
    } catch (error) {
      console.error('Failed to parse OpenAI response:', error);
      throw new Error('Failed to parse recipe data');
    }
    
    // Add default values for missing properties
    const recipeWithDefaults = {
      title: recipe.title || 'Unknown Recipe',
      description: recipe.description || '',
      imageUrl: recipe.imageUrl || '',
      sourceUrl: url,
      tags: recipe.tags || [],
      ingredients: recipe.ingredients || [],
      steps: recipe.steps || [],
      prepTime: recipe.prepTime || null,
      cookTime: recipe.cookTime || null,
      servings: recipe.servings || 4,
    };
    
    return new Response(
      JSON.stringify(recipeWithDefaults),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error extracting recipe:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to extract recipe' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
