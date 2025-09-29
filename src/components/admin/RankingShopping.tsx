import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Building, Store, Package, Users, TrendingUp, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface RankingShopping {
  shopping: string;
  cidade: string;
  total_lojistas: number;
  total_blocos_comprados: number;
  total_cupons_atribuidos: number;
  cupons_disponiveis: number;
  valor_total_gerado: number;
  clientes_unicos: number;
  data_ultima_atribuicao: string | null;
  percentual_utilizacao: number;
  lojistas_ativos: string[];
}

const fetchRankingShopping = async (): Promise<RankingShopping[]> => {
  // Buscar lojistas ativos
  const { data: lojistas, error: errorLojistas } = await supabase
    .from('lojistas')
    .select('id, nome_loja, cidade, shopping, segmento, data_ultima_compra')
    .eq('status', 'ativo')
    .not('shopping', 'is', null)
    .order('shopping');

  if (errorLojistas) throw errorLojistas;

  // Buscar todos os blocos vendidos
  const { data: blocos, error: errorBlocos } = await supabase
    .from('blocos')
    .select('lojista_id, cupons_atribuidos, cupons_disponiveis')
    .eq('status', 'vendido')
    .not('lojista_id', 'is', null);

  if (errorBlocos) throw errorBlocos;

  // Buscar todos os cupons atribuídos
  const { data: cupons, error: errorCupons } = await supabase
    .from('cupons')
    .select('lojista_id, valor_compra, data_atribuicao, cliente_id')
    .eq('status', 'atribuido')
    .not('lojista_id', 'is', null);

  if (errorCupons) throw errorCupons;

  // Agrupar lojistas por shopping
  const shoppingsMap = new Map<string, {
    shopping: string;
    cidade: string;
    lojistas: any[];
  }>();

  (lojistas || []).forEach(lojista => {
    const shopping = lojista.shopping || 'Não informado';
    if (!shoppingsMap.has(shopping)) {
      shoppingsMap.set(shopping, {
        shopping,
        cidade: lojista.cidade,
        lojistas: []
      });
    }
    shoppingsMap.get(shopping)?.lojistas.push(lojista);
  });

  // Processar dados por shopping
  const rankingData: RankingShopping[] = Array.from(shoppingsMap.values()).map(shoppingData => {
    const { shopping, cidade, lojistas: lojistasDoShopping } = shoppingData;
    const lojistasIds = lojistasDoShopping.map(l => l.id);

    // Filtrar blocos e cupons dos lojistas deste shopping
    const blocosDoShopping = (blocos || []).filter(b => lojistasIds.includes(b.lojista_id));
    const cuponsDoShopping = (cupons || []).filter(c => lojistasIds.includes(c.lojista_id));
    
    // Calcular métricas agregadas
    const totalBlocosComprados = blocosDoShopping.length;
    const totalCuponsAtribuidos = cuponsDoShopping.length;
    const cuponsDisponiveis = blocosDoShopping.reduce((acc, b) => acc + (b.cupons_disponiveis || 0), 0);
    const valorTotalGerado = cuponsDoShopping.reduce((acc, c) => acc + (c.valor_compra || 0), 0);
    
    // Contar clientes únicos
    const clientesUnicos = new Set(cuponsDoShopping.map(c => c.cliente_id).filter(id => id)).size;
    
    // Encontrar a data da última atribuição
    const datasAtribuicao = cuponsDoShopping
      .map(c => c.data_atribuicao)
      .filter(d => d)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    const ultimaAtribuicao = datasAtribuicao[0] || null;
    
    // Calcular percentual de utilização
    const totalCuponsComprados = totalBlocosComprados * 100;
    const percentualUtilizacao = totalCuponsComprados > 0 
      ? (totalCuponsAtribuidos / totalCuponsComprados) * 100 
      : 0;

    return {
      shopping,
      cidade,
      total_lojistas: lojistasDoShopping.length,
      total_blocos_comprados: totalBlocosComprados,
      total_cupons_atribuidos: totalCuponsAtribuidos,
      cupons_disponiveis: cuponsDisponiveis,
      valor_total_gerado: valorTotalGerado,
      clientes_unicos: clientesUnicos,
      data_ultima_atribuicao: ultimaAtribuicao,
      percentual_utilizacao: percentualUtilizacao,
      lojistas_ativos: lojistasDoShopping.map(l => l.nome_loja)
    };
  })
  // Filtrar apenas shoppings que têm dados relevantes
  .filter(shopping => shopping.total_blocos_comprados > 0 || shopping.total_cupons_atribuidos > 0)
  // Ordenar por cupons atribuídos (maior para menor), depois por valor gerado
  .sort((a, b) => {
    if (b.total_cupons_atribuidos !== a.total_cupons_atribuidos) {
      return b.total_cupons_atribuidos - a.total_cupons_atribuidos;
    }
    return b.valor_total_gerado - a.valor_total_gerado;
  });

  return rankingData;
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

export function RankingShopping() {
  const { data: ranking, isLoading, error } = useQuery({
    queryKey: ['ranking-shopping'],
    queryFn: fetchRankingShopping,
    refetchInterval: 60000, // Atualiza a cada 1 minuto
  });

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8 text-muted-foreground">
            <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Erro ao carregar ranking de shoppings</p>
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
            <Building className="h-5 w-5" />
            Ranking de Shoppings/Galerias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-3 w-[200px]" />
                </div>
                <Skeleton className="h-6 w-20" />
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
            <Building className="h-5 w-5" />
            Ranking de Shoppings/Galerias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum shopping com atividade encontrado</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5 text-blue-600" />
          Ranking de Shoppings/Galerias
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Classificados por cupons atribuídos agregados por localização
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {ranking.slice(0, 10).map((shopping, index) => (
            <div
              key={shopping.shopping}
              className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                index < 3 ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200' : 'hover:bg-accent/50'
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  index < 3 ? 'bg-blue-100 text-blue-800 font-bold' : 'bg-muted text-muted-foreground'
                }`}>
                  <span className="text-sm">
                    {index < 3 ? getRankingIcon(index + 1) : `${index + 1}º`}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{shopping.shopping}</h4>
                    <Badge variant="outline" className="text-xs">
                      {shopping.cidade}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={getUtilizacaoColor(shopping.percentual_utilizacao)}
                    >
                      {shopping.percentual_utilizacao.toFixed(1)}% utilização
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Store className="h-3 w-3" />
                      {shopping.total_lojistas} lojistas
                    </span>
                    <span className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      {shopping.total_blocos_comprados} blocos
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {shopping.clientes_unicos} clientes
                    </span>
                    {shopping.data_ultima_atribuicao && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Última: {format(new Date(shopping.data_ultima_atribuicao), 'dd/MM')}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Lojas: {shopping.lojistas_ativos.slice(0, 3).join(', ')}
                    {shopping.lojistas_ativos.length > 3 && ` e mais ${shopping.lojistas_ativos.length - 3}`}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-primary text-lg">
                  {shopping.total_cupons_atribuidos.toLocaleString('pt-BR')}
                </div>
                <div className="text-xs text-muted-foreground">cupons atribuídos</div>
                <div className="text-xs text-green-600 font-medium mt-1">
                  R$ {shopping.valor_total_gerado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-muted-foreground">
                  {shopping.cupons_disponiveis} disponíveis
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {ranking.length > 10 && (
          <div className="text-center mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Mostrando top 10 de {ranking.length} shoppings/galerias
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}