import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Download, AlertTriangle, Info, XCircle, CheckCircle } from 'lucide-react';

interface LogEntry {
  id: string;
  created_at: string;
  usuario_id: string | null;
  evento: string;
  descricao: string;
  nivel: string;
  contexto?: any;
  ip_address?: string;
  user_agent?: string;
}

const AuditoriaCompliance = () => {
  const [filtros, setFiltros] = useState({
    dataInicio: '',
    dataFim: '',
    tabela: '',
    nivel: '',
    busca: ''
  });

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['logs-auditoria', filtros],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('consultar_logs_auditoria', {
        p_data_inicio: filtros.dataInicio || null,
        p_data_fim: filtros.dataFim || null,
        p_nivel: filtros.nivel || null,
        p_tabela: filtros.tabela || null,
        p_busca: filtros.busca || null
      });

      if (error) {
        console.error('Erro ao buscar logs:', error);
        return [];
      }

      return (data as LogEntry[]) || [];
    },
    enabled: true
  });

  const { data: estatisticas } = useQuery({
    queryKey: ['estatisticas-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('logs_sistema')
        .select('nivel')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) return { info: 0, warning: 0, error: 0 };

      const stats = data.reduce((acc: any, log: any) => {
        acc[log.nivel] = (acc[log.nivel] || 0) + 1;
        return acc;
      }, {});

      return {
        info: stats.info || 0,
        warning: stats.warning || 0,
        error: stats.error || 0
      };
    }
  });

  const exportarRelatorio = () => {
    const exportData = logs.map((log: any) => [
      log.created_at,
      log.usuario_id || 'Sistema',
      log.evento,
      log.descricao,
      log.nivel,
      log.contexto ? JSON.stringify(log.contexto) : ''
    ]);

    const csvContent = [
      ['Data/Hora', 'Usuário', 'Evento', 'Descrição', 'Nível', 'Contexto'],
      ...exportData
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `auditoria-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getNivelBadge = (nivel: string) => {
    const icons = {
      info: <Info className="h-3 w-3" />,
      warning: <AlertTriangle className="h-3 w-3" />,
      error: <XCircle className="h-3 w-3" />,
      success: <CheckCircle className="h-3 w-3" />
    };

    const variants = {
      info: 'default',
      warning: 'warning',
      error: 'destructive',
      success: 'default'
    };

    return (
      <Badge variant={variants[nivel as keyof typeof variants] || 'default'} className="flex items-center gap-1">
        {icons[nivel as keyof typeof icons]}
        {nivel.toUpperCase()}
      </Badge>
    );
  };

  const logsFiltrados = logs.filter(log => 
    (!filtros.busca || log.descricao.toLowerCase().includes(filtros.busca.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Auditoria e Compliance</h2>
        <p className="text-muted-foreground">
          Monitoramento de atividades e conformidade do sistema
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Logs Info</CardTitle>
            <Info className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas?.info || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Logs Warning</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas?.warning || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Logs Error</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas?.error || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="text-sm font-medium">Data Início</label>
              <Input
                type="date"
                value={filtros.dataInicio}
                onChange={(e) => setFiltros({...filtros, dataInicio: e.target.value})}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Data Fim</label>
              <Input
                type="date"
                value={filtros.dataFim}
                onChange={(e) => setFiltros({...filtros, dataFim: e.target.value})}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Nível</label>
              <Select value={filtros.nivel} onValueChange={(value) => setFiltros({...filtros, nivel: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os níveis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Buscar</label>
              <Input
                placeholder="Buscar logs..."
                value={filtros.busca}
                onChange={(e) => setFiltros({...filtros, busca: e.target.value})}
              />
            </div>

            <div className="flex items-end">
              <Button onClick={exportarRelatorio} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Logs de Auditoria</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Carregando logs...</div>
          ) : logsFiltrados.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              Nenhum log encontrado com os filtros aplicados
            </div>
          ) : (
            <div className="space-y-2">
              {logsFiltrados.map((log: any) => (
                <div key={log.id} className="border rounded-lg p-4 hover:bg-muted/50">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        {getNivelBadge(log.nivel)}
                        <span className="text-sm text-muted-foreground">
                          {new Date(log.created_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="font-medium">{log.evento}</div>
                      <div className="text-sm text-muted-foreground">{log.descricao}</div>
                      {log.contexto && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-muted-foreground">Ver contexto</summary>
                          <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                            {JSON.stringify(log.contexto, null, 2)}
                          </pre>
                        </details>
                      )}
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

export default AuditoriaCompliance;