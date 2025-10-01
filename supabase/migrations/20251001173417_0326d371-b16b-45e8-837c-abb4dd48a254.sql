-- Allow public users to insert new segments during registration
CREATE POLICY "Usuários podem criar novos segmentos"
ON public.segmentos
FOR INSERT
TO authenticated, anon
WITH CHECK (true);