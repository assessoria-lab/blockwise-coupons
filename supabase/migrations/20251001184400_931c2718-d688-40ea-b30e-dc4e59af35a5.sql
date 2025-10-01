-- Drop all existing policies on segmentos
DROP POLICY IF EXISTS "Admin pode gerenciar segmentos" ON public.segmentos;
DROP POLICY IF EXISTS "Permitir leitura pública de segmentos ativos" ON public.segmentos;
DROP POLICY IF EXISTS "Usuários podem criar novos segmentos" ON public.segmentos;

-- Create a simple, permissive SELECT policy for everyone
CREATE POLICY "allow_public_read_segmentos"
ON public.segmentos
FOR SELECT
USING (true);

-- Allow authenticated users and service role to manage segmentos
CREATE POLICY "allow_admin_all_segmentos"
ON public.segmentos
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Allow insert for authenticated users
CREATE POLICY "allow_insert_segmentos"
ON public.segmentos
FOR INSERT
TO authenticated
WITH CHECK (true);