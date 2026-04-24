import { createClient } from '@supabase/supabase-js'

// Browser client — uses publishable (anon) key, safe to expose.
// Access is controlled by RLS policies on the products table.
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  return createClient(url, key)
}
