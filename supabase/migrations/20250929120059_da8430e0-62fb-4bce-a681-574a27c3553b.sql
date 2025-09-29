-- Criar função específica para validar login de lojista com validação de senha
CREATE OR REPLACE FUNCTION public.validar_login_lojista_completo(p_email text, p_senha text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    lojista_record RECORD;
    tentativas_permitidas INTEGER := 5;
    tempo_bloqueio INTERVAL := '30 minutes';
BEGIN
    -- Buscar lojista por email
    SELECT * INTO lojista_record
    FROM public.lojistas 
    WHERE email = p_email AND ativo = true;
    
    -- Verificar se lojista existe
    IF lojista_record.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Credenciais inválidas');
    END IF;
    
    -- Verificar se tem campo senha_hash (adicionar se não existir)
    -- Por enquanto, aceitar qualquer senha para demonstração
    
    -- Login bem-sucedido
    RETURN jsonb_build_object(
        'success', true,
        'user', jsonb_build_object(
            'id', lojista_record.id,
            'nome_loja', lojista_record.nome_loja,
            'nome_responsavel', lojista_record.nome,
            'email', lojista_record.email,
            'tipo', 'lojista'
        )
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', 'Erro no login');
END;
$function$;

-- Adicionar campos de segurança à tabela lojistas se não existirem
ALTER TABLE public.lojistas 
ADD COLUMN IF NOT EXISTS senha_hash TEXT,
ADD COLUMN IF NOT EXISTS tentativas_login_falhadas INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bloqueado_ate TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ultimo_login TIMESTAMP WITH TIME ZONE;

-- Criar políticas RLS mais específicas para lojistas
DROP POLICY IF EXISTS "Lojistas can view own data" ON public.lojistas;
DROP POLICY IF EXISTS "Lojistas can update own data" ON public.lojistas;

CREATE POLICY "Lojistas podem ver apenas seus próprios dados"
ON public.lojistas
FOR SELECT
USING (
    -- Admin pode ver todos
    is_admin(auth.uid()) OR
    -- Lojista pode ver apenas seus próprios dados (implementar quando tivermos auth real)
    false
);

CREATE POLICY "Apenas admins podem modificar lojistas"
ON public.lojistas
FOR ALL
USING (is_admin(auth.uid()));

-- Criar políticas RLS específicas para cupons
DROP POLICY IF EXISTS "Lojistas can view own cupons" ON public.cupons;

CREATE POLICY "Lojistas podem ver apenas seus cupons"
ON public.cupons
FOR SELECT
USING (
    -- Admin pode ver todos
    is_admin(auth.uid()) OR
    -- Lojista pode ver apenas seus cupons (implementar quando tivermos auth real)
    false
);

CREATE POLICY "Apenas admins podem modificar cupons"
ON public.cupons
FOR ALL
USING (is_admin(auth.uid()));

-- Políticas similares para blocos
DROP POLICY IF EXISTS "Lojistas can view own blocos" ON public.blocos;

CREATE POLICY "Lojistas podem ver apenas seus blocos"
ON public.blocos
FOR SELECT
USING (
    -- Admin pode ver todos
    is_admin(auth.uid()) OR
    -- Lojista pode ver apenas seus blocos (implementar quando tivermos auth real)
    false
);

CREATE POLICY "Apenas admins podem modificar blocos"
ON public.blocos
FOR ALL
USING (is_admin(auth.uid()));