import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY!
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY!

// Function to create user-specific client with JWT token
export const createSupabaseUserClient = (token: string): SupabaseClient => {
  return createClient(supabaseUrl, supabasePublishableKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  })
}

export const createSupabaseAdminClient = (): SupabaseClient => {
  return createClient(supabaseUrl, supabaseSecretKey)
}