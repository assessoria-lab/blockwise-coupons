-- Permitir SELECT para lojistas recém-criados (necessário para o .select().single())
CREATE POLICY "Permitir SELECT após INSERT para usuarios_lojistas" 
ON public.usuarios_lojistas 
FOR SELECT 
TO anon, authenticated
USING (true);

-- Fazer o mesmo para a tabela lojas
CREATE POLICY "Permitir SELECT após INSERT para lojas" 
ON public.lojas 
FOR SELECT 
TO anon, authenticated
USING (true);