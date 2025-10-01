-- Fix SELECT policy for segmentos to allow both authenticated and anonymous users
DROP POLICY IF EXISTS "Segmentos são visíveis publicamente" ON public.segmentos;

CREATE POLICY "Segmentos são visíveis publicamente"
ON public.segmentos
FOR SELECT
TO authenticated, anon
USING (ativo = true);