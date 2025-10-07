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
    PostgrestVersion: "13.0.4"
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
          confirmed_at: string | null
          created_at: string
          currency: string
          donor_address: string | null
          donor_phone: string | null
          email: string | null
          event_id: string
          id: string
          is_confirmed: boolean | null
          message: string | null
          name: string
          payment_method: string | null
          payment_reference: string | null
          payment_type: string
        }
        Insert: {
          amount: number
          amount_in_kes: number
          amount_in_usd: number
          confirmed_at?: string | null
          created_at?: string
          currency?: string
          donor_address?: string | null
          donor_phone?: string | null
          email?: string | null
          event_id: string
          id?: string
          is_confirmed?: boolean | null
          message?: string | null
          name: string
          payment_method?: string | null
          payment_reference?: string | null
          payment_type: string
        }
        Update: {
          amount?: number
          amount_in_kes?: number
          amount_in_usd?: number
          confirmed_at?: string | null
          created_at?: string
          currency?: string
          donor_address?: string | null
          donor_phone?: string | null
          email?: string | null
          event_id?: string
          id?: string
          is_confirmed?: boolean | null
          message?: string | null
          name?: string
          payment_method?: string | null
          payment_reference?: string | null
          payment_type?: string
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
          attendee_name: string | null
          event_id: string
          id: string
          joined_at: string
          last_activity: string
          session_token: string
        }
        Insert: {
          attendee_name?: string | null
          event_id: string
          id?: string
          joined_at?: string
          last_activity?: string
          session_token: string
        }
        Update: {
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
          duration_minutes: number | null
          goal_amount: number
          id: string
          is_active: boolean | null
          passcode: string
          scheduled_at: string
          share_link: string
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          goal_amount?: number
          id?: string
          is_active?: boolean | null
          passcode: string
          scheduled_at: string
          share_link: string
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          goal_amount?: number
          id?: string
          is_active?: boolean | null
          passcode?: string
          scheduled_at?: string
          share_link?: string
          status?: string | null
          title?: string
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
      count_active_sessions: {
        Args: { p_event_id: string }
        Returns: number
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
          message: string
          payment_type: string
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
      update_session_activity: {
        Args: { p_session_token: string }
        Returns: undefined
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
