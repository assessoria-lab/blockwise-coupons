-- ====================================
-- BLOCO 6: PROCEDIMENTOS E VIEWS OTIMIZADAS (FINAL)
-- ====================================

-- Remover views existentes se existirem
DROP MATERIALIZED VIEW IF EXISTS mv_dashboard_blocos CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_ranking_lojistas CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_historico_cupons CASCADE;

-- 1. Views Materializadas para Dashboard

-- 1.1 Dashboard de Blocos
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

-- 1.2 Ranking de Lojistas
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

-- 1.3 Histórico de Cupons
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

-- 2. Função para refresh das views materializadas
CREATE OR REPLACE FUNCTION refresh_dashboard_views()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW mv_dashboard_blocos;
    REFRESH MATERIALIZED VIEW mv_ranking_lojistas;
    REFRESH MATERIALIZED VIEW mv_historico_cupons;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Populate inicial das views materializadas
SELECT refresh_dashboard_views();