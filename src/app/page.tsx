"use client"

import { useState, useEffect, useCallback } from "react"
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
  getWorkoutLogs,
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
  type WorkoutItem = 
    | { id: string; type: 'exercise'; name: string; sets: number; reps: number }
    | { id: string; type: 'rest'; duration: number }

  const [workoutItems, setWorkoutItems] = useState<WorkoutItem[]>([
    { id: '1', type: 'exercise', name: '', sets: 3, reps: 10 }
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [workouts, setWorkouts] = useState<WorkoutLogWithProfile[]>([])
  const [isLoadingWorkouts, setIsLoadingWorkouts] = useState(true)

  const moodBubbles: Record<Intensity, { emoji: string; label: string }[]> = {
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
  }

  const distanceOptions = ["1km", "3km", "5km", "10km", "半馬", "全馬"]
  const durationOptions = [15, 30, 45, 60, 90]
  const setsOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  const repsOptions = [5, 8, 10, 12, 15, 20]
  const restOptions = [30, 60, 90, 120]

  const exercisePresets = ["臥推", "深蹲", "硬舉", "肩推", "划船", "二頭", "三頭", "腹肌", "小腿", "核心"]

  const categories = workoutType === "aerobic"
    ? ["LSD", "间歇", "配速跑"]
    : ["胸部", "背部", "腿部", "肩部", "手臂"]

  const loadWorkouts = useCallback(async () => {
    if (!user) return
    setIsLoadingWorkouts(true)
    try {
      const data = await getWorkoutLogs(user.id)
      setWorkouts(data)
    } catch (error) {
      console.error("Failed to load workouts:", error)
    } finally {
      setIsLoadingWorkouts(false)
    }
  }, [user])

  useEffect(() => {
    loadWorkouts()
  }, [loadWorkouts])

  const handleLogWorkout = async () => {
    if (!user || !selectedCategory || !selectedMood) return

    setIsSubmitting(true)
    try {
      let description = selectedMood
      if (workoutType === "aerobic") {
        description = `${selectedDistance || "一般"}・${selectedDuration}分鐘・${selectedMood}`
      } else {
        const parts: string[] = []
        workoutItems.forEach((item) => {
          if (item.type === 'exercise' && item.name) {
            parts.push(`${item.name} ${item.sets}x${item.reps}`)
          } else if (item.type === 'rest') {
            parts.push(`休息 ${item.duration}秒`)
          }
        })
        description = `${parts.join("・")}・${selectedMood}`
      }

      const details = { description }

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
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setSelectedCategory("")
    setSelectedMood("")
    setSelectedDistance("")
    setSelectedDuration(30)
    setWorkoutItems([{ id: '1', type: 'exercise', name: '', sets: 3, reps: 10 }])
  }

  const addExercise = () => {
    setWorkoutItems([
      ...workoutItems,
      { id: Date.now().toString(), type: 'exercise', name: '', sets: 3, reps: 10 }
    ])
  }

  const addRest = () => {
    const lastExerciseIndex = workoutItems.map((item, i) => item.type === 'exercise' ? i : -1).filter(i => i >= 0).pop() ?? -1
    const insertIndex = lastExerciseIndex >= 0 ? lastExerciseIndex + 1 : workoutItems.length
    const newItems = [...workoutItems]
    newItems.splice(insertIndex, 0, { id: Date.now().toString(), type: 'rest', duration: 60 })
    setWorkoutItems(newItems)
  }

  const removeItem = (id: string) => {
    if (workoutItems.length > 1) {
      setWorkoutItems(workoutItems.filter(item => item.id !== id))
    }
  }

  const updateItem = (id: string, updates: Partial<WorkoutItem>) => {
    setWorkoutItems(workoutItems.map(item => 
      item.id === id ? { ...item, ...updates } as WorkoutItem : item
    ))
  }

  const handleLike = async (workoutId: string) => {
    if (!user) return

    const isNowLiked = await toggleLike(workoutId, user.id)
    setWorkouts((prev) =>
      prev.map((w) =>
        w.id === workoutId
          ? { ...w, is_liked: isNowLiked, likes: isNowLiked ? w.likes + 1 : w.likes - 1 }
          : w
      )
    )
  }

  const handleSaveTemplate = async (workoutId: string) => {
    if (!user) return

    const isSaved = await saveWorkoutAsTemplate(workoutId, user.id)
    setWorkouts((prev) =>
      prev.map((w) =>
        w.id === workoutId ? { ...w, is_template: isSaved } : w
      )
    )
  }

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
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">
                          {workout.profiles?.username || "未知用戶"}
                        </span>
                        <span className="text-xs text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
                          🔥 {workout.profiles?.streak_count || 0}
                        </span>
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

                  <p className="text-slate-700 mb-4">
                    {(workout.details as { description?: string })?.description || ""}
                  </p>

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
                  {workoutType === "aerobic" ? "距離" : "動作"}
                </label>
                {workoutType === "aerobic" ? (
                  <div className="flex flex-wrap gap-2">
                    {distanceOptions.map((dist) => (
                      <button
                        key={dist}
                        onClick={() => setSelectedDistance(dist)}
                        className={`px-4 py-2 rounded-full transition-all ${
                          selectedDistance === dist
                            ? "bg-primary-500 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {dist}
                      </button>
                    ))}
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
                              setWorkoutItems([
                                ...workoutItems,
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

              {workoutType === "aerobic" && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">時間</label>
                  <div className="flex gap-2">
                    {durationOptions.map((dur) => (
                      <button
                        key={dur}
                        onClick={() => setSelectedDuration(dur)}
                        className={`flex-1 py-3 rounded-xl transition-all ${
                          selectedDuration === dur
                            ? "bg-primary-500 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {dur}分
                      </button>
                    ))}
                  </div>
                </div>
              )}

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
