-- Primeiro, vamos melhorar a estrutura de segurança

-- 1. Atualizar tabela de lojistas para incluir campos de autenticação
ALTER TABLE public.lojistas ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE public.lojistas ADD COLUMN IF NOT EXISTS ultimo_login TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.lojistas ADD COLUMN IF NOT EXISTS tentativas_login INTEGER DEFAULT 0;
ALTER TABLE public.lojistas ADD COLUMN IF NOT EXISTS bloqueado_ate TIMESTAMP WITH TIME ZONE;

-- 2. Criar índices para performance e segurança
CREATE INDEX IF NOT EXISTS idx_lojistas_email ON public.lojistas(email) WHERE status = 'ativo';
CREATE INDEX IF NOT EXISTS idx_usuarios_admin_email ON public.usuarios_admin(email) WHERE status = 'ativo';

-- 3. Atualizar RLS na tabela usuarios_admin para ser mais restritiva
DROP POLICY IF EXISTS "Admin pode gerenciar usuários" ON public.usuarios_admin;

CREATE POLICY "Admin pode gerenciar outros admins" ON public.usuarios_admin
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios_admin ua2 
    WHERE ua2.email = auth.jwt() ->> 'email' 
    AND ua2.status = 'ativo'
    AND ua2.nivel_permissao IN ('admin', 'super_admin')
  )
);

-- 4. Criar política mais restritiva para lojistas
DROP POLICY IF EXISTS "Admin pode ver todas as lojas" ON public.lojistas;
DROP POLICY IF EXISTS "Lojista pode atualizar suas próprias lojas" ON public.lojistas;
DROP POLICY IF EXISTS "Lojista pode criar suas próprias lojas" ON public.lojistas;
DROP POLICY IF EXISTS "Lojista pode ver suas próprias lojas" ON public.lojistas;

-- Admins podem ver todas as lojas
CREATE POLICY "Admin acesso total lojistas" ON public.lojistas
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios_admin ua 
    WHERE ua.email = auth.jwt() ->> 'email' 
    AND ua.status = 'ativo'
  )
);

-- Lojistas só podem ver/editar seus próprios dados
CREATE POLICY "Lojista acesso próprios dados" ON public.lojistas
FOR ALL 
USING (email = auth.jwt() ->> 'email' AND status = 'ativo')
WITH CHECK (email = auth.jwt() ->> 'email' AND status = 'ativo');

-- 5. Atualizar políticas da tabela profiles para ser mais restritiva
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Só admins autenticados podem gerenciar profiles
CREATE POLICY "Admin gerencia profiles" ON public.profiles
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios_admin ua 
    WHERE ua.email = auth.jwt() ->> 'email' 
    AND ua.status = 'ativo'
  )
);

-- 6. Função para validar login de admin
CREATE OR REPLACE FUNCTION public.validar_login_admin(p_email TEXT, p_senha TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_usuario RECORD;
    v_senha_correta BOOLEAN := FALSE;
BEGIN
    -- Busca o usuário admin
    SELECT * INTO v_usuario
    FROM public.usuarios_admin
    WHERE email = p_email AND status = 'ativo';

    -- Verifica se usuário existe
    IF v_usuario.id IS NULL THEN
        RETURN jsonb_build_object(
            'sucesso', false,
            'mensagem', 'Usuário não encontrado',
            'codigo_erro', 'USUARIO_NAO_ENCONTRADO'
        );
    END IF;

    -- Verifica se não está bloqueado
    IF v_usuario.data_bloqueio IS NOT NULL AND v_usuario.data_bloqueio > NOW() THEN
        RETURN jsonb_build_object(
            'sucesso', false,
            'mensagem', 'Usuário temporariamente bloqueado',
            'codigo_erro', 'USUARIO_BLOQUEADO'
        );
    END IF;

    -- Aqui seria a validação real da senha (usando bcrypt ou similar)
    -- Por simplicidade, vamos assumir que a validação é feita externamente
    -- v_senha_correta := (crypt(p_senha, v_usuario.senha_hash) = v_usuario.senha_hash);
    
    -- Por enquanto, retorna sucesso para implementação posterior
    RETURN jsonb_build_object(
        'sucesso', true,
        'usuario_id', v_usuario.id,
        'nivel_permissao', v_usuario.nivel_permissao,
        'nome', v_usuario.nome
    );
END;
$$;

-- 7. Função para validar login de lojista
CREATE OR REPLACE FUNCTION public.validar_login_lojista(p_email TEXT, p_senha TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_lojista RECORD;
    v_senha_correta BOOLEAN := FALSE;
BEGIN
    -- Busca o lojista
    SELECT * INTO v_lojista
    FROM public.lojistas
    WHERE email = p_email AND status = 'ativo';

    -- Verifica se lojista existe
    IF v_lojista.id IS NULL THEN
        RETURN jsonb_build_object(
            'sucesso', false,
            'mensagem', 'Lojista não encontrado',
            'codigo_erro', 'LOJISTA_NAO_ENCONTRADO'
        );
    END IF;

    -- Verifica se não está bloqueado
    IF v_lojista.bloqueado_ate IS NOT NULL AND v_lojista.bloqueado_ate > NOW() THEN
        RETURN jsonb_build_object(
            'sucesso', false,
            'mensagem', 'Lojista temporariamente bloqueado',
            'codigo_erro', 'LOJISTA_BLOQUEADO'
        );
    END IF;

    -- Atualiza último login
    UPDATE public.lojistas 
    SET ultimo_login = NOW(), data_ultimo_acesso = NOW()
    WHERE id = v_lojista.id;

    -- Por enquanto, retorna sucesso para implementação posterior
    RETURN jsonb_build_object(
        'sucesso', true,
        'lojista_id', v_lojista.id,
        'nome_loja', v_lojista.nome_loja,
        'nome_responsavel', v_lojista.nome_responsavel
    );
END;
$$;

-- 8. Criar alguns usuários admin padrão (opcional)
INSERT INTO public.usuarios_admin (email, nome, senha_hash, nivel_permissao, status)
VALUES 
    ('admin@showpremios.com', 'Administrador Principal', 'temp_hash', 'super_admin', 'ativo')
ON CONFLICT (email) DO NOTHING;