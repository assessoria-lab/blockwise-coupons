import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { subDays, format, startOfDay } from 'date-fns';

interface DadosCupom {
  data: string;
  compras: number;
  atribuicoes: number;
}

const fetchDadosVolumesCupons = async (): Promise<DadosCupom[]> => {
  // Buscar dados dos últimos 7 dias
  const hoje = new Date();
  const seteDiasAtras = subDays(hoje, 6);

  // Buscar compras de cupons (através de vendas de blocos)
  const { data: vendasBlocos, error: errorVendas } = await supabase
    .from('vendas_blocos')
    .select('data_venda, quantidade_blocos')
    .gte('data_venda', seteDiasAtras.toISOString());

  if (errorVendas) throw errorVendas;

  // Buscar atribuições de cupons
  const { data: cupons, error: errorCupons } = await supabase
    .from('cupons')
    .select('data_atribuicao')
    .gte('data_atribuicao', seteDiasAtras.toISOString())
    .eq('status', 'atribuido')
    .not('data_atribuicao', 'is', null);

  if (errorCupons) throw errorCupons;

  // Processar dados por dia
  const dadosPorDia: Record<string, DadosCupom> = {};

  // Inicializar todos os dias com 0
  for (let i = 0; i < 7; i++) {
    const data = subDays(hoje, 6 - i);
    const dataStr = format(startOfDay(data), 'yyyy-MM-dd');
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const diaSemana = diasSemana[data.getDay()];
    
    dadosPorDia[dataStr] = {
      data: diaSemana,
      compras: 0,
      atribuicoes: 0
    };
  }

  // Contar compras de cupons (blocos * 100 cupons por bloco)
  (vendasBlocos || []).forEach(venda => {
    const dataStr = format(startOfDay(new Date(venda.data_venda)), 'yyyy-MM-dd');
    if (dadosPorDia[dataStr]) {
      dadosPorDia[dataStr].compras += venda.quantidade_blocos * 100;
    }
  });

  // Contar atribuições de cupons
  (cupons || []).forEach(cupom => {
    const dataStr = format(startOfDay(new Date(cupom.data_atribuicao)), 'yyyy-MM-dd');
    if (dadosPorDia[dataStr]) {
      dadosPorDia[dataStr].atribuicoes += 1;
    }
  });

  const resultado = Object.values(dadosPorDia);
  console.log('Dados do gráfico:', resultado);
  return resultado;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-sm">
        <p className="font-medium text-gray-900 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value.toLocaleString('pt-BR')} cupons
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function GraficoVolumesCupons() {
  const { data: dadosVolumes, isLoading, error } = useQuery({
    queryKey: ['volumes-cupons'],
    queryFn: fetchDadosVolumesCupons,
    refetchInterval: 300000, // Atualiza a cada 5 minutos
  });

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Erro ao carregar dados do gráfico</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle>Compras vs Atribuições</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <CardTitle>Compras vs Atribuições</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Volume de compra de cupons e volume de atribuição de cupons a clientes
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={dadosVolumes}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#f0f0f0"
              vertical={false}
            />
            <XAxis 
              dataKey="data" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickFormatter={(value) => {
                if (value >= 1000) {
                  return `${(value / 1000).toFixed(0)}k`;
                }
                return value.toString();
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />
            <Line
              type="monotone"
              dataKey="compras"
              stroke="#22c55e"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
              name="Compras"
              activeDot={{ r: 6, fill: '#22c55e' }}
            />
            <Line
              type="monotone"
              dataKey="atribuicoes"
              stroke="#eab308"
              strokeWidth={2}
              dot={{ fill: '#eab308', strokeWidth: 2, r: 4 }}
              name="Atribuições"
              activeDot={{ r: 6, fill: '#eab308' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}