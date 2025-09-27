-- Fix RLS policy recursion issue by using security definer function
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- Create security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = user_uuid AND tipo_usuario = 'admin' AND ativo = true
  )
$$;

-- Create policy using the security definer function
CREATE POLICY "Admins can manage all profiles"
ON public.profiles
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Create function to check if user is lojista and owns the data
CREATE OR REPLACE FUNCTION public.is_lojista_owner(user_uuid UUID, target_lojista_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = user_uuid 
    AND tipo_usuario = 'lojista' 
    AND lojista_id = target_lojista_id
    AND ativo = true
  )
$$;