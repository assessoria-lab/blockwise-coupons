import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Search, Filter, Download, Clock, User, Store, MapPin, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HistoricoCupom {
  id: string;
  numero_cupom: string;
  status: string;
  valor_compra: number;
  data_atribuicao: string;
  cliente: {
    nome: string;
    cpf: string;
    telefone: string;
  };
  lojista: {
    nome_loja: string;
    cidade: string;
    responsavel_nome: string;
  };
  bloco: {
    numero_bloco: number;
  };
}

interface Filtros {
  periodo: string;
  dataInicio: string;
  dataFim: string;
  cidade: string;
  lojista: string;
  status: string;
  valorMin: string;
  valorMax: string;
}

const fetchHistoricoCupons = async (filtros: Filtros) => {
  let query = supabase
    .from('cupons')
    .select(`
      id,
      numero_cupom,
      status,
      valor_compra,
      data_atribuicao,
      clientes!inner(nome, cpf, telefone),
      lojistas!inner(nome_loja, cidade, responsavel_nome),
      blocos!inner(numero_bloco)
    `)
    .not('data_atribuicao', 'is', null)
    .order('data_atribuicao', { ascending: false });

  // Aplicar filtros
  if (filtros.dataInicio && filtros.dataFim) {
    query = query.gte('data_atribuicao', filtros.dataInicio)
                 .lte('data_atribuicao', filtros.dataFim);
  }

  if (filtros.cidade && filtros.cidade !== 'todas') {
    query = query.eq('lojistas.cidade', filtros.cidade);
  }

  if (filtros.status && filtros.status !== 'todos') {
    query = query.eq('status', filtros.status);
  }

  if (filtros.valorMin) {
    query = query.gte('valor_compra', parseFloat(filtros.valorMin));
  }

  if (filtros.valorMax) {
    query = query.lte('valor_compra', parseFloat(filtros.valorMax));
  }

  const { data, error } = await query.limit(1000);
  if (error) throw new Error(error.message);

  return (data || []).map(item => ({
    id: item.id,
    numero_cupom: item.numero_cupom,
    status: item.status,
    valor_compra: item.valor_compra || 0,
    data_atribuicao: item.data_atribuicao,
    cliente: {
      nome: (item.clientes as any)?.nome || 'N/A',
      cpf: (item.clientes as any)?.cpf || 'N/A',
      telefone: (item.clientes as any)?.telefone || 'N/A',
    },
    lojista: {
      nome_loja: (item.lojistas as any)?.nome_loja || 'N/A',
      cidade: (item.lojistas as any)?.cidade || 'N/A',
      responsavel_nome: (item.lojistas as any)?.responsavel_nome || 'N/A',
    },
    bloco: {
      numero_bloco: (item.blocos as any)?.numero_bloco || 0,
    }
  }));
};

const fetchEstatisticas = async (filtros: Filtros) => {
  const { data: cupons } = await supabase
    .from('cupons')
    .select('valor_compra, status, data_atribuicao')
    .not('data_atribuicao', 'is', null);

  const totalCupons = cupons?.length || 0;
  const cuponsAtivos = cupons?.filter(c => c.status === 'atribuido').length || 0;
  const cuponsUsados = cupons?.filter(c => c.status === 'usado').length || 0;
  const valorTotal = cupons?.reduce((sum, c) => sum + (c.valor_compra || 0), 0) || 0;

  return {
    totalCupons,
    cuponsAtivos,
    cuponsUsados,
    valorTotal,
    ticketMedio: totalCupons > 0 ? valorTotal / totalCupons : 0
  };
};

export const HistoricoCupons = () => {
  const [filtros, setFiltros] = useState<Filtros>({
    periodo: 'ultimos-7-dias',
    dataInicio: '',
    dataFim: '',
    cidade: 'todas',
    lojista: 'todos',
    status: 'todos',
    valorMin: '',
    valorMax: ''
  });

  const [busca, setBusca] = useState('');

  const { data: historico = [], isLoading } = useQuery({
    queryKey: ['historico-cupons', filtros],
    queryFn: () => fetchHistoricoCupons(filtros),
  });

  const { data: estatisticas } = useQuery({
    queryKey: ['estatisticas-cupons', filtros],
    queryFn: () => fetchEstatisticas(filtros),
  });

  const dadosFiltrados = useMemo(() => {
    if (!busca) return historico;
    
    return historico.filter(item =>
      item.numero_cupom.toString().toLowerCase().includes(busca.toLowerCase()) ||
      item.cliente.nome.toLowerCase().includes(busca.toLowerCase()) ||
      item.cliente.cpf.includes(busca) ||
      item.lojista.nome_loja.toLowerCase().includes(busca.toLowerCase())
    );
  }, [historico, busca]);

  const exportarDados = () => {
    const csv = [
      ['Data', 'Cupom', 'Cliente', 'CPF', 'Lojista', 'Cidade', 'Valor', 'Status'],
      ...dadosFiltrados.map(item => [
        format(new Date(item.data_atribuicao), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
        item.numero_cupom,
        item.cliente.nome,
        item.cliente.cpf,
        item.lojista.nome_loja,
        item.lojista.cidade,
        `R$ ${item.valor_compra.toFixed(2)}`,
        item.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historico-cupons-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      {estatisticas && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Cupons</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estatisticas.totalCupons.toLocaleString()}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Cupons Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{estatisticas.cuponsAtivos.toLocaleString()}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Cupons Utilizados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{estatisticas.cuponsUsados.toLocaleString()}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {estatisticas.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {estatisticas.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Histórico de Cupons
              </CardTitle>
              <CardDescription>
                Acompanhe todas as emissões de cupons com filtros avançados e auditoria completa
              </CardDescription>
            </div>
            <Button onClick={exportarDados} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="filtros" className="space-y-4">
            <TabsList>
              <TabsTrigger value="filtros">Filtros</TabsTrigger>
              <TabsTrigger value="historico">Histórico</TabsTrigger>
            </TabsList>

            <TabsContent value="filtros" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Período</label>
                  <Select value={filtros.periodo} onValueChange={(value) => setFiltros(prev => ({ ...prev, periodo: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hoje">Hoje</SelectItem>
                      <SelectItem value="ontem">Ontem</SelectItem>
                      <SelectItem value="ultimos-7-dias">Últimos 7 dias</SelectItem>
                      <SelectItem value="ultimos-30-dias">Últimos 30 dias</SelectItem>
                      <SelectItem value="personalizado">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={filtros.status} onValueChange={(value) => setFiltros(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="disponivel">Disponível</SelectItem>
                      <SelectItem value="atribuido">Atribuído</SelectItem>
                      <SelectItem value="usado">Usado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Valor Mínimo</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={filtros.valorMin}
                    onChange={(e) => setFiltros(prev => ({ ...prev, valorMin: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Valor Máximo</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={filtros.valorMax}
                    onChange={(e) => setFiltros(prev => ({ ...prev, valorMax: e.target.value }))}
                  />
                </div>
              </div>

              {filtros.periodo === 'personalizado' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Data Início</label>
                    <Input
                      type="date"
                      value={filtros.dataInicio}
                      onChange={(e) => setFiltros(prev => ({ ...prev, dataInicio: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Data Fim</label>
                    <Input
                      type="date"
                      value={filtros.dataFim}
                      onChange={(e) => setFiltros(prev => ({ ...prev, dataFim: e.target.value }))}
                    />
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="historico" className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por cupom, cliente, CPF ou lojista..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Badge variant="outline" className="whitespace-nowrap">
                  {dadosFiltrados.length} registros
                </Badge>
              </div>

              {isLoading ? (
                <div className="text-center py-8">Carregando histórico...</div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Cupom</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Lojista</TableHead>
                        <TableHead>Cidade</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dadosFiltrados.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono text-sm">
                            {format(new Date(item.data_atribuicao), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </TableCell>
                          <TableCell className="font-mono">{item.numero_cupom}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.cliente.nome}</div>
                              <div className="text-sm text-muted-foreground">{item.cliente.cpf}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.lojista.nome_loja}</div>
                              <div className="text-sm text-muted-foreground">{item.lojista.responsavel_nome}</div>
                            </div>
                          </TableCell>
                          <TableCell>{item.lojista.cidade}</TableCell>
                          <TableCell className="font-mono">
                            R$ {item.valor_compra.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                item.status === 'atribuido' ? 'default' : 
                                item.status === 'usado' ? 'secondary' : 'outline'
                              }
                            >
                              {item.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};