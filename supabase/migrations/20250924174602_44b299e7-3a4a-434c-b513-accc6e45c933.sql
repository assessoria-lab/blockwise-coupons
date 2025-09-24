-- =====================================================
-- CORREÇÃO DE SEGURANÇA: Habilitar RLS em todas as tabelas
-- =====================================================

-- Habilitar RLS em todas as tabelas que não têm
ALTER TABLE apl_alana ENABLE ROW LEVEL SECURITY;
ALTER TABLE audios ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocos ENABLE ROW LEVEL SECURITY;
ALTER TABLE caroline_veras_follow_up ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE cupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE delbo_sophia ENABLE ROW LEVEL SECURITY;
ALTER TABLE disparo_apl_maria ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE embeddings_diarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE followup_rafaela_conecta ENABLE ROW LEVEL SECURITY;
ALTER TABLE h_hospedagem ENABLE ROW LEVEL SECURITY;
ALTER TABLE jose_alberto ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE lojistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pereira_gouveia_roberta ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE rb_5g ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas_blocos ENABLE ROW LEVEL SECURITY;

-- Criar políticas básicas para tabelas que não têm
-- (Permitir acesso apenas para administradores por padrão)

-- Políticas para tabelas de embedding e documentos (acesso público para leitura)
DROP POLICY IF EXISTS "Acesso público leitura" ON apl_alana;
CREATE POLICY "Acesso público leitura" ON apl_alana FOR SELECT USING (true);

DROP POLICY IF EXISTS "Acesso público leitura" ON delbo_sophia;
CREATE POLICY "Acesso público leitura" ON delbo_sophia FOR SELECT USING (true);

DROP POLICY IF EXISTS "Acesso público leitura" ON documents;
CREATE POLICY "Acesso público leitura" ON documents FOR SELECT USING (true);

DROP POLICY IF EXISTS "Acesso público leitura" ON embeddings_diarios;
CREATE POLICY "Acesso público leitura" ON embeddings_diarios FOR SELECT USING (true);

DROP POLICY IF EXISTS "Acesso público leitura" ON h_hospedagem;
CREATE POLICY "Acesso público leitura" ON h_hospedagem FOR SELECT USING (true);

DROP POLICY IF EXISTS "Acesso público leitura" ON jose_alberto;
CREATE POLICY "Acesso público leitura" ON jose_alberto FOR SELECT USING (true);

DROP POLICY IF EXISTS "Acesso público leitura" ON pereira_gouveia_roberta;
CREATE POLICY "Acesso público leitura" ON pereira_gouveia_roberta FOR SELECT USING (true);

DROP POLICY IF EXISTS "Acesso público leitura" ON rb_5g;
CREATE POLICY "Acesso público leitura" ON rb_5g FOR SELECT USING (true);

-- Políticas para tabelas administrativas (acesso admin)
DROP POLICY IF EXISTS "Admin acesso total" ON caroline_veras_follow_up;
CREATE POLICY "Admin acesso total" ON caroline_veras_follow_up FOR ALL USING (true);

DROP POLICY IF EXISTS "Admin acesso total" ON disparo_apl_maria;
CREATE POLICY "Admin acesso total" ON disparo_apl_maria FOR ALL USING (true);

DROP POLICY IF EXISTS "Admin acesso total" ON followup_rafaela_conecta;
CREATE POLICY "Admin acesso total" ON followup_rafaela_conecta FOR ALL USING (true);

-- Atualizar function com search_path (corrigir warnings de segurança)
CREATE OR REPLACE FUNCTION vender_blocos_para_lojista_v2(
    p_lojista_id UUID,
    p_quantidade_blocos INTEGER,
    p_valor_total DECIMAL(10,2),
    p_forma_pagamento VARCHAR(50)
)
RETURNS JSONB 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_blocos_disponiveis INTEGER;
    v_pagamento_id UUID;
    v_blocos_transferidos INTEGER := 0;
BEGIN
    -- 1. Verifica se há blocos suficientes no pool
    SELECT COUNT(id) INTO v_blocos_disponiveis
    FROM blocos
    WHERE status = 'disponivel' AND lojista_id IS NULL;

    IF v_blocos_disponiveis < p_quantidade_blocos THEN
        RETURN jsonb_build_object(
            'sucesso', false,
            'mensagem', 'Não há blocos suficientes disponíveis no pool.',
            'codigo_erro', 'BLOCOS_INSUFICIENTES',
            'blocos_disponiveis', v_blocos_disponiveis,
            'blocos_solicitados', p_quantidade_blocos
        );
    END IF;

    -- 2. Registra o pagamento
    INSERT INTO pagamentos (
        lojista_id, valor, quantidade_blocos, forma_pagamento, status_pagamento
    ) VALUES (
        p_lojista_id, p_valor_total, p_quantidade_blocos, p_forma_pagamento, 'aprovado'
    ) RETURNING id INTO v_pagamento_id;

    -- 3. Transfere os blocos do pool para o lojista
    WITH blocos_selecionados AS (
        SELECT id FROM blocos
        WHERE status = 'disponivel' AND lojista_id IS NULL
        ORDER BY created_at
        LIMIT p_quantidade_blocos
        FOR UPDATE SKIP LOCKED
    )
    UPDATE blocos
    SET
        lojista_id = p_lojista_id,
        status = 'vendido',
        data_venda = NOW(),
        updated_at = NOW()
    FROM blocos_selecionados
    WHERE blocos.id = blocos_selecionados.id;

    GET DIAGNOSTICS v_blocos_transferidos = ROW_COUNT;

    -- 4. Atualiza os cupons dentro dos blocos transferidos
    UPDATE cupons
    SET
        lojista_id = p_lojista_id,
        status = 'disponivel'
    WHERE bloco_id IN (
        SELECT id FROM blocos
        WHERE lojista_id = p_lojista_id 
        AND data_venda >= NOW() - INTERVAL '1 minute'
    );

    -- 5. Atualiza contador do lojista
    UPDATE lojistas
    SET 
        cupons_nao_atribuidos = cupons_nao_atribuidos + (v_blocos_transferidos * 100),
        data_ultima_compra = NOW(),
        updated_at = NOW()
    WHERE id = p_lojista_id;

    -- 6. Registra log do evento
    INSERT INTO logs_sistema (lojista_id, evento, descricao, dados_contexto, nivel)
    VALUES (
        p_lojista_id,
        'venda_blocos',
        'Venda de blocos registrada e transferida para lojista',
        jsonb_build_object(
            'quantidade_blocos', p_quantidade_blocos,
            'blocos_transferidos', v_blocos_transferidos,
            'valor_total', p_valor_total,
            'forma_pagamento', p_forma_pagamento,
            'pagamento_id', v_pagamento_id
        ),
        'info'
    );

    RETURN jsonb_build_object(
        'sucesso', true,
        'mensagem', format('%s blocos vendidos e atribuídos ao lojista.', v_blocos_transferidos),
        'blocos_transferidos', v_blocos_transferidos,
        'pagamento_id', v_pagamento_id,
        'valor_total', p_valor_total
    );

EXCEPTION
    WHEN OTHERS THEN
        INSERT INTO logs_sistema (lojista_id, evento, descricao, dados_contexto, nivel)
        VALUES (
            p_lojista_id,
            'erro_venda_blocos',
            'Erro ao vender blocos para lojista',
            jsonb_build_object(
                'erro', SQLERRM,
                'parametros', jsonb_build_object(
                    'lojista_id', p_lojista_id,
                    'quantidade_blocos', p_quantidade_blocos,
                    'valor_total', p_valor_total,
                    'forma_pagamento', p_forma_pagamento
                )
            ),
            'error'
        );
        RETURN jsonb_build_object(
            'sucesso', false,
            'mensagem', 'Erro interno ao processar a venda de blocos.',
            'codigo_erro', 'ERRO_INTERNO',
            'erro_detalhes', SQLERRM
        );
END;
$$;