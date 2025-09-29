import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Alerta {
  id: string;
  evento: string;
  descricao: string;
  dados_contexto: any;
  nivel: string;
  created_at: string;
  lojista_id?: string;
}

interface MetricasTempoReal {
  lojistas_ativos: number;
  cupons_disponiveis: number;
  cupons_atribuidos_hoje: number;
  cupons_atribuidos_total: number;
  blocos_pool: number;
  blocos_vendidos_hoje: number;
  valor_gerado_hoje: number;
  ultima_atualizacao: string;
}

export const useMonitoramentoRealTime = () => {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [metricas, setMetricas] = useState<MetricasTempoReal | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  // Função para buscar métricas iniciais
  const fetchMetricas = async () => {
    try {
      const { data, error } = await supabase.rpc('metricas_tempo_real');
      if (error) throw error;
      setMetricas(data as unknown as MetricasTempoReal);
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
    }
  };

  // Função para buscar alertas recentes
  const fetchAlertas = async () => {
    try {
      const { data, error } = await supabase
        .from('logs_sistema')
        .select('*')
        .in('nivel', ['warning', 'error'])
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      setAlertas(data || []);
    } catch (error) {
      console.error('Erro ao buscar alertas:', error);
    }
  };

  useEffect(() => {
    // Buscar dados iniciais
    fetchMetricas();
    fetchAlertas();

    // Subscription para alertas em tempo real
    const alertasChannel = supabase
      .channel('alertas-sistema')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'logs_sistema',
        filter: 'nivel=in.(warning,error)'
      }, (payload) => {
        console.log('Novo alerta recebido:', payload);
        const novoAlerta = payload.new as Alerta;
        
        setAlertas(prev => [novoAlerta, ...prev.slice(0, 9)]);
        
        // Exibir toast para alertas críticos
        if (novoAlerta.nivel === 'error') {
          toast({
            title: "🚨 Alerta Crítico",
            description: novoAlerta.descricao,
            variant: "destructive",
            duration: 8000,
          });
        } else if (novoAlerta.nivel === 'warning') {
          toast({
            title: "⚠️ Atenção",
            description: novoAlerta.descricao,
            variant: "default",
            duration: 5000,
          });
        }
      })
      .subscribe((status) => {
        console.log('Status da subscription de alertas:', status);
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
        }
      });

    // Subscription para mudanças que afetam métricas
    const metricasChannel = supabase
      .channel('metricas-tempo-real')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'cupons'
      }, () => {
        // Re-fetch das métricas quando houver mudanças em cupons
        fetchMetricas();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'blocos'
      }, () => {
        // Re-fetch das métricas quando houver mudanças em blocos
        fetchMetricas();
      })
      .subscribe();

    // Atualização periódica das métricas (a cada 30 segundos)
    const intervalo = setInterval(() => {
      fetchMetricas();
    }, 30000);

    // Cleanup
    return () => {
      clearInterval(intervalo);
      alertasChannel.unsubscribe();
      metricasChannel.unsubscribe();
      setIsConnected(false);
    };
  }, [toast]);

  const marcarAlertaComoLido = async (alertaId: string) => {
    try {
      // Atualizar o alerta como lido (se implementarmos esta funcionalidade)
      setAlertas(prev => prev.filter(alerta => alerta.id !== alertaId));
    } catch (error) {
      console.error('Erro ao marcar alerta como lido:', error);
    }
  };

  return { 
    alertas, 
    metricas, 
    isConnected, 
    marcarAlertaComoLido,
    refetchMetricas: fetchMetricas,
    refetchAlertas: fetchAlertas
  };
};