import { createClient } from "@supabase/supabase-js";

const viteEnv =
  typeof import.meta !== "undefined" && typeof import.meta.env !== "undefined"
    ? import.meta.env
    : ({} as Record<string, string | undefined>);

const supabaseUrl =
  viteEnv.VITE_SUPABASE_URL?.trim() ||
  viteEnv.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
  (typeof process !== "undefined" ? process.env.VITE_SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() : "");

const supabaseAnonKey =
  viteEnv.VITE_SUPABASE_ANON_KEY?.trim() ||
  viteEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY?.trim() ||
  (typeof process !== "undefined"
    ? process.env.VITE_SUPABASE_ANON_KEY?.trim() || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY?.trim()
    : "");

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;
