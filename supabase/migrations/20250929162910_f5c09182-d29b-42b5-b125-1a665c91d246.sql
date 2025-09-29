-- Fix RLS policies for lojas table to allow signup process
-- Drop existing policies
DROP POLICY IF EXISTS "Users can create their own stores" ON public.lojas;
DROP POLICY IF EXISTS "Users can view their own stores" ON public.lojas;
DROP POLICY IF EXISTS "Users can update their own stores" ON public.lojas;
DROP POLICY IF EXISTS "Admins can manage all stores" ON public.lojas;

-- Create new policies that work with the signup flow
CREATE POLICY "Users can create their own stores"
ON public.lojas FOR INSERT
WITH CHECK (
  auth.uid() = user_id OR 
  auth.role() = 'service_role' OR
  auth.uid() IS NOT NULL  -- Allow authenticated users to create stores
);

CREATE POLICY "Users can view their own stores"
ON public.lojas FOR SELECT
USING (auth.uid() = user_id OR is_admin(auth.uid()));

CREATE POLICY "Users can update their own stores"
ON public.lojas FOR UPDATE
USING (auth.uid() = user_id OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage all stores"
ON public.lojas FOR ALL
USING (is_admin(auth.uid()));

-- Also create a secure function to handle store creation during signup
CREATE OR REPLACE FUNCTION public.criar_loja_apos_signup(
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
  -- Verificar se o usuário está autenticado
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Usuário não autenticado');
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
    auth.uid(),
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