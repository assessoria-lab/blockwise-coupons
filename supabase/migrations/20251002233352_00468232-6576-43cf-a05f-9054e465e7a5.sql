-- Corrigir triggers que usam lojista_id na tabela lojistas
-- O problema é que os triggers estão tentando acessar NEW.lojista_id
-- mas a coluna correta é NEW.id

-- Primeiro, vamos dropar os triggers problemáticos se existirem
DROP TRIGGER IF EXISTS log_lojista_changes ON public.lojistas;
DROP TRIGGER IF EXISTS sistema_alertas_trigger ON public.lojistas;

-- Recriar a função de log para lojistas com o campo correto
CREATE OR REPLACE FUNCTION public.log_acao_lojistas()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Registra ações na tabela lojistas usando o id correto
    INSERT INTO logs_sistema (
        lojista_id,
        evento,
        descricao,
        dados_contexto,
        nivel
    ) VALUES (
        CASE 
            WHEN TG_OP = 'INSERT' THEN NEW.id
            WHEN TG_OP = 'UPDATE' THEN NEW.id
            WHEN TG_OP = 'DELETE' THEN OLD.id
        END,
        TG_OP || '_lojista',
        'Operação ' || TG_OP || ' na tabela lojistas',
        jsonb_build_object(
            'operacao', TG_OP,
            'tabela', 'lojistas',
            'timestamp', NOW()
        ),
        'info'
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Criar trigger para log de ações em lojistas
CREATE TRIGGER log_lojista_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.lojistas
    FOR EACH ROW
    EXECUTE FUNCTION public.log_acao_lojistas();