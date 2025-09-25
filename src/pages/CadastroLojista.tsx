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
import { Loader2, Store, ArrowLeft } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex flex-col">
      {/* Header com logo */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Store className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Sistema de Cupons
                </h1>
                <p className="text-sm text-gray-600">
                  Cadastro de Novo Lojista
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Formulário */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-3">
              <Store className="h-8 w-8 text-primary" />
              Cadastro de Lojista
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Preencha os dados para cadastrar um novo lojista no sistema
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Dados básicos */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    Dados da Loja
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="nome_loja"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Nome da Loja *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: Loja da Moda"
                              {...field}
                              className="bg-white"
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
                          <FormLabel>CNPJ *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="00.000.000/0000-00"
                              {...field}
                              className="bg-white"
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
                          <FormLabel>Segmento</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: Moda, Alimentação"
                              {...field}
                              className="bg-white"
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
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    Localização
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="cidade"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Cidade *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: Goiânia"
                              {...field}
                              className="bg-white"
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
                          <FormLabel>Estado *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white">
                                <SelectValue placeholder="UF" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
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
                        <FormLabel>Endereço</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Rua, número, bairro"
                            {...field}
                            className="bg-white"
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
                        <FormLabel>Shopping</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Flamboyant Shopping"
                            {...field}
                            className="bg-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Contato */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    Dados de Contato
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="telefone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="(62) 3333-4444"
                              {...field}
                              className="bg-white"
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
                          <FormLabel>WhatsApp</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="(62) 99999-8888"
                              {...field}
                              className="bg-white"
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
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="contato@loja.com.br"
                            {...field}
                            className="bg-white"
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
                        <FormLabel>Nome do Responsável</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nome do responsável pela loja"
                            {...field}
                            className="bg-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Observações */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    Informações Adicionais
                  </h3>
                  
                  <FormField
                    control={form.control}
                    name="observacoes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Informações adicionais sobre o lojista..."
                            {...field}
                            className="bg-white min-h-[100px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Botões */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6">
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
                    className="flex-1"
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
      </main>
    </div>
  );
}