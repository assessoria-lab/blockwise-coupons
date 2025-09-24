-- =====================================================
-- MIGRAÇÃO: Estrutura Otimizada - Versão Final
-- =====================================================

-- 1. Tabela de pagamentos (se não existir)
CREATE TABLE IF NOT EXISTS pagamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lojista_id UUID NOT NULL REFERENCES lojistas(id) ON DELETE CASCADE,
    valor DECIMAL(10,2) NOT NULL,
    quantidade_blocos INTEGER NOT NULL,
    forma_pagamento VARCHAR(50) NOT NULL CHECK (forma_pagamento IN ('pix', 'cartao', 'boleto', 'transferencia')),
    status_pagamento VARCHAR(20) DEFAULT 'pendente' CHECK (status_pagamento IN ('pendente', 'aprovado', 'rejeitado', 'cancelado', 'estornado')),
    referencia_externa VARCHAR(255),
    dados_pagamento JSONB,
    data_solicitacao TIMESTAMPTZ DEFAULT NOW(),
    data_aprovacao TIMESTAMPTZ,
    data_expiracao TIMESTAMPTZ,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de transações WhatsApp (se não existir)
CREATE TABLE IF NOT EXISTS transacoes_whatsapp (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lojista_id UUID REFERENCES lojistas(id) ON DELETE CASCADE,
    numero_whatsapp VARCHAR(20) NOT NULL,
    tipo_interacao VARCHAR(50) NOT NULL CHECK (tipo_interacao IN ('emissao_cupom', 'consulta_saldo', 'consulta_historico', 'reabastecimento', 'comando_geral')),
    mensagem_enviada TEXT,
    mensagem_resposta TEXT,
    dados_processados JSONB,
    status_processamento VARCHAR(20) DEFAULT 'sucesso' CHECK (status_processamento IN ('sucesso', 'erro', 'pendente')),
    erro_detalhes TEXT,
    data_interacao TIMESTAMPTZ DEFAULT NOW(),
    tempo_processamento_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de usuários administrativos (se não existir)
CREATE TABLE IF NOT EXISTS usuarios_admin (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    nivel_permissao VARCHAR(20) DEFAULT 'leitura' CHECK (nivel_permissao IN ('leitura', 'escrita', 'admin', 'super_admin')),
    status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'bloqueado')),
    ultimo_login TIMESTAMPTZ,
    tentativas_login INTEGER DEFAULT 0,
    data_bloqueio TIMESTAMPTZ,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Melhorias nas tabelas existentes
DO $$
BEGIN
    -- Adicionar colunas para lojistas se não existirem
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lojistas' AND column_name = 'nome_responsavel') THEN
        ALTER TABLE lojistas ADD COLUMN nome_responsavel TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lojistas' AND column_name = 'ddd') THEN
        ALTER TABLE lojistas ADD COLUMN ddd VARCHAR(3);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lojistas' AND column_name = 'whatsapp') THEN
        ALTER TABLE lojistas ADD COLUMN whatsapp VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lojistas' AND column_name = 'estado') THEN
        ALTER TABLE lojistas ADD COLUMN estado VARCHAR(2) DEFAULT 'GO';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lojistas' AND column_name = 'data_cadastro') THEN
        ALTER TABLE lojistas ADD COLUMN data_cadastro TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lojistas' AND column_name = 'data_ultimo_acesso') THEN
        ALTER TABLE lojistas ADD COLUMN data_ultimo_acesso TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lojistas' AND column_name = 'data_ultima_compra') THEN
        ALTER TABLE lojistas ADD COLUMN data_ultima_compra TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lojistas' AND column_name = 'observacoes') THEN
        ALTER TABLE lojistas ADD COLUMN observacoes TEXT;
    END IF;

    -- Adicionar colunas para clientes se não existirem
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clientes' AND column_name = 'data_primeiro_cupom') THEN
        ALTER TABLE clientes ADD COLUMN data_primeiro_cupom TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clientes' AND column_name = 'total_cupons_recebidos') THEN
        ALTER TABLE clientes ADD COLUMN total_cupons_recebidos INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clientes' AND column_name = 'total_valor_compras') THEN
        ALTER TABLE clientes ADD COLUMN total_valor_compras DECIMAL(12,2) DEFAULT 0.00;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clientes' AND column_name = 'status') THEN
        ALTER TABLE clientes ADD COLUMN status VARCHAR(20) DEFAULT 'ativo';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clientes' AND column_name = 'observacoes') THEN
        ALTER TABLE clientes ADD COLUMN observacoes TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clientes' AND column_name = 'cidade') THEN
        ALTER TABLE clientes ADD COLUMN cidade VARCHAR(100);
    END IF;
END $$;

-- 5. Criar índices necessários (se não existirem)
CREATE INDEX IF NOT EXISTS idx_lojistas_whatsapp ON lojistas(whatsapp);
CREATE INDEX IF NOT EXISTS idx_lojistas_ddd ON lojistas(ddd);
CREATE INDEX IF NOT EXISTS idx_lojistas_estado ON lojistas(estado);

CREATE INDEX IF NOT EXISTS idx_pagamentos_lojista ON pagamentos(lojista_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON pagamentos(status_pagamento);
CREATE INDEX IF NOT EXISTS idx_pagamentos_forma ON pagamentos(forma_pagamento);
CREATE INDEX IF NOT EXISTS idx_pagamentos_data_solicitacao ON pagamentos(data_solicitacao);

CREATE INDEX IF NOT EXISTS idx_transacoes_lojista ON transacoes_whatsapp(lojista_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_whatsapp_numero ON transacoes_whatsapp(numero_whatsapp);
CREATE INDEX IF NOT EXISTS idx_transacoes_tipo ON transacoes_whatsapp(tipo_interacao);
CREATE INDEX IF NOT EXISTS idx_transacoes_data ON transacoes_whatsapp(data_interacao);

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios_admin(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_status ON usuarios_admin(status);
CREATE INDEX IF NOT EXISTS idx_usuarios_nivel ON usuarios_admin(nivel_permissao);

-- 6. Configurar RLS nas novas tabelas
ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes_whatsapp ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios_admin ENABLE ROW LEVEL SECURITY;

-- 7. Criar policies (remover se existirem primeiro)
DROP POLICY IF EXISTS "Admin pode gerenciar pagamentos" ON pagamentos;
CREATE POLICY "Admin pode gerenciar pagamentos" ON pagamentos FOR ALL USING (true);

DROP POLICY IF EXISTS "Admin pode gerenciar transações whatsapp" ON transacoes_whatsapp;
CREATE POLICY "Admin pode gerenciar transações whatsapp" ON transacoes_whatsapp FOR ALL USING (true);

DROP POLICY IF EXISTS "Admin pode gerenciar usuários" ON usuarios_admin;
CREATE POLICY "Admin pode gerenciar usuários" ON usuarios_admin FOR ALL USING (true);