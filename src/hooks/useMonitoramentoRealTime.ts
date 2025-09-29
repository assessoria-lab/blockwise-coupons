import { useState, useEffect } from 'react';

interface MetricasRealTime {
  blocos_vendidos_hoje: number;
  cupons_atribuidos_hoje: number;
  valor_vendas_hoje: number;
  lojistas_ativos: number;
  alertas_sistema: Alerta[];
}

interface Alerta {
  id: string;
  tipo: 'info' | 'warning' | 'error';
  titulo: string;
  mensagem: string;
  timestamp: string;
  dados_contexto?: any;
}

export const useMonitoramentoRealTime = () => {
  const [metricas, setMetricas] = useState<MetricasRealTime>({
    blocos_vendidos_hoje: 0,
    cupons_atribuidos_hoje: 0,
    valor_vendas_hoje: 0,
    lojistas_ativos: 1,
    alertas_sistema: []
  });
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching real-time metrics
    const fetchMetricas = () => {
      setMetricas({
        blocos_vendidos_hoje: Math.floor(Math.random() * 50),
        cupons_atribuidos_hoje: Math.floor(Math.random() * 200),
        valor_vendas_hoje: Math.random() * 5000,
        lojistas_ativos: Math.floor(Math.random() * 20) + 1,
        alertas_sistema: []
      });
      setLoading(false);
    };

    fetchMetricas();
    
    // Set up interval for updates
    const interval = setInterval(fetchMetricas, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  return {
    metricas,
    alertas,
    loading,
    refetch: () => setLoading(true)
  };
};