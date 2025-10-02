-- Verificar se a tabela lojistas existe, se não, renomear lojas para lojistas
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'lojistas') THEN
        -- Renomear a tabela lojas para lojistas
        ALTER TABLE IF EXISTS public.lojas RENAME TO lojistas;
        
        -- Log da operação
        RAISE NOTICE 'Tabela lojas renomeada para lojistas';
    ELSE
        RAISE NOTICE 'Tabela lojistas já existe';
    END IF;
END $$;