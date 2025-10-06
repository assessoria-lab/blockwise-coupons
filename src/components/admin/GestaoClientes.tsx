import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Search, Filter, Eye, Phone, Mail, Store, Receipt, Plus, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface Cliente {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  cidade: string;
  total_cupons_recebidos: number;
  total_valor_compras: number;
  status: string;
  created_at: string;
  data_primeiro_cupom: string;
}

const GestaoClientes = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [filtros, setFiltros] = useState({
    busca: '',
    cidade: '',
    status: ''
  });

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    telefone: '',
    cidade: '',
    valor_compra: '',
    lojista_id: '',
    tipo_cliente: 'varejo'
  });

  // Buscar lojas disponíveis
  const { data: lojistas } = useQuery({
    queryKey: ['lojistas-ativas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lojistas')
        .select(`
          id,
          nome_loja,
          cidade,
          shopping
        `)
        .eq('status', 'ativo');

      if (error) throw error;

      // Buscar cupons disponíveis para cada lojista
      const lojistasComCupons = await Promise.all(
        (data || []).map(async (lojista) => {
          const { data: blocos } = await supabase
            .from('blocos')
            .select('cupons_disponiveis')
            .eq('lojista_id', lojista.id)
            .eq('status', 'vendido');

          const cupons_disponiveis = blocos?.reduce((acc, bloco) => acc + (bloco.cupons_disponiveis || 0), 0) || 0;

          return {
            ...lojista,
            cupons_disponiveis
          };
        })
      );

      return lojistasComCupons.filter(l => l.cupons_disponiveis > 0);
    }
  });

  const { data: clientes, isLoading } = useQuery({
    queryKey: ['clientes', filtros],
    queryFn: async () => {
      let query = supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false });

      if (filtros.busca) {
        query = query.or(`nome.ilike.%${filtros.busca}%,cpf.ilike.%${filtros.busca}%`);
      }

      if (filtros.cidade) {
        query = query.eq('cidade', filtros.cidade);
      }

      if (filtros.status) {
        query = query.eq('status', filtros.status);
      }

      const { data, error } = await query.limit(100);
      if (error) throw new Error(error.message);
      return data as Cliente[];
    }
  });

  const { data: estatisticas } = useQuery({
    queryKey: ['estatisticas-clientes'],
    queryFn: async () => {
      // Buscar estatísticas dos clientes
      const { data: clientesData, error: clientesError } = await supabase
        .from('clientes')
        .select('total_cupons_recebidos, total_valor_compras, status');

      if (clientesError) throw clientesError;

      // Buscar total de cupons atribuídos e lojas únicas
      const { data: cuponsData, error: cuponsError } = await supabase
        .from('cupons')
        .select(`
          id,
          lojista_id,
          lojistas(nome_loja)
        `)
        .eq('status', 'atribuido')
        .not('cliente_id', 'is', null);

      if (cuponsError) throw cuponsError;

      // Calcular métricas
      const clientesStats = clientesData?.reduce((acc, cliente) => {
        acc.total_clientes++;
        acc.total_cupons_clientes += cliente.total_cupons_recebidos || 0;
        acc.total_valor += Number(cliente.total_valor_compras) || 0;
        acc.ativos += cliente.status === 'ativo' ? 1 : 0;
        return acc;
      }, { 
        total_clientes: 0, 
        total_cupons_clientes: 0, 
        total_valor: 0, 
        ativos: 0 
      }) || { 
        total_clientes: 0, 
        total_cupons_clientes: 0, 
        total_valor: 0, 
        ativos: 0 
      };

      // Calcular cupons totais atribuídos
      const total_cupons_atribuidos = cuponsData?.length || 0;

      // Calcular lojas únicas que têm cupons atribuídos a clientes
      const lojasUnicas = new Set();
      cuponsData?.forEach(cupom => {
        if (cupom.lojista_id) {
          lojasUnicas.add(cupom.lojista_id);
        }
      });

      return {
        ...clientesStats,
        total_cupons_atribuidos,
        total_lojas: lojasUnicas.size
      };
    }
  });

  // Buscar detalhes completos do cliente selecionado
  const { data: clienteDetalhes, isLoading: loadingDetalhes } = useQuery({
    queryKey: ['cliente-detalhes', selectedClientId],
    queryFn: async () => {
      if (!selectedClientId) return null;
      
      // Buscar dados básicos do cliente
      const { data: cliente, error: clienteError } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', selectedClientId)
        .single();

      if (clienteError) throw clienteError;

      // Buscar cupons do cliente com dados da loja
      const { data: cupons, error: cuponsError } = await supabase
        .from('cupons')
        .select(`
          id,
          numero_formatado,
          valor_compra,
          data_atribuicao,
          status,
          lojistas!inner(
            nome_loja,
            cidade,
            shopping
          )
        `)
        .eq('cliente_id', selectedClientId)
        .order('data_atribuicao', { ascending: false });

      if (cuponsError) throw cuponsError;

      // Buscar prêmios ganhos
      const { data: premios, error: premiosError } = await supabase
        .from('ganhadores_sorteios')
        .select(`
          id,
          premio,
          valor_premio,
          data_sorteio,
          tipo_sorteio,
          numero_cupom,
          observacoes
        `)
        .eq('cliente_id', selectedClientId)
        .order('data_sorteio', { ascending: false });

      if (premiosError) throw premiosError;

      return {
        cliente,
        cupons,
        premios
      };
    },
    enabled: !!selectedClientId
  });

  // Mutation para atribuir cupons
  const atribuirCuponsMutation = useMutation({
    mutationFn: async (dados: typeof formData) => {
      // First, create or find the client
      const cpfLimpo = dados.cpf.replace(/\D/g, '');
      
      // Check if client exists
      let { data: clienteExistente, error: findError } = await supabase
        .from('clientes')
        .select('id')
        .eq('cpf', cpfLimpo)
        .maybeSingle();
      
      let clienteId: string;
      
      if (clienteExistente) {
        clienteId = clienteExistente.id;
      } else {
        // Create new client
        const { data: novoCliente, error: createError } = await supabase
          .from('clientes')
          .insert({
            nome: dados.nome,
            cpf: cpfLimpo,
            telefone: dados.telefone,
            cidade: dados.cidade
          })
          .select('id')
          .single();
        
        if (createError) throw createError;
        clienteId = novoCliente.id;
      }
      
      // Now assign coupons using the correct parameters
      const { data, error } = await supabase.rpc('atribuir_cupons_para_cliente', {
        p_lojista_id: dados.lojista_id,
        p_cliente_cpf: cpfLimpo,
        p_cliente_nome: dados.nome,
        p_cliente_telefone: dados.telefone || '',
        p_valor_compra: parseFloat(dados.valor_compra)
      });

      if (error) throw error;

      const result = data as any;
      if (!result.sucesso) {
        throw new Error(result.mensagem);
      }

      return result;
    },
    onSuccess: (data) => {
      toast({
        title: "Cupons atribuídos com sucesso!",
        description: data.mensagem,
      });
      
      setFormData({
        nome: '',
        cpf: '',
        telefone: '',
        cidade: '',
        valor_compra: '',
        lojista_id: '',
        tipo_cliente: 'varejo'
      });
      
      setShowAddDialog(false);
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['estatisticas-clientes'] });
      queryClient.invalidateQueries({ queryKey: ['lojistas-ativas'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atribuir cupons",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.cpf || !formData.valor_compra || !formData.lojista_id) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome, CPF, valor da compra e selecione uma loja.",
        variant: "destructive",
      });
      return;
    }

    const valorCompra = parseFloat(formData.valor_compra);
    if (valorCompra < 100) {
      toast({
        title: "Valor insuficiente",
        description: "O valor mínimo para gerar cupom é R$ 100,00.",
        variant: "destructive",
      });
      return;
    }

    atribuirCuponsMutation.mutate(formData);
  };

  const cuponsCalculados = formData.valor_compra ? Math.floor(parseFloat(formData.valor_compra) / 100) : 0;
  const lojistaSelecionada = lojistas?.find(l => l.id === formData.lojista_id);

  const formatCPF = (cpf: string) => {
    return cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') || '';
  };

  const formatPhone = (phone: string) => {
    return phone?.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3') || '';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Clientes</p>
                <p className="text-2xl font-bold">{estatisticas?.total_clientes || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {estatisticas?.ativos || 0} ativos
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Cupons</p>
                <p className="text-2xl font-bold text-green-600">{estatisticas?.total_cupons_atribuidos || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Cupons atribuídos
                </p>
              </div>
              <Receipt className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Lojas</p>
                <p className="text-2xl font-bold text-purple-600">{estatisticas?.total_lojas || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Lojas participantes
                </p>
              </div>
              <Store className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métricas Secundárias */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Volume Total de Compras</p>
                <p className="text-2xl font-bold text-orange-600">
                  R$ {(estatisticas?.total_valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Total em vendas geradas
                </p>
              </div>
              <Badge variant="secondary" className="text-orange-600">Vendas</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Média por Cliente</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {estatisticas?.total_clientes ? 
                    (estatisticas.total_cupons_atribuidos / estatisticas.total_clientes).toFixed(1) : 
                    '0.0'
                  }
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Cupons por cliente
                </p>
              </div>
              <Badge variant="outline" className="text-indigo-600">Média</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botão Adicionar Cliente/Compra */}
      <div className="flex justify-end">
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Cliente/Compra
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Adicionar Cliente/Compra Manual
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome do Cliente *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="Nome completo"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => setFormData(prev => ({ ...prev, cpf: e.target.value }))}
                    placeholder="000.000.000-00"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                    placeholder="(62) 99999-9999"
                  />
                </div>
                <div>
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={formData.cidade}
                    onChange={(e) => setFormData(prev => ({ ...prev, cidade: e.target.value }))}
                    placeholder="Cidade do cliente"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="valor_compra">Valor da Compra (R$) *</Label>
                  <Input
                    id="valor_compra"
                    type="number"
                    step="0.01"
                    min="100"
                    value={formData.valor_compra}
                    onChange={(e) => setFormData(prev => ({ ...prev, valor_compra: e.target.value }))}
                    placeholder="100.00"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="tipo_cliente">Tipo de Cliente</Label>
                  <Select value={formData.tipo_cliente} onValueChange={(value) => setFormData(prev => ({ ...prev, tipo_cliente: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="varejo">Varejo</SelectItem>
                      <SelectItem value="atacado">Atacado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="lojista">Loja *</Label>
                <Select value={formData.lojista_id} onValueChange={(value) => setFormData(prev => ({ ...prev, lojista_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma loja" />
                  </SelectTrigger>
                  <SelectContent>
                    {lojistas?.map((lojista) => (
                      <SelectItem key={lojista.id} value={lojista.id}>
                        {lojista.nome_loja} - {lojista.cidade} ({lojista.cupons_disponiveis} cupons)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {cuponsCalculados > 0 && lojistaSelecionada && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        Cupons a serem gerados: <span className="text-primary font-bold">{cuponsCalculados}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Loja selecionada tem {lojistaSelecionada.cupons_disponiveis} cupons disponíveis
                      </p>
                    </div>
                    {cuponsCalculados > lojistaSelecionada.cupons_disponiveis && (
                      <Badge variant="destructive">Saldo Insuficiente</Badge>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddDialog(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={atribuirCuponsMutation.isPending || cuponsCalculados === 0 || (lojistaSelecionada && cuponsCalculados > lojistaSelecionada.cupons_disponiveis)}
                  className="flex-1"
                >
                  {atribuirCuponsMutation.isPending ? 'Processando...' : 'Atribuir Cupons'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou CPF..."
                value={filtros.busca}
                onChange={(e) => setFiltros(prev => ({ ...prev, busca: e.target.value }))}
                className="pl-8"
              />
            </div>
            <Input
              placeholder="Filtrar por cidade..."
              value={filtros.cidade}
              onChange={(e) => setFiltros(prev => ({ ...prev, cidade: e.target.value }))}
            />
            <select
              value={filtros.status}
              onChange={(e) => setFiltros(prev => ({ ...prev, status: e.target.value }))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            >
              <option value="">Todos os status</option>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
            <Button variant="outline" onClick={() => setFiltros({ busca: '', cidade: '', status: '' })}>
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Clientes */}
      <Card>
        <CardHeader>
          <CardTitle>Clientes ({clientes?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando clientes...</div>
          ) : !clientes || clientes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum cliente encontrado para os filtros selecionados.
            </div>
          ) : (
            <div className="space-y-4">
              {clientes.map((cliente) => (
                <div
                  key={cliente.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{cliente.nome}</h3>
                        <Badge 
                          variant={cliente.status === 'ativo' ? 'default' : 'secondary'}
                        >
                          {cliente.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                          <p><strong>CPF:</strong> {formatCPF(cliente.cpf)}</p>
                          {cliente.telefone && (
                            <p className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {formatPhone(cliente.telefone)}
                            </p>
                          )}
                          {cliente.email && (
                            <p className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {cliente.email}
                            </p>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          <p><strong>Cidade:</strong> {cliente.cidade || 'Não informado'}</p>
                          <p><strong>Cupons Recebidos:</strong> {cliente.total_cupons_recebidos}</p>
                          <p><strong>Volume de Compras:</strong> R$ {Number(cliente.total_valor_compras || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <span>Cadastrado em: {format(new Date(cliente.created_at), 'dd/MM/yyyy', { locale: ptBR })}</span>
                        {cliente.data_primeiro_cupom && (
                          <span>Primeiro cupom: {format(new Date(cliente.data_primeiro_cupom), 'dd/MM/yyyy', { locale: ptBR })}</span>
                        )}
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSelectedClientId(cliente.id)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalhes
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes do Cliente */}
      <Dialog open={!!selectedClientId} onOpenChange={(open) => !open && setSelectedClientId(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Detalhes do Cliente
            </DialogTitle>
          </DialogHeader>
          
          {loadingDetalhes ? (
            <div className="text-center py-8">Carregando detalhes...</div>
          ) : clienteDetalhes ? (
            <div className="space-y-6">
              {/* Informações Básicas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informações Pessoais</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p><strong>Nome:</strong> {clienteDetalhes.cliente.nome}</p>
                      <p><strong>CPF:</strong> {formatCPF(clienteDetalhes.cliente.cpf)}</p>
                      <p><strong>Telefone:</strong> {clienteDetalhes.cliente.telefone ? formatPhone(clienteDetalhes.cliente.telefone) : 'Não informado'}</p>
                    </div>
                    <div>
                      <p><strong>Email:</strong> {clienteDetalhes.cliente.email || 'Não informado'}</p>
                      <p><strong>Cidade:</strong> {clienteDetalhes.cliente.cidade || 'Não informado'}</p>
                      <p><strong>Status:</strong> 
                        <Badge className="ml-2" variant={clienteDetalhes.cliente.status === 'ativo' ? 'default' : 'secondary'}>
                          {clienteDetalhes.cliente.status}
                        </Badge>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Resumo de Atividade */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{clienteDetalhes.cupons?.length || 0}</p>
                      <p className="text-sm text-muted-foreground">Cupons Totais</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {new Set(clienteDetalhes.cupons?.map(c => c.lojistas?.nome_loja)).size || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Lojas Diferentes</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{clienteDetalhes.premios?.length || 0}</p>
                      <p className="text-sm text-muted-foreground">Prêmios Ganhos</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Cupons do Cliente */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Cupons do Cliente ({clienteDetalhes.cupons?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                  {!clienteDetalhes.cupons || clienteDetalhes.cupons.length === 0 ? (
                    <p className="text-center py-4 text-muted-foreground">Nenhum cupom encontrado</p>
                  ) : (
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {clienteDetalhes.cupons.map((cupom: any) => (
                        <div key={cupom.id} className="border rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                                  {cupom.numero_formatado}
                                </code>
                                <Badge variant="outline">{cupom.status}</Badge>
                              </div>
                              <p className="text-sm">
                                <strong>Loja:</strong> {cupom.lojistas?.nome_loja}
                              </p>
                              <p className="text-sm">
                                <strong>Cidade:</strong> {cupom.lojistas?.cidade}
                                {cupom.lojistas?.shopping && ` - ${cupom.lojistas.shopping}`}
                              </p>
                            </div>
                            <div className="text-right text-sm">
                              <p className="font-semibold">
                                R$ {Number(cupom.valor_compra || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                              <p className="text-muted-foreground">
                                {format(new Date(cupom.data_atribuicao), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Prêmios Ganhos */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Prêmios Ganhos ({clienteDetalhes.premios?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                  {!clienteDetalhes.premios || clienteDetalhes.premios.length === 0 ? (
                    <p className="text-center py-4 text-muted-foreground">Nenhum prêmio ganho ainda</p>
                  ) : (
                    <div className="space-y-3">
                      {clienteDetalhes.premios.map((premio: any) => (
                        <div key={premio.id} className="border rounded-lg p-3 bg-green-50">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="default" className="bg-green-600">
                                  {premio.tipo_sorteio}
                                </Badge>
                              </div>
                              <p className="text-sm font-semibold">{premio.premio}</p>
                              <p className="text-sm">
                                <strong>Cupom:</strong> {premio.numero_cupom}
                              </p>
                              {premio.observacoes && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {premio.observacoes}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-green-600">
                                R$ {Number(premio.valor_premio || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(premio.data_sorteio), 'dd/MM/yyyy', { locale: ptBR })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Resumo por Loja */}
              {clienteDetalhes.cupons && clienteDetalhes.cupons.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Resumo por Loja</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(
                        clienteDetalhes.cupons.reduce((acc: any, cupom: any) => {
                          const loja = cupom.lojistas?.nome_loja || 'Loja não identificada';
                          if (!acc[loja]) {
                            acc[loja] = {
                              quantidade: 0,
                              blocos: new Set(),
                              valores_por_bloco: {},
                              cidade: cupom.lojistas?.cidade || '',
                              shopping: cupom.lojistas?.shopping || ''
                            };
                          }
                          acc[loja].quantidade += 1;
                          acc[loja].blocos.add(cupom.bloco_id);
                          // Armazena o valor apenas uma vez por bloco
                          if (!acc[loja].valores_por_bloco[cupom.bloco_id]) {
                            acc[loja].valores_por_bloco[cupom.bloco_id] = Number(cupom.valor_compra || 0);
                          }
                          return acc;
                        }, {})
                      ).map(([loja, dados]: [string, any]) => {
                        // Soma os valores únicos de cada bloco
                        const valor_total = Object.values(dados.valores_por_bloco as Record<string, number>).reduce((sum, val) => sum + val, 0);
                        return (
                          <div key={loja} className="flex justify-between items-center p-2 bg-muted rounded">
                            <div>
                              <p className="font-medium">{loja}</p>
                              <p className="text-sm text-muted-foreground">
                                {dados.cidade}{dados.shopping && ` - ${dados.shopping}`}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{dados.quantidade} cupons</p>
                              <p className="text-sm text-muted-foreground">
                                R$ {valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GestaoClientes;