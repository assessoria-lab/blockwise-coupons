import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Users, TrendingUp, RefreshCw } from 'lucide-react';
import GraficoRegioesLojistas from './GraficoRegioesLojistas';
import RankingCompraBlocos from './RankingCompraBlocos';
import RankingAtribuicaoCupons from './RankingAtribuicaoCupons';

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
  // Usar dados de demonstração
  const metricas: DashboardMetrics = {
    total_blocos: 60,
    total_cupons: 6000,
    cupons_disponiveis: 5700,
    cupons_atribuidos: 300,
    cupons_usados: 0,
    total_lojistas: 11,
    total_clientes: 150,
  };

  const isLoading = false;
  const error = null;
  const refetch = () => console.log('Refetch simulado');

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

      {/* Gráficos e Rankings */}
      <div className="grid gap-6 lg:grid-cols-2">
        <GraficoRegioesLojistas />
        <RankingCompraBlocos />
      </div>

      <RankingAtribuicaoCupons />
    </div>
  );
};

export default DashboardBlocos;