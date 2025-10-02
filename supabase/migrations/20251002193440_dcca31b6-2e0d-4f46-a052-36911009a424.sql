-- Corrigir a função log_acao_admin para preencher lojista_id quando necessário
DROP TRIGGER IF EXISTS log_acao_admin ON public.profiles;
DROP TRIGGER IF EXISTS trg_audit_lojistas ON public.lojistas;

-- Recriar a função log_acao_admin com suporte para lojista_id
CREATE OR REPLACE FUNCTION public.log_acao_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_user_id UUID;
    v_lojista_id UUID := NULL;
    v_user_agent TEXT;
    v_ip_address INET;
BEGIN
    -- Tenta obter o ID do usuário autenticado
    v_user_id := auth.uid();
    
    -- Se estamos auditando a tabela lojistas, pega o ID da loja
    IF TG_TABLE_NAME = 'lojistas' THEN
        v_lojista_id := COALESCE(NEW.id, OLD.id);
    END IF;
    
    -- Obtém informações da requisição se disponíveis
    BEGIN
        v_user_agent := current_setting('request.headers', true)::jsonb->>'user-agent';
        v_ip_address := inet_client_addr();
    EXCEPTION
        WHEN OTHERS THEN
            v_user_agent := NULL;
            v_ip_address := NULL;
    END;

    -- Registra a ação no log
    INSERT INTO logs_sistema (
        usuario_id,
        lojista_id,
        evento,
        descricao,
        dados_contexto,
        nivel,
        ip_address,
        user_agent
    ) VALUES (
        v_user_id,
        v_lojista_id,
        TG_OP || '_' || TG_TABLE_NAME,
        format('Ação %s na tabela %s', TG_OP, TG_TABLE_NAME),
        CASE
            WHEN TG_OP = 'UPDATE' THEN
                jsonb_build_object(
                    'tabela', TG_TABLE_NAME,
                    'operacao', TG_OP,
                    'registro_id', COALESCE(NEW.id, OLD.id),
                    'dados_anteriores', to_jsonb(OLD),
                    'dados_novos', to_jsonb(NEW)
                )
            WHEN TG_OP = 'INSERT' THEN
                jsonb_build_object(
                    'tabela', TG_TABLE_NAME,
                    'operacao', TG_OP,
                    'registro_id', NEW.id,
                    'dados_novos', to_jsonb(NEW)
                )
            WHEN TG_OP = 'DELETE' THEN
                jsonb_build_object(
                    'tabela', TG_TABLE_NAME,
                    'operacao', TG_OP,
                    'registro_id', OLD.id,
                    'dados_removidos', to_jsonb(OLD)
                )
            ELSE NULL
        END,
        'info',
        v_ip_address,
        v_user_agent
    );

    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Recriar os triggers
CREATE TRIGGER log_acao_admin
    AFTER INSERT OR UPDATE OR DELETE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.log_acao_admin();

CREATE TRIGGER trg_audit_lojistas
    AFTER INSERT OR UPDATE OR DELETE ON public.lojistas
    FOR EACH ROW
    EXECUTE FUNCTION public.log_acao_admin();