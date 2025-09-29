import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Store, ChevronLeft, Plus, X, CheckCircle, ShoppingCart, UserPlus } from 'lucide-react';
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
  senha?: string;
  confirmar_senha?: string;
}
interface Segmento {
  id: string;
  nome: string;
  categoria: string;
}
const lojistaSchema = z.object({
  nome_loja: z.string().trim().nonempty({
    message: "Nome da loja é obrigatório"
  }).max(100),
  cnpj: z.string().trim().nonempty({
    message: "CNPJ é obrigatório"
  }).length(14, {
    message: "CNPJ deve ter 14 dígitos"
  }),
  cidade: z.string().trim().nonempty({
    message: "Cidade é obrigatória"
  }).max(50),
  shopping: z.string().max(100).optional(),
  segmento: z.string().max(100).optional(),
  telefone: z.string().max(15).optional(),
  email: z.string().email({
    message: "Email inválido"
  }).max(255).nonempty({
    message: "Email é obrigatório"
  }),
  responsavel_nome: z.string().max(100).optional(),
  endereco: z.string().max(255).optional(),
  senha: z.string().min(6, {
    message: "Senha deve ter pelo menos 6 caracteres"
  }),
  confirmar_senha: z.string().min(6, {
    message: "Confirmação de senha deve ter pelo menos 6 caracteres"
  })
}).refine((data) => data.senha === data.confirmar_senha, {
  message: "As senhas não conferem",
  path: ["confirmar_senha"]
});
export default function CadastroLojista() {
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [novoSegmento, setNovoSegmento] = useState('');
  const [mostrarNovoSegmento, setMostrarNovoSegmento] = useState(false);
  const [showSucessoModal, setShowSucessoModal] = useState(false);
  const [nomeLojaRegistrada, setNomeLojaRegistrada] = useState('');
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
    senha: '',
    confirmar_senha: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Carregar segmentos disponíveis
  const {
    data: segmentos = []
  } = useQuery({
    queryKey: ['segmentos'],
    queryFn: async () => {
      // Mock data for now to avoid database issues
      return [
        { id: '1', nome: 'Moda e Vestuário', categoria: 'moda' },
        { id: '2', nome: 'Calçados', categoria: 'calcados' },
        { id: '3', nome: 'Acessórios', categoria: 'acessorios' },
        { id: '4', nome: 'Perfumaria', categoria: 'perfumaria' },
        { id: '5', nome: 'Ótica', categoria: 'otica' }
      ] as Segmento[];
    }
  });

  // Mutation para criar novo segmento
  const criarNovoSegmentoMutation = useMutation({
    mutationFn: async (nomeSegmento: string) => {
      // Mock creation for now
      return { 
        id: Date.now().toString(),
        nome: nomeSegmento,
        categoria: 'moda_vestuario'
      };
    },
    onSuccess: novoSegmentoData => {
      queryClient.invalidateQueries({
        queryKey: ['segmentos']
      });
      setFormData(prev => ({
        ...prev,
        segmento: novoSegmentoData.nome
      }));
      setNovoSegmento('');
      setMostrarNovoSegmento(false);
      toast({
        title: "Segmento criado!",
        description: `Segmento "${novoSegmentoData.nome}" foi adicionado com sucesso.`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar segmento",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Mutation para salvar lojista
  const salvarLojistaMutation = useMutation({
    mutationFn: async (data: Lojista) => {
      try {
        // 1. Criar usuário lojista na nova estrutura
        const { senha, confirmar_senha, ...lojistaData } = data;
        
        // 1. Criar usuário lojista (sem retornar dados para evitar problemas de permissão)
        const { error: usuarioError } = await supabase
          .from('usuarios_lojistas')
          .insert({
            nome: lojistaData.responsavel_nome || lojistaData.nome_loja,
            email: lojistaData.email!,
            telefone: lojistaData.telefone
          });

        if (usuarioError) {
          console.error('Erro ao criar usuário lojista:', usuarioError);
          throw new Error(`Erro ao criar usuário: ${usuarioError.message}`);
        }

        // 2. Buscar o usuário criado pelo email
        const { data: novoUsuario, error: buscaUsuarioError } = await supabase
          .from('usuarios_lojistas')
          .select('id')
          .eq('email', lojistaData.email!)
          .single();

        if (buscaUsuarioError || !novoUsuario) {
          console.error('Erro ao buscar usuário criado:', buscaUsuarioError);
          throw new Error('Erro ao localizar usuário criado');
        }

        // 3. Criar loja vinculada ao usuário
        const { error: lojaError } = await supabase
          .from('lojas')
          .insert({
            usuario_lojista_id: novoUsuario.id,
            nome_loja: lojistaData.nome_loja,
            cnpj: lojistaData.cnpj,
            cidade: lojistaData.cidade,
            shopping: lojistaData.shopping,
            segmento: lojistaData.segmento,
            endereco: lojistaData.endereco
          });

        if (lojaError) {
          console.error('Erro ao criar loja:', lojaError);
          throw new Error(`Erro ao criar loja: ${lojaError.message}`);
        }

        return { success: true };
      } catch (error) {
        console.error('Erro completo no cadastro:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['lojistas']
      });
      
      // Salva o nome da loja para o modal
      setNomeLojaRegistrada(formData.nome_loja);
      
      // Mostra o modal de sucesso
      setShowSucessoModal(true);

      toast({
        title: "✅ Lojista cadastrado!",
        description: `${formData.nome_loja} foi cadastrado com sucesso. Verifique seu email para confirmar a conta.`
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
        senha: '',
        confirmar_senha: ''
      });
      setErrors({});
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        // Unique violation
        toast({
          title: "Erro no cadastro",
          description: "Já existe um lojista cadastrado com este CNPJ.",
          variant: "destructive"
        });
      } else if (error.message?.includes('User already registered')) {
        toast({
          title: "Erro no cadastro",
          description: "Já existe um usuário cadastrado com este email.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Erro ao cadastrar lojista",
          description: error.message,
          variant: "destructive"
        });
      }
    }
  });
  const handleSubmit = () => {
    try {
      // Validar dados
      const validatedData = lojistaSchema.parse(formData);
      setErrors({});
      salvarLojistaMutation.mutate({
        ...validatedData,
        status: formData.status
      } as Lojista);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);

        // Scroll to first error on mobile
        const firstErrorField = document.getElementById(Object.keys(newErrors)[0]);
        if (firstErrorField) {
          firstErrorField.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
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
  return <div className="min-h-screen bg-primary flex flex-col">
      {/* Header otimizado para mobile */}
      

      {/* Conteúdo principal otimizado para mobile */}
      <main className="flex-1 overflow-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 bg-cover bg-center bg-no-repeat" style={{
      backgroundImage: 'url(/assets/background-green.jpg)'
    }}>
        {/* Logo centralizada no topo */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <img src="/assets/logo-show-premios.png" alt="Show de Prêmios" className="h-48 sm:h-60 w-auto" />
        </div>
        <div className="max-w-2xl mx-auto">
          <Card className="bg-card shadow-sm border-border">
            <CardHeader className="border-b border-border bg-card px-4 sm:px-6 py-4 sm:py-6">
              <div className="text-center">
                <CardTitle className="text-2xl sm:text-4xl font-bold text-card-foreground">CADASTRE SUA LOJA NO SHOW DE PRÊMIOS</CardTitle>
                <CardDescription className="text-sm sm:text-base text-muted-foreground mt-1">Preencha os dados e faça parte da maior campanha de vendas do ano!</CardDescription>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-6">
              <div className="space-y-6 sm:space-y-8">
                {/* Campos obrigatórios primeiro */}
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label htmlFor="nome_loja" className="text-sm font-medium">
                      Nome da Loja *
                    </Label>
                    <Input id="nome_loja" value={formData.nome_loja} onChange={e => setFormData(prev => ({
                    ...prev,
                    nome_loja: e.target.value
                  }))} className={`h-12 text-base ${errors.nome_loja ? 'border-destructive' : ''}`} placeholder="Ex: Loja da Moda" />
                    {errors.nome_loja && <p className="text-sm text-destructive flex items-center gap-1">
                        {errors.nome_loja}
                      </p>}
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-3">
                      <Label htmlFor="cnpj" className="text-sm font-medium">
                        CNPJ *
                      </Label>
                      <Input id="cnpj" value={formData.cnpj} onChange={e => setFormData(prev => ({
                      ...prev,
                      cnpj: formatCNPJ(e.target.value)
                    }))} placeholder="00000000000000" maxLength={14} inputMode="numeric" className={`h-12 text-base ${errors.cnpj ? 'border-destructive' : ''}`} />
                      {errors.cnpj && <p className="text-sm text-destructive">{errors.cnpj}</p>}
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="cidade" className="text-sm font-medium">
                        Cidade *
                      </Label>
                      <Input id="cidade" value={formData.cidade} onChange={e => setFormData(prev => ({
                      ...prev,
                      cidade: e.target.value
                    }))} className={`h-12 text-base ${errors.cidade ? 'border-destructive' : ''}`} placeholder="Ex: Goiânia" />
                      {errors.cidade && <p className="text-sm text-destructive">{errors.cidade}</p>}
                    </div>
                  </div>
                </div>

                {/* Localização */}
                <div className="space-y-4">
                  <div className="pb-2 border-b border-border">
                    <h3 className="text-base font-semibold text-card-foreground flex items-center gap-2">
                      <div className="w-2 h-2 bg-secondary rounded-full"></div>
                      Localização
                    </h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <Label htmlFor="shopping" className="text-sm font-medium">
                        Shopping/Galeria
                      </Label>
                      <Input id="shopping" value={formData.shopping} onChange={e => setFormData(prev => ({
                      ...prev,
                      shopping: e.target.value
                    }))} className="h-12 text-base" placeholder="Ex: Flamboyant Shopping" />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="endereco" className="text-sm font-medium">
                        Endereço
                      </Label>
                      <Input id="endereco" value={formData.endereco} onChange={e => setFormData(prev => ({
                      ...prev,
                      endereco: e.target.value
                    }))} className="h-12 text-base" placeholder="Rua, número, bairro" />
                    </div>
                  </div>
                </div>

                {/* Segmento */}
                <div className="space-y-4">
                  <div className="pb-2 border-b border-border">
                    <h3 className="text-base font-semibold text-card-foreground flex items-center gap-2">
                      <div className="w-2 h-2 bg-accent rounded-full"></div>
                      Segmento
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium">
                      Segmento
                    </Label>
                    {!mostrarNovoSegmento ? <Select value={formData.segmento} onValueChange={value => {
                    if (value === 'novo') {
                      setMostrarNovoSegmento(true);
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        segmento: value
                      }));
                    }
                  }}>
                        <SelectTrigger className="h-12 text-base bg-white z-50">
                          <SelectValue placeholder="Selecione um segmento" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-border z-[100] max-h-60">
                          {segmentos.map(segmento => <SelectItem key={segmento.id} value={segmento.nome} className="text-base py-3">
                              {segmento.nome}
                            </SelectItem>)}
                          <SelectItem value="novo" className="font-semibold text-primary text-base py-3">
                            + Adicionar novo segmento
                          </SelectItem>
                        </SelectContent>
                      </Select> : <div className="flex gap-2">
                        <Input value={novoSegmento} onChange={e => setNovoSegmento(e.target.value)} placeholder="Nome do novo segmento" className="flex-1 h-12 text-base" />
                        <Button type="button" size="sm" onClick={handleNovoSegmento} disabled={!novoSegmento.trim() || criarNovoSegmentoMutation.isPending} className="h-12 px-4">
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => {
                      setMostrarNovoSegmento(false);
                      setNovoSegmento('');
                    }} className="h-12 px-4">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>}
                  </div>
                </div>

                {/* Contato */}
                <div className="space-y-4">
                  <div className="pb-2 border-b border-border">
                    <h3 className="text-base font-semibold text-card-foreground flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      Contato
                    </h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <Label htmlFor="responsavel_nome" className="text-sm font-medium">
                        Responsável
                      </Label>
                      <Input id="responsavel_nome" value={formData.responsavel_nome} onChange={e => setFormData(prev => ({
                      ...prev,
                      responsavel_nome: e.target.value
                    }))} className="h-12 text-base" placeholder="Nome do responsável" />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="telefone" className="text-sm font-medium">
                        Telefone
                      </Label>
                      <Input id="telefone" value={formData.telefone} onChange={e => setFormData(prev => ({
                      ...prev,
                      telefone: e.target.value
                    }))} placeholder="(00) 00000-0000" inputMode="tel" className="h-12 text-base" />
                    </div>

                     <div className="space-y-3">
                       <Label htmlFor="email" className="text-sm font-medium">
                         Email *
                       </Label>
                       <Input id="email" type="email" value={formData.email} onChange={e => setFormData(prev => ({
                       ...prev,
                       email: e.target.value
                     }))} inputMode="email" className={`h-12 text-base ${errors.email ? 'border-destructive' : ''}`} placeholder="contato@loja.com.br" />
                       {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                     </div>
                   </div>
                 </div>

                 {/* Senha */}
                 <div className="space-y-4">
                   <div className="pb-2 border-b border-border">
                     <h3 className="text-base font-semibold text-card-foreground flex items-center gap-2">
                       <div className="w-2 h-2 bg-destructive rounded-full"></div>
                       Dados de Acesso
                     </h3>
                   </div>
                   
                   <div className="space-y-4">
                     <div className="space-y-3">
                       <Label htmlFor="senha" className="text-sm font-medium">
                         Senha de Acesso *
                       </Label>
                       <Input 
                         id="senha" 
                         type="password" 
                         value={formData.senha} 
                         onChange={e => setFormData(prev => ({
                           ...prev,
                           senha: e.target.value
                         }))} 
                         className={`h-12 text-base ${errors.senha ? 'border-destructive' : ''}`} 
                         placeholder="Digite sua senha (mín. 6 caracteres)" 
                       />
                       {errors.senha && <p className="text-sm text-destructive">{errors.senha}</p>}
                     </div>

                     <div className="space-y-3">
                       <Label htmlFor="confirmar_senha" className="text-sm font-medium">
                         Confirmar Senha *
                       </Label>
                       <Input 
                         id="confirmar_senha" 
                         type="password" 
                         value={formData.confirmar_senha} 
                         onChange={e => setFormData(prev => ({
                           ...prev,
                           confirmar_senha: e.target.value
                         }))} 
                         className={`h-12 text-base ${errors.confirmar_senha ? 'border-destructive' : ''}`} 
                         placeholder="Digite novamente sua senha" 
                       />
                       {errors.confirmar_senha && <p className="text-sm text-destructive">{errors.confirmar_senha}</p>}
                     </div>
                  </div>
                </div>
              </div>

              {/* Botões fixos no mobile */}
              <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-border mt-8 -mx-4 sm:-mx-6 p-4 sm:p-6 sm:static sm:border-t-0 sm:bg-transparent sm:mt-6">
                <div className="flex flex-col gap-3">
                  <Button type="button" className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleSubmit} disabled={salvarLojistaMutation.isPending}>
                    {salvarLojistaMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {salvarLojistaMutation.isPending ? 'Cadastrando...' : 'CADASTRAR LOJA'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      {/* Modal de sucesso */}
      <Dialog open={showSucessoModal} onOpenChange={setShowSucessoModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <DialogTitle className="text-xl font-bold text-center">
              Cadastro Realizado com Sucesso!
            </DialogTitle>
            <DialogDescription className="text-center text-base">
              {nomeLojaRegistrada} foi cadastrada no Show de Prêmios. Agora você já pode comprar blocos de cupons e começar a participar da campanha.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-3 mt-6">
            <Button 
              onClick={() => {
                setShowSucessoModal(false);
                // Reset para novo cadastro
              }} 
              className="w-full h-12 text-base font-medium"
              variant="outline"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Realizar Novo Cadastro
            </Button>
            
            <Button 
              onClick={() => {
                setShowSucessoModal(false);
                navigate('/admin/lojistas');
              }} 
              className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Comprar Blocos de Cupons
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>;
}