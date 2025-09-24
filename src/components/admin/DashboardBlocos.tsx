import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Store, 
  Users, 
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

// Mock data - will be replaced with Supabase queries
const useDashboardMetrics = () => {
  const [metrics, setMetrics] = useState({
    blocos_pool_geral: 1250,
    blocos_com_lojistas: 850,
    cupons_nao_atribuidos: 42300,
    cupons_atribuidos: 67200,
    blocos_vendidos_hoje: 15,
    cupons_atribuidos_hoje: 890,
    // Sequence stats
    primeiro_numero: 1000001,
    ultimo_numero: 1219500,
    total_unicos: 219500,
    proximo_disponivel: 1219501,
    integridade_ok: true,
    capacidade_maxima: {
      cupons_suportados: 998999999999
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  // Simulate data fetching
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return { metrics, isLoading };
};

interface MetricCardProps {
  title: string;
  value: number;
  subtitle?: string;
  badge?: string;
  icon: React.ReactNode;
  variant: 'pool' | 'lojista' | 'client';
}

const MetricCard = ({ title, value, subtitle, badge, icon, variant }: MetricCardProps) => {
  const variantStyles = {
    pool: 'bg-pool-available-bg border-pool-available/20',
    lojista: 'bg-lojista-blocks-bg border-lojista-blocks/20', 
    client: 'bg-client-assigned-bg border-client-assigned/20'
  };

  const iconStyles = {
    pool: 'text-pool-available',
    lojista: 'text-lojista-blocks',
    client: 'text-client-assigned'
  };

  return (
    <Card className={`${variantStyles[variant]} border shadow-soft hover:shadow-medium transition-all duration-200`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className={iconStyles[variant]}>{icon}</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-foreground mb-1">
          {value.toLocaleString('pt-BR')}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mb-2">{subtitle}</p>
        )}
        {badge && (
          <Badge variant="secondary" className="text-xs">
            {badge}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
};

const DashboardBlocos = () => {
  const { metrics, isLoading } = useDashboardMetrics();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Header */}
      <div className="border-b border-border pb-4">
        <h1 className="text-3xl font-bold text-foreground">Dashboard do Sistema</h1>
        <p className="text-muted-foreground mt-1">
          Visão geral dos blocos de cupons e métricas do sistema
        </p>
      </div>

      {/* Block Metrics */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Package className="h-5 w-5" />
          Visão Geral dos Blocos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricCard
            title="Blocos no Pool Geral"
            value={metrics.blocos_pool_geral}
            subtitle={`≈ ${(metrics.blocos_pool_geral * 100).toLocaleString('pt-BR')} cupons disponíveis`}
            badge="Aguardando compra por lojistas"
            icon={<Package className="h-5 w-5" />}
            variant="pool"
          />
          
          <MetricCard
            title="Blocos com Lojistas"
            value={metrics.blocos_com_lojistas}
            subtitle={`≈ ${metrics.cupons_nao_atribuidos.toLocaleString('pt-BR')} cupons não atribuídos`}
            badge={`Vendidos hoje: ${metrics.blocos_vendidos_hoje}`}
            icon={<Store className="h-5 w-5" />}
            variant="lojista"
          />
          
          <MetricCard
            title="Cupons Atribuídos a Clientes"
            value={metrics.cupons_atribuidos}
            subtitle={`Atribuídos hoje: ${metrics.cupons_atribuidos_hoje.toLocaleString('pt-BR')}`}
            badge="Participando dos sorteios"
            icon={<Users className="h-5 w-5" />}
            variant="client"
          />
        </div>
      </section>

      {/* Sequence Control */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Controle da Numeração Sequencial
        </h2>
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              Status da Sequência Global de Cupons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-6">
              <div className="p-4 bg-accent rounded-lg">
                <div className="text-2xl font-bold text-foreground">
                  {metrics.primeiro_numero.toLocaleString('pt-BR')}
                </div>
                <div className="text-sm text-muted-foreground">Primeiro Cupom</div>
              </div>
              <div className="p-4 bg-accent rounded-lg">
                <div className="text-2xl font-bold text-foreground">
                  {metrics.ultimo_numero.toLocaleString('pt-BR')}
                </div>
                <div className="text-sm text-muted-foreground">Último Cupom</div>
              </div>
              <div className="p-4 bg-success-bg rounded-lg">
                <div className="text-2xl font-bold text-success">
                  {metrics.total_unicos.toLocaleString('pt-BR')}
                </div>
                <div className="text-sm text-muted-foreground">Cupons Únicos Criados</div>
              </div>
              <div className="p-4 bg-pool-available-bg rounded-lg">
                <div className="text-2xl font-bold text-pool-available">
                  {metrics.proximo_disponivel.toLocaleString('pt-BR')}
                </div>
                <div className="text-sm text-muted-foreground">Próximo Sequencial</div>
              </div>
            </div>
            
            <div className="p-4 bg-success-bg border border-success/20 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 ${metrics.integridade_ok ? 'bg-success' : 'bg-destructive'} rounded-full`} />
                <span className="font-medium text-success">
                  Integridade Sequencial: {metrics.integridade_ok ? 'OK' : 'ERRO'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Capacidade máxima: {metrics.capacidade_maxima.cupons_suportados.toLocaleString('pt-BR')} cupons
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Quick Stats */}           
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Atividade de Hoje
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Blocos Vendidos</p>
                  <p className="text-2xl font-bold text-foreground">{metrics.blocos_vendidos_hoje}</p>
                </div>
                <Clock className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Cupons Atribuídos</p>
                  <p className="text-2xl font-bold text-foreground">{metrics.cupons_atribuidos_hoje.toLocaleString('pt-BR')}</p>
                </div>
                <Users className="h-8 w-8 text-client-assigned" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Taxa de Atribuição</p>
                  <p className="text-2xl font-bold text-foreground">89.2%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default DashboardBlocos;