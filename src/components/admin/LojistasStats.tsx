import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Calendar, TrendingUp } from 'lucide-react';

const fetchLojistasStats = async () => {
  const hoje = new Date().toISOString().split('T')[0];
  const seteDiasAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  // Total de lojistas
  const { data: totalLojistas, error: errorTotal } = await supabase
    .from('lojistas')
    .select('id')
    .eq('status', 'ativo');

  // Lojistas cadastrados hoje
  const { data: lojistasHoje, error: errorHoje } = await supabase
    .from('lojistas')
    .select('id')
    .eq('status', 'ativo')
    .gte('created_at', hoje + ' 00:00:00')
    .lte('created_at', hoje + ' 23:59:59');

  // Lojistas cadastrados nos últimos 7 dias
  const { data: lojistas7Dias, error: error7Dias } = await supabase
    .from('lojistas')
    .select('id')
    .eq('status', 'ativo')
    .gte('created_at', seteDiasAtras + ' 00:00:00');

  // Lojistas com blocos comprados
  const { data: lojistasComBlocos, error: errorComBlocos } = await supabase
    .from('blocos')
    .select('lojista_id')
    .eq('status', 'vendido')
    .not('lojista_id', 'is', null);

  if (errorTotal || errorHoje || error7Dias || errorComBlocos) {
    throw new Error('Erro ao carregar estatísticas de lojistas');
  }

  const lojistasUnicosComBlocos = new Set(lojistasComBlocos?.map(b => b.lojista_id) || []).size;

  return {
    totalLojistas: totalLojistas?.length || 0,
    lojistasHoje: lojistasHoje?.length || 0,
    lojistas7Dias: lojistas7Dias?.length || 0,
    lojistasComBlocos: lojistasUnicosComBlocos,
  };
};

export const LojistasStats = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['lojistas-stats'],
    queryFn: fetchLojistasStats,
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Lojistas</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalLojistas || 0}</div>
          <p className="text-xs text-muted-foreground">
            Lojistas ativos cadastrados
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Novos Hoje</CardTitle>
          <UserPlus className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success">{stats?.lojistasHoje || 0}</div>
          <p className="text-xs text-muted-foreground">
            Cadastrados nas últimas 24h
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Últimos 7 Dias</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">{stats?.lojistas7Dias || 0}</div>
          <p className="text-xs text-muted-foreground">
            Novos cadastros na semana
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Com Blocos</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-accent">{stats?.lojistasComBlocos || 0}</div>
          <p className="text-xs text-muted-foreground">
            Lojistas que compraram blocos
          </p>
        </CardContent>
      </Card>
    </div>
  );
};