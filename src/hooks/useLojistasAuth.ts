import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Loja {
  id: string;
  nome_loja: string;
  cnpj: string;
  cidade: string;
  shopping?: string;
  segmento?: string;
  ativo: boolean;
  cupons_nao_atribuidos: number;
}

export const useLojistasAuth = () => {
  const { user } = useAuth();
  const [lojaSelecionada, setLojaSelecionada] = useState<string | null>(null);

  const { data: lojasData, isLoading } = useQuery({
    queryKey: ['lojas-usuario', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      // Buscar lojas do usuário logado
      const { data, error } = await supabase
        .from('lojas')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Erro ao buscar lojas:', error);
        return null;
      }

      return data;
    },
    enabled: !!user?.id
  });

  // Converter dados para array de lojas
  const lojas: Loja[] = Array.isArray(lojasData) ? (lojasData as unknown as Loja[]) : [];

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