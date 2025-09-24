-- Inserir lojistas fictícios
INSERT INTO public.lojistas (nome_loja, cnpj, cidade, shopping, nome_responsavel, telefone, whatsapp, email, status) VALUES
('Fashion Center', '12.345.678/0001-90', 'Goiânia', 'Shopping Flamboyant', 'Maria Silva', '(62) 99999-1234', '62999991234', 'maria@fashioncenter.com', 'ativo'),
('Tech Store Plus', '98.765.432/0001-10', 'Goiânia', 'Galeria Imperial Center', 'João Santos', '(62) 99999-5678', '62999995678', 'joao@techstore.com', 'ativo'),
('Beleza & Estilo', '11.222.333/0001-44', 'Goiânia', 'Shopping Cerrado', 'Ana Costa', '(62) 99999-9012', '62999999012', 'ana@belezaestilo.com', 'ativo'),
('Sports World', '55.666.777/0001-88', 'Goiânia', 'Shopping Flamboyant', 'Carlos Pereira', '(62) 99999-3456', '62999993456', 'carlos@sportsworld.com', 'ativo');

-- Inserir clientes fictícios
INSERT INTO public.clientes (nome, cpf, telefone, cidade, email, status) VALUES
('Ana Paula Santos Silva', '123.456.789-10', '(62) 98765-4321', 'Goiânia', 'ana.paula@email.com', 'ativo'),
('João Carlos Oliveira', '987.654.321-00', '(62) 98765-1234', 'Goiânia', 'joao.carlos@email.com', 'ativo'),
('Maria Fernanda Costa', '456.789.123-45', '(62) 98765-5678', 'Goiânia', 'maria.fernanda@email.com', 'ativo'),
('Pedro Henrique Lima', '321.654.987-12', '(62) 98765-9012', 'Goiânia', 'pedro.henrique@email.com', 'ativo'),
('Carla Regina Alves', '789.123.456-78', '(62) 98765-3456', 'Goiânia', 'carla.regina@email.com', 'ativo'),
('Roberto Silva Nunes', '654.321.789-90', '(62) 98765-7890', 'Goiânia', 'roberto.silva@email.com', 'ativo'),
('Juliana Pereira Santos', '147.258.369-11', '(62) 98765-2468', 'Goiânia', 'juliana.pereira@email.com', 'ativo'),
('Fernando Costa Lima', '369.258.147-22', '(62) 98765-1357', 'Goiânia', 'fernando.costa@email.com', 'ativo');

-- Criar blocos e associar aos lojistas
INSERT INTO public.blocos (numero_bloco, lojista_id, status, cupons_no_bloco, cupons_disponiveis, cupons_atribuidos, data_venda) 
SELECT 
    'BL20250124_' || LPAD(ROW_NUMBER() OVER()::TEXT, 6, '0'),
    l.id,
    'vendido',
    100,
    CASE 
        WHEN ROW_NUMBER() OVER() = 1 THEN 75  -- Fashion Center
        WHEN ROW_NUMBER() OVER() = 2 THEN 85  -- Tech Store Plus  
        WHEN ROW_NUMBER() OVER() = 3 THEN 90  -- Beleza & Estilo
        ELSE 95  -- Sports World
    END,
    CASE 
        WHEN ROW_NUMBER() OVER() = 1 THEN 25
        WHEN ROW_NUMBER() OVER() = 2 THEN 15
        WHEN ROW_NUMBER() OVER() = 3 THEN 10
        ELSE 5
    END,
    NOW() - INTERVAL '15 days'
FROM public.lojistas l
WHERE l.status = 'ativo';

-- Inserir cupons atribuídos para cada bloco
INSERT INTO public.cupons (numero_cupom, numero_formatado, bloco_id, lojista_id, cliente_id, status, valor_compra, data_atribuicao)
SELECT 
    nextval('seq_cupom_global'),
    'CP' || LPAD(nextval('seq_cupom_global')::TEXT, 12, '0'),
    b.id,
    b.lojista_id,
    c.id,
    'atribuido',
    CASE 
        WHEN random() < 0.3 THEN 150.00  -- 30% dos cupons com R$ 150
        WHEN random() < 0.6 THEN 200.00  -- 30% dos cupons com R$ 200  
        WHEN random() < 0.8 THEN 120.00  -- 20% dos cupons com R$ 120
        ELSE 180.00  -- 20% dos cupons com R$ 180
    END,
    NOW() - INTERVAL '10 days' + (random() * INTERVAL '10 days')
FROM public.blocos b
CROSS JOIN public.clientes c
WHERE b.status = 'vendido'
AND c.status = 'ativo'
ORDER BY b.id, random()
LIMIT 55; -- Total de cupons atribuídos conforme os blocos

-- Atualizar alguns cupons com datas mais recentes
UPDATE public.cupons 
SET data_atribuicao = NOW() - INTERVAL '3 days' + (random() * INTERVAL '3 days')
WHERE id IN (
    SELECT id FROM public.cupons 
    WHERE status = 'atribuido' 
    ORDER BY random() 
    LIMIT 20
);