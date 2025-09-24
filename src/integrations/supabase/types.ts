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
          {
            foreignKeyName: "blocos_lojista_id_fkey"
            columns: ["lojista_id"]
            isOneToOne: false
            referencedRelation: "mv_ranking_lojistas"
            referencedColumns: ["lojista_id"]
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
          cidade: string | null
          cpf: string
          created_at: string
          data_primeiro_cupom: string | null
          email: string | null
          id: string
          nome: string
          observacoes: string | null
          status: string | null
          telefone: string | null
          total_cupons_recebidos: number | null
          total_valor_compras: number | null
          updated_at: string
        }
        Insert: {
          cidade?: string | null
          cpf: string
          created_at?: string
          data_primeiro_cupom?: string | null
          email?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          status?: string | null
          telefone?: string | null
          total_cupons_recebidos?: number | null
          total_valor_compras?: number | null
          updated_at?: string
        }
        Update: {
          cidade?: string | null
          cpf?: string
          created_at?: string
          data_primeiro_cupom?: string | null
          email?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          status?: string | null
          telefone?: string | null
          total_cupons_recebidos?: number | null
          total_valor_compras?: number | null
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
          {
            foreignKeyName: "cupons_lojista_id_fkey"
            columns: ["lojista_id"]
            isOneToOne: false
            referencedRelation: "mv_ranking_lojistas"
            referencedColumns: ["lojista_id"]
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
          data_cadastro: string | null
          data_ultima_compra: string | null
          data_ultimo_acesso: string | null
          ddd: string | null
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          nome_loja: string
          nome_responsavel: string | null
          observacoes: string | null
          responsavel_nome: string | null
          responsavel_telefone: string | null
          status: string
          telefone: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          cidade: string
          cnpj: string
          created_at?: string
          cupons_nao_atribuidos?: number
          data_cadastro?: string | null
          data_ultima_compra?: string | null
          data_ultimo_acesso?: string | null
          ddd?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome_loja: string
          nome_responsavel?: string | null
          observacoes?: string | null
          responsavel_nome?: string | null
          responsavel_telefone?: string | null
          status?: string
          telefone?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          cidade?: string
          cnpj?: string
          created_at?: string
          cupons_nao_atribuidos?: number
          data_cadastro?: string | null
          data_ultima_compra?: string | null
          data_ultimo_acesso?: string | null
          ddd?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome_loja?: string
          nome_responsavel?: string | null
          observacoes?: string | null
          responsavel_nome?: string | null
          responsavel_telefone?: string | null
          status?: string
          telefone?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      pagamentos: {
        Row: {
          created_at: string | null
          dados_pagamento: Json | null
          data_aprovacao: string | null
          data_expiracao: string | null
          data_solicitacao: string | null
          forma_pagamento: string
          id: string
          lojista_id: string
          observacoes: string | null
          quantidade_blocos: number
          referencia_externa: string | null
          status_pagamento: string | null
          updated_at: string | null
          valor: number
        }
        Insert: {
          created_at?: string | null
          dados_pagamento?: Json | null
          data_aprovacao?: string | null
          data_expiracao?: string | null
          data_solicitacao?: string | null
          forma_pagamento: string
          id?: string
          lojista_id: string
          observacoes?: string | null
          quantidade_blocos: number
          referencia_externa?: string | null
          status_pagamento?: string | null
          updated_at?: string | null
          valor: number
        }
        Update: {
          created_at?: string | null
          dados_pagamento?: Json | null
          data_aprovacao?: string | null
          data_expiracao?: string | null
          data_solicitacao?: string | null
          forma_pagamento?: string
          id?: string
          lojista_id?: string
          observacoes?: string | null
          quantidade_blocos?: number
          referencia_externa?: string | null
          status_pagamento?: string | null
          updated_at?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_lojista_id_fkey"
            columns: ["lojista_id"]
            isOneToOne: false
            referencedRelation: "lojistas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_lojista_id_fkey"
            columns: ["lojista_id"]
            isOneToOne: false
            referencedRelation: "mv_ranking_lojistas"
            referencedColumns: ["lojista_id"]
          },
        ]
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
      transacoes_whatsapp: {
        Row: {
          created_at: string | null
          dados_processados: Json | null
          data_interacao: string | null
          erro_detalhes: string | null
          id: string
          lojista_id: string | null
          mensagem_enviada: string | null
          mensagem_resposta: string | null
          numero_whatsapp: string
          status_processamento: string | null
          tempo_processamento_ms: number | null
          tipo_interacao: string
        }
        Insert: {
          created_at?: string | null
          dados_processados?: Json | null
          data_interacao?: string | null
          erro_detalhes?: string | null
          id?: string
          lojista_id?: string | null
          mensagem_enviada?: string | null
          mensagem_resposta?: string | null
          numero_whatsapp: string
          status_processamento?: string | null
          tempo_processamento_ms?: number | null
          tipo_interacao: string
        }
        Update: {
          created_at?: string | null
          dados_processados?: Json | null
          data_interacao?: string | null
          erro_detalhes?: string | null
          id?: string
          lojista_id?: string | null
          mensagem_enviada?: string | null
          mensagem_resposta?: string | null
          numero_whatsapp?: string
          status_processamento?: string | null
          tempo_processamento_ms?: number | null
          tipo_interacao?: string
        }
        Relationships: [
          {
            foreignKeyName: "transacoes_whatsapp_lojista_id_fkey"
            columns: ["lojista_id"]
            isOneToOne: false
            referencedRelation: "lojistas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_whatsapp_lojista_id_fkey"
            columns: ["lojista_id"]
            isOneToOne: false
            referencedRelation: "mv_ranking_lojistas"
            referencedColumns: ["lojista_id"]
          },
        ]
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
      usuarios_admin: {
        Row: {
          created_at: string | null
          data_bloqueio: string | null
          email: string
          id: string
          nivel_permissao: string | null
          nome: string
          observacoes: string | null
          senha_hash: string
          status: string | null
          tentativas_login: number | null
          ultimo_login: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data_bloqueio?: string | null
          email: string
          id?: string
          nivel_permissao?: string | null
          nome: string
          observacoes?: string | null
          senha_hash: string
          status?: string | null
          tentativas_login?: number | null
          ultimo_login?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data_bloqueio?: string | null
          email?: string
          id?: string
          nivel_permissao?: string | null
          nome?: string
          observacoes?: string | null
          senha_hash?: string
          status?: string | null
          tentativas_login?: number | null
          ultimo_login?: string | null
          updated_at?: string | null
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
          {
            foreignKeyName: "vendas_blocos_lojista_id_fkey"
            columns: ["lojista_id"]
            isOneToOne: false
            referencedRelation: "mv_ranking_lojistas"
            referencedColumns: ["lojista_id"]
          },
        ]
      }
    }
    Views: {
      mv_dashboard_blocos: {
        Row: {
          blocos_com_lojistas: number | null
          blocos_pool_geral: number | null
          blocos_vendidos_hoje: number | null
          cupons_atribuidos: number | null
          cupons_atribuidos_hoje: number | null
          cupons_nao_atribuidos: number | null
          ultima_atualizacao: string | null
        }
        Relationships: []
      }
      mv_historico_cupons: {
        Row: {
          cidade_cliente: string | null
          cidade_loja: string | null
          cpf_cliente: string | null
          data_atribuicao: string | null
          data_criacao: string | null
          id: string | null
          mes_atribuicao: string | null
          nome_cliente: string | null
          nome_loja: string | null
          numero_bloco: string | null
          numero_cupom: string | null
          semana_atribuicao: string | null
          status: string | null
          ultima_atualizacao: string | null
          valor_compra: number | null
        }
        Relationships: []
      }
      mv_ranking_lojistas: {
        Row: {
          cidade: string | null
          clientes_unicos_atendidos: number | null
          cupons_disponiveis_lojista: number | null
          lojista_id: string | null
          nome_loja: string | null
          ranking_cupons: number | null
          ranking_vendas: number | null
          total_cupons_atribuidos: number | null
          ultima_atribuicao: string | null
          ultima_atualizacao: string | null
          volume_vendas_geradas: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      atribuir_cupons_para_cliente: {
        Args:
          | {
              p_cliente_cpf: string
              p_cliente_nome: string
              p_cliente_telefone: string
              p_lojista_id: string
              p_valor_compra: number
            }
          | {
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
      consultar_saldo_lojista: {
        Args: { p_whatsapp_lojista: string }
        Returns: Json
      }
      criar_blocos_pool: {
        Args: { p_quantidade_blocos: number }
        Returns: Json
      }
      get_dashboard_metrics: {
        Args: Record<PropertyKey, never>
        Returns: {
          blocos_com_lojistas: number
          blocos_pool_geral: number
          blocos_vendidos_hoje: number
          cupons_atribuidos: number
          cupons_atribuidos_hoje: number
          cupons_nao_atribuidos: number
          ultima_atualizacao: string
        }[]
      }
      get_historico_cupons: {
        Args: {
          p_data_fim?: string
          p_data_inicio?: string
          p_limite?: number
          p_lojista_id?: string
        }
        Returns: {
          cidade_cliente: string
          cidade_loja: string
          cpf_cliente: string
          data_atribuicao: string
          data_criacao: string
          id: string
          mes_atribuicao: string
          nome_cliente: string
          nome_loja: string
          numero_bloco: string
          numero_cupom: string
          semana_atribuicao: string
          status: string
          valor_compra: number
        }[]
      }
      get_ranking_lojistas: {
        Args: Record<PropertyKey, never>
        Returns: {
          cidade: string
          clientes_unicos_atendidos: number
          cupons_disponiveis_lojista: number
          lojista_id: string
          nome_loja: string
          ranking_cupons: number
          ranking_vendas: number
          total_cupons_atribuidos: number
          ultima_atribuicao: string
          ultima_atualizacao: string
          volume_vendas_geradas: number
        }[]
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
      refresh_dashboard_views: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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
      vender_blocos_para_lojista_v2: {
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
