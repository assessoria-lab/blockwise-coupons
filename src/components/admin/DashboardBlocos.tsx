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
    pool: 'bg-white border-l-4 border-pool-available shadow-sm hover:shadow-md',
    lojista: 'bg-white border-l-4 border-lojista-blocks shadow-sm hover:shadow-md', 
    client: 'bg-white border-l-4 border-client-assigned shadow-sm hover:shadow-md'
  };

  const iconStyles = {
    pool: 'text-pool-available bg-pool-available/10 p-2 rounded-full',
    lojista: 'text-lojista-blocks bg-lojista-blocks/10 p-2 rounded-full',
    client: 'text-client-assigned bg-client-assigned/10 p-2 rounded-full'
  };

  return (
    <Card className={`${variantStyles[variant]} border-border transition-all duration-200 hover:scale-[1.02]`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={iconStyles[variant]}>{icon}</div>
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{title}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-foreground mb-2">
          {value.toLocaleString('pt-BR')}
        </div>
        {subtitle && (
          <p className="text-sm text-muted-foreground mb-3">{subtitle}</p>
        )}
        {badge && (
          <Badge 
            variant="secondary" 
            className="text-xs bg-muted text-muted-foreground border border-border"
          >
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
    <div className="p-4 lg:p-6 space-y-6">
      {/* Block Metrics */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        <Card className="shadow-sm bg-white border border-border">
          <CardHeader className="border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <CheckCircle className="h-5 w-5 text-success" />
                Status da Sequência Global de Cupons
              </CardTitle>
              <Badge 
                variant={metrics.integridade_ok ? "default" : "destructive"}
                className={metrics.integridade_ok ? "bg-success text-success-foreground" : ""}
              >
                {metrics.integridade_ok ? 'OK' : 'ERRO'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg border border-border">
                <div className="text-xl font-bold text-foreground mb-1">
                  {metrics.primeiro_numero.toLocaleString('pt-BR')}
                </div>
                <div className="text-xs text-muted-foreground">Primeiro Cupom</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg border border-border">
                <div className="text-xl font-bold text-foreground mb-1">
                  {metrics.ultimo_numero.toLocaleString('pt-BR')}
                </div>
                <div className="text-xs text-muted-foreground">Último Cupom</div>
              </div>
              <div className="text-center p-4 bg-success/10 rounded-lg border border-success/20">
                <div className="text-xl font-bold text-success mb-1">
                  {metrics.total_unicos.toLocaleString('pt-BR')}
                </div>
                <div className="text-xs text-muted-foreground">Cupons Únicos</div>
              </div>
              <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20">
                <div className="text-xl font-bold text-primary mb-1">
                  {metrics.proximo_disponivel.toLocaleString('pt-BR')}
                </div>
                <div className="text-xs text-muted-foreground">Próximo Sequencial</div>
              </div>
            </div>
            
            <div className="p-4 bg-success/5 border border-success/20 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Capacidade máxima:</strong> {metrics.capacidade_maxima.cupons_suportados.toLocaleString('pt-BR')} cupons
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Activity Stats */}           
      <section>
        <div className="bg-white rounded-lg p-6 shadow-sm border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Atividade de Hoje
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gray-50 rounded-lg border border-border hover:shadow-md transition-shadow">
              <Clock className="h-8 w-8 text-warning mx-auto mb-3" />
              <div className="text-2xl font-bold text-foreground mb-1">{metrics.blocos_vendidos_hoje}</div>
              <div className="text-sm text-muted-foreground">Blocos Vendidos</div>
            </div>
            
            <div className="text-center p-6 bg-gray-50 rounded-lg border border-border hover:shadow-md transition-shadow">
              <Users className="h-8 w-8 text-client-assigned mx-auto mb-3" />
              <div className="text-2xl font-bold text-foreground mb-1">{metrics.cupons_atribuidos_hoje.toLocaleString('pt-BR')}</div>
              <div className="text-sm text-muted-foreground">Cupons Atribuídos</div>
            </div>
            
            <div className="text-center p-6 bg-gray-50 rounded-lg border border-border hover:shadow-md transition-shadow">
              <TrendingUp className="h-8 w-8 text-success mx-auto mb-3" />
              <div className="text-2xl font-bold text-foreground mb-1">89.2%</div>
              <div className="text-sm text-muted-foreground">Taxa de Atribuição</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DashboardBlocos;