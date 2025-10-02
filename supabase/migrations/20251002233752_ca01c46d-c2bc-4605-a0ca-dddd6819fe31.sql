-- Desabilitar temporariamente triggers AFTER INSERT na tabela lojistas
ALTER TABLE public.lojistas DISABLE TRIGGER log_lojista_changes;
ALTER TABLE public.lojistas DISABLE TRIGGER trg_audit_lojistas;
ALTER TABLE public.lojistas DISABLE TRIGGER trg_lojistas_refresh_views;

-- Registrar no log que os triggers foram desabilitados para debug
INSERT INTO logs_sistema (evento, descricao, nivel)
VALUES ('debug_triggers', 'Triggers AFTER desabilitados temporariamente na tabela lojistas para debug', 'info');