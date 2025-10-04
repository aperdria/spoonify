import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};
const PERPLEXITY_URL = "https://api.perplexity.ai/chat/completions";
const MODEL = "sonar";
const MAX_TOKENS = 2000;
const TEMPERATURE = 0.2;
function buildPrompt(recipe, targetLanguage) {
  const ingredients = recipe.ingredients.map((i)=>`- ${i.amount || ''} ${i.unit || ''} ${i.name}${i.notes ? ` (${i.notes})` : ''}`.trim()).join('\n');
  const steps = recipe.steps.map((step, idx)=>`${idx + 1}. ${step}`).join('\n');
  return `
Translate the following recipe from English to ${targetLanguage}:

Title: ${recipe.title}

Description: ${recipe.description}

Ingredients:
${ingredients}

Instructions:
${steps}

Format your response as strict valid JSON:
{
  "translatedTitle": "title in ${targetLanguage}",
  "translatedDescription": "description in ${targetLanguage}",
  "translatedIngredients": [
    {"name": "ingredient name in ${targetLanguage}", "amount": number, "unit": "unit in ${targetLanguage}", "notes": "notes in ${targetLanguage} if any"}
  ],
  "translatedSteps": ["step 1 in ${targetLanguage}", "step 2 in ${targetLanguage}"]
}

Keep all numbers and measurements the same, only translate text. Do not include any extra text beyond the JSON.
`;
}
function validateTranslation(json) {
  return {
    translatedTitle: typeof json.translatedTitle === "string" ? json.translatedTitle : "",
    translatedDescription: typeof json.translatedDescription === "string" ? json.translatedDescription : "",
    translatedIngredients: Array.isArray(json.translatedIngredients) ? json.translatedIngredients : [],
    translatedSteps: Array.isArray(json.translatedSteps) ? json.translatedSteps : []
  };
}
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: CORS_HEADERS
    });
  }
  try {
    const { recipe, targetLanguage = "French" } = await req.json();
    if (!recipe) {
      return new Response(JSON.stringify({
        error: "Recipe data is required"
      }), {
        status: 400,
        headers: CORS_HEADERS
      });
    }
    const perplexityKey = Deno.env.get("PERPLEXITY_API_KEY");
    if (!perplexityKey) {
      return new Response(JSON.stringify({
        error: "Perplexity API key missing."
      }), {
        status: 500,
        headers: CORS_HEADERS
      });
    }
    const userPrompt = buildPrompt(recipe, targetLanguage);
    const response = await fetch(PERPLEXITY_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${perplexityKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: `You are a professional culinary translator specializing in ${targetLanguage}. 
Accurately translate recipes and output in JSON as instructed.`
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        temperature: TEMPERATURE,
        max_tokens: MAX_TOKENS
      })
    });
    if (!response.ok) {
      return new Response(JSON.stringify({
        error: `Perplexity API error: ${response.status} ${response.statusText}`
      }), {
        status: 502,
        headers: CORS_HEADERS
      });
    }
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content?.trim();
    let translation;
    try {
      translation = JSON.parse(content || "{}");
    } catch  {
      return new Response(JSON.stringify({
        error: "Could not parse JSON from Perplexity response.",
        raw: content
      }), {
        status: 500,
        headers: CORS_HEADERS
      });
    }
    return new Response(JSON.stringify(validateTranslation(translation)), {
      headers: CORS_HEADERS
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Translation failed',
      message: error.message
    }), {
      status: 500,
      headers: CORS_HEADERS
    });
  }
});
