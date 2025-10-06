-- Adiciona política para permitir leitura pública de clientes
-- Necessário porque o sistema usa autenticação customizada para admins
CREATE POLICY "Permitir leitura pública de clientes"
  ON public.clientes
  FOR SELECT
  USING (true);