
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
          content: `You are an expert recipe extractor. Carefully analyze the HTML content and extract a comprehensive recipe. Return ONLY a JSON object with the following structure:
          {
            "title": "Recipe Title (must match the actual recipe)",
            "description": "Detailed description of the recipe",
            "imageUrl": "Direct URL to the main recipe image",
            "sourceUrl": "Original URL of the recipe",
            "tags": ["cuisine type", "meal type", "dietary restrictions"],
            "ingredients": [
              { 
                "name": "exact ingredient name", 
                "amount": number or null,  
                "unit": "measurement unit", 
                "notes": "additional preparation details" 
              }
            ],
            "steps": ["Detailed cooking instructions"],
            "prepTime": number in minutes or null,
            "cookTime": number in minutes or null,
            "servings": number
          }
          
          Be extremely precise. Extract exact quantities, preparation methods, and cooking details. If information is missing, use null or leave as an empty array.`
        },
        {
          role: "user",
          content: `Extract the recipe from this HTML. Focus on finding detailed ingredient list and cooking steps: ${html.substring(0, 50000)}`
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
