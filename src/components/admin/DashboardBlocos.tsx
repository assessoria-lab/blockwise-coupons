import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Users, TrendingUp, RefreshCw } from 'lucide-react';

interface DashboardMetrics {
  total_blocos: number;
  total_cupons: number;
  cupons_disponiveis: number;
  cupons_atribuidos: number;
  cupons_usados: number;
  total_lojistas: number;
  total_clientes: number;
}

const DashboardBlocos = () => {
  const { data: metricas, isLoading, error, refetch } = useQuery<DashboardMetrics>({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      console.log('🔍 Buscando métricas do dashboard...');
      
      try {
        // Tentar com timeout
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 10000)
        );
        
        const queryPromise = supabase.rpc('get_dashboard_metrics_optimized');
        
        const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;
        
        console.log('📊 Resposta do Supabase:', { data, error });
        
        if (error) {
          console.error('❌ Erro ao buscar métricas:', error);
          throw error;
        }

        // O Supabase RPC retorna o objeto diretamente
        console.log('✅ Métricas processadas:', data);
        return (data as unknown as DashboardMetrics) || {
          total_blocos: 0,
          total_cupons: 0,
          cupons_disponiveis: 0,
          cupons_atribuidos: 0,
          cupons_usados: 0,
          total_lojistas: 0,
          total_clientes: 0
        };
      } catch (err) {
        console.error('❌ Erro na busca:', err);
        // Retornar dados vazios em caso de erro
        return {
          total_blocos: 0,
          total_cupons: 0,
          cupons_disponiveis: 0,
          cupons_atribuidos: 0,
          cupons_usados: 0,
          total_lojistas: 0,
          total_clientes: 0
        };
      }
    },
    retry: 2,
    retryDelay: 1000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-4">Erro ao carregar dashboard</p>
          <Button onClick={() => refetch()}>Tentar novamente</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard de Blocos</h2>
          <p className="text-muted-foreground">
            Visão geral do sistema de cupons e blocos
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Blocos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricas?.total_blocos || 0}</div>
            <p className="text-xs text-muted-foreground">blocos no sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cupons Disponíveis</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricas?.cupons_disponiveis || 0}</div>
            <p className="text-xs text-muted-foreground">prontos para uso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cupons Atribuídos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricas?.cupons_atribuidos || 0}</div>
            <p className="text-xs text-muted-foreground">aos clientes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cupons Usados</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricas?.cupons_usados || 0}</div>
            <p className="text-xs text-muted-foreground">já utilizados</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {metricas?.total_blocos === 0 
                ? "Sistema pronto. Crie blocos de cupons em 'Configurações do Sistema' para começar."
                : `Sistema funcionando com ${metricas.total_blocos} blocos e ${metricas.total_cupons} cupons.`
              }
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardBlocos;