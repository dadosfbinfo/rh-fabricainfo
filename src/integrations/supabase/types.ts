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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      absenteismo: {
        Row: {
          created_at: string
          funcionario_id: string
          horas_ausencia_num: number | null
          horas_ausencia_seg: number
          horas_ausencia_txt: string
          horas_previstas_num: number | null
          horas_previstas_seg: number
          horas_previstas_txt: string
          id: string
          mes: string
          percentual_absenteismo: number | null
          setor: string | null
        }
        Insert: {
          created_at?: string
          funcionario_id: string
          horas_ausencia_num?: number | null
          horas_ausencia_seg?: number
          horas_ausencia_txt?: string
          horas_previstas_num?: number | null
          horas_previstas_seg?: number
          horas_previstas_txt?: string
          id?: string
          mes: string
          percentual_absenteismo?: number | null
          setor?: string | null
        }
        Update: {
          created_at?: string
          funcionario_id?: string
          horas_ausencia_num?: number | null
          horas_ausencia_seg?: number
          horas_ausencia_txt?: string
          horas_previstas_num?: number | null
          horas_previstas_seg?: number
          horas_previstas_txt?: string
          id?: string
          mes?: string
          percentual_absenteismo?: number | null
          setor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "absenteismo_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      atestado: {
        Row: {
          cid: string | null
          created_at: string
          data: string
          funcionario_id: string
          id: string
          total_dias: number | null
        }
        Insert: {
          cid?: string | null
          created_at?: string
          data: string
          funcionario_id: string
          id?: string
          total_dias?: number | null
        }
        Update: {
          cid?: string | null
          created_at?: string
          data?: string
          funcionario_id?: string
          id?: string
          total_dias?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "atestado_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      avaliacao_desempenho: {
        Row: {
          created_at: string
          data_avaliacao: string
          funcionario_id: string
          hard_skill: number | null
          id: string
          nota_final: number | null
          soft_skill: number | null
        }
        Insert: {
          created_at?: string
          data_avaliacao?: string
          funcionario_id: string
          hard_skill?: number | null
          id?: string
          nota_final?: number | null
          soft_skill?: number | null
        }
        Update: {
          created_at?: string
          data_avaliacao?: string
          funcionario_id?: string
          hard_skill?: number | null
          id?: string
          nota_final?: number | null
          soft_skill?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "avaliacao_desempenho_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      cargos: {
        Row: {
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      empresas: {
        Row: {
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      funcionarios: {
        Row: {
          cargo_id: string | null
          created_at: string
          data_admissao: string | null
          data_desligamento: string | null
          deleted_at: string | null
          empresa_id: string | null
          gestor_id: string | null
          id: string
          nome: string
          projeto_id: string | null
          status: Database["public"]["Enums"]["status_funcionario"]
          tipo_colaborador:
            | Database["public"]["Enums"]["tipo_colaborador"]
            | null
          updated_at: string
        }
        Insert: {
          cargo_id?: string | null
          created_at?: string
          data_admissao?: string | null
          data_desligamento?: string | null
          deleted_at?: string | null
          empresa_id?: string | null
          gestor_id?: string | null
          id?: string
          nome: string
          projeto_id?: string | null
          status?: Database["public"]["Enums"]["status_funcionario"]
          tipo_colaborador?:
            | Database["public"]["Enums"]["tipo_colaborador"]
            | null
          updated_at?: string
        }
        Update: {
          cargo_id?: string | null
          created_at?: string
          data_admissao?: string | null
          data_desligamento?: string | null
          deleted_at?: string | null
          empresa_id?: string | null
          gestor_id?: string | null
          id?: string
          nome?: string
          projeto_id?: string | null
          status?: Database["public"]["Enums"]["status_funcionario"]
          tipo_colaborador?:
            | Database["public"]["Enums"]["tipo_colaborador"]
            | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "funcionarios_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funcionarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funcionarios_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "gestores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funcionarios_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      gestores: {
        Row: {
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      import_logs: {
        Row: {
          arquivo: string | null
          created_at: string
          id: string
          linhas_erro: number
          linhas_importadas: number
          tabela: string
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          arquivo?: string | null
          created_at?: string
          id?: string
          linhas_erro?: number
          linhas_importadas?: number
          tabela: string
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          arquivo?: string | null
          created_at?: string
          id?: string
          linhas_erro?: number
          linhas_importadas?: number
          tabela?: string
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      info_school: {
        Row: {
          created_at: string
          funcionario_id: string
          id: string
          mes: string
          status_infoschool: string | null
        }
        Insert: {
          created_at?: string
          funcionario_id: string
          id?: string
          mes: string
          status_infoschool?: string | null
        }
        Update: {
          created_at?: string
          funcionario_id?: string
          id?: string
          mes?: string
          status_infoschool?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "info_school_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          nome: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          nome?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          nome?: string | null
        }
        Relationships: []
      }
      projetos: {
        Row: {
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
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
          role?: Database["public"]["Enums"]["app_role"]
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
      [_ in never]: never
    }
    Functions: {
      can_edit: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "ADMINISTRADOR" | "EDITOR" | "VISUALIZADOR"
      status_funcionario: "ATIVO" | "DESLIGADO" | "FERIAS" | "LICENCA"
      tipo_colaborador: "OPERACAO" | "ADM" | "CLIENTE" | "CLIENTE VIP"
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
      app_role: ["ADMINISTRADOR", "EDITOR", "VISUALIZADOR"],
      status_funcionario: ["ATIVO", "DESLIGADO", "FERIAS", "LICENCA"],
      tipo_colaborador: ["OPERACAO", "ADM", "CLIENTE", "CLIENTE VIP"],
    },
  },
} as const
