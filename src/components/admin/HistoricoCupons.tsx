import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const HistoricoCupons = () => {
  const { data: cupons = [] } = useQuery({
    queryKey: ['cupons-historico'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cupons')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Erro ao buscar cupons:', error);
        return [];
      }

      return data || [];
    },
  });

  const getStatusBadge = (status: string) => {
    const statusMap = {
      disponivel: { label: 'Disponível', variant: 'default' as const },
      atribuido: { label: 'Atribuído', variant: 'secondary' as const },
      usado: { label: 'Usado', variant: 'outline' as const },
      expirado: { label: 'Expirado', variant: 'destructive' as const }
    };

    const config = statusMap[status as keyof typeof statusMap] || statusMap.disponivel;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Cupons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cupons.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponíveis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {cupons.filter(c => c.status === 'disponivel').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atribuídos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {cupons.filter(c => c.status === 'atribuido').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {cupons.filter(c => c.status === 'usado').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Cupons</CardTitle>
        </CardHeader>
        <CardContent>
          {cupons.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum cupom encontrado.
            </div>
          ) : (
            <div className="space-y-4">
              {cupons.map((cupom: any) => (
                <div 
                  key={cupom.id} 
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-mono text-sm font-medium">{cupom.numero_cupom}</h3>
                      {getStatusBadge(cupom.status)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Criado em: {new Date(cupom.created_at).toLocaleString()}
                    </div>
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

export default HistoricoCupons;