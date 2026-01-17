/**
 * Supabase Client - Frontend
 *
 * Singleton client for Supabase connection.
 * Uses VITE_ prefixed env vars for Vite compatibility.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials not found. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local'
  );
}

export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

// Helper to get current user ID (anonymous for now)
export const getCurrentUserId = (): string => {
  try {
    const stored = localStorage.getItem('ngx_user_id');
    if (stored) return stored;
  } catch {
    // ignore storage access errors
  }
  return 'anonymous-user';
};

// Connection test helper
export const testConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('profiles').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
};
