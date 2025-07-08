import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Create a singleton client for server-side operations
let supabaseServerClient: ReturnType<typeof createClient> | null = null

export const getSupabaseServerClient = () => {
  if (!supabaseServerClient) {
    supabaseServerClient = createClient(supabaseUrl, supabaseAnonKey)
  }
  return supabaseServerClient
}
