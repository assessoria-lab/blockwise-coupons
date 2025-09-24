import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  Database, 
  Mail, 
  Shield, 
  Bell,
  Save,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';

const ConfiguracoesSistema = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const { toast } = useToast();

  const [config, setConfig] = useState({
    // System Settings  
    sistemaNome: 'Blocos Admin',
    sistemaVersao: '1.0.0',
    
    // Coupon Settings
    cuponsPerBlock: 100,
    sequenceStart: 1000000,
    sequenceMax: 999999999999,
    
    // Notifications
    emailNotifications: true,
    smsNotifications: false,
    adminAlerts: true,
    
    // Backup Settings
    autoBackup: true,
    backupFrequency: 'daily',
    
    // Security
    requireTwoFactor: false,
    sessionTimeout: 60,
  });

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Simulate save operation
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast({
        title: "Configurações salvas!",
        description: "As configurações do sistema foram atualizadas com sucesso.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações. Tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectSupabase = () => {
    toast({
      title: "Integração Supabase",
      description: "Clique no botão verde Supabase no canto superior direito para conectar.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Configurações do Sistema
        </h2>
        <p className="text-muted-foreground mt-1">
          Gerencie as configurações gerais do sistema de blocos
        </p>
      </div>

      {/* Supabase Connection Status */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Status da Conexão
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${supabaseConnected ? 'bg-success' : 'bg-warning'}`} />
              <div>
                <p className="font-medium text-foreground">
                  {supabaseConnected ? 'Supabase Conectado' : 'Supabase Não Conectado'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {supabaseConnected 
                    ? 'Sistema funcionando com dados em tempo real' 
                    : 'Sistema funcionando com dados simulados'
                  }
                </p>
              </div>
            </div>
            {!supabaseConnected && (
              <Button onClick={handleConnectSupabase} variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                Conectar
              </Button>
            )}
          </div>

          {!supabaseConnected && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Dados Simulados:</strong> O sistema está funcionando com dados de exemplo. 
                Para produção, conecte ao Supabase clicando no botão verde no topo da página.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* System Information */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Informações do Sistema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Nome do Sistema</label>
              <Input
                value={config.sistemaNome}
                onChange={(e) => setConfig(prev => ({ ...prev, sistemaNome: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Versão</label>
              <Input
                value={config.sistemaVersao}
                disabled
                className="bg-muted"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coupon Configuration */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Configurações de Cupons
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Cupons por Bloco</label>
              <Input
                type="number"
                value={config.cuponsPerBlock}
                onChange={(e) => setConfig(prev => ({ ...prev, cuponsPerBlock: parseInt(e.target.value) || 100 }))}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Valor fixo do sistema</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Sequência Inicial</label>
              <Input
                type="number"
                value={config.sequenceStart}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Sequência Máxima</label>
              <Input
                type="number"
                value={config.sequenceMax}
                disabled
                className="bg-muted"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Configurações de Notificações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Notificações por Email</p>
                <p className="text-sm text-muted-foreground">Receber alertas por email</p>
              </div>
              <Switch
                checked={config.emailNotifications}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, emailNotifications: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Notificações SMS</p>
                <p className="text-sm text-muted-foreground">Receber alertas por SMS</p>
              </div>
              <Switch
                checked={config.smsNotifications}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, smsNotifications: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Alertas Administrativos</p>
                <p className="text-sm text-muted-foreground">Alertas críticos do sistema</p>
              </div>
              <Switch
                checked={config.adminAlerts}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, adminAlerts: checked }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Configurações de Segurança
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Autenticação de Dois Fatores</p>
                <p className="text-sm text-muted-foreground">Requer 2FA para login</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={config.requireTwoFactor}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, requireTwoFactor: checked }))}
                />
                <Badge variant="secondary">Recomendado</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Timeout da Sessão (minutos)</label>
              <Input
                type="number"
                value={config.sessionTimeout}
                onChange={(e) => setConfig(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) || 60 }))}
                className="w-32"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="bg-gradient-primary hover:opacity-90"
          size="lg"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Salvando...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              <span>Salvar Configurações</span>
            </div>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ConfiguracoesSistema;