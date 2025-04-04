
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import OpenAI from "https://esm.sh/openai@4.28.4"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipe, targetLanguage = 'French' } = await req.json();
    
    if (!recipe) {
      throw new Error('Recipe data is required');
    }
    
    console.log(`Translating recipe "${recipe.title}" to ${targetLanguage}`);
    
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });

    // Prepare content for translation
    const translationPrompt = `
    Translate the following recipe from English to ${targetLanguage}:
    
    Title: ${recipe.title}
    
    Description: ${recipe.description}
    
    Ingredients:
    ${recipe.ingredients.map(i => 
      `- ${i.amount || ''} ${i.unit || ''} ${i.name}${i.notes ? ` (${i.notes})` : ''}`
    ).join('\n')}
    
    Instructions:
    ${recipe.steps.join('\n')}
    
    Format your response as JSON with these properties:
    {
      "translatedTitle": "title in ${targetLanguage}",
      "translatedDescription": "description in ${targetLanguage}",
      "translatedIngredients": [
        {"name": "ingredient name in ${targetLanguage}", "amount": number, "unit": "unit in ${targetLanguage}", "notes": "notes in ${targetLanguage} if any"}
      ],
      "translatedSteps": ["step 1 in ${targetLanguage}", "step 2 in ${targetLanguage}"]
    }
    
    Keep all measurements the same, just translate the text.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a professional culinary translator specializing in ${targetLanguage}. Accurately translate recipes while preserving recipe structure and formatting.`
        },
        { 
          role: "user", 
          content: translationPrompt
        }
      ],
      temperature: 0.2,
    });

    const translation = JSON.parse(completion.choices[0].message.content);
    console.log("Translation completed successfully");
    
    return new Response(
      JSON.stringify(translation),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );
  } catch (error) {
    console.error("Translation error:", error);
    return new Response(
      JSON.stringify({ 
        error: 'Translation failed', 
        message: error.message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );
  }
});
