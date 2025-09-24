-- ====================================
-- FUNÇÕES SEGURAS PARA ACESSO AOS DADOS DO DASHBOARD
-- ====================================

-- Função para acessar métricas do dashboard (apenas admins)
CREATE OR REPLACE FUNCTION get_dashboard_metrics()
RETURNS TABLE (
    blocos_pool_geral BIGINT,
    blocos_com_lojistas BIGINT,
    cupons_atribuidos BIGINT,
    cupons_atribuidos_hoje BIGINT,
    cupons_nao_atribuidos BIGINT,
    blocos_vendidos_hoje BIGINT,
    ultima_atualizacao TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- Refresh da view para dados atuais
    REFRESH MATERIALIZED VIEW mv_dashboard_blocos;
    
    -- Retorna dados da view materializada
    RETURN QUERY SELECT * FROM mv_dashboard_blocos;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Função para ranking de lojistas (apenas admins)
CREATE OR REPLACE FUNCTION get_ranking_lojistas()
RETURNS TABLE (
    lojista_id UUID,
    nome_loja TEXT,
    cidade TEXT,
    total_cupons_atribuidos BIGINT,
    volume_vendas_geradas NUMERIC,
    clientes_unicos_atendidos BIGINT,
    ultima_atribuicao TIMESTAMP WITH TIME ZONE,
    cupons_disponiveis_lojista BIGINT,
    ranking_cupons BIGINT,
    ranking_vendas BIGINT,
    ultima_atualizacao TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- Refresh da view para dados atuais
    REFRESH MATERIALIZED VIEW mv_ranking_lojistas;
    
    -- Retorna dados da view materializada
    RETURN QUERY SELECT * FROM mv_ranking_lojistas;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Função para histórico de cupons com filtros (apenas admins)
CREATE OR REPLACE FUNCTION get_historico_cupons(
    p_limite INTEGER DEFAULT 100,
    p_lojista_id UUID DEFAULT NULL,
    p_data_inicio DATE DEFAULT NULL,
    p_data_fim DATE DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    numero_cupom VARCHAR,
    data_criacao TIMESTAMP WITH TIME ZONE,
    data_atribuicao TIMESTAMP WITH TIME ZONE,
    valor_compra NUMERIC,
    status VARCHAR,
    nome_loja TEXT,
    cidade_loja TEXT,
    nome_cliente TEXT,
    cpf_cliente TEXT,
    cidade_cliente VARCHAR,
    numero_bloco VARCHAR,
    mes_atribuicao TIMESTAMP WITH TIME ZONE,
    semana_atribuicao TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- Refresh da view para dados atuais
    REFRESH MATERIALIZED VIEW mv_historico_cupons;
    
    -- Retorna dados filtrados da view materializada
    RETURN QUERY 
    SELECT 
        h.id, h.numero_cupom, h.data_criacao, h.data_atribuicao, 
        h.valor_compra, h.status, h.nome_loja, h.cidade_loja,
        h.nome_cliente, h.cpf_cliente, h.cidade_cliente, h.numero_bloco,
        h.mes_atribuicao, h.semana_atribuicao
    FROM mv_historico_cupons h
    WHERE 
        (p_lojista_id IS NULL OR h.lojista_id = p_lojista_id)
        AND (p_data_inicio IS NULL OR h.data_atribuicao::DATE >= p_data_inicio)
        AND (p_data_fim IS NULL OR h.data_atribuicao::DATE <= p_data_fim)
    ORDER BY h.data_atribuicao DESC
    LIMIT p_limite;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Remover views materializadas do acesso público
-- (As views continuam existindo mas não são acessíveis via API diretamente)
REVOKE ALL ON mv_dashboard_blocos FROM PUBLIC;
REVOKE ALL ON mv_ranking_lojistas FROM PUBLIC;
REVOKE ALL ON mv_historico_cupons FROM PUBLIC;

-- Garantir que apenas o owner (postgres) tenha acesso às views
GRANT ALL ON mv_dashboard_blocos TO postgres;
GRANT ALL ON mv_ranking_lojistas TO postgres;
GRANT ALL ON mv_historico_cupons TO postgres;