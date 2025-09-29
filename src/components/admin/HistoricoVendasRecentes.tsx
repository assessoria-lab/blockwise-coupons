import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, Package, CreditCard } from 'lucide-react';

const HistoricoVendasRecentes = () => {
  const { data: vendas = [] } = useQuery({
    queryKey: ['vendas-recentes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendas_blocos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Erro ao buscar vendas:', error);
        return [];
      }

      return data || [];
    },
  });

  const getFormaPagamentoBadge = (forma: string) => {
    const formaMap = {
      'dinheiro': { label: 'Dinheiro', variant: 'default' as const },
      'cartao_credito': { label: 'Cartão Crédito', variant: 'secondary' as const },
      'cartao_debito': { label: 'Cartão Débito', variant: 'outline' as const },
      'pix': { label: 'PIX', variant: 'default' as const },
      'transferencia': { label: 'Transferência', variant: 'secondary' as const }
    };

    const config = formaMap[forma as keyof typeof formaMap] || { label: forma, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas Totais</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vendas.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {vendas.reduce((sum, v) => sum + Number(v.valor_total || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cupons Vendidos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vendas.reduce((sum, v) => sum + Number(v.quantidade_cupons || 0), 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {vendas.length > 0 
                ? (vendas.reduce((sum, v) => sum + Number(v.valor_total || 0), 0) / vendas.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                : '0,00'
              }
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vendas Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {vendas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma venda registrada ainda.
            </div>
          ) : (
            <div className="space-y-4">
              {vendas.map((venda: any) => (
                <div 
                  key={venda.id} 
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium">Venda #{venda.id.slice(0, 8)}</h3>
                      {getFormaPagamentoBadge(venda.forma_pagamento)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Cupons: {venda.quantidade_cupons} • 
                      Data: {new Date(venda.created_at).toLocaleDateString('pt-BR')}
                    </div>
                    {venda.observacoes && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Obs: {venda.observacoes}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      R$ {Number(venda.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {venda.quantidade_cupons} cupons
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

export default HistoricoVendasRecentes;