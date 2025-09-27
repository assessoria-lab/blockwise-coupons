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
      
      const { data, error } = await supabase
        .from('lojistas')
        .select('*')
        .eq('id', user.id)  // Use the lojista ID directly
        .eq('status', 'ativo')
        .order('nome_loja');

      if (error) throw error;
      return data as Loja[];
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