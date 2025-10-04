-- Adicionar política para lojistas verem clientes através de cupons atribuídos
DROP POLICY IF EXISTS "Lojistas podem ver clientes de seus cupons" ON public.clientes;
CREATE POLICY "Lojistas podem ver clientes de seus cupons"
  ON public.clientes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.cupons c
      JOIN public.lojistas l ON c.lojista_id = l.id
      WHERE c.cliente_id = clientes.id
        AND l.user_id = auth.uid()
        AND c.status = 'atribuido'
    )
  );

-- Adicionar políticas completas para admins na tabela clientes
DROP POLICY IF EXISTS "Admins podem atualizar clientes" ON public.clientes;
CREATE POLICY "Admins podem atualizar clientes"
  ON public.clientes
  FOR UPDATE
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins podem deletar clientes" ON public.clientes;
CREATE POLICY "Admins podem deletar clientes"
  ON public.clientes
  FOR DELETE
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins podem inserir clientes" ON public.clientes;
CREATE POLICY "Admins podem inserir clientes"
  ON public.clientes
  FOR INSERT
  WITH CHECK (is_admin(auth.uid()));