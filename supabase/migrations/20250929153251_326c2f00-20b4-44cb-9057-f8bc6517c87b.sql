-- Fix RLS policy to allow both anon and authenticated users to register
DROP POLICY IF EXISTS "Permitir cadastro público de lojistas" ON public.usuarios_lojistas;

CREATE POLICY "Permitir cadastro público de lojistas" 
ON public.usuarios_lojistas 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Also update the lojas policy
DROP POLICY IF EXISTS "Permitir criação de lojas no cadastro" ON public.lojas;

CREATE POLICY "Permitir criação de lojas no cadastro" 
ON public.lojas 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);