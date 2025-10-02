-- Reabilitar triggers na tabela lojistas
ALTER TABLE public.lojistas ENABLE TRIGGER log_lojista_changes;
ALTER TABLE public.lojistas ENABLE TRIGGER trg_audit_lojistas;
ALTER TABLE public.lojistas ENABLE TRIGGER trg_lojistas_refresh_views;

-- Registrar no log
INSERT INTO logs_sistema (evento, descricao, nivel)
VALUES ('debug_triggers', 'Triggers reabilitados na tabela lojistas após debug', 'info');