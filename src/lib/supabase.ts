import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://zqkxzvmfiuqcxwqhpldf.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpxa3h6dm1maXVxY3h3cWhwbGRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5NTgzMjcsImV4cCI6MjEwNzUzNDMyN30.EPUbgimgroe1_ULsKBK7S2j4KSG4DZxTsowA8IXxCHw";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
