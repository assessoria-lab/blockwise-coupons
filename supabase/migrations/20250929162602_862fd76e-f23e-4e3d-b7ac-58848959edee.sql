-- Create a new function to fetch stores for authenticated users
CREATE OR REPLACE FUNCTION public.buscar_lojas_usuario_auth()
RETURNS TABLE(
  id uuid,
  nome_loja text,
  cnpj text,
  cidade text,
  shopping text,
  segmento text,
  ativo boolean,
  endereco text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.nome_loja,
    l.cnpj,
    l.cidade,
    l.shopping,
    l.segmento,
    l.ativo,
    l.endereco,
    l.created_at,
    l.updated_at
  FROM public.lojas l
  WHERE l.user_id = auth.uid() AND l.ativo = true;
END;
$$;