export type WorkoutType = 'aerobic' | 'strength'
export type Intensity = 'easy' | 'moderate' | 'hard'

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          avatar_url: string | null
          following: string[]
          streak_count: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      workout_logs: {
        Row: {
          id: string
          user_id: string
          type: WorkoutType
          category: string
          intensity: Intensity
          details: Record<string, unknown>
          is_template: boolean
          likes: number
          shares: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['workout_logs']['Row'], 'id' | 'created_at' | 'likes' | 'shares'>
        Update: Partial<Database['public']['Tables']['workout_logs']['Insert']>
      }
      saved_programs: {
        Row: {
          id: string
          user_id: string
          workout_log_id: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['saved_programs']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['saved_programs']['Insert']>
      }
      comments: {
        Row: {
          id: string
          workout_log_id: string
          user_id: string
          content: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['comments']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['comments']['Insert']>
      }
      likes: {
        Row: {
          id: string
          workout_log_id: string
          user_id: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['likes']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['likes']['Insert']>
      }
    }
  }
}

export type WorkoutLogWithUser = Database['public']['Tables']['workout_logs']['Row'] & {
  users: Database['public']['Tables']['users']['Row']
  comment_count?: number
  is_liked?: boolean
}
