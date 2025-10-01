-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Segmentos são visíveis publicamente" ON public.segmentos;

-- Create new policy that explicitly allows anon and authenticated users to read active segments
CREATE POLICY "Permitir leitura pública de segmentos ativos"
ON public.segmentos
FOR SELECT
TO anon, authenticated
USING (ativo = true);