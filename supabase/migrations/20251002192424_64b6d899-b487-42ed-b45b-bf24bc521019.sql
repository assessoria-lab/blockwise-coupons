-- Verificar e remover qualquer referência a lojista_id em triggers e funções

-- 1. Dropar o trigger log_acao_admin se existir (pode estar causando o problema)
DROP TRIGGER IF EXISTS log_acao_admin ON public.profiles;

-- 2. Recriar a função log_acao_admin SEM referência a lojista_id
CREATE OR REPLACE FUNCTION public.log_acao_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_user_id UUID;
    v_user_agent TEXT;
    v_ip_address INET;
BEGIN
    -- Tenta obter o ID do usuário autenticado
    v_user_id := auth.uid();
    
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
        evento,
        descricao,
        dados_contexto,
        nivel,
        ip_address,
        user_agent
    ) VALUES (
        v_user_id,
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

-- 3. Recriar o trigger para profiles (se necessário)
CREATE TRIGGER log_acao_admin
    AFTER INSERT OR UPDATE OR DELETE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.log_acao_admin();