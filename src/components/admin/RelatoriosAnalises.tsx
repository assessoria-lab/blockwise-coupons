import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Download, 
  TrendingUp, 
  Users, 
  Store, 
  DollarSign,
  Calendar,
  MapPin,
  BarChart3,
  PieChart
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RelatorioLojista {
  id: string;
  nome_loja: string;
  blocos_comprados: number;
  valor_investido: number;
  cupons_atribuidos: number;
  cupons_disponiveis: number;
  ticket_medio: number;
  ultima_compra: string;
}

interface AnaliseRegional {
  cidade: string;
  clientes_ativos: number;
  cupons_emitidos: number;
  valor_total_compras: number;
}

interface TendenciaTemporal {
  periodo: string;
  vendas: number;
  valor_total: number;
  novos_lojistas: number;
}

const fetchRelatorioLojistas = async () => {
  const { data: lojistas } = await supabase
    .from('lojistas')
    .select('*');

  if (!lojistas) return [];

  const relatorios = await Promise.all(
    lojistas.map(async (lojista) => {
      // Buscar blocos comprados
      const { data: blocos } = await supabase
        .from('blocos')
        .select('*')
        .eq('lojista_id', lojista.id);

      // Buscar vendas
      const { data: vendas } = await supabase
        .from('vendas_blocos')
        .select('*')
        .eq('lojista_id', lojista.id);

      // Buscar cupons atribuídos
      const { data: cupons } = await supabase
        .from('cupons')
        .select('*')
        .eq('lojista_id', lojista.id)
        .eq('status', 'atribuido');

      const blocos_comprados = blocos?.length || 0;
      const valor_investido = vendas?.reduce((sum, v) => sum + (v.valor_total || 0), 0) || 0;
      const cupons_atribuidos = cupons?.length || 0;
      const cupons_disponiveis = lojista.cupons_nao_atribuidos || 0;
      const ticket_medio = cupons_atribuidos > 0 
        ? cupons.reduce((sum, c) => sum + (c.valor_compra || 0), 0) / cupons_atribuidos 
        : 0;
      const ultima_compra = vendas && vendas.length > 0 
        ? vendas.sort((a, b) => new Date(b.data_venda).getTime() - new Date(a.data_venda).getTime())[0].data_venda
        : null;

      return {
        id: lojista.id,
        nome_loja: lojista.nome_loja,
        cidade: lojista.cidade,
        blocos_comprados,
        valor_investido,
        cupons_atribuidos,
        cupons_disponiveis,
        ticket_medio,
        ultima_compra
      };
    })
  );

  return relatorios.sort((a, b) => b.valor_investido - a.valor_investido);
};

const fetchAnaliseRegional = async (): Promise<AnaliseRegional[]> => {
  // Análise baseada nas cidades dos clientes, não dos lojistas
  const { data: clientes } = await supabase
    .from('clientes')
    .select('cidade, total_cupons_recebidos, total_valor_compras, status')
    .not('cidade', 'is', null);

  const analises = new Map<string, AnaliseRegional>();
  
  clientes?.forEach(cliente => {
    const cidade = cliente.cidade;
    if (!cidade) return;
    
    if (!analises.has(cidade)) {
      analises.set(cidade, {
        cidade,
        clientes_ativos: 0,
        cupons_emitidos: 0,
        valor_total_compras: 0
      });
    }
    
    const analise = analises.get(cidade)!;
    if (cliente.status === 'ativo') {
      analise.clientes_ativos += 1;
    }
    analise.cupons_emitidos += cliente.total_cupons_recebidos || 0;
    analise.valor_total_compras += Number(cliente.total_valor_compras) || 0;
  });

  return Array.from(analises.values()).sort((a, b) => b.valor_total_compras - a.valor_total_compras);
};

const gerarRelatorioPDF = (dados: RelatorioLojista[], tipo: string) => {
  // Em uma implementação real, aqui usaríamos uma biblioteca como jsPDF
  const csvContent = [
    ['Lojista', 'Blocos', 'Investimento', 'Cupons Atribuídos', 'Cupons Disponíveis', 'Ticket Médio'],
    ...dados.map(item => [
      item.nome_loja,
      item.blocos_comprados.toString(),
      `R$ ${item.valor_investido.toFixed(2)}`,
      item.cupons_atribuidos.toString(),
      item.cupons_disponiveis.toString(),
      `R$ ${item.ticket_medio.toFixed(2)}`
    ])
  ].map(row => row.join(',')).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `relatorio-${tipo}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  a.click();
};

export const RelatoriosAnalises = () => {
  const [periodoAnalise, setPeriodoAnalise] = useState('mes-atual');

  const { data: relatorioLojistas = [] } = useQuery({
    queryKey: ['relatorio-lojistas'],
    queryFn: fetchRelatorioLojistas,
  });

  const { data: analiseRegional = [] } = useQuery({
    queryKey: ['analise-regional'],
    queryFn: fetchAnaliseRegional,
  });

  const top5Lojistas = relatorioLojistas.slice(0, 5);
  const top5Cidades = analiseRegional.slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      <div className="flex gap-2 justify-end">
        <Button 
          variant="outline" 
          onClick={() => gerarRelatorioPDF(relatorioLojistas, 'lojistas')}
        >
          <Download className="h-4 w-4 mr-2" />
          Exportar Relatório
        </Button>
      </div>

      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="regional">Análise Regional</TabsTrigger>
          <TabsTrigger value="tendencias">Tendências</TabsTrigger>
          <TabsTrigger value="executivo">Resumo Executivo</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Top 5 Lojistas por Faturamento
                </CardTitle>
                <CardDescription>
                  Ranking dos lojistas que mais geram receita
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {top5Lojistas.map((lojista, index) => (
                  <div key={lojista.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <div>
                        <div className="font-medium">{lojista.nome_loja}</div>
                        <div className="text-sm text-muted-foreground">{lojista.cidade}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">
                        R$ {lojista.valor_investido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {lojista.blocos_comprados} blocos
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Métricas de Performance
                </CardTitle>
                <CardDescription>
                  Indicadores chave de performance dos lojistas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {relatorioLojistas.reduce((sum, l) => sum + l.blocos_comprados, 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total de Blocos</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {relatorioLojistas.reduce((sum, l) => sum + l.cupons_atribuidos, 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Cupons Atribuídos</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      R$ {(relatorioLojistas.reduce((sum, l) => sum + l.ticket_medio, 0) / relatorioLojistas.length || 0).toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground">Ticket Médio</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {relatorioLojistas.filter(l => l.cupons_atribuidos > 0).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Lojistas Ativos</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Relatório Detalhado de Performance</CardTitle>
              <CardDescription>
                Performance completa de todos os lojistas cadastrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {relatorioLojistas.map((lojista) => (
                  <div key={lojista.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{lojista.nome_loja}</h3>
                        <p className="text-muted-foreground">{lojista.cidade}</p>
                      </div>
                      <Badge variant={lojista.cupons_atribuidos > 0 ? 'default' : 'secondary'}>
                        {lojista.cupons_atribuidos > 0 ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Blocos Comprados</div>
                        <div className="font-semibold">{lojista.blocos_comprados}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Investimento Total</div>
                        <div className="font-semibold">
                          R$ {lojista.valor_investido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Cupons Atribuídos</div>
                        <div className="font-semibold">{lojista.cupons_atribuidos}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Cupons Disponíveis</div>
                        <div className="font-semibold">{lojista.cupons_disponiveis}</div>
                      </div>
                    </div>

                    {lojista.ultima_compra && (
                      <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
                        Última compra: {format(new Date(lojista.ultima_compra), 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regional" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Análise Regional
              </CardTitle>
              <CardDescription>
                Análise por cidade dos clientes (origem das compras)
              </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                  {analiseRegional.map((regiao) => (
                    <div key={regiao.cidade} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-lg">{regiao.cidade}</h3>
                        <Badge variant="outline">
                          {regiao.clientes_ativos} cliente(s) ativo(s)
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="text-center p-3 bg-blue-50 rounded">
                          <div className="text-2xl font-bold text-blue-600">{regiao.cupons_emitidos}</div>
                          <div className="text-muted-foreground">Cupons Emitidos</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded">
                          <div className="text-2xl font-bold text-green-600">
                            R$ {regiao.valor_total_compras.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                          </div>
                          <div className="text-muted-foreground">Volume Total de Compras</div>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded">
                          <div className="text-2xl font-bold text-purple-600">
                            R$ {regiao.clientes_ativos > 0 ? (regiao.valor_total_compras / regiao.clientes_ativos).toFixed(0) : '0'}
                          </div>
                          <div className="text-muted-foreground">Média por Cliente</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tendencias" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Análise de Tendências
              </CardTitle>
              <CardDescription>
                Identificação de padrões e oportunidades de crescimento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Análise de Tendências</h3>
                <p>Esta funcionalidade será implementada em breve</p>
                <p className="text-sm">Incluirá análises temporais, sazonalidade e projeções</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="executivo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Resumo Executivo
              </CardTitle>
              <CardDescription>
                Visão consolidada para tomada de decisão
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 border rounded-lg">
                  <Store className="h-12 w-12 mx-auto text-blue-600 mb-4" />
                  <div className="text-3xl font-bold">{relatorioLojistas.length}</div>
                  <div className="text-muted-foreground">Lojistas Cadastrados</div>
                </div>
                <div className="text-center p-6 border rounded-lg">
                  <DollarSign className="h-12 w-12 mx-auto text-green-600 mb-4" />
                  <div className="text-3xl font-bold">
                    R$ {relatorioLojistas.reduce((sum, l) => sum + l.valor_investido, 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-muted-foreground">Faturamento Total</div>
                </div>
                <div className="text-center p-6 border rounded-lg">
                  <Users className="h-12 w-12 mx-auto text-purple-600 mb-4" />
                  <div className="text-3xl font-bold">
                    {relatorioLojistas.reduce((sum, l) => sum + l.cupons_atribuidos, 0).toLocaleString()}
                  </div>
                  <div className="text-muted-foreground">Cupons Atribuídos</div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Principais Insights</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="font-medium">Crescimento Sustentável</div>
                      <div className="text-sm text-muted-foreground">
                        O sistema apresenta {relatorioLojistas.filter(l => l.cupons_atribuidos > 0).length} lojistas ativos
                        de um total de {relatorioLojistas.length} cadastrados.
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                    <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium">Distribuição Regional</div>
                      <div className="text-sm text-muted-foreground">
                        Presença em {analiseRegional.length} cidades, com maior concentração em {top5Cidades[0]?.cidade || 'N/A'}.
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
                    <DollarSign className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <div className="font-medium">Performance Financeira</div>
                      <div className="text-sm text-muted-foreground">
                        Ticket médio de R$ {(relatorioLojistas.reduce((sum, l) => sum + l.ticket_medio, 0) / relatorioLojistas.length || 0).toFixed(2)} 
                        por cupom atribuído.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};