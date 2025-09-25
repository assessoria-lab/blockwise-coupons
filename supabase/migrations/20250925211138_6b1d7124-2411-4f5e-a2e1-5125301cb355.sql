-- Adiciona coluna lojista_id à tabela logs_sistema para rastreabilidade
ALTER TABLE public.logs_sistema 
ADD COLUMN lojista_id UUID REFERENCES public.lojistas(id);