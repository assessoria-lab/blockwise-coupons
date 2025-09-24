import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin } from 'lucide-react';

interface CidadeData {
  cidade: string;
  total_cupons: number;
  total_clientes: number;
  percentual: number;
}

const CORES_GRAFICOS = [
  '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6',
  '#F97316', '#06B6D4', '#84CC16', '#EC4899', '#6366F1'
];

const fetchDadosCidades = async (): Promise<CidadeData[]> => {
  const { data, error } = await supabase
    .from('cupons')
    .select(`
      clientes!inner(cidade),
      id
    `)
    .eq('status', 'atribuido')
    .not('clientes.cidade', 'is', null);

  if (error) throw new Error(error.message);

  // Agrupar por cidade
  const cidadesMap = new Map<string, { cupons: number; clientes: Set<string> }>();
  
  data.forEach((cupom: any) => {
    const cidade = cupom.clientes.cidade;
    if (!cidadesMap.has(cidade)) {
      cidadesMap.set(cidade, { cupons: 0, clientes: new Set() });
    }
    const cidadeData = cidadesMap.get(cidade)!;
    cidadeData.cupons++;
    cidadeData.clientes.add(cupom.clientes.id);
  });

  const totalCupons = data.length;
  
  const resultado = Array.from(cidadesMap.entries())
    .map(([cidade, dados]) => ({
      cidade,
      total_cupons: dados.cupons,
      total_clientes: dados.clientes.size,
      percentual: (dados.cupons / totalCupons) * 100
    }))
    .sort((a, b) => b.total_cupons - a.total_cupons)
    .slice(0, 10); // Top 10 cidades

  return resultado;
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-border rounded-lg shadow-lg">
        <p className="font-semibold text-foreground">{data.cidade}</p>
        <p className="text-sm text-muted-foreground">
          Cupons: <span className="font-medium text-foreground">{data.total_cupons}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Clientes: <span className="font-medium text-foreground">{data.total_clientes}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Participação: <span className="font-medium text-foreground">{data.percentual.toFixed(1)}%</span>
        </p>
      </div>
    );
  }
  return null;
};

export const GraficoCidadesClientes = () => {
  const { data: dadosCidades, isLoading, error } = useQuery({
    queryKey: ['grafico-cidades-clientes'],
    queryFn: fetchDadosCidades,
    refetchInterval: 5 * 60 * 1000, // Atualiza a cada 5 minutos
  });

  if (isLoading) {
    return (
      <Card className="shadow-sm bg-white border border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Cidades dos Clientes com Cupons
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-80 flex items-center justify-center">
            <Skeleton className="w-full h-full rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-sm bg-white border border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Cidades dos Clientes com Cupons
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-80 flex items-center justify-center">
            <p className="text-destructive">Erro ao carregar dados das cidades</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!dadosCidades || dadosCidades.length === 0) {
    return (
      <Card className="shadow-sm bg-white border border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Cidades dos Clientes com Cupons
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-80 flex items-center justify-center">
            <p className="text-muted-foreground">Nenhum dado de cidade disponível</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm bg-white border border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Cidades dos Clientes com Cupons
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Distribuição dos {dadosCidades.reduce((acc, cidade) => acc + cidade.total_cupons, 0)} cupons atribuídos por cidade
        </p>
      </CardHeader>
      <CardContent className="p-6">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dadosCidades}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ cidade, percentual }) => 
                  percentual > 5 ? `${cidade} (${percentual.toFixed(1)}%)` : ''
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="total_cupons"
              >
                {dadosCidades.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CORES_GRAFICOS[index % CORES_GRAFICOS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value) => (
                  <span>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};