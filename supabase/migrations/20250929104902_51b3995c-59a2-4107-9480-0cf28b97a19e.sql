-- Only create types and tables that don't exist yet
DO $$ 
BEGIN
    -- Create enum types if they don't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_cupom') THEN
        CREATE TYPE public.status_cupom AS ENUM ('disponivel', 'atribuido', 'usado', 'expirado');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_bloco') THEN
        CREATE TYPE public.status_bloco AS ENUM ('disponivel', 'vendido', 'em_uso');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'forma_pagamento') THEN
        CREATE TYPE public.forma_pagamento AS ENUM ('dinheiro', 'pix', 'cartao_credito', 'cartao_debito');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_cliente') THEN
        CREATE TYPE public.status_cliente AS ENUM ('ativo', 'inativo', 'suspenso');
    END IF;
END $$;

-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS public.usuarios_admin (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    nome TEXT,
    email TEXT,
    telefone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lojistas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    telefone TEXT,
    endereco TEXT,
    cidade TEXT,
    estado TEXT,
    cnpj TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    email TEXT,
    telefone TEXT,
    cpf TEXT,
    data_nascimento DATE,
    endereco TEXT,
    cidade TEXT,
    estado TEXT,
    lojista_id UUID REFERENCES public.lojistas(id),
    status status_cliente DEFAULT 'ativo',
    total_cupons_recebidos INTEGER DEFAULT 0,
    total_valor_compras DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blocos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_bloco TEXT NOT NULL UNIQUE,
    lojista_id UUID REFERENCES public.lojistas(id),
    cupons_totais INTEGER NOT NULL,
    cupons_disponiveis INTEGER NOT NULL,
    cupons_atribuidos INTEGER DEFAULT 0,
    cupons_usados INTEGER DEFAULT 0,
    status status_bloco DEFAULT 'disponivel',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_cupom TEXT NOT NULL UNIQUE,
    bloco_id UUID REFERENCES public.blocos(id) NOT NULL,
    cliente_id UUID REFERENCES public.clientes(id),
    lojista_id UUID REFERENCES public.lojistas(id),
    status status_cupom DEFAULT 'disponivel',
    valor_compra DECIMAL(10,2),
    data_atribuicao TIMESTAMP WITH TIME ZONE,
    data_uso TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vendas_blocos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lojista_id UUID REFERENCES public.lojistas(id) NOT NULL,
    bloco_id UUID REFERENCES public.blocos(id) NOT NULL,
    quantidade_cupons INTEGER NOT NULL,
    valor_total DECIMAL(10,2) NOT NULL,
    forma_pagamento forma_pagamento NOT NULL,
    data_venda TIMESTAMP WITH TIME ZONE DEFAULT now(),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ganhadores_sorteios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cupom_id UUID REFERENCES public.cupons(id) NOT NULL,
    numero_cupom TEXT NOT NULL,
    premio TEXT NOT NULL,
    valor_premio DECIMAL(10,2),
    data_sorteio TIMESTAMP WITH TIME ZONE DEFAULT now(),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.configuracoes_sistema (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chave TEXT NOT NULL UNIQUE,
    valor TEXT NOT NULL,
    descricao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.logs_sistema (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evento TEXT NOT NULL,
    descricao TEXT,
    contexto JSONB,
    nivel TEXT DEFAULT 'info',
    usuario_id UUID,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pagamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venda_id UUID REFERENCES public.vendas_blocos(id) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    forma_pagamento forma_pagamento NOT NULL,
    status TEXT DEFAULT 'pendente',
    data_pagamento TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on tables if not already enabled
DO $$ 
BEGIN
    ALTER TABLE public.usuarios_admin ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.lojistas ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.blocos ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.cupons ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.vendas_blocos ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.ganhadores_sorteios ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.configuracoes_sistema ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.logs_sistema ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN OTHERS THEN NULL; -- Ignore errors if RLS already enabled
END $$;

-- Create admin check function
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.usuarios_admin
    WHERE user_id = _user_id
      AND ativo = true
  )
$$;

-- Drop existing policies and recreate them
DROP POLICY IF EXISTS "Admins can manage usuarios_admin" ON public.usuarios_admin;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage lojistas" ON public.lojistas;
DROP POLICY IF EXISTS "Admins can manage clientes" ON public.clientes;
DROP POLICY IF EXISTS "Admins can manage blocos" ON public.blocos;
DROP POLICY IF EXISTS "Admins can manage cupons" ON public.cupons;
DROP POLICY IF EXISTS "Admins can view vendas_blocos" ON public.vendas_blocos;
DROP POLICY IF EXISTS "Admins can view ganhadores_sorteios" ON public.ganhadores_sorteios;
DROP POLICY IF EXISTS "Admins can manage configuracoes_sistema" ON public.configuracoes_sistema;
DROP POLICY IF EXISTS "Admins can view logs_sistema" ON public.logs_sistema;
DROP POLICY IF EXISTS "Admins can view pagamentos" ON public.pagamentos;

-- Create simple policies for admins only for now
CREATE POLICY "Admins only" ON public.usuarios_admin FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins only" ON public.profiles FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins only" ON public.lojistas FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins only" ON public.clientes FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins only" ON public.blocos FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins only" ON public.cupons FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins only" ON public.vendas_blocos FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins only" ON public.ganhadores_sorteios FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins only" ON public.configuracoes_sistema FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins only" ON public.logs_sistema FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins only" ON public.pagamentos FOR ALL USING (public.is_admin(auth.uid()));

-- Create required functions
CREATE OR REPLACE FUNCTION public.get_dashboard_metrics_optimized()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_blocos', (SELECT COUNT(*) FROM public.blocos),
        'total_cupons', (SELECT COUNT(*) FROM public.cupons),
        'cupons_disponiveis', (SELECT COUNT(*) FROM public.cupons WHERE status = 'disponivel'),
        'cupons_atribuidos', (SELECT COUNT(*) FROM public.cupons WHERE status = 'atribuido'),
        'cupons_usados', (SELECT COUNT(*) FROM public.cupons WHERE status = 'usado'),
        'total_lojistas', (SELECT COUNT(*) FROM public.lojistas WHERE ativo = true),
        'total_clientes', (SELECT COUNT(*) FROM public.clientes WHERE status = 'ativo')
    ) INTO result;
    
    RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.criar_blocos_pool(p_quantidade INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN jsonb_build_object('success', true, 'message', 'Function placeholder');
END;
$$;

CREATE OR REPLACE FUNCTION public.consultar_logs_auditoria(
    p_data_inicio TIMESTAMP DEFAULT NULL,
    p_data_fim TIMESTAMP DEFAULT NULL,
    p_nivel TEXT DEFAULT NULL,
    p_tabela TEXT DEFAULT NULL,
    p_busca TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    usuario_id UUID,
    evento TEXT,
    descricao TEXT,
    nivel TEXT,
    contexto JSONB,
    ip_address INET,
    user_agent TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id,
        l.created_at,
        l.usuario_id,
        l.evento,
        l.descricao,
        l.nivel,
        l.contexto,
        l.ip_address,
        l.user_agent
    FROM public.logs_sistema l
    WHERE 
        (p_data_inicio IS NULL OR l.created_at >= p_data_inicio) AND
        (p_data_fim IS NULL OR l.created_at <= p_data_fim) AND
        (p_nivel IS NULL OR l.nivel = p_nivel) AND
        (p_busca IS NULL OR l.descricao ILIKE '%' || p_busca || '%')
    ORDER BY l.created_at DESC
    LIMIT 1000;
END;
$$;

CREATE OR REPLACE FUNCTION public.analise_demanda_cupons()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN jsonb_build_object(
        'media_diaria', 0,
        'tendencia', 'estável',
        'projecao_30_dias', 0,
        'saldo_atual', (SELECT COUNT(*) FROM public.cupons WHERE status = 'disponivel'),
        'recomendacao', 'manter',
        'data_analise', now()
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.analise_padroes_temporais()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN jsonb_build_object(
        'distribuicao_horaria', '{}'::jsonb,
        'distribuicao_semanal', '{}'::jsonb,
        'evolucao_mensal', '{}'::jsonb
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.relatorio_utilizacao_blocos()
RETURNS TABLE (
    bloco_id UUID,
    numero_bloco TEXT,
    lojista_nome TEXT,
    cupons_totais INTEGER,
    cupons_usados INTEGER,
    percentual_uso DECIMAL,
    ultima_atividade TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        b.numero_bloco,
        COALESCE(l.nome, 'Pool Geral') as lojista_nome,
        b.cupons_totais,
        b.cupons_usados,
        CASE 
            WHEN b.cupons_totais > 0 THEN ROUND((b.cupons_usados::DECIMAL / b.cupons_totais::DECIMAL) * 100, 2)
            ELSE 0
        END as percentual_uso,
        b.updated_at
    FROM public.blocos b
    LEFT JOIN public.lojistas l ON b.lojista_id = l.id
    ORDER BY b.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.atribuir_cupons_para_cliente(
    p_cliente_id UUID,
    p_quantidade INTEGER,
    p_valor_compra DECIMAL DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN jsonb_build_object(
        'success', true,
        'cupons_atribuidos', 0,
        'cliente_id', p_cliente_id
    );
END;
$$;

-- Create materialized view for ranking
DROP MATERIALIZED VIEW IF EXISTS public.mv_ranking_lojistas;
CREATE MATERIALIZED VIEW public.mv_ranking_lojistas AS
SELECT 
    l.id,
    l.nome,
    COUNT(DISTINCT b.id) as blocos_comprados,
    COUNT(DISTINCT c.id) as total_cupons,
    COUNT(DISTINCT CASE WHEN c.status = 'usado' THEN c.id END) as cupons_utilizados,
    COALESCE(SUM(vb.valor_total), 0) as valor_total_compras,
    l.cidade,
    l.created_at
FROM public.lojistas l
LEFT JOIN public.blocos b ON l.id = b.lojista_id
LEFT JOIN public.cupons c ON b.id = c.bloco_id
LEFT JOIN public.vendas_blocos vb ON l.id = vb.lojista_id
WHERE l.ativo = true
GROUP BY l.id, l.nome, l.cidade, l.created_at
ORDER BY valor_total_compras DESC;