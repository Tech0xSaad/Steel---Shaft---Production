import { createClient } from '@supabase/supabase-js'
import { env } from './env.js'

/**
 * Server-side Supabase client using the SERVICE ROLE key.
 * This client bypasses Row Level Security — use only in trusted server code.
 * Never expose the service role key to the browser.
 */
export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession:   false,
    },
  }
)

/**
 * Server-side Supabase client using the ANON key.
 * Used for verifying user JWTs — respects RLS.
 */
export const supabaseAnon = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession:   false,
    },
  }
)
