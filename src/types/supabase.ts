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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      app_config: {
        Row: {
          created_at: string
          description: string | null
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          description?: string | null
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      commissions: {
        Row: {
          agent_id: string | null
          amount: number
          created_at: string | null
          id: string
          source_transaction_id: string | null
        }
        Insert: {
          agent_id?: string | null
          amount: number
          created_at?: string | null
          id?: string
          source_transaction_id?: string | null
        }
        Update: {
          agent_id?: string | null
          amount?: number
          created_at?: string | null
          id?: string
          source_transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commissions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_source_transaction_id_fkey"
            columns: ["source_transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          referred_by_code: string | null
          status: Database["public"]["Enums"]["status_type"] | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          referred_by_code?: string | null
          status?: Database["public"]["Enums"]["status_type"] | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          referred_by_code?: string | null
          status?: Database["public"]["Enums"]["status_type"] | null
        }
        Relationships: []
      }
      products: {
        Row: {
          description: string | null
          file_url: string | null
          id: string
          is_active: boolean | null
          price: number
          thumbnail_url: string | null
          title: string
        }
        Insert: {
          description?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          price: number
          thumbnail_url?: string | null
          title: string
        }
        Update: {
          description?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          price?: number
          thumbnail_url?: string | null
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          affiliate_code: string | null
          balance: number | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          phone: string | null
          referred_by: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          tier_id: string | null
          total_sales: number | null
        }
        Insert: {
          affiliate_code?: string | null
          balance?: number | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          referred_by?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          tier_id?: string | null
          total_sales?: number | null
        }
        Update: {
          affiliate_code?: string | null
          balance?: number | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          referred_by?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          tier_id?: string | null
          total_sales?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          lead_id: string | null
          midtrans_id: string | null
          status: Database["public"]["Enums"]["status_type"] | null
          type: Database["public"]["Enums"]["transaction_type"] | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          lead_id?: string | null
          midtrans_id?: string | null
          status?: Database["public"]["Enums"]["status_type"] | null
          type?: Database["public"]["Enums"]["transaction_type"] | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          lead_id?: string | null
          midtrans_id?: string | null
          status?: Database["public"]["Enums"]["status_type"] | null
          type?: Database["public"]["Enums"]["transaction_type"] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      visits: {
        Row: {
          affiliate_code: string | null
          created_at: string | null
          id: string
          user_agent: string | null
          visitor_ip: string | null
        }
        Insert: {
          affiliate_code?: string | null
          created_at?: string | null
          id?: string
          user_agent?: string | null
          visitor_ip?: string | null
        }
        Update: {
          affiliate_code?: string | null
          created_at?: string | null
          id?: string
          user_agent?: string | null
          visitor_ip?: string | null
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          agent_id: string | null
          amount: number
          bank_details: Json | null
          created_at: string | null
          id: string
          status: Database["public"]["Enums"]["status_type"] | null
        }
        Insert: {
          agent_id?: string | null
          amount: number
          bank_details?: Json | null
          created_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["status_type"] | null
        }
        Update: {
          agent_id?: string | null
          amount?: number
          bank_details?: Json | null
          created_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["status_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_posts: {
        Row: {
          id: string
          created_at: string
          title: string
          description: string | null
          video_url: string | null
          attachment_url: string | null
          mission_text: string | null
          copyable_text: string | null
          level_badge: string | null
          order_index: number
          is_active: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          description?: string | null
          video_url?: string | null
          attachment_url?: string | null
          mission_text?: string | null
          copyable_text?: string | null
          level_badge?: string | null
          order_index?: number
          is_active?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          description?: string | null
          video_url?: string | null
          attachment_url?: string | null
          mission_text?: string | null
          copyable_text?: string | null
          level_badge?: string | null
          order_index?: number
          is_active?: boolean
        }
        Relationships: []
      }
      academy_progress: {
        Row: {
          id: string
          user_id: string
          post_id: string
          completed_at: string
        }
        Insert: {
          id?: string
          user_id: string
          post_id: string
          completed_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          post_id?: string
          completed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_progress_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "academy_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      video_testimonials: {
        Row: {
          id: string
          created_at: string
          video_url: string
          title: string
          description: string | null
          thumbnail_url: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          video_url: string
          title: string
          description?: string | null
          thumbnail_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          video_url?: string
          title?: string
          description?: string | null
          thumbnail_url?: string | null
        }
        Relationships: []
      }
      tiers: {
        Row: {
          id: string
          tier_key: Database["public"]["Enums"]["tier_type"]
          name: string
          description: string | null
          commission_rate: number
          min_withdraw: number
          upgrade_price: number
          registration_price: number
          upgrade_sales_threshold: number | null
          override_commission_rate: number | null
          priority_withdrawal: boolean
          is_purchasable: boolean
          created_at: string
        }
        Insert: {
          id?: string
          tier_key: Database["public"]["Enums"]["tier_type"]
          name: string
          description?: string | null
          commission_rate: number
          min_withdraw: number
          upgrade_price?: number
          registration_price?: number
          upgrade_sales_threshold?: number | null
          override_commission_rate?: number | null
          priority_withdrawal?: boolean
          is_purchasable?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          tier_key?: Database["public"]["Enums"]["tier_type"]
          name?: string
          description?: string | null
          commission_rate?: number
          min_withdraw?: number
          upgrade_price?: number
          registration_price?: number
          upgrade_sales_threshold?: number | null
          override_commission_rate?: number | null
          priority_withdrawal?: boolean
          is_purchasable?: boolean
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      set_registration_tier: {
        Args: {
          tier_id: string
        }
        Returns: void
      }
      increment_sales: {
        Args: {
          user_id: string
        }
        Returns: void
      }
      check_auto_upgrade: {
        Args: {
          check_user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      status_type: "pending" | "success" | "failed" | "cancelled"
      transaction_type: "registration" | "product_purchase" | "tier_upgrade"
      user_role: "agent" | "admin"
      tier_type: "basic" | "pro" | "vip"
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
      status_type: ["pending", "success", "failed", "cancelled"],
      transaction_type: ["registration", "product_purchase"],
      user_role: ["agent", "admin"],
    },
  },
} as const
