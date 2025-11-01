
// Supabase client wrapper — reads connection info from environment variables.
// This file was converted to avoid committing secrets. Do not commit keys here.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Vite exposes env variables through import.meta.env for client builds.
const metaEnv = (import.meta as any).env || {};
const SUPABASE_URL = metaEnv.VITE_SUPABASE_URL;
const SUPABASE_KEY = metaEnv.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
	// Fail fast in development so the developer knows to configure env vars
	throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. See README.md for setup.');
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY);
