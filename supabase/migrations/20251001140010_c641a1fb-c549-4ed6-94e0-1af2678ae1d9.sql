-- Drop the insecure policy that allows public access to admin credentials
DROP POLICY IF EXISTS "Allow admin operations" ON public.usuarios_admin;

-- Policy: Only authenticated admins can view admin users
CREATE POLICY "Admins podem ver usuarios admin"
ON public.usuarios_admin
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Policy: Only authenticated admins can insert new admin users
CREATE POLICY "Admins podem inserir usuarios admin"
ON public.usuarios_admin
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- Policy: Only authenticated admins can update admin users
CREATE POLICY "Admins podem atualizar usuarios admin"
ON public.usuarios_admin
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Policy: Only authenticated admins can delete admin users
CREATE POLICY "Admins podem deletar usuarios admin"
ON public.usuarios_admin
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));