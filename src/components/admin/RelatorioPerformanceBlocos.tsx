import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, TrendingUp, Package, Users, DollarSign } from 'lucide-react';
import { useState } from 'react';

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

const RelatorioPerformanceBlocos = () => {
  const [lojistaFiltro, setLojistaFiltro] = useState<string>('');

  const { data: utilizacaoBlocos, isLoading } = useQuery<UtilizacaoBloco[]>({
    queryKey: ['utilizacao-blocos', lojistaFiltro],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('relatorio_utilizacao_blocos', {
        p_lojista_id: lojistaFiltro || null
      });
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

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

  // Calcular métricas resumidas
  const metricas = utilizacaoBlocos ? {
    totalBlocos: utilizacaoBlocos.length,
    utilizacaoMedia: utilizacaoBlocos.reduce((acc, bloco) => acc + bloco.utilizacao_percentual, 0) / utilizacaoBlocos.length,
    valorTotalGerado: utilizacaoBlocos.reduce((acc, bloco) => acc + bloco.valor_gerado, 0),
    clientesTotais: utilizacaoBlocos.reduce((acc, bloco) => acc + bloco.clientes_atendidos, 0)
  } : null;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-pulse">Carregando relatório...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Performance de Utilização dos Blocos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <Select value={lojistaFiltro} onValueChange={setLojistaFiltro}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Filtrar por lojista" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os lojistas</SelectItem>
                {lojistas?.map((lojista) => (
                  <SelectItem key={lojista.id} value={lojista.id}>
                    {lojista.nome_loja}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {lojistaFiltro && (
              <Button variant="outline" onClick={() => setLojistaFiltro('')}>
                Limpar filtro
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Métricas resumidas */}
      {metricas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento por Bloco</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default RelatorioPerformanceBlocos;