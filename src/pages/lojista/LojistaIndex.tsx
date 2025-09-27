import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut, Store, BarChart3, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AtribuirCuponsManual } from '@/components/lojistas/AtribuirCuponsManual';

const LojistaIndex = () => {
  const { profile, signOut } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
  };

  if (!profile?.lojista_info) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p>Carregando informações da loja...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { lojista_info } = profile;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <img 
                src="/assets/logo-show-premios.png" 
                alt="Show de Prêmios" 
                className="h-8 w-auto"
              />
              <div>
                <h1 className="text-lg font-semibold">Show de Prêmios</h1>
                <p className="text-sm text-muted-foreground">Painel do Lojista</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium">{profile.nome}</p>
                <p className="text-xs text-muted-foreground">{lojista_info.nome_loja}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Informações da Loja */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loja</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lojista_info.nome_loja}</div>
              <p className="text-xs text-muted-foreground">
                {lojista_info.cidade} - {lojista_info.shopping}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CNPJ</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lojista_info.cnpj}</div>
              <p className="text-xs text-muted-foreground">
                Segmento: {lojista_info.segmento}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Ativo</div>
              <p className="text-xs text-muted-foreground">
                Participando do Show de Prêmios
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Atribuir Cupons */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Atribuir Cupom a Cliente
                </CardTitle>
                <CardDescription>
                  Informe os dados da compra para gerar cupons para o cliente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AtribuirCuponsManual 
                  lojistaId={profile.lojista_id!}
                  onSuccess={() => {
                    toast({
                      title: "Cupons atribuídos",
                      description: "Cupons gerados com sucesso para o cliente!",
                    });
                  }}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Como funciona:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• A cada R$ 100 em compras = 1 cupom</li>
                    <li>• Cupons são gerados automaticamente</li>
                    <li>• Cliente concorre aos sorteios</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Dados necessários:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• CPF do cliente</li>
                    <li>• Nome completo</li>
                    <li>• Telefone de contato</li>
                    <li>• Valor total da compra</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LojistaIndex;