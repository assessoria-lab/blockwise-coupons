import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Store, Package, Users, TrendingUp, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface RankingLojista {
  lojista_id: string;
  nome_loja: string;
  cidade: string;
  total_blocos_comprados: number;
  total_cupons_atribuidos: number;
  cupons_disponiveis: number;
  valor_total_gerado: number;
  clientes_unicos: number;
  data_ultima_atribuicao: string | null;
  data_ultima_compra: string | null;
  percentual_utilizacao: number;
}

const fetchRankingLojistas = async (): Promise<RankingLojista[]> => {
  // Buscar lojistas ativos
  const { data: lojistas, error: errorLojistas } = await supabase
    .from('lojistas')
    .select('id, nome_loja, cidade, data_ultima_compra')
    .eq('status', 'ativo')
    .order('nome_loja');

  if (errorLojistas) throw errorLojistas;

  // Buscar todos os blocos vendidos
  const { data: blocos, error: errorBlocos } = await supabase
    .from('blocos')
    .select('id, lojista_id, status, cupons_atribuidos, cupons_disponiveis')
    .eq('status', 'vendido')
    .not('lojista_id', 'is', null);

  if (errorBlocos) throw errorBlocos;

  // Buscar todos os cupons atribuídos
  const { data: cupons, error: errorCupons } = await supabase
    .from('cupons')
    .select('id, lojista_id, status, valor_compra, data_atribuicao, cliente_id')
    .eq('status', 'atribuido')
    .not('lojista_id', 'is', null);

  if (errorCupons) throw errorCupons;

  // Processar dados para criar o ranking
  const rankingData: RankingLojista[] = (lojistas || []).map(lojista => {
    const blocosLojista = (blocos || []).filter(b => b.lojista_id === lojista.id);
    const cuponsLojista = (cupons || []).filter(c => c.lojista_id === lojista.id);
    
    const cuponsDisponiveis = blocosLojista.reduce((acc, b) => acc + (b.cupons_disponiveis || 0), 0);
    const valorTotalGerado = cuponsLojista.reduce((acc, c) => acc + (c.valor_compra || 0), 0);
    const clientesUnicos = new Set(cuponsLojista.map(c => c.cliente_id)).size;
    
    // Data da última atribuição
    const datasAtribuicao = cuponsLojista
      .map(c => c.data_atribuicao)
      .filter(d => d)
      .sort()
      .reverse();
    const ultimaAtribuicao = datasAtribuicao[0] || null;
    
    // Percentual de utilização
    const totalCuponsComprados = blocosLojista.length * 100;
    const percentualUtilizacao = totalCuponsComprados > 0 
      ? (cuponsLojista.length / totalCuponsComprados) * 100 
      : 0;

    return {
      lojista_id: lojista.id,
      nome_loja: lojista.nome_loja,
      cidade: lojista.cidade,
      total_blocos_comprados: blocosLojista.length,
      total_cupons_atribuidos: cuponsLojista.length,
      cupons_disponiveis: cuponsDisponiveis,
      valor_total_gerado: valorTotalGerado,
      clientes_unicos: clientesUnicos,
      data_ultima_atribuicao: ultimaAtribuicao,
      data_ultima_compra: lojista.data_ultima_compra,
      percentual_utilizacao: percentualUtilizacao
    };
  });

  // Ordenar por cupons atribuídos (maior para menor)
  return rankingData.sort((a, b) => b.total_cupons_atribuidos - a.total_cupons_atribuidos);
};

const getRankingIcon = (posicao: number) => {
  switch (posicao) {
    case 1:
      return '🥇';
    case 2:
      return '🥈';
    case 3:
      return '🥉';
    default:
      return `${posicao}º`;
  }
};

const getUtilizacaoColor = (percentual: number) => {
  if (percentual >= 80) return 'bg-green-100 text-green-800 border-green-200';
  if (percentual >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  if (percentual >= 40) return 'bg-orange-100 text-orange-800 border-orange-200';
  return 'bg-red-100 text-red-800 border-red-200';
};

export function RankingLojistas() {
  const { data: ranking, isLoading, error } = useQuery({
    queryKey: ['ranking-lojistas'],
    queryFn: fetchRankingLojistas,
    refetchInterval: 60000, // Atualiza a cada 1 minuto
  });

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Erro ao carregar ranking de lojistas</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Ranking de Lojistas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-3 w-[150px]" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!ranking || ranking.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Ranking de Lojistas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Store className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum lojista ativo encontrado</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-600" />
          Ranking de Lojistas
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Classificados por cupons atribuídos a clientes
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {ranking.slice(0, 10).map((lojista, index) => (
            <div
              key={lojista.lojista_id}
              className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                index < 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' : 'hover:bg-accent/50'
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  index < 3 ? 'bg-yellow-100 text-yellow-800 font-bold' : 'bg-muted text-muted-foreground'
                }`}>
                  <span className="text-sm">
                    {index < 3 ? getRankingIcon(index + 1) : `${index + 1}º`}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{lojista.nome_loja}</h4>
                    <Badge variant="outline" className="text-xs">
                      {lojista.cidade}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={getUtilizacaoColor(lojista.percentual_utilizacao)}
                    >
                      {lojista.percentual_utilizacao.toFixed(1)}% utilização
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      {lojista.total_blocos_comprados} blocos
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {lojista.clientes_unicos} clientes
                    </span>
                    {lojista.data_ultima_atribuicao && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Última: {format(new Date(lojista.data_ultima_atribuicao), 'dd/MM')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-primary text-lg">
                  {lojista.total_cupons_atribuidos.toLocaleString('pt-BR')}
                </div>
                <div className="text-xs text-muted-foreground">cupons atribuídos</div>
                <div className="text-xs text-green-600 font-medium mt-1">
                  R$ {lojista.valor_total_gerado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-muted-foreground">
                  {lojista.cupons_disponiveis} disponíveis
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {ranking.length > 10 && (
          <div className="text-center mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Mostrando top 10 de {ranking.length} lojistas ativos
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}