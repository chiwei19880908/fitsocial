"use client";

import { useState } from "react";
import {
  Activity,
  Dumbbell,
  Heart,
  Users,
  TrendingUp,
  Flame,
  Trophy,
  Plus,
  ChevronRight,
  Target,
  Zap,
  Timer,
  Play,
  Bookmark,
  MessageCircle,
  Share2,
  Home,
  Search,
  Bell,
  User,
} from "lucide-react";

type WorkoutType = "aerobic" | "strength";
type Intensity = "easy" | "moderate" | "hard";
type AerobicCategory = "LSD" | "间歇" | "配速跑";
type StrengthCategory = "胸部" | "背部" | "腿部" | "肩部" | "手臂";

interface WorkoutLog {
  id: number;
  type: WorkoutType;
  category: string;
  intensity: Intensity;
  details: string;
  likes: number;
  comments: number;
  shares: number;
  timestamp: Date;
  user: {
    name: string;
    avatar: string;
    streak: number;
  };
}

const mockWorkouts: WorkoutLog[] = [
  {
    id: 1,
    type: "aerobic",
    category: "LSD",
    intensity: "easy",
    details: "10公里，配速5:30/km",
    likes: 24,
    comments: 5,
    shares: 2,
    timestamp: new Date(Date.now() - 3600000),
    user: { name: "小明", avatar: "🎾", streak: 15 },
  },
  {
    id: 2,
    type: "strength",
    category: "胸部",
    intensity: "hard",
    details: "臥推 4x8啞鈴、飛鳥 3x12、伏地挺身 3x15",
    likes: 45,
    comments: 12,
    shares: 6,
    timestamp: new Date(Date.now() - 7200000),
    user: { name: "阿偉", avatar: "⚽", streak: 30 },
  },
  {
    id: 3,
    type: "aerobic",
    category: "间歇",
    intensity: "hard",
    details: "400m x 8組，休息90秒",
    likes: 18,
    comments: 3,
    shares: 1,
    timestamp: new Date(Date.now() - 14400000),
    user: { name: "跑步小琳", avatar: "🏃‍♀️", streak: 7 },
  },
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"home" | "search" | "add" | "bell" | "profile">("home");
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [workoutType, setWorkoutType] = useState<WorkoutType>("aerobic");
  const [selectedIntensity, setSelectedIntensity] = useState<Intensity>("moderate");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [workoutDetails, setWorkoutDetails] = useState("");
  const [currentStreak] = useState(12);
  const [weeklyLoad] = useState(85);

  const categories = workoutType === "aerobic"
    ? ["LSD", "间歇", "配速跑"]
    : ["胸部", "背部", "腿部", "肩部", "手臂"];

  const handleLogWorkout = () => {
    console.log({ workoutType, selectedCategory, selectedIntensity, workoutDetails });
    setShowWorkoutModal(false);
    setWorkoutDetails("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
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
          <div className="flex items-center gap-2 bg-primary-50 px-3 py-1.5 rounded-full">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="font-bold text-primary-700">{currentStreak}天</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto pb-20">
        {/* Stats Cards */}
        <div className="px-4 py-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center">
                  <Flame className="w-5 h-5 text-white" />
                </div>
                <span className="text-slate-500 text-sm">連勝天數</span>
              </div>
              <p className="text-3xl font-bold text-slate-800">{currentStreak}</p>
              <p className="text-xs text-green-500 mt-1">比上週 +3</p>
            </div>

            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <span className="text-slate-500 text-sm">本週負荷</span>
              </div>
              <p className="text-3xl font-bold text-slate-800">{weeklyLoad}%</p>
              <div className="w-full h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all"
                  style={{ width: `${weeklyLoad}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Actions */}
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

        {/* Workout Feed */}
        <div className="px-4">
          <h2 className="font-bold text-lg text-slate-800 mb-4">動態</h2>
          <div className="space-y-4">
            {mockWorkouts.map((workout) => (
              <div
                key={workout.id}
                className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center text-2xl">
                    {workout.user.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{workout.user.name}</span>
                      <span className="text-xs text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
                        🔥 {workout.user.streak}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {workout.timestamp.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })}
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

                <p className="text-slate-700 mb-4">{workout.details}</p>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <button className="flex items-center gap-1 text-slate-400 hover:text-pink-500 transition-colors">
                    <Heart className="w-5 h-5" />
                    <span className="text-sm">{workout.likes}</span>
                  </button>
                  <button className="flex items-center gap-1 text-slate-400 hover:text-blue-500 transition-colors">
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm">{workout.comments}</span>
                  </button>
                  <button className="flex items-center gap-1 text-slate-400 hover:text-green-500 transition-colors">
                    <Share2 className="w-5 h-5" />
                    <span className="text-sm">{workout.shares}</span>
                  </button>
                  <button className="flex items-center gap-1 text-slate-400 hover:text-accent-500 transition-colors">
                    <Bookmark className="w-5 h-5" />
                    <span className="text-sm">學習</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
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
                if (item.id === "add") setShowWorkoutModal(true);
                else setActiveTab(item.id as typeof activeTab);
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

      {/* Workout Modal */}
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
              {/* Workout Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">運動類型</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setWorkoutType("aerobic");
                      setSelectedCategory("");
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
                      setWorkoutType("strength");
                      setSelectedCategory("");
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

              {/* Category */}
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

              {/* Intensity */}
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

              {/* Details */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  {workoutType === "aerobic" ? "距離與時間" : "動作細節"}
                </label>
                <textarea
                  value={workoutDetails}
                  onChange={(e) => setWorkoutDetails(e.target.value)}
                  placeholder={
                    workoutType === "aerobic"
                      ? "例如：5公里，30分鐘"
                      : "例如：臥推 4x8、深蹲 3x10"
                  }
                  className="w-full h-24 p-4 rounded-2xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none resize-none"
                />
              </div>

              {/* Quick Emojis */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">心情（選填）</label>
                <div className="flex gap-3">
                  {["💪", "🔥", "😊", "😓", "🥱", "✨"].map((emoji) => (
                    <button
                      key={emoji}
                      className="w-12 h-12 rounded-full bg-slate-100 hover:bg-slate-200 text-2xl transition-all"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleLogWorkout}
                disabled={!selectedCategory || !workoutDetails}
                className="w-full py-4 bg-gradient-to-r from-primary-500 to-accent-500 text-white font-bold rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all"
              >
                完成紀錄
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
