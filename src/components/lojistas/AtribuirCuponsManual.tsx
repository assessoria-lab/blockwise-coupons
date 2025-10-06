import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Gift, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AtribuirCuponsManualProps {
  lojistaId: string;
  onSuccess?: () => void;
}

interface FormData {
  cpf: string;
  nome: string;
  telefone: string;
  estado: string;
  cidade: string;
  valor: number;
  tipoCliente: 'varejo' | 'atacado';
}

interface Estado {
  id: number;
  sigla: string;
  nome: string;
}

interface Cidade {
  id: number;
  nome: string;
}

export const AtribuirCuponsManual = ({ lojistaId, onSuccess }: AtribuirCuponsManualProps) => {
  const [formData, setFormData] = useState<FormData>({
    cpf: '',
    nome: '',
    telefone: '',
    estado: '',
    cidade: '',
    valor: 0,
    tipoCliente: 'varejo',
  });
  const [openEstado, setOpenEstado] = useState(false);
  const [openCidade, setOpenCidade] = useState(false);
  const { toast } = useToast();

  // Buscar estados da API do IBGE
  const { data: estados = [] } = useQuery<Estado[]>({
    queryKey: ['estados'],
    queryFn: async () => {
      const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome');
      return response.json();
    },
  });

  // Buscar cidades baseado no estado selecionado
  const { data: cidades = [] } = useQuery<Cidade[]>({
    queryKey: ['cidades', formData.estado],
    queryFn: async () => {
      if (!formData.estado) return [];
      const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${formData.estado}/municipios`);
      return response.json();
    },
    enabled: !!formData.estado,
  });

  // Limpar cidade quando estado mudar
  useEffect(() => {
    setFormData(prev => ({ ...prev, cidade: '' }));
  }, [formData.estado]);

  const { mutate: atribuirCupons, isPending } = useMutation({
    mutationFn: async (data: FormData) => {
      const cpfLimpo = data.cpf.replace(/\D/g, '');
      
      // A função RPC já cuida de criar/atualizar o cliente com privilégios elevados
      const { data: result, error } = await supabase.rpc('atribuir_cupons_para_cliente', {
        p_lojista_id: lojistaId,
        p_cliente_cpf: cpfLimpo,
        p_cliente_nome: data.nome,
        p_cliente_telefone: data.telefone || '',
        p_valor_compra: data.valor,
        p_cliente_estado: data.estado,
        p_cliente_cidade: data.cidade
      });
      
      if (error) throw new Error(error.message);
      
      // Verificar se houve erro na função RPC
      if (typeof result === 'object' && result !== null && 'sucesso' in result) {
        if (!(result as any).sucesso) {
          throw new Error((result as any).mensagem || 'Erro desconhecido na atribuição');
        }
      }
      
      return result;
    },
    onSuccess: (data) => {
      if (typeof data === 'object' && data !== null) {
        toast({
          title: "Cupons Atribuídos",
          description: `${(data as any).cupons_atribuidos || 0} cupons ${formData.tipoCliente} atribuídos para ${(data as any).cliente_nome || formData.nome}!`,
        });
      } else {
        toast({
          title: "Cupons Atribuídos",
          description: "Cupons atribuídos com sucesso!",
        });
      }
      
      // Limpar formulário
      setFormData({
        cpf: '',
        nome: '',
        telefone: '',
        estado: '',
        cidade: '',
        valor: 0,
        tipoCliente: 'varejo',
      });
      
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na Atribuição",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações básicas
    if (!formData.cpf.trim()) {
      toast({
        title: "CPF Obrigatório",
        description: "Por favor, informe o CPF do cliente.",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.nome.trim()) {
      toast({
        title: "Nome Obrigatório",
        description: "Por favor, informe o nome do cliente.",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.telefone.trim()) {
      toast({
        title: "Telefone Obrigatório",
        description: "Por favor, informe o telefone do cliente.",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.estado.trim()) {
      toast({
        title: "Estado Obrigatório",
        description: "Por favor, selecione o estado do cliente.",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.cidade.trim()) {
      toast({
        title: "Cidade Obrigatória",
        description: "Por favor, selecione a cidade do cliente.",
        variant: "destructive",
      });
      return;
    }
    
    if (formData.valor < 100) {
      toast({
        title: "Valor Mínimo",
        description: "O valor da compra deve ser de pelo menos R$ 100,00.",
        variant: "destructive",
      });
      return;
    }
    
    atribuirCupons(formData);
  };

  const cuponsCalculados = Math.floor(formData.valor / 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Atribuir Cupons Manualmente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF do Cliente</Label>
              <Input
                id="cpf"
                value={formData.cpf}
                onChange={(e) => setFormData(prev => ({ ...prev, cpf: e.target.value }))}
                placeholder="000.000.000-00"
                disabled={isPending}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Cliente</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Nome completo"
                disabled={isPending}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone *</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                placeholder="(11) 99999-9999"
                disabled={isPending}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="estado">Estado *</Label>
              <Popover open={openEstado} onOpenChange={setOpenEstado}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openEstado}
                    className="w-full justify-between"
                    disabled={isPending}
                  >
                    {formData.estado
                      ? estados.find((estado) => estado.sigla === formData.estado)?.nome
                      : "Selecione o estado..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 z-50" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar estado..." />
                    <CommandList>
                      <CommandEmpty>Nenhum estado encontrado.</CommandEmpty>
                      <CommandGroup>
                        {estados.map((estado) => (
                          <CommandItem
                            key={estado.id}
                            value={estado.nome}
                            onSelect={() => {
                              setFormData(prev => ({ ...prev, estado: estado.sigla }));
                              setOpenEstado(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.estado === estado.sigla ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {estado.nome} ({estado.sigla})
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cidade">Cidade *</Label>
            <Popover open={openCidade} onOpenChange={setOpenCidade}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCidade}
                  className="w-full justify-between"
                  disabled={isPending || !formData.estado}
                >
                  {formData.cidade || "Selecione a cidade..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 z-50" align="start">
                <Command>
                  <CommandInput placeholder="Buscar cidade..." />
                  <CommandList>
                    <CommandEmpty>Nenhuma cidade encontrada.</CommandEmpty>
                    <CommandGroup>
                      {cidades.map((cidade) => (
                        <CommandItem
                          key={cidade.id}
                          value={cidade.nome}
                          onSelect={(currentValue) => {
                            setFormData(prev => ({ ...prev, cidade: currentValue }));
                            setOpenCidade(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.cidade === cidade.nome ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {cidade.nome}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor">Valor da Compra (R$) *</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                value={formData.valor || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, valor: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
                min="100"
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipoCliente">Tipo de Cliente *</Label>
              <Select 
                value={formData.tipoCliente} 
                onValueChange={(value: 'varejo' | 'atacado') => setFormData(prev => ({ ...prev, tipoCliente: value }))}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="varejo">Cliente Varejo</SelectItem>
                  <SelectItem value="atacado">Cliente Atacado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.valor >= 100 && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm font-medium">
                Cupons a serem atribuídos: <span className="text-primary font-bold">{cuponsCalculados}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                1 cupom para cada R$ 100,00 de compra • Tipo: <span className="font-semibold capitalize">{formData.tipoCliente}</span>
              </p>
            </div>
          )}

          <Button type="submit" disabled={isPending || formData.valor < 100} className="w-full">
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Atribuindo...
              </>
            ) : (
              'Atribuir Cupons'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};