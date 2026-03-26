import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  const isAuthPage = pathname.startsWith('/auth')
  const isPublicPage = pathname === '/auth/login' || pathname === '/auth/auth-error'
  
  // 只在需要時才檢查認證
  const needsAuthCheck = isAuthPage || pathname === '/'
  
  if (!needsAuthCheck) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  try {
    // 添加超時（2 秒），避免無限等待
    const userPromise = supabase.auth.getUser()
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Auth check timeout')), 2000)
    )
    
    const { data: { user } } = await Promise.race([userPromise, timeoutPromise]) as any

    // 只有公開頁面允許未認證用戶
    if (!user && pathname === '/') {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      return NextResponse.redirect(url)
    }

    // 已登入用戶不應該在 auth 頁面（不含公開頁面）
    if (user && isAuthPage && !isPublicPage) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  } catch (error) {
    console.error('Auth check timeout or error:', error)
    // 超時時允許請求繼續（讓客戶端 AuthContext 接手）
  }

  return supabaseResponse
}
