-- Primeiro, vamos verificar se há constraint única em email
ALTER TABLE public.lojistas ADD CONSTRAINT lojistas_email_unique UNIQUE (email);

-- Criar lojistas de demonstração com senhas
INSERT INTO public.lojistas (
    nome_loja, 
    nome, 
    email, 
    segmento,
    shopping,
    cidade,
    estado,
    ativo,
    senha_hash
) VALUES 
(
    'Loja Exemplo 1',
    'João Silva',
    'loja1@exemplo.com',
    'Moda',
    'Shopping Centro',
    'São Paulo',
    'SP',
    true,
    'demo_hash'
),
(
    'Loja Exemplo 2', 
    'Maria Santos',
    'loja2@exemplo.com',
    'Eletrônicos',
    'Shopping Norte',
    'Rio de Janeiro',
    'RJ',
    true,
    'demo_hash'
),
(
    'Boutique Fashion',
    'Ana Costa',
    'boutique@fashion.com',
    'Moda',
    'Shopping Sul',
    'Belo Horizonte',
    'MG',
    true,
    'demo_hash'
)
ON CONFLICT (email) DO UPDATE SET
    nome_loja = EXCLUDED.nome_loja,
    nome = EXCLUDED.nome,
    segmento = EXCLUDED.segmento,
    shopping = EXCLUDED.shopping,
    cidade = EXCLUDED.cidade,
    estado = EXCLUDED.estado,
    ativo = EXCLUDED.ativo,
    senha_hash = EXCLUDED.senha_hash;