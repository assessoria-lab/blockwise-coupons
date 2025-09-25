import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Receipt, ChevronLeft, Plus, CheckCircle, ShoppingCart, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

interface FormData {
  nome: string;
  cpf: string;
  telefone: string;
  cidade: string;
  valor_compra: string;
  lojista_id: string;
  tipo_cliente: string;
}

const vendaSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cpf: z.string().min(11, 'CPF deve ter 11 dígitos').regex(/^\d+$/, 'Apenas números'),
  telefone: z.string().optional(),
  cidade: z.string().optional(),
  valor_compra: z.string().min(1, 'Valor da compra é obrigatório'),
  lojista_id: z.string().min(1, 'Selecione uma loja'),
  tipo_cliente: z.string()
});

const RegistroVendas = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showSucessoModal, setShowSucessoModal] = useState(false);
  const [resultadoVenda, setResultadoVenda] = useState<any>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<FormData>({
    nome: '',
    cpf: '',
    telefone: '',
    cidade: '',
    valor_compra: '',
    lojista_id: '',
    tipo_cliente: 'varejo'
  });

  // Buscar lojas disponíveis
  const { data: lojistas, isLoading: loadingLojistas } = useQuery({
    queryKey: ['lojistas-ativas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lojistas')
        .select(`
          id,
          nome_loja,
          cidade,
          shopping
        `)
        .eq('status', 'ativo');

      if (error) throw error;

      // Buscar cupons disponíveis para cada lojista
      const lojistasComCupons = await Promise.all(
        (data || []).map(async (lojista) => {
          const { data: blocos } = await supabase
            .from('blocos')
            .select('cupons_disponiveis')
            .eq('lojista_id', lojista.id)
            .eq('status', 'vendido');

          const cupons_disponiveis = blocos?.reduce((acc, bloco) => acc + (bloco.cupons_disponiveis || 0), 0) || 0;

          return {
            ...lojista,
            cupons_disponiveis
          };
        })
      );

      return lojistasComCupons.filter(l => l.cupons_disponiveis > 0);
    }
  });

  // Mutation para atribuir cupons
  const atribuirCuponsMutation = useMutation({
    mutationFn: async (dados: FormData) => {
      const { data, error } = await supabase.rpc('atribuir_cupons_para_cliente', {
        p_lojista_id: dados.lojista_id,
        p_cliente_cpf: dados.cpf.replace(/\D/g, ''),
        p_cliente_nome: dados.nome,
        p_cliente_telefone: dados.telefone,
        p_valor_compra: parseFloat(dados.valor_compra),
        p_tipo_cliente: dados.tipo_cliente
      });

      if (error) throw error;

      const result = data as any;
      if (!result.sucesso) {
        throw new Error(result.mensagem);
      }

      return result;
    },
    onSuccess: (data) => {
      // Salva o resultado para o modal
      setResultadoVenda(data);
      
      // Mostra o modal de sucesso
      setShowSucessoModal(true);

      toast({
        title: "✅ Cupons atribuídos com sucesso!",
        description: data.mensagem,
      });
      
      // Limpa o formulário
      setFormData({
        nome: '',
        cpf: '',
        telefone: '',
        cidade: '',
        valor_compra: '',
        lojista_id: '',
        tipo_cliente: 'varejo'
      });
      setErrors({});
      
      // Invalida queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['estatisticas-clientes'] });
      queryClient.invalidateQueries({ queryKey: ['lojistas-ativas'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atribuir cupons",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      // Validação com zod
      vendaSchema.parse(formData);
      
      const valorCompra = parseFloat(formData.valor_compra);
      if (valorCompra < 100) {
        setErrors({ valor_compra: 'O valor mínimo para gerar cupom é R$ 100,00.' });
        return;
      }

      atribuirCuponsMutation.mutate(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const cuponsCalculados = formData.valor_compra ? Math.floor(parseFloat(formData.valor_compra) / 100) : 0;
  const lojistaSelecionada = lojistas?.find(l => l.id === formData.lojista_id);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/')}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Voltar ao Painel
              </Button>
              <div className="flex items-center gap-2">
                <Receipt className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-semibold">Registro de Vendas</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Atribuir Cupons para Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Dados do Cliente */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Dados do Cliente</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nome">Nome do Cliente *</Label>
                      <Input
                        id="nome"
                        value={formData.nome}
                        onChange={(e) => handleInputChange('nome', e.target.value)}
                        placeholder="Nome completo"
                        className={errors.nome ? 'border-red-500' : ''}
                      />
                      {errors.nome && <p className="text-sm text-red-500 mt-1">{errors.nome}</p>}
                    </div>
                    
                    <div>
                      <Label htmlFor="cpf">CPF *</Label>
                      <Input
                        id="cpf"
                        value={formData.cpf}
                        onChange={(e) => handleInputChange('cpf', e.target.value.replace(/\D/g, ''))}
                        placeholder="000.000.000-00"
                        maxLength={11}
                        className={errors.cpf ? 'border-red-500' : ''}
                      />
                      {errors.cpf && <p className="text-sm text-red-500 mt-1">{errors.cpf}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="telefone">Telefone</Label>
                      <Input
                        id="telefone"
                        value={formData.telefone}
                        onChange={(e) => handleInputChange('telefone', e.target.value)}
                        placeholder="(62) 99999-9999"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="cidade">Cidade</Label>
                      <Input
                        id="cidade"
                        value={formData.cidade}
                        onChange={(e) => handleInputChange('cidade', e.target.value)}
                        placeholder="Cidade do cliente"
                      />
                    </div>
                  </div>
                </div>

                {/* Dados da Venda */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Dados da Venda</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="valor_compra">Valor da Compra (R$) *</Label>
                      <Input
                        id="valor_compra"
                        type="number"
                        step="0.01"
                        min="100"
                        value={formData.valor_compra}
                        onChange={(e) => handleInputChange('valor_compra', e.target.value)}
                        placeholder="100.00"
                        className={errors.valor_compra ? 'border-red-500' : ''}
                      />
                      {errors.valor_compra && <p className="text-sm text-red-500 mt-1">{errors.valor_compra}</p>}
                    </div>
                    
                    <div>
                      <Label htmlFor="tipo_cliente">Tipo de Cliente</Label>
                      <Select value={formData.tipo_cliente} onValueChange={(value) => handleInputChange('tipo_cliente', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="varejo">Varejo</SelectItem>
                          <SelectItem value="atacado">Atacado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="lojista_id">Loja *</Label>
                    <Select value={formData.lojista_id} onValueChange={(value) => handleInputChange('lojista_id', value)}>
                      <SelectTrigger className={errors.lojista_id ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Selecione uma loja" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingLojistas ? (
                          <div className="p-2 text-sm text-muted-foreground text-center">
                            Carregando lojas...
                          </div>
                        ) : lojistas?.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground text-center">
                            Nenhuma loja com cupons disponíveis
                          </div>
                        ) : (
                          lojistas?.map((lojista) => (
                            <SelectItem key={lojista.id} value={lojista.id}>
                              {lojista.nome_loja} - {lojista.cidade} ({lojista.cupons_disponiveis} cupons)
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {errors.lojista_id && <p className="text-sm text-red-500 mt-1">{errors.lojista_id}</p>}
                  </div>
                </div>

                {/* Resumo */}
                {cuponsCalculados > 0 && lojistaSelecionada && (
                  <Card className="bg-muted/50">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Resumo da Atribuição</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Cupons a serem gerados:</p>
                          <p className="font-medium">{cuponsCalculados} cupons</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Loja selecionada:</p>
                          <p className="font-medium">{lojistaSelecionada.nome_loja}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Cupons disponíveis na loja:</p>
                          <p className="font-medium">{lojistaSelecionada.cupons_disponiveis} cupons</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Status:</p>
                          <p className={`font-medium ${lojistaSelecionada.cupons_disponiveis >= cuponsCalculados ? 'text-green-600' : 'text-red-600'}`}>
                            {lojistaSelecionada.cupons_disponiveis >= cuponsCalculados ? 'Disponível' : 'Insuficiente'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={atribuirCuponsMutation.isPending || cuponsCalculados === 0 || (lojistaSelecionada && lojistaSelecionada.cupons_disponiveis < cuponsCalculados)}
                    className="flex-1"
                  >
                    {atribuirCuponsMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Receipt className="mr-2 h-4 w-4" />
                        Atribuir Cupons
                      </>
                    )}
                  </Button>
                </div>
              </form>
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
              Cupons Atribuídos com Sucesso!
            </DialogTitle>
            <DialogDescription className="text-center text-base">
              {resultadoVenda?.quantidade_cupons || 0} cupons foram atribuídos para {resultadoVenda?.cliente_nome}. 
              O cliente já pode participar dos sorteios do Show de Prêmios.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-3 mt-6">
            <Button 
              onClick={() => {
                setShowSucessoModal(false);
                setResultadoVenda(null);
                // Permanece na mesma página para nova atribuição
              }} 
              className="w-full h-12 text-base font-medium"
              variant="outline"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Nova Atribuição
            </Button>
            
            <Button 
              onClick={() => {
                setShowSucessoModal(false);
                navigate('/?page=clientes');
              }} 
              className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Ver Gestão de Clientes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RegistroVendas;