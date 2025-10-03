-- Função para criar perfil automaticamente quando usuário é criado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Cria perfil com tipo_usuario vindo dos metadados ou 'lojista' como padrão
  INSERT INTO public.profiles (user_id, nome, email, tipo_usuario, ativo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'tipo_usuario', 'lojista'),
    true
  );
  RETURN NEW;
END;
$$;

-- Trigger que executa a função quando um novo usuário é criado
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Atualizar política RLS de clientes para permitir admins
DROP POLICY IF EXISTS "Admins podem ver todos os clientes" ON public.clientes;
CREATE POLICY "Admins podem ver todos os clientes"
  ON public.clientes
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Garantir que a política existe
DROP POLICY IF EXISTS "Lojistas podem ver seus próprios clientes" ON public.clientes;
CREATE POLICY "Lojistas podem ver seus próprios clientes"
  ON public.clientes
  FOR SELECT
  USING (can_lojista_view_cliente(auth.uid(), id));