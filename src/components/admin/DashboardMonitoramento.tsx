import { useMonitoramentoRealTime } from '@/hooks/useMonitoramentoRealTime';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  AlertTriangle, 
  Users, 
  Package, 
  TrendingUp, 
  DollarSign,
  X,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';

const DashboardMonitoramento = () => {
  const { 
    alertas, 
    metricas, 
    isConnected, 
    marcarAlertaComoLido,
    refetchMetricas 
  } = useMonitoramentoRealTime();

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const getAlertIcon = (nivel: string) => {
    return nivel === 'error' ? '🚨' : '⚠️';
  };

  const getAlertColor = (nivel: string) => {
    return nivel === 'error' 
      ? 'border-red-200 bg-red-50 text-red-800'
      : 'border-yellow-200 bg-yellow-50 text-yellow-800';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Status e Controles */}
      <div className="flex justify-end gap-4">
        <Badge 
          variant={isConnected ? "default" : "destructive"} 
          className="flex items-center gap-2"
        >
          {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          {isConnected ? 'Conectado' : 'Desconectado'}
        </Badge>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refetchMetricas}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Métricas em Tempo Real */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Métricas do Sistema
                {isConnected && (
                  <div className="ml-auto flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs text-green-600">Online</span>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {metricas ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <Users className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                    <div className="text-2xl font-bold text-blue-600">
                      {metricas.lojistas_ativos}
                    </div>
                    <div className="text-sm text-muted-foreground">Lojistas Ativos</div>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100">
                    <Package className="h-6 w-6 mx-auto mb-2 text-green-600" />
                    <div className="text-2xl font-bold text-green-600">
                      {metricas.cupons_disponiveis.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Cupons Disponíveis</div>
                  </div>
                  
                  <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                    <TrendingUp className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
                    <div className="text-2xl font-bold text-yellow-600">
                      {metricas.cupons_atribuidos_hoje}
                    </div>
                    <div className="text-sm text-muted-foreground">Atribuídos Hoje</div>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-100">
                    <DollarSign className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                    <div className="text-xl font-bold text-purple-600">
                      {formatCurrency(metricas.valor_gerado_hoje)}
                    </div>
                    <div className="text-sm text-muted-foreground">Valor Hoje</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="animate-pulse">Carregando métricas...</div>
                </div>
              )}
              
              {metricas && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Blocos Disponíveis:</span>
                      <span className="font-medium">{metricas.blocos_pool}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Blocos Vendidos Hoje:</span>
                      <span className="font-medium">{metricas.blocos_vendidos_hoje}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Atribuídos:</span>
                      <span className="font-medium">{metricas.cupons_atribuidos_total.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground text-right">
                    Última atualização: {new Date(metricas.ultima_atualizacao).toLocaleTimeString()}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Alertas Recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Alertas Recentes
              </div>
              {alertas.length > 0 && (
                <Badge variant="destructive">{alertas.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {alertas.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-muted-foreground">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    Nenhum alerta recente
                  </div>
                </div>
              ) : (
                alertas.map((alerta) => (
                  <div
                    key={alerta.id}
                    className={`p-3 rounded-lg border ${getAlertColor(alerta.nivel)}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm">
                            {getAlertIcon(alerta.nivel)}
                          </span>
                          <Badge 
                            variant="outline" 
                            className="text-xs"
                          >
                            {alerta.nivel === 'error' ? 'Crítico' : 'Aviso'}
                          </Badge>
                        </div>
                        <p className="font-medium text-sm break-words">
                          {alerta.descricao}
                        </p>
                        <p className="text-xs opacity-75 mt-1">
                          {new Date(alerta.created_at).toLocaleString('pt-BR')}
                        </p>
                        
                        {/* Detalhes do contexto do alerta */}
                        {alerta.dados_contexto && (
                          <div className="mt-2 text-xs space-y-1">
                            {alerta.dados_contexto.lojista && (
                              <div className="font-medium">
                                Loja: {alerta.dados_contexto.lojista}
                              </div>
                            )}
                            {alerta.dados_contexto.cupons_disponiveis !== undefined && (
                              <div>
                                Saldo: {alerta.dados_contexto.cupons_disponiveis} cupons
                              </div>
                            )}
                            {alerta.dados_contexto.numero_bloco && (
                              <div className="font-mono text-xs">
                                Bloco: {alerta.dados_contexto.numero_bloco}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => marcarAlertaComoLido(alerta.id)}
                        className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardMonitoramento;