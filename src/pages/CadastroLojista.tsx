import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Store, ArrowLeft, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Schema de validação
const lojistaSchema = z.object({
  nome_loja: z.string()
    .trim()
    .min(2, { message: "Nome da loja deve ter pelo menos 2 caracteres" })
    .max(100, { message: "Nome da loja deve ter no máximo 100 caracteres" }),
  
  cnpj: z.string()
    .trim()
    .min(14, { message: "CNPJ deve ter 14 dígitos" })
    .max(18, { message: "CNPJ inválido" })
    .regex(/^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$|^\d{14}$/, { message: "CNPJ deve estar no formato válido" }),
  
  cidade: z.string()
    .trim()
    .min(2, { message: "Cidade deve ter pelo menos 2 caracteres" })
    .max(100, { message: "Cidade deve ter no máximo 100 caracteres" }),
  
  estado: z.string()
    .trim()
    .length(2, { message: "Estado deve ter 2 caracteres (ex: GO)" })
    .regex(/^[A-Z]{2}$/, { message: "Estado deve estar em maiúsculas (ex: GO)" }),
  
  endereco: z.string()
    .trim()
    .max(255, { message: "Endereço deve ter no máximo 255 caracteres" })
    .optional(),
  
  telefone: z.string()
    .trim()
    .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$|^\d{10,11}$/, { message: "Telefone deve estar no formato (XX) XXXX-XXXX ou (XX) XXXXX-XXXX" })
    .optional(),
  
  whatsapp: z.string()
    .trim()
    .regex(/^\(\d{2}\)\s\d{5}-\d{4}$|^\d{11}$/, { message: "WhatsApp deve estar no formato (XX) XXXXX-XXXX" })
    .optional(),
  
  email: z.string()
    .trim()
    .email({ message: "Email deve ter formato válido" })
    .max(255, { message: "Email deve ter no máximo 255 caracteres" })
    .optional(),
  
  nome_responsavel: z.string()
    .trim()
    .max(100, { message: "Nome do responsável deve ter no máximo 100 caracteres" })
    .optional(),
  
  segmento: z.string()
    .trim()
    .max(100, { message: "Segmento deve ter no máximo 100 caracteres" })
    .optional(),
  
  shopping: z.string()
    .trim()
    .max(100, { message: "Shopping deve ter no máximo 100 caracteres" })
    .optional(),
  
  observacoes: z.string()
    .trim()
    .max(500, { message: "Observações devem ter no máximo 500 caracteres" })
    .optional(),
});

type LojistaFormData = z.infer<typeof lojistaSchema>;

export default function CadastroLojista() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<LojistaFormData>({
    resolver: zodResolver(lojistaSchema),
    defaultValues: {
      nome_loja: '',
      cnpj: '',
      cidade: '',
      estado: 'GO',
      endereco: '',
      telefone: '',
      whatsapp: '',
      email: '',
      nome_responsavel: '',
      segmento: '',
      shopping: '',
      observacoes: '',
    },
  });

  const onSubmit = async (data: LojistaFormData) => {
    setIsLoading(true);
    
    try {
      // Limpar e formatar CNPJ (remover pontos, barras e traços)
      const cnpjLimpo = data.cnpj.replace(/[^\d]/g, '');
      
      const lojistaData = {
        nome_loja: data.nome_loja,
        cnpj: cnpjLimpo,
        cidade: data.cidade,
        estado: data.estado.toUpperCase(),
        endereco: data.endereco || null,
        telefone: data.telefone || null,
        whatsapp: data.whatsapp || null,
        email: data.email || null,
        nome_responsavel: data.nome_responsavel || null,
        segmento: data.segmento || null,
        shopping: data.shopping || null,
        observacoes: data.observacoes || null,
        status: 'ativo',
      };

      const { error } = await supabase
        .from('lojistas')
        .insert([lojistaData]);

      if (error) {
        if (error.code === '23505') { // Unique violation
          toast({
            title: "Erro no cadastro",
            description: "Já existe um lojista cadastrado com este CNPJ.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: "✅ Lojista cadastrado com sucesso!",
        description: `${data.nome_loja} foi cadastrado no sistema.`,
        variant: "default",
      });

      // Reset form
      form.reset();
      
      // Redirect to admin after 2 seconds
      setTimeout(() => {
        navigate('/admin/lojistas');
      }, 2000);

    } catch (error) {
      console.error('Erro ao cadastrar lojista:', error);
      toast({
        title: "Erro no cadastro",
        description: "Ocorreu um erro ao cadastrar o lojista. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
        <div className="max-w-4xl mx-auto">
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
                    Preencha os dados para cadastrar um novo lojista no sistema
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  {/* Dados básicos */}
                  <div className="space-y-4">
                    <div className="pb-3 border-b border-border">
                      <h3 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        Dados da Loja
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Informações básicas sobre o estabelecimento
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="nome_loja"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel className="text-sm font-medium text-card-foreground">
                              Nome da Loja *
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ex: Loja da Moda"
                                {...field}
                                className="bg-background border-border"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="cnpj"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-card-foreground">
                              CNPJ *
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="00.000.000/0000-00"
                                {...field}
                                className="bg-background border-border"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="segmento"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-card-foreground">
                              Segmento
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ex: Moda, Alimentação"
                                {...field}
                                className="bg-background border-border"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Localização */}
                  <div className="space-y-4">
                    <div className="pb-3 border-b border-border">
                      <h3 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
                        <div className="w-2 h-2 bg-secondary rounded-full"></div>
                        Localização
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Endereço e localização do estabelecimento
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField
                        control={form.control}
                        name="cidade"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel className="text-sm font-medium text-card-foreground">
                              Cidade *
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ex: Goiânia"
                                {...field}
                                className="bg-background border-border"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="estado"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-card-foreground">
                              Estado *
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-background border-border">
                                  <SelectValue placeholder="UF" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-background border-border">
                                <SelectItem value="GO">GO</SelectItem>
                                <SelectItem value="SP">SP</SelectItem>
                                <SelectItem value="RJ">RJ</SelectItem>
                                <SelectItem value="MG">MG</SelectItem>
                                <SelectItem value="BA">BA</SelectItem>
                                <SelectItem value="PR">PR</SelectItem>
                                <SelectItem value="RS">RS</SelectItem>
                                <SelectItem value="PE">PE</SelectItem>
                                <SelectItem value="CE">CE</SelectItem>
                                <SelectItem value="PA">PA</SelectItem>
                                <SelectItem value="SC">SC</SelectItem>
                                <SelectItem value="PB">PB</SelectItem>
                                <SelectItem value="MA">MA</SelectItem>
                                <SelectItem value="ES">ES</SelectItem>
                                <SelectItem value="PI">PI</SelectItem>
                                <SelectItem value="AL">AL</SelectItem>
                                <SelectItem value="RN">RN</SelectItem>
                                <SelectItem value="MT">MT</SelectItem>
                                <SelectItem value="MS">MS</SelectItem>
                                <SelectItem value="DF">DF</SelectItem>
                                <SelectItem value="SE">SE</SelectItem>
                                <SelectItem value="AM">AM</SelectItem>
                                <SelectItem value="RO">RO</SelectItem>
                                <SelectItem value="AC">AC</SelectItem>
                                <SelectItem value="AP">AP</SelectItem>
                                <SelectItem value="RR">RR</SelectItem>
                                <SelectItem value="TO">TO</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="endereco"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-card-foreground">
                            Endereço
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Rua, número, bairro"
                              {...field}
                              className="bg-background border-border"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="shopping"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-card-foreground">
                            Shopping
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: Flamboyant Shopping"
                              {...field}
                              className="bg-background border-border"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Contato */}
                  <div className="space-y-4">
                    <div className="pb-3 border-b border-border">
                      <h3 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
                        <div className="w-2 h-2 bg-accent rounded-full"></div>
                        Dados de Contato
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Informações para comunicação com o lojista
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="telefone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-card-foreground">
                              Telefone
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="(62) 3333-4444"
                                {...field}
                                className="bg-background border-border"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="whatsapp"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-card-foreground">
                              WhatsApp
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="(62) 99999-8888"
                                {...field}
                                className="bg-background border-border"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-card-foreground">
                            Email
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="contato@loja.com.br"
                              {...field}
                              className="bg-background border-border"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="nome_responsavel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-card-foreground">
                            Nome do Responsável
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Nome do responsável pela loja"
                              {...field}
                              className="bg-background border-border"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Observações */}
                  <div className="space-y-4">
                    <div className="pb-3 border-b border-border">
                      <h3 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                        Informações Adicionais
                      </h3>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="observacoes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-card-foreground">
                            Observações
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Informações adicionais sobre o lojista..."
                              {...field}
                              className="bg-background border-border min-h-[100px] resize-none"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Botões */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-border">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate(-1)}
                      className="flex-1"
                      disabled={isLoading}
                    >
                      Cancelar
                    </Button>
                    
                    <Button
                      type="submit"
                      className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                      disabled={isLoading}
                    >
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isLoading ? 'Cadastrando...' : 'Cadastrar Lojista'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}