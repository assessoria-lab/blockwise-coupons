// Types for the Block-based Coupon System
// These types match the expected Supabase database structure

export interface Bloco {
  id: string; // UUID
  identificador: string; // Format: BL20241224_000001
  status: 'disponivel_venda' | 'vendido';
  lojista_id?: string; // UUID, null when in pool
  criado_em: string; // ISO timestamp
  vendido_em?: string; // ISO timestamp
}

export interface Cupom {
  id: string; // UUID
  bloco_id: string; // UUID - references Bloco
  numero_sequencial: number; // Global unique sequence
  numero_formatado: string; // Format: CP000001000001
  status: 'disponivel_venda' | 'nao_atribuido' | 'atribuido';
  cliente_id?: string; // UUID, null when not assigned
  lojista_id?: string; // UUID, null when in pool
  criado_em: string; // ISO timestamp
  atribuido_em?: string; // ISO timestamp
}

export interface Lojista {
  id: string; // UUID
  nome: string;
  email: string;
  telefone?: string;
  endereco?: string;
  ativo: boolean;
  criado_em: string; // ISO timestamp
}

export interface Cliente {
  id: string; // UUID
  nome: string;
  email: string;
  telefone?: string;
  cpf?: string;
  ativo: boolean;
  criado_em: string; // ISO timestamp
}

// Dashboard Metrics Types
export interface DashboardMetrics {
  blocos_disponiveis: number;
  blocos_com_lojistas: number;
  cupons_nao_atribuidos: number;
  cupons_atribuidos: number;
  blocos_vendidos_hoje: number;
  cupons_atribuidos_hoje: number;
}

export interface SequenceStats {
  primeiro_numero: number;
  ultimo_numero: number;
  total_unicos: number;
  proximo_disponivel: number;
  integridade_ok: boolean;
  capacidade_maxima: {
    cupons_suportados: number;
  };
}

// API Response Types
export interface CreateBlocosResponse {
  sucesso: boolean;
  mensagem: string;
  blocos_criados?: number;
  cupons_criados?: number;
}

export interface VendaBlocoRequest {
  lojista_id: string;
  quantidade_blocos: number;
}

export interface AtribuirCuponsRequest {
  lojista_id: string;
  cliente_id: string;
  quantidade_cupons: number; // Should be based on purchase value
  valor_compra: number;
}

// Filter and Search Types
export interface BlocoFilter {
  status?: 'disponivel_venda' | 'vendido';
  lojista_id?: string;
  data_inicio?: string;
  data_fim?: string;
}

export interface CupomFilter {
  status?: 'disponivel_venda' | 'nao_atribuido' | 'atribuido';
  lojista_id?: string;
  cliente_id?: string;
  data_inicio?: string;
  data_fim?: string;
}

// Sorteio Types (for future implementation)
export interface Sorteio {
  id: string; // UUID
  nome: string;
  descricao?: string;
  data_sorteio: string; // ISO timestamp
  status: 'agendado' | 'em_andamento' | 'finalizado' | 'cancelado';
  premio: string;
  valor_premio?: number;
  cupons_participantes?: number;
  cupom_vencedor_id?: string;
  criado_em: string;
}

export interface SorteioResultado {
  id: string; // UUID
  sorteio_id: string; // UUID
  cupom_id: string; // UUID
  cliente_id: string; // UUID
  posicao: number; // 1st, 2nd, 3rd place, etc.
  premio: string;
  valor_premio?: number;
  criado_em: string;
}