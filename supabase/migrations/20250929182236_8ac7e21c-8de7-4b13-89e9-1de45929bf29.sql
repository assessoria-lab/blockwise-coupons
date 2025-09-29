-- Adicionar política para usuários autenticados lerem seus próprios dados em usuarios_admin
CREATE POLICY "Users can view their own admin profile"
ON public.usuarios_admin
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Adicionar política para usuários autenticados lerem seus próprios dados em usuarios_lojistas
CREATE POLICY "Users can view their own lojista profile"
ON public.usuarios_lojistas
FOR SELECT
TO authenticated
USING (id = auth.uid());