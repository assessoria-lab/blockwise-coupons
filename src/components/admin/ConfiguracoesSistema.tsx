import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Database, Bell, Shield, CheckCircle, Users, FileText, Plus, Edit, Trash2 } from 'lucide-react';

interface SystemConfig {
  id: string;
  chave: string;
  valor: string;
  descricao: string;
  tipo: string;
  categoria: string;
}

interface SystemLog {
  id: string;
  evento: string;
  nivel: string;
  usuario_email?: string;
  descricao: string;
  created_at: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
}

const ConfiguracoesSistema = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<string>('operador');
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [blocosToCreate, setBlocosToCreate] = useState(10);

  // Fetch system configurations
  const { data: configs, isLoading: configsLoading } = useQuery({
    queryKey: ['system-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('configuracoes_sistema')
        .select('*')
        .order('categoria', { ascending: true });
      
      if (error) throw error;
      return data as SystemConfig[];
    }
  });

  // Fetch system logs
  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ['system-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('logs_sistema')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as SystemLog[];
    }
  });

  // Fetch user roles
  const { data: userRoles, isLoading: rolesLoading } = useQuery({
    queryKey: ['user-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as UserRole[];
    }
  });

  // Create blocks mutation
  const createBlocksMutation = useMutation({
    mutationFn: async (quantidade: number) => {
      const { data, error } = await supabase.rpc('criar_blocos_pool', {
        p_quantidade_blocos: quantidade
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      toast({
        title: "Blocos criados!",
        description: `${data.blocos_criados} blocos foram criados no pool com sucesso.`,
      });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar blocos",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update config mutation
  const updateConfigMutation = useMutation({
    mutationFn: async ({ id, valor }: { id: string; valor: string }) => {
      const { error } = await supabase
        .from('configuracoes_sistema')
        .update({ valor })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Configuração atualizada!",
        description: "A configuração foi salva com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['system-configs'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleConfigUpdate = (configId: string, newValue: string) => {
    updateConfigMutation.mutate({ id: configId, valor: newValue });
  };

  const handleCreateBlocks = () => {
    createBlocksMutation.mutate(blocosToCreate);
  };

  return (
    <div className="p-6 space-y-6">
      <Tabs defaultValue="configurations" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="configurations">Configurações</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="logs">Logs do Sistema</TabsTrigger>
          <TabsTrigger value="blocks">Pool de Blocos</TabsTrigger>
        </TabsList>

        <TabsContent value="configurations" className="space-y-6">
          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Status da Conexão Supabase
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Conectado</span>
                </div>
                <Badge variant="default">Operacional</Badge>
              </div>
            </CardContent>
          </Card>

          {/* System Configurations */}
          {configsLoading ? (
            <div>Carregando configurações...</div>
          ) : (
            <div className="grid gap-6">
              {['operacional', 'financeiro', 'seguranca', 'notificacao'].map((categoria) => (
                <Card key={categoria}>
                  <CardHeader>
                    <CardTitle className="capitalize">
                      Configurações {categoria === 'operacional' ? 'Operacionais' : 
                                   categoria === 'financeiro' ? 'Financeiras' :
                                   categoria === 'seguranca' ? 'de Segurança' : 'de Notificação'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {configs?.filter(config => config.categoria === categoria).map((config) => (
                      <div key={config.id} className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>{config.descricao}</Label>
                          <p className="text-sm text-muted-foreground">{config.chave}</p>
                        </div>
                        <div className="w-48">
                          {config.tipo === 'boolean' ? (
                            <Switch
                              checked={config.valor === 'true'}
                              onCheckedChange={(checked) => 
                                handleConfigUpdate(config.id, checked.toString())
                              }
                            />
                          ) : (
                            <Input
                              type={config.tipo === 'number' ? 'number' : 'text'}
                              value={config.valor}
                              onChange={(e) => handleConfigUpdate(config.id, e.target.value)}
                              className="text-right"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          {/* Add User */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Adicionar Usuário
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Input
                  placeholder="Email do usuário"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="flex-1"
                />
                <Select value={newUserRole} onValueChange={setNewUserRole}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="gerente">Gerente</SelectItem>
                    <SelectItem value="operador">Operador</SelectItem>
                    <SelectItem value="auditor">Auditor</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => {
                    // Add user logic here
                    setNewUserEmail('');
                    setNewUserRole('operador');
                  }}
                  disabled={!newUserEmail}
                >
                  Adicionar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Users List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Usuários do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rolesLoading ? (
                <div>Carregando usuários...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID do Usuário</TableHead>
                      <TableHead>Perfil</TableHead>
                      <TableHead>Data de Criação</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userRoles?.map((userRole) => (
                      <TableRow key={userRole.id}>
                        <TableCell className="font-mono text-sm">
                          {userRole.user_id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {userRole.role.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(userRole.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Logs do Sistema
              </CardTitle>
              <CardDescription>
                Histórico de eventos e ações realizadas no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div>Carregando logs...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Evento</TableHead>
                      <TableHead>Nível</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Descrição</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs?.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">
                          {new Date(log.created_at).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell className="font-medium">{log.evento}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              log.nivel === 'error' ? 'destructive' :
                              log.nivel === 'warning' ? 'secondary' : 'default'
                            }
                          >
                            {log.nivel}
                          </Badge>
                        </TableCell>
                        <TableCell>{log.usuario_email || 'Sistema'}</TableCell>
                        <TableCell className="max-w-md truncate">
                          {log.descricao}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blocks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Gestão do Pool de Blocos
              </CardTitle>
              <CardDescription>
                Crie novos blocos de cupons para o pool geral
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="space-y-2">
                  <Label>Quantidade de Blocos a Criar</Label>
                  <Input
                    type="number"
                    value={blocosToCreate}
                    onChange={(e) => setBlocosToCreate(Number(e.target.value))}
                    min="1"
                    max="100"
                    className="w-32"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="invisible">Criar</Label>
                  <Button
                    onClick={handleCreateBlocks}
                    disabled={createBlocksMutation.isPending || blocosToCreate < 1}
                  >
                    {createBlocksMutation.isPending ? 'Criando...' : 'Criar Blocos'}
                  </Button>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p>• Cada bloco contém 100 cupons únicos</p>
                <p>• Total de cupons que serão criados: {(blocosToCreate * 100).toLocaleString()}</p>
                <p>• Os blocos ficam disponíveis no pool para venda aos lojistas</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConfiguracoesSistema;