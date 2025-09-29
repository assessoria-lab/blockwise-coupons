-- Corrigir a função criar_loja_apos_signup para aceitar user_id como parâmetro
-- e ter melhor controle sobre a autenticação

DROP FUNCTION IF EXISTS public.criar_loja_apos_signup(text, text, text, text, text, text);

CREATE OR REPLACE FUNCTION public.criar_loja_apos_signup(
  p_user_id uuid,
  p_nome_loja text,
  p_cnpj text,
  p_cidade text,
  p_shopping text DEFAULT NULL,
  p_segmento text DEFAULT NULL,
  p_endereco text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  loja_id uuid;
BEGIN
  -- Verificar se o user_id foi fornecido
  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'User ID não fornecido');
  END IF;

  -- Verificar se o usuário existe na tabela auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Usuário não encontrado');
  END IF;

  -- Inserir a loja
  INSERT INTO public.lojas (
    user_id,
    nome_loja,
    cnpj,
    cidade,
    shopping,
    segmento,
    endereco
  )
  VALUES (
    p_user_id,
    p_nome_loja,
    p_cnpj,
    p_cidade,
    p_shopping,
    p_segmento,
    p_endereco
  )
  RETURNING id INTO loja_id;

  RETURN jsonb_build_object(
    'success', true,
    'loja_id', loja_id,
    'message', 'Loja criada com sucesso'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'message', 'Erro ao criar loja: ' || SQLERRM
  );
END;
$$;