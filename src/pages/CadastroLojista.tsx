import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Store, ChevronLeft, Plus, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

interface Lojista {
  id?: string;
  nome_loja: string;
  cnpj: string;
  shopping?: string;
  segmento?: string;
  status: string;
  telefone?: string;
  email?: string;
  responsavel_nome?: string;
  cidade: string;
  endereco?: string;
  cupons_nao_atribuidos?: number;
  blocos_comprados?: number;
}

interface Segmento {
  id: string;
  nome: string;
  categoria: string;
}

const lojistaSchema = z.object({
  nome_loja: z.string().trim().nonempty({ message: "Nome da loja é obrigatório" }).max(100),
  cnpj: z.string().trim().nonempty({ message: "CNPJ é obrigatório" }).length(14, { message: "CNPJ deve ter 14 dígitos" }),
  cidade: z.string().trim().nonempty({ message: "Cidade é obrigatória" }).max(50),
  shopping: z.string().max(100).optional(),
  segmento: z.string().max(100).optional(),
  telefone: z.string().max(15).optional(),
  email: z.string().email({ message: "Email inválido" }).max(255).optional().or(z.literal('')),
  responsavel_nome: z.string().max(100).optional(),
  endereco: z.string().max(255).optional(),
});

export default function CadastroLojista() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [novoSegmento, setNovoSegmento] = useState('');
  const [mostrarNovoSegmento, setMostrarNovoSegmento] = useState(false);
  
  const [formData, setFormData] = useState<Lojista>({
    nome_loja: '',
    cnpj: '',
    cidade: '',
    shopping: '',
    segmento: '',
    status: 'ativo',
    telefone: '',
    email: '',
    responsavel_nome: '',
    endereco: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Carregar segmentos disponíveis
  const { data: segmentos = [] } = useQuery({
    queryKey: ['segmentos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('segmentos')
        .select('id, nome, categoria')
        .eq('ativo', true)
        .order('nome');
      
      if (error) throw error;
      return data as Segmento[];
    },
  });

  // Mutation para criar novo segmento
  const criarNovoSegmentoMutation = useMutation({
    mutationFn: async (nomeSegmento: string) => {
      const { data, error } = await supabase
        .from('segmentos')
        .insert([{
          nome: nomeSegmento,
          categoria: 'moda_vestuario'
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (novoSegmentoData) => {
      queryClient.invalidateQueries({ queryKey: ['segmentos'] });
      setFormData(prev => ({ ...prev, segmento: novoSegmentoData.nome }));
      setNovoSegmento('');
      setMostrarNovoSegmento(false);
      toast({
        title: "Segmento criado!",
        description: `Segmento "${novoSegmentoData.nome}" foi adicionado com sucesso.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar segmento",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation para salvar lojista
  const salvarLojistaMutation = useMutation({
    mutationFn: async (data: Lojista) => {
      const { error } = await supabase
        .from('lojistas')
        .insert([data]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lojistas'] });
      toast({
        title: "✅ Lojista cadastrado!",
        description: `${formData.nome_loja} foi cadastrado com sucesso.`,
      });
      
      // Reset form
      setFormData({
        nome_loja: '',
        cnpj: '',
        cidade: '',
        shopping: '',
        segmento: '',
        status: 'ativo',
        telefone: '',
        email: '',
        responsavel_nome: '',
        endereco: '',
      });
      setErrors({});
      
      // Redirect to admin after 2 seconds
      setTimeout(() => {
        navigate('/admin/lojistas');
      }, 2000);
    },
    onError: (error: any) => {
      if (error.code === '23505') { // Unique violation
        toast({
          title: "Erro no cadastro",
          description: "Já existe um lojista cadastrado com este CNPJ.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao cadastrar lojista",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  });

  const handleSubmit = () => {
    try {
      // Validar dados
      const validatedData = lojistaSchema.parse({
        ...formData,
        email: formData.email || undefined
      });

      setErrors({});
      salvarLojistaMutation.mutate({
        ...validatedData,
        status: formData.status
      } as Lojista);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
    }
  };

  const handleNovoSegmento = () => {
    if (novoSegmento.trim()) {
      criarNovoSegmentoMutation.mutate(novoSegmento.trim());
    }
  };

  const formatCNPJ = (cnpj: string) => {
    const digits = cnpj.replace(/\D/g, '');
    return digits.slice(0, 14);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header igual ao painel administrativo */}
      <header className="flex h-14 items-center gap-x-4 bg-white border-b border-border px-4 shadow-sm lg:px-6 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 hover:bg-gray-100 p-2"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Voltar</span>
        </Button>
        
        <div className="flex items-center gap-3">
          <img 
            src="/lovable-uploads/30762c46-4536-4a6c-bd54-a016f6a4ff1c.png" 
            alt="Show de Prêmios - Vem Pra 44" 
            className="h-8 w-auto"
          />
          <div className="hidden sm:block">
            <h1 className="text-lg font-semibold text-foreground">
              Cadastro de Lojista
            </h1>
          </div>
        </div>

        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
          <div className="flex items-center gap-x-4 lg:gap-x-6 ml-auto">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/admin/lojistas')}
              className="flex items-center gap-2"
            >
              <Store className="h-4 w-4" />
              <span className="hidden sm:inline">Gerenciar Lojas</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-card shadow-sm border-border">
            <CardHeader className="border-b border-border bg-card">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Store className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-card-foreground">
                    Novo Lojista
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Cadastre um novo lojista no sistema
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome_loja">Nome da Loja *</Label>
                    <Input
                      id="nome_loja"
                      value={formData.nome_loja}
                      onChange={(e) => setFormData(prev => ({ ...prev, nome_loja: e.target.value }))}
                      className={errors.nome_loja ? 'border-destructive' : ''}
                    />
                    {errors.nome_loja && <p className="text-sm text-destructive">{errors.nome_loja}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ *</Label>
                    <Input
                      id="cnpj"
                      value={formData.cnpj}
                      onChange={(e) => setFormData(prev => ({ ...prev, cnpj: formatCNPJ(e.target.value) }))}
                      placeholder="00000000000000"
                      maxLength={14}
                      className={errors.cnpj ? 'border-destructive' : ''}
                    />
                    {errors.cnpj && <p className="text-sm text-destructive">{errors.cnpj}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade *</Label>
                    <Input
                      id="cidade"
                      value={formData.cidade}
                      onChange={(e) => setFormData(prev => ({ ...prev, cidade: e.target.value }))}
                      className={errors.cidade ? 'border-destructive' : ''}
                    />
                    {errors.cidade && <p className="text-sm text-destructive">{errors.cidade}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shopping">Shopping/Galeria</Label>
                    <Input
                      id="shopping"
                      value={formData.shopping}
                      onChange={(e) => setFormData(prev => ({ ...prev, shopping: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Segmento</Label>
                  {!mostrarNovoSegmento ? (
                    <div className="flex gap-2">
                      <Select 
                        value={formData.segmento} 
                        onValueChange={(value) => {
                          if (value === 'novo') {
                            setMostrarNovoSegmento(true);
                          } else {
                            setFormData(prev => ({ ...prev, segmento: value }));
                          }
                        }}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Selecione um segmento" />
                        </SelectTrigger>
                        <SelectContent className="bg-white z-50">
                          {segmentos.map((segmento) => (
                            <SelectItem key={segmento.id} value={segmento.nome}>
                              {segmento.nome}
                            </SelectItem>
                          ))}
                          <SelectItem value="novo" className="font-semibold text-primary">
                            + Adicionar novo segmento
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        value={novoSegmento}
                        onChange={(e) => setNovoSegmento(e.target.value)}
                        placeholder="Nome do novo segmento"
                        className="flex-1"
                      />
                      <Button 
                        type="button" 
                        size="sm" 
                        onClick={handleNovoSegmento}
                        disabled={!novoSegmento.trim() || criarNovoSegmentoMutation.isPending}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setMostrarNovoSegmento(false);
                          setNovoSegmento('');
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="responsavel_nome">Responsável</Label>
                    <Input
                      id="responsavel_nome"
                      value={formData.responsavel_nome}
                      onChange={(e) => setFormData(prev => ({ ...prev, responsavel_nome: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    value={formData.endereco}
                    onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
                  />
                </div>
              </div>

              {/* Botões */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 mt-6 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="flex-1"
                  disabled={salvarLojistaMutation.isPending}
                >
                  Cancelar
                </Button>
                
                <Button
                  type="button"
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={handleSubmit}
                  disabled={salvarLojistaMutation.isPending}
                >
                  {salvarLojistaMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {salvarLojistaMutation.isPending ? 'Cadastrando...' : 'Cadastrar Lojista'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}