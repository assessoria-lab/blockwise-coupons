import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLojistas } from '@/hooks/useLojistas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LogOut, Store, BarChart3, UserPlus, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AtribuirCuponsManual } from '@/components/lojistas/AtribuirCuponsManual';

const LojistaIndex = () => {
  const { profile, signOut } = useAuth();
  const { lojas, loja, lojaSelecionada, setLojaSelecionada, isLoading } = useLojistas();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p>Carregando informações das lojas...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (lojas.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma loja cadastrada</h3>
            <p className="text-muted-foreground mb-4">Você ainda não possui lojas cadastradas no sistema.</p>
            <Button onClick={() => window.location.href = '/cadastro-lojista-publico'}>
              Cadastrar Primeira Loja
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                <p className="text-sm font-medium">{profile?.nome}</p>
                <p className="text-xs text-muted-foreground">{lojas.length} loja(s)</p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Seletor de Loja */}
        {lojas.length > 1 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Selecionar Loja
              </CardTitle>
              <CardDescription>
                Escolha qual loja deseja gerenciar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={lojaSelecionada || ''} onValueChange={setLojaSelecionada}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione uma loja" />
                </SelectTrigger>
                <SelectContent>
                  {lojas.map((loja) => (
                    <SelectItem key={loja.id} value={loja.id}>
                      {loja.nome_loja} - {loja.cidade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {loja && (
          <>
            {/* Informações da Loja Selecionada */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Loja Atual</CardTitle>
                  <Store className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{loja.nome_loja}</div>
                  <p className="text-xs text-muted-foreground">
                    {loja.cidade} {loja.shopping && `- ${loja.shopping}`}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">CNPJ</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{loja.cnpj}</div>
                  <p className="text-xs text-muted-foreground">
                    {loja.segmento && `Segmento: ${loja.segmento}`}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cupons Disponíveis</CardTitle>
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{loja.cupons_nao_atribuidos}</div>
                  <p className="text-xs text-muted-foreground">
                    Prontos para distribuir
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
                      lojistaId={loja.id}
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

                <Card>
                  <CardHeader>
                    <CardTitle>Ações Rápidas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => window.location.href = '/cadastro-lojista-publico'}
                    >
                      <Building2 className="h-4 w-4 mr-2" />
                      Cadastrar Nova Loja
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LojistaIndex;