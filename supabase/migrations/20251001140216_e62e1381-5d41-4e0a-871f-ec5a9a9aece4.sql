-- Drop the insecure policies that allow public access to business data
DROP POLICY IF EXISTS "Allow admin and lojista access" ON public.lojistas;
DROP POLICY IF EXISTS "Lojista acesso próprios dados" ON public.lojistas;

-- Policy: Admins can view all lojistas
CREATE POLICY "Admins podem ver todos os lojistas"
ON public.lojistas
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Policy: Lojistas can view only their own data
CREATE POLICY "Lojistas podem ver próprios dados"
ON public.lojistas
FOR SELECT
TO authenticated
USING (
  public.is_lojista_owner(auth.uid(), id) 
  OR user_id = auth.uid()
);

-- Policy: Only admins can insert new lojistas
CREATE POLICY "Admins podem inserir lojistas"
ON public.lojistas
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- Policy: Admins can update all lojistas
CREATE POLICY "Admins podem atualizar todos os lojistas"
ON public.lojistas
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Policy: Lojistas can update only their own data
CREATE POLICY "Lojistas podem atualizar próprios dados"
ON public.lojistas
FOR UPDATE
TO authenticated
USING (
  public.is_lojista_owner(auth.uid(), id)
  OR user_id = auth.uid()
);

-- Policy: Only admins can delete lojistas
CREATE POLICY "Admins podem deletar lojistas"
ON public.lojistas
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));