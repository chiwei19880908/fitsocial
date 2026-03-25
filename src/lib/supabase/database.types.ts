export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          avatar_url: string | null
          following: string[]
          streak_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          avatar_url?: string | null
          following?: string[]
          streak_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          avatar_url?: string | null
          following?: string[]
          streak_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey'
            columns: ['id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      workout_logs: {
        Row: {
          id: string
          user_id: string
          type: 'aerobic' | 'strength'
          category: string
          intensity: 'easy' | 'moderate' | 'hard'
          details: Json
          is_template: boolean
          likes: number
          shares: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'aerobic' | 'strength'
          category: string
          intensity: 'easy' | 'moderate' | 'hard'
          details: Json
          is_template?: boolean
          likes?: number
          shares?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'aerobic' | 'strength'
          category?: string
          intensity?: 'easy' | 'moderate' | 'hard'
          details?: Json
          is_template?: boolean
          likes?: number
          shares?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'workout_logs_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      saved_programs: {
        Row: {
          id: string
          user_id: string
          workout_log_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          workout_log_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          workout_log_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'saved_programs_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'saved_programs_workout_log_id_fkey'
            columns: ['workout_log_id']
            isOneToOne: false
            referencedRelation: 'workout_logs'
            referencedColumns: ['id']
          }
        ]
      }
      comments: {
        Row: {
          id: string
          workout_log_id: string
          user_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          workout_log_id: string
          user_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          workout_log_id?: string
          user_id?: string
          content?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'comments_workout_log_id_fkey'
            columns: ['workout_log_id']
            isOneToOne: false
            referencedRelation: 'workout_logs'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'comments_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      likes: {
        Row: {
          id: string
          workout_log_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          workout_log_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          workout_log_id?: string
          user_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'likes_workout_log_id_fkey'
            columns: ['workout_log_id']
            isOneToOne: false
            referencedRelation: 'workout_logs'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'likes_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_likes: {
        Args: { workout_log_id: string }
        Returns: undefined
      }
      decrement_likes: {
        Args: { workout_log_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database['public']['Tables'] & Database['public']['Views'])
    | { schema: keyof Database }
    | never,
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database['public']['Tables'] &
      Database['public']['Views'])
  ? (Database['public']['Tables'] &
      Database['public']['Views'])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database['public']['Tables']
    | { schema: keyof Database }
    | never,
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database['public']['Tables']
  ? Database['public']['Tables'][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database['public']['Tables']
    | { schema: keyof Database }
    | never,
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database['public']['Tables']
  ? Database['public']['Tables'][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never
