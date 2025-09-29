import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Key, 
  Lock, 
  Unlock,
  UserCheck,
  UserX,
  Calendar,
  AlertTriangle
} from 'lucide-react';

interface AdminUser {
  id: string;
  nome: string;
  email: string;
  perfil: 'super_admin' | 'admin' | 'operador';
  status: 'ativo' | 'inativo' | 'suspenso';
  permissoes: string[];
  ultimo_login?: string;
  tentativas_login_falhadas: number;
  bloqueado_ate?: string;
  observacoes?: string;
  created_at: string;
  ativo: boolean;
}

interface Permission {
  codigo: string;
  nome: string;
  descricao: string;
  categoria: string;
}

const GestaoUsuariosAdmin = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    perfil: 'admin' as 'super_admin' | 'admin' | 'operador',
    permissoes: [] as string[],
    observacoes: ''
  });

  // Buscar usuários admin
  const { data: adminUsers = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('usuarios_admin')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AdminUser[];
    }
  });

  // Buscar permissões disponíveis
  const { data: permissions = [] } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permissoes_sistema')
        .select('*')
        .eq('ativo', true)
        .order('categoria', { ascending: true });

      if (error) throw error;
      return data as Permission[];
    }
  });

  // Criar usuário admin
  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof formData) => {
      const { data, error } = await supabase
        .from('usuarios_admin')
        .insert([{
          nome: userData.nome,
          email: userData.email,
          perfil: userData.perfil,
          permissoes: userData.permissoes,
          observacoes: userData.observacoes,
          status: 'ativo',
          ativo: true
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Usuário criado",
        description: "Usuário administrativo criado com sucesso"
      });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setShowCreateModal(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar usuário",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Atualizar usuário admin
  const updateUserMutation = useMutation({
    mutationFn: async (userData: typeof formData & { id: string }) => {
      const { data, error } = await supabase
        .from('usuarios_admin')
        .update({
          nome: userData.nome,
          email: userData.email,
          perfil: userData.perfil,
          permissoes: userData.permissoes,
          observacoes: userData.observacoes
        })
        .eq('id', userData.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Usuário atualizado",
        description: "Usuário administrativo atualizado com sucesso"
      });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setShowEditModal(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar usuário",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Alterar status do usuário
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'ativo' | 'inativo' | 'suspenso' }) => {
      const { data, error } = await supabase
        .from('usuarios_admin')
        .update({ status, ativo: status === 'ativo' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Status alterado",
        description: "Status do usuário alterado com sucesso"
      });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    }
  });

  // Desbloquear usuário
  const unlockUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('usuarios_admin')
        .update({ 
          bloqueado_ate: null,
          tentativas_login_falhadas: 0
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Usuário desbloqueado",
        description: "Usuário desbloqueado com sucesso"
      });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    }
  });

  const resetForm = () => {
    setFormData({
      nome: '',
      email: '',
      perfil: 'admin',
      permissoes: [],
      observacoes: ''
    });
    setSelectedUser(null);
  };

  const openEditModal = (user: AdminUser) => {
    setSelectedUser(user);
    setFormData({
      nome: user.nome,
      email: user.email,
      perfil: user.perfil,
      permissoes: user.permissoes || [],
      observacoes: user.observacoes || ''
    });
    setShowEditModal(true);
  };

  const getStatusBadge = (user: AdminUser) => {
    if (user.bloqueado_ate && new Date(user.bloqueado_ate) > new Date()) {
      return <Badge variant="destructive">Bloqueado</Badge>;
    }
    
    switch (user.status) {
      case 'ativo':
        return <Badge variant="default">Ativo</Badge>;
      case 'inativo':
        return <Badge variant="secondary">Inativo</Badge>;
      case 'suspenso':
        return <Badge variant="destructive">Suspenso</Badge>;
      default:
        return <Badge variant="outline">Indefinido</Badge>;
    }
  };

  const getPerfilBadge = (perfil: string) => {
    switch (perfil) {
      case 'super_admin':
        return <Badge variant="destructive">Super Admin</Badge>;
      case 'admin':
        return <Badge variant="default">Admin</Badge>;
      case 'operador':
        return <Badge variant="secondary">Operador</Badge>;
      default:
        return <Badge variant="outline">Indefinido</Badge>;
    }
  };

  const isUserBlocked = (user: AdminUser) => {
    return user.bloqueado_ate && new Date(user.bloqueado_ate) > new Date();
  };

  const permissionsByCategory = permissions.reduce((acc, perm) => {
    if (!acc[perm.categoria]) {
      acc[perm.categoria] = [];
    }
    acc[perm.categoria].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Gestão de Usuários Admin</h1>
            <p className="text-muted-foreground">
              Gerencie usuários administrativos, permissões e status
            </p>
          </div>
        </div>
        
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Usuário Admin
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário Administrativo</DialogTitle>
              <DialogDescription>
                Preencha os dados do novo usuário administrativo
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="Nome completo"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@exemplo.com"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="perfil">Perfil *</Label>
                <Select value={formData.perfil} onValueChange={(value: any) => setFormData(prev => ({ ...prev, perfil: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operador">Operador</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="super_admin">Super Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Permissões</Label>
                <div className="grid grid-cols-2 gap-4 mt-2 max-h-60 overflow-y-auto">
                  {Object.entries(permissionsByCategory).map(([categoria, perms]) => (
                    <div key={categoria} className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground uppercase">
                        {categoria.replace('_', ' ')}
                      </h4>
                      {perms.map((perm) => (
                        <div key={perm.codigo} className="flex items-start space-x-2">
                          <Checkbox
                            id={perm.codigo}
                            checked={formData.permissoes.includes(perm.codigo)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData(prev => ({
                                  ...prev,
                                  permissoes: [...prev.permissoes, perm.codigo]
                                }));
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  permissoes: prev.permissoes.filter(p => p !== perm.codigo)
                                }));
                              }
                            }}
                          />
                          <div className="grid gap-1.5 leading-none">
                            <label
                              htmlFor={perm.codigo}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {perm.nome}
                            </label>
                            <p className="text-xs text-muted-foreground">
                              {perm.descricao}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  placeholder="Observações sobre o usuário"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={() => createUserMutation.mutate(formData)}
                  disabled={createUserMutation.isPending || !formData.nome || !formData.email}
                >
                  {createUserMutation.isPending ? 'Criando...' : 'Criar Usuário'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminUsers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {adminUsers.filter(u => u.status === 'ativo').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Bloqueados</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {adminUsers.filter(u => isUserBlocked(u)).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Super Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {adminUsers.filter(u => u.perfil === 'super_admin').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de usuários */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários Administrativos</CardTitle>
          <CardDescription>
            Gerencie todos os usuários administrativos do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando usuários...</div>
          ) : adminUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum usuário administrativo encontrado
            </div>
          ) : (
            <div className="space-y-4">
              {adminUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{user.nome}</h3>
                        {getPerfilBadge(user.perfil)}
                        {getStatusBadge(user)}
                      </div>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        {user.ultimo_login && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Último login: {new Date(user.ultimo_login).toLocaleDateString()}
                          </span>
                        )}
                        {user.tentativas_login_falhadas > 0 && (
                          <span className="flex items-center gap-1 text-yellow-600">
                            <AlertTriangle className="h-3 w-3" />
                            {user.tentativas_login_falhadas} tentativa(s) falhada(s)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isUserBlocked(user) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => unlockUserMutation.mutate(user.id)}
                        disabled={unlockUserMutation.isPending}
                      >
                        <Unlock className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(user)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    <Select
                      value={user.status}
                      onValueChange={(status: any) => 
                        toggleStatusMutation.mutate({ id: user.id, status })
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                        <SelectItem value="suspenso">Suspenso</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Edição */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Usuário Administrativo</DialogTitle>
            <DialogDescription>
              Edite os dados do usuário administrativo
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-nome">Nome *</Label>
                <Input
                  id="edit-nome"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Nome completo"
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-perfil">Perfil *</Label>
              <Select value={formData.perfil} onValueChange={(value: any) => setFormData(prev => ({ ...prev, perfil: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operador">Operador</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="super_admin">Super Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Permissões</Label>
              <div className="grid grid-cols-2 gap-4 mt-2 max-h-60 overflow-y-auto">
                {Object.entries(permissionsByCategory).map(([categoria, perms]) => (
                  <div key={categoria} className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase">
                      {categoria.replace('_', ' ')}
                    </h4>
                    {perms.map((perm) => (
                      <div key={perm.codigo} className="flex items-start space-x-2">
                        <Checkbox
                          id={`edit-${perm.codigo}`}
                          checked={formData.permissoes.includes(perm.codigo)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData(prev => ({
                                ...prev,
                                permissoes: [...prev.permissoes, perm.codigo]
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                permissoes: prev.permissoes.filter(p => p !== perm.codigo)
                              }));
                            }
                          }}
                        />
                        <div className="grid gap-1.5 leading-none">
                          <label
                            htmlFor={`edit-${perm.codigo}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {perm.nome}
                          </label>
                          <p className="text-xs text-muted-foreground">
                            {perm.descricao}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="edit-observacoes">Observações</Label>
              <Textarea
                id="edit-observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                placeholder="Observações sobre o usuário"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setShowEditModal(false); resetForm(); }}>
                Cancelar
              </Button>
              <Button 
                onClick={() => selectedUser && updateUserMutation.mutate({ ...formData, id: selectedUser.id })}
                disabled={updateUserMutation.isPending || !formData.nome || !formData.email}
              >
                {updateUserMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GestaoUsuariosAdmin;