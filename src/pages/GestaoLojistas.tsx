import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LojistasTable } from '@/components/lojistas/LojistasTable';
import { VendasBlocosStats } from '@/components/admin/VendasBlocosStats';
import { LojistasStats } from '@/components/admin/LojistasStats';
import { HistoricoVendasRecentes } from '@/components/admin/HistoricoVendasRecentes';
import { useRealTimeSync } from '@/hooks/useRealTimeSync';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Store, Users, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: 15000, // Atualiza a cada 15 segundos
      staleTime: 5000, // Considera dados "stale" após 5 segundos
    },
  },
});

function GestaoLojistasContent() {
  const { forceRefresh } = useRealTimeSync({
    enableStats: true,
    enableVendas: true,
    enableLojistas: true
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Store className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Gestão de Lojistas</h1>
            <p className="text-muted-foreground">
              Gerencie lojistas e vendas de blocos
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={forceRefresh}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar Dados
        </Button>
      </div>

      <Tabs defaultValue="lojistas" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="lojistas" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Lojistas
          </TabsTrigger>
          <TabsTrigger value="vendas" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            Vendas de Blocos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lojistas">
          <div className="space-y-6">
            <LojistasStats />
            
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
          </div>
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
            
            <HistoricoVendasRecentes />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function GestaoLojistas() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestaoLojistasContent />
    </QueryClientProvider>
  );
}