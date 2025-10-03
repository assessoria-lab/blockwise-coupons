-- Adiciona policy para permitir que lojistas criem pagamentos
CREATE POLICY "Lojistas podem criar seus próprios pagamentos"
ON pagamentos
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM lojistas
    WHERE lojistas.id = pagamentos.lojista_id
    AND lojistas.user_id = auth.uid()
  )
);

-- Adiciona policy para permitir que service role (edge functions) crie pagamentos
CREATE POLICY "Service role pode criar pagamentos"
ON pagamentos
FOR INSERT
TO service_role
WITH CHECK (true);