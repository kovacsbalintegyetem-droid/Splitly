import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
console.log("✅ Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log("✅ Supabase Key:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 10)); // csak az első 10 karakter
