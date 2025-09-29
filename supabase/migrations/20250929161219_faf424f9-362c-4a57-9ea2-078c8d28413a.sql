-- First, clean up existing data and create proper auth integration
-- Remove the redundant lojistas table since we have usuarios_lojistas
DROP TABLE IF EXISTS public.lojistas CASCADE;

-- Clear existing usuarios_lojistas that don't have auth records
DELETE FROM public.usuarios_lojistas;
DELETE FROM public.lojas;

-- Update usuarios_lojistas table structure to work with auth.users
-- Remove the old foreign key constraint first
ALTER TABLE public.usuarios_lojistas DROP CONSTRAINT IF EXISTS usuarios_lojistas_id_fkey;

-- Now add the proper foreign key to auth.users
ALTER TABLE public.usuarios_lojistas 
ADD CONSTRAINT usuarios_lojistas_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create trigger to automatically create user profile when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios_lojistas (
    id,
    nome,
    email,
    telefone
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email,
    NEW.raw_user_meta_data->>'telefone'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to execute function when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update lojas table to reference auth.users directly
ALTER TABLE public.lojas RENAME COLUMN usuario_lojista_id TO user_id;
ALTER TABLE public.lojas DROP CONSTRAINT IF EXISTS lojas_usuario_lojista_id_fkey;
ALTER TABLE public.lojas 
ADD CONSTRAINT lojas_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update RLS policies for proper auth integration
DROP POLICY IF EXISTS "Permitir INSERT público para cadastro de lojistas" ON public.usuarios_lojistas;
DROP POLICY IF EXISTS "Permitir SELECT para verificação de cadastro" ON public.usuarios_lojistas;
DROP POLICY IF EXISTS "Lojistas podem ver apenas seus próprios dados" ON public.usuarios_lojistas;
DROP POLICY IF EXISTS "Admins podem gerenciar usuarios_lojistas" ON public.usuarios_lojistas;

-- New RLS policies for usuarios_lojistas
CREATE POLICY "Users can view their own profile"
ON public.usuarios_lojistas FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.usuarios_lojistas FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles"
ON public.usuarios_lojistas FOR ALL
USING (is_admin(auth.uid()));

-- Update RLS policies for lojas
DROP POLICY IF EXISTS "Permitir INSERT público para criação de lojas" ON public.lojas;
DROP POLICY IF EXISTS "Permitir SELECT para verificação de lojas" ON public.lojas;
DROP POLICY IF EXISTS "Lojistas podem ver apenas suas próprias lojas" ON public.lojas;
DROP POLICY IF EXISTS "Admins podem gerenciar todas as lojas" ON public.lojas;

-- New RLS policies for lojas
CREATE POLICY "Users can create their own stores"
ON public.lojas FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own stores"
ON public.lojas FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own stores"
ON public.lojas FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all stores"
ON public.lojas FOR ALL
USING (is_admin(auth.uid()));

-- Remove the old custom login functions since we'll use Supabase Auth
DROP FUNCTION IF EXISTS public.validar_login_lojista_completo;
DROP FUNCTION IF EXISTS public.validar_login_lojista;