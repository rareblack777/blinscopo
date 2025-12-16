import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

<<<<<<< HEAD
// --- CONFIGURAÇÃO FORÇADA (PROJETO REAL: brlm...) ---
const supabaseUrl = "https://brlmkaqrmqwhapehairf.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJybG1rYXFybXF3aGFwZWhhaXJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NDc1NDQsImV4cCI6MjA4MTQyMzU0NH0.ndF-9aLt9CQqZQbXH4NpVD_Qzojjfe3SHIywPYrOt1k";

// Cria a conexão limpa apontando para o lugar certo
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
=======
const SUPABASE_URL = "https://mzwyrtywlthfehlnjgux.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16d3lydHl3bHRoZmVobG5qZ3V4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMTgxMDksImV4cCI6MjA4MDg5NDEwOX0.JJ98INQjmbtgZC7cC6GOEBHk9KSN4NJ2DSFoDPe1ZrU";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
>>>>>>> 475d10cb54b20f244a302d745ee29579898a5e43
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});