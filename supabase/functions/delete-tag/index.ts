import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const body = await req.json();
    const { id } = body || {};
    if (!id || typeof id !== 'string') {
      return new Response(JSON.stringify({ error: 'Tag id is required' }), { status: 400, headers: CORS_HEADERS });
    }

    const SUPABASE_URL = Deno.env.get('VITE_SUPABASE_URL') || Deno.env.get('SUPABASE_URL');
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SERVICE_KEY) {
      console.error('Supabase URL or service role key missing in environment');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), { status: 500, headers: CORS_HEADERS });
    }

    const headers = {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`
    };

    // Fetch tag by id
    const tagRes = await fetch(`${SUPABASE_URL}/rest/v1/tags?id=eq.${encodeURIComponent(id)}&select=*`, { headers });
    if (!tagRes.ok) {
      const text = await tagRes.text();
      console.error('Error fetching tag:', text);
      return new Response(JSON.stringify({ error: 'Failed to fetch tag' }), { status: 502, headers: CORS_HEADERS });
    }
    const tagRows = await tagRes.json();
    if (!tagRows || tagRows.length === 0) {
      return new Response(JSON.stringify({ error: 'Tag not found' }), { status: 404, headers: CORS_HEADERS });
    }

    const tagName = tagRows[0].name;

    // Find recipes that contain this tag
    // PostgREST expects a Postgres array literal for the 'cs' (contains) operator, e.g. {tag}
    function toPostgresArrayLiteral(items: string[]) {
      // Escape backslashes and double quotes, then wrap each element in double quotes
      const escaped = items.map(s => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"'));
      const quoted = escaped.map(s => `"${s}"`);
      return `{${quoted.join(',')}}`;
    }
    const encodedArray = encodeURIComponent(toPostgresArrayLiteral([tagName]));
    const recipesRes = await fetch(`${SUPABASE_URL}/rest/v1/recipes?select=id,tags&tags=cs.${encodedArray}`, { headers });
    if (!recipesRes.ok) {
      const text = await recipesRes.text();
      console.error('Error fetching recipes containing tag:', text);
      return new Response(JSON.stringify({ error: 'Failed to fetch recipes' }), { status: 502, headers: CORS_HEADERS });
    }

    const recipes = await recipesRes.json();
    // For each recipe, remove the tag and PATCH the row
    if (recipes && recipes.length > 0) {
      for (const r of recipes) {
        const currentTags = Array.isArray(r.tags) ? r.tags : [];
        const newTags = currentTags.filter((t: string) => t !== tagName);

        try {
          await fetch(`${SUPABASE_URL}/rest/v1/recipes?id=eq.${encodeURIComponent(r.id)}`, {
            method: 'PATCH',
            headers: {
              ...headers,
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ tags: newTags })
          });
        } catch (err) {
          console.error(`Error updating recipe ${r.id}:`, err);
        }
      }
    }

    // Delete the tag row
    const deleteRes = await fetch(`${SUPABASE_URL}/rest/v1/tags?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        ...headers,
        'Prefer': 'return=minimal'
      }
    });

    if (!deleteRes.ok) {
      const text = await deleteRes.text();
      console.error('Error deleting tag:', text);
      return new Response(JSON.stringify({ error: 'Failed to delete tag' }), { status: 502, headers: CORS_HEADERS });
    }

    return new Response(JSON.stringify({ success: true }), { headers: CORS_HEADERS });
  } catch (error: any) {
    console.error('Delete-tag function error:', error);
    const details = error && error.message ? error.message : String(error);
    return new Response(JSON.stringify({ error: 'Internal server error', details }), { status: 500, headers: CORS_HEADERS });
  }
});
