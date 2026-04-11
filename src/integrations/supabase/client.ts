import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://vofhunfociguxrgimxbw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvZmh1bmZvY2lndXhyZ2lteGJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4OTgxMzAsImV4cCI6MjA5MTQ3NDEzMH0.xmIodlI5XgBxBPzFRpE6bOBs-FmD60wvA9_ACtONPrE";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
