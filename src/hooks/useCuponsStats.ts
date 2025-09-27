import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CuponsStats {
  total_cupons_disponiveis: number;
  total_cupons_atribuidos: number;
  total_blocos: number;
  cupons_atribuidos_hoje: number;
  valor_gerado_total: number;
}

export const useCuponsStats = (lojistaId?: string) => {
  return useQuery({
    queryKey: ['cupons-stats', lojistaId],
    queryFn: async () => {
      if (!lojistaId) return null;

      // Buscar estatísticas dos cupons
      const { data: blocos } = await supabase
        .from('blocos')
        .select('cupons_disponiveis, cupons_atribuidos')
        .eq('lojista_id', lojistaId)
        .eq('status', 'vendido');

      const { data: cuponsAtribuidos } = await supabase
        .from('cupons')
        .select('valor_compra, data_atribuicao')
        .eq('lojista_id', lojistaId)
        .eq('status', 'atribuido');

      // Calcular totais
      const totalBlocos = blocos?.length || 0;
      const totalDisponiveis = blocos?.reduce((sum, bloco) => sum + (bloco.cupons_disponiveis || 0), 0) || 0;
      const totalAtribuidos = blocos?.reduce((sum, bloco) => sum + (bloco.cupons_atribuidos || 0), 0) || 0;
      
      // Cupons atribuídos hoje
      const hoje = new Date().toDateString();
      const cuponsHoje = cuponsAtribuidos?.filter(cupom => 
        new Date(cupom.data_atribuicao).toDateString() === hoje
      ).length || 0;

      // Valor total gerado
      const valorTotal = cuponsAtribuidos?.reduce((sum, cupom) => sum + (Number(cupom.valor_compra) || 0), 0) || 0;

      return {
        total_cupons_disponiveis: totalDisponiveis,
        total_cupons_atribuidos: totalAtribuidos,
        total_blocos: totalBlocos,
        cupons_atribuidos_hoje: cuponsHoje,
        valor_gerado_total: valorTotal
      } as CuponsStats;
    },
    enabled: !!lojistaId,
    refetchInterval: 30000 // Atualizar a cada 30 segundos
  });
};