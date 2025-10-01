-- Desabilitar RLS na tabela segmentos já que ela deve ser pública
ALTER TABLE public.segmentos DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "allow_public_read_segmentos" ON public.segmentos;
DROP POLICY IF EXISTS "allow_admin_all_segmentos" ON public.segmentos;
DROP POLICY IF EXISTS "allow_insert_segmentos" ON public.segmentos;