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
      
      // Buscar TODAS as lojas vinculadas ao user_id (um usuário pode ter várias lojas)
      const { data, error } = await supabase
        .from('lojistas')
        .select('id, nome_loja, cnpj, cidade, shopping, segmento, status, cupons_nao_atribuidos')
        .eq('user_id', user.id);

      if (error) {
        console.error('Erro ao buscar lojas:', error);
        return [];
      }

      if (!data || data.length === 0) {
        console.warn('Nenhuma loja encontrada para o usuário:', user.id);
        return [];
      }

      const lojasFormatadas: Loja[] = data.map(loja => ({
        id: loja.id,
        nome_loja: loja.nome_loja,
        cnpj: loja.cnpj,
        cidade: loja.cidade,
        shopping: loja.shopping,
        segmento: loja.segmento,
        status: loja.status || 'ativo',
        cupons_nao_atribuidos: loja.cupons_nao_atribuidos || 0
      }));
      
      return lojasFormatadas;
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