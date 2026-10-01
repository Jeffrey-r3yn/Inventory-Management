import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** true jika kredensial Supabase tersedia (via .env / Vercel Environment Variables) */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

// Nama tabel di Supabase (sesuaikan dengan schema SQL di supabase/schema.sql)
export const TABLES = {
  users: 'inventory_users',
  brands: 'inventory_brands',
  items: 'inventory_items',
  transactions: 'inventory_transactions',
} as const;
