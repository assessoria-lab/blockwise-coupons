-- Criar tabela para armazenar ganhadores dos sorteios presenciais
CREATE TABLE public.ganhadores_sorteios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_cupom VARCHAR(20) NOT NULL,
  cupom_id UUID REFERENCES public.cupons(id),
  cliente_id UUID REFERENCES public.clientes(id),
  lojista_id UUID REFERENCES public.lojistas(id),
  premio TEXT NOT NULL,
  valor_premio NUMERIC(10,2) NOT NULL DEFAULT 0,
  tipo_sorteio VARCHAR(20) NOT NULL DEFAULT 'semanal',
  data_sorteio TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Adicionar RLS
ALTER TABLE public.ganhadores_sorteios ENABLE ROW LEVEL SECURITY;

-- Criar política para admin
CREATE POLICY "Admin pode gerenciar ganhadores"
ON public.ganhadores_sorteios
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Criar índices
CREATE INDEX idx_ganhadores_sorteios_data ON public.ganhadores_sorteios(data_sorteio);
CREATE INDEX idx_ganhadores_sorteios_tipo ON public.ganhadores_sorteios(tipo_sorteio);
CREATE INDEX idx_ganhadores_sorteios_cupom ON public.ganhadores_sorteios(numero_cupom);

-- Criar trigger para updated_at
CREATE TRIGGER update_ganhadores_sorteios_updated_at
  BEFORE UPDATE ON public.ganhadores_sorteios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();