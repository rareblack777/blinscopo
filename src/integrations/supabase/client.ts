import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://mzwyrtywlthfehlnjgux.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16d3lydHl3bHRoZmVobG5qZ3V4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMTgxMDksImV4cCI6MjA4MDg5NDEwOX0.JJ98INQjmbtgZC7cC6GOEBHk9KSN4NJ2DSFoDPe1ZrU";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
