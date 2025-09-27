-- Função para criar perfil de usuário existente (admin only)
CREATE OR REPLACE FUNCTION public.create_missing_profile(
    p_user_id UUID,
    p_nome TEXT,
    p_email TEXT,
    p_tipo_usuario TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Inserir perfil se não existir
    INSERT INTO public.profiles (user_id, nome, email, tipo_usuario)
    VALUES (p_user_id, p_nome, p_email, p_tipo_usuario)
    ON CONFLICT (user_id) DO UPDATE SET
        nome = EXCLUDED.nome,
        email = EXCLUDED.email,
        updated_at = NOW();
END;
$$;

-- Executar para o usuário existente
SELECT public.create_missing_profile(
    '2fef152e-d2c8-4e76-b31e-d36d7c9bff12',
    'Lojista Teste', 
    'gilmedeiros75@hotmail.com',
    'lojista'
);

-- Função para confirmar email de usuário (emergência)
CREATE OR REPLACE FUNCTION public.confirm_user_email(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth
AS $$
BEGIN
    -- Confirmar email do usuário
    UPDATE auth.users 
    SET email_confirmed_at = NOW() 
    WHERE id = p_user_id;
END;
$$;

-- Confirmar email do usuário para teste
SELECT public.confirm_user_email('2fef152e-d2c8-4e76-b31e-d36d7c9bff12');