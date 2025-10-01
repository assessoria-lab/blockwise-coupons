import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  ArrowUp, 
  ArrowDown, 
  Calendar, 
  AlertCircle, 
  Activity,
  BarChart3,
  PieChart,
  RefreshCw
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell 
} from 'recharts';

interface AnaliseGeral {
  media_diaria: number;
  tendencia: number;
  projecao_30_dias: number;
  saldo_atual: number;
  recomendacao: string;
  data_analise: string;
}

interface PadroesTemporais {
  por_hora: Array<{ hora: number; atribuicoes: number }>;
  por_dia_semana: Array<{ dia_semana: string; atribuicoes: number }>;
  por_mes: Array<{ mes: string; atribuicoes: number }>;
}

const BusinessIntelligence = () => {
  const { data: analiseGeral, isLoading: loadingAnalise, refetch: refetchAnalise } = useQuery<AnaliseGeral>({
    queryKey: ['analise-demanda-geral'],
    queryFn: async (): Promise<AnaliseGeral> => {
      const { data, error } = await supabase.rpc('analise_demanda_cupons');
      if (error) throw new Error(error.message);
      return data as unknown as AnaliseGeral;
    }
  });

  const { data: lojasMaisAtivas, isLoading: loadingLojas } = useQuery({
    queryKey: ['lojas-mais-ativas'],
    queryFn: async () => {
      // Get top lojistas by cupons atribuídos count
      const { data, error } = await supabase
        .from('cupons')
        .select('lojista_id, lojistas(nome_loja, cidade)')
        .not('lojista_id', 'is', null)
        .eq('status', 'atribuido');
      
      if (error) throw new Error(error.message);
      
      // Group by lojista_id and count
      const grouped = (data || []).reduce((acc: any, item: any) => {
        const lojistaId = item.lojista_id;
        if (!acc[lojistaId]) {
          acc[lojistaId] = {
            lojista_id: lojistaId,
            nome_loja: item.lojistas?.nome_loja || 'N/A',
            cidade: item.lojistas?.cidade || 'N/A',
            total_cupons_atribuidos: 0
          };
        }
        acc[lojistaId].total_cupons_atribuidos++;
        return acc;
      }, {});
      
      return Object.values(grouped)
        .sort((a: any, b: any) => b.total_cupons_atribuidos - a.total_cupons_atribuidos)
        .slice(0, 5);
    }
  });

  const { data: padroesTempo, isLoading: loadingPadroes } = useQuery<PadroesTemporais>({
    queryKey: ['padroes-tempo'],
    queryFn: async (): Promise<PadroesTemporais> => {
      const { data, error } = await supabase.rpc('analise_padroes_temporais');
      if (error) throw new Error(error.message);
      return data as unknown as PadroesTemporais;
    }
  });

  const getRecomendacaoColor = () => {
    if (!analiseGeral) return 'from-gray-500 to-gray-600';
    switch (analiseGeral.recomendacao) {
      case 'REABASTECER_ESTOQUE': return 'from-red-500 to-red-600';
      case 'BAIXA_DEMANDA': return 'from-yellow-500 to-yellow-600';
      default: return 'from-blue-500 to-blue-600';
    }
  };

  const getRecomendacaoTexto = () => {
    if (!analiseGeral) return 'Carregando...';
    switch (analiseGeral.recomendacao) {
      case 'REABASTECER_ESTOQUE': return 'Reabastecer Estoque';
      case 'BAIXA_DEMANDA': return 'Demanda Baixa';
      default: return 'Nível Adequado';
    }
  };

  const getTendenciaIcon = () => {
    if (!analiseGeral) return <Activity className="h-5 w-5" />;
    return analiseGeral.tendencia > 0 
      ? <ArrowUp className="h-5 w-5 text-green-500" />
      : <ArrowDown className="h-5 w-5 text-red-500" />;
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loadingAnalise || loadingLojas || loadingPadroes) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Inteligência de Negócios</h1>
        </div>
        <div className="text-center py-12">
          <div className="animate-pulse">Carregando análises...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Inteligência de Negócios</h1>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            refetchAnalise();
          }}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar Análise
        </Button>
      </div>

      {/* Insights Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Demanda Diária Média</p>
                <p className="text-2xl font-bold">
                  {analiseGeral?.media_diaria || 0} cupons
                </p>
              </div>
              <TrendingUp className="h-6 w-6 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Tendência</p>
                <div className="flex items-center gap-1">
                  <span className="text-2xl font-bold">
                    {analiseGeral?.tendencia > 0 ? '+' : ''}{analiseGeral?.tendencia || 0}
                  </span>
                  {getTendenciaIcon()}
                </div>
              </div>
              <Activity className="h-6 w-6 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Projeção 30 Dias</p>
                <p className="text-2xl font-bold">
                  {analiseGeral?.projecao_30_dias?.toLocaleString() || 0}
                </p>
              </div>
              <Calendar className="h-6 w-6 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br text-white ${getRecomendacaoColor()}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white opacity-90 text-sm">Recomendação</p>
                <p className="text-lg font-bold">
                  {getRecomendacaoTexto()}
                </p>
              </div>
              <AlertCircle className="h-6 w-6 text-white opacity-75" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos de Análise */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Padrões por Hora */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Atividade por Hora (Últimos 7 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={padroesTempo?.por_hora || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="hora" 
                  tickFormatter={(value) => `${value}h`}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => `Hora: ${value}:00`}
                  formatter={(value) => [value, 'Atribuições']}
                />
                <Bar dataKey="atribuicoes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Padrões por Dia da Semana */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Distribuição Semanal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={padroesTempo?.por_dia_semana || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ dia_semana, percent }) => `${dia_semana} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="atribuicoes"
                >
                  {padroesTempo?.por_dia_semana?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Atribuições']} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Ranking de Lojas e Tendência Mensal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Lojas */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Lojas Mais Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lojasMaisAtivas?.map((loja: any, index: number) => (
                <div key={loja.lojista_id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Badge variant={index === 0 ? "default" : "outline"} className="w-8 h-8 rounded-full flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <div>
                      <p className="font-medium">{loja.nome_loja}</p>
                      <p className="text-sm text-muted-foreground">{loja.cidade}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      {loja.total_cupons_atribuidos} cupons
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Evolução Mensal */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={padroesTempo?.por_mes || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="atribuicoes"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 6, fill: '#3b82f6' }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Resumo da Análise */}
      {analiseGeral && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo da Análise Preditiva</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Situação Atual</h4>
                <p className="text-2xl font-bold">{analiseGeral.saldo_atual.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Cupons disponíveis no sistema</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Demanda Projetada</h4>
                <p className="text-2xl font-bold">{analiseGeral.projecao_30_dias.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Cupons estimados para 30 dias</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Status</h4>
                <Badge 
                  variant={analiseGeral.recomendacao === 'REABASTECER_ESTOQUE' ? 'destructive' : 
                          analiseGeral.recomendacao === 'BAIXA_DEMANDA' ? 'secondary' : 'default'}
                  className="text-lg px-4 py-2"
                >
                  {getRecomendacaoTexto()}
                </Badge>
              </div>
            </div>
            <div className="mt-4 text-sm text-muted-foreground text-center">
              Análise realizada em: {new Date(analiseGeral.data_analise).toLocaleString('pt-BR')}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BusinessIntelligence;