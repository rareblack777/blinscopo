import { createClient } from '@supabase/supabase-js';

// Configuração padrão do Lovable (Isso restaura seu login original)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);