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
      blocos: {
        Row: {
          created_at: string | null
          cupons_atribuidos: number | null
          cupons_disponiveis: number
          cupons_totais: number
          cupons_usados: number | null
          id: string
          lojista_id: string | null
          numero_bloco: string
          status: Database["public"]["Enums"]["status_bloco"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          cupons_atribuidos?: number | null
          cupons_disponiveis: number
          cupons_totais: number
          cupons_usados?: number | null
          id?: string
          lojista_id?: string | null
          numero_bloco: string
          status?: Database["public"]["Enums"]["status_bloco"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          cupons_atribuidos?: number | null
          cupons_disponiveis?: number
          cupons_totais?: number
          cupons_usados?: number | null
          id?: string
          lojista_id?: string | null
          numero_bloco?: string
          status?: Database["public"]["Enums"]["status_bloco"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      clientes: {
        Row: {
          cidade: string | null
          cpf: string | null
          created_at: string | null
          data_nascimento: string | null
          data_primeiro_cupom: string | null
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          lojista_id: string | null
          nome: string
          status: Database["public"]["Enums"]["status_cliente"] | null
          telefone: string | null
          total_cupons_recebidos: number | null
          total_valor_compras: number | null
          updated_at: string | null
        }
        Insert: {
          cidade?: string | null
          cpf?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          data_primeiro_cupom?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          lojista_id?: string | null
          nome: string
          status?: Database["public"]["Enums"]["status_cliente"] | null
          telefone?: string | null
          total_cupons_recebidos?: number | null
          total_valor_compras?: number | null
          updated_at?: string | null
        }
        Update: {
          cidade?: string | null
          cpf?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          data_primeiro_cupom?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          lojista_id?: string | null
          nome?: string
          status?: Database["public"]["Enums"]["status_cliente"] | null
          telefone?: string | null
          total_cupons_recebidos?: number | null
          total_valor_compras?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      configuracoes_sistema: {
        Row: {
          chave: string
          created_at: string | null
          descricao: string | null
          id: string
          updated_at: string | null
          valor: string
        }
        Insert: {
          chave: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          updated_at?: string | null
          valor: string
        }
        Update: {
          chave?: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          updated_at?: string | null
          valor?: string
        }
        Relationships: []
      }
      cupons: {
        Row: {
          bloco_id: string
          cliente_id: string | null
          created_at: string | null
          data_atribuicao: string | null
          data_uso: string | null
          id: string
          lojista_id: string | null
          numero_cupom: string
          numero_formatado: string
          status: Database["public"]["Enums"]["status_cupom"] | null
          updated_at: string | null
          valor_compra: number | null
        }
        Insert: {
          bloco_id: string
          cliente_id?: string | null
          created_at?: string | null
          data_atribuicao?: string | null
          data_uso?: string | null
          id?: string
          lojista_id?: string | null
          numero_cupom: string
          numero_formatado: string
          status?: Database["public"]["Enums"]["status_cupom"] | null
          updated_at?: string | null
          valor_compra?: number | null
        }
        Update: {
          bloco_id?: string
          cliente_id?: string | null
          created_at?: string | null
          data_atribuicao?: string | null
          data_uso?: string | null
          id?: string
          lojista_id?: string | null
          numero_cupom?: string
          numero_formatado?: string
          status?: Database["public"]["Enums"]["status_cupom"] | null
          updated_at?: string | null
          valor_compra?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cupons_bloco_id_fkey"
            columns: ["bloco_id"]
            isOneToOne: false
            referencedRelation: "blocos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cupons_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      ganhadores_sorteios: {
        Row: {
          created_at: string | null
          cupom_id: string
          data_sorteio: string | null
          id: string
          numero_cupom: string
          observacoes: string | null
          premio: string
          valor_premio: number | null
        }
        Insert: {
          created_at?: string | null
          cupom_id: string
          data_sorteio?: string | null
          id?: string
          numero_cupom: string
          observacoes?: string | null
          premio: string
          valor_premio?: number | null
        }
        Update: {
          created_at?: string | null
          cupom_id?: string
          data_sorteio?: string | null
          id?: string
          numero_cupom?: string
          observacoes?: string | null
          premio?: string
          valor_premio?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ganhadores_sorteios_cupom_id_fkey"
            columns: ["cupom_id"]
            isOneToOne: false
            referencedRelation: "cupons"
            referencedColumns: ["id"]
          },
        ]
      }
      logs_atividade_admin: {
        Row: {
          acao: string
          admin_id: string
          created_at: string | null
          detalhes: Json | null
          id: string
          ip_address: unknown | null
          sucesso: boolean | null
          user_agent: string | null
        }
        Insert: {
          acao: string
          admin_id: string
          created_at?: string | null
          detalhes?: Json | null
          id?: string
          ip_address?: unknown | null
          sucesso?: boolean | null
          user_agent?: string | null
        }
        Update: {
          acao?: string
          admin_id?: string
          created_at?: string | null
          detalhes?: Json | null
          id?: string
          ip_address?: unknown | null
          sucesso?: boolean | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logs_atividade_admin_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "usuarios_admin"
            referencedColumns: ["id"]
          },
        ]
      }
      logs_sistema: {
        Row: {
          contexto: Json | null
          created_at: string | null
          descricao: string | null
          evento: string
          id: string
          ip_address: unknown | null
          nivel: string | null
          user_agent: string | null
          usuario_id: string | null
        }
        Insert: {
          contexto?: Json | null
          created_at?: string | null
          descricao?: string | null
          evento: string
          id?: string
          ip_address?: unknown | null
          nivel?: string | null
          user_agent?: string | null
          usuario_id?: string | null
        }
        Update: {
          contexto?: Json | null
          created_at?: string | null
          descricao?: string | null
          evento?: string
          id?: string
          ip_address?: unknown | null
          nivel?: string | null
          user_agent?: string | null
          usuario_id?: string | null
        }
        Relationships: []
      }
      lojas: {
        Row: {
          ativo: boolean | null
          cidade: string | null
          cnpj: string | null
          created_at: string | null
          endereco: string | null
          estado: string | null
          id: string
          nome_loja: string
          segmento: string | null
          shopping: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ativo?: boolean | null
          cidade?: string | null
          cnpj?: string | null
          created_at?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome_loja: string
          segmento?: string | null
          shopping?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ativo?: boolean | null
          cidade?: string | null
          cnpj?: string | null
          created_at?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome_loja?: string
          segmento?: string | null
          shopping?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      pagamentos: {
        Row: {
          created_at: string | null
          data_pagamento: string | null
          forma_pagamento: Database["public"]["Enums"]["forma_pagamento"]
          id: string
          quantidade_blocos: number
          status: string | null
          status_pagamento: string | null
          valor: number
          venda_id: string
        }
        Insert: {
          created_at?: string | null
          data_pagamento?: string | null
          forma_pagamento: Database["public"]["Enums"]["forma_pagamento"]
          id?: string
          quantidade_blocos?: number
          status?: string | null
          status_pagamento?: string | null
          valor: number
          venda_id: string
        }
        Update: {
          created_at?: string | null
          data_pagamento?: string | null
          forma_pagamento?: Database["public"]["Enums"]["forma_pagamento"]
          id?: string
          quantidade_blocos?: number
          status?: string | null
          status_pagamento?: string | null
          valor?: number
          venda_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas_blocos"
            referencedColumns: ["id"]
          },
        ]
      }
      permissoes_sistema: {
        Row: {
          ativo: boolean | null
          categoria: string
          codigo: string
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          categoria: string
          codigo: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          categoria?: string
          codigo?: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          nome: string | null
          telefone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          nome?: string | null
          telefone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          nome?: string | null
          telefone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      segmentos: {
        Row: {
          categoria: string | null
          created_at: string | null
          id: string
          nome: string
        }
        Insert: {
          categoria?: string | null
          created_at?: string | null
          id?: string
          nome: string
        }
        Update: {
          categoria?: string | null
          created_at?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      usuarios_admin: {
        Row: {
          ativo: boolean | null
          bloqueado_ate: string | null
          created_at: string | null
          criado_por: string | null
          email: string
          id: string
          nome: string
          observacoes: string | null
          perfil: string | null
          permissoes: Json | null
          senha_hash: string | null
          status: string | null
          tentativas_login_falhadas: number | null
          ultimo_login: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          ativo?: boolean | null
          bloqueado_ate?: string | null
          created_at?: string | null
          criado_por?: string | null
          email: string
          id?: string
          nome: string
          observacoes?: string | null
          perfil?: string | null
          permissoes?: Json | null
          senha_hash?: string | null
          status?: string | null
          tentativas_login_falhadas?: number | null
          ultimo_login?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          ativo?: boolean | null
          bloqueado_ate?: string | null
          created_at?: string | null
          criado_por?: string | null
          email?: string
          id?: string
          nome?: string
          observacoes?: string | null
          perfil?: string | null
          permissoes?: Json | null
          senha_hash?: string | null
          status?: string | null
          tentativas_login_falhadas?: number | null
          ultimo_login?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_admin_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios_admin"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios_lojistas: {
        Row: {
          ativo: boolean | null
          bloqueado_ate: string | null
          created_at: string | null
          email: string
          id: string
          nome: string
          senha_hash: string | null
          telefone: string | null
          tentativas_login_falhadas: number | null
          ultimo_login: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          bloqueado_ate?: string | null
          created_at?: string | null
          email: string
          id?: string
          nome: string
          senha_hash?: string | null
          telefone?: string | null
          tentativas_login_falhadas?: number | null
          ultimo_login?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          bloqueado_ate?: string | null
          created_at?: string | null
          email?: string
          id?: string
          nome?: string
          senha_hash?: string | null
          telefone?: string | null
          tentativas_login_falhadas?: number | null
          ultimo_login?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      vendas_blocos: {
        Row: {
          bloco_id: string
          created_at: string | null
          data_venda: string | null
          forma_pagamento: Database["public"]["Enums"]["forma_pagamento"]
          id: string
          lojista_id: string
          observacoes: string | null
          quantidade_blocos: number
          quantidade_cupons: number
          valor_total: number
        }
        Insert: {
          bloco_id: string
          created_at?: string | null
          data_venda?: string | null
          forma_pagamento: Database["public"]["Enums"]["forma_pagamento"]
          id?: string
          lojista_id: string
          observacoes?: string | null
          quantidade_blocos?: number
          quantidade_cupons: number
          valor_total: number
        }
        Update: {
          bloco_id?: string
          created_at?: string | null
          data_venda?: string | null
          forma_pagamento?: Database["public"]["Enums"]["forma_pagamento"]
          id?: string
          lojista_id?: string
          observacoes?: string | null
          quantidade_blocos?: number
          quantidade_cupons?: number
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "vendas_blocos_bloco_id_fkey"
            columns: ["bloco_id"]
            isOneToOne: false
            referencedRelation: "blocos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      analise_demanda_cupons: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      analise_padroes_temporais: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      atribuir_cupons_para_cliente: {
        Args: {
          p_cliente_id: string
          p_quantidade: number
          p_valor_compra?: number
        }
        Returns: Json
      }
      buscar_detalhes_bloco: {
        Args: { p_numero_bloco: string }
        Returns: Json
      }
      buscar_lojas_usuario: {
        Args: { p_usuario_id: string }
        Returns: Json
      }
      buscar_lojas_usuario_auth: {
        Args: Record<PropertyKey, never>
        Returns: {
          ativo: boolean
          cidade: string
          cnpj: string
          created_at: string
          endereco: string
          id: string
          nome_loja: string
          segmento: string
          shopping: string
          updated_at: string
        }[]
      }
      consultar_logs_auditoria: {
        Args: {
          p_busca?: string
          p_data_fim?: string
          p_data_inicio?: string
          p_nivel?: string
          p_tabela?: string
        }
        Returns: {
          contexto: Json
          created_at: string
          descricao: string
          evento: string
          id: string
          ip_address: unknown
          nivel: string
          user_agent: string
          usuario_id: string
        }[]
      }
      criar_admin_completo: {
        Args: {
          p_criado_por?: string
          p_email: string
          p_nome: string
          p_perfil?: string
          p_permissoes?: Json
        }
        Returns: Json
      }
      criar_blocos_pool: {
        Args: { p_cupons_por_bloco?: number; p_quantidade: number }
        Returns: Json
      }
      criar_loja_apos_signup: {
        Args: {
          p_cidade: string
          p_cnpj: string
          p_endereco?: string
          p_nome_loja: string
          p_segmento?: string
          p_shopping?: string
        }
        Returns: Json
      }
      dummy_function: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_dashboard_metrics_optimized: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
      metricas_tempo_real: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      relatorio_utilizacao_blocos: {
        Args: Record<PropertyKey, never>
        Returns: {
          bloco_id: string
          cupons_totais: number
          cupons_usados: number
          lojista_nome: string
          numero_bloco: string
          percentual_uso: number
          ultima_atividade: string
        }[]
      }
      validar_login_admin: {
        Args: { p_email: string; p_senha: string }
        Returns: Json
      }
      validar_login_admin_completo: {
        Args: { p_email: string; p_senha: string }
        Returns: Json
      }
      vender_blocos_para_lojista_v2: {
        Args: {
          p_forma_pagamento: Database["public"]["Enums"]["forma_pagamento"]
          p_lojista_id: string
          p_quantidade: number
          p_valor_total: number
          p_vendedor_nome?: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      forma_pagamento: "dinheiro" | "pix" | "cartao_credito" | "cartao_debito"
      status_bloco: "disponivel" | "em_uso" | "vendido"
      status_cliente: "ativo" | "inativo" | "suspenso"
      status_cupom: "disponivel" | "atribuido" | "usado" | "expirado"
      status_sorteio: "agendado" | "em_andamento" | "finalizado" | "cancelado"
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
      app_role: ["admin", "moderator", "user"],
      forma_pagamento: ["dinheiro", "pix", "cartao_credito", "cartao_debito"],
      status_bloco: ["disponivel", "em_uso", "vendido"],
      status_cliente: ["ativo", "inativo", "suspenso"],
      status_cupom: ["disponivel", "atribuido", "usado", "expirado"],
      status_sorteio: ["agendado", "em_andamento", "finalizado", "cancelado"],
    },
  },
} as const
