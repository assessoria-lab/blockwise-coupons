import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Store, DollarSign, TrendingUp } from 'lucide-react';

const fetchVendasStats = async () => {
  const hoje = new Date().toISOString().split('T')[0];
  
  // Buscar vendas de hoje
  const { data: vendasHoje, error: errorHoje } = await supabase
    .from('blocos')
    .select('id, data_venda, cupons_no_bloco')
    .eq('status', 'vendido')
    .gte('data_venda', hoje + ' 00:00:00')
    .lte('data_venda', hoje + ' 23:59:59');

  // Buscar total de blocos no pool disponível
  const { data: poolBlocos, error: errorPool } = await supabase
    .from('blocos')
    .select('id')
    .eq('status', 'disponivel')
    .is('lojista_id', null);

  // Buscar total de vendas realizadas
  const { data: totalVendas, error: errorTotal } = await supabase
    .from('blocos')
    .select('id, cupons_no_bloco')
    .eq('status', 'vendido');

  // Buscar valor médio de vendas (usando pagamentos)
  const { data: pagamentos, error: errorPagamentos } = await supabase
    .from('pagamentos')
    .select('valor, quantidade_blocos')
    .eq('status_pagamento', 'aprovado');

  if (errorHoje || errorPool || errorTotal || errorPagamentos) {
    throw new Error('Erro ao carregar estatísticas de vendas');
  }

  const blocosVendidosHoje = vendasHoje?.length || 0;
  const cuponsVendidosHoje = vendasHoje?.reduce((acc, bloco) => acc + (bloco.cupons_no_bloco || 100), 0) || 0;
  const blocosDisponiveis = poolBlocos?.length || 0;
  const totalBlocosVendidos = totalVendas?.length || 0;
  const valorMedioPorBloco = pagamentos?.length 
    ? (pagamentos.reduce((acc, p) => acc + (p.valor / p.quantidade_blocos), 0) / pagamentos.length)
    : 100;

  return {
    blocosVendidosHoje,
    cuponsVendidosHoje,
    blocosDisponiveis,
    totalBlocosVendidos,
    valorMedioPorBloco
  };
};

export const VendasBlocosStats = () => {
  const queryClient = useQueryClient();
  
  const { data: stats, isLoading } = useQuery({
    queryKey: ['vendas-blocos-stats'],
    queryFn: fetchVendasStats,
    refetchInterval: 10000, // Atualiza a cada 10 segundos
  });

  // Sistema de tempo real - atualiza quando há mudanças nos blocos ou pagamentos
  useEffect(() => {
    const channel = supabase
      .channel('vendas-stats-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'blocos'
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['vendas-blocos-stats'] });
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'pagamentos'
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['vendas-blocos-stats'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Blocos Vendidos Hoje</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.blocosVendidosHoje || 0}</div>
          <p className="text-xs text-muted-foreground">
            {stats?.cuponsVendidosHoje?.toLocaleString() || 0} cupons
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Blocos Disponíveis</CardTitle>
          <Store className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.blocosDisponiveis || 0}</div>
          <p className="text-xs text-muted-foreground">
            No pool para venda
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Vendido</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalBlocosVendidos || 0}</div>
          <p className="text-xs text-muted-foreground">
            Blocos vendidos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Valor Médio</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            R$ {stats?.valorMedioPorBloco?.toFixed(2) || '100.00'}
          </div>
          <p className="text-xs text-muted-foreground">
            Por bloco
          </p>
        </CardContent>
      </Card>
    </div>
  );
};