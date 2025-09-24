-- ====================================
-- BLOCO 10: MONITORAMENTO E ALERTAS INTELIGENTES
-- ====================================

-- Função para sistema de alertas automáticos
CREATE OR REPLACE FUNCTION sistema_alertas()
RETURNS TRIGGER AS $$
DECLARE
    v_loja_nome TEXT;
    v_saldo_total INTEGER;
BEGIN
    -- Alerta de saldo crítico (menos de 50 cupons disponíveis em um bloco)
    IF TG_TABLE_NAME = 'blocos' AND NEW.status = 'vendido' AND NEW.cupons_disponiveis < 50 THEN
        SELECT nome_loja INTO v_loja_nome FROM lojistas WHERE id = NEW.lojista_id;
        
        INSERT INTO logs_sistema (lojista_id, evento, descricao, dados_contexto, nivel)
        VALUES (
            NEW.lojista_id,
            'saldo_critico_bloco',
            'Bloco com saldo crítico de cupons',
            jsonb_build_object(
                'bloco_id', NEW.id,
                'numero_bloco', NEW.numero_bloco,
                'lojista', v_loja_nome,
                'cupons_disponiveis', NEW.cupons_disponiveis,
                'limite_critico', 50
            ),
            'warning'
        );
    END IF;

    -- Alerta quando lojista fica com saldo total baixo (menos de 100 cupons no total)
    IF TG_TABLE_NAME = 'blocos' AND NEW.status = 'vendido' AND NEW.lojista_id IS NOT NULL THEN
        SELECT COALESCE(SUM(cupons_disponiveis), 0) INTO v_saldo_total
        FROM blocos 
        WHERE lojista_id = NEW.lojista_id AND status = 'vendido';
        
        IF v_saldo_total < 100 THEN
            SELECT nome_loja INTO v_loja_nome FROM lojistas WHERE id = NEW.lojista_id;
            
            INSERT INTO logs_sistema (lojista_id, evento, descricao, dados_contexto, nivel)
            VALUES (
                NEW.lojista_id,
                'saldo_critico_lojista',
                'Lojista com saldo total crítico',
                jsonb_build_object(
                    'lojista', v_loja_nome,
                    'saldo_total', v_saldo_total,
                    'limite_critico', 100
                ),
                'error'
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para monitoramento automático em blocos
DROP TRIGGER IF EXISTS trg_sistema_alertas_blocos ON blocos;
CREATE TRIGGER trg_sistema_alertas_blocos
    AFTER UPDATE ON blocos
    FOR EACH ROW
    WHEN (OLD.cupons_disponiveis IS DISTINCT FROM NEW.cupons_disponiveis)
    EXECUTE FUNCTION sistema_alertas();

-- Função para análise preditiva de demanda
CREATE OR REPLACE FUNCTION analise_demanda_cupons(
    p_lojista_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_media_diaria NUMERIC;
    v_tendencia NUMERIC;
    v_projecao_30_dias NUMERIC;
    v_recomendacao TEXT;
    v_saldo_atual INTEGER;
BEGIN
    -- Calcula média de atribuições nos últimos 30 dias e tendência
    WITH dados_diarios AS (
        SELECT
            DATE(c.data_atribuicao) as data_atribuicao,
            COUNT(*) as atribuicoes_dia
        FROM cupons c
        WHERE c.status = 'atribuido'
        AND c.data_atribuicao >= CURRENT_DATE - INTERVAL '30 days'
        AND (p_lojista_id IS NULL OR c.lojista_id = p_lojista_id)
        GROUP BY DATE(c.data_atribuicao)
        ORDER BY DATE(c.data_atribuicao)
    ),
    dados_com_lag AS (
        SELECT
            data_atribuicao,
            atribuicoes_dia,
            LAG(atribuicoes_dia) OVER (ORDER BY data_atribuicao) as atribuicoes_dia_anterior
        FROM dados_diarios
    )
    SELECT
        AVG(atribuicoes_dia)::NUMERIC,
        AVG(atribuicoes_dia - COALESCE(atribuicoes_dia_anterior, atribuicoes_dia))::NUMERIC
    INTO v_media_diaria, v_tendencia
    FROM dados_com_lag;

    -- Projeção para próximos 30 dias
    v_projecao_30_dias := COALESCE(v_media_diaria, 0) * 30 + COALESCE(v_tendencia, 0) * 15;
    IF v_projecao_30_dias < 0 THEN v_projecao_30_dias := 0; END IF;

    -- Obtém saldo atual
    IF p_lojista_id IS NOT NULL THEN
        SELECT COALESCE(SUM(cupons_disponiveis), 0) INTO v_saldo_atual
        FROM blocos
        WHERE lojista_id = p_lojista_id AND status = 'vendido';
    ELSE
        SELECT COALESCE(SUM(cupons_disponiveis), 0) INTO v_saldo_atual
        FROM blocos WHERE status = 'vendido';
    END IF;

    -- Gera recomendação baseada na análise
    IF v_saldo_atual < v_projecao_30_dias * 0.5 THEN
        v_recomendacao := 'REABASTECER_ESTOQUE';
    ELSIF v_tendencia < -2 THEN
        v_recomendacao := 'BAIXA_DEMANDA';
    ELSE
        v_recomendacao := 'NIVEL_ADEQUADO';
    END IF;

    RETURN jsonb_build_object(
        'media_diaria', ROUND(COALESCE(v_media_diaria, 0), 2),
        'tendencia', ROUND(COALESCE(v_tendencia, 0), 2),
        'projecao_30_dias', ROUND(v_projecao_30_dias, 0),
        'saldo_atual', v_saldo_atual,
        'recomendacao', v_recomendacao,
        'data_analise', NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Função para análise de padrões temporais
CREATE OR REPLACE FUNCTION analise_padroes_temporais()
RETURNS JSONB AS $$
DECLARE
    v_por_hora JSONB;
    v_por_dia_semana JSONB;
    v_por_mes JSONB;
BEGIN
    -- Atribuições por hora do dia (últimos 7 dias)
    SELECT jsonb_agg(
        jsonb_build_object('hora', hora, 'atribuicoes', atribuicoes)
        ORDER BY hora
    ) INTO v_por_hora
    FROM (
        SELECT
            EXTRACT(HOUR FROM data_atribuicao)::INTEGER as hora,
            COUNT(*) as atribuicoes
        FROM cupons
        WHERE status = 'atribuido'
        AND data_atribuicao >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY EXTRACT(HOUR FROM data_atribuicao)
        ORDER BY hora
    ) sub;

    -- Atribuições por dia da semana (últimos 30 dias)
    SELECT jsonb_agg(
        jsonb_build_object('dia_semana', dia_semana, 'atribuicoes', atribuicoes)
        ORDER BY dia_num
    ) INTO v_por_dia_semana
    FROM (
        SELECT
            EXTRACT(DOW FROM data_atribuicao) as dia_num,
            CASE EXTRACT(DOW FROM data_atribuicao)
                WHEN 0 THEN 'Dom'
                WHEN 1 THEN 'Seg'
                WHEN 2 THEN 'Ter'
                WHEN 3 THEN 'Qua'
                WHEN 4 THEN 'Qui'
                WHEN 5 THEN 'Sex'
                WHEN 6 THEN 'Sáb'
            END as dia_semana,
            COUNT(*) as atribuicoes
        FROM cupons
        WHERE status = 'atribuido'
        AND data_atribuicao >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY EXTRACT(DOW FROM data_atribuicao)
        ORDER BY EXTRACT(DOW FROM data_atribuicao)
    ) sub;

    -- Atribuições por mês (últimos 12 meses)
    SELECT jsonb_agg(
        jsonb_build_object('mes', mes, 'atribuicoes', atribuicoes)
        ORDER BY ano, mes_num
    ) INTO v_por_mes
    FROM (
        SELECT
            EXTRACT(YEAR FROM data_atribuicao) as ano,
            EXTRACT(MONTH FROM data_atribuicao) as mes_num,
            TO_CHAR(data_atribuicao, 'Mon/YY') as mes,
            COUNT(*) as atribuicoes
        FROM cupons
        WHERE status = 'atribuido'
        AND data_atribuicao >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY EXTRACT(YEAR FROM data_atribuicao), EXTRACT(MONTH FROM data_atribuicao), TO_CHAR(data_atribuicao, 'Mon/YY')
        ORDER BY ano, mes_num
    ) sub;

    RETURN jsonb_build_object(
        'por_hora', COALESCE(v_por_hora, '[]'::JSONB),
        'por_dia_semana', COALESCE(v_por_dia_semana, '[]'::JSONB),
        'por_mes', COALESCE(v_por_mes, '[]'::JSONB)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Função para métricas de monitoramento em tempo real
CREATE OR REPLACE FUNCTION metricas_tempo_real()
RETURNS JSONB AS $$
DECLARE
    v_resultado JSONB;
BEGIN
    SELECT jsonb_build_object(
        'lojistas_ativos', (
            SELECT COUNT(DISTINCT lojista_id)
            FROM blocos 
            WHERE status = 'vendido' AND cupons_disponiveis > 0
        ),
        'cupons_disponiveis', (
            SELECT COALESCE(SUM(cupons_disponiveis), 0)
            FROM blocos 
            WHERE status = 'vendido'
        ),
        'cupons_atribuidos_hoje', (
            SELECT COUNT(*)
            FROM cupons 
            WHERE status = 'atribuido' AND data_atribuicao::DATE = CURRENT_DATE
        ),
        'cupons_atribuidos_total', (
            SELECT COUNT(*)
            FROM cupons 
            WHERE status = 'atribuido'
        ),
        'blocos_pool', (
            SELECT COUNT(*)
            FROM blocos 
            WHERE status = 'disponivel'
        ),
        'blocos_vendidos_hoje', (
            SELECT COUNT(*)
            FROM blocos 
            WHERE status = 'vendido' AND data_venda::DATE = CURRENT_DATE
        ),
        'valor_gerado_hoje', (
            SELECT COALESCE(SUM(valor_compra), 0)
            FROM cupons 
            WHERE status = 'atribuido' AND data_atribuicao::DATE = CURRENT_DATE
        ),
        'ultima_atualizacao', NOW()
    ) INTO v_resultado;

    RETURN v_resultado;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;