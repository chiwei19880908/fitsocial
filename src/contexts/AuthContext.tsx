"use client"

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react"
import { User, Session } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { Database } from "@/lib/supabase/database.types"

type Profile = Database['public']['Tables']['profiles']['Row']

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  isLoading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // 使用單一 Supabase 實例避免多次初始化
  const supabase = createClient()
  
  // 使用 useCallback 避免重複建立函數
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      // 設置 3 秒超時，避免無限等待
      const fetchPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile fetch timeout')), 3000)
      )
      
      const { data, error } = await Promise.race([
        fetchPromise,
        timeoutPromise,
      ]) as any
      
      if (error) {
        console.warn('Profile fetch error:', error)
        return null
      }
      return data
    } catch (error) {
      console.error('Profile fetch exception:', error)
      return null
    }
  }, [supabase])

  const refreshProfile = useCallback(async () => {
    if (user) {
      const data = await fetchProfile(user.id)
      setProfile(data)
    }
  }, [user, fetchProfile])

  // 初始化認證狀態 - 只執行一次
  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      try {
        // 設置 5 秒超時，避免無限卡住
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session fetch timeout')), 5000)
        )
        
        const { data: { session: currentSession }, error: sessionError } = 
          await Promise.race([sessionPromise, timeoutPromise]) as any
        
        if (sessionError) {
          console.error('Session fetch error:', sessionError)
          mounted && setIsLoading(false)
          return
        }

        if (mounted) {
          setSession(currentSession)
          setUser(currentSession?.user ?? null)
          setIsLoading(false)  // 先解除 loading，不等待 profile

          // 如果有用戶，非 blocking 地取得 profile
          if (currentSession?.user) {
            fetchProfile(currentSession.user.id).then(profileData => {
              mounted && setProfile(profileData)
            })
          }
        }
      } catch (error) {
        console.error('Auth init error:', error)
        // 錯誤時也要解除 loading
        mounted && setIsLoading(false)
      }
    }

    initAuth()

    // 訂閱認證狀態變化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!mounted) return

        try {
          setSession(newSession)
          setUser(newSession?.user ?? null)
          setIsLoading(false)  // 先解除 loading

          // 非 blocking 地獲取 profile
          if (newSession?.user) {
            fetchProfile(newSession.user.id).then(profileData => {
              mounted && setProfile(profileData)
            })
          } else {
            setProfile(null)
          }
        } catch (error) {
          console.error('Auth state change error:', error)
          setIsLoading(false)
        }
      }
    )

    // Cleanup function
    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [supabase, fetchProfile])

  const signInWithGoogle = useCallback(async () => {
    try {
      const redirectTo = `${window.location.origin}/auth/callback`
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
        },
      })

      if (error) {
        console.error('Sign in error:', error)
        throw error
      }
    } catch (error) {
      console.error('Google sign in failed:', error)
      throw error
    }
  }, [supabase])

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Sign out error:', error)
        throw error
      }

      setUser(null)
      setProfile(null)
      setSession(null)
    } catch (error) {
      console.error('Sign out failed:', error)
      throw error
    }
  }, [supabase])

  const value: AuthContextType = {
    user,
    profile,
    session,
    isLoading,
    signInWithGoogle,
    signOut,
    refreshProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}