import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, X } from 'lucide-react';
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

interface LojistaModalProps {
  lojista?: Lojista | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function LojistaModal({ lojista, isOpen, onClose, onSuccess }: LojistaModalProps) {
  const { toast } = useToast();
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
      if (lojista?.id) {
        // Atualizar
        const { error } = await supabase
          .from('lojistas')
          .update(data)
          .eq('id', lojista.id);
        
        if (error) throw error;
      } else {
        // Criar
        const { error } = await supabase
          .from('lojistas')
          .insert([data]);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lojistas'] });
      toast({
        title: lojista?.id ? "Lojista atualizado!" : "Lojista cadastrado!",
        description: `${formData.nome_loja} foi ${lojista?.id ? 'atualizado' : 'cadastrado'} com sucesso.`,
      });
      onSuccess();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar lojista",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  useEffect(() => {
    if (lojista) {
      setFormData(lojista);
    } else {
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
    }
    setErrors({});
  }, [lojista, isOpen]);

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {lojista?.id ? 'Editar Lojista' : 'Novo Lojista'}
          </DialogTitle>
          <DialogDescription>
            {lojista?.id ? 'Edite as informações do lojista' : 'Cadastre um novo lojista no sistema'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
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

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={salvarLojistaMutation.isPending}
          >
            {salvarLojistaMutation.isPending ? 'Salvando...' : (lojista?.id ? 'Atualizar' : 'Cadastrar')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}