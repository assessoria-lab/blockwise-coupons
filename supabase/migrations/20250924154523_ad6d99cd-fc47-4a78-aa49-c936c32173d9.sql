-- Criação das tabelas para o sistema de gestão de lojistas e blocos

-- Tabela de lojistas
CREATE TABLE public.lojistas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_loja TEXT NOT NULL,
  cnpj TEXT UNIQUE NOT NULL,
  cidade TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  responsavel_nome TEXT,
  responsavel_telefone TEXT,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'suspenso')),
  cupons_nao_atribuidos INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de blocos
CREATE TABLE public.blocos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_bloco INTEGER NOT NULL UNIQUE,
  lojista_id UUID REFERENCES public.lojistas(id) ON DELETE SET NULL,
  cupons_totais INTEGER NOT NULL DEFAULT 100,
  cupons_atribuidos INTEGER NOT NULL DEFAULT 0,
  cupons_disponiveis INTEGER NOT NULL DEFAULT 100,
  status TEXT NOT NULL DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'vendido', 'esgotado')),
  data_venda TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de clientes
CREATE TABLE public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cpf TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de cupons
CREATE TABLE public.cupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_cupom TEXT NOT NULL UNIQUE,
  bloco_id UUID NOT NULL REFERENCES public.blocos(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  lojista_id UUID NOT NULL REFERENCES public.lojistas(id) ON DELETE CASCADE,
  valor_compra DECIMAL(10,2),
  data_atribuicao TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'atribuido', 'usado')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de vendas de blocos
CREATE TABLE public.vendas_blocos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lojista_id UUID NOT NULL REFERENCES public.lojistas(id) ON DELETE CASCADE,
  quantidade_blocos INTEGER NOT NULL,
  valor_total DECIMAL(10,2) NOT NULL,
  valor_por_bloco DECIMAL(10,2) NOT NULL,
  forma_pagamento TEXT NOT NULL CHECK (forma_pagamento IN ('pix', 'cartao', 'boleto', 'transferencia')),
  data_venda TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.lojistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas_blocos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (permitindo acesso total por enquanto para o painel admin)
CREATE POLICY "Admin pode ver todos os lojistas" ON public.lojistas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin pode ver todos os blocos" ON public.blocos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin pode ver todos os clientes" ON public.clientes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin pode ver todos os cupons" ON public.cupons FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin pode ver todas as vendas" ON public.vendas_blocos FOR ALL USING (true) WITH CHECK (true);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers para updated_at
CREATE TRIGGER update_lojistas_updated_at BEFORE UPDATE ON public.lojistas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_blocos_updated_at BEFORE UPDATE ON public.blocos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função RPC para vender blocos para lojista
CREATE OR REPLACE FUNCTION public.vender_blocos_para_lojista(
  p_lojista_id UUID,
  p_quantidade_blocos INTEGER,
  p_valor_total DECIMAL,
  p_forma_pagamento TEXT
)
RETURNS JSON AS $$
DECLARE
  v_valor_por_bloco DECIMAL;
  v_blocos_disponiveis INTEGER;
  v_bloco_record RECORD;
  v_cupom_numero TEXT;
  i INTEGER;
  j INTEGER;
BEGIN
  -- Verificar se o lojista existe
  IF NOT EXISTS (SELECT 1 FROM public.lojistas WHERE id = p_lojista_id) THEN
    RETURN json_build_object('sucesso', false, 'mensagem', 'Lojista não encontrado');
  END IF;

  -- Calcular valor por bloco
  v_valor_por_bloco := p_valor_total / p_quantidade_blocos;

  -- Verificar quantos blocos estão disponíveis no pool
  SELECT COUNT(*) INTO v_blocos_disponiveis 
  FROM public.blocos 
  WHERE lojista_id IS NULL AND status = 'disponivel';

  IF v_blocos_disponiveis < p_quantidade_blocos THEN
    RETURN json_build_object('sucesso', false, 'mensagem', 'Não há blocos suficientes disponíveis no pool');
  END IF;

  -- Registrar a venda
  INSERT INTO public.vendas_blocos (lojista_id, quantidade_blocos, valor_total, valor_por_bloco, forma_pagamento)
  VALUES (p_lojista_id, p_quantidade_blocos, p_valor_total, v_valor_por_bloco, p_forma_pagamento);

  -- Transferir blocos do pool para o lojista
  FOR v_bloco_record IN (
    SELECT id, numero_bloco 
    FROM public.blocos 
    WHERE lojista_id IS NULL AND status = 'disponivel'
    ORDER BY numero_bloco
    LIMIT p_quantidade_blocos
  ) LOOP
    -- Atualizar o bloco
    UPDATE public.blocos 
    SET lojista_id = p_lojista_id, 
        status = 'vendido',
        data_venda = now()
    WHERE id = v_bloco_record.id;

    -- Criar 100 cupons para cada bloco
    FOR j IN 1..100 LOOP
      v_cupom_numero := v_bloco_record.numero_bloco || '-' || LPAD(j::TEXT, 3, '0');
      
      INSERT INTO public.cupons (numero_cupom, bloco_id, lojista_id, status)
      VALUES (v_cupom_numero, v_bloco_record.id, p_lojista_id, 'disponivel');
    END LOOP;
  END LOOP;

  -- Atualizar contador de cupons não atribuídos do lojista
  UPDATE public.lojistas 
  SET cupons_nao_atribuidos = cupons_nao_atribuidos + (p_quantidade_blocos * 100)
  WHERE id = p_lojista_id;

  RETURN json_build_object('sucesso', true, 'mensagem', 'Blocos vendidos com sucesso');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Função RPC para atribuir cupons para cliente
CREATE OR REPLACE FUNCTION public.atribuir_cupons_para_cliente(
  p_lojista_id UUID,
  p_cliente_cpf TEXT,
  p_cliente_nome TEXT,
  p_cliente_telefone TEXT,
  p_valor_compra DECIMAL
)
RETURNS JSON AS $$
DECLARE
  v_cliente_id UUID;
  v_cupons_necessarios INTEGER;
  v_cupons_disponiveis INTEGER;
  v_cupom_record RECORD;
  v_cupons_atribuidos INTEGER := 0;
BEGIN
  -- Calcular quantos cupons são necessários (1 cupom para cada R$ 10)
  v_cupons_necessarios := FLOOR(p_valor_compra / 10);
  
  IF v_cupons_necessarios = 0 THEN
    RETURN json_build_object('sucesso', false, 'mensagem', 'Valor da compra deve ser de pelo menos R$ 10,00');
  END IF;

  -- Verificar se há cupons suficientes disponíveis para o lojista
  SELECT COUNT(*) INTO v_cupons_disponiveis
  FROM public.cupons
  WHERE lojista_id = p_lojista_id AND status = 'disponivel';

  IF v_cupons_disponiveis < v_cupons_necessarios THEN
    RETURN json_build_object('sucesso', false, 'mensagem', 'Lojista não possui cupons suficientes disponíveis');
  END IF;

  -- Criar ou encontrar cliente
  INSERT INTO public.clientes (cpf, nome, telefone)
  VALUES (p_cliente_cpf, p_cliente_nome, p_cliente_telefone)
  ON CONFLICT (cpf) DO UPDATE SET 
    nome = EXCLUDED.nome,
    telefone = EXCLUDED.telefone,
    updated_at = now()
  RETURNING id INTO v_cliente_id;

  -- Atribuir cupons ao cliente
  FOR v_cupom_record IN (
    SELECT id
    FROM public.cupons
    WHERE lojista_id = p_lojista_id AND status = 'disponivel'
    ORDER BY created_at
    LIMIT v_cupons_necessarios
  ) LOOP
    UPDATE public.cupons
    SET cliente_id = v_cliente_id,
        valor_compra = p_valor_compra / v_cupons_necessarios,
        data_atribuicao = now(),
        status = 'atribuido'
    WHERE id = v_cupom_record.id;
    
    v_cupons_atribuidos := v_cupons_atribuidos + 1;
  END LOOP;

  -- Atualizar contadores do lojista
  UPDATE public.lojistas
  SET cupons_nao_atribuidos = cupons_nao_atribuidos - v_cupons_atribuidos
  WHERE id = p_lojista_id;

  -- Atualizar contadores dos blocos
  UPDATE public.blocos
  SET cupons_atribuidos = cupons_atribuidos + 1,
      cupons_disponiveis = cupons_disponiveis - 1
  WHERE id IN (
    SELECT DISTINCT bloco_id
    FROM public.cupons
    WHERE cliente_id = v_cliente_id AND data_atribuicao = now()
  );

  RETURN json_build_object(
    'sucesso', true,
    'mensagem', 'Cupons atribuídos com sucesso',
    'cupons_atribuidos', v_cupons_atribuidos,
    'cliente_nome', p_cliente_nome
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Inserir alguns blocos iniciais no pool (números 1-1000)
INSERT INTO public.blocos (numero_bloco, status)
SELECT generate_series(1, 1000), 'disponivel';

-- Inserir alguns lojistas de exemplo
INSERT INTO public.lojistas (nome_loja, cnpj, cidade, telefone, email, responsavel_nome, responsavel_telefone) VALUES 
('Loja do João', '12.345.678/0001-90', 'São Paulo', '(11) 99999-9999', 'joao@loja.com', 'João Silva', '(11) 88888-8888'),
('Mercado da Maria', '98.765.432/0001-10', 'Rio de Janeiro', '(21) 77777-7777', 'maria@mercado.com', 'Maria Santos', '(21) 66666-6666'),
('Farmácia Central', '11.222.333/0001-44', 'Belo Horizonte', '(31) 55555-5555', 'contato@farmacia.com', 'Pedro Costa', '(31) 44444-4444');