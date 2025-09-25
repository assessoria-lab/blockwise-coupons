import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RealTimeSyncOptions {
  enableStats?: boolean;
  enableVendas?: boolean;
  enableLojistas?: boolean;
  enableDashboard?: boolean;
}

export const useRealTimeSync = (options: RealTimeSyncOptions = {}) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    const channels: any[] = [];

    // Sistema principal de tempo real para todas as métricas
    if (options.enableStats || options.enableDashboard) {
      const mainChannel = supabase
        .channel('main-realtime-sync')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'blocos'
        }, () => {
          // Invalidar todas as queries relacionadas a blocos
          if (options.enableStats) {
            queryClient.invalidateQueries({ queryKey: ['vendas-blocos-stats'] });
            queryClient.invalidateQueries({ queryKey: ['lojistas-stats'] });
          }
          if (options.enableDashboard) {
            queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
          }
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'cupons'
        }, () => {
          if (options.enableStats) {
            queryClient.invalidateQueries({ queryKey: ['vendas-blocos-stats'] });
          }
          if (options.enableDashboard) {
            queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
          }
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'pagamentos'
        }, () => {
          if (options.enableVendas) {
            queryClient.invalidateQueries({ queryKey: ['vendas-recentes'] });
          }
          if (options.enableStats) {
            queryClient.invalidateQueries({ queryKey: ['vendas-blocos-stats'] });
          }
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'lojistas'
        }, () => {
          if (options.enableLojistas || options.enableStats) {
            queryClient.invalidateQueries({ queryKey: ['lojistas-stats'] });
            queryClient.invalidateQueries({ queryKey: ['lojistas-data'] });
          }
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'vendas_blocos'
        }, () => {
          if (options.enableVendas) {
            queryClient.invalidateQueries({ queryKey: ['vendas-recentes'] });
          }
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Sistema de tempo real conectado');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Erro na conexão de tempo real');
            toast({
              title: "Erro na conexão",
              description: "Sistema de tempo real desconectado. Dados podem não estar atualizados.",
              variant: "destructive",
              duration: 5000,
            });
          }
        });

      channels.push(mainChannel);
    }

    // Cleanup
    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [queryClient, toast, options.enableStats, options.enableVendas, options.enableLojistas, options.enableDashboard]);

  // Função para forçar atualização completa
  const forceRefresh = () => {
    if (options.enableStats) {
      queryClient.invalidateQueries({ queryKey: ['vendas-blocos-stats'] });
      queryClient.invalidateQueries({ queryKey: ['lojistas-stats'] });
    }
    if (options.enableVendas) {
      queryClient.invalidateQueries({ queryKey: ['vendas-recentes'] });
    }
    if (options.enableDashboard) {
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    }
  };

  return { forceRefresh };
};