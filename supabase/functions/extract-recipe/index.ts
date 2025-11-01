import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};
const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";
const MODEL = "sonar-reasoning"; // Use a valid model from current docs
const MAX_TOKENS = 4000;
const TEMPERATURE = 0.2;
const MAX_HTML_LENGTH = 100000; // Increased limit to keep prompt size bounded
const FETCH_TIMEOUT = 20000; // 20 seconds timeout

// Sanitize HTML for extraction prompts: remove irrelevant tags and attributes
function sanitizeHtml(html: string): string {
  if (!html) return html;
  // Remove scripts except those with type="application/ld+json" (we want to keep JSON-LD)
  html = html.replace(/<script\b(?![^>]*type=["']application\/ld\+json["'])[\s\S]*?<\/script>/gi, "");
  // Remove iframes
  html = html.replace(/<iframe[\s\S]*?<\/iframe>/gi, "");
  // Remove style and noscript blocks
  html = html.replace(/<style[\s\S]*?<\/style>/gi, "");
  html = html.replace(/<noscript[\s\S]*?<\/noscript>/gi, "");
  // Remove HTML comments
  html = html.replace(/<!--([\s\S]*?)-->/g, "");
  // Remove inline event handlers (onclick=, onload=, etc.) from tags to avoid JS noise
  html = html.replace(/\s+on\w+=["'][^"']*["']/gi, "");
  // Collapse excessive whitespace
  html = html.replace(/\s{2,}/g, " ");
  return html.trim();
}
async function fetchWithTimeout(resource, options = {}) {
  const controller = new AbortController();
  const id = setTimeout(()=>controller.abort(), FETCH_TIMEOUT);
  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}
function extractJsonLd(html) {
  const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  const candidates = [];
  while((match = regex.exec(html)) !== null){
    try {
      const json = JSON.parse(match[1]);
      if (Array.isArray(json)) {
        json.forEach((item)=>{
          if (item["@type"] && (item["@type"] === "Recipe" || Array.isArray(item["@type"]) && item["@type"].includes("Recipe"))) {
            candidates.push(item);
          }
        });
      } else if (json["@type"] && (json["@type"] === "Recipe" || Array.isArray(json["@type"]) && json["@type"].includes("Recipe"))) {
        candidates.push(json);
      }
    } catch  {
    // Ignore JSON parse errors
    }
  }
  if (candidates.length > 0) {
    return JSON.stringify(candidates[0]); // Return first found Recipe JSON-LD block
  }
  return null;
}
function cleanJsonFromResponse(text) {
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first !== -1 && last !== -1 && first < last) {
    return text.substring(first, last + 1);
  }
  return text;
}
serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: CORS_HEADERS
    });
  }
  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({
        error: "URL is required"
      }), {
        status: 400,
        headers: CORS_HEADERS
      });
    }
    console.log(`[Recipe Extractor] Fetching webpage: ${url}`);
    let response;
    try {
      response = await fetchWithTimeout(url);
    } catch (fetchErr) {
      console.error(`[Recipe Extractor] Fetch error: ${fetchErr.message}`);
      return new Response(JSON.stringify({
        error: "Failed to fetch recipe webpage",
        message: fetchErr.message
      }), {
        status: 502,
        headers: CORS_HEADERS
      });
    }
    if (!response.ok) {
      console.error(`[Recipe Extractor] Webpage fetch failed: ${response.status} ${response.statusText}`);
      return new Response(JSON.stringify({
        error: "Failed to fetch recipe webpage",
        status: response.status,
        statusText: response.statusText
      }), {
        status: 502,
        headers: CORS_HEADERS
      });
    }
    const fullHtml = await response.text();
    // Create a sanitized version for prompting (remove scripts/iframes/styles/comments and inline handlers)
    const sanitizedHtml = sanitizeHtml(fullHtml);
    let html = sanitizedHtml;
    if (html.length > MAX_HTML_LENGTH) {
      console.log(`[Recipe Extractor] Warning: sanitized HTML larger than ${MAX_HTML_LENGTH} characters, truncating for prompt`);
      // Truncate only the prompt HTML. We still use the full HTML (which keeps JSON-LD scripts) for structured extraction.
      html = html.slice(0, MAX_HTML_LENGTH);
    }
    const perplexityKey = Deno.env.get("PERPLEXITY_API_KEY");
    if (!perplexityKey) {
      return new Response(JSON.stringify({
        error: "Perplexity API key is missing."
      }), {
        status: 500,
        headers: CORS_HEADERS
      });
    }
  // Try to extract JSON-LD from the original full HTML (so we don't accidentally remove JSON-LD script blocks)
  const jsonLd = extractJsonLd(fullHtml);
    let systemPrompt;
    let userContent;
    if (jsonLd) {
      console.log("[Recipe Extractor] Found JSON-LD structured recipe data, using it for extraction.");
      systemPrompt = `You are an expert recipe extractor. Given JSON-LD structured recipe data, extract a JSON object with these fields:
{
  "title": "string",
  "description": "string",
  "imageUrl": "string",
  "sourceUrl": "string",
  "tags": ["string"],
  "ingredients": [{"name":"string","amount":number|null,"unit":"string","notes":"string"}],
  "steps": ["string"],
  "prepTime": number|null,
  "cookTime": number|null,
  "servings": number|null
}

Fill in null or empty arrays if info is missing. Return ONLY the JSON object.`;
      userContent = `Here is the JSON-LD recipe data:\n${jsonLd}`;
    } else {
      console.log("[Recipe Extractor] No JSON-LD found, using raw HTML for extraction.");
      systemPrompt = `You are an expert recipe extractor. Analyze the provided HTML content and extract a JSON object with these fields:
{
  "title": "string",
  "description": "string",
  "imageUrl": "string",
  "sourceUrl": "string",
  "tags": ["string"],
  "ingredients": [{"name":"string","amount":number|null,"unit":"string","notes":"string"}],
  "steps": ["string"],
  "prepTime": number|null,
  "cookTime": number|null,
  "servings": number|null
}
Fill in null or empty arrays if info is missing. Return ONLY the JSON object.`;
      // Use the sanitized (and possibly truncated) HTML for the model prompt so irrelevant content is ignored.
      userContent = `Here is the HTML snippet:\n${html}`;
    }
    const bodyPayload = {
      model: MODEL,
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userContent
        }
      ],
      temperature: TEMPERATURE,
      max_tokens: MAX_TOKENS
    };
    const apiResponse = await fetch(PERPLEXITY_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${perplexityKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(bodyPayload)
    });
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error(`[Recipe Extractor] Perplexity API error: ${apiResponse.status} ${apiResponse.statusText} - ${errorText}`);
      return new Response(JSON.stringify({
        error: "Perplexity API request failed",
        status: apiResponse.status,
        statusText: apiResponse.statusText,
        details: errorText
      }), {
        status: 502,
        headers: CORS_HEADERS
      });
    }
    const data = await apiResponse.json();
    const responseContent = data?.choices?.[0]?.message?.content ?? "";
    const jsonPart = cleanJsonFromResponse(responseContent);
    let recipe;
    try {
      recipe = JSON.parse(jsonPart);
    } catch (jsonError) {
      console.error(`[Recipe Extractor] Failed to parse JSON from Perplexity response: ${jsonError.message}`);
      return new Response(JSON.stringify({
        error: "Failed to parse recipe JSON from Perplexity",
        rawResponse: responseContent
      }), {
        status: 500,
        headers: CORS_HEADERS
      });
    }
    // Add sourceUrl if missing
    if (!recipe.sourceUrl) {
      recipe.sourceUrl = url;
    }
    return new Response(JSON.stringify(recipe), {
      headers: CORS_HEADERS
    });
  } catch (error) {
    console.error(`[Recipe Extractor] Internal error: ${error.message}`);
    return new Response(JSON.stringify({
      error: "Internal server error",
      message: error.message
    }), {
      status: 500,
      headers: CORS_HEADERS
    });
  }
});
