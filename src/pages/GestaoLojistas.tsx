import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LojistasTable } from '@/components/lojistas/LojistasTable';
import { AtribuirCuponsManual } from '@/components/lojistas/AtribuirCuponsManual';
import { VendasBlocosStats } from '@/components/admin/VendasBlocosStats';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Store, Users, Gift } from 'lucide-react';

const queryClient = new QueryClient();

export default function GestaoLojistas() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Store className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Gestão de Lojistas</h1>
            <p className="text-muted-foreground">
              Gerencie lojistas, vendas de blocos e atribuição de cupons
            </p>
          </div>
        </div>

        <Tabs defaultValue="lojistas" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="lojistas" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Lojistas
            </TabsTrigger>
            <TabsTrigger value="vendas" className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              Vendas de Blocos
            </TabsTrigger>
            <TabsTrigger value="cupons" className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Atribuir Cupons
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lojistas">
            <Card>
              <CardHeader>
                <CardTitle>Lista de Lojistas</CardTitle>
                <CardDescription>
                  Visualize, busque e gerencie todos os lojistas cadastrados no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LojistasTable />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vendas">
            <div className="space-y-6">
              <VendasBlocosStats />
              
              <Card>
                <CardHeader>
                  <CardTitle>Venda Manual de Blocos</CardTitle>
                  <CardDescription>
                    Use a tabela de lojistas abaixo para fazer vendas manuais. Clique no botão "Vender" para vender blocos.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <LojistasTable />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Vendas Recentes</CardTitle>
                  <CardDescription>
                    Últimas transações de venda de blocos realizadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Store className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Histórico de vendas em desenvolvimento</p>
                    <p className="text-sm">Em breve você poderá visualizar todas as transações</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="cupons">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AtribuirCuponsManual 
                lojistaId="placeholder" 
                onSuccess={() => {
                  // TODO: Implementar callback de sucesso
                  console.log('Cupons atribuídos com sucesso');
                }}
              />
              
              <Card>
                <CardHeader>
                  <CardTitle>Instruções</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-3">
                  <p>
                    <strong>Como funciona:</strong> Para cada R$ 10,00 de compra, 
                    o cliente recebe 1 cupom para participar do sorteio.
                  </p>
                  <p>
                    <strong>Exemplo:</strong> Uma compra de R$ 45,00 gera 4 cupons 
                    (valor máximo utilizável é R$ 40,00).
                  </p>
                  <p>
                    <strong>Validação:</strong> O sistema verifica se o lojista 
                    possui cupons suficientes disponíveis antes da atribuição.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </QueryClientProvider>
  );
}