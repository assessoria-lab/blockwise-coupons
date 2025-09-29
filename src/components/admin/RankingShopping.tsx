import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, Building, MapPin } from 'lucide-react';

const RankingShopping = () => {
  const { data: lojistas = [] } = useQuery({
    queryKey: ['ranking-cidades'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lojistas')
        .select('*')
        .eq('ativo', true);

      if (error) {
        console.error('Erro ao buscar lojistas:', error);
        return [];
      }

      return data || [];
    },
  });

  // Agrupar por cidade
  const cidadesStats = lojistas.reduce((acc, lojista) => {
    const cidade = lojista.cidade || 'Cidade não informada';
    if (!acc[cidade]) {
      acc[cidade] = {
        nome: cidade,
        total_lojistas: 0,
        total_vendas: 0
      };
    }
    acc[cidade].total_lojistas++;
    return acc;
  }, {} as Record<string, any>);

  const ranking = Object.values(cidadesStats)
    .sort((a: any, b: any) => b.total_lojistas - a.total_lojistas)
    .map((item: any, index: number) => ({ ...item, posicao: index + 1 }));

  const getPosicaoBadge = (posicao: number) => {
    if (posicao === 1) return <Badge className="bg-yellow-500">🥇 1º</Badge>;
    if (posicao === 2) return <Badge className="bg-gray-400">🥈 2º</Badge>;
    if (posicao === 3) return <Badge className="bg-amber-600">🥉 3º</Badge>;
    return <Badge variant="outline">{posicao}º</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Cidades</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ranking.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média Lojistas/Cidade</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ranking.length > 0 ? Math.round(lojistas.length / ranking.length) : 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cidade Líder</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">
              {ranking.length > 0 ? ranking[0].nome : 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Ranking de Cidades por Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ranking.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma cidade com lojistas cadastrados ainda.
            </div>
          ) : (
            <div className="space-y-4">
              {ranking.map((cidade: any) => (
                <div 
                  key={cidade.nome} 
                  className={`flex items-center justify-between p-4 border rounded-lg ${
                    cidade.posicao <= 3 ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {getPosicaoBadge(cidade.posicao)}
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium">{cidade.nome}</h3>
                        <Badge variant="outline">
                          <Building className="h-3 w-3 mr-1" />
                          {cidade.total_lojistas} lojistas
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Performance baseada no número de lojistas ativos
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">R$ 0,00</div>
                    <div className="text-sm text-muted-foreground">em vendas</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RankingShopping;