import { createClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase admin client using the service_role key.
 * This BYPASSES Row Level Security (RLS) entirely — use ONLY for operations
 * where you need admin-level access, such as public booking creation.
 *
 * Uses @supabase/supabase-js directly (NOT the SSR wrapper) so that
 * no user JWT from cookies can accidentally re-apply RLS policies.
 */
export function createServiceClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}