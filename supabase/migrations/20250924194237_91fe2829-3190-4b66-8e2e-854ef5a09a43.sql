-- Adicionar coluna tipo_cliente na tabela cupons
ALTER TABLE public.cupons 
ADD COLUMN tipo_cliente VARCHAR(10) DEFAULT 'varejo' CHECK (tipo_cliente IN ('varejo', 'atacado'));

-- Atualizar cupons existentes com valores fictícios (varejo para valores <= 150, atacado para > 150)
UPDATE public.cupons 
SET tipo_cliente = CASE 
  WHEN valor_compra > 150 THEN 'atacado'
  ELSE 'varejo'
END
WHERE status = 'atribuido';