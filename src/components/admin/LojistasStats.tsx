import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Store, TrendingUp, Users, MapPin } from 'lucide-react';

const LojistasStats = () => {
  const { data: lojistas = [] } = useQuery({
    queryKey: ['lojas-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lojas')
        .select('*');

      if (error) {
        console.error('Erro ao buscar lojas:', error);
        return [];
      }

      return data || [];
    },
  });

  const lojistasAtivos = lojistas.filter(l => l.ativo);
  const cidades = new Set(lojistas.map(l => l.cidade).filter(Boolean));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Lojistas</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lojistas.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lojistas Ativos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lojistasAtivos.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cidades Atendidas</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cidades.size}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Ativação</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lojistas.length > 0 ? Math.round((lojistasAtivos.length / lojistas.length) * 100) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estatísticas de Lojistas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            {lojistas.length === 0 
              ? "Nenhum lojista cadastrado ainda."
              : `${lojistasAtivos.length} lojistas ativos de ${lojistas.length} cadastrados`
            }
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LojistasStats;