import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/database.types'
import { WorkoutType, Intensity } from '@/lib/supabase/types'

export type WorkoutLog = Database['public']['Tables']['workout_logs']['Row']
export type WorkoutLogInsert = Database['public']['Tables']['workout_logs']['Insert']

export type Profile = Database['public']['Tables']['profiles']['Row']

export interface WorkoutLogWithProfile extends WorkoutLog {
  profiles: Profile | null
  comment_count: number
  is_liked: boolean
}

/**
 * 延遲執行函數 - 避免並行請求衝突
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 序列化執行 Promise - 避免並行導致的 lock 衝突
 */
async function executeSequentially<T>(
  tasks: (() => Promise<T>)[],
  delayBetween: number = 10
): Promise<T[]> {
  const results: T[] = []
  for (const task of tasks) {
    results.push(await task())
    if (delayBetween > 0 && tasks.indexOf(task) < tasks.length - 1) {
      await delay(delayBetween)
    }
  }
  return results
}

/**
 * 取得運動日誌列表
 * 修復：序列化查詢以避免 auth lock 衝突
 */
export async function getWorkoutLogs(userId?: string, limit = 20) {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('workout_logs')
      .select(`
        *,
        profiles (*)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Failed to fetch workout logs:', error)
      throw error
    }

    if (!data) return []

    // ✅ 改進：序列化執行查詢，避免並行導致的 lock 衝突
    const logsWithMeta = await executeSequentially(
      data.map((log: WorkoutLog) => async () => {
        try {
          // 序列執行兩個查詢
          const commentResult = await supabase
            .from('comments')
            .select('id', { count: 'exact', head: true })
            .eq('workout_log_id', log.id)

          const likeResult = userId
            ? await supabase
                .from('likes')
                .select('id')
                .eq('workout_log_id', log.id)
                .eq('user_id', userId)
                .single()
            : { data: null, error: null }

          return {
            ...log,
            comment_count: commentResult.count || 0,
            is_liked: !!likeResult.data,
          } as WorkoutLogWithProfile
        } catch (err) {
          console.error(`Error loading metadata for workout ${log.id}:`, err)
          return {
            ...log,
            comment_count: 0,
            is_liked: false,
          } as WorkoutLogWithProfile
        }
      }),
      20 // 每個查詢之間延遲 20ms
    )

    return logsWithMeta
  } catch (error) {
    console.error('getWorkoutLogs error:', error)
    return []
  }
}

/**
 * 快速版本 - 只取得日誌，不取得 comments 和 likes
 * 用於快速載入的場景
 */
export async function getWorkoutLogsQuick(limit = 20) {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('workout_logs')
      .select(`
        *,
        profiles (*)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return (data || []).map((log: WorkoutLog) => ({
      ...log,
      comment_count: 0,
      is_liked: false,
    } as WorkoutLogWithProfile))
  } catch (error) {
    console.error('getWorkoutLogsQuick error:', error)
    return []
  }
}

/**
 * 創建運動紀錄
 */
export async function createWorkoutLog(
  userId: string,
  type: WorkoutType,
  category: string,
  intensity: Intensity,
  details: Record<string, unknown>,
  isTemplate = false
) {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('workout_logs')
      .insert({
        user_id: userId,
        type,
        category,
        intensity,
        details,
        is_template: isTemplate,
      })
      .select()
      .single()

    if (error) throw error

    // 建立紀錄後自動更新 streak_count
    await updateStreak(supabase, userId)

    return data
  } catch (error) {
    console.error('createWorkoutLog error:', error)
    throw error
  }
}

/**
 * 更新連勝天數：檢查昨天是否有運動，決定 +1 或重置為 1
 */
async function updateStreak(supabase: ReturnType<typeof createClient>, userId: string) {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    // 今天是否已有其他紀錄（避免同一天多次加）
    const { data: todayLogs } = await supabase
      .from('workout_logs')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', today.toISOString())
      .limit(2)

    // 若今天已有 2 筆以上（本次插入 + 至少 1 筆舊的），表示 streak 已計算過
    if (todayLogs && todayLogs.length >= 2) return

    // 昨天是否有紀錄
    const { data: yesterdayLogs } = await supabase
      .from('workout_logs')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', yesterday.toISOString())
      .lt('created_at', today.toISOString())
      .limit(1)

    const { data: profile } = await supabase
      .from('profiles')
      .select('streak_count')
      .eq('id', userId)
      .single()

    const currentStreak = profile?.streak_count ?? 0
    const newStreak = yesterdayLogs && yesterdayLogs.length > 0 ? currentStreak + 1 : 1

    await supabase
      .from('profiles')
      .update({ streak_count: newStreak })
      .eq('id', userId)
  } catch (err) {
    // streak 更新失敗不中斷主流程
    console.warn('updateStreak error:', err)
  }
}

/**
 * 切換按讚狀態
 */
export async function toggleLike(workoutLogId: string, userId: string) {
  const supabase = createClient()

  try {
    // 先查詢是否已按讚
    const { data: existing, error: queryError } = await supabase
      .from('likes')
      .select('id')
      .eq('workout_log_id', workoutLogId)
      .eq('user_id', userId)
      .single()

    if (queryError && queryError.code !== 'PGRST116') {
      throw queryError
    }

    if (existing) {
      // 已按讚，則取消按讚
      const { error: deleteError } = await supabase
        .from('likes')
        .delete()
        .eq('id', existing.id)

      if (deleteError) throw deleteError

      // 等待短暫時間後再更新計數，避免 lock 衝突
      await delay(10)
      
      const { error: rpcError } = await supabase.rpc('decrement_likes', { 
        workout_log_id: workoutLogId 
      })

      if (rpcError) console.error('decrement_likes error:', rpcError)
      
      return false
    } else {
      // 未按讚，則新增按讚
      const { error: insertError } = await supabase
        .from('likes')
        .insert({
          workout_log_id: workoutLogId,
          user_id: userId,
        })

      if (insertError) throw insertError

      // 等待短暫時間後再更新計數
      await delay(10)

      const { error: rpcError } = await supabase.rpc('increment_likes', { 
        workout_log_id: workoutLogId 
      })

      if (rpcError) console.error('increment_likes error:', rpcError)
      
      return true
    }
  } catch (error) {
    console.error('toggleLike error:', error)
    throw error
  }
}

/**
 * 保存課表為範本
 */
export async function saveWorkoutAsTemplate(workoutLogId: string, userId: string) {
  const supabase = createClient()

  try {
    const { data: existing, error: queryError } = await supabase
      .from('saved_programs')
      .select('id')
      .eq('workout_log_id', workoutLogId)
      .eq('user_id', userId)
      .single()

    if (queryError && queryError.code !== 'PGRST116') {
      throw queryError
    }

    if (existing) {
      // 已保存，則刪除
      const { error: deleteError } = await supabase
        .from('saved_programs')
        .delete()
        .eq('id', existing.id)

      if (deleteError) throw deleteError
      return false
    } else {
      // 未保存，則新增
      const { error: insertError } = await supabase
        .from('saved_programs')
        .insert({
          workout_log_id: workoutLogId,
          user_id: userId,
        })

      if (insertError) throw insertError
      return true
    }
  } catch (error) {
    console.error('saveWorkoutAsTemplate error:', error)
    throw error
  }
}

/**
 * 取得用戶的所有運動紀錄
 */
export async function getUserWorkouts(userId: string) {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  } catch (error) {
    console.error('getUserWorkouts error:', error)
    return []
  }
}

/**
 * 取得用戶保存的課表範本
 */
export async function getSavedTemplates(userId: string) {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('saved_programs')
      .select(`
        *,
        workout_logs (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  } catch (error) {
    console.error('getSavedTemplates error:', error)
    return []
  }
}

/**
 * 取得用戶的連勝天數
 */
export async function getUserStreak(userId: string): Promise<number> {
  const supabase = createClient()

  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('streak_count')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('getUserStreak error:', error)
      return 0
    }

    return profile?.streak_count ?? 0
  } catch (error) {
    console.error('getUserStreak exception:', error)
    return 0
  }
}