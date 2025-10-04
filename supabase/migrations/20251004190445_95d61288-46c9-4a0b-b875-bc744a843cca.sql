-- Remove a política recursiva que pode causar problemas
DROP POLICY IF EXISTS "Lojistas podem ver clientes de seus cupons" ON public.clientes;
DROP POLICY IF EXISTS "Lojistas podem ver seus próprios clientes" ON public.clientes;

-- Cria função security definer para verificar se lojista pode ver cliente
CREATE OR REPLACE FUNCTION public.lojista_pode_ver_cliente(p_cliente_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM cupons c
    JOIN lojistas l ON c.lojista_id = l.id
    WHERE c.cliente_id = p_cliente_id
      AND l.user_id = auth.uid()
      AND c.status = 'atribuido'
  );
$$;

-- Cria política usando a função security definer (sem recursão)
CREATE POLICY "Lojistas podem ver clientes através de cupons"
  ON public.clientes
  FOR SELECT
  USING (
    is_admin(auth.uid()) OR lojista_pode_ver_cliente(id)
  );