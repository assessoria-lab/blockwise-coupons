import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, CreditCard, Store, User } from 'lucide-react';
import { format } from 'date-fns';

interface VendaRecente {
  id: string;
  data_transacao: string;
  lojista_nome: string;
  quantidade_blocos: number;
  valor_total: number;
  forma_pagamento: string;
  status: string;
  tipo_origem: 'manual' | 'whatsapp';
}

const fetchVendasRecentes = async (): Promise<VendaRecente[]> => {
  // Busca pagamentos (incluindo vendas manuais e automáticas)
  const { data: pagamentos, error: errorPagamentos } = await supabase
    .from('pagamentos')
    .select(`
      id,
      created_at,
      valor,
      quantidade_blocos,
      forma_pagamento,
      status_pagamento,
      lojistas!inner(nome_loja)
    `)
    .order('created_at', { ascending: false })
    .limit(20);

  if (errorPagamentos) throw errorPagamentos;

  // Busca vendas_blocos (histórico anterior)
  const { data: vendasBlocos, error: errorVendas } = await supabase
    .from('vendas_blocos')
    .select(`
      id,
      data_venda,
      valor_total,
      quantidade_blocos,
      forma_pagamento,
      lojistas!inner(nome_loja)
    `)
    .order('data_venda', { ascending: false })
    .limit(10);

  if (errorVendas) throw errorVendas;

  // Combina e mapeia os dados
  const vendasFormatadas: VendaRecente[] = [
    ...(pagamentos || []).map(p => ({
      id: p.id,
      data_transacao: p.created_at,
      lojista_nome: p.lojistas.nome_loja,
      quantidade_blocos: p.quantidade_blocos,
      valor_total: p.valor,
      forma_pagamento: p.forma_pagamento,
      status: p.status_pagamento,
      tipo_origem: 'manual' as const
    })),
    ...(vendasBlocos || []).map(v => ({
      id: v.id,
      data_transacao: v.data_venda,
      lojista_nome: v.lojistas.nome_loja,
      quantidade_blocos: v.quantidade_blocos,
      valor_total: v.valor_total,
      forma_pagamento: v.forma_pagamento,
      status: 'aprovado',
      tipo_origem: 'manual' as const
    }))
  ];

  // Ordena por data mais recente
  return vendasFormatadas
    .sort((a, b) => new Date(b.data_transacao).getTime() - new Date(a.data_transacao).getTime())
    .slice(0, 20);
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'aprovado':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'pendente':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'rejeitado':
    case 'cancelado':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getPaymentIcon = (formaPagamento: string) => {
  const forma = formaPagamento.toLowerCase();
  if (forma.includes('pix')) return '💳';
  if (forma.includes('dinheiro')) return '💵';
  if (forma.includes('cartao')) return '💳';
  if (forma.includes('transferencia')) return '🏦';
  return '💰';
};

export function HistoricoVendasRecentes() {
  const queryClient = useQueryClient();
  
  const { data: vendas, isLoading, error } = useQuery({
    queryKey: ['vendas-recentes'],
    queryFn: fetchVendasRecentes,
    refetchInterval: 10000, // Atualiza a cada 10 segundos
  });

  // Sistema de tempo real - atualiza quando há mudanças nas vendas
  useEffect(() => {
    const channel = supabase
      .channel('vendas-recentes-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'pagamentos'
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['vendas-recentes'] });
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'vendas_blocos'
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['vendas-recentes'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8 text-muted-foreground">
            <Store className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Erro ao carregar histórico de vendas</p>
            <p className="text-sm">Tente recarregar a página</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Vendas Recentes</CardTitle>
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

  if (!vendas || vendas.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Vendas Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Store className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma venda registrada ainda</p>
            <p className="text-sm">As vendas aparecerão aqui quando forem realizadas</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="h-5 w-5" />
          Histórico de Vendas Recentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {vendas.map((venda) => (
            <div
              key={venda.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-primary/10 p-2 rounded-full">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{venda.lojista_nome}</h4>
                    <Badge
                      variant="outline"
                      className={getStatusColor(venda.status)}
                    >
                      {venda.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(venda.data_transacao), 'dd/MM/yyyy HH:mm')}
                    </span>
                    <span className="flex items-center gap-1">
                      <CreditCard className="h-3 w-3" />
                      {getPaymentIcon(venda.forma_pagamento)} {venda.forma_pagamento}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-primary">
                  R$ {venda.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-muted-foreground">
                  {venda.quantidade_blocos} bloco{venda.quantidade_blocos !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}