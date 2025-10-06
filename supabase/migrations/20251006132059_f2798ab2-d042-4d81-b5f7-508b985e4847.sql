-- Remove public read access to clientes table to protect customer personal data
-- This policy was allowing anyone on the internet to read sensitive customer information
-- including names, CPF numbers, emails, and phone numbers

DROP POLICY IF EXISTS "Permitir leitura pública de clientes" ON public.clientes;

-- The remaining policies ensure proper access control:
-- 1. "Admins podem ver todos os clientes" - Admins can view all clients
-- 2. "Lojistas podem ver clientes através de cupons" - Lojistas can only view clients they've served
-- 3. Admin policies for INSERT, UPDATE, DELETE operations

-- This fixes the security vulnerability while maintaining necessary functionality
-- for authenticated admin users and lojistas to access client data they need