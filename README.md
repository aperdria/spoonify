## Spoonify — Recipe & Grocery Manager

Lightweight React + Vite app for extracting recipes, managing a grocery basket and sharing lists. This README explains the repository layout, how to run the project locally, required environment variables (and where sensitive values are used), and deployment tips.

Open http://localhost:5173 (Vite default) and start developing.

## Project overview

- `src/` — front-end source code (React + TypeScript)
	- `pages/` — page components (Index, AddRecipe, GroceryBasket, ...)
	- `components/` — UI components and shadcn-ui wrappers
	- `services/` — client-facing service functions (Supabase calls)
	- `integrations/supabase/` — Supabase client wrapper (see notes)
	- `utils/` — helpers (recipe extractor, translator)
- `supabase/functions/` — Supabase Edge Functions (Deno) used for recipe extraction & translation
- `public/` — static assets
- `package.json`, `vite.config.ts`, `tailwind.config.ts` — project configuration

## Development notes

- Frontend: Vite + React + TypeScript. Typical commands:

```bash
npm run dev    # start dev server
npm run build  # production build
npm run preview# preview production build locally
```

- The app uses `@supabase/supabase-js` from `src/integrations/supabase/client.ts` for DB interactions.
- The app stores grocery lists and recipes in Supabase and uses server-side Deno edge functions to extract/translate recipe content using external LLM APIs.

## Code structure (high level)

- `src/pages/` — React pages (entrypoints for each route)
- `src/components/` — UI building blocks and shadcn-ui wrappers
- `src/services/` — wrappers around Supabase queries and business logic (e.g., `basketService.ts`, `recipeService.ts`)
- `src/utils/` — helpers such as `recipeExtractor.ts` and `translator.ts`
- `supabase/functions/` — Deno-based edge functions (extract-recipe, translate-recipe)