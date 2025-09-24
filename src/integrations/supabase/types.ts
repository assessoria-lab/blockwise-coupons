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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      apl_alana: {
        Row: {
          content: string | null
          embedding: string | null
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Relationships: []
      }
      audios: {
        Row: {
          audios: string | null
          created_at: string
          id: number
        }
        Insert: {
          audios?: string | null
          created_at?: string
          id?: number
        }
        Update: {
          audios?: string | null
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      blocos: {
        Row: {
          created_at: string | null
          cupons_atribuidos: number | null
          cupons_disponiveis: number | null
          cupons_no_bloco: number | null
          data_venda: string | null
          id: string
          lojista_id: string | null
          lote_id: string | null
          numero_bloco: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          cupons_atribuidos?: number | null
          cupons_disponiveis?: number | null
          cupons_no_bloco?: number | null
          data_venda?: string | null
          id?: string
          lojista_id?: string | null
          lote_id?: string | null
          numero_bloco: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          cupons_atribuidos?: number | null
          cupons_disponiveis?: number | null
          cupons_no_bloco?: number | null
          data_venda?: string | null
          id?: string
          lojista_id?: string | null
          lote_id?: string | null
          numero_bloco?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blocos_lojista_id_fkey"
            columns: ["lojista_id"]
            isOneToOne: false
            referencedRelation: "lojistas"
            referencedColumns: ["id"]
          },
        ]
      }
      caroline_veras_follow_up: {
        Row: {
          created_at: string
          desejo: string | null
          etapa: number | null
          id: number
          nome: string | null
          number: string | null
          ultimaMensagem: string | null
        }
        Insert: {
          created_at?: string
          desejo?: string | null
          etapa?: number | null
          id?: number
          nome?: string | null
          number?: string | null
          ultimaMensagem?: string | null
        }
        Update: {
          created_at?: string
          desejo?: string | null
          etapa?: number | null
          id?: number
          nome?: string | null
          number?: string | null
          ultimaMensagem?: string | null
        }
        Relationships: []
      }
      clientes: {
        Row: {
          cpf: string
          created_at: string
          email: string | null
          id: string
          nome: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          cpf: string
          created_at?: string
          email?: string | null
          id?: string
          nome: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          cpf?: string
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      configuracoes_sistema: {
        Row: {
          categoria: string | null
          chave: string
          created_at: string | null
          descricao: string | null
          id: string
          tipo: string | null
          updated_at: string | null
          valor: string
        }
        Insert: {
          categoria?: string | null
          chave: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          tipo?: string | null
          updated_at?: string | null
          valor: string
        }
        Update: {
          categoria?: string | null
          chave?: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          tipo?: string | null
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
          numero_cupom: number
          numero_formatado: string | null
          status: string | null
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
          numero_cupom?: number
          numero_formatado?: string | null
          status?: string | null
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
          numero_cupom?: number
          numero_formatado?: string | null
          status?: string | null
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
          {
            foreignKeyName: "cupons_lojista_id_fkey"
            columns: ["lojista_id"]
            isOneToOne: false
            referencedRelation: "lojistas"
            referencedColumns: ["id"]
          },
        ]
      }
      delbo_sophia: {
        Row: {
          content: string | null
          embedding: string | null
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Relationships: []
      }
      disparo_apl_maria: {
        Row: {
          created_at: string
          desejo: string | null
          etapa: number | null
          id: number
          instancia: string | null
          nome: string | null
          number: string | null
          ultimaMensagem: string | null
        }
        Insert: {
          created_at?: string
          desejo?: string | null
          etapa?: number | null
          id?: number
          instancia?: string | null
          nome?: string | null
          number?: string | null
          ultimaMensagem?: string | null
        }
        Update: {
          created_at?: string
          desejo?: string | null
          etapa?: number | null
          id?: number
          instancia?: string | null
          nome?: string | null
          number?: string | null
          ultimaMensagem?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          content: string | null
          embedding: string | null
          fts: unknown | null
          id: number
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          fts?: unknown | null
          id?: never
        }
        Update: {
          content?: string | null
          embedding?: string | null
          fts?: unknown | null
          id?: never
        }
        Relationships: []
      }
      embeddings_diarios: {
        Row: {
          conteudo: string
          criado_em: string | null
          data: string
          embedding: string | null
          id: string
          metadados: Json | null
        }
        Insert: {
          conteudo: string
          criado_em?: string | null
          data: string
          embedding?: string | null
          id?: string
          metadados?: Json | null
        }
        Update: {
          conteudo?: string
          criado_em?: string | null
          data?: string
          embedding?: string | null
          id?: string
          metadados?: Json | null
        }
        Relationships: []
      }
      followup_rafaela_conecta: {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      h_hospedagem: {
        Row: {
          content: string | null
          embedding: string | null
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Relationships: []
      }
      jose_alberto: {
        Row: {
          content: string | null
          embedding: string | null
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Relationships: []
      }
      logs_sistema: {
        Row: {
          created_at: string | null
          dados_contexto: Json | null
          descricao: string | null
          evento: string
          id: string
          ip_address: unknown | null
          nivel: string | null
          user_agent: string | null
          usuario_email: string | null
          usuario_id: string | null
        }
        Insert: {
          created_at?: string | null
          dados_contexto?: Json | null
          descricao?: string | null
          evento: string
          id?: string
          ip_address?: unknown | null
          nivel?: string | null
          user_agent?: string | null
          usuario_email?: string | null
          usuario_id?: string | null
        }
        Update: {
          created_at?: string | null
          dados_contexto?: Json | null
          descricao?: string | null
          evento?: string
          id?: string
          ip_address?: unknown | null
          nivel?: string | null
          user_agent?: string | null
          usuario_email?: string | null
          usuario_id?: string | null
        }
        Relationships: []
      }
      lojistas: {
        Row: {
          cidade: string
          cnpj: string
          created_at: string
          cupons_nao_atribuidos: number
          email: string | null
          endereco: string | null
          id: string
          nome_loja: string
          responsavel_nome: string | null
          responsavel_telefone: string | null
          status: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          cidade: string
          cnpj: string
          created_at?: string
          cupons_nao_atribuidos?: number
          email?: string | null
          endereco?: string | null
          id?: string
          nome_loja: string
          responsavel_nome?: string | null
          responsavel_telefone?: string | null
          status?: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          cidade?: string
          cnpj?: string
          created_at?: string
          cupons_nao_atribuidos?: number
          email?: string | null
          endereco?: string | null
          id?: string
          nome_loja?: string
          responsavel_nome?: string | null
          responsavel_telefone?: string | null
          status?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pereira_gouveia_roberta: {
        Row: {
          content: string | null
          embedding: string | null
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Relationships: []
      }
      query_history: {
        Row: {
          apenas_ativas: boolean | null
          capital_social_max: number | null
          capital_social_min: number | null
          cnae: string | null
          custo_api: number | null
          data_atividade_fim: string | null
          data_atividade_inicio: string | null
          estados: string | null
          id: number
          lista_disparo: boolean | null
          qtd_contatos: number | null
          timestamp: string | null
        }
        Insert: {
          apenas_ativas?: boolean | null
          capital_social_max?: number | null
          capital_social_min?: number | null
          cnae?: string | null
          custo_api?: number | null
          data_atividade_fim?: string | null
          data_atividade_inicio?: string | null
          estados?: string | null
          id?: number
          lista_disparo?: boolean | null
          qtd_contatos?: number | null
          timestamp?: string | null
        }
        Update: {
          apenas_ativas?: boolean | null
          capital_social_max?: number | null
          capital_social_min?: number | null
          cnae?: string | null
          custo_api?: number | null
          data_atividade_fim?: string | null
          data_atividade_inicio?: string | null
          estados?: string | null
          id?: number
          lista_disparo?: boolean | null
          qtd_contatos?: number | null
          timestamp?: string | null
        }
        Relationships: []
      }
      rb_5g: {
        Row: {
          content: string | null
          embedding: string | null
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      vendas_blocos: {
        Row: {
          created_at: string
          data_venda: string
          forma_pagamento: string
          id: string
          lojista_id: string
          quantidade_blocos: number
          valor_por_bloco: number
          valor_total: number
        }
        Insert: {
          created_at?: string
          data_venda?: string
          forma_pagamento: string
          id?: string
          lojista_id: string
          quantidade_blocos: number
          valor_por_bloco: number
          valor_total: number
        }
        Update: {
          created_at?: string
          data_venda?: string
          forma_pagamento?: string
          id?: string
          lojista_id?: string
          quantidade_blocos?: number
          valor_por_bloco?: number
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "vendas_blocos_lojista_id_fkey"
            columns: ["lojista_id"]
            isOneToOne: false
            referencedRelation: "lojistas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      atribuir_cupons_para_cliente: {
        Args: {
          p_cliente_cpf: string
          p_cliente_nome: string
          p_cliente_telefone: string
          p_lojista_id: string
          p_valor_compra: number
        }
        Returns: Json
      }
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      buscar_embeddings_similares: {
        Args: {
          data_filtro: string
          limite?: number
          limite_similaridade?: number
          query_embedding: string
        }
        Returns: {
          conteudo: string
          data: string
          id: string
          metadados: Json
          similaridade: number
        }[]
      }
      criar_blocos_pool: {
        Args: { p_quantidade_blocos: number }
        Returns: Json
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      hybrid_search: {
        Args: {
          full_text_weight?: number
          match_count: number
          query_embedding: string
          query_text: string
          rrf_k?: number
          semantic_weight?: number
        }
        Returns: {
          content: string | null
          embedding: string | null
          fts: unknown | null
          id: number
        }[]
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      log_sistema_evento: {
        Args: {
          p_dados_contexto?: Json
          p_descricao?: string
          p_evento: string
          p_ip_address?: unknown
          p_nivel?: string
          p_user_agent?: string
          p_usuario_email?: string
          p_usuario_id?: string
        }
        Returns: string
      }
      match_documents: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      match_documents_apl_alana: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      match_documents_delbo_sophia: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      match_documents_h_hospedagem: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      match_documents_jose_alberto: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      match_documents_rb_5g: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vender_blocos_para_lojista: {
        Args: {
          p_forma_pagamento: string
          p_lojista_id: string
          p_quantidade_blocos: number
          p_valor_total: number
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "gerente" | "operador" | "auditor"
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
      app_role: ["super_admin", "admin", "gerente", "operador", "auditor"],
    },
  },
} as const
