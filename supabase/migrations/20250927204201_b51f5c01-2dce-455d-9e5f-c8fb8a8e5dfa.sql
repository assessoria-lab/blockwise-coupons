-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  tipo_usuario TEXT NOT NULL CHECK (tipo_usuario IN ('admin', 'lojista')),
  lojista_id UUID REFERENCES public.lojistas(id) ON DELETE SET NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Admin can manage all profiles
CREATE POLICY "Admins can manage all profiles"
ON public.profiles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.tipo_usuario = 'admin'
  )
);

-- Create function to get user profile
CREATE OR REPLACE FUNCTION public.get_user_profile(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  nome TEXT,
  email TEXT,
  tipo_usuario TEXT,
  lojista_id UUID,
  ativo BOOLEAN,
  lojista_info JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.nome,
    p.email,
    p.tipo_usuario,
    p.lojista_id,
    p.ativo,
    CASE 
      WHEN p.lojista_id IS NOT NULL THEN
        jsonb_build_object(
          'nome_loja', l.nome_loja,
          'cnpj', l.cnpj,
          'cidade', l.cidade,
          'shopping', l.shopping,
          'segmento', l.segmento
        )
      ELSE NULL
    END as lojista_info
  FROM public.profiles p
  LEFT JOIN public.lojistas l ON p.lojista_id = l.id
  WHERE p.user_id = user_uuid AND p.ativo = true;
END;
$$;

-- Add trigger for updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();