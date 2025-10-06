-- Fix Security Issue: Customer Personal Data Could Be Stolen by Anyone
-- Problem: RLS policies on 'clientes' table don't explicitly require authentication
-- Solution: Add 'TO authenticated' clause to all policies and deny anonymous access

-- ============================================
-- CLIENTES TABLE - Customer Data Security Fix
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admins podem atualizar clientes" ON public.clientes;
DROP POLICY IF EXISTS "Admins podem deletar clientes" ON public.clientes;
DROP POLICY IF EXISTS "Admins podem inserir clientes" ON public.clientes;
DROP POLICY IF EXISTS "Admins podem ver todos os clientes" ON public.clientes;
DROP POLICY IF EXISTS "Lojistas podem ver clientes através de cupons" ON public.clientes;

-- Explicitly deny all access to anonymous users
CREATE POLICY "Negar acesso anônimo a clientes"
ON public.clientes
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Only authenticated admins can view all customers
CREATE POLICY "Admins autenticados podem ver todos os clientes"
ON public.clientes
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Only authenticated admins can insert customers
CREATE POLICY "Admins autenticados podem inserir clientes"
ON public.clientes
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- Only authenticated admins can update customers
CREATE POLICY "Admins autenticados podem atualizar clientes"
ON public.clientes
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Only authenticated admins can delete customers
CREATE POLICY "Admins autenticados podem deletar clientes"
ON public.clientes
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Authenticated lojistas can only view customers who used their coupons
CREATE POLICY "Lojistas autenticados podem ver clientes através de cupons"
ON public.clientes
FOR SELECT
TO authenticated
USING (public.lojista_pode_ver_cliente(id));