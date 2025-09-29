import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Package, Users, TrendingUp, Activity } from 'lucide-react';

const SimpleIndex = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Sistema Show de Prêmios</h2>
        <p className="text-muted-foreground">
          Bem-vindo ao painel administrativo
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sistema</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Ativo</div>
            <p className="text-xs text-muted-foreground">
              funcionando normalmente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Banco de Dados</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Conectado</div>
            <p className="text-xs text-muted-foreground">
              Supabase online
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Pronto</div>
            <p className="text-xs text-muted-foreground">
              para uso
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Versão</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.0</div>
            <p className="text-xs text-muted-foreground">
              inicial
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximos Passos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium">1. Criar Blocos de Cupons</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Acesse "Configurações do Sistema" → "Estoque de Blocos" para criar os primeiros blocos de cupons.
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium">2. Cadastrar Lojistas</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Use "Gestão de Lojistas" para adicionar parceiros que irão vender os blocos.
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium">3. Configurar Sistema</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Personalize as configurações do sistema conforme necessário.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleIndex;