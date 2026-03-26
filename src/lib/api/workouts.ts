import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/database.types'
import { WorkoutType, Intensity } from '@/lib/supabase/types'

export type WorkoutLog = Database['public']['Tables']['workout_logs']['Row']
export type WorkoutLogInsert = Database['public']['Tables']['workout_logs']['Insert']

export type Profile = Database['public']['Tables']['profiles']['Row']

export interface WorkoutLogWithProfile extends WorkoutLog {
  profiles: Profile
  comment_count: number
  is_liked: boolean
}

export async function getWorkoutLogs(userId?: string, limit = 20) {
  const supabase = createClient()

  let query = supabase
    .from('workout_logs')
    .select(`
      *,
      profiles (*)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  const { data, error } = await query

  if (error) throw error

  if (!data) return []

  const logsWithMeta = await Promise.all(
    data.map(async (log: WorkoutLog) => {
      const [commentCount, likeStatus] = await Promise.all([
        supabase
          .from('comments')
          .select('id', { count: 'exact', head: true })
          .eq('workout_log_id', log.id),
        userId
          ? supabase
              .from('likes')
              .select('id')
              .eq('workout_log_id', log.id)
              .eq('user_id', userId)
              .single()
          : Promise.resolve({ data: null }),
      ])

      return {
        ...log,
        comment_count: commentCount.count || 0,
        is_liked: !!likeStatus.data,
      }
    })
  )

  return logsWithMeta as WorkoutLogWithProfile[]
}

export async function createWorkoutLog(
  userId: string,
  type: WorkoutType,
  category: string,
  intensity: Intensity,
  details: Record<string, unknown>,
  isTemplate = false
) {
  const supabase = createClient()

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
  return data
}

export async function toggleLike(workoutLogId: string, userId: string) {
  const supabase = createClient()

  const { data: existing } = await supabase
    .from('likes')
    .select('id')
    .eq('workout_log_id', workoutLogId)
    .eq('user_id', userId)
    .single()

  if (existing) {
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('id', existing.id)

    if (error) throw error

    await supabase.rpc('decrement_likes', { workout_log_id: workoutLogId })
    return false
  } else {
    const { error } = await supabase.from('likes').insert({
      workout_log_id: workoutLogId,
      user_id: userId,
    })

    if (error) throw error

    await supabase.rpc('increment_likes', { workout_log_id: workoutLogId })
    return true
  }
}

export async function saveWorkoutAsTemplate(workoutLogId: string, userId: string) {
  const supabase = createClient()

  const { data: existing } = await supabase
    .from('saved_programs')
    .select('id')
    .eq('workout_log_id', workoutLogId)
    .eq('user_id', userId)
    .single()

  if (existing) {
    await supabase.from('saved_programs').delete().eq('id', existing.id)
    return false
  }

  const { error } = await supabase.from('saved_programs').insert({
    workout_log_id: workoutLogId,
    user_id: userId,
  })

  if (error) throw error
  return true
}

export async function getUserWorkouts(userId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('workout_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getSavedTemplates(userId: string) {
  const supabase = createClient()

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
}

export async function getUserStreak(userId: string): Promise<number> {
  const supabase = createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('streak_count')
    .eq('id', userId)
    .single()

  return profile?.streak_count ?? 0
}
