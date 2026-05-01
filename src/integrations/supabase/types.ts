export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      okr_checkin_schedules: {
        Row: {
          created_at: string
          frequency: string
          id: string
          last_generated_at: string | null
          next_due_date: string | null
          objective_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          frequency?: string
          id: string
          last_generated_at?: string | null
          next_due_date?: string | null
          objective_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          frequency?: string
          id?: string
          last_generated_at?: string | null
          next_due_date?: string | null
          objective_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      okr_checkins: {
        Row: {
          author_name: string
          author_user_id: string | null
          blockers: Json
          checkin_date: string
          comment: string
          confidence: string
          created_at: string
          id: string
          initiative_snapshots: Json
          insight: string
          kr_id: string | null
          leader_comment: string
          next_commitments: Json
          objective_id: string
          progress_auto: number
          progress_manual: number
          score_auto: number
          score_manual: number | null
          status: string
          tenant_id: string
          trend: string
          updated_at: string
        }
        Insert: {
          author_name: string
          author_user_id?: string | null
          blockers?: Json
          checkin_date?: string
          comment?: string
          confidence?: string
          created_at?: string
          id: string
          initiative_snapshots?: Json
          insight?: string
          kr_id?: string | null
          leader_comment?: string
          next_commitments?: Json
          objective_id: string
          progress_auto?: number
          progress_manual?: number
          score_auto?: number
          score_manual?: number | null
          status?: string
          tenant_id: string
          trend?: string
          updated_at?: string
        }
        Update: {
          author_name?: string
          author_user_id?: string | null
          blockers?: Json
          checkin_date?: string
          comment?: string
          confidence?: string
          created_at?: string
          id?: string
          initiative_snapshots?: Json
          insight?: string
          kr_id?: string | null
          leader_comment?: string
          next_commitments?: Json
          objective_id?: string
          progress_auto?: number
          progress_manual?: number
          score_auto?: number
          score_manual?: number | null
          status?: string
          tenant_id?: string
          trend?: string
          updated_at?: string
        }
        Relationships: []
      }
      okr_initiatives: {
        Row: {
          created_at: string
          description: string
          end_date: string | null
          id: string
          kr_id: string
          objective_id: string | null
          progress: number
          responsible: string
          start_date: string | null
          status: string
          tasks: Json
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          end_date?: string | null
          id: string
          kr_id: string
          objective_id?: string | null
          progress?: number
          responsible: string
          start_date?: string | null
          status?: string
          tasks?: Json
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          end_date?: string | null
          id?: string
          kr_id?: string
          objective_id?: string | null
          progress?: number
          responsible?: string
          start_date?: string | null
          status?: string
          tasks?: Json
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      okr_kr_reviews: {
        Row: {
          ai_review: Json
          blocked: boolean
          created_at: string
          id: string
          kr_id: string
          level: string
          score: number
          smart_achievable: number
          smart_measurable: number
          smart_relevant: number
          smart_specific: number
          smart_timebound: number
          source: string
          user_id: string
        }
        Insert: {
          ai_review: Json
          blocked: boolean
          created_at?: string
          id?: string
          kr_id: string
          level: string
          score: number
          smart_achievable: number
          smart_measurable: number
          smart_relevant: number
          smart_specific: number
          smart_timebound: number
          source: string
          user_id: string
        }
        Update: {
          ai_review?: Json
          blocked?: boolean
          created_at?: string
          id?: string
          kr_id?: string
          level?: string
          score?: number
          smart_achievable?: number
          smart_measurable?: number
          smart_relevant?: number
          smart_specific?: number
          smart_timebound?: number
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      okr_objectives: {
        Row: {
          area: string
          contributors: string[]
          created_at: string
          description: string
          id: string
          key_results: Json
          level: string
          owner: string
          parent_id: string | null
          progress: number
          quarter: string
          status: string
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          area: string
          contributors?: string[]
          created_at?: string
          description?: string
          id: string
          key_results?: Json
          level?: string
          owner: string
          parent_id?: string | null
          progress?: number
          quarter: string
          status?: string
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          area?: string
          contributors?: string[]
          created_at?: string
          description?: string
          id?: string
          key_results?: Json
          level?: string
          owner?: string
          parent_id?: string | null
          progress?: number
          quarter?: string
          status?: string
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          area: string
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          role: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          area?: string
          created_at?: string
          email?: string | null
          id: string
          name: string
          phone?: string | null
          role?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          area?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          role?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      generate_due_checkins: { Args: never; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _tenant_id: string
          _user_id: string
        }
        Returns: boolean
      }
      is_tenant_admin: { Args: { _tenant_id: string }; Returns: boolean }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "member"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "member"],
    },
  },
} as const
