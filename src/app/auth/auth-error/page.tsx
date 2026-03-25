"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AuthError() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => router.push('/'), 3000)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500 flex items-center justify-center">
          <span className="text-white text-2xl">✕</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">認證失敗</h1>
        <p className="text-slate-600 mb-4">無法完成登入，請稍後再試</p>
        <p className="text-sm text-slate-400">3 秒後跳轉至首頁...</p>
      </div>
    </div>
  )
}
