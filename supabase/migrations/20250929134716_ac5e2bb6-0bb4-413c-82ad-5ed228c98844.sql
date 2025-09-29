-- Permitir inserções públicas na tabela usuarios_lojistas para cadastro
CREATE POLICY "Permitir cadastro público de lojistas" 
ON public.usuarios_lojistas 
FOR INSERT 
TO anon 
WITH CHECK (true);

-- Permitir inserções públicas na tabela lojas para cadastro
CREATE POLICY "Permitir criação de lojas no cadastro" 
ON public.lojas 
FOR INSERT 
TO anon 
WITH CHECK (true);