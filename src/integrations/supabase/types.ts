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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      billing_orders: {
        Row: {
          applied_at: string
          order_id: string
          summary: Json
          user_id: string
        }
        Insert: {
          applied_at?: string
          order_id: string
          summary?: Json
          user_id: string
        }
        Update: {
          applied_at?: string
          order_id?: string
          summary?: Json
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          author_email: string | null
          author_name: string
          created_at: string | null
          event_id: string
          id: string
          is_organiser: boolean | null
          pinned: boolean | null
          text: string
        }
        Insert: {
          author_email?: string | null
          author_name: string
          created_at?: string | null
          event_id: string
          id?: string
          is_organiser?: boolean | null
          pinned?: boolean | null
          text: string
        }
        Update: {
          author_email?: string | null
          author_name?: string
          created_at?: string | null
          event_id?: string
          id?: string
          is_organiser?: boolean | null
          pinned?: boolean | null
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_connections: {
        Row: {
          created_at: string
          external_account_id: string
          id: string
          last_error: string | null
          last_success_at: string | null
          provider: string
          status: string
          token_ciphertext: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          external_account_id: string
          id?: string
          last_error?: string | null
          last_success_at?: string | null
          provider: string
          status?: string
          token_ciphertext: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          external_account_id?: string
          id?: string
          last_error?: string | null
          last_success_at?: string | null
          provider?: string
          status?: string
          token_ciphertext?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      crm_sync_log: {
        Row: {
          created_at: string
          error: string | null
          event_id: string | null
          id: string
          provider: string
          response_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          event_id?: string | null
          id?: string
          provider: string
          response_id?: string | null
          status: string
          user_id: string
        }
        Update: {
          created_at?: string
          error?: string | null
          event_id?: string | null
          id?: string
          provider?: string
          response_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      embed_events: {
        Row: {
          created_at: string
          embed_id: string
          id: number
          kind: string
        }
        Insert: {
          created_at?: string
          embed_id: string
          id?: number
          kind: string
        }
        Update: {
          created_at?: string
          embed_id?: string
          id?: number
          kind?: string
        }
        Relationships: [
          {
            foreignKeyName: "embed_events_embed_id_fkey"
            columns: ["embed_id"]
            isOneToOne: false
            referencedRelation: "embed_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      embed_tokens: {
        Row: {
          created_at: string
          event_id: string
          expires_at: string | null
          id: string
          owner_id: string
          revoked_at: string | null
        }
        Insert: {
          created_at?: string
          event_id: string
          expires_at?: string | null
          id?: string
          owner_id: string
          revoked_at?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string
          expires_at?: string | null
          id?: string
          owner_id?: string
          revoked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "embed_tokens_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_credit_packs: {
        Row: {
          events_total: number
          events_used: number
          expires_at: string
          id: string
          order_id: string
          purchased_at: string
          user_id: string
        }
        Insert: {
          events_total: number
          events_used?: number
          expires_at: string
          id?: string
          order_id: string
          purchased_at?: string
          user_id: string
        }
        Update: {
          events_total?: number
          events_used?: number
          expires_at?: string
          id?: string
          order_id?: string
          purchased_at?: string
          user_id?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          closed_at: string | null
          confirmed_at: string | null
          confirmed_custom_date: string | null
          confirmed_custom_end: string | null
          confirmed_custom_start: string | null
          confirmed_slot_id: string | null
          created_at: string | null
          deadline: string
          description: string | null
          id: string
          location: string | null
          minimum_count: number | null
          owner_id: string
          participation_mode: string
          reminder_sent_at: string | null
          status: string
          title: string
          token: string
        }
        Insert: {
          closed_at?: string | null
          confirmed_at?: string | null
          confirmed_custom_date?: string | null
          confirmed_custom_end?: string | null
          confirmed_custom_start?: string | null
          confirmed_slot_id?: string | null
          created_at?: string | null
          deadline: string
          description?: string | null
          id?: string
          location?: string | null
          minimum_count?: number | null
          owner_id: string
          participation_mode: string
          reminder_sent_at?: string | null
          status?: string
          title: string
          token: string
        }
        Update: {
          closed_at?: string | null
          confirmed_at?: string | null
          confirmed_custom_date?: string | null
          confirmed_custom_end?: string | null
          confirmed_custom_start?: string | null
          confirmed_slot_id?: string | null
          created_at?: string | null
          deadline?: string
          description?: string | null
          id?: string
          location?: string | null
          minimum_count?: number | null
          owner_id?: string
          participation_mode?: string
          reminder_sent_at?: string | null
          status?: string
          title?: string
          token?: string
        }
        Relationships: []
      }
      limit_warnings: {
        Row: {
          created_at: string
          event_id: string
          id: number
          kind: string
          period: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id?: string
          id?: number
          kind: string
          period?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: number
          kind?: string
          period?: string
          user_id?: string
        }
        Relationships: []
      }
      named_participants: {
        Row: {
          avatar_url: string | null
          email: string
          event_id: string
          first_name: string
          id: string
          last_name: string
        }
        Insert: {
          avatar_url?: string | null
          email: string
          event_id: string
          first_name: string
          id: string
          last_name: string
        }
        Update: {
          avatar_url?: string | null
          email?: string
          event_id?: string
          first_name?: string
          id?: string
          last_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "named_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      overage_invoices: {
        Row: {
          amount: number
          blocks: number
          created_at: string
          error: string | null
          event_id: string
          hl_invoice_id: string | null
          participants: number
          status: string
          title: string
          user_id: string
        }
        Insert: {
          amount: number
          blocks: number
          created_at?: string
          error?: string | null
          event_id: string
          hl_invoice_id?: string | null
          participants: number
          status?: string
          title?: string
          user_id: string
        }
        Update: {
          amount?: number
          blocks?: number
          created_at?: string
          error?: string | null
          event_id?: string
          hl_invoice_id?: string | null
          participants?: number
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      participant_responses: {
        Row: {
          avatar_url: string | null
          consent_recorded_at: string | null
          consent_version: string | null
          edit_token_hash: string | null
          email: string
          event_id: string
          first_name: string
          id: string
          klokk_marketing_consent: boolean
          last_name: string
          notes: string | null
          organiser_marketing_consent: boolean
          phone: string | null
          slot_ids: string[] | null
          submitted_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          consent_recorded_at?: string | null
          consent_version?: string | null
          edit_token_hash?: string | null
          email: string
          event_id: string
          first_name: string
          id?: string
          klokk_marketing_consent?: boolean
          last_name: string
          notes?: string | null
          organiser_marketing_consent?: boolean
          phone?: string | null
          slot_ids?: string[] | null
          submitted_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          consent_recorded_at?: string | null
          consent_version?: string | null
          edit_token_hash?: string | null
          email?: string
          event_id?: string
          first_name?: string
          id?: string
          klokk_marketing_consent?: boolean
          last_name?: string
          notes?: string | null
          organiser_marketing_consent?: boolean
          phone?: string | null
          slot_ids?: string[] | null
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "participant_responses_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          billing_interval: string | null
          billing_status: string
          created_at: string | null
          email: string | null
          email_verified: boolean | null
          embed_settings: Json | null
          events_created: number
          extra_seats: number
          first_name: string | null
          id: string
          last_name: string | null
          marketing_consent: boolean
          marketing_consent_at: string | null
          marketing_consent_version: string | null
          notification_prefs: Json | null
          plan: string | null
          plan_renews_at: string | null
          sms_auto_top_up: boolean | null
          sms_credits: number | null
          sms_low_balance_threshold: number | null
        }
        Insert: {
          avatar_url?: string | null
          billing_interval?: string | null
          billing_status?: string
          created_at?: string | null
          email?: string | null
          email_verified?: boolean | null
          embed_settings?: Json | null
          events_created?: number
          extra_seats?: number
          first_name?: string | null
          id: string
          last_name?: string | null
          marketing_consent?: boolean
          marketing_consent_at?: string | null
          marketing_consent_version?: string | null
          notification_prefs?: Json | null
          plan?: string | null
          plan_renews_at?: string | null
          sms_auto_top_up?: boolean | null
          sms_credits?: number | null
          sms_low_balance_threshold?: number | null
        }
        Update: {
          avatar_url?: string | null
          billing_interval?: string | null
          billing_status?: string
          created_at?: string | null
          email?: string | null
          email_verified?: boolean | null
          embed_settings?: Json | null
          events_created?: number
          extra_seats?: number
          first_name?: string | null
          id?: string
          last_name?: string | null
          marketing_consent?: boolean
          marketing_consent_at?: string | null
          marketing_consent_version?: string | null
          notification_prefs?: Json | null
          plan?: string | null
          plan_renews_at?: string | null
          sms_auto_top_up?: boolean | null
          sms_credits?: number | null
          sms_low_balance_threshold?: number | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          count: number
          key: string
          window_start: string
        }
        Insert: {
          count?: number
          key: string
          window_start?: string
        }
        Update: {
          count?: number
          key?: string
          window_start?: string
        }
        Relationships: []
      }
      sms_usage: {
        Row: {
          credits: number
          date: string | null
          event_id: string | null
          event_title: string | null
          id: string
          recipient: string
          type: string
          user_id: string
        }
        Insert: {
          credits: number
          date?: string | null
          event_id?: string | null
          event_title?: string | null
          id?: string
          recipient: string
          type: string
          user_id: string
        }
        Update: {
          credits?: number
          date?: string | null
          event_id?: string | null
          event_title?: string | null
          id?: string
          recipient?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      time_slots: {
        Row: {
          date: string
          end_time: string
          event_id: string
          id: string
          start_time: string
        }
        Insert: {
          date: string
          end_time: string
          event_id: string
          id: string
          start_time: string
        }
        Update: {
          date?: string
          end_time?: string
          event_id?: string
          id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_slots_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_billing_order: {
        Args: { p_grants: Json; p_order: string; p_user: string }
        Returns: boolean
      }
      check_rate_limit: {
        Args: { p_key: string; p_max: number; p_window_seconds: number }
        Returns: boolean
      }
      expire_overdue_events: { Args: never; Returns: number }
      purge_expired_events: { Args: never; Returns: number }
      purge_rate_limits: { Args: never; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
