import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, Calendar, CreditCard, ShoppingBag } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HistoricoComprasProps {
  lojistaId: string;
}

interface Pagamento {
  id: string;
  valor: number;
  quantidade_blocos: number;
  forma_pagamento: string;
  status_pagamento: string;
  created_at: string;
}

const useHistoricoCompras = (lojistaId: string) => {
  return useQuery({
    queryKey: ['historico-compras', lojistaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pagamentos')
        .select('*')
        .eq('lojista_id', lojistaId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as Pagamento[];
    },
    enabled: !!lojistaId,
  });
};

export const HistoricoCompras = ({ lojistaId }: HistoricoComprasProps) => {
  const { data: compras, isLoading } = useHistoricoCompras(lojistaId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Histórico de Compras
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprovado':
        return 'default';
      case 'pendente':
        return 'secondary';
      case 'cancelado':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getFormaPagamentoIcon = (forma: string) => {
    if (forma === 'pix') return '💳';
    if (forma === 'cartao') return '💳';
    return '💰';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5" />
          Histórico de Compras
        </CardTitle>
        <CardDescription>
          Últimas {compras?.length || 0} compras realizadas
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!compras || compras.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma compra realizada ainda</p>
            <p className="text-sm">Suas compras aparecerão aqui</p>
          </div>
        ) : (
          <div className="space-y-4">
            {compras.map((compra) => (
              <div
                key={compra.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {compra.quantidade_blocos} {compra.quantidade_blocos === 1 ? 'bloco' : 'blocos'}
                      <span className="text-muted-foreground">
                        ({compra.quantidade_blocos * 100} cupons)
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(compra.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                      <span>{getFormaPagamentoIcon(compra.forma_pagamento)}</span>
                      {compra.forma_pagamento === 'pix' ? 'PIX' : 
                       compra.forma_pagamento === 'cartao' ? 'Cartão' : 
                       compra.forma_pagamento}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg text-primary">
                    R$ {compra.valor.toFixed(2)}
                  </div>
                  <Badge variant={getStatusColor(compra.status_pagamento)}>
                    {compra.status_pagamento === 'aprovado' ? '✅ Aprovado' :
                     compra.status_pagamento === 'pendente' ? '⏳ Pendente' :
                     compra.status_pagamento === 'cancelado' ? '❌ Cancelado' :
                     compra.status_pagamento}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};