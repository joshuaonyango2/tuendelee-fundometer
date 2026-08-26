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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      admin_meeting_integrations: {
        Row: {
          access_token: string | null
          admin_id: string
          created_at: string | null
          expires_at: string | null
          id: string
          is_connected: boolean | null
          platform_id: string
          refresh_token: string | null
          updated_at: string | null
        }
        Insert: {
          access_token?: string | null
          admin_id: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_connected?: boolean | null
          platform_id: string
          refresh_token?: string | null
          updated_at?: string | null
        }
        Update: {
          access_token?: string | null
          admin_id?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_connected?: boolean | null
          platform_id?: string
          refresh_token?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_meeting_integrations_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "meeting_platforms"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_notifications: {
        Row: {
          admin_id: string
          body: string | null
          created_at: string
          event_id: string | null
          id: string
          is_read: boolean
          pledge_id: string | null
          severity: string
          title: string
          type: string
        }
        Insert: {
          admin_id: string
          body?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          is_read?: boolean
          pledge_id?: string | null
          severity?: string
          title: string
          type: string
        }
        Update: {
          admin_id?: string
          body?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          is_read?: boolean
          pledge_id?: string | null
          severity?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_notifications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "fundraising_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_notifications_pledge_id_fkey"
            columns: ["pledge_id"]
            isOneToOne: false
            referencedRelation: "event_pledges"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bank_statement_entries: {
        Row: {
          amount: number
          created_at: string
          currency: string
          description: string | null
          event_id: string
          id: string
          import_id: string
          match_reason: string | null
          match_status: string
          matched_pledge_id: string | null
          payer_name: string | null
          reference: string | null
          txn_date: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          description?: string | null
          event_id: string
          id?: string
          import_id: string
          match_reason?: string | null
          match_status?: string
          matched_pledge_id?: string | null
          payer_name?: string | null
          reference?: string | null
          txn_date?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          description?: string | null
          event_id?: string
          id?: string
          import_id?: string
          match_reason?: string | null
          match_status?: string
          matched_pledge_id?: string | null
          payer_name?: string | null
          reference?: string | null
          txn_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_statement_entries_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "fundraising_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_statement_entries_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "bank_statement_imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_statement_entries_matched_pledge_id_fkey"
            columns: ["matched_pledge_id"]
            isOneToOne: false
            referencedRelation: "event_pledges"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_statement_imports: {
        Row: {
          admin_id: string
          created_at: string
          currency: string
          event_id: string
          file_name: string
          id: string
          row_count: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          currency?: string
          event_id: string
          file_name: string
          id?: string
          row_count?: number
          total_amount?: number
          updated_at?: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          currency?: string
          event_id?: string
          file_name?: string
          id?: string
          row_count?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_statement_imports_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "fundraising_events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_meetings: {
        Row: {
          created_at: string | null
          duration_minutes: number | null
          event_id: string
          host_url: string | null
          id: string
          join_url: string | null
          meeting_id: string
          meeting_url: string
          passcode: string | null
          platform_id: string
          start_time: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          duration_minutes?: number | null
          event_id: string
          host_url?: string | null
          id?: string
          join_url?: string | null
          meeting_id: string
          meeting_url: string
          passcode?: string | null
          platform_id: string
          start_time?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number | null
          event_id?: string
          host_url?: string | null
          id?: string
          join_url?: string | null
          meeting_id?: string
          meeting_url?: string
          passcode?: string | null
          platform_id?: string
          start_time?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_meetings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "fundraising_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_meetings_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "meeting_platforms"
            referencedColumns: ["id"]
          },
        ]
      }
      event_pledges: {
        Row: {
          amount: number
          amount_in_kes: number
          amount_in_usd: number
          archived_at: string | null
          badge_rank: number | null
          confirmed_at: string | null
          country_code: string | null
          created_at: string
          currency: string
          donor_address: string | null
          donor_phone: string | null
          email: string | null
          event_id: string
          id: string
          is_archived: boolean
          is_confirmed: boolean | null
          message: string | null
          name: string
          payment_deadline: string | null
          payment_method: string | null
          payment_reference: string | null
          payment_type: string
          pledge_duration_days: number | null
          possible_duplicate_of: string | null
          receipt_sent_at: string | null
          reminder_final_sent_at: string | null
          reminder_half_sent_at: string | null
          thank_you_sent_at: string | null
          verification_note: string | null
          verification_status: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount: number
          amount_in_kes: number
          amount_in_usd: number
          archived_at?: string | null
          badge_rank?: number | null
          confirmed_at?: string | null
          country_code?: string | null
          created_at?: string
          currency?: string
          donor_address?: string | null
          donor_phone?: string | null
          email?: string | null
          event_id: string
          id?: string
          is_archived?: boolean
          is_confirmed?: boolean | null
          message?: string | null
          name: string
          payment_deadline?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_type: string
          pledge_duration_days?: number | null
          possible_duplicate_of?: string | null
          receipt_sent_at?: string | null
          reminder_final_sent_at?: string | null
          reminder_half_sent_at?: string | null
          thank_you_sent_at?: string | null
          verification_note?: string | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number
          amount_in_kes?: number
          amount_in_usd?: number
          archived_at?: string | null
          badge_rank?: number | null
          confirmed_at?: string | null
          country_code?: string | null
          created_at?: string
          currency?: string
          donor_address?: string | null
          donor_phone?: string | null
          email?: string | null
          event_id?: string
          id?: string
          is_archived?: boolean
          is_confirmed?: boolean | null
          message?: string | null
          name?: string
          payment_deadline?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_type?: string
          pledge_duration_days?: number | null
          possible_duplicate_of?: string | null
          receipt_sent_at?: string | null
          reminder_final_sent_at?: string | null
          reminder_half_sent_at?: string | null
          thank_you_sent_at?: string | null
          verification_note?: string | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_pledges_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "fundraising_events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_sessions: {
        Row: {
          attendee_email: string | null
          attendee_name: string | null
          event_id: string
          id: string
          joined_at: string
          last_activity: string
          session_token: string
        }
        Insert: {
          attendee_email?: string | null
          attendee_name?: string | null
          event_id: string
          id?: string
          joined_at?: string
          last_activity?: string
          session_token: string
        }
        Update: {
          attendee_email?: string | null
          attendee_name?: string | null
          event_id?: string
          id?: string
          joined_at?: string
          last_activity?: string
          session_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_sessions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "fundraising_events"
            referencedColumns: ["id"]
          },
        ]
      }
      fundraising_events: {
        Row: {
          admin_id: string
          created_at: string
          description: string | null
          description_fr: string | null
          description_it: string | null
          description_sw: string | null
          duration_minutes: number | null
          goal_amount: number
          id: string
          is_active: boolean | null
          passcode: string
          scheduled_at: string
          sender_email: string | null
          sender_name: string | null
          sender_phone: string | null
          share_link: string
          status: string | null
          template_payment_confirmed: string | null
          template_payment_reminder: string | null
          template_pledge_created: string | null
          template_thank_you_all: string | null
          thank_you_all_sent_at: string | null
          title: string
          title_fr: string | null
          title_it: string | null
          title_sw: string | null
          updated_at: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          description?: string | null
          description_fr?: string | null
          description_it?: string | null
          description_sw?: string | null
          duration_minutes?: number | null
          goal_amount?: number
          id?: string
          is_active?: boolean | null
          passcode: string
          scheduled_at: string
          sender_email?: string | null
          sender_name?: string | null
          sender_phone?: string | null
          share_link: string
          status?: string | null
          template_payment_confirmed?: string | null
          template_payment_reminder?: string | null
          template_pledge_created?: string | null
          template_thank_you_all?: string | null
          thank_you_all_sent_at?: string | null
          title: string
          title_fr?: string | null
          title_it?: string | null
          title_sw?: string | null
          updated_at?: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          description?: string | null
          description_fr?: string | null
          description_it?: string | null
          description_sw?: string | null
          duration_minutes?: number | null
          goal_amount?: number
          id?: string
          is_active?: boolean | null
          passcode?: string
          scheduled_at?: string
          sender_email?: string | null
          sender_name?: string | null
          sender_phone?: string | null
          share_link?: string
          status?: string | null
          template_payment_confirmed?: string | null
          template_payment_reminder?: string | null
          template_pledge_created?: string | null
          template_thank_you_all?: string | null
          thank_you_all_sent_at?: string | null
          title?: string
          title_fr?: string | null
          title_it?: string | null
          title_sw?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      impact_stories: {
        Row: {
          audio_url: string | null
          created_at: string
          description: string | null
          description_fr: string | null
          description_it: string | null
          id: string
          image_url: string | null
          is_active: boolean
          media_type: string
          media_url: string | null
          sort_order: number
          title: string
          title_fr: string | null
          title_it: string | null
          updated_at: string
        }
        Insert: {
          audio_url?: string | null
          created_at?: string
          description?: string | null
          description_fr?: string | null
          description_it?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          media_type?: string
          media_url?: string | null
          sort_order?: number
          title: string
          title_fr?: string | null
          title_it?: string | null
          updated_at?: string
        }
        Update: {
          audio_url?: string | null
          created_at?: string
          description?: string | null
          description_fr?: string | null
          description_it?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          media_type?: string
          media_url?: string | null
          sort_order?: number
          title?: string
          title_fr?: string | null
          title_it?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      meeting_platforms: {
        Row: {
          created_at: string | null
          display_name: string
          icon_url: string | null
          id: string
          is_active: boolean | null
          name: string
          oauth_url: string | null
        }
        Insert: {
          created_at?: string | null
          display_name: string
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          oauth_url?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          oauth_url?: string | null
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          account_details: Json
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          account_details?: Json
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          account_details?: Json
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      pledge_notifications: {
        Row: {
          channel: string
          error_message: string | null
          id: string
          message: string
          notification_type: string
          pledge_id: string
          recipient: string
          sent_at: string | null
          status: string | null
        }
        Insert: {
          channel: string
          error_message?: string | null
          id?: string
          message: string
          notification_type: string
          pledge_id: string
          recipient: string
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          channel?: string
          error_message?: string | null
          id?: string
          message?: string
          notification_type?: string
          pledge_id?: string
          recipient?: string
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pledge_notifications_pledge_id_fkey"
            columns: ["pledge_id"]
            isOneToOne: false
            referencedRelation: "event_pledges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      event_participants: {
        Row: {
          attendee_name: string | null
          event_id: string | null
          joined_at: string | null
          last_activity: string | null
          pledge_count: number | null
          total_pledged: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_sessions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "fundraising_events"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      archive_event_fundraising: {
        Args: { p_event_id: string }
        Returns: number
      }
      can_view_public_pledges: {
        Args: { p_event_id: string }
        Returns: boolean
      }
      confirm_pledge_payment: {
        Args: {
          p_donor_address: string
          p_donor_phone: string
          p_payment_method: string
          p_payment_reference: string
          p_pledge_id: string
          p_session_token: string
        }
        Returns: undefined
      }
      count_active_sessions: { Args: { p_event_id: string }; Returns: number }
      find_duplicate_payments: {
        Args: { p_event_id: string }
        Returns: {
          amount: number
          created_at: string
          currency: string
          donor_phone: string
          email: string
          group_key: string
          is_confirmed: boolean
          name: string
          payment_method: string
          payment_reference: string
          pledge_id: string
          verification_status: string
        }[]
      }
      find_my_pledges: {
        Args: { p_event_id: string; p_search_term: string }
        Returns: {
          amount: number
          created_at: string
          currency: string
          id: string
          is_confirmed: boolean
          message: string
          name: string
          payment_deadline: string
          payment_method: string
          payment_reference: string
          payment_type: string
        }[]
      }
      get_admin_pledges: {
        Args: { p_event_id: string }
        Returns: {
          amount: number
          amount_in_kes: number
          amount_in_usd: number
          confirmed_at: string
          created_at: string
          currency: string
          donor_address: string
          donor_phone: string
          email: string
          event_id: string
          id: string
          is_confirmed: boolean
          message: string
          name: string
          payment_deadline: string
          payment_method: string
          payment_reference: string
          payment_type: string
        }[]
      }
      get_public_pledges: {
        Args: { p_event_id: string }
        Returns: {
          amount: number
          amount_in_kes: number
          amount_in_usd: number
          created_at: string
          currency: string
          display_name: string
          event_id: string
          id: string
          is_confirmed: boolean
          message: string
          payment_type: string
        }[]
      }
      get_reconciliation_summary: {
        Args: { p_event_id: string }
        Returns: {
          bank_entries: number
          bank_total: number
          matched_entries: number
          matched_total: number
          paid_not_in_bank_count: number
          paid_not_in_bank_total: number
          pending_count: number
          pending_total: number
          system_paid_count: number
          system_paid_total: number
          unmatched_bank_entries: number
          unmatched_bank_total: number
        }[]
      }
      get_session_by_token: {
        Args: { p_session_token: string }
        Returns: {
          attendee_name: string
          event_id: string
          id: string
          joined_at: string
          last_activity: string
          session_token: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      reconcile_bank_entries: {
        Args: { p_event_id: string }
        Returns: {
          matched: number
          unmatched: number
        }[]
      }
      set_pledge_verification: {
        Args: { p_note?: string; p_pledge_id: string; p_status: string }
        Returns: undefined
      }
      update_pledge_by_admin: {
        Args: {
          p_amount: number
          p_currency: string
          p_donor_address: string
          p_donor_phone: string
          p_email: string
          p_is_confirmed: boolean
          p_message: string
          p_name: string
          p_payment_method: string
          p_payment_reference: string
          p_pledge_id: string
        }
        Returns: undefined
      }
      update_session_activity: {
        Args: { p_session_token: string }
        Returns: undefined
      }
      validate_payment_reference: {
        Args: { p_method: string; p_reference: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
