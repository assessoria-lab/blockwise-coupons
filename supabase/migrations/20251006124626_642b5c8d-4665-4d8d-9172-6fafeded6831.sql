-- Corrige a função relatorio_utilizacao_blocos para calcular valor_gerado corretamente
-- O valor deve ser contado uma vez por transação (bloco), não por cupom individual

CREATE OR REPLACE FUNCTION public.relatorio_utilizacao_blocos(p_lojista_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(
    numero_bloco text, 
    lojista_nome text, 
    cupons_total smallint, 
    cupons_atribuidos smallint, 
    cupons_disponiveis smallint, 
    utilizacao_percentual numeric, 
    comprado_em timestamp with time zone, 
    dias_desde_compra integer, 
    valor_gerado numeric, 
    clientes_atendidos bigint
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
        -- Soma o valor_compra apenas uma vez por transação (agrupando por cliente_id, data_atribuicao, valor_compra)
        COALESCE(
            (SELECT SUM(distinct_values.valor_compra)
             FROM (
                 SELECT DISTINCT c.cliente_id, c.data_atribuicao, c.valor_compra
                 FROM cupons c
                 WHERE c.bloco_id = b.id AND c.status = 'atribuido'
             ) distinct_values
            ), 0
        ) as valor_gerado,
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
$function$;