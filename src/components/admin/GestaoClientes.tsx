import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Search, Filter, Eye, Phone, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  const [filtros, setFiltros] = useState({
    busca: '',
    cidade: '',
    status: ''
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
      const { data, error } = await supabase
        .from('clientes')
        .select('total_cupons_recebidos, total_valor_compras, status');

      if (error) throw error;

      const stats = data?.reduce((acc, cliente) => {
        acc.total_clientes++;
        acc.total_cupons += cliente.total_cupons_recebidos || 0;
        acc.total_valor += Number(cliente.total_valor_compras) || 0;
        acc.ativos += cliente.status === 'ativo' ? 1 : 0;
        return acc;
      }, { 
        total_clientes: 0, 
        total_cupons: 0, 
        total_valor: 0, 
        ativos: 0 
      }) || { 
        total_clientes: 0, 
        total_cupons: 0, 
        total_valor: 0, 
        ativos: 0 
      };

      return stats;
    }
  });

  const formatCPF = (cpf: string) => {
    return cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') || '';
  };

  const formatPhone = (phone: string) => {
    return phone?.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3') || '';
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Clientes</h1>
          <p className="text-muted-foreground">
            Gerencie e monitore todos os clientes do sistema
          </p>
        </div>
        <Users className="h-8 w-8 text-primary" />
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Clientes</p>
                <p className="text-2xl font-bold">{estatisticas?.total_clientes || 0}</p>
              </div>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Clientes Ativos</p>
                <p className="text-2xl font-bold text-green-600">{estatisticas?.ativos || 0}</p>
              </div>
              <Badge variant="secondary" className="text-green-600">Ativo</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Cupons</p>
                <p className="text-2xl font-bold text-blue-600">{estatisticas?.total_cupons || 0}</p>
              </div>
              <Badge variant="outline">{estatisticas?.total_cupons || 0} cupons</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Volume Total</p>
                <p className="text-2xl font-bold text-purple-600">
                  R$ {(estatisticas?.total_valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <Badge variant="secondary" className="text-purple-600">Vendas</Badge>
            </div>
          </CardContent>
        </Card>
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
                    
                    <Button variant="outline" size="sm">
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
    </div>
  );
};

export default GestaoClientes;