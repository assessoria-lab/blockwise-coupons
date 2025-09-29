-- Primeiro, fazer user_id nullable temporariamente
ALTER TABLE public.usuarios_admin ALTER COLUMN user_id DROP NOT NULL;

-- Adicionar constraint única no email se não existir
DO $$ 
BEGIN
    ALTER TABLE public.usuarios_admin ADD CONSTRAINT usuarios_admin_email_unique UNIQUE (email);
EXCEPTION WHEN duplicate_object THEN
    NULL; -- Ignora se já existir
END $$;

-- Adicionar campos faltantes na tabela usuarios_admin
ALTER TABLE public.usuarios_admin 
ADD COLUMN IF NOT EXISTS senha_hash TEXT,
ADD COLUMN IF NOT EXISTS permissoes JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ativo',
ADD COLUMN IF NOT EXISTS ultimo_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS tentativas_login_falhadas INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bloqueado_ate TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS criado_por UUID,
ADD COLUMN IF NOT EXISTS observacoes TEXT,
ADD COLUMN IF NOT EXISTS perfil TEXT DEFAULT 'admin';

-- Atualizar dados existentes para ter valores padrão
UPDATE public.usuarios_admin 
SET 
    status = COALESCE(status, 'ativo'),
    perfil = COALESCE(perfil, 'admin'),
    permissoes = COALESCE(permissoes, '[]'::jsonb),
    tentativas_login_falhadas = COALESCE(tentativas_login_falhadas, 0)
WHERE status IS NULL OR perfil IS NULL OR permissoes IS NULL OR tentativas_login_falhadas IS NULL;

-- Inserir admin padrão
INSERT INTO public.usuarios_admin (
    nome, 
    email, 
    perfil, 
    permissoes, 
    status,
    ativo
) VALUES (
    'Super Administrador',
    'superadmin@sistema.com',
    'super_admin',
    '["ADMIN_FULL"]'::jsonb,
    'ativo',
    true
) ON CONFLICT (email) DO UPDATE SET
    perfil = EXCLUDED.perfil,
    permissoes = EXCLUDED.permissoes,
    status = EXCLUDED.status;

-- Inserir admin padrão adicional
INSERT INTO public.usuarios_admin (
    nome, 
    email, 
    perfil, 
    permissoes, 
    status,
    ativo
) VALUES (
    'Administrador Sistema',
    'admin@sistema.com',
    'admin',
    '["ADMIN_FULL"]'::jsonb,
    'ativo',
    true
) ON CONFLICT (email) DO UPDATE SET
    perfil = EXCLUDED.perfil,
    permissoes = EXCLUDED.permissoes,
    status = EXCLUDED.status;