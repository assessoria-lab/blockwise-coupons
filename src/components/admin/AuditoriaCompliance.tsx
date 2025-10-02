import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Download, Shield, AlertTriangle, Info, Filter, Search } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface LogEntry {
  id: string;
  created_at: string;
  usuario_id: string | null;
  evento: string;
  descricao: string;
  dados_contexto: any;
  nivel: string;
  ip_address: unknown;
  user_agent: string | null;
  usuario_email?: string;
  lojista_id?: string;
}

const AuditoriaCompliance = () => {
  const [filtros, setFiltros] = useState({
    dataInicio: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    dataFim: format(new Date(), 'yyyy-MM-dd'),
    tabela: 'all',
    nivel: 'all',
    busca: ''
  });

  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const { data: logsAuditoria, isLoading, refetch } = useQuery({
    queryKey: ['logs-auditoria', filtros],
    queryFn: async () => {
      // Query logs_sistema directly since consultar_logs_auditoria doesn't exist
      let query = supabase
        .from('logs_sistema')
        .select('*')
        .order('created_at', { ascending: false });

      if (filtros.dataInicio) {
        query = query.gte('created_at', `${filtros.dataInicio}T00:00:00`);
      }
      if (filtros.dataFim) {
        query = query.lte('created_at', `${filtros.dataFim}T23:59:59`);
      }

      const { data, error } = await query.limit(500);
      if (error) throw new Error(error.message);
      return data as LogEntry[];
    }
  });

  const { data: estatisticas } = useQuery({
    queryKey: ['estatisticas-auditoria', filtros.dataInicio, filtros.dataFim],
    queryFn: async () => {
      let query = supabase
        .from('logs_sistema')
        .select('nivel', { count: 'exact' });

      if (filtros.dataInicio) {
        query = query.gte('created_at', `${filtros.dataInicio}T00:00:00`);
      }
      if (filtros.dataFim) {
        query = query.lte('created_at', `${filtros.dataFim}T23:59:59`);
      }

      const { data, error, count } = await query;
      if (error) throw new Error(error.message);

      const stats = data?.reduce((acc: any, item: any) => {
        acc[item.nivel] = (acc[item.nivel] || 0) + 1;
        return acc;
      }, {}) || {};

      return { ...stats, total: count || 0 };
    }
  });

  const exportarRelatorio = async () => {
    try {
      let query = supabase
        .from('logs_sistema')
        .select('*')
        .order('created_at', { ascending: false });

      if (filtros.dataInicio) {
        query = query.gte('created_at', `${filtros.dataInicio}T00:00:00`);
      }
      if (filtros.dataFim) {
        query = query.lte('created_at', `${filtros.dataFim}T23:59:59`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Converte para CSV
      const csvHeaders = ['Data/Hora', 'Usuário', 'Evento', 'Descrição', 'Nível', 'IP', 'User Agent'];
      const csvRows = data?.map((log: LogEntry) => [
        new Date(log.created_at).toLocaleString('pt-BR'),
        log.usuario_email || log.usuario_id || 'N/A',
        log.evento,
        log.descricao,
        log.nivel,
        log.ip_address || 'N/A',
        log.user_agent || 'N/A'
      ]) || [];

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(';'))
        .join('\n');

      // Download do arquivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `auditoria_${filtros.dataInicio}_${filtros.dataFim}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast.success('Relatório exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast.error('Erro ao exportar relatório');
    }
  };

  const getNivelBadge = (nivel: string) => {
    const configs = {
      error: { variant: 'destructive' as const, icon: AlertTriangle },
      warning: { variant: 'secondary' as const, icon: AlertTriangle },
      info: { variant: 'outline' as const, icon: Info }
    };

    const config = configs[nivel as keyof typeof configs] || configs.info;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {nivel.toUpperCase()}
      </Badge>
    );
  };

  const filteredLogs = logsAuditoria?.filter(log => 
    (!filtros.nivel || filtros.nivel === 'all') || log.nivel === filtros.nivel
  ).filter(log =>
    !filtros.busca || 
    log.evento.toLowerCase().includes(filtros.busca.toLowerCase()) ||
    log.descricao.toLowerCase().includes(filtros.busca.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Auditoria & Compliance</h1>
          <p className="text-muted-foreground">
            Monitoramento de ações administrativas e conformidade do sistema
          </p>
        </div>
        <Shield className="h-8 w-8 text-primary" />
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Logs</p>
                <p className="text-2xl font-bold">{estatisticas?.total || 0}</p>
              </div>
              <Info className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Informativos</p>
                <p className="text-2xl font-bold text-blue-600">{estatisticas?.info || 0}</p>
              </div>
              <Info className="h-4 w-4 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avisos</p>
                <p className="text-2xl font-bold text-yellow-600">{estatisticas?.warning || 0}</p>
              </div>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Erros</p>
                <p className="text-2xl font-bold text-red-600">{estatisticas?.error || 0}</p>
              </div>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Auditoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <label className="text-sm font-medium">Data Início</label>
              <Input
                type="date"
                value={filtros.dataInicio}
                onChange={(e) => setFiltros(prev => ({ ...prev, dataInicio: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Data Fim</label>
              <Input
                type="date"
                value={filtros.dataFim}
                onChange={(e) => setFiltros(prev => ({ ...prev, dataFim: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Tabela</label>
              <Select value={filtros.tabela} onValueChange={(value) => setFiltros(prev => ({ ...prev, tabela: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="lojistas">Lojistas</SelectItem>
                  <SelectItem value="blocos">Blocos</SelectItem>
                  <SelectItem value="cupons">Cupons</SelectItem>
                  <SelectItem value="pagamentos">Pagamentos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Nível</label>
              <Select value={filtros.nivel} onValueChange={(value) => setFiltros(prev => ({ ...prev, nivel: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar logs..."
                  value={filtros.busca}
                  onChange={(e) => setFiltros(prev => ({ ...prev, busca: e.target.value }))}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={() => refetch()} variant="outline">
                Atualizar
              </Button>
              <Button onClick={exportarRelatorio} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Exportar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Logs de Auditoria ({filteredLogs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">Carregando logs...</div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum log encontrado para os filtros selecionados.
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getNivelBadge(log.nivel)}
                        <Badge variant="outline">{log.evento}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                        </span>
                      </div>
                      <p className="font-medium mb-1">{log.descricao}</p>
                      <div className="text-sm text-muted-foreground space-y-1">
                        {log.usuario_email && (
                          <p>Usuário: {log.usuario_email}</p>
                        )}
                        {log.ip_address && (
                          <p>IP: {String(log.ip_address)}</p>
                        )}
                      </div>
                    </div>
                    {log.dados_contexto && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                      >
                        {expandedLog === log.id ? 'Ocultar' : 'Detalhes'}
                      </Button>
                    )}
                  </div>
                  
                  {expandedLog === log.id && log.dados_contexto && (
                    <div className="mt-4 p-3 bg-muted rounded border">
                      <h4 className="font-medium mb-2">Dados Contextuais:</h4>
                      <pre className="text-xs overflow-auto max-h-40">
                        {JSON.stringify(log.dados_contexto, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditoriaCompliance;