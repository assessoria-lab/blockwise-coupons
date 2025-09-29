-- Corrigir função get_dashboard_metrics_optimized para usar a tabela correta 'lojas' ao invés de 'lojistas'
CREATE OR REPLACE FUNCTION public.get_dashboard_metrics_optimized()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_blocos', (SELECT COUNT(*) FROM public.blocos),
        'total_cupons', (SELECT COUNT(*) FROM public.cupons),
        'cupons_disponiveis', (SELECT COUNT(*) FROM public.cupons WHERE status = 'disponivel'),
        'cupons_atribuidos', (SELECT COUNT(*) FROM public.cupons WHERE status = 'atribuido'),
        'cupons_usados', (SELECT COUNT(*) FROM public.cupons WHERE status = 'usado'),
        'total_lojistas', (SELECT COUNT(*) FROM public.lojas WHERE ativo = true),
        'total_clientes', (SELECT COUNT(*) FROM public.clientes WHERE status = 'ativo')
    ) INTO result;
    
    RETURN result;
END;
$function$;

-- Corrigir função metricas_tempo_real para usar a tabela correta 'lojas'
CREATE OR REPLACE FUNCTION public.metricas_tempo_real()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    metricas JSONB;
BEGIN
    SELECT jsonb_build_object(
        'lojistas_ativos', (SELECT COUNT(*) FROM public.lojas WHERE ativo = true),
        'cupons_disponiveis', (SELECT COUNT(*) FROM public.cupons WHERE status = 'disponivel'),
        'cupons_atribuidos', (SELECT COUNT(*) FROM public.cupons WHERE status = 'atribuido'),
        'blocos_no_pool', (SELECT COUNT(*) FROM public.blocos WHERE lojista_id IS NULL),
        'blocos_vendidos', (SELECT COUNT(*) FROM public.blocos WHERE lojista_id IS NOT NULL),
        'valor_gerado', (SELECT COALESCE(SUM(valor_total), 0) FROM public.vendas_blocos),
        'ultima_atualizacao', now()
    ) INTO metricas;
    
    RETURN metricas;
END;
$function$;

-- Corrigir função relatorio_utilizacao_blocos para usar a tabela correta 'lojas'
CREATE OR REPLACE FUNCTION public.relatorio_utilizacao_blocos()
RETURNS TABLE(bloco_id uuid, numero_bloco text, lojista_nome text, cupons_totais integer, cupons_usados integer, percentual_uso numeric, ultima_atividade timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        b.numero_bloco,
        COALESCE(l.nome_loja, 'Pool Geral') as lojista_nome,
        b.cupons_totais,
        b.cupons_usados,
        CASE 
            WHEN b.cupons_totais > 0 THEN ROUND((b.cupons_usados::DECIMAL / b.cupons_totais::DECIMAL) * 100, 2)
            ELSE 0
        END as percentual_uso,
        b.updated_at
    FROM public.blocos b
    LEFT JOIN public.lojas l ON b.lojista_id = l.id
    ORDER BY b.created_at DESC;
END;
$function$;

-- Corrigir função vender_blocos_para_lojista_v2 para usar a tabela correta 'lojas'
CREATE OR REPLACE FUNCTION public.vender_blocos_para_lojista_v2(p_lojista_id uuid, p_quantidade integer, p_valor_total numeric, p_forma_pagamento forma_pagamento, p_vendedor_nome text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    blocos_disponiveis CURSOR FOR 
        SELECT id FROM public.blocos 
        WHERE lojista_id IS NULL AND status = 'disponivel' 
        LIMIT p_quantidade;
    bloco_record RECORD;
    contador INTEGER := 0;
    venda_id UUID;
BEGIN
    -- Verificar se há blocos suficientes
    IF (SELECT COUNT(*) FROM public.blocos WHERE lojista_id IS NULL AND status = 'disponivel') < p_quantidade THEN
        RETURN jsonb_build_object('success', false, 'message', 'Blocos insuficientes no pool');
    END IF;

    -- Criar registro de venda
    INSERT INTO public.vendas_blocos (lojista_id, quantidade_blocos, quantidade_cupons, valor_total, forma_pagamento)
    VALUES (p_lojista_id, p_quantidade, p_quantidade * 100, p_valor_total, p_forma_pagamento)
    RETURNING id INTO venda_id;

    -- Criar registro de pagamento
    INSERT INTO public.pagamentos (venda_id, valor, quantidade_blocos, forma_pagamento, status, status_pagamento)
    VALUES (venda_id, p_valor_total, p_quantidade, p_forma_pagamento, 'confirmado', 'pago');

    -- Atribuir blocos ao lojista
    FOR bloco_record IN blocos_disponiveis LOOP
        UPDATE public.blocos 
        SET lojista_id = p_lojista_id, status = 'vendido'
        WHERE id = bloco_record.id;
        
        UPDATE public.cupons 
        SET lojista_id = p_lojista_id
        WHERE bloco_id = bloco_record.id;
        
        -- Atualizar venda_id do primeiro bloco para referência
        IF contador = 0 THEN
            UPDATE public.vendas_blocos 
            SET bloco_id = bloco_record.id 
            WHERE id = venda_id;
        END IF;
        
        contador := contador + 1;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true, 
        'message', 'Venda realizada com sucesso',
        'blocos_vendidos', contador,
        'venda_id', venda_id
    );
END;
$function$;