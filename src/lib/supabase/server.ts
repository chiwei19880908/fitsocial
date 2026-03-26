import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const globalForSupabase = globalThis as unknown as {
  __supabase_server: ReturnType<typeof createServerClient> | undefined
}

export async function createClient() {
  if (globalForSupabase.__supabase_server) {
    return globalForSupabase.__supabase_server
  }

  const cookieStore = await cookies()

  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component 內無法設置 cookie
          }
        },
      },
    }
  )
  
  globalForSupabase.__supabase_server = client
  return client
}
