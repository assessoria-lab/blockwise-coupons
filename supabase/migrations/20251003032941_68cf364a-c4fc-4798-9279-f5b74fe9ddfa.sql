-- Fix duplicate block number issue by finding the last block number for the day
CREATE OR REPLACE FUNCTION public.criar_blocos_pool(p_quantidade_blocos integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_bloco_numero VARCHAR(30);
    v_cupom_numero_seq BIGINT;
    v_cupom_formatado VARCHAR(20);
    v_bloco_id UUID;
    v_ultimo_numero INTEGER;
    v_data_hoje TEXT;
    bloco INTEGER;
    cupom INTEGER;
BEGIN
    v_data_hoje := TO_CHAR(NOW(), 'YYYYMMDD');
    
    -- Busca o último número de bloco criado hoje
    SELECT COALESCE(
        MAX(
            CAST(
                SUBSTRING(numero_bloco FROM '_(\d+)$') AS INTEGER
            )
        ), 
        0
    ) INTO v_ultimo_numero
    FROM blocos
    WHERE numero_bloco LIKE 'BL' || v_data_hoje || '_%';

    FOR bloco IN 1..p_quantidade_blocos LOOP
        -- Incrementa o número baseado no último encontrado
        v_ultimo_numero := v_ultimo_numero + 1;
        v_bloco_numero := 'BL' || v_data_hoje || '_' || LPAD(v_ultimo_numero::TEXT, 6, '0');
        
        INSERT INTO blocos (numero_bloco) VALUES (v_bloco_numero)
        RETURNING id INTO v_bloco_id;

        -- Create 100 sequential coupons for this block
        FOR cupom IN 1..100 LOOP
            v_cupom_numero_seq := nextval('seq_cupom_global');
            v_cupom_formatado := 'CP' || LPAD(v_cupom_numero_seq::TEXT, 12, '0');
            
            INSERT INTO cupons (
                numero_cupom, numero_formatado, bloco_id, status
            ) VALUES (
                v_cupom_numero_seq, v_cupom_formatado, v_bloco_id, 'disponivel'
            );
        END LOOP;
    END LOOP;

    RETURN jsonb_build_object('sucesso', true, 'blocos_criados', p_quantidade_blocos);
END;
$function$;