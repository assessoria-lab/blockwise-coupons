import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Store } from 'lucide-react';

interface SegmentoData {
  segmento: string;
  total_cupons: number;
  total_lojistas: number;
  percentual: number;
}

const CORES_GRAFICOS = [
  '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6',
  '#F97316', '#06B6D4', '#84CC16', '#EC4899', '#6366F1'
];

const fetchDadosSegmentos = async (): Promise<SegmentoData[]> => {
  const { data, error } = await supabase
    .from('cupons')
    .select(`
      lojistas!inner(segmento),
      id,
      lojista_id
    `)
    .eq('status', 'atribuido')
    .not('lojistas.segmento', 'is', null);

  if (error) throw new Error(error.message);

  // Agrupar por segmento
  const segmentosMap = new Map<string, { cupons: number; lojistas: Set<string> }>();
  
  data.forEach((cupom: any) => {
    const segmento = cupom.lojistas.segmento;
    if (!segmentosMap.has(segmento)) {
      segmentosMap.set(segmento, { cupons: 0, lojistas: new Set() });
    }
    const segmentoData = segmentosMap.get(segmento)!;
    segmentoData.cupons++;
    segmentoData.lojistas.add(cupom.lojista_id);
  });

  const totalCupons = data.length;
  
  const resultado = Array.from(segmentosMap.entries())
    .map(([segmento, dados]) => ({
      segmento,
      total_cupons: dados.cupons,
      total_lojistas: dados.lojistas.size,
      percentual: (dados.cupons / totalCupons) * 100
    }))
    .sort((a, b) => b.total_cupons - a.total_cupons);

  return resultado;
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-border rounded-lg shadow-lg">
        <p className="font-semibold text-foreground">{data.segmento}</p>
        <p className="text-sm text-muted-foreground">
          Cupons: <span className="font-medium text-foreground">{data.total_cupons}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Lojistas: <span className="font-medium text-foreground">{data.total_lojistas}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Participação: <span className="font-medium text-foreground">{data.percentual.toFixed(1)}%</span>
        </p>
      </div>
    );
  }
  return null;
};

export const GraficoSegmentosLojistas = () => {
  const { data: dadosSegmentos, isLoading, error } = useQuery({
    queryKey: ['grafico-segmentos-lojistas'],
    queryFn: fetchDadosSegmentos,
    refetchInterval: 5 * 60 * 1000, // Atualiza a cada 5 minutos
  });

  if (isLoading) {
    return (
      <Card className="shadow-sm bg-white border border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Segmentos
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
            <Store className="h-5 w-5" />
            Segmentos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-80 flex items-center justify-center">
            <p className="text-destructive">Erro ao carregar dados dos segmentos</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!dadosSegmentos || dadosSegmentos.length === 0) {
    return (
      <Card className="shadow-sm bg-white border border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Segmentos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-80 flex items-center justify-center">
            <p className="text-muted-foreground">Nenhum dado de segmento disponível</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm bg-white border border-border">
      <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Segmentos
          </CardTitle>
        <p className="text-sm text-muted-foreground">
          Distribuição dos {dadosSegmentos.reduce((acc, segmento) => acc + segmento.total_cupons, 0)} cupons atribuídos por segmento de loja
        </p>
      </CardHeader>
      <CardContent className="p-6">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dadosSegmentos}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ segmento, percentual }) => 
                  percentual > 5 ? `${segmento} (${percentual.toFixed(1)}%)` : ''
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="total_cupons"
              >
                {dadosSegmentos.map((_, index) => (
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