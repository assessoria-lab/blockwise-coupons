import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCustomAuth } from './useCustomAuth';

interface Loja {
  id: string;
  nome_loja: string;
  cnpj: string;
  cidade: string;
  shopping?: string;
  segmento?: string;
  status: string;
  cupons_nao_atribuidos: number;
}

export const useLojistas = () => {
  const { user } = useCustomAuth();
  const [lojaSelecionada, setLojaSelecionada] = useState<string | null>(null);

  const { data: lojas = [], isLoading } = useQuery({
    queryKey: ['lojistas', user?.id],
    queryFn: async () => {
      if (!user?.id || user.tipo !== 'lojista') return [];
      
      // For now, create a mock loja based on the user data
      const mockLoja: Loja = {
        id: user.id,
        nome_loja: user.nome_loja || 'Loja Principal',
        cnpj: '00.000.000/0001-00',
        cidade: 'Cidade',
        shopping: undefined,
        segmento: undefined,
        status: 'ativo',
        cupons_nao_atribuidos: 0
      };
      
      return [mockLoja];
    },
    enabled: !!user?.id && user?.tipo === 'lojista'
  });

  // Selecionar primeira loja automaticamente
  useEffect(() => {
    if (lojas.length > 0 && !lojaSelecionada) {
      setLojaSelecionada(lojas[0].id);
    }
  }, [lojas, lojaSelecionada]);

  const loja = lojas.find(l => l.id === lojaSelecionada);

  return {
    lojas,
    loja,
    lojaSelecionada,
    setLojaSelecionada,
    isLoading
  };
};