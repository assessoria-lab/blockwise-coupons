-- Adiciona política para permitir leitura pública de lojistas
-- Necessário para que joins com cupons funcionem corretamente
-- Dados como nome da loja, cidade e shopping não são sensíveis
CREATE POLICY "Permitir leitura pública de informações básicas de lojistas"
  ON public.lojistas
  FOR SELECT
  USING (true);