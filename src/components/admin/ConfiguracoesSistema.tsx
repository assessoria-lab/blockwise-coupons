import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Settings, Users, FileText, Package } from 'lucide-react';

const ConfiguracoesSistema = () => {
  const [novosBlocos, setNovosBlocos] = useState(1);
  const queryClient = useQueryClient();

  const createBlocksMutation = useMutation({
    mutationFn: async ({ quantidade }: { quantidade: number }) => {
      const { data, error } = await supabase.rpc('criar_blocos_pool', {
        p_quantidade: quantidade
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Blocos criados com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      setNovosBlocos(1);
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar blocos: ${error.message}`);
    }
  });

  const handleCreateBlocks = () => {
    if (novosBlocos < 1 || novosBlocos > 1000) {
      toast.error('Quantidade deve ser entre 1 e 1000');
      return;
    }
    
    createBlocksMutation.mutate({ quantidade: novosBlocos });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configurações do Sistema</h2>
        <p className="text-muted-foreground">
          Gerencie configurações, usuários e estoque do sistema
        </p>
      </div>

      <Tabs defaultValue="estoque" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="configuracoes">
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </TabsTrigger>
          <TabsTrigger value="usuarios">
            <Users className="h-4 w-4 mr-2" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="logs">
            <FileText className="h-4 w-4 mr-2" />
            Logs do Sistema
          </TabsTrigger>
          <TabsTrigger value="estoque">
            <Package className="h-4 w-4 mr-2" />
            Estoque de Blocos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configuracoes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Configurações do sistema serão implementadas aqui
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usuarios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Usuários do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Gestão de usuários será implementada aqui
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logs do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Logs do sistema serão exibidos aqui
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="estoque" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Criação de Blocos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="novos-blocos">Quantidade de Blocos</Label>
                  <Input
                    id="novos-blocos"
                    type="number"
                    min="1"
                    max="1000"
                    value={novosBlocos}
                    onChange={(e) => setNovosBlocos(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div>
                  <Label>Cupons por Bloco</Label>
                  <Input value="100" disabled />
                </div>
              </div>
              
              <Button 
                onClick={handleCreateBlocks}
                disabled={createBlocksMutation.isPending}
                className="w-full"
              >
                {createBlocksMutation.isPending ? 'Criando...' : 'Criar Blocos'}
              </Button>
              
              <div className="text-sm text-muted-foreground">
                <p>• Cada bloco será criado com 100 cupons</p>
                <p>• Total de cupons que serão criados: {novosBlocos * 100}</p>
                <p>• Os blocos serão adicionados ao pool geral</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConfiguracoesSistema;