import { createBrowserClient } from '@supabase/ssr'

const globalForSupabase = globalThis as unknown as {
  __supabase: ReturnType<typeof createBrowserClient> | undefined
}

export function createClient() {
  if (globalForSupabase.__supabase) {
    return globalForSupabase.__supabase
  }
  
  const client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  globalForSupabase.__supabase = client
  return client
}
