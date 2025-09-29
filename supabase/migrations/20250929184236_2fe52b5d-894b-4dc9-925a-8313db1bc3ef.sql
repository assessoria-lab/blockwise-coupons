-- ================================================
-- POPULAR BANCO - COM USUÁRIO DEMO
-- ================================================

-- Desabilitar temporariamente RLS
ALTER TABLE public.lojas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cupons DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas_blocos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos DISABLE ROW LEVEL SECURITY;

-- 1. Criar ou usar usuário demo para todas as lojas
DO $$
DECLARE
  v_demo_user_id uuid;
BEGIN
  -- Tentar buscar um usuário existente ou criar um novo
  SELECT id INTO v_demo_user_id 
  FROM auth.users 
  WHERE email = 'demo.lojas@sistema.com'
  LIMIT 1;
  
  IF v_demo_user_id IS NULL THEN
    v_demo_user_id := gen_random_uuid();
    
    INSERT INTO auth.users (
      id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, aud, role
    ) VALUES (
      v_demo_user_id, 'demo.lojas@sistema.com',
      crypt('demo123', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}',
      '{"email":"demo.lojas@sistema.com"}',
      now(), now(), encode(gen_random_bytes(32), 'hex'),
      'authenticated', 'authenticated'
    );
  END IF;
  
  -- Armazenar em tabela temporária
  CREATE TEMP TABLE temp_demo_user (id uuid);
  INSERT INTO temp_demo_user VALUES (v_demo_user_id);
END $$;

-- 2. Criar 10 lojas de moda
INSERT INTO public.lojas (
  user_id, nome_loja, cnpj, cidade, estado, shopping, segmento, endereco, ativo
)
SELECT 
  (SELECT id FROM temp_demo_user),
  nome_loja,
  LPAD((10000000000000 + row_num)::text, 14, '0'),
  cidade,
  estado,
  shopping,
  'Moda e Vestuário',
  'Rua das Lojas, ' || (row_num * 100)::text,
  true
FROM (
  VALUES 
    (1, 'Elegance Moda', 'São Paulo', 'SP', 'Shopping Iguatemi'),
    (2, 'Bella Boutique', 'Rio de Janeiro', 'RJ', 'Shopping Morumbi'),
    (3, 'Urban Style', 'Belo Horizonte', 'MG', 'Shopping Cidade Jardim'),
    (4, 'Chic Fashion', 'Curitiba', 'PR', 'Shopping JK Iguatemi'),
    (5, 'Trendy Wear', 'Porto Alegre', 'RS', 'Shopping Vila Olímpia'),
    (6, 'Glamour Store', 'São Paulo', 'SP', 'Shopping Iguatemi'),
    (7, 'Vogue Boutique', 'Rio de Janeiro', 'RJ', 'Shopping Morumbi'),
    (8, 'Elite Fashion', 'Belo Horizonte', 'MG', 'Shopping Cidade Jardim'),
    (9, 'Style Mania', 'Curitiba', 'PR', 'Shopping JK Iguatemi'),
    (10, 'Fashion Hub', 'Porto Alegre', 'RS', 'Shopping Vila Olímpia')
) AS dados(row_num, nome_loja, cidade, estado, shopping)
WHERE NOT EXISTS (
  SELECT 1 FROM public.lojas WHERE nome_loja = dados.nome_loja
);

-- 3. Criar 60 blocos com cupons (6000 cupons no total)
DO $$
DECLARE
  v_bloco_id uuid;
  v_numero text;
  v_offset integer;
  i integer;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero_bloco FROM 3) AS INTEGER)), 0) 
  INTO v_offset FROM public.blocos;
  
  FOR i IN 1..60 LOOP
    v_bloco_id := gen_random_uuid();
    v_numero := 'BL' || LPAD((v_offset + i)::text, 6, '0');
    
    INSERT INTO public.blocos (id, numero_bloco, cupons_totais, cupons_disponiveis, status)
    VALUES (v_bloco_id, v_numero, 100, 100, 'disponivel');
    
    INSERT INTO public.cupons (numero_cupom, numero_formatado, bloco_id, status)
    SELECT 
      v_numero || '-' || LPAD(gs::text, 3, '0'),
      'CP' || LPAD(((v_offset + i - 1) * 100 + gs)::text, 8, '0'),
      v_bloco_id,
      'disponivel'
    FROM generate_series(1, 100) gs;
  END LOOP;
END $$;

-- 4. Vender 50 blocos distribuindo entre as lojas
WITH lojas_ids AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM public.lojas WHERE segmento = 'Moda e Vestuário' LIMIT 10
),
blocos_venda AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY numero_bloco) as rn
  FROM public.blocos WHERE lojista_id IS NULL LIMIT 50
)
UPDATE public.blocos b
SET lojista_id = l.id, status = 'vendido'
FROM blocos_venda bv
JOIN lojas_ids l ON l.rn = ((bv.rn - 1) % 10) + 1
WHERE b.id = bv.id;

-- Atualizar cupons
UPDATE public.cupons c
SET lojista_id = b.lojista_id
FROM public.blocos b
WHERE c.bloco_id = b.id AND b.lojista_id IS NOT NULL;

-- Criar vendas (10 vendas, uma por loja)
WITH lojas_ids AS (
  SELECT id FROM public.lojas WHERE segmento = 'Moda e Vestuário' LIMIT 10
)
INSERT INTO public.vendas_blocos (
  id, lojista_id, bloco_id, quantidade_blocos, 
  quantidade_cupons, valor_total, forma_pagamento
)
SELECT 
  gen_random_uuid(),
  l.id,
  (SELECT id FROM public.blocos WHERE lojista_id = l.id LIMIT 1),
  5, 500, 2500.00, 'pix'
FROM lojas_ids l
WHERE NOT EXISTS (
  SELECT 1 FROM public.vendas_blocos WHERE lojista_id = l.id
);

-- Criar pagamentos
INSERT INTO public.pagamentos (
  venda_id, valor, quantidade_blocos, forma_pagamento,
  status, status_pagamento, data_pagamento
)
SELECT 
  id, 2500.00, 5, 'pix', 'confirmado', 'pago', now()
FROM public.vendas_blocos vb
WHERE NOT EXISTS (
  SELECT 1 FROM public.pagamentos WHERE venda_id = vb.id
);

-- 5. Criar 150 clientes
INSERT INTO public.clientes (
  nome, email, cpf, telefone, cidade, estado, status
)
SELECT 
  'Cliente Fashion ' || gs::text,
  'cliente.fashion' || gs::text || '@email.com',
  LPAD((10000000000 + gs)::text, 11, '0'),
  '(11) 9' || LPAD(gs::text, 8, '0'),
  CASE gs % 5
    WHEN 0 THEN 'São Paulo' WHEN 1 THEN 'Rio de Janeiro'
    WHEN 2 THEN 'Belo Horizonte' WHEN 3 THEN 'Curitiba'
    ELSE 'Porto Alegre'
  END,
  CASE gs % 5
    WHEN 0 THEN 'SP' WHEN 1 THEN 'RJ' WHEN 2 THEN 'MG' WHEN 3 THEN 'PR'
    ELSE 'RS'
  END,
  'ativo'
FROM generate_series(1, 150) gs
WHERE NOT EXISTS (
  SELECT 1 FROM public.clientes 
  WHERE email = 'cliente.fashion' || gs::text || '@email.com'
);

-- 6. Atribuir cupons aos 100 primeiros clientes
WITH clientes_sel AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) as rn
  FROM public.clientes WHERE total_cupons_recebidos IS NULL OR total_cupons_recebidos = 0
  LIMIT 100
),
cupons_disp AS (
  SELECT id as cupom_id, lojista_id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM public.cupons 
  WHERE status = 'disponivel' AND lojista_id IS NOT NULL AND cliente_id IS NULL
  LIMIT 300
)
UPDATE public.cupons
SET 
  cliente_id = cs.id,
  status = 'atribuido',
  data_atribuicao = now() - (random() * 30)::integer * interval '1 day',
  valor_compra = 50 + (random() * 450)::numeric(10,2)
FROM clientes_sel cs, cupons_disp cd
WHERE cupons.id = cd.cupom_id AND cd.rn BETWEEN ((cs.rn - 1) * 3 + 1) AND (cs.rn * 3);

-- Atualizar estatísticas
UPDATE public.blocos b
SET 
  cupons_disponiveis = (SELECT COUNT(*) FROM public.cupons WHERE bloco_id = b.id AND status = 'disponivel'),
  cupons_atribuidos = (SELECT COUNT(*) FROM public.cupons WHERE bloco_id = b.id AND status = 'atribuido'),
  cupons_usados = (SELECT COUNT(*) FROM public.cupons WHERE bloco_id = b.id AND status = 'usado');

UPDATE public.clientes c
SET 
  total_cupons_recebidos = (SELECT COUNT(*) FROM public.cupons WHERE cliente_id = c.id),
  total_valor_compras = (SELECT COALESCE(SUM(valor_compra), 0) FROM public.cupons WHERE cliente_id = c.id),
  data_primeiro_cupom = (SELECT MIN(data_atribuicao) FROM public.cupons WHERE cliente_id = c.id),
  lojista_id = (SELECT lojista_id FROM public.cupons WHERE cliente_id = c.id LIMIT 1)
WHERE EXISTS (SELECT 1 FROM public.cupons WHERE cliente_id = c.id);

-- Reabilitar RLS
ALTER TABLE public.lojas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas_blocos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;

-- Limpar tabela temporária
DROP TABLE IF EXISTS temp_demo_user;