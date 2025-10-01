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
      
      // Buscar lojas reais do banco de dados
      const { data, error } = await supabase
        .from('lojistas')
        .select('id, nome_loja, cnpj, cidade, shopping, segmento, status, cupons_nao_atribuidos')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar loja:', error);
        return [];
      }

      if (!data) {
        console.warn('Nenhuma loja encontrada para o usuário:', user.id);
        return [];
      }

      const loja: Loja = {
        id: data.id,
        nome_loja: data.nome_loja,
        cnpj: data.cnpj,
        cidade: data.cidade,
        shopping: data.shopping,
        segmento: data.segmento,
        status: data.status || 'ativo',
        cupons_nao_atribuidos: data.cupons_nao_atribuidos || 0
      };
      
      return [loja];
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