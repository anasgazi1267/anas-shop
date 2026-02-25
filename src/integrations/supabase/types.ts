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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      affiliate_earnings: {
        Row: {
          amount: number | null
          created_at: string
          id: string
          is_referral_commission: boolean | null
          order_id: string | null
          product_id: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          id?: string
          is_referral_commission?: boolean | null
          order_id?: string | null
          product_id?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          id?: string
          is_referral_commission?: boolean | null
          order_id?: string | null
          product_id?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_earnings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_earnings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_links: {
        Row: {
          clicks: number | null
          created_at: string
          id: string
          product_id: string
          referral_code: string
          user_id: string
        }
        Insert: {
          clicks?: number | null
          created_at?: string
          id?: string
          product_id: string
          referral_code: string
          user_id: string
        }
        Update: {
          clicks?: number | null
          created_at?: string
          id?: string
          product_id?: string
          referral_code?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_links_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      banners: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          image_url: string
          is_active: boolean | null
          link: string | null
          title_bn: string | null
          title_en: string | null
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          image_url: string
          is_active?: boolean | null
          link?: string | null
          title_bn?: string | null
          title_en?: string | null
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          link?: string | null
          title_bn?: string | null
          title_en?: string | null
        }
        Relationships: []
      }
      cart: {
        Row: {
          color: string | null
          created_at: string
          id: string
          product_id: string
          quantity: number | null
          size: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          product_id: string
          quantity?: number | null
          size?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number | null
          size?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          image_url: string | null
          name_bn: string | null
          name_en: string
          parent_id: string | null
          slug: string | null
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string | null
          name_bn?: string | null
          name_en: string
          parent_id?: string | null
          slug?: string | null
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string | null
          name_bn?: string | null
          name_en?: string
          parent_id?: string | null
          slug?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_settings: {
        Row: {
          created_at: string
          free_delivery_threshold: number | null
          id: string
          inside_dhaka_charge: number | null
          outside_dhaka_charge: number | null
        }
        Insert: {
          created_at?: string
          free_delivery_threshold?: number | null
          id?: string
          inside_dhaka_charge?: number | null
          outside_dhaka_charge?: number | null
        }
        Update: {
          created_at?: string
          free_delivery_threshold?: number | null
          id?: string
          inside_dhaka_charge?: number | null
          outside_dhaka_charge?: number | null
        }
        Relationships: []
      }
      districts: {
        Row: {
          division_id: string
          id: string
          is_dhaka: boolean | null
          name_bn: string | null
          name_en: string
        }
        Insert: {
          division_id: string
          id?: string
          is_dhaka?: boolean | null
          name_bn?: string | null
          name_en: string
        }
        Update: {
          division_id?: string
          id?: string
          is_dhaka?: boolean | null
          name_bn?: string | null
          name_en?: string
        }
        Relationships: [
          {
            foreignKeyName: "districts_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
        ]
      }
      divisions: {
        Row: {
          id: string
          name_bn: string | null
          name_en: string
        }
        Insert: {
          id?: string
          name_bn?: string | null
          name_en: string
        }
        Update: {
          id?: string
          name_bn?: string | null
          name_en?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          advance_amount: number | null
          created_at: string
          customer_address: string
          customer_name: string
          customer_phone: string
          delivery_charge: number | null
          district_id: string | null
          division_id: string | null
          id: string
          notes: string | null
          payment_method: string | null
          payment_number: string | null
          payment_screenshot: string | null
          product_ids: string[] | null
          product_quantities: Json | null
          product_sizes: Json | null
          referral_code: string | null
          status: string | null
          total_amount: number
          tracking_id: string
          transaction_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          advance_amount?: number | null
          created_at?: string
          customer_address: string
          customer_name: string
          customer_phone: string
          delivery_charge?: number | null
          district_id?: string | null
          division_id?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_number?: string | null
          payment_screenshot?: string | null
          product_ids?: string[] | null
          product_quantities?: Json | null
          product_sizes?: Json | null
          referral_code?: string | null
          status?: string | null
          total_amount?: number
          tracking_id: string
          transaction_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          advance_amount?: number | null
          created_at?: string
          customer_address?: string
          customer_name?: string
          customer_phone?: string
          delivery_charge?: number | null
          district_id?: string | null
          division_id?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_number?: string | null
          payment_screenshot?: string | null
          product_ids?: string[] | null
          product_quantities?: Json | null
          product_sizes?: Json | null
          referral_code?: string | null
          status?: string | null
          total_amount?: number
          tracking_id?: string
          transaction_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          name_bn: string | null
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          name_bn?: string | null
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          name_bn?: string | null
        }
        Relationships: []
      }
      product_requests: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          product_name: string
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          product_name: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          product_name?: string
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      product_views: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_agent: string | null
          user_id: string | null
          user_ip: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_agent?: string | null
          user_id?: string | null
          user_ip?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_agent?: string | null
          user_id?: string | null
          user_ip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_views_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          advance_amount: number | null
          affiliate_commission: number | null
          category_id: string | null
          colors: string[] | null
          created_at: string
          description_bn: string | null
          description_en: string | null
          discount_price: number | null
          id: string
          images: string[] | null
          is_advance_payment: boolean | null
          is_bestseller: boolean | null
          is_featured: boolean | null
          is_new: boolean | null
          keywords: string[] | null
          meta_description: string | null
          meta_keywords: string | null
          meta_title: string | null
          name_bn: string | null
          name_en: string
          original_price: number | null
          price: number
          sizes: string[] | null
          slug: string | null
          status: string | null
          stock: number | null
          updated_at: string
        }
        Insert: {
          advance_amount?: number | null
          affiliate_commission?: number | null
          category_id?: string | null
          colors?: string[] | null
          created_at?: string
          description_bn?: string | null
          description_en?: string | null
          discount_price?: number | null
          id?: string
          images?: string[] | null
          is_advance_payment?: boolean | null
          is_bestseller?: boolean | null
          is_featured?: boolean | null
          is_new?: boolean | null
          keywords?: string[] | null
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          name_bn?: string | null
          name_en: string
          original_price?: number | null
          price?: number
          sizes?: string[] | null
          slug?: string | null
          status?: string | null
          stock?: number | null
          updated_at?: string
        }
        Update: {
          advance_amount?: number | null
          affiliate_commission?: number | null
          category_id?: string | null
          colors?: string[] | null
          created_at?: string
          description_bn?: string | null
          description_en?: string | null
          discount_price?: number | null
          id?: string
          images?: string[] | null
          is_advance_payment?: boolean | null
          is_bestseller?: boolean | null
          is_featured?: boolean | null
          is_new?: boolean | null
          keywords?: string[] | null
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          name_bn?: string | null
          name_en?: string
          original_price?: number | null
          price?: number
          sizes?: string[] | null
          slug?: string | null
          status?: string | null
          stock?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          created_at: string
          district_id: string | null
          division_id: string | null
          full_name: string | null
          id: string
          phone: string | null
          referral_code: string | null
          referred_by: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          district_id?: string | null
          division_id?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          district_id?: string | null
          division_id?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          created_at: string
          id: string
          key: string
          value: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          value?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          value?: string | null
        }
        Relationships: []
      }
      social_links: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          platform: string
          sort_order: number | null
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          platform: string
          sort_order?: number | null
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          platform?: string
          sort_order?: number | null
          url?: string
        }
        Relationships: []
      }
      user_referrals: {
        Row: {
          created_at: string
          id: string
          referred_id: string
          referrer_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          referred_id: string
          referrer_id: string
        }
        Update: {
          created_at?: string
          id?: string
          referred_id?: string
          referrer_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      wishlist: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawal_requests: {
        Row: {
          account_number: string | null
          admin_note: string | null
          amount: number
          created_at: string
          id: string
          payment_method: string | null
          payment_number: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          account_number?: string | null
          admin_note?: string | null
          amount: number
          created_at?: string
          id?: string
          payment_method?: string | null
          payment_number?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          account_number?: string | null
          admin_note?: string | null
          amount?: number
          created_at?: string
          id?: string
          payment_method?: string | null
          payment_number?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_tracking_id: { Args: never; Returns: string }
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
    Enums: {},
  },
} as const
