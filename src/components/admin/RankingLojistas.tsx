import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Store, MapPin } from 'lucide-react';

const RankingLojistas = () => {
  const { data: lojistas = [] } = useQuery({
    queryKey: ['ranking-lojistas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lojistas')
        .select('*')
        .eq('ativo', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar lojistas:', error);
        return [];
      }

      return data || [];
    },
  });

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
            <CardTitle className="text-sm font-medium">Lojistas Ativos</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lojistas.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Com Vendas</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cidades</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(lojistas.map(l => l.cidade).filter(Boolean)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Ranking de Lojistas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lojistas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum lojista cadastrado ainda.
            </div>
          ) : (
            <div className="space-y-4">
              {lojistas.map((lojista: any, index: number) => (
                <div 
                  key={lojista.id} 
                  className={`flex items-center justify-between p-4 border rounded-lg ${
                    index < 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {getPosicaoBadge(index + 1)}
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium">{lojista.nome}</h3>
                        {lojista.cidade && (
                          <Badge variant="outline">
                            <MapPin className="h-3 w-3 mr-1" />
                            {lojista.cidade}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Cadastrado em: {new Date(lojista.created_at).toLocaleDateString('pt-BR')}
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

export default RankingLojistas;