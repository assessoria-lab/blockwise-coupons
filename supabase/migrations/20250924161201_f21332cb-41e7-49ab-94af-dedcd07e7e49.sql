-- Create system configurations table
CREATE TABLE configuracoes_sistema (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    descricao TEXT,
    tipo VARCHAR(20) DEFAULT 'string' CHECK (tipo IN ('string', 'number', 'boolean', 'json')),
    categoria VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create system logs table
CREATE TABLE logs_sistema (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evento VARCHAR(100) NOT NULL,
    nivel VARCHAR(20) DEFAULT 'info' CHECK (nivel IN ('debug', 'info', 'warning', 'error', 'critical')),
    usuario_id UUID,
    usuario_email VARCHAR(255),
    descricao TEXT,
    dados_contexto JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user roles table
CREATE TYPE app_role AS ENUM ('super_admin', 'admin', 'gerente', 'operador', 'auditor');

CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, role)
);

-- Drop existing blocos and cupons tables to recreate with optimized structure
DROP TABLE IF EXISTS cupons CASCADE;
DROP TABLE IF EXISTS blocos CASCADE;

-- Create optimized blocos table
CREATE TABLE blocos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_bloco VARCHAR(30) UNIQUE NOT NULL,
    lojista_id UUID REFERENCES lojistas(id),
    lote_id UUID,
    cupons_no_bloco SMALLINT DEFAULT 100,
    cupons_atribuidos SMALLINT DEFAULT 0,
    cupons_disponiveis SMALLINT DEFAULT 100,
    data_venda TIMESTAMPTZ,
    status VARCHAR(30) DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'vendido', 'esgotado')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sequence for unique coupon numbers
CREATE SEQUENCE seq_cupom_global
START WITH 100000000000
INCREMENT BY 1
MAXVALUE 9223372036854775807;

-- Create optimized cupons table
CREATE TABLE cupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_cupom BIGINT UNIQUE NOT NULL DEFAULT nextval('seq_cupom_global'),
    numero_formatado VARCHAR(20),
    bloco_id UUID NOT NULL REFERENCES blocos(id) ON DELETE CASCADE,
    lojista_id UUID REFERENCES lojistas(id),
    cliente_id UUID REFERENCES clientes(id),
    valor_compra DECIMAL(10,2),
    data_atribuicao TIMESTAMPTZ,
    data_uso TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'atribuido', 'utilizado', 'cancelado')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for optimization
CREATE INDEX idx_blocos_lojista_id ON blocos(lojista_id);
CREATE INDEX idx_blocos_status ON blocos(status);
CREATE INDEX idx_blocos_numero_bloco ON blocos(numero_bloco);
CREATE INDEX idx_cupons_numero_cupom ON cupons(numero_cupom);
CREATE INDEX idx_cupons_bloco_id ON cupons(bloco_id);
CREATE INDEX idx_cupons_lojista_id ON cupons(lojista_id);
CREATE INDEX idx_cupons_cliente_id ON cupons(cliente_id);
CREATE INDEX idx_cupons_status ON cupons(status);
CREATE INDEX idx_logs_sistema_nivel ON logs_sistema(nivel);
CREATE INDEX idx_logs_sistema_evento ON logs_sistema(evento);
CREATE INDEX idx_logs_sistema_created_at ON logs_sistema(created_at);

-- Enable RLS on new tables
ALTER TABLE configuracoes_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cupons ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admin pode gerenciar configurações" ON configuracoes_sistema FOR ALL USING (true);
CREATE POLICY "Admin pode ver logs" ON logs_sistema FOR ALL USING (true);
CREATE POLICY "Admin pode gerenciar roles" ON user_roles FOR ALL USING (true);
CREATE POLICY "Admin pode gerenciar blocos" ON blocos FOR ALL USING (true);
CREATE POLICY "Admin pode gerenciar cupons" ON cupons FOR ALL USING (true);

-- Create function to check user roles
CREATE OR REPLACE FUNCTION has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
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

-- Create function to create blocks in pool
CREATE OR REPLACE FUNCTION criar_blocos_pool(p_quantidade_blocos INTEGER)
RETURNS JSONB AS $$
DECLARE
    v_bloco_numero VARCHAR(30);
    v_cupom_numero_seq BIGINT;
    v_cupom_formatado VARCHAR(20);
    v_bloco_id UUID;
    bloco INTEGER;
    cupom INTEGER;
BEGIN
    FOR bloco IN 1..p_quantidade_blocos LOOP
        -- Create unique block
        v_bloco_numero := 'BL' || TO_CHAR(NOW(), 'YYYYMMDD') || '_' ||
                         LPAD(bloco::TEXT, 6, '0');
        
        INSERT INTO blocos (numero_bloco) VALUES (v_bloco_numero)
        RETURNING id INTO v_bloco_id;

        -- Create 100 sequential coupons for this block
        FOR cupom IN 1..100 LOOP
            v_cupom_numero_seq := nextval('seq_cupom_global');
            v_cupom_formatado := 'CP' || LPAD(v_cupom_numero_seq::TEXT, 12, '0');
            
            INSERT INTO cupons (
                numero_cupom, numero_formatado, bloco_id, status
            ) VALUES (
                v_cupom_numero_seq, v_cupom_formatado, v_bloco_id, 'disponivel'
            );
        END LOOP;
    END LOOP;

    RETURN jsonb_build_object('sucesso', true, 'blocos_criados', p_quantidade_blocos);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to log system events
CREATE OR REPLACE FUNCTION log_sistema_evento(
    p_evento VARCHAR(100),
    p_nivel VARCHAR(20) DEFAULT 'info',
    p_usuario_id UUID DEFAULT NULL,
    p_usuario_email VARCHAR(255) DEFAULT NULL,
    p_descricao TEXT DEFAULT NULL,
    p_dados_contexto JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO logs_sistema (
        evento, nivel, usuario_id, usuario_email, descricao, 
        dados_contexto, ip_address, user_agent
    ) VALUES (
        p_evento, p_nivel, p_usuario_id, p_usuario_email, p_descricao,
        p_dados_contexto, p_ip_address, p_user_agent
    )
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default system configurations
INSERT INTO configuracoes_sistema (chave, valor, descricao, tipo, categoria) VALUES
('valor_cupom_real', '10.00', 'Valor em reais para gerar 1 cupom', 'number', 'operacional'),
('cupons_por_bloco', '100', 'Quantidade de cupons por bloco', 'number', 'operacional'),
('valor_bloco_lojista', '100.00', 'Valor de venda de um bloco para lojistas', 'number', 'financeiro'),
('limite_transacao_diario', '10000.00', 'Limite de transação diário por lojista', 'number', 'seguranca'),
('limite_transacao_mensal', '50000.00', 'Limite de transação mensal por lojista', 'number', 'seguranca'),
('notificacao_email_ativo', 'true', 'Ativar notificações por email', 'boolean', 'notificacao'),
('notificacao_whatsapp_ativo', 'true', 'Ativar notificações por WhatsApp', 'boolean', 'notificacao'),
('dias_expiracao_cupom', '365', 'Dias para expiração de cupons', 'number', 'operacional'),
('autenticacao_2fa_obrigatorio', 'true', 'Autenticação de dois fatores obrigatória', 'boolean', 'seguranca'),
('sessao_timeout_minutos', '120', 'Timeout de sessão em minutos', 'number', 'seguranca');

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_blocos_updated_at
    BEFORE UPDATE ON blocos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_configuracoes_sistema_updated_at
    BEFORE UPDATE ON configuracoes_sistema
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON user_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Recreate vender_blocos_para_lojista function with new structure
CREATE OR REPLACE FUNCTION vender_blocos_para_lojista(
    p_lojista_id UUID, 
    p_quantidade_blocos INTEGER, 
    p_valor_total NUMERIC, 
    p_forma_pagamento TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_valor_por_bloco DECIMAL;
  v_blocos_disponiveis INTEGER;
  v_bloco_record RECORD;
BEGIN
  -- Check if lojista exists
  IF NOT EXISTS (SELECT 1 FROM public.lojistas WHERE id = p_lojista_id) THEN
    RETURN json_build_object('sucesso', false, 'mensagem', 'Lojista não encontrado');
  END IF;

  -- Calculate value per block
  v_valor_por_bloco := p_valor_total / p_quantidade_blocos;

  -- Check available blocks in pool
  SELECT COUNT(*) INTO v_blocos_disponiveis 
  FROM public.blocos 
  WHERE lojista_id IS NULL AND status = 'disponivel';

  IF v_blocos_disponiveis < p_quantidade_blocos THEN
    RETURN json_build_object('sucesso', false, 'mensagem', 'Não há blocos suficientes disponíveis no pool');
  END IF;

  -- Record the sale
  INSERT INTO public.vendas_blocos (lojista_id, quantidade_blocos, valor_total, valor_por_bloco, forma_pagamento)
  VALUES (p_lojista_id, p_quantidade_blocos, p_valor_total, v_valor_por_bloco, p_forma_pagamento);

  -- Transfer blocks from pool to lojista
  FOR v_bloco_record IN (
    SELECT id, numero_bloco 
    FROM public.blocos 
    WHERE lojista_id IS NULL AND status = 'disponivel'
    ORDER BY numero_bloco
    LIMIT p_quantidade_blocos
  ) LOOP
    -- Update block
    UPDATE public.blocos 
    SET lojista_id = p_lojista_id, 
        status = 'vendido',
        data_venda = NOW()
    WHERE id = v_bloco_record.id;

    -- Update coupons
    UPDATE public.cupons
    SET lojista_id = p_lojista_id
    WHERE bloco_id = v_bloco_record.id;
  END LOOP;

  -- Update lojista counter
  UPDATE public.lojistas 
  SET cupons_nao_atribuidos = cupons_nao_atribuidos + (p_quantidade_blocos * 100)
  WHERE id = p_lojista_id;

  RETURN json_build_object('sucesso', true, 'mensagem', 'Blocos vendidos com sucesso');
END;
$$;

-- Recreate atribuir_cupons_para_cliente function with new structure
CREATE OR REPLACE FUNCTION atribuir_cupons_para_cliente(
    p_lojista_id UUID, 
    p_cliente_cpf TEXT, 
    p_cliente_nome TEXT, 
    p_cliente_telefone TEXT, 
    p_valor_compra NUMERIC
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_cliente_id UUID;
  v_cupons_necessarios INTEGER;
  v_cupons_disponiveis INTEGER;
  v_cupom_record RECORD;
  v_cupons_atribuidos INTEGER := 0;
BEGIN
  -- Calculate needed coupons (1 coupon per R$ 10)
  v_cupons_necessarios := FLOOR(p_valor_compra / 10);
  
  IF v_cupons_necessarios = 0 THEN
    RETURN json_build_object('sucesso', false, 'mensagem', 'Valor da compra deve ser de pelo menos R$ 10,00');
  END IF;

  -- Check available coupons for lojista
  SELECT COUNT(*) INTO v_cupons_disponiveis
  FROM public.cupons
  WHERE lojista_id = p_lojista_id AND status = 'disponivel';

  IF v_cupons_disponiveis < v_cupons_necessarios THEN
    RETURN json_build_object('sucesso', false, 'mensagem', 'Lojista não possui cupons suficientes disponíveis');
  END IF;

  -- Create or find client
  INSERT INTO public.clientes (cpf, nome, telefone)
  VALUES (p_cliente_cpf, p_cliente_nome, p_cliente_telefone)
  ON CONFLICT (cpf) DO UPDATE SET 
    nome = EXCLUDED.nome,
    telefone = EXCLUDED.telefone,
    updated_at = NOW()
  RETURNING id INTO v_cliente_id;

  -- Assign coupons to client
  FOR v_cupom_record IN (
    SELECT id
    FROM public.cupons
    WHERE lojista_id = p_lojista_id AND status = 'disponivel'
    ORDER BY created_at
    LIMIT v_cupons_necessarios
  ) LOOP
    UPDATE public.cupons
    SET cliente_id = v_cliente_id,
        valor_compra = p_valor_compra / v_cupons_necessarios,
        data_atribuicao = NOW(),
        status = 'atribuido'
    WHERE id = v_cupom_record.id;
    
    v_cupons_atribuidos := v_cupons_atribuidos + 1;
  END LOOP;

  -- Update lojista counters
  UPDATE public.lojistas
  SET cupons_nao_atribuidos = cupons_nao_atribuidos - v_cupons_atribuidos
  WHERE id = p_lojista_id;

  -- Update block counters
  UPDATE public.blocos
  SET cupons_atribuidos = cupons_atribuidos + 1,
      cupons_disponiveis = cupons_disponiveis - 1
  WHERE id IN (
    SELECT DISTINCT bloco_id
    FROM public.cupons
    WHERE cliente_id = v_cliente_id AND data_atribuicao >= NOW() - INTERVAL '1 minute'
  );

  RETURN json_build_object(
    'sucesso', true,
    'mensagem', 'Cupons atribuídos com sucesso',
    'cupons_atribuidos', v_cupons_atribuidos,
    'cliente_nome', p_cliente_nome
  );
END;
$$;

-- Create some initial blocks for testing
SELECT criar_blocos_pool(10);