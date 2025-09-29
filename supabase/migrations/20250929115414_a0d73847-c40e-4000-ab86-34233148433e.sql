-- Criar a função que ficou faltando na migração anterior
CREATE OR REPLACE FUNCTION public.validar_login_admin_completo(p_email text, p_senha text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    
    RETURN jsonb_build_object('success', false, 'message', 'Erro no login');
END;
$function$;

-- Criar tabela de permissões básicas se não existir
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