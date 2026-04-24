import { createClient } from '@supabase/supabase-js'

// Server-only client — same anon key for v1 (no service_role needed since RLS is permissive).
// Must only be called from Server Components or API routes.
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  return createClient(url, key)
}
