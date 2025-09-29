-- Primeiro, vamos verificar se RLS está habilitado e remover políticas conflitantes
DROP POLICY IF EXISTS "Permitir cadastro público de lojistas" ON public.usuarios_lojistas;
DROP POLICY IF EXISTS "Permitir SELECT após INSERT para usuarios_lojistas" ON public.usuarios_lojistas;

-- Criar política mais específica para INSERT público (anon role)
CREATE POLICY "Permitir INSERT público para cadastro de lojistas" 
ON public.usuarios_lojistas 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Criar política para SELECT após INSERT (necessário para .single())
CREATE POLICY "Permitir SELECT para verificação de cadastro" 
ON public.usuarios_lojistas 
FOR SELECT 
TO anon, authenticated
USING (true);

-- Fazer o mesmo para a tabela lojas
DROP POLICY IF EXISTS "Permitir criação de lojas no cadastro" ON public.lojas;
DROP POLICY IF EXISTS "Permitir SELECT após INSERT para lojas" ON public.lojas;

CREATE POLICY "Permitir INSERT público para criação de lojas" 
ON public.lojas 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Permitir SELECT para verificação de lojas" 
ON public.lojas 
FOR SELECT 
TO anon, authenticated
USING (true);