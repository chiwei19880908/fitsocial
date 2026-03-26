"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import {
  Activity,
  Dumbbell,
  Heart,
  MessageCircle,
  Share2,
  Home,
  Search,
  Bell,
  User,
  Plus,
  Bookmark,
  Flame,
  TrendingUp,
  Trophy,
  Loader2,
  LogOut,
  X,
  Clock,
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import {
  getWorkoutLogsQuick,
  createWorkoutLog,
  toggleLike,
  saveWorkoutAsTemplate,
  WorkoutLogWithProfile,
} from "@/lib/api/workouts"
import { WorkoutType, Intensity } from "@/lib/supabase/types"

export default function HomePage() {
  const { user, profile, isLoading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"home" | "search" | "add" | "bell" | "profile">("home")
  const [showWorkoutModal, setShowWorkoutModal] = useState(false)
  const [workoutType, setWorkoutType] = useState<WorkoutType>("aerobic")
  const [selectedIntensity, setSelectedIntensity] = useState<Intensity>("moderate")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [selectedMood, setSelectedMood] = useState<string>("")
  const [selectedDistance, setSelectedDistance] = useState<string>("")
  const [selectedDuration, setSelectedDuration] = useState<number>(30)
  
  type AerobicSegment = 
    | { id: string; type: 'run'; distance: string; duration: number }
    | { id: string; type: 'rest'; duration: number }

  const [aerobicSegments, setAerobicSegments] = useState<AerobicSegment[]>([
    { id: '1', type: 'run', distance: '5km', duration: 30 }
  ])

  type WorkoutItem = 
    | { id: string; type: 'exercise'; name: string; sets: number; reps: number }
    | { id: string; type: 'rest'; duration: number }

  const [workoutItems, setWorkoutItems] = useState<WorkoutItem[]>([
    { id: '1', type: 'exercise', name: '', sets: 3, reps: 10 }
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [workouts, setWorkouts] = useState<WorkoutLogWithProfile[]>([])
  const [isLoadingWorkouts, setIsLoadingWorkouts] = useState(true)

  // 使用 useMemo 避免重複建立物件
  const moodBubbles = useMemo(() => ({
    easy: [
      { emoji: "🧁", label: "一塊小蛋糕" },
      { emoji: "💪", label: "我還能做一組" },
      { emoji: "🌟", label: "我超強的！" },
    ],
    moderate: [
      { emoji: "😊", label: "感覺良好" },
      { emoji: "🔥", label: "今天狀態不錯" },
      { emoji: "📈", label: "突破自己了" },
    ],
    hard: [
      { emoji: "💀", label: "差點死在健身房" },
      { emoji: "🏆", label: "挑戰極限成功" },
      { emoji: "🎯", label: "達成目標！" },
    ],
  }), [])

  const setsOptions = useMemo(() => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], [])
  const repsOptions = useMemo(() => [5, 8, 10, 12, 15, 20], [])
  const restOptions = useMemo(() => [30, 60, 90, 120, 180], [])
  const exercisePresets = useMemo(() => ["臥推", "深蹲", "硬舉", "肩推", "划船", "二頭", "三頭", "腹肌", "小腿", "核心"], [])

  // 距離/時間依訓練類型分流
  const categoryDistanceOptions: Record<string, string[]> = useMemo(() => ({
    LSD: ["1km", "3km", "5km", "10km", "半馬", "全馬"],
    "间歇": ["100m", "200m", "300m", "400m", "600m", "800m", "1km"],
    "配速跑": ["400m", "800m", "1km", "3km", "5km", "10km", "半馬"],
  }), [])
  // 間歇用秒數，LSD/配速跑用分鐘
  const categoryDurationOptions: Record<string, { value: number; label: string }[]> = useMemo(() => ({
    LSD: [5, 10, 15, 20, 30, 45, 60, 90].map(v => ({ value: v, label: `${v}分` })),
    "间歇": [30, 45, 60, 90, 120, 180, 240, 300].map(v => ({ value: v, label: v >= 60 ? `${v / 60}分` : `${v}秒` })),
    "配速跑": [5, 10, 15, 20, 30, 45, 60, 90].map(v => ({ value: v, label: `${v}分` })),
  }), [])

  const currentDistanceOptions = useMemo(() =>
    categoryDistanceOptions[selectedCategory] ?? categoryDistanceOptions.LSD
  , [selectedCategory, categoryDistanceOptions])

  const currentDurationOptions = useMemo(() =>
    categoryDurationOptions[selectedCategory] ?? categoryDurationOptions.LSD
  , [selectedCategory, categoryDurationOptions])

  const aerobicPresets = useMemo(() => ({
    LSD: [
      { distance: "5km", duration: 30 },
      { distance: "10km", duration: 60 },
      { distance: "半馬", duration: 120 },
    ],
    "间歇": [
      { distance: "400m", duration: 90 },
      { distance: "800m", duration: 180 },
      { distance: "1km", duration: 240 },
    ],
    "配速跑": [
      { distance: "5km", duration: 25 },
      { distance: "10km", duration: 50 },
      { distance: "半馬", duration: 90 },
    ],
  }), [])

  const categories = useMemo(() => 
    workoutType === "aerobic"
      ? ["LSD", "间歇", "配速跑"]
      : ["胸部", "背部", "腿部", "肩部", "手臂"],
    [workoutType]
  )

  // ✅ 改進：使用 useCallback 優化載入邏輯
  const loadWorkouts = useCallback(async () => {
    if (!user) return
    
    setIsLoadingWorkouts(true)
    try {
      // 使用快速版本避免並行 lock 問題
      const data = await getWorkoutLogsQuick(20)
      setWorkouts(data)
    } catch (error) {
      console.error("Failed to load workouts:", error)
      setWorkouts([])
    } finally {
      setIsLoadingWorkouts(false)
    }
  }, [user])

  // 初始化時載入一次
  useEffect(() => {
    loadWorkouts()
  }, [loadWorkouts])

  // 偵測連續重複的 segment 模式，回傳群組
  type StoredAerobicSeg = { type: 'run'; distance: string; duration: number } | { type: 'rest'; duration: number }
  type StoredStrengthSeg = { type: 'exercise'; name: string; sets: number; reps: number } | { type: 'rest'; duration: number }
  type SegGroup<T> = { pattern: T[]; count: number }

  function groupSegments<T>(segs: T[], eq: (a: T, b: T) => boolean): SegGroup<T>[] {
    const groups: SegGroup<T>[] = []
    let i = 0
    while (i < segs.length) {
      let bestW = 1, bestC = 1
      const maxW = Math.floor((segs.length - i) / 2)
      for (let w = 1; w <= maxW; w++) {
        const pat = segs.slice(i, i + w)
        let c = 1, j = i + w
        while (j + w <= segs.length && pat.every((s, k) => eq(s, segs[j + k]))) { c++; j += w }
        if (c > 1 && w * c >= bestW * bestC) { bestW = w; bestC = c }
      }
      groups.push({ pattern: segs.slice(i, i + bestW), count: bestC })
      i += bestW * bestC
    }
    return groups
  }

  const handleLogWorkout = useCallback(async () => {
    if (!user || !selectedCategory || !selectedMood) return

    setIsSubmitting(true)
    try {
      let details: Record<string, unknown>
      if (workoutType === "aerobic") {
        const segments: StoredAerobicSeg[] = aerobicSegments.map(seg =>
          seg.type === 'run'
            ? { type: 'run' as const, distance: seg.distance, duration: seg.duration }
            : { type: 'rest' as const, duration: seg.duration }
        )
        details = { segments, mood: selectedMood }
      } else {
        const segments: StoredStrengthSeg[] = workoutItems
          .filter(item => item.type !== 'exercise' || (item as { name: string }).name)
          .map(item =>
            item.type === 'exercise'
              ? { type: 'exercise' as const, name: (item as { name: string }).name, sets: (item as { sets: number }).sets, reps: (item as { reps: number }).reps }
              : { type: 'rest' as const, duration: (item as { duration: number }).duration }
          )
        details = { segments, mood: selectedMood }
      }

      await createWorkoutLog(
        user.id,
        workoutType,
        selectedCategory,
        selectedIntensity,
        details
      )

      setShowWorkoutModal(false)
      resetForm()
      await loadWorkouts()
    } catch (error) {
      console.error("Failed to create workout:", error)
      alert("運動紀錄保存失敗，請稍後重試")
    } finally {
      setIsSubmitting(false)
    }
  }, [user, selectedCategory, selectedMood, workoutType, aerobicSegments, workoutItems, selectedIntensity, loadWorkouts])

  const resetForm = useCallback(() => {
    setSelectedCategory("")
    setSelectedMood("")
    setSelectedDistance("")
    setSelectedDuration(30)
    setAerobicSegments([{ id: '1', type: 'run', distance: '5km', duration: 30 }])
    setWorkoutItems([{ id: '1', type: 'exercise', name: '', sets: 3, reps: 10 }])
  }, [])

  const addAerobicRun = useCallback(() => {
    const distList = categoryDistanceOptions[selectedCategory] ?? categoryDistanceOptions.LSD
    const durList = categoryDurationOptions[selectedCategory] ?? categoryDurationOptions.LSD
    setAerobicSegments(prev => [
      ...prev,
      { id: Date.now().toString(), type: 'run', distance: distList[0], duration: durList[0].value }
    ])
  }, [selectedCategory, categoryDistanceOptions, categoryDurationOptions])

  const addAerobicRest = useCallback(() => {
    setAerobicSegments(prev => {
      const lastRunIndex = prev.map((seg, i) => seg.type === 'run' ? i : -1).filter(i => i >= 0).pop() ?? -1
      const insertIndex = lastRunIndex >= 0 ? lastRunIndex + 1 : prev.length
      const newSegments = [...prev]
      newSegments.splice(insertIndex, 0, { id: Date.now().toString(), type: 'rest', duration: 60 })
      return newSegments
    })
  }, [])

  const removeAerobicSegment = useCallback((id: string) => {
    setAerobicSegments(prev => {
      if (prev.length > 1) {
        return prev.filter(seg => seg.id !== id)
      }
      return prev
    })
  }, [])

  const updateAerobicSegment = useCallback((id: string, updates: Partial<AerobicSegment>) => {
    setAerobicSegments(prev => 
      prev.map(seg => 
        seg.id === id ? { ...seg, ...updates } as AerobicSegment : seg
      )
    )
  }, [])

  const addExercise = useCallback(() => {
    setWorkoutItems(prev => [
      ...prev,
      { id: Date.now().toString(), type: 'exercise', name: '', sets: 3, reps: 10 }
    ])
  }, [])

  const addRest = useCallback(() => {
    setWorkoutItems(prev => {
      const lastExerciseIndex = prev.map((item, i) => item.type === 'exercise' ? i : -1).filter(i => i >= 0).pop() ?? -1
      const insertIndex = lastExerciseIndex >= 0 ? lastExerciseIndex + 1 : prev.length
      const newItems = [...prev]
      newItems.splice(insertIndex, 0, { id: Date.now().toString(), type: 'rest', duration: 60 })
      return newItems
    })
  }, [])

  const removeItem = useCallback((id: string) => {
    setWorkoutItems(prev => {
      if (prev.length > 1) {
        return prev.filter(item => item.id !== id)
      }
      return prev
    })
  }, [])

  const updateItem = useCallback((id: string, updates: Partial<WorkoutItem>) => {
    setWorkoutItems(prev =>
      prev.map(item => 
        item.id === id ? { ...item, ...updates } as WorkoutItem : item
      )
    )
  }, [])

  const handleLike = useCallback(async (workoutId: string) => {
    if (!user) return

    try {
      const isNowLiked = await toggleLike(workoutId, user.id)
      setWorkouts((prev) =>
        prev.map((w) =>
          w.id === workoutId
            ? { ...w, is_liked: isNowLiked, likes: isNowLiked ? w.likes + 1 : w.likes - 1 }
            : w
        )
      )
    } catch (error) {
      console.error('Like toggle failed:', error)
      alert("操作失敗，請稍後重試")
    }
  }, [user])

  const handleSaveTemplate = useCallback(async (workoutId: string) => {
    if (!user) return

    try {
      const isSaved = await saveWorkoutAsTemplate(workoutId, user.id)
      setWorkouts((prev) =>
        prev.map((w) =>
          w.id === workoutId ? { ...w, is_template: isSaved } : w
        )
      )
    } catch (error) {
      console.error('Template save failed:', error)
      alert("保存失敗，請稍後重試")
    }
  }, [user])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              FitSocial
            </span>
          </div>
          <div className="flex items-center gap-3">
            {profile && (
              <div className="flex items-center gap-2 bg-primary-50 px-3 py-1.5 rounded-full">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="font-bold text-primary-700">{profile.streak_count}天</span>
              </div>
            )}
            <button
              onClick={signOut}
              className="p-2 text-slate-400 hover:text-red-500 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto pb-20">
        <div className="px-4 py-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center">
                  <Flame className="w-5 h-5 text-white" />
                </div>
                <span className="text-slate-500 text-sm">連勝天數</span>
              </div>
              <p className="text-3xl font-bold text-slate-800">{profile?.streak_count ?? 0}</p>
              <p className="text-xs text-green-500 mt-1">比上週 +3</p>
            </div>

            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <span className="text-slate-500 text-sm">本週負荷</span>
              </div>
              <p className="text-3xl font-bold text-slate-800">85%</p>
              <div className="w-full h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full w-[85%]" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-primary-500 to-accent-500 rounded-3xl p-5 text-white">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-lg">快速紀錄</h3>
              <Trophy className="w-5 h-5" />
            </div>
            <p className="text-white/80 text-sm mb-4">3次點擊完成運動紀錄</p>
            <button
              onClick={() => setShowWorkoutModal(true)}
              className="w-full bg-white text-primary-600 font-bold py-3 px-6 rounded-2xl flex items-center justify-center gap-2 hover:bg-white/90 transition-all"
            >
              <Plus className="w-5 h-5" />
              開始紀錄
            </button>
          </div>
        </div>

        <div className="px-4">
          <h2 className="font-bold text-lg text-slate-800 mb-4">動態</h2>
          {isLoadingWorkouts ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
          ) : workouts.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center">
              <p className="text-slate-500">還沒有運動紀錄</p>
              <p className="text-slate-400 text-sm mt-2">成為第一個記錄的人！</p>
            </div>
          ) : (
            <div className="space-y-4">
              {workouts.map((workout) => (
                <div
                  key={workout.id}
                  className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center text-2xl">
                      {workout.profiles?.avatar_url || "🏃"}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-800">
                          {workout.profiles?.username || "未知用戶"}
                        </span>
                        <span className="text-xs text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
                          🔥 {workout.profiles?.streak_count || 0}
                        </span>
                        {(workout.details as { mood?: string })?.mood && (
                          <span className="text-xs text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                            {(workout.details as { mood?: string }).mood}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">
                        {new Date(workout.created_at).toLocaleTimeString("zh-TW", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        workout.type === "aerobic"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-purple-100 text-purple-600"
                      }`}
                    >
                      {workout.type === "aerobic" ? "🏃 有氧" : "💪 肌力"}
                    </span>
                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-sm">
                      {workout.category}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        workout.intensity === "easy"
                          ? "bg-green-100 text-green-600"
                          : workout.intensity === "moderate"
                          ? "bg-yellow-100 text-yellow-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {workout.intensity === "easy" ? "休閒" : workout.intensity === "moderate" ? "適中" : "激烈"}
                    </span>
                  </div>

                  {(() => {
                    const d = workout.details as {
                      segments?: Array<{ type: string; distance?: string; duration?: number; name?: string; sets?: number; reps?: number }>
                      mood?: string
                      description?: string
                    }

                    // ── 新格式：segments 陣列 ──
                    if (d?.segments) {
                      type AeroSeg = { type: 'run'; distance: string; duration: number } | { type: 'rest'; duration: number }
                      type StrSeg = { type: 'exercise'; name: string; sets: number; reps: number } | { type: 'rest'; duration: number }

                      function eqAero(a: AeroSeg, b: AeroSeg) {
                        if (a.type !== b.type) return false
                        if (a.type === 'run' && b.type === 'run') return a.distance === b.distance && a.duration === b.duration
                        if (a.type === 'rest' && b.type === 'rest') return a.duration === b.duration
                        return false
                      }
                      function eqStr(a: StrSeg, b: StrSeg) {
                        if (a.type !== b.type) return false
                        if (a.type === 'exercise' && b.type === 'exercise') return a.name === b.name && a.sets === b.sets && a.reps === b.reps
                        if (a.type === 'rest' && b.type === 'rest') return a.duration === b.duration
                        return false
                      }
                      function groupSegs<T>(segs: T[], eq: (a: T, b: T) => boolean) {
                        const gs: { pattern: T[]; count: number }[] = []
                        let i = 0
                        while (i < segs.length) {
                          let bw = 1, bc = 1
                          for (let w = 1; w <= Math.floor((segs.length - i) / 2); w++) {
                            const pat = segs.slice(i, i + w)
                            let c = 1, j = i + w
                            while (j + w <= segs.length && pat.every((s, k) => eq(s, segs[j + k]))) { c++; j += w }
                            if (c > 1 && w * c >= bw * bc) { bw = w; bc = c }
                          }
                          gs.push({ pattern: segs.slice(i, i + bw), count: bc })
                          i += bw * bc
                        }
                        return gs
                      }

                      if (workout.type === 'aerobic') {
                        const segs = d.segments as AeroSeg[]
                        const groups = groupSegs(segs, eqAero)
                        return (
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 mb-3">
                            <div className="space-y-2">
                              {groups.map((g, gi) => (
                                <div key={gi} className="flex items-start gap-2">
                                  <div className="flex-1 space-y-1">
                                    {g.pattern.map((seg, si) =>
                                      seg.type === 'run' ? (
                                        <div key={si} className="flex items-center justify-between bg-white/80 rounded-xl px-3 py-2">
                                          <div className="flex items-center gap-2">
                                            <Activity className="w-4 h-4 text-blue-500" />
                                            <span className="font-medium text-slate-700 text-sm">跑步 {seg.distance}</span>
                                          </div>
                                          <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs font-medium">{seg.duration}分</span>
                                        </div>
                                      ) : (
                                        <div key={si} className="flex items-center gap-2 bg-indigo-100/50 rounded-xl px-3 py-2">
                                          <Clock className="w-4 h-4 text-indigo-400" />
                                          <span className="text-sm text-indigo-600">
                                            休息 {(seg as { duration: number }).duration >= 60
                                              ? `${(seg as { duration: number }).duration / 60}分鐘`
                                              : `${(seg as { duration: number }).duration}秒`}
                                          </span>
                                        </div>
                                      )
                                    )}
                                  </div>
                                  {g.count > 1 && (
                                    <span className="mt-1 shrink-0 bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full self-center">×{g.count}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      } else {
                        const segs = d.segments as StrSeg[]
                        const groups = groupSegs(segs, eqStr)
                        return (
                          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 mb-3">
                            <div className="space-y-2">
                              {groups.map((g, gi) => (
                                <div key={gi} className="flex items-start gap-2">
                                  <div className="flex-1 space-y-1">
                                    {g.pattern.map((seg, si) =>
                                      seg.type === 'exercise' ? (
                                        <div key={si} className="flex items-center justify-between bg-white/80 rounded-xl px-3 py-2">
                                          <span className="font-medium text-slate-700 text-sm">{(seg as { name: string }).name}</span>
                                          <div className="flex items-center gap-2 text-xs">
                                            <span className="bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">{(seg as { sets: number }).sets}組</span>
                                            <span className="bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full">{(seg as { reps: number }).reps}下</span>
                                          </div>
                                        </div>
                                      ) : (
                                        <div key={si} className="flex items-center gap-2 text-blue-500 px-3 py-1">
                                          <Clock className="w-4 h-4" />
                                          <span className="text-sm">休息 {(seg as { duration: number }).duration}秒</span>
                                        </div>
                                      )
                                    )}
                                  </div>
                                  {g.count > 1 && (
                                    <span className="mt-1 shrink-0 bg-purple-500 text-white text-xs font-bold px-2 py-0.5 rounded-full self-center">×{g.count}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      }
                    }

                    // ── 舊格式：description 字串（向下相容）──
                    if (workout.type === 'aerobic') {
                      return (
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 mb-3">
                          <div className="space-y-1">
                            {d?.description?.split("・")[0]?.split(" → ").map((item, i) => {
                              const isRest = item.includes("休息")
                              if (isRest) {
                                return (
                                  <div key={i} className="flex items-center gap-2 bg-indigo-100/50 rounded-xl px-3 py-2">
                                    <Clock className="w-4 h-4 text-indigo-400" />
                                    <span className="text-sm text-indigo-600">休息 {item.match(/\d+/)?.[0]}秒</span>
                                  </div>
                                )
                              }
                              const parts = item.trim().split(/\s+/)
                              const distance = parts[0] || ""
                              const dur = item.match(/(\d+)分/)?.[1] || ""
                              return (
                                <div key={i} className="flex items-center justify-between bg-white/80 rounded-xl px-3 py-2">
                                  <div className="flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-blue-500" />
                                    <span className="font-medium text-slate-700 text-sm">跑步 {distance}</span>
                                  </div>
                                  {dur && <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs font-medium">{dur}分</span>}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    }
                    return (
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 mb-3">
                        <div className="space-y-1">
                          {d?.description?.split("・")[0]?.split(" → ").map((item, i) => {
                            const isRest = item.includes("休息")
                            const match = item.match(/(\S+)\s*(\d+)x(\d+)/)
                            return isRest ? (
                              <div key={i} className="flex items-center gap-2 text-blue-500 px-3 py-1">
                                <Clock className="w-4 h-4" />
                                <span className="text-sm">休息 {item.match(/\d+/)?.[0]}秒</span>
                              </div>
                            ) : match ? (
                              <div key={i} className="flex items-center justify-between bg-white/80 rounded-xl px-3 py-2">
                                <span className="font-medium text-slate-700 text-sm">{match[1]}</span>
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">{match[2]}組</span>
                                  <span className="bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full">{match[3]}下</span>
                                </div>
                              </div>
                            ) : null
                          })}
                        </div>
                      </div>
                    )
                  })()}

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <button
                      onClick={() => handleLike(workout.id)}
                      className={`flex items-center gap-1 transition-colors ${
                        workout.is_liked ? "text-pink-500" : "text-slate-400 hover:text-pink-500"
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${workout.is_liked ? "fill-pink-500" : ""}`} />
                      <span className="text-sm">{workout.likes}</span>
                    </button>
                    <button className="flex items-center gap-1 text-slate-400 hover:text-blue-500 transition-colors">
                      <MessageCircle className="w-5 h-5" />
                      <span className="text-sm">{workout.comment_count || 0}</span>
                    </button>
                    <button className="flex items-center gap-1 text-slate-400 hover:text-green-500 transition-colors">
                      <Share2 className="w-5 h-5" />
                      <span className="text-sm">{workout.shares}</span>
                    </button>
                    <button
                      onClick={() => handleSaveTemplate(workout.id)}
                      className="flex items-center gap-1 text-slate-400 hover:text-accent-500 transition-colors"
                    >
                      <Bookmark className={`w-5 h-5 ${workout.is_template ? "fill-accent-500 text-accent-500" : ""}`} />
                      <span className="text-sm">學習</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200">
        <div className="max-w-lg mx-auto flex justify-around py-3">
          {[
            { id: "home", icon: Home, label: "首頁" },
            { id: "search", icon: Search, label: "探索" },
            { id: "add", icon: Plus, label: "紀錄", primary: true },
            { id: "bell", icon: Bell, label: "通知" },
            { id: "profile", icon: User, label: "我的" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === "add") setShowWorkoutModal(true)
                else setActiveTab(item.id as typeof activeTab)
              }}
              className={`flex flex-col items-center gap-1 ${
                item.primary
                  ? "relative -mt-6"
                  : activeTab === item.id
                  ? "text-primary-500"
                  : "text-slate-400"
              }`}
            >
              {item.primary ? (
                <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Plus className="w-6 h-6 text-white" />
                </div>
              ) : (
                <item.icon className="w-6 h-6" />
              )}
              {!item.primary && <span className="text-xs">{item.label}</span>}
            </button>
          ))}
        </div>
      </nav>

      {showWorkoutModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="bg-white rounded-t-4xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-xl text-slate-800">記錄運動</h2>
              <button
                onClick={() => setShowWorkoutModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">運動類型</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setWorkoutType("aerobic")
                      setSelectedCategory("")
                    }}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      workoutType === "aerobic"
                        ? "border-primary-500 bg-primary-50"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <Activity className={`w-8 h-8 mx-auto mb-2 ${workoutType === "aerobic" ? "text-primary-500" : "text-slate-400"}`} />
                    <span className={`block font-medium ${workoutType === "aerobic" ? "text-primary-700" : "text-slate-600"}`}>
                      有氧
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setWorkoutType("strength")
                      setSelectedCategory("")
                    }}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      workoutType === "strength"
                        ? "border-accent-500 bg-accent-50"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <Dumbbell className={`w-8 h-8 mx-auto mb-2 ${workoutType === "strength" ? "text-accent-500" : "text-slate-400"}`} />
                    <span className={`block font-medium ${workoutType === "strength" ? "text-accent-700" : "text-slate-600"}`}>
                      肌力
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  {workoutType === "aerobic" ? "訓練類型" : "訓練部位"}
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-full transition-all ${
                        selectedCategory === cat
                          ? "bg-primary-500 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">強度</label>
                <div className="flex gap-2">
                  {(["easy", "moderate", "hard"] as Intensity[]).map((intensity) => (
                    <button
                      key={intensity}
                      onClick={() => setSelectedIntensity(intensity)}
                      className={`flex-1 py-3 rounded-2xl transition-all ${
                        selectedIntensity === intensity
                          ? intensity === "easy"
                            ? "bg-green-500 text-white"
                            : intensity === "moderate"
                            ? "bg-yellow-500 text-white"
                            : "bg-red-500 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {intensity === "easy" ? "🟢 休閒" : intensity === "moderate" ? "🟡 適中" : "🔴 激烈"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  {workoutType === "aerobic" ? "訓練流程" : "動作"}
                </label>
                {workoutType === "aerobic" ? (
                  <div className="space-y-3">
                    {aerobicSegments.map((seg, index) => (
                      <div key={seg.id}>
                        {seg.type === 'run' ? (
                          <div className="flex items-center gap-2 flex-wrap bg-blue-50 p-3 rounded-xl">
                            <span className="text-sm font-medium text-blue-600 w-6">#{index + 1}</span>
                            <div className="flex-1 flex items-center gap-2 flex-wrap">
                              <div className="flex flex-wrap gap-1">
                                {currentDistanceOptions.map((d) => (
                                  <button
                                    key={d}
                                    onClick={() => updateAerobicSegment(seg.id, { distance: d })}
                                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                                      seg.distance === d
                                        ? "bg-blue-500 text-white"
                                        : "bg-white text-blue-600 hover:bg-blue-100"
                                    }`}
                                  >
                                    {d}
                                  </button>
                                ))}
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {currentDurationOptions.map(({ value, label }) => (
                                  <button
                                    key={value}
                                    onClick={() => updateAerobicSegment(seg.id, { duration: value })}
                                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                                      seg.duration === value
                                        ? "bg-blue-500 text-white"
                                        : "bg-white text-blue-600 hover:bg-blue-100"
                                    }`}
                                  >
                                    {label}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <button
                              onClick={() => removeAerobicSegment(seg.id)}
                              className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-100 rounded-xl transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 bg-indigo-50 p-2 rounded-xl">
                            <Clock className="w-4 h-4 text-indigo-500 ml-2" />
                            <span className="text-sm text-indigo-600 font-medium">休息</span>
                            <div className="flex gap-1">
                              {restOptions.map((dur) => (
                                <button
                                  key={dur}
                                  onClick={() => updateAerobicSegment(seg.id, { duration: dur })}
                                  className={`px-3 py-1 rounded-lg text-sm transition-all ${
                                    seg.duration === dur
                                      ? "bg-indigo-500 text-white"
                                      : "bg-white text-indigo-600 hover:bg-indigo-100"
                                  }`}
                                >
                                  {dur}秒
                                </button>
                              ))}
                            </div>
                            <button
                              onClick={() => removeAerobicSegment(seg.id)}
                              className="ml-auto p-1 text-indigo-400 hover:text-indigo-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    <div className="flex gap-2">
                      <button
                        onClick={addAerobicRun}
                        className="flex-1 py-2 border-2 border-dashed border-blue-300 rounded-xl text-blue-500 hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                      >
                        <Activity className="w-4 h-4" />
                        下一段跑步
                      </button>
                      <button
                        onClick={addAerobicRest}
                        className="flex-1 py-2 border-2 border-dashed border-indigo-300 rounded-xl text-indigo-500 hover:border-indigo-500 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                      >
                        <Clock className="w-4 h-4" />
                        休息時間
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {workoutItems.map((item, index) => (
                      <div key={item.id}>
                        {item.type === 'exercise' ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-slate-400 w-6">{index + 1}</span>
                            <div className="flex-1 flex items-center gap-2 flex-wrap">
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => updateItem(item.id, { name: e.target.value })}
                                placeholder="動作名稱"
                                className="flex-1 min-w-[120px] px-4 py-2 rounded-xl border border-slate-200 focus:border-primary-500 outline-none"
                              />
                              <select
                                value={item.sets}
                                onChange={(e) => updateItem(item.id, { sets: Number(e.target.value) })}
                                className="px-3 py-2 rounded-xl border border-slate-200 bg-white"
                              >
                                {setsOptions.map((s) => (
                                  <option key={s} value={s}>{s}組</option>
                                ))}
                              </select>
                              <select
                                value={item.reps}
                                onChange={(e) => updateItem(item.id, { reps: Number(e.target.value) })}
                                className="px-3 py-2 rounded-xl border border-slate-200 bg-white"
                              >
                                {repsOptions.map((r) => (
                                  <option key={r} value={r}>{r}下</option>
                                ))}
                              </select>
                            </div>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 bg-blue-50 p-2 rounded-xl">
                            <Clock className="w-4 h-4 text-blue-500 ml-1" />
                            <span className="text-sm text-blue-600 font-medium">休息</span>
                            <div className="flex gap-1">
                              {restOptions.map((dur) => (
                                <button
                                  key={dur}
                                  onClick={() => updateItem(item.id, { duration: dur })}
                                  className={`px-3 py-1 rounded-lg text-sm transition-all ${
                                    item.duration === dur
                                      ? "bg-blue-500 text-white"
                                      : "bg-white text-blue-600 hover:bg-blue-100"
                                  }`}
                                >
                                  {dur}秒
                                </button>
                              ))}
                            </div>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="ml-auto p-1 text-blue-400 hover:text-blue-500"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    <div className="flex gap-2">
                      <button
                        onClick={addExercise}
                        className="flex-1 py-2 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-primary-500 hover:text-primary-500 transition-all flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        下一個動作
                      </button>
                      <button
                        onClick={addRest}
                        className="flex-1 py-2 border-2 border-dashed border-blue-300 rounded-xl text-blue-500 hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                      >
                        <Clock className="w-4 h-4" />
                        休息時間
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      {exercisePresets.map((preset) => (
                        <button
                          key={preset}
                          onClick={() => {
                            const emptyExercise = workoutItems.find(item => item.type === 'exercise' && !item.name)
                            if (emptyExercise) {
                              updateItem(emptyExercise.id, { name: preset })
                            } else {
                              setWorkoutItems(prev => [
                                ...prev,
                                { id: Date.now().toString(), type: 'exercise', name: preset, sets: 3, reps: 10 }
                              ])
                            }
                          }}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full text-sm transition-colors"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  感受一下 {
                    selectedIntensity === "easy" ? "🟢 休閒" : 
                    selectedIntensity === "moderate" ? "🟡 適中" : "🔴 激烈"
                  }
                </label>
                <div className="flex flex-wrap gap-2">
                  {moodBubbles[selectedIntensity].map((mood) => (
                    <button
                      key={mood.emoji}
                      onClick={() => setSelectedMood(mood.label)}
                      className={`px-4 py-3 rounded-2xl transition-all flex items-center gap-2 ${
                        selectedMood === mood.label
                          ? "bg-gradient-to-r from-primary-500 to-accent-500 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <span className="text-xl">{mood.emoji}</span>
                      <span className="text-sm font-medium">{mood.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleLogWorkout}
                disabled={!selectedCategory || !selectedMood || isSubmitting || (workoutType === "strength" && !workoutItems.some(item => item.type === 'exercise' && item.name))}
                className="w-full py-4 bg-gradient-to-r from-primary-500 to-accent-500 text-white font-bold rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    儲存中...
                  </>
                ) : (
                  "完成紀錄"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}