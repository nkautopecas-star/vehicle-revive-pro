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
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      marketplace_accounts: {
        Row: {
          access_token: string | null
          created_at: string
          id: string
          marketplace: Database["public"]["Enums"]["marketplace_type"]
          nome_conta: string
          refresh_token: string | null
          status: Database["public"]["Enums"]["account_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          id?: string
          marketplace: Database["public"]["Enums"]["marketplace_type"]
          nome_conta: string
          refresh_token?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          id?: string
          marketplace?: Database["public"]["Enums"]["marketplace_type"]
          nome_conta?: string
          refresh_token?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      marketplace_listings: {
        Row: {
          created_at: string
          external_id: string | null
          id: string
          last_sync: string | null
          marketplace_account_id: string
          part_id: string
          preco: number
          status: Database["public"]["Enums"]["listing_status"]
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          external_id?: string | null
          id?: string
          last_sync?: string | null
          marketplace_account_id: string
          part_id: string
          preco: number
          status?: Database["public"]["Enums"]["listing_status"]
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          external_id?: string | null
          id?: string
          last_sync?: string | null
          marketplace_account_id?: string
          part_id?: string
          preco?: number
          status?: Database["public"]["Enums"]["listing_status"]
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_listings_marketplace_account_id_fkey"
            columns: ["marketplace_account_id"]
            isOneToOne: false
            referencedRelation: "marketplace_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_listings_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_questions: {
        Row: {
          answer: string | null
          answered_at: string | null
          customer_name: string | null
          external_id: string | null
          id: string
          listing_id: string
          question: string
          received_at: string
          status: Database["public"]["Enums"]["question_status"]
        }
        Insert: {
          answer?: string | null
          answered_at?: string | null
          customer_name?: string | null
          external_id?: string | null
          id?: string
          listing_id: string
          question: string
          received_at?: string
          status?: Database["public"]["Enums"]["question_status"]
        }
        Update: {
          answer?: string | null
          answered_at?: string | null
          customer_name?: string | null
          external_id?: string | null
          id?: string
          listing_id?: string
          question?: string
          received_at?: string
          status?: Database["public"]["Enums"]["question_status"]
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_questions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      part_compatibilities: {
        Row: {
          ano_fim: number | null
          ano_inicio: number | null
          created_at: string
          id: string
          marca: string
          modelo: string
          observacoes: string | null
          part_id: string
        }
        Insert: {
          ano_fim?: number | null
          ano_inicio?: number | null
          created_at?: string
          id?: string
          marca: string
          modelo: string
          observacoes?: string | null
          part_id: string
        }
        Update: {
          ano_fim?: number | null
          ano_inicio?: number | null
          created_at?: string
          id?: string
          marca?: string
          modelo?: string
          observacoes?: string | null
          part_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "part_compatibilities_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
        ]
      }
      parts: {
        Row: {
          categoria_id: string | null
          codigo_interno: string | null
          codigo_oem: string | null
          condicao: Database["public"]["Enums"]["part_condition"]
          created_at: string
          id: string
          localizacao: string | null
          nome: string
          observacoes: string | null
          preco_custo: number | null
          preco_venda: number | null
          quantidade: number
          quantidade_minima: number
          status: Database["public"]["Enums"]["part_status"]
          updated_at: string
          user_id: string
          vehicle_id: string | null
        }
        Insert: {
          categoria_id?: string | null
          codigo_interno?: string | null
          codigo_oem?: string | null
          condicao?: Database["public"]["Enums"]["part_condition"]
          created_at?: string
          id?: string
          localizacao?: string | null
          nome: string
          observacoes?: string | null
          preco_custo?: number | null
          preco_venda?: number | null
          quantidade?: number
          quantidade_minima?: number
          status?: Database["public"]["Enums"]["part_status"]
          updated_at?: string
          user_id: string
          vehicle_id?: string | null
        }
        Update: {
          categoria_id?: string | null
          codigo_interno?: string | null
          codigo_oem?: string | null
          condicao?: Database["public"]["Enums"]["part_condition"]
          created_at?: string
          id?: string
          localizacao?: string | null
          nome?: string
          observacoes?: string | null
          preco_custo?: number | null
          preco_venda?: number | null
          quantidade?: number
          quantidade_minima?: number
          status?: Database["public"]["Enums"]["part_status"]
          updated_at?: string
          user_id?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parts_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sales: {
        Row: {
          created_at: string
          customer_name: string | null
          id: string
          marketplace_account_id: string | null
          order_external_id: string | null
          part_id: string
          preco_venda: number
          quantidade: number
          sold_at: string
          status: Database["public"]["Enums"]["sale_status"]
        }
        Insert: {
          created_at?: string
          customer_name?: string | null
          id?: string
          marketplace_account_id?: string | null
          order_external_id?: string | null
          part_id: string
          preco_venda: number
          quantidade?: number
          sold_at?: string
          status?: Database["public"]["Enums"]["sale_status"]
        }
        Update: {
          created_at?: string
          customer_name?: string | null
          id?: string
          marketplace_account_id?: string | null
          order_external_id?: string | null
          part_id?: string
          preco_venda?: number
          quantidade?: number
          sold_at?: string
          status?: Database["public"]["Enums"]["sale_status"]
        }
        Relationships: [
          {
            foreignKeyName: "sales_marketplace_account_id_fkey"
            columns: ["marketplace_account_id"]
            isOneToOne: false
            referencedRelation: "marketplace_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          id: string
          motivo: string | null
          part_id: string
          quantidade: number
          tipo: Database["public"]["Enums"]["movement_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          motivo?: string | null
          part_id: string
          quantidade: number
          tipo: Database["public"]["Enums"]["movement_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          motivo?: string | null
          part_id?: string
          quantidade?: number
          tipo?: Database["public"]["Enums"]["movement_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
        ]
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
          role?: Database["public"]["Enums"]["app_role"]
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
      vehicles: {
        Row: {
          ano: number
          chassi: string | null
          combustivel: string | null
          cor: string | null
          created_at: string
          data_entrada: string
          id: string
          marca: string
          modelo: string
          motorizacao: string | null
          observacoes: string | null
          placa: string
          status: Database["public"]["Enums"]["vehicle_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          ano: number
          chassi?: string | null
          combustivel?: string | null
          cor?: string | null
          created_at?: string
          data_entrada?: string
          id?: string
          marca: string
          modelo: string
          motorizacao?: string | null
          observacoes?: string | null
          placa: string
          status?: Database["public"]["Enums"]["vehicle_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          ano?: number
          chassi?: string | null
          combustivel?: string | null
          cor?: string | null
          created_at?: string
          data_entrada?: string
          id?: string
          marca?: string
          modelo?: string
          motorizacao?: string | null
          observacoes?: string | null
          placa?: string
          status?: Database["public"]["Enums"]["vehicle_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      account_status: "active" | "inactive" | "error"
      app_role: "admin" | "operador" | "vendedor"
      listing_status: "active" | "paused" | "sold" | "deleted"
      marketplace_type: "mercadolivre" | "shopee" | "olx"
      movement_type: "entrada" | "saida" | "ajuste"
      part_condition: "nova" | "usada" | "recondicionada"
      part_status: "ativa" | "vendida" | "pausada"
      question_status: "pending" | "answered"
      sale_status: "pending" | "completed" | "cancelled" | "refunded"
      vehicle_status: "ativo" | "desmontando" | "desmontado" | "finalizado"
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
      account_status: ["active", "inactive", "error"],
      app_role: ["admin", "operador", "vendedor"],
      listing_status: ["active", "paused", "sold", "deleted"],
      marketplace_type: ["mercadolivre", "shopee", "olx"],
      movement_type: ["entrada", "saida", "ajuste"],
      part_condition: ["nova", "usada", "recondicionada"],
      part_status: ["ativa", "vendida", "pausada"],
      question_status: ["pending", "answered"],
      sale_status: ["pending", "completed", "cancelled", "refunded"],
      vehicle_status: ["ativo", "desmontando", "desmontado", "finalizado"],
    },
  },
} as const
