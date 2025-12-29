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
      cash_books: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          reference_id: string | null
          source: Database["public"]["Enums"]["cash_book_source"]
          type: Database["public"]["Enums"]["cash_book_type"]
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          source: Database["public"]["Enums"]["cash_book_source"]
          type: Database["public"]["Enums"]["cash_book_type"]
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          source?: Database["public"]["Enums"]["cash_book_source"]
          type?: Database["public"]["Enums"]["cash_book_type"]
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          created_at: string
          id: string
          name: string
          phone: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          name: string
          phone?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      inventory_logs: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          product_id: string
          qty: number
          type: Database["public"]["Enums"]["inventory_type"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          product_id: string
          qty: number
          type: Database["public"]["Enums"]["inventory_type"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          product_id?: string
          qty?: number
          type?: Database["public"]["Enums"]["inventory_type"]
        }
        Relationships: [
          {
            foreignKeyName: "inventory_logs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          buy_price: number
          category: string | null
          created_at: string
          id: string
          min_stock: number
          name: string
          sell_price: number
          stock: number
          unit: string
        }
        Insert: {
          barcode?: string | null
          buy_price?: number
          category?: string | null
          created_at?: string
          id?: string
          min_stock?: number
          name: string
          sell_price?: number
          stock?: number
          unit?: string
        }
        Update: {
          barcode?: string | null
          buy_price?: number
          category?: string | null
          created_at?: string
          id?: string
          min_stock?: number
          name?: string
          sell_price?: number
          stock?: number
          unit?: string
        }
        Relationships: []
      }
      shifts: {
        Row: {
          cashier_id: string
          closed_at: string | null
          end_cash: number | null
          id: string
          opened_at: string
          start_cash: number
          total_sales: number | null
          total_transactions: number | null
        }
        Insert: {
          cashier_id: string
          closed_at?: string | null
          end_cash?: number | null
          id?: string
          opened_at?: string
          start_cash?: number
          total_sales?: number | null
          total_transactions?: number | null
        }
        Update: {
          cashier_id?: string
          closed_at?: string | null
          end_cash?: number | null
          id?: string
          opened_at?: string
          start_cash?: number
          total_sales?: number | null
          total_transactions?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shifts_cashier_id_fkey"
            columns: ["cashier_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_purchase_items: {
        Row: {
          id: string
          price: number
          product_id: string | null
          purchase_id: string
          qty: number
        }
        Insert: {
          id?: string
          price: number
          product_id?: string | null
          purchase_id: string
          qty: number
        }
        Update: {
          id?: string
          price?: number
          product_id?: string | null
          purchase_id?: string
          qty?: number
        }
        Relationships: [
          {
            foreignKeyName: "supplier_purchase_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_purchase_items_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "supplier_purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_purchases: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_paid: boolean
          supplier_id: string | null
          total: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_paid?: boolean
          supplier_id?: string | null
          total?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_paid?: boolean
          supplier_id?: string | null
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "supplier_purchases_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          created_at: string
          id: string
          name: string
          phone: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          name: string
          phone?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      transaction_items: {
        Row: {
          discount: number
          id: string
          price: number
          product_id: string | null
          product_name: string
          qty: number
          subtotal: number
          transaction_id: string
        }
        Insert: {
          discount?: number
          id?: string
          price: number
          product_id?: string | null
          product_name: string
          qty: number
          subtotal: number
          transaction_id: string
        }
        Update: {
          discount?: number
          id?: string
          price?: number
          product_id?: string | null
          product_name?: string
          qty?: number
          subtotal?: number
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_items_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          cashier_id: string
          change_amount: number
          created_at: string
          customer_id: string | null
          discount: number
          id: string
          invoice: string
          notes: string | null
          paid_amount: number
          payment_method: Database["public"]["Enums"]["payment_method"]
          shift_id: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          subtotal: number
          tax: number
          total: number
        }
        Insert: {
          cashier_id: string
          change_amount?: number
          created_at?: string
          customer_id?: string | null
          discount?: number
          id?: string
          invoice: string
          notes?: string | null
          paid_amount?: number
          payment_method?: Database["public"]["Enums"]["payment_method"]
          shift_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          subtotal?: number
          tax?: number
          total?: number
        }
        Update: {
          cashier_id?: string
          change_amount?: number
          created_at?: string
          customer_id?: string | null
          discount?: number
          id?: string
          invoice?: string
          notes?: string | null
          paid_amount?: number
          payment_method?: Database["public"]["Enums"]["payment_method"]
          shift_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          subtotal?: number
          tax?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_transactions_shift"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_cashier_id_fkey"
            columns: ["cashier_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          id: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      close_shift: {
        Args: { p_end_cash: number; p_shift_id: string }
        Returns: boolean
      }
      create_supplier_purchase: {
        Args: {
          p_is_paid?: boolean
          p_items: Json
          p_supplier_id: string
          p_total: number
        }
        Returns: string
      }
      create_transaction: {
        Args: {
          p_change_amount?: number
          p_customer_id?: string
          p_discount?: number
          p_items: Json
          p_notes?: string
          p_paid_amount?: number
          p_payment_method?: Database["public"]["Enums"]["payment_method"]
          p_shift_id?: string
          p_subtotal?: number
          p_tax?: number
          p_total?: number
        }
        Returns: string
      }
      generate_invoice_number: { Args: never; Returns: string }
      get_active_shift: { Args: { p_cashier_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_kasir: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "kasir"
      cash_book_source: "transaction" | "purchase" | "manual"
      cash_book_type: "in" | "out"
      inventory_type: "in" | "out"
      payment_method: "cash" | "qris" | "bank" | "credit"
      transaction_status: "success" | "refund"
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
      app_role: ["admin", "kasir"],
      cash_book_source: ["transaction", "purchase", "manual"],
      cash_book_type: ["in", "out"],
      inventory_type: ["in", "out"],
      payment_method: ["cash", "qris", "bank", "credit"],
      transaction_status: ["success", "refund"],
    },
  },
} as const
