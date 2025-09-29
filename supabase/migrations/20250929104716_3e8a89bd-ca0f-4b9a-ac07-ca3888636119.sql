-- Create enum types
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.status_cupom AS ENUM ('disponivel', 'atribuido', 'usado', 'expirado');
CREATE TYPE public.status_bloco AS ENUM ('disponivel', 'vendido', 'em_uso');
CREATE TYPE public.forma_pagamento AS ENUM ('dinheiro', 'pix', 'cartao_credito', 'cartao_debito');
CREATE TYPE public.status_cliente AS ENUM ('ativo', 'inativo', 'suspenso');

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Create usuarios_admin table  
CREATE TABLE public.usuarios_admin (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    nome TEXT,
    email TEXT,
    telefone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create lojistas table
CREATE TABLE public.lojistas (
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

-- Create clientes table
CREATE TABLE public.clientes (
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

-- Create blocos table
CREATE TABLE public.blocos (
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

-- Create cupons table
CREATE TABLE public.cupons (
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

-- Create vendas_blocos table
CREATE TABLE public.vendas_blocos (
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

-- Create ganhadores_sorteios table
CREATE TABLE public.ganhadores_sorteios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cupom_id UUID REFERENCES public.cupons(id) NOT NULL,
    numero_cupom TEXT NOT NULL,
    premio TEXT NOT NULL,
    valor_premio DECIMAL(10,2),
    data_sorteio TIMESTAMP WITH TIME ZONE DEFAULT now(),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create configuracoes_sistema table
CREATE TABLE public.configuracoes_sistema (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chave TEXT NOT NULL UNIQUE,
    valor TEXT NOT NULL,
    descricao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create logs_sistema table
CREATE TABLE public.logs_sistema (
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

-- Create pagamentos table
CREATE TABLE public.pagamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venda_id UUID REFERENCES public.vendas_blocos(id) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    forma_pagamento forma_pagamento NOT NULL,
    status TEXT DEFAULT 'pendente',
    data_pagamento TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
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

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

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

-- Create simple RLS policies
CREATE POLICY "Admins can manage user_roles" ON public.user_roles
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage usuarios_admin" ON public.usuarios_admin
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can manage profiles" ON public.profiles
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage lojistas" ON public.lojistas
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage clientes" ON public.clientes
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage blocos" ON public.blocos
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage cupons" ON public.cupons
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view vendas_blocos" ON public.vendas_blocos
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view ganhadores_sorteios" ON public.ganhadores_sorteios
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage configuracoes_sistema" ON public.configuracoes_sistema
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view logs_sistema" ON public.logs_sistema
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view pagamentos" ON public.pagamentos
  FOR SELECT USING (public.is_admin(auth.uid()));

-- Create functions needed by the application
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

CREATE OR REPLACE FUNCTION public.criar_blocos_pool(
    p_quantidade INTEGER,
    p_cupons_por_bloco INTEGER DEFAULT 100
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    i INTEGER;
    j INTEGER;
    novo_bloco_id UUID;
    numero_bloco TEXT;
    numero_cupom TEXT;
BEGIN
    FOR i IN 1..p_quantidade LOOP
        numero_bloco := 'BL' || LPAD(i::TEXT, 6, '0');
        
        INSERT INTO public.blocos (numero_bloco, cupons_totais, cupons_disponiveis)
        VALUES (numero_bloco, p_cupons_por_bloco, p_cupons_por_bloco)
        RETURNING id INTO novo_bloco_id;
        
        FOR j IN 1..p_cupons_por_bloco LOOP
            numero_cupom := numero_bloco || '-' || LPAD(j::TEXT, 3, '0');
            
            INSERT INTO public.cupons (numero_cupom, bloco_id)
            VALUES (numero_cupom, novo_bloco_id);
        END LOOP;
    END LOOP;
    
    RETURN jsonb_build_object('success', true, 'blocos_criados', p_quantidade);
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
DECLARE
    result JSONB;
    media_diaria DECIMAL;
    tendencia TEXT;
    projecao_30_dias INTEGER;
BEGIN
    SELECT COALESCE(AVG(daily_count), 0) INTO media_diaria
    FROM (
        SELECT COUNT(*) as daily_count
        FROM public.cupons
        WHERE DATE(created_at) >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY DATE(created_at)
    ) daily_stats;
    
    tendencia := 'estável';
    projecao_30_dias := (media_diaria * 30)::INTEGER;
    
    result := jsonb_build_object(
        'media_diaria', media_diaria,
        'tendencia', tendencia,
        'projecao_30_dias', projecao_30_dias,
        'saldo_atual', (SELECT COUNT(*) FROM public.cupons WHERE status = 'disponivel'),
        'recomendacao', 'manter',
        'data_analise', now()
    );
    
    RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.analise_padroes_temporais()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
    padroes_horarios JSONB;
    padroes_semanais JSONB;
    padroes_mensais JSONB;
BEGIN
    SELECT jsonb_object_agg(hora::TEXT, total) INTO padroes_horarios
    FROM (
        SELECT EXTRACT(hour FROM created_at) as hora, COUNT(*) as total
        FROM public.cupons
        WHERE status = 'atribuido'
        GROUP BY EXTRACT(hour FROM created_at)
        ORDER BY hora
    ) hourly_data;
    
    SELECT jsonb_object_agg(dia_semana::TEXT, total) INTO padroes_semanais
    FROM (
        SELECT EXTRACT(dow FROM created_at) as dia_semana, COUNT(*) as total
        FROM public.cupons
        WHERE status = 'atribuido'
        GROUP BY EXTRACT(dow FROM created_at)
        ORDER BY dia_semana
    ) weekly_data;
    
    SELECT jsonb_object_agg(mes::TEXT, total) INTO padroes_mensais
    FROM (
        SELECT EXTRACT(month FROM created_at) as mes, COUNT(*) as total
        FROM public.cupons
        WHERE status = 'atribuido'
        GROUP BY EXTRACT(month FROM created_at)
        ORDER BY mes
    ) monthly_data;
    
    result := jsonb_build_object(
        'distribuicao_horaria', COALESCE(padroes_horarios, '{}'::jsonb),
        'distribuicao_semanal', COALESCE(padroes_semanais, '{}'::jsonb),
        'evolucao_mensal', COALESCE(padroes_mensais, '{}'::jsonb)
    );
    
    RETURN result;
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
DECLARE
    cupons_atribuidos INTEGER := 0;
    cupom_record RECORD;
BEGIN
    FOR cupom_record IN (
        SELECT id FROM public.cupons 
        WHERE status = 'disponivel' 
        ORDER BY created_at 
        LIMIT p_quantidade
    ) LOOP
        UPDATE public.cupons 
        SET 
            cliente_id = p_cliente_id,
            status = 'atribuido',
            valor_compra = p_valor_compra,
            data_atribuicao = now(),
            updated_at = now()
        WHERE id = cupom_record.id;
        
        cupons_atribuidos := cupons_atribuidos + 1;
    END LOOP;
    
    IF cupons_atribuidos > 0 THEN
        UPDATE public.clientes 
        SET 
            total_cupons_recebidos = total_cupons_recebidos + cupons_atribuidos,
            total_valor_compras = total_valor_compras + COALESCE(p_valor_compra, 0),
            updated_at = now()
        WHERE id = p_cliente_id;
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'cupons_atribuidos', cupons_atribuidos,
        'cliente_id', p_cliente_id
    );
END;
$$;

-- Create materialized view for ranking
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

-- Create indexes for performance
CREATE INDEX idx_cupons_status ON public.cupons(status);
CREATE INDEX idx_cupons_bloco_id ON public.cupons(bloco_id);
CREATE INDEX idx_cupons_cliente_id ON public.cupons(cliente_id);
CREATE INDEX idx_cupons_created_at ON public.cupons(created_at);
CREATE INDEX idx_blocos_lojista_id ON public.blocos(lojista_id);
CREATE INDEX idx_vendas_blocos_lojista_id ON public.vendas_blocos(lojista_id);
CREATE INDEX idx_logs_sistema_created_at ON public.logs_sistema(created_at);
CREATE INDEX idx_logs_sistema_nivel ON public.logs_sistema(nivel);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_usuarios_admin_updated_at BEFORE UPDATE ON public.usuarios_admin FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lojistas_updated_at BEFORE UPDATE ON public.lojistas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_blocos_updated_at BEFORE UPDATE ON public.blocos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cupons_updated_at BEFORE UPDATE ON public.cupons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_configuracoes_sistema_updated_at BEFORE UPDATE ON public.configuracoes_sistema FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create supabase/functions directory structure
CREATE OR REPLACE FUNCTION public.dummy_function()
RETURNS TEXT
LANGUAGE sql
AS $$
    SELECT 'Database schema created successfully'::TEXT;
$$;