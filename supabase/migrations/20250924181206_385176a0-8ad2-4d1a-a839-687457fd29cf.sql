-- ====================================
-- TRIGGERS E CORREÇÕES FINAIS
-- ====================================

-- 1. Triggers para atualização automática das views
CREATE OR REPLACE FUNCTION trigger_refresh_dashboard()
RETURNS TRIGGER AS $$
BEGIN
    -- Agenda refresh das views (evita locks em transações concorrentes)
    PERFORM pg_notify('refresh_views', 'dashboard');
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Remover triggers existentes se existirem
DROP TRIGGER IF EXISTS trg_blocos_refresh_views ON blocos;
DROP TRIGGER IF EXISTS trg_cupons_refresh_views ON cupons;
DROP TRIGGER IF EXISTS trg_lojistas_refresh_views ON lojistas;
DROP TRIGGER IF EXISTS trg_clientes_refresh_views ON clientes;

-- Criar triggers nas tabelas principais
CREATE TRIGGER trg_blocos_refresh_views
    AFTER INSERT OR UPDATE OR DELETE ON blocos
    FOR EACH STATEMENT EXECUTE FUNCTION trigger_refresh_dashboard();

CREATE TRIGGER trg_cupons_refresh_views
    AFTER INSERT OR UPDATE OR DELETE ON cupons
    FOR EACH STATEMENT EXECUTE FUNCTION trigger_refresh_dashboard();

CREATE TRIGGER trg_lojistas_refresh_views
    AFTER INSERT OR UPDATE OR DELETE ON lojistas
    FOR EACH STATEMENT EXECUTE FUNCTION trigger_refresh_dashboard();

CREATE TRIGGER trg_clientes_refresh_views
    AFTER INSERT OR UPDATE OR DELETE ON clientes
    FOR EACH STATEMENT EXECUTE FUNCTION trigger_refresh_dashboard();