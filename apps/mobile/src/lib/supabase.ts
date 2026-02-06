import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  'https://xaxygzwoouaiguyuwpvf.supabase.co';

const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!SUPABASE_ANON_KEY) {
  console.warn(
    '[supabase] EXPO_PUBLIC_SUPABASE_ANON_KEY not set — Supabase calls will fail'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
