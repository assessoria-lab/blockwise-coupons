import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
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

  // Mock segmentos
  const segmentos = [
    { id: '1', nome: 'Alimentação', categoria: 'Varejo' },
    { id: '2', nome: 'Vestuário', categoria: 'Varejo' },
    { id: '3', nome: 'Eletrônicos', categoria: 'Varejo' },
  ];

  const salvarLojistaMutation = useMutation({
    mutationFn: async (data: Lojista) => {
      // Simulação de salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      return data;
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
                onChange={(e) => setFormData(prev => ({ ...prev, cnpj: e.target.value.replace(/\D/g, '').slice(0, 14) }))}
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
            <Select 
              value={formData.segmento} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, segmento: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um segmento" />
              </SelectTrigger>
              <SelectContent>
                {segmentos.map((segmento) => (
                  <SelectItem key={segmento.id} value={segmento.nome}>
                    {segmento.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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