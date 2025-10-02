-- Remove a coluna lojista_id da tabela profiles (se existir)
-- Um user_id pode ter múltiplas lojas, então não faz sentido ter lojista_id no perfil

ALTER TABLE public.profiles DROP COLUMN IF EXISTS lojista_id;

-- Garante que a tabela lojistas tem user_id para vincular ao usuário
-- (já existe, mas vamos garantir)
-- Um user_id pode ter várias lojas, então não há unique constraint

-- Adiciona índice para performance nas queries por user_id
CREATE INDEX IF NOT EXISTS idx_lojistas_user_id ON public.lojistas(user_id);

-- Adiciona comentário para documentação
COMMENT ON COLUMN public.lojistas.user_id IS 'Referência ao usuário autenticado. Um usuário pode ter múltiplas lojas.';
COMMENT ON TABLE public.profiles IS 'Perfil do usuário. Não vincula a uma loja específica pois um usuário pode ter várias lojas.';