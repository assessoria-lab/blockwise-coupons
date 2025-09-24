-- Adicionar coluna segmento à tabela lojistas
ALTER TABLE public.lojistas 
ADD COLUMN segmento character varying;

-- Criar tabela para gerenciar segmentos disponíveis
CREATE TABLE public.segmentos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome character varying NOT NULL UNIQUE,
  categoria character varying DEFAULT 'moda_vestuario',
  ativo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS na tabela segmentos
ALTER TABLE public.segmentos ENABLE ROW LEVEL SECURITY;

-- Criar política para visualização dos segmentos
CREATE POLICY "Segmentos são visíveis para todos" 
ON public.segmentos 
FOR SELECT 
USING (ativo = true);

-- Criar política para administradores gerenciarem segmentos
CREATE POLICY "Admin pode gerenciar segmentos" 
ON public.segmentos 
FOR ALL 
USING (true);

-- Inserir segmentos padrão de moda e vestuário
INSERT INTO public.segmentos (nome, categoria) VALUES
('Roupas Femininas', 'moda_vestuario'),
('Roupas Masculinas', 'moda_vestuario'),
('Roupas Infantis', 'moda_vestuario'),
('Calçados Femininos', 'moda_vestuario'),
('Calçados Masculinos', 'moda_vestuario'),
('Calçados Infantis', 'moda_vestuario'),
('Bolsas e Acessórios', 'moda_vestuario'),
('Jóias e Semi-jóias', 'moda_vestuario'),
('Lingerie e Moda Íntima', 'moda_vestuario'),
('Moda Praia', 'moda_vestuario'),
('Moda Esportiva', 'moda_vestuario'),
('Moda Plus Size', 'moda_vestuario'),
('Moda Festa e Cerimônia', 'moda_vestuario'),
('Óculos e Acessórios', 'moda_vestuario'),
('Perfumaria e Cosméticos', 'moda_vestuario');

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_segmentos_updated_at
BEFORE UPDATE ON public.segmentos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();