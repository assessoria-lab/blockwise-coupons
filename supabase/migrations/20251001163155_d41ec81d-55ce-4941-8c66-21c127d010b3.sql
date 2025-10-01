-- Allow public read access to segmentos table
DROP POLICY IF EXISTS "Segmentos são visíveis para todos" ON public.segmentos;

CREATE POLICY "Segmentos são visíveis publicamente"
ON public.segmentos
FOR SELECT
TO public
USING (ativo = true);