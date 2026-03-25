"use client"

import { useAuth } from "@/contexts/AuthContext"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, ReactNode } from "react"

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
