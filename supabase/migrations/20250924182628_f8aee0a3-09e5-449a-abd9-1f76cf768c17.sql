-- ====================================
-- BLOCO 9: FUNÇÕES PARA RASTREAMENTO E RELATÓRIOS DE BLOCOS
-- ====================================

-- Função para relatório de utilização de blocos
CREATE OR REPLACE FUNCTION relatorio_utilizacao_blocos(
    p_lojista_id UUID DEFAULT NULL
)
RETURNS TABLE(
    numero_bloco TEXT,
    lojista_nome TEXT,
    cupons_total SMALLINT,
    cupons_atribuidos SMALLINT,
    cupons_disponiveis SMALLINT,
    utilizacao_percentual NUMERIC,
    comprado_em TIMESTAMPTZ,
    dias_desde_compra INTEGER,
    valor_gerado NUMERIC,
    clientes_atendidos BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        b.numero_bloco::TEXT,
        l.nome_loja::TEXT,
        b.cupons_no_bloco,
        b.cupons_atribuidos,
        b.cupons_disponiveis,
        ROUND((b.cupons_atribuidos::NUMERIC / b.cupons_no_bloco) * 100, 2) as utilizacao_pct,
        b.data_venda,
        CASE WHEN b.data_venda IS NOT NULL
        THEN EXTRACT(DAY FROM NOW() - b.data_venda)::INTEGER
        ELSE NULL END as dias_desde_compra,
        COALESCE(SUM(c.valor_compra), 0) as valor_gerado,
        COUNT(DISTINCT c.cliente_id) as clientes_atendidos
    FROM blocos b
    LEFT JOIN lojistas l ON b.lojista_id = l.id
    LEFT JOIN cupons c ON b.id = c.bloco_id AND c.status = 'atribuido'
    WHERE b.status = 'vendido' -- Blocos que estão com lojistas
    AND (p_lojista_id IS NULL OR b.lojista_id = p_lojista_id)
    GROUP BY b.id, b.numero_bloco, l.nome_loja, b.cupons_no_bloco,
    b.cupons_atribuidos, b.cupons_disponiveis, b.data_venda
    ORDER BY utilizacao_pct DESC, b.data_venda DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Função para buscar detalhes de um bloco específico
CREATE OR REPLACE FUNCTION buscar_detalhes_bloco(
    p_numero_bloco TEXT
)
RETURNS TABLE(
    bloco_id UUID,
    numero_bloco VARCHAR,
    status VARCHAR,
    cupons_no_bloco SMALLINT,
    cupons_atribuidos SMALLINT,
    cupons_disponiveis SMALLINT,
    data_venda TIMESTAMPTZ,
    lojista_id UUID,
    lojista_nome TEXT,
    lojista_whatsapp VARCHAR,
    cupons JSONB
) AS $$
DECLARE
    v_bloco_id UUID;
    v_cupons_json JSONB;
BEGIN
    -- Busca o ID do bloco
    SELECT id INTO v_bloco_id
    FROM blocos 
    WHERE blocos.numero_bloco = p_numero_bloco;

    IF v_bloco_id IS NULL THEN
        RAISE EXCEPTION 'Bloco não encontrado: %', p_numero_bloco;
    END IF;

    -- Monta JSON com todos os cupons do bloco
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', c.id,
            'numero_formatado', c.numero_formatado,
            'numero_cupom', c.numero_cupom,
            'status', c.status,
            'valor_compra', c.valor_compra,
            'data_atribuicao', c.data_atribuicao,
            'cliente', CASE 
                WHEN cl.id IS NOT NULL THEN
                    jsonb_build_object(
                        'nome', cl.nome,
                        'cpf', cl.cpf,
                        'telefone', cl.telefone
                    )
                ELSE NULL
            END
        )
        ORDER BY c.numero_cupom ASC
    ) INTO v_cupons_json
    FROM cupons c
    LEFT JOIN clientes cl ON c.cliente_id = cl.id
    WHERE c.bloco_id = v_bloco_id;

    -- Retorna os dados do bloco com cupons
    RETURN QUERY
    SELECT
        b.id,
        b.numero_bloco,
        b.status,
        b.cupons_no_bloco,
        b.cupons_atribuidos,
        b.cupons_disponiveis,
        b.data_venda,
        b.lojista_id,
        l.nome_loja::TEXT,
        l.whatsapp,
        v_cupons_json
    FROM blocos b
    LEFT JOIN lojistas l ON b.lojista_id = l.id
    WHERE b.id = v_bloco_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;