-- Corrigir a função vender_blocos_para_lojista_v2 removendo referências à coluna lojista_id em logs_sistema
CREATE OR REPLACE FUNCTION public.vender_blocos_para_lojista_v2(p_lojista_id uuid, p_quantidade_blocos integer, p_valor_total numeric, p_forma_pagamento character varying, p_vendedor_nome character varying DEFAULT NULL::character varying)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

    -- 6. Registra log do evento (sem coluna lojista_id)
    INSERT INTO logs_sistema (
        usuario_id, evento, descricao, dados_contexto, nivel
    ) VALUES (
        auth.uid(),
        'venda_blocos',
        'Venda de blocos registrada e transferida para lojista',
        jsonb_build_object(
            'lojista_id', p_lojista_id,
            'quantidade_blocos', p_quantidade_blocos,
            'blocos_transferidos', v_blocos_transferidos,
            'valor_total', p_valor_total,
            'forma_pagamento', p_forma_pagamento,
            'vendedor_nome', p_vendedor_nome,
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
        INSERT INTO logs_sistema (
            usuario_id, evento, descricao, dados_contexto, nivel
        ) VALUES (
            auth.uid(),
            'erro_venda_blocos',
            'Erro ao vender blocos para lojista',
            jsonb_build_object(
                'erro', SQLERRM,
                'parametros', jsonb_build_object(
                    'lojista_id', p_lojista_id,
                    'quantidade_blocos', p_quantidade_blocos,
                    'valor_total', p_valor_total,
                    'forma_pagamento', p_forma_pagamento,
                    'vendedor_nome', p_vendedor_nome
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
$function$;