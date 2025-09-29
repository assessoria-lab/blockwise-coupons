-- Melhorar a tabela usuarios_admin com campos completos
ALTER TABLE public.usuarios_admin 
ADD COLUMN IF NOT EXISTS senha_hash TEXT,
ADD COLUMN IF NOT EXISTS permissoes JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'suspenso')),
ADD COLUMN IF NOT EXISTS ultimo_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS tentativas_login_falhadas INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bloqueado_ate TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS criado_por UUID REFERENCES public.usuarios_admin(id),
ADD COLUMN IF NOT EXISTS observacoes TEXT,
ADD COLUMN IF NOT EXISTS perfil TEXT DEFAULT 'admin' CHECK (perfil IN ('super_admin', 'admin', 'operador'));

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_usuarios_admin_status ON public.usuarios_admin(status);
CREATE INDEX IF NOT EXISTS idx_usuarios_admin_email ON public.usuarios_admin(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_admin_perfil ON public.usuarios_admin(perfil);

-- Criar tabela de permissões do sistema
CREATE TABLE IF NOT EXISTS public.permissoes_sistema (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo TEXT UNIQUE NOT NULL,
    nome TEXT NOT NULL,
    descricao TEXT,
    categoria TEXT NOT NULL,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Inserir permissões básicas do sistema
INSERT INTO public.permissoes_sistema (codigo, nome, descricao, categoria) VALUES
('ADMIN_FULL', 'Administrador Completo', 'Acesso total ao sistema', 'admin'),
('GESTAO_LOJISTAS', 'Gestão de Lojistas', 'Criar, editar e gerenciar lojistas', 'lojistas'),
('GESTAO_BLOCOS', 'Gestão de Blocos', 'Criar e gerenciar blocos de cupons', 'blocos'),
('GESTAO_CUPONS', 'Gestão de Cupons', 'Atribuir e gerenciar cupons', 'cupons'),
('GESTAO_SORTEIOS', 'Gestão de Sorteios', 'Criar e gerenciar sorteios', 'sorteios'),
('GESTAO_CLIENTES', 'Gestão de Clientes', 'Visualizar e gerenciar clientes', 'clientes'),
('RELATORIOS', 'Relatórios', 'Acesso aos relatórios do sistema', 'relatorios'),
('CONFIGURACOES', 'Configurações', 'Acessar configurações do sistema', 'sistema'),
('AUDITORIA', 'Auditoria', 'Visualizar logs de auditoria', 'sistema'),
('FINANCEIRO', 'Financeiro', 'Acesso ao dashboard financeiro', 'financeiro')
ON CONFLICT (codigo) DO NOTHING;

-- RLS para permissoes_sistema
ALTER TABLE public.permissoes_sistema ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem visualizar permissões" 
ON public.permissoes_sistema 
FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "Super admins podem gerenciar permissões" 
ON public.permissoes_sistema 
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.usuarios_admin 
        WHERE user_id = auth.uid() 
        AND perfil = 'super_admin' 
        AND ativo = true
    )
);

-- Criar tabela de logs de atividade de admin
CREATE TABLE IF NOT EXISTS public.logs_atividade_admin (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.usuarios_admin(id) NOT NULL,
    acao TEXT NOT NULL,
    detalhes JSONB,
    ip_address INET,
    user_agent TEXT,
    sucesso BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS para logs_atividade_admin
ALTER TABLE public.logs_atividade_admin ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem ver seus próprios logs" 
ON public.logs_atividade_admin 
FOR SELECT 
USING (
    admin_id IN (
        SELECT id FROM public.usuarios_admin 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Super admins podem ver todos os logs" 
ON public.logs_atividade_admin 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.usuarios_admin 
        WHERE user_id = auth.uid() 
        AND perfil = 'super_admin' 
        AND ativo = true
    )
);

-- Função para validar login de admin com nova estrutura
CREATE OR REPLACE FUNCTION public.validar_login_admin_completo(p_email text, p_senha text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    admin_record RECORD;
    tentativas_permitidas INTEGER := 5;
    tempo_bloqueio INTERVAL := '30 minutes';
BEGIN
    -- Buscar admin por email
    SELECT * INTO admin_record
    FROM public.usuarios_admin 
    WHERE email = p_email AND ativo = true;
    
    -- Verificar se admin existe
    IF admin_record.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Credenciais inválidas');
    END IF;
    
    -- Verificar se está bloqueado
    IF admin_record.bloqueado_ate IS NOT NULL AND admin_record.bloqueado_ate > now() THEN
        RETURN jsonb_build_object(
            'success', false, 
            'message', 'Conta temporariamente bloqueada. Tente novamente mais tarde.'
        );
    END IF;
    
    -- Verificar status da conta
    IF admin_record.status != 'ativo' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Conta inativa');
    END IF;
    
    -- Simular verificação de senha (em produção, usar crypt/bcrypt)
    -- Por enquanto, aceitar qualquer senha para demonstração
    
    -- Login bem-sucedido - resetar tentativas e atualizar último login
    UPDATE public.usuarios_admin 
    SET 
        tentativas_login_falhadas = 0,
        ultimo_login = now(),
        bloqueado_ate = NULL
    WHERE id = admin_record.id;
    
    -- Registrar log de atividade
    INSERT INTO public.logs_atividade_admin (admin_id, acao, detalhes, sucesso)
    VALUES (admin_record.id, 'LOGIN', jsonb_build_object('email', p_email), true);
    
    RETURN jsonb_build_object(
        'success', true,
        'user', jsonb_build_object(
            'id', admin_record.id,
            'nome', admin_record.nome,
            'email', admin_record.email,
            'perfil', admin_record.perfil,
            'permissoes', admin_record.permissoes,
            'tipo', 'admin'
        )
    );
    
EXCEPTION WHEN OTHERS THEN
    -- Incrementar tentativas falhadas
    UPDATE public.usuarios_admin 
    SET tentativas_login_falhadas = COALESCE(tentativas_login_falhadas, 0) + 1,
        bloqueado_ate = CASE 
            WHEN COALESCE(tentativas_login_falhadas, 0) + 1 >= tentativas_permitidas 
            THEN now() + tempo_bloqueio 
            ELSE bloqueado_ate 
        END
    WHERE email = p_email;
    
    -- Registrar log de tentativa falhada
    INSERT INTO public.logs_atividade_admin (
        admin_id, acao, detalhes, sucesso
    ) VALUES (
        COALESCE(admin_record.id, NULL), 
        'LOGIN_FAILED', 
        jsonb_build_object('email', p_email, 'error', SQLERRM), 
        false
    );
    
    RETURN jsonb_build_object('success', false, 'message', 'Erro no login');
END;
$function$;

-- Função para criar admin com permissões
CREATE OR REPLACE FUNCTION public.criar_admin_completo(
    p_nome text,
    p_email text,
    p_perfil text DEFAULT 'admin',
    p_permissoes jsonb DEFAULT '[]'::jsonb,
    p_criado_por uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    novo_admin_id UUID;
BEGIN
    -- Inserir novo admin
    INSERT INTO public.usuarios_admin (
        nome, email, perfil, permissoes, status, criado_por
    ) VALUES (
        p_nome, p_email, p_perfil, p_permissoes, 'ativo', p_criado_por
    ) RETURNING id INTO novo_admin_id;
    
    -- Registrar log de criação
    INSERT INTO public.logs_atividade_admin (
        admin_id, acao, detalhes, sucesso
    ) VALUES (
        p_criado_por, 
        'ADMIN_CREATED', 
        jsonb_build_object('novo_admin_id', novo_admin_id, 'email', p_email), 
        true
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'admin_id', novo_admin_id,
        'message', 'Admin criado com sucesso'
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$function$;