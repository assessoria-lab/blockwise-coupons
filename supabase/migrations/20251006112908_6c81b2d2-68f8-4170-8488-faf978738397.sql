-- Adiciona coluna estado na tabela clientes
ALTER TABLE public.clientes
ADD COLUMN estado VARCHAR(2);

-- Atualiza a função RPC para incluir o parâmetro estado
CREATE OR REPLACE FUNCTION public.atribuir_cupons_para_cliente(
    p_lojista_id uuid,
    p_cliente_cpf character varying,
    p_cliente_nome character varying,
    p_cliente_telefone character varying,
    p_valor_compra numeric,
    p_cliente_estado character varying DEFAULT NULL,
    p_cliente_cidade character varying DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

    -- 3. Busca ou cria cliente (agora com estado e cidade)
    SELECT id INTO v_cliente_id FROM clientes WHERE cpf = p_cliente_cpf;

    IF v_cliente_id IS NULL THEN
        INSERT INTO clientes (nome, cpf, telefone, estado, cidade)
        VALUES (p_cliente_nome, p_cliente_cpf, p_cliente_telefone, p_cliente_estado, p_cliente_cidade)
        RETURNING id INTO v_cliente_id;
    ELSE
        -- Atualiza dados do cliente existente se necessário (incluindo estado e cidade)
        UPDATE clientes
        SET
            nome = COALESCE(p_cliente_nome, nome),
            telefone = COALESCE(p_cliente_telefone, telefone),
            estado = COALESCE(p_cliente_estado, estado),
            cidade = COALESCE(p_cliente_cidade, cidade),
            updated_at = NOW()
        WHERE id = v_cliente_id;
    END IF;

    -- 4. Atribui os cupons
    FOR i IN 1..v_cupons_necessarios LOOP
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
            'valor_compra', p_valor_compra,
            'estado_cliente', p_cliente_estado,
            'cidade_cliente', p_cliente_cidade
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
                    'valor_compra', p_valor_compra,
                    'estado_cliente', p_cliente_estado,
                    'cidade_cliente', p_cliente_cidade
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
$function$;