import { useState, useEffect } from 'react';

interface MetricasRealTime {
  blocos_vendidos_hoje: number;
  cupons_atribuidos_hoje: number;
  valor_vendas_hoje: number;
  valor_gerado_hoje: number;
  lojistas_ativos: number;
  cupons_disponiveis: number;
  blocos_pool: number;
  cupons_atribuidos_total: number;
  ultima_atualizacao: string;
  alertas_sistema: Alerta[];
}

interface Alerta {
  id: string;
  tipo: 'info' | 'warning' | 'error';
  nivel: 'info' | 'warning' | 'error';
  titulo: string;
  mensagem: string;
  descricao: string;
  timestamp: string;
  created_at: string;
  dados_contexto?: any;
}

export const useMonitoramentoRealTime = () => {
  const [metricas, setMetricas] = useState<MetricasRealTime>({
    blocos_vendidos_hoje: 0,
    cupons_atribuidos_hoje: 0,
    valor_vendas_hoje: 0,
    valor_gerado_hoje: 0,
    lojistas_ativos: 1,
    cupons_disponiveis: 0,
    blocos_pool: 0,
    cupons_atribuidos_total: 0,
    ultima_atualizacao: new Date().toISOString(),
    alertas_sistema: []
  });
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    // Simulate fetching real-time metrics
    const fetchMetricas = () => {
      setMetricas({
        blocos_vendidos_hoje: Math.floor(Math.random() * 50),
        cupons_atribuidos_hoje: Math.floor(Math.random() * 200),
        valor_vendas_hoje: Math.random() * 5000,
        valor_gerado_hoje: Math.random() * 5000,
        lojistas_ativos: Math.floor(Math.random() * 20) + 1,
        cupons_disponiveis: Math.floor(Math.random() * 1000),
        blocos_pool: Math.floor(Math.random() * 100),
        cupons_atribuidos_total: Math.floor(Math.random() * 500),
        ultima_atualizacao: new Date().toISOString(),
        alertas_sistema: []
      });
      setLoading(false);
    };

    fetchMetricas();
    
    // Set up interval for updates
    const interval = setInterval(fetchMetricas, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const marcarAlertaComoLido = (alertaId: string) => {
    setAlertas(prev => prev.filter(a => a.id !== alertaId));
  };

  const refetchMetricas = () => {
    setLoading(true);
  };

  return {
    metricas,
    alertas,
    loading,
    isConnected,
    marcarAlertaComoLido,
    refetchMetricas,
    refetch: () => setLoading(true)
  };
};