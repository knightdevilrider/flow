
import { createClient } from '@supabase/supabase-js';

// Your Supabase project URL
const supabaseUrl = 'https://hecjqxuweqrknwugvcox.supabase.co';

// Explicitly using the Supabase publishable key provided by the user
const supabaseAnonKey = 'sb_publishable_0Oxo-VOIMsZVM23-6UAppQ_Ygo2PBbG';

if (!supabaseAnonKey) {
  console.warn("Supabase Anon Key is missing.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
