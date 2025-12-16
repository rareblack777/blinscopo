import { createClient } from '@supabase/supabase-js';

// --- CONFIGURAÇÃO FORÇADA (PROJETO REAL: brlm...) ---
const supabaseUrl = "https://brlmkaqrmqwhapehairf.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJybG1rYXFybXF3aGFwZWhhaXJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NDc1NDQsImV4cCI6MjA4MTQyMzU0NH0.ndF-9aLt9CQqZQbXH4NpVD_Qzojjfe3SHIywPYrOt1k";

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});