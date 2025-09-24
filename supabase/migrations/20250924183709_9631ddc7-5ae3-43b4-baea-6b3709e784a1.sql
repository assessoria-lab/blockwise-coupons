-- ====================================
-- BLOCO 11: SEGURANÇA E COMPLIANCE (CORRIGIDO)
-- ====================================

-- Função para log de ações administrativas
CREATE OR REPLACE FUNCTION log_acao_admin()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Função específica para auditoria de cupons (filtrada)
CREATE OR REPLACE FUNCTION log_acao_cupons_criticos()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_user_agent TEXT;
    v_ip_address INET;
BEGIN
    -- Só registra se for mudança de status ou delete
    IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
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
            TG_OP || '_cupons_status',
            format('Mudança crítica em cupom - %s', TG_OP),
            CASE
                WHEN TG_OP = 'UPDATE' THEN
                    jsonb_build_object(
                        'tabela', 'cupons',
                        'operacao', TG_OP,
                        'cupom_id', NEW.id,
                        'status_anterior', OLD.status,
                        'status_novo', NEW.status,
                        'cliente_id', COALESCE(NEW.cliente_id, OLD.cliente_id),
                        'valor_compra', COALESCE(NEW.valor_compra, OLD.valor_compra)
                    )
                WHEN TG_OP = 'DELETE' THEN
                    jsonb_build_object(
                        'tabela', 'cupons',
                        'operacao', TG_OP,
                        'cupom_id', OLD.id,
                        'dados_removidos', to_jsonb(OLD)
                    )
                ELSE NULL
            END,
            'warning',
            v_ip_address,
            v_user_agent
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Triggers de auditoria para tabelas críticas
DROP TRIGGER IF EXISTS trg_audit_lojistas ON lojistas;
CREATE TRIGGER trg_audit_lojistas
    AFTER INSERT OR UPDATE OR DELETE ON lojistas
    FOR EACH ROW
    EXECUTE FUNCTION log_acao_admin();

DROP TRIGGER IF EXISTS trg_audit_blocos ON blocos;
CREATE TRIGGER trg_audit_blocos
    AFTER INSERT OR UPDATE OR DELETE ON blocos
    FOR EACH ROW
    EXECUTE FUNCTION log_acao_admin();

DROP TRIGGER IF EXISTS trg_audit_cupons_criticos ON cupons;
CREATE TRIGGER trg_audit_cupons_criticos
    AFTER UPDATE OR DELETE ON cupons
    FOR EACH ROW
    EXECUTE FUNCTION log_acao_cupons_criticos();

DROP TRIGGER IF EXISTS trg_audit_pagamentos ON pagamentos;
CREATE TRIGGER trg_audit_pagamentos
    AFTER INSERT OR UPDATE OR DELETE ON pagamentos
    FOR EACH ROW
    EXECUTE FUNCTION log_acao_admin();

-- Função para validação de CPF
CREATE OR REPLACE FUNCTION validar_cpf()
RETURNS TRIGGER AS $$
BEGIN
    -- Remove caracteres não numéricos do CPF
    NEW.cpf := regexp_replace(NEW.cpf, '[^0-9]', '', 'g');
    
    -- Valida se tem 11 dígitos
    IF NEW.cpf IS NOT NULL AND LENGTH(NEW.cpf) != 11 THEN
        RAISE EXCEPTION 'CPF deve ter 11 dígitos: %', NEW.cpf;
    END IF;
    
    -- Valida se não são todos os dígitos iguais
    IF NEW.cpf IS NOT NULL AND NEW.cpf ~ '^(.)\1{10}$' THEN
        RAISE EXCEPTION 'CPF inválido (dígitos repetidos): %', NEW.cpf;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para validação de CPF em clientes
DROP TRIGGER IF EXISTS trg_validar_cpf_cliente ON clientes;
CREATE TRIGGER trg_validar_cpf_cliente
    BEFORE INSERT OR UPDATE ON clientes
    FOR EACH ROW
    EXECUTE FUNCTION validar_cpf();

-- Função para validação de CNPJ
CREATE OR REPLACE FUNCTION validar_cnpj()
RETURNS TRIGGER AS $$
BEGIN
    -- Remove caracteres não numéricos do CNPJ
    NEW.cnpj := regexp_replace(NEW.cnpj, '[^0-9]', '', 'g');
    
    -- Valida se tem 14 dígitos
    IF NEW.cnpj IS NOT NULL AND LENGTH(NEW.cnpj) != 14 THEN
        RAISE EXCEPTION 'CNPJ deve ter 14 dígitos: %', NEW.cnpj;
    END IF;
    
    -- Valida se não são todos os dígitos iguais
    IF NEW.cnpj IS NOT NULL AND NEW.cnpj ~ '^(.)\1{13}$' THEN
        RAISE EXCEPTION 'CNPJ inválido (dígitos repetidos): %', NEW.cnpj;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para validação de CNPJ em lojistas
DROP TRIGGER IF EXISTS trg_validar_cnpj_lojista ON lojistas;
CREATE TRIGGER trg_validar_cnpj_lojista
    BEFORE INSERT OR UPDATE ON lojistas
    FOR EACH ROW
    EXECUTE FUNCTION validar_cnpj();

-- Função para validação de saldos
CREATE OR REPLACE FUNCTION validar_saldos()
RETURNS TRIGGER AS $$
BEGIN
    -- Valida que cupons disponíveis não seja negativo
    IF NEW.cupons_disponiveis < 0 THEN
        RAISE EXCEPTION 'Cupons disponíveis não pode ser negativo: %', NEW.cupons_disponiveis;
    END IF;
    
    -- Valida que cupons atribuídos não seja negativo
    IF NEW.cupons_atribuidos < 0 THEN
        RAISE EXCEPTION 'Cupons atribuídos não pode ser negativo: %', NEW.cupons_atribuidos;
    END IF;
    
    -- Valida que a soma não ultrapasse o total do bloco
    IF NEW.cupons_disponiveis + NEW.cupons_atribuidos > NEW.cupons_no_bloco THEN
        RAISE EXCEPTION 'Soma de cupons disponíveis e atribuídos não pode exceder o total do bloco';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para validação de saldos em blocos
DROP TRIGGER IF EXISTS trg_validar_saldos_blocos ON blocos;
CREATE TRIGGER trg_validar_saldos_blocos
    BEFORE INSERT OR UPDATE ON blocos
    FOR EACH ROW
    EXECUTE FUNCTION validar_saldos();

-- Função para consulta de logs de auditoria com filtros
CREATE OR REPLACE FUNCTION consultar_logs_auditoria(
    p_data_inicio DATE DEFAULT NULL,
    p_data_fim DATE DEFAULT NULL,
    p_usuario_id UUID DEFAULT NULL,
    p_tabela TEXT DEFAULT NULL,
    p_limite INTEGER DEFAULT 100
)
RETURNS TABLE(
    id UUID,
    created_at TIMESTAMPTZ,
    usuario_id UUID,
    evento VARCHAR,
    descricao TEXT,
    dados_contexto JSONB,
    nivel VARCHAR,
    ip_address INET,
    user_agent TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        l.id,
        l.created_at,
        l.usuario_id,
        l.evento,
        l.descricao,
        l.dados_contexto,
        l.nivel,
        l.ip_address,
        l.user_agent
    FROM logs_sistema l
    WHERE
        (p_data_inicio IS NULL OR l.created_at::DATE >= p_data_inicio)
        AND (p_data_fim IS NULL OR l.created_at::DATE <= p_data_fim)
        AND (p_usuario_id IS NULL OR l.usuario_id = p_usuario_id)
        AND (p_tabela IS NULL OR l.evento ILIKE '%' || p_tabela || '%')
    ORDER BY l.created_at DESC
    LIMIT p_limite;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;