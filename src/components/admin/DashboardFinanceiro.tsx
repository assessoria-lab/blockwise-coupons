import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  Clock, 
  AlertCircle,
  CheckCircle,
  XCircle,
  PieChart,
  Calendar
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface VendaBloco {
  id: string;
  quantidade_blocos: number;
  valor_total: number;
  valor_por_bloco: number;
  forma_pagamento: string;
  data_venda: string;
  lojista: {
    nome_loja: string;
    cidade: string;
  };
}

interface MetricasFinanceiras {
  faturamentoTotal: number;
  faturamentoMes: number;
  transacoesTotal: number;
  transacoesMes: number;
  ticketMedio: number;
  crescimentoMensal: number;
}

const fetchVendasBlocos = async (periodo: string) => {
  let dataInicio = new Date();
  
  switch (periodo) {
    case 'hoje':
      dataInicio = new Date();
      dataInicio.setHours(0, 0, 0, 0);
      break;
    case 'semana':
      dataInicio = subDays(new Date(), 7);
      break;
    case 'mes':
      dataInicio = startOfMonth(new Date());
      break;
    case 'trimestre':
      dataInicio = subDays(new Date(), 90);
      break;
    default:
      dataInicio = subDays(new Date(), 30);
  }

  const { data, error } = await supabase
    .from('vendas_blocos')
    .select(`
      id,
      quantidade_blocos,
      valor_total,
      valor_por_bloco,
      forma_pagamento,
      data_venda,
      lojistas!inner(nome_loja, cidade)
    `)
    .gte('data_venda', dataInicio.toISOString())
    .order('data_venda', { ascending: false });

  if (error) throw new Error(error.message);

  return (data || []).map(item => ({
    id: item.id,
    quantidade_blocos: item.quantidade_blocos,
    valor_total: item.valor_total,
    valor_por_bloco: item.valor_por_bloco,
    forma_pagamento: item.forma_pagamento,
    data_venda: item.data_venda,
    lojista: {
      nome_loja: (item.lojistas as any)?.nome_loja || 'N/A',
      cidade: (item.lojistas as any)?.cidade || 'N/A',
    }
  }));
};

const fetchMetricasFinanceiras = async () => {
  // Buscar todas as vendas
  const { data: vendas } = await supabase
    .from('vendas_blocos')
    .select('valor_total, data_venda');

  if (!vendas) return null;

  const agora = new Date();
  const inicioMes = startOfMonth(agora);
  const fimMes = endOfMonth(agora);
  
  const inicioMesPassado = startOfMonth(subDays(agora, 30));
  const fimMesPassado = endOfMonth(subDays(agora, 30));

  const faturamentoTotal = vendas.reduce((sum, v) => sum + (v.valor_total || 0), 0);
  
  const vendasMes = vendas.filter(v => {
    const dataVenda = new Date(v.data_venda);
    return dataVenda >= inicioMes && dataVenda <= fimMes;
  });
  
  const vendasMesPassado = vendas.filter(v => {
    const dataVenda = new Date(v.data_venda);
    return dataVenda >= inicioMesPassado && dataVenda <= fimMesPassado;
  });

  const faturamentoMes = vendasMes.reduce((sum, v) => sum + (v.valor_total || 0), 0);
  const faturamentoMesPassado = vendasMesPassado.reduce((sum, v) => sum + (v.valor_total || 0), 0);
  
  const crescimentoMensal = faturamentoMesPassado > 0 
    ? ((faturamentoMes - faturamentoMesPassado) / faturamentoMesPassado) * 100 
    : 0;

  return {
    faturamentoTotal,
    faturamentoMes,
    transacoesTotal: vendas.length,
    transacoesMes: vendasMes.length,
    ticketMedio: vendas.length > 0 ? faturamentoTotal / vendas.length : 0,
    crescimentoMensal
  };
};

const fetchDistribuicaoPagamentos = async () => {
  const { data: vendas } = await supabase
    .from('vendas_blocos')
    .select('forma_pagamento, valor_total');

  if (!vendas) return [];

  const distribuicao = vendas.reduce((acc, venda) => {
    const forma = venda.forma_pagamento;
    if (!acc[forma]) {
      acc[forma] = { count: 0, valor: 0 };
    }
    acc[forma].count += 1;
    acc[forma].valor += venda.valor_total || 0;
    return acc;
  }, {} as Record<string, { count: number; valor: number }>);

  return Object.entries(distribuicao).map(([forma, dados]) => ({
    forma_pagamento: forma,
    quantidade: dados.count,
    valor_total: dados.valor,
    percentual: (dados.count / vendas.length) * 100
  }));
};

export const DashboardFinanceiro = () => {
  const [periodo, setPeriodo] = useState('mes');

  const { data: vendas = [], isLoading: loadingVendas } = useQuery({
    queryKey: ['vendas-blocos', periodo],
    queryFn: () => fetchVendasBlocos(periodo),
  });

  const { data: metricas } = useQuery({
    queryKey: ['metricas-financeiras'],
    queryFn: fetchMetricasFinanceiras,
  });

  const { data: distribuicaoPagamentos = [] } = useQuery({
    queryKey: ['distribuicao-pagamentos'],
    queryFn: fetchDistribuicaoPagamentos,
  });

  const getIconeFormaPagamento = (forma: string) => {
    switch (forma) {
      case 'pix':
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'cartao':
        return <CreditCard className="h-4 w-4 text-blue-600" />;
      default:
        return <CreditCard className="h-4 w-4 text-gray-600" />;
    }
  };

  const getCorFormaPagamento = (forma: string) => {
    switch (forma) {
      case 'pix':
        return 'bg-green-500';
      case 'cartao':
        return 'bg-blue-500';
      case 'boleto':
        return 'bg-orange-500';
      case 'transferencia':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Métricas Principais */}
      {metricas && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Faturamento Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {metricas.faturamentoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Mês Atual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {metricas.faturamentoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Crescimento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${metricas.crescimentoMensal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {metricas.crescimentoMensal >= 0 ? '+' : ''}{metricas.crescimentoMensal.toFixed(1)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Transações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metricas.transacoesTotal}</div>
              <div className="text-xs text-muted-foreground">
                {metricas.transacoesMes} este mês
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {metricas.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="default" className="bg-green-600">
                Sistema Online
              </Badge>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribuição por Forma de Pagamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Formas de Pagamento
            </CardTitle>
            <CardDescription>
              Distribuição das transações por método
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {distribuicaoPagamentos.map((item) => (
              <div key={item.forma_pagamento} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${getCorFormaPagamento(item.forma_pagamento)}`} />
                  <div>
                    <div className="font-medium capitalize">{item.forma_pagamento}</div>
                    <div className="text-sm text-muted-foreground">
                      {item.quantidade} transações
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{item.percentual.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">
                    R$ {item.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Transações Recentes */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Transações Recentes
                </CardTitle>
                <CardDescription>
                  Últimas vendas de blocos realizadas
                </CardDescription>
              </div>
              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hoje">Hoje</SelectItem>
                  <SelectItem value="semana">Última Semana</SelectItem>
                  <SelectItem value="mes">Último Mês</SelectItem>
                  <SelectItem value="trimestre">Último Trimestre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {loadingVendas ? (
              <div className="text-center py-8">Carregando transações...</div>
            ) : vendas.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma transação encontrada para o período selecionado
              </div>
            ) : (
              <div className="space-y-4">
                {vendas.slice(0, 10).map((venda) => (
                  <div key={venda.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      {getIconeFormaPagamento(venda.forma_pagamento)}
                      <div>
                        <div className="font-medium">{venda.lojista.nome_loja}</div>
                        <div className="text-sm text-muted-foreground">
                          {venda.lojista.cidade} • {venda.quantidade_blocos} bloco(s)
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">
                        R$ {venda.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(venda.data_venda), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabela Detalhada */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico Detalhado de Transações</CardTitle>
          <CardDescription>
            Visualização completa de todas as vendas de blocos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Lojista</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Blocos</TableHead>
                <TableHead>Valor/Bloco</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendas.map((venda) => (
                <TableRow key={venda.id}>
                  <TableCell className="font-mono text-sm">
                    {format(new Date(venda.data_venda), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </TableCell>
                  <TableCell className="font-medium">{venda.lojista.nome_loja}</TableCell>
                  <TableCell>{venda.lojista.cidade}</TableCell>
                  <TableCell className="text-center">{venda.quantidade_blocos}</TableCell>
                  <TableCell className="font-mono">
                    R$ {venda.valor_por_bloco.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getIconeFormaPagamento(venda.forma_pagamento)}
                      <span className="capitalize">{venda.forma_pagamento}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold">
                    R$ {venda.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};