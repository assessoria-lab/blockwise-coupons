-- ====================================
-- BLOCO 6: PROCEDIMENTOS E VIEWS OTIMIZADAS (CORRIGIDO)
-- ====================================

-- 1. Função otimizada para atribuição de cupons (corrigida)
CREATE OR REPLACE FUNCTION atribuir_cupons_para_cliente(
    p_lojista_id UUID,
    p_cliente_cpf VARCHAR(14),
    p_cliente_nome VARCHAR(255),
    p_cliente_telefone VARCHAR(20),
    p_valor_compra DECIMAL(10,2)
)
RETURNS JSONB AS $$
DECLARE
    v_cliente_id UUID;
    v_cupons_necessarios INTEGER;
    v_cupons_disponiveis_lojista INTEGER;
    v_cupom_id UUID;
    v_cupons_gerados JSONB := '[]'::JSONB;
    v_cupom_record RECORD;
    i INTEGER;
BEGIN
    -- 1. Calcula cupons necessários (1 cupom por R$ 100,00)
    v_cupons_necessarios := FLOOR(p_valor_compra / 100);

    IF v_cupons_necessarios = 0 THEN
        RETURN jsonb_build_object(
            'sucesso', false,
            'mensagem', 'Valor mínimo para gerar cupom é R$ 100,00.',
            'codigo_erro', 'VALOR_INSUFICIENTE'
        );
    END IF;

    -- 2. Verifica cupons disponíveis para o lojista
    SELECT COALESCE(SUM(cupons_disponiveis), 0) INTO v_cupons_disponiveis_lojista
    FROM blocos
    WHERE lojista_id = p_lojista_id AND status = 'vendido';

    IF v_cupons_disponiveis_lojista < v_cupons_necessarios THEN
        RETURN jsonb_build_object(
            'sucesso', false,
            'mensagem', format('Lojista não possui cupons suficientes. Disponível: %s, Necessário: %s.', v_cupons_disponiveis_lojista, v_cupons_necessarios),
            'codigo_erro', 'SALDO_INSUFICIENTE'
        );
    END IF;

    -- 3. Busca ou cria cliente
    SELECT id INTO v_cliente_id FROM clientes WHERE cpf = p_cliente_cpf;

    IF v_cliente_id IS NULL THEN
        INSERT INTO clientes (nome, cpf, telefone, cidade)
        VALUES (p_cliente_nome, p_cliente_cpf, p_cliente_telefone, NULL)
        RETURNING id INTO v_cliente_id;
    ELSE
        -- Atualiza dados do cliente existente se necessário
        UPDATE clientes
        SET
            nome = COALESCE(p_cliente_nome, nome),
            telefone = COALESCE(p_cliente_telefone, telefone),
            updated_at = NOW()
        WHERE id = v_cliente_id;
    END IF;

    -- 4. Atribui os cupons
    FOR i IN 1..v_cupons_necessarios LOOP
        -- Encontra o próximo cupom disponível do lojista
        SELECT c.id INTO v_cupom_id
        FROM cupons c
        JOIN blocos b ON c.bloco_id = b.id
        WHERE c.lojista_id = p_lojista_id
          AND c.status = 'disponivel'
          AND b.status = 'vendido'
        ORDER BY c.numero_cupom ASC
        LIMIT 1;

        IF v_cupom_id IS NULL THEN
            RAISE EXCEPTION 'Erro interno: Não foi possível encontrar um cupom disponível para atribuição.';
        END IF;

        -- Atualiza o cupom para o cliente
        UPDATE cupons
        SET
            cliente_id = v_cliente_id,
            valor_compra = p_valor_compra,
            data_atribuicao = NOW(),
            status = 'atribuido'
        WHERE id = v_cupom_id
        RETURNING numero_formatado, data_atribuicao, bloco_id INTO v_cupom_record;

        v_cupons_gerados := v_cupons_gerados || jsonb_build_object(
            'numero', v_cupom_record.numero_formatado,
            'data_atribuicao', v_cupom_record.data_atribuicao
        );

        -- Atualiza contadores do bloco
        UPDATE blocos
        SET
            cupons_atribuidos = cupons_atribuidos + 1,
            cupons_disponiveis = cupons_disponiveis - 1,
            updated_at = NOW()
        WHERE id = v_cupom_record.bloco_id;
    END LOOP;

    -- 5. Atualiza totais do cliente
    UPDATE clientes
    SET
        total_cupons_recebidos = total_cupons_recebidos + v_cupons_necessarios,
        total_valor_compras = total_valor_compras + p_valor_compra,
        updated_at = NOW()
    WHERE id = v_cliente_id;

    -- 6. Registra log do evento
    INSERT INTO logs_sistema (lojista_id, evento, descricao, dados_contexto, nivel)
    VALUES (
        p_lojista_id,
        'atribuicao_cupom',
        'Cupons atribuídos a cliente',
        jsonb_build_object(
            'cliente_id', v_cliente_id,
            'cupons_gerados', v_cupons_gerados,
            'quantidade_cupons', v_cupons_necessarios,
            'valor_compra', p_valor_compra
        ),
        'info'
    );

    RETURN jsonb_build_object(
        'sucesso', true,
        'mensagem', format('%s cupons atribuídos com sucesso para %s.', v_cupons_necessarios, p_cliente_nome),
        'cupons_atribuidos', v_cupons_gerados,
        'quantidade_cupons', v_cupons_necessarios,
        'cliente_nome', p_cliente_nome
    );

EXCEPTION
    WHEN OTHERS THEN
        INSERT INTO logs_sistema (lojista_id, evento, descricao, dados_contexto, nivel)
        VALUES (
            p_lojista_id,
            'erro_atribuicao_cupom',
            'Erro ao atribuir cupons para cliente',
            jsonb_build_object(
                'erro', SQLERRM,
                'parametros', jsonb_build_object(
                    'lojista_id', p_lojista_id,
                    'cliente_cpf', p_cliente_cpf,
                    'valor_compra', p_valor_compra
                )
            ),
            'error'
        );
        RETURN jsonb_build_object(
            'sucesso', false,
            'mensagem', 'Erro interno ao processar a atribuição de cupons.',
            'codigo_erro', 'ERRO_INTERNO'
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Função para consultar saldo do lojista
CREATE OR REPLACE FUNCTION consultar_saldo_lojista(
    p_whatsapp_lojista VARCHAR(20)
)
RETURNS JSONB AS $$
DECLARE
    v_lojista RECORD;
    v_cupons_disponiveis INTEGER;
    v_historico_recente JSONB;
BEGIN
    -- Busca dados do lojista
    SELECT id, nome_loja, cidade
    INTO v_lojista
    FROM lojistas
    WHERE whatsapp = p_whatsapp_lojista AND status = 'ativo';

    IF v_lojista.id IS NULL THEN
        RETURN jsonb_build_object(
            'sucesso', false,
            'mensagem', 'Lojista não encontrado ou inativo.',
            'codigo_erro', 'LOJISTA_NAO_ENCONTRADO'
        );
    END IF;

    -- Calcula cupons disponíveis
    SELECT COALESCE(SUM(cupons_disponiveis), 0) INTO v_cupons_disponiveis
    FROM blocos
    WHERE lojista_id = v_lojista.id AND status = 'vendido';

    -- Busca histórico recente (últimos 5 cupons atribuídos)
    SELECT jsonb_agg(
        jsonb_build_object(
            'numero_cupom', c.numero_formatado,
            'cliente_nome', cl.nome,
            'valor_compra', c.valor_compra,
            'data_atribuicao', c.data_atribuicao
        ) ORDER BY c.data_atribuicao DESC
    )
    INTO v_historico_recente
    FROM cupons c
    JOIN clientes cl ON c.cliente_id = cl.id
    WHERE c.lojista_id = v_lojista.id
      AND c.status = 'atribuido'
    ORDER BY c.data_atribuicao DESC
    LIMIT 5;

    -- Registra transação no WhatsApp
    INSERT INTO transacoes_whatsapp (
        lojista_id, numero_whatsapp, tipo_interacao, status_processamento
    ) VALUES (
        v_lojista.id, p_whatsapp_lojista, 'consulta_saldo', 'sucesso'
    );

    RETURN jsonb_build_object(
        'sucesso', true,
        'loja', jsonb_build_object(
            'nome', v_lojista.nome_loja,
            'cidade', v_lojista.cidade
        ),
        'saldo_cupons_disponiveis', v_cupons_disponiveis,
        'historico_recente', COALESCE(v_historico_recente, '[]'::JSONB)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Views Materializadas para Dashboard

-- 3.1 Dashboard de Blocos
CREATE MATERIALIZED VIEW mv_dashboard_blocos AS
SELECT
    (SELECT COUNT(id) FROM blocos WHERE status = 'disponivel') AS blocos_pool_geral,
    (SELECT COUNT(id) FROM blocos WHERE status = 'vendido') AS blocos_com_lojistas,
    (SELECT COUNT(id) FROM cupons WHERE status = 'atribuido') AS cupons_atribuidos,
    (SELECT COUNT(id) FROM cupons WHERE status = 'atribuido' AND data_atribuicao::DATE = CURRENT_DATE) AS cupons_atribuidos_hoje,
    (SELECT COALESCE(SUM(cupons_disponiveis), 0) FROM blocos WHERE status = 'vendido') AS cupons_nao_atribuidos,
    (SELECT COUNT(id) FROM blocos WHERE data_venda::DATE = CURRENT_DATE) AS blocos_vendidos_hoje,
    CURRENT_TIMESTAMP as ultima_atualizacao;

CREATE UNIQUE INDEX idx_mv_dashboard_blocos ON mv_dashboard_blocos ((1));

-- 3.2 Ranking de Lojistas
CREATE MATERIALIZED VIEW mv_ranking_lojistas AS
SELECT
    l.id AS lojista_id,
    l.nome_loja,
    l.cidade,
    COUNT(c.id) FILTER (WHERE c.status = 'atribuido') AS total_cupons_atribuidos,
    COALESCE(SUM(c.valor_compra) FILTER (WHERE c.status = 'atribuido'), 0) AS volume_vendas_geradas,
    COUNT(DISTINCT c.cliente_id) FILTER (WHERE c.status = 'atribuido') AS clientes_unicos_atendidos,
    MAX(c.data_atribuicao) AS ultima_atribuicao,
    (SELECT COALESCE(SUM(cupons_disponiveis), 0) FROM blocos WHERE lojista_id = l.id AND status = 'vendido') AS cupons_disponiveis_lojista,
    RANK() OVER (ORDER BY COUNT(c.id) FILTER (WHERE c.status = 'atribuido') DESC) AS ranking_cupons,
    RANK() OVER (ORDER BY COALESCE(SUM(c.valor_compra) FILTER (WHERE c.status = 'atribuido'), 0) DESC) AS ranking_vendas,
    CURRENT_TIMESTAMP as ultima_atualizacao
FROM lojistas l
LEFT JOIN cupons c ON l.id = c.lojista_id
WHERE l.status = 'ativo'
GROUP BY l.id, l.nome_loja, l.cidade;

CREATE UNIQUE INDEX idx_mv_ranking_lojistas ON mv_ranking_lojistas (lojista_id);

-- 3.3 Histórico de Cupons
CREATE MATERIALIZED VIEW mv_historico_cupons AS
SELECT
    c.id,
    c.numero_formatado AS numero_cupom,
    c.created_at AS data_criacao,
    c.data_atribuicao,
    c.valor_compra,
    c.status,
    l.nome_loja,
    l.cidade AS cidade_loja,
    cl.nome AS nome_cliente,
    cl.cpf AS cpf_cliente,
    cl.cidade AS cidade_cliente,
    b.numero_bloco,
    DATE_TRUNC('month', c.data_atribuicao) AS mes_atribuicao,
    DATE_TRUNC('week', c.data_atribuicao) AS semana_atribuicao,
    CURRENT_TIMESTAMP as ultima_atualizacao
FROM cupons c
JOIN lojistas l ON c.lojista_id = l.id
LEFT JOIN clientes cl ON c.cliente_id = cl.id
JOIN blocos b ON c.bloco_id = b.id
WHERE c.status IN ('atribuido', 'utilizado', 'cancelado')
ORDER BY c.data_atribuicao DESC;

CREATE UNIQUE INDEX idx_mv_historico_cupons_id ON mv_historico_cupons (id);
CREATE INDEX idx_mv_historico_cupons_data_atribuicao ON mv_historico_cupons (data_atribuicao);
CREATE INDEX idx_mv_historico_cupons_lojista ON mv_historico_cupons (nome_loja);
CREATE INDEX idx_mv_historico_cupons_mes ON mv_historico_cupons (mes_atribuicao);

-- 4. Funções para refresh das views materializadas
CREATE OR REPLACE FUNCTION refresh_dashboard_views()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW mv_dashboard_blocos;
    REFRESH MATERIALIZED VIEW mv_ranking_lojistas;
    REFRESH MATERIALIZED VIEW mv_historico_cupons;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Triggers para atualização automática das views
CREATE OR REPLACE FUNCTION trigger_refresh_dashboard()
RETURNS TRIGGER AS $$
BEGIN
    -- Agenda refresh das views (evita locks em transações concorrentes)
    PERFORM pg_notify('refresh_views', 'dashboard');
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers nas tabelas principais
CREATE TRIGGER trg_blocos_refresh_views
    AFTER INSERT OR UPDATE OR DELETE ON blocos
    FOR EACH STATEMENT EXECUTE FUNCTION trigger_refresh_dashboard();

CREATE TRIGGER trg_cupons_refresh_views
    AFTER INSERT OR UPDATE OR DELETE ON cupons
    FOR EACH STATEMENT EXECUTE FUNCTION trigger_refresh_dashboard();

CREATE TRIGGER trg_lojistas_refresh_views
    AFTER INSERT OR UPDATE OR DELETE ON lojistas
    FOR EACH STATEMENT EXECUTE FUNCTION trigger_refresh_dashboard();

CREATE TRIGGER trg_clientes_refresh_views
    AFTER INSERT OR UPDATE OR DELETE ON clientes
    FOR EACH STATEMENT EXECUTE FUNCTION trigger_refresh_dashboard();

-- 6. Populate inicial das views materializadas
SELECT refresh_dashboard_views();