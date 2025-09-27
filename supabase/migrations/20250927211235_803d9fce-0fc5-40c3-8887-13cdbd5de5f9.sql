-- Modificar tabela lojistas para ter referência ao usuário
ALTER TABLE public.lojistas 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Modificar tabela profiles para remover lojista_id (já que um usuário pode ter múltiplas lojas)
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS lojista_id;

-- Criar índice para performance nas consultas por user_id na tabela lojistas
CREATE INDEX idx_lojistas_user_id ON public.lojistas(user_id);

-- Atualizar RLS policies para lojistas
DROP POLICY IF EXISTS "Admin pode ver todos os lojistas" ON public.lojistas;

-- Política para admin ver todas as lojas
CREATE POLICY "Admin pode ver todas as lojas" 
ON public.lojistas 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Política para lojista ver e gerenciar apenas suas lojas
CREATE POLICY "Lojista pode ver suas próprias lojas" 
ON public.lojistas 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Lojista pode criar suas próprias lojas" 
ON public.lojistas 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Lojista pode atualizar suas próprias lojas" 
ON public.lojistas 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Atualizar políticas de cupons para funcionar com a nova estrutura
DROP POLICY IF EXISTS "Admin pode gerenciar cupons" ON public.cupons;

CREATE POLICY "Admin pode gerenciar cupons" 
ON public.cupons 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Política para lojista ver cupons de suas lojas
CREATE POLICY "Lojista pode ver cupons de suas lojas" 
ON public.cupons 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.lojistas l 
    WHERE l.id = cupons.lojista_id 
    AND l.user_id = auth.uid()
  )
);

-- Atualizar políticas de blocos
DROP POLICY IF EXISTS "Admin pode gerenciar blocos" ON public.blocos;

CREATE POLICY "Admin pode gerenciar blocos" 
ON public.blocos 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Política para lojista ver blocos de suas lojas
CREATE POLICY "Lojista pode ver blocos de suas lojas" 
ON public.blocos 
FOR SELECT 
USING (
  lojista_id IS NULL OR -- Blocos no pool
  EXISTS (
    SELECT 1 FROM public.lojistas l 
    WHERE l.id = blocos.lojista_id 
    AND l.user_id = auth.uid()
  )
);