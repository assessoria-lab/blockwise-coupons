-- Ajustar políticas RLS para permitir acesso em modo demonstração
-- Temporariamente permitir acesso público para demonstração

-- Tabela lojas: permitir leitura pública
DROP POLICY IF EXISTS "Users can view their own stores" ON public.lojas;
DROP POLICY IF EXISTS "Admins can manage all stores" ON public.lojas;

CREATE POLICY "Public can view all stores"
ON public.lojas
FOR SELECT
USING (true);

CREATE POLICY "Public can manage stores for demo"
ON public.lojas
FOR ALL
USING (true)
WITH CHECK (true);

-- Tabela clientes: permitir acesso público
DROP POLICY IF EXISTS "Admins only" ON public.clientes;

CREATE POLICY "Public can access clientes for demo"
ON public.clientes
FOR ALL
USING (true)
WITH CHECK (true);

-- Tabela blocos: permitir acesso público
DROP POLICY IF EXISTS "Admins only" ON public.blocos;
DROP POLICY IF EXISTS "Lojistas podem ver apenas seus blocos" ON public.blocos;
DROP POLICY IF EXISTS "Apenas admins podem modificar blocos" ON public.blocos;

CREATE POLICY "Public can access blocos for demo"
ON public.blocos
FOR ALL
USING (true)
WITH CHECK (true);

-- Tabela cupons: permitir acesso público
DROP POLICY IF EXISTS "Admins only" ON public.cupons;
DROP POLICY IF EXISTS "Lojistas podem ver apenas seus cupons" ON public.cupons;
DROP POLICY IF EXISTS "Apenas admins podem modificar cupons" ON public.cupons;

CREATE POLICY "Public can access cupons for demo"
ON public.cupons
FOR ALL
USING (true)
WITH CHECK (true);

-- Tabela vendas_blocos: permitir acesso público
DROP POLICY IF EXISTS "Admins only" ON public.vendas_blocos;

CREATE POLICY "Public can access vendas_blocos for demo"
ON public.vendas_blocos
FOR ALL
USING (true)
WITH CHECK (true);

-- Tabela pagamentos: permitir acesso público
DROP POLICY IF EXISTS "Admins only" ON public.pagamentos;

CREATE POLICY "Public can access pagamentos for demo"
ON public.pagamentos
FOR ALL
USING (true)
WITH CHECK (true);

-- Tabela segmentos: permitir leitura pública
DROP POLICY IF EXISTS "Admins only" ON public.segmentos;

CREATE POLICY "Public can view segmentos"
ON public.segmentos
FOR SELECT
USING (true);

-- Tabela configuracoes_sistema: permitir leitura pública
DROP POLICY IF EXISTS "Admins only" ON public.configuracoes_sistema;

CREATE POLICY "Public can view configuracoes"
ON public.configuracoes_sistema
FOR SELECT
USING (true);