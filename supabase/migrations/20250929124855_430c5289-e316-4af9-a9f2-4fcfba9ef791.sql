-- Criar tabela para usuários lojistas (autenticação)
CREATE TABLE public.usuarios_lojistas (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    telefone TEXT,
    senha_hash TEXT,
    ativo BOOLEAN DEFAULT true,
    tentativas_login_falhadas INTEGER DEFAULT 0,
    bloqueado_ate TIMESTAMP WITH TIME ZONE,
    ultimo_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS na nova tabela
ALTER TABLE public.usuarios_lojistas ENABLE ROW LEVEL SECURITY;

-- Migrar dados únicos de lojistas para usuarios_lojistas
INSERT INTO public.usuarios_lojistas (
    nome, email, telefone, senha_hash, ativo, 
    tentativas_login_falhadas, bloqueado_ate, ultimo_login
)
SELECT DISTINCT 
    nome, email, telefone, senha_hash, ativo,
    tentativas_login_falhadas, bloqueado_ate, ultimo_login
FROM public.lojistas 
WHERE email IS NOT NULL
ON CONFLICT (email) DO NOTHING;

-- Criar nova tabela lojas baseada na estrutura atual de lojistas
CREATE TABLE public.lojas (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_lojista_id UUID NOT NULL,
    nome_loja TEXT NOT NULL,
    cnpj TEXT,
    endereco TEXT,
    cidade TEXT,
    estado TEXT,
    shopping TEXT,
    segmento TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    FOREIGN KEY (usuario_lojista_id) REFERENCES public.usuarios_lojistas(id) ON DELETE CASCADE
);

-- Habilitar RLS na tabela lojas
ALTER TABLE public.lojas ENABLE ROW LEVEL SECURITY;

-- Migrar dados das lojas relacionando com os usuários
INSERT INTO public.lojas (
    usuario_lojista_id, nome_loja, cnpj, endereco, 
    cidade, estado, shopping, segmento, ativo
)
SELECT 
    ul.id as usuario_lojista_id,
    l.nome_loja,
    l.cnpj,
    l.endereco,
    l.cidade,
    l.estado,
    l.shopping,
    l.segmento,
    l.ativo
FROM public.lojistas l
JOIN public.usuarios_lojistas ul ON ul.email = l.email
WHERE l.email IS NOT NULL;

-- Criar políticas RLS para usuarios_lojistas
CREATE POLICY "Admins podem gerenciar usuarios_lojistas" 
ON public.usuarios_lojistas 
FOR ALL 
USING (is_admin(auth.uid()));

CREATE POLICY "Lojistas podem ver apenas seus próprios dados" 
ON public.usuarios_lojistas 
FOR SELECT 
USING (is_admin(auth.uid()) OR false);

-- Criar políticas RLS para lojas
CREATE POLICY "Admins podem gerenciar todas as lojas" 
ON public.lojas 
FOR ALL 
USING (is_admin(auth.uid()));

CREATE POLICY "Lojistas podem ver apenas suas próprias lojas" 
ON public.lojas 
FOR SELECT 
USING (is_admin(auth.uid()) OR false);

-- Atualizar função de validação de login para usar usuarios_lojistas
CREATE OR REPLACE FUNCTION public.validar_login_lojista_completo(p_email text, p_senha text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    usuario_record RECORD;
    tentativas_permitidas INTEGER := 5;
    tempo_bloqueio INTERVAL := '30 minutes';
BEGIN
    -- Buscar usuário lojista por email
    SELECT * INTO usuario_record
    FROM public.usuarios_lojistas 
    WHERE email = p_email AND ativo = true;
    
    -- Verificar se usuário existe
    IF usuario_record.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Credenciais inválidas');
    END IF;
    
    -- Verificar se está bloqueado
    IF usuario_record.bloqueado_ate IS NOT NULL AND usuario_record.bloqueado_ate > now() THEN
        RETURN jsonb_build_object(
            'success', false, 
            'message', 'Conta temporariamente bloqueada. Tente novamente mais tarde.'
        );
    END IF;
    
    -- Login bem-sucedido - atualizar último login
    UPDATE public.usuarios_lojistas 
    SET 
        tentativas_login_falhadas = 0,
        ultimo_login = now(),
        bloqueado_ate = NULL
    WHERE id = usuario_record.id;
    
    RETURN jsonb_build_object(
        'success', true,
        'user', jsonb_build_object(
            'id', usuario_record.id,
            'nome_loja', '', -- Será preenchido pelo frontend com a loja selecionada
            'nome_responsavel', usuario_record.nome,
            'email', usuario_record.email,
            'tipo', 'lojista'
        )
    );
    
EXCEPTION WHEN OTHERS THEN
    -- Incrementar tentativas falhadas
    UPDATE public.usuarios_lojistas 
    SET tentativas_login_falhadas = COALESCE(tentativas_login_falhadas, 0) + 1,
        bloqueado_ate = CASE 
            WHEN COALESCE(tentativas_login_falhadas, 0) + 1 >= tentativas_permitidas 
            THEN now() + tempo_bloqueio 
            ELSE bloqueado_ate 
        END
    WHERE email = p_email;
    
    RETURN jsonb_build_object('success', false, 'message', 'Erro no login');
END;
$$;

-- Criar função para buscar lojas de um usuário lojista
CREATE OR REPLACE FUNCTION public.buscar_lojas_usuario(p_usuario_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', id,
                'nome_loja', nome_loja,
                'cnpj', cnpj,
                'cidade', cidade,
                'shopping', shopping,
                'segmento', segmento,
                'status', CASE WHEN ativo THEN 'ativo' ELSE 'inativo' END,
                'cupons_nao_atribuidos', 0 -- Será calculado dinamicamente
            )
        )
        FROM public.lojas 
        WHERE usuario_lojista_id = p_usuario_id AND ativo = true
    );
END;
$$;

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_usuarios_lojistas_updated_at
    BEFORE UPDATE ON public.usuarios_lojistas
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lojas_updated_at
    BEFORE UPDATE ON public.lojas
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();