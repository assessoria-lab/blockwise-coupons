-- Drop the insecure policy that allows public access to all client data
DROP POLICY IF EXISTS "Admin pode ver todos os clientes" ON public.clientes;

-- Create a security definer function to check if a lojista can access a specific client
-- A lojista can only see clients who have received coupons from them
CREATE OR REPLACE FUNCTION public.can_lojista_view_cliente(_user_id uuid, _cliente_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.lojistas l ON l.user_id = p.user_id
    JOIN public.cupons c ON c.lojista_id = l.id
    WHERE p.user_id = _user_id
      AND p.tipo_usuario = 'lojista'
      AND p.ativo = true
      AND c.cliente_id = _cliente_id
  )
$$;

-- Policy: Only admins can see all clients
CREATE POLICY "Admins podem ver todos os clientes"
ON public.clientes
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Policy: Lojistas can only see clients who received their coupons
CREATE POLICY "Lojistas podem ver seus próprios clientes"
ON public.clientes
FOR SELECT
TO authenticated
USING (public.can_lojista_view_cliente(auth.uid(), id));

-- Policy: Only admins can insert clients
CREATE POLICY "Admins podem inserir clientes"
ON public.clientes
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- Policy: Only admins can update clients
CREATE POLICY "Admins podem atualizar clientes"
ON public.clientes
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Policy: Only admins can delete clients
CREATE POLICY "Admins podem deletar clientes"
ON public.clientes
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));