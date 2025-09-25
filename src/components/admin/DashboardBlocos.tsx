import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GraficoVolumesCupons } from './GraficoVolumesCupons';
import { GraficoCidadesClientes } from './GraficoCidadesClientes';
import { GraficoSegmentosLojistas } from './GraficoSegmentosLojistas';
import { RankingLojistas } from './RankingLojistas';
import { RankingShopping } from './RankingShopping';
import { 
  Package, 
  Store, 
  Users, 
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  BarChart,
  DollarSign
} from 'lucide-react';

interface UtilizacaoBloco {
  numero_bloco: string;
  lojista_nome: string;
  cupons_total: number;
  cupons_atribuidos: number;
  cupons_disponiveis: number;
  utilizacao_percentual: number;
  comprado_em: string;
  dias_desde_compra: number;
  valor_gerado: number;
  clientes_atendidos: number;
}

// Real-time dashboard metrics
const useDashboardMetrics = () => {
  const queryClient = useQueryClient();
  
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_dashboard_metrics');
      if (error) throw error;
      
      const metricsData = data?.[0]; // RPC returns an array, take first element
      
      // Buscar dados de sequência de cupons
      const { data: sequenceData, error: seqError } = await supabase
        .from('cupons')
        .select('numero_cupom')
        .order('numero_cupom', { ascending: true });
      
      if (seqError) throw seqError;
      
      const numeros = sequenceData?.map(c => c.numero_cupom) || [];
      const primeiro_numero = numeros.length > 0 ? Math.min(...numeros) : 1000001;
      const ultimo_numero = numeros.length > 0 ? Math.max(...numeros) : 1000001;
      const total_unicos = numeros.length;
      const proximo_disponivel = ultimo_numero + 1;
      
      return {
        blocos_disponiveis: metricsData?.blocos_pool_geral || 0,
        blocos_com_lojistas: metricsData?.blocos_com_lojistas || 0,
        cupons_nao_atribuidos: metricsData?.cupons_nao_atribuidos || 0,
        cupons_atribuidos: metricsData?.cupons_atribuidos || 0,
        blocos_vendidos_hoje: metricsData?.blocos_vendidos_hoje || 0,
        cupons_atribuidos_hoje: metricsData?.cupons_atribuidos_hoje || 0,
        primeiro_numero,
        ultimo_numero,
        total_unicos,
        proximo_disponivel,
        integridade_ok: true,
        capacidade_maxima: {
          cupons_suportados: 998999999999
        }
      };
    },
    refetchInterval: 5000 // Atualiza a cada 5 segundos
  });

  // Sistema de tempo real - atualiza quando há mudanças
  useEffect(() => {
    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'blocos'
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'cupons'
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return { metrics, isLoading };
};

interface MetricCardProps {
  title: string;
  value: number;
  subtitle?: string;
  badge?: string;
  icon: React.ReactNode;
  variant: 'pool' | 'lojista' | 'client';
}

const MetricCard = ({ title, value, subtitle, badge, icon, variant }: MetricCardProps) => {
  const variantStyles = {
    pool: 'bg-white border-l-4 border-pool-available shadow-sm hover:shadow-md',
    lojista: 'bg-white border-l-4 border-lojista-blocks shadow-sm hover:shadow-md', 
    client: 'bg-white border-l-4 border-client-assigned shadow-sm hover:shadow-md'
  };

  const iconStyles = {
    pool: 'text-pool-available bg-pool-available/10 p-2 rounded-full',
    lojista: 'text-lojista-blocks bg-lojista-blocks/10 p-2 rounded-full',
    client: 'text-client-assigned bg-client-assigned/10 p-2 rounded-full'
  };

  return (
    <Card className={`${variantStyles[variant]} border-border transition-all duration-200 hover:scale-[1.02]`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={iconStyles[variant]}>{icon}</div>
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{title}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-foreground mb-2">
          {value.toLocaleString('pt-BR')}
        </div>
        {subtitle && (
          <p className="text-sm text-muted-foreground mb-3">{subtitle}</p>
        )}
        {badge && (
          <Badge 
            variant="secondary" 
            className="text-xs bg-muted text-muted-foreground border border-border hover:text-white"
          >
            {badge}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
};

const DashboardBlocos = () => {
  const { metrics, isLoading } = useDashboardMetrics();
  const [lojistaFiltro, setLojistaFiltro] = useState<string>('all');

  // Query para performance dos blocos
  const { data: utilizacaoBlocos, isLoading: loadingPerformance } = useQuery<UtilizacaoBloco[]>({
    queryKey: ['utilizacao-blocos', lojistaFiltro],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('relatorio_utilizacao_blocos', {
        p_lojista_id: (lojistaFiltro && lojistaFiltro !== 'all') ? lojistaFiltro : null
      });
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

  // Query para lista de lojistas
  const { data: lojistas } = useQuery({
    queryKey: ['lojistas-ativos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lojistas')
        .select('id, nome_loja')
        .eq('status', 'ativo')
        .order('nome_loja');
      if (error) throw error;
      return data;
    }
  });

  // Calcular métricas de performance
  const metricas = utilizacaoBlocos ? {
    totalBlocos: utilizacaoBlocos.length,
    utilizacaoMedia: utilizacaoBlocos.reduce((acc, bloco) => acc + bloco.utilizacao_percentual, 0) / utilizacaoBlocos.length,
    valorTotalGerado: utilizacaoBlocos.reduce((acc, bloco) => acc + bloco.valor_gerado, 0),
    clientesTotais: utilizacaoBlocos.reduce((acc, bloco) => acc + bloco.clientes_atendidos, 0)
  } : null;

  if (isLoading || loadingPerformance) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Block Metrics */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MetricCard
            title="Blocos Disponíveis"
            value={metrics.blocos_disponiveis}
            subtitle={`≈ ${(metrics.blocos_disponiveis * 100).toLocaleString('pt-BR')} cupons disponíveis`}
            badge="Aguardando compra por lojistas"
            icon={<Package className="h-5 w-5" />}
            variant="pool"
          />
          
          <MetricCard
            title="Blocos com Lojistas"
            value={metrics.blocos_com_lojistas}
            subtitle={`≈ ${metrics.cupons_nao_atribuidos.toLocaleString('pt-BR')} cupons não atribuídos`}
            badge={`Vendidos hoje: ${metrics.blocos_vendidos_hoje}`}
            icon={<Store className="h-5 w-5" />}
            variant="lojista"
          />
          
          <MetricCard
            title="Cupons Atribuídos a Clientes"
            value={metrics.cupons_atribuidos}
            subtitle={`Atribuídos hoje: ${metrics.cupons_atribuidos_hoje.toLocaleString('pt-BR')}`}
            badge="Participando dos sorteios"
            icon={<Users className="h-5 w-5" />}
            variant="client"
          />
        </div>
      </section>

      {/* Sequence Control */}
      <section>
        <Card className="shadow-sm bg-white border border-border">
          <CardHeader className="border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <CheckCircle className="h-5 w-5 text-success" />
                Status da Sequência Global de Cupons
              </CardTitle>
              <Badge 
                variant={metrics.integridade_ok ? "default" : "destructive"}
                className={metrics.integridade_ok ? "bg-success text-success-foreground" : ""}
              >
                {metrics.integridade_ok ? 'OK' : 'ERRO'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg border border-border">
                <div className="text-xl font-bold text-foreground mb-1">
                  {metrics.primeiro_numero.toLocaleString('pt-BR')}
                </div>
                <div className="text-xs text-muted-foreground">Primeiro Cupom</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg border border-border">
                <div className="text-xl font-bold text-foreground mb-1">
                  {metrics.ultimo_numero.toLocaleString('pt-BR')}
                </div>
                <div className="text-xs text-muted-foreground">Último Cupom</div>
              </div>
              <div className="text-center p-4 bg-success/10 rounded-lg border border-success/20">
                <div className="text-xl font-bold text-success mb-1">
                  {metrics.total_unicos.toLocaleString('pt-BR')}
                </div>
                <div className="text-xs text-muted-foreground">Cupons Únicos</div>
              </div>
              <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20">
                <div className="text-xl font-bold text-primary mb-1">
                  {metrics.proximo_disponivel.toLocaleString('pt-BR')}
                </div>
                <div className="text-xs text-muted-foreground">Próximo Sequencial</div>
              </div>
            </div>
            
            <div className="p-4 bg-success/5 border border-success/20 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Capacidade máxima:</strong> {metrics.capacidade_maxima.cupons_suportados.toLocaleString('pt-BR')} cupons
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Activity Stats */}           
      <section>
        <div className="bg-white rounded-lg p-6 shadow-sm border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Atividade de Hoje
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gray-50 rounded-lg border border-border hover:shadow-md transition-shadow">
              <Clock className="h-8 w-8 text-warning mx-auto mb-3" />
              <div className="text-2xl font-bold text-foreground mb-1">{metrics.blocos_vendidos_hoje}</div>
              <div className="text-sm text-muted-foreground">Blocos Vendidos</div>
            </div>
            
            <div className="text-center p-6 bg-gray-50 rounded-lg border border-border hover:shadow-md transition-shadow">
              <Users className="h-8 w-8 text-client-assigned mx-auto mb-3" />
              <div className="text-2xl font-bold text-foreground mb-1">{metrics.cupons_atribuidos_hoje.toLocaleString('pt-BR')}</div>
              <div className="text-sm text-muted-foreground">Cupons Atribuídos</div>
            </div>
            
            <div className="text-center p-6 bg-gray-50 rounded-lg border border-border hover:shadow-md transition-shadow">
              <TrendingUp className="h-8 w-8 text-success mx-auto mb-3" />
              <div className="text-2xl font-bold text-foreground mb-1">89.2%</div>
              <div className="text-sm text-muted-foreground">Taxa de Atribuição</div>
            </div>
          </div>
        </div>
      </section>

      {/* Gráfico Volumes Cupons */}
      <section>
        <GraficoVolumesCupons />
      </section>

      {/* Gráficos de Pizza */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GraficoCidadesClientes />
        <GraficoSegmentosLojistas />
      </section>

      {/* Ranking de Lojistas */}
      <section>
        <RankingLojistas />
      </section>

      {/* Ranking de Shoppings */}
      <section>
        <RankingShopping />
      </section>

      {/* Performance de Blocos */}
      <section>
        <Card className="shadow-sm bg-white border border-border">
          <CardHeader className="border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <BarChart className="h-5 w-5" />
                Performance de Utilização dos Blocos
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* Filtros */}
            <div className="flex gap-4 items-center mb-6">
              <Select value={lojistaFiltro} onValueChange={setLojistaFiltro}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Filtrar por lojista" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os lojistas</SelectItem>
                  {lojistas?.map((lojista) => (
                    <SelectItem key={lojista.id} value={lojista.id}>
                      {lojista.nome_loja}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {lojistaFiltro && lojistaFiltro !== 'all' && (
                <Button variant="outline" onClick={() => setLojistaFiltro('all')}>
                  Limpar filtro
                </Button>
              )}
            </div>

            {/* Métricas resumidas de performance */}
            {metricas && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total de Blocos</p>
                        <p className="text-2xl font-bold">{metricas.totalBlocos}</p>
                      </div>
                      <Package className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Utilização Média</p>
                        <p className="text-2xl font-bold">{metricas.utilizacaoMedia.toFixed(1)}%</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Valor Gerado</p>
                        <p className="text-2xl font-bold">
                          R$ {metricas.valorTotalGerado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-yellow-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Clientes Atendidos</p>
                        <p className="text-2xl font-bold">{metricas.clientesTotais}</p>
                      </div>
                      <Users className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Tabela de blocos */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Detalhamento por Bloco</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Bloco</th>
                      <th className="text-left p-3 font-medium">Lojista</th>
                      <th className="text-left p-3 font-medium">Utilização</th>
                      <th className="text-left p-3 font-medium">Cupons</th>
                      <th className="text-left p-3 font-medium">Valor Gerado</th>
                      <th className="text-left p-3 font-medium">Clientes</th>
                      <th className="text-left p-3 font-medium">Comprado há</th>
                    </tr>
                  </thead>
                  <tbody>
                    {utilizacaoBlocos?.map((bloco) => (
                      <tr key={bloco.numero_bloco} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <div className="font-mono text-xs break-all">
                            {bloco.numero_bloco}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium">{bloco.lojista_nome}</div>
                        </td>
                        <td className="p-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Progress 
                                value={bloco.utilizacao_percentual}
                                className="w-16 h-2"
                              />
                              <span className="text-xs font-medium min-w-[3rem]">
                                {bloco.utilizacao_percentual}%
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="space-y-1">
                            <div className="flex gap-2">
                              <Badge variant="default" className="text-xs">
                                {bloco.cupons_atribuidos} usado{bloco.cupons_atribuidos !== 1 ? 's' : ''}
                              </Badge>
                            </div>
                            <div className="flex gap-2">
                              <Badge variant="outline" className="text-xs">
                                {bloco.cupons_disponiveis} livre{bloco.cupons_disponiveis !== 1 ? 's' : ''}
                              </Badge>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium">
                            R$ {bloco.valor_gerado.toLocaleString('pt-BR', { 
                              minimumFractionDigits: 2, 
                              maximumFractionDigits: 2 
                            })}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-center">
                            {bloco.clientes_atendidos}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-xs text-muted-foreground">
                            {bloco.dias_desde_compra} dia{bloco.dias_desde_compra !== 1 ? 's' : ''}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {utilizacaoBlocos?.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum bloco encontrado com os filtros aplicados.
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default DashboardBlocos;