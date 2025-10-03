import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface Lojista {
  id: string;
  nome_loja: string;
}

interface VendaBlocosModalProps {
  lojista: Lojista;
  onClose: () => void;
  onSuccess: () => void;
}

export const VendaBlocosModal = ({ lojista, onClose, onSuccess }: VendaBlocosModalProps) => {
  const [quantidade, setQuantidade] = useState(1);
  const [valor, setValor] = useState(100);
  const [formaPagamento, setFormaPagamento] = useState('pix');
  const [vendedorNome, setVendedorNome] = useState('');
  const { toast } = useToast();

  const { mutate: venderBlocos, isPending } = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('vender_blocos_para_lojista_v2', {
        p_lojista_id: lojista.id,
        p_quantidade_blocos: quantidade,
        p_valor_total: valor * quantidade,
        p_forma_pagamento: formaPagamento,
      });
      
      if (error) throw new Error(error.message);
      
      // O retorno da função RPC é JSON, então verificamos se há erro
      if (typeof data === 'object' && data !== null && 'sucesso' in data) {
        if (!data.sucesso) {
          throw new Error((data as any).mensagem || 'Erro desconhecido na venda');
        }
      }
      
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Venda Realizada",
        description: `Venda de ${quantidade} bloco(s) para ${lojista.nome_loja} registrada com sucesso!`,
      });
      onSuccess();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na Venda",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (quantidade < 1) {
      toast({
        title: "Quantidade Inválida",
        description: "A quantidade deve ser pelo menos 1 bloco.",
        variant: "destructive",
      });
      return;
    }
    
    if (valor <= 0) {
      toast({
        title: "Valor Inválido",
        description: "O valor por bloco deve ser maior que zero.",
        variant: "destructive",
      });
      return;
    }
    
    venderBlocos();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Vender Blocos para {lojista.nome_loja}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quantidade">Quantidade de Blocos</Label>
            <Input
              id="quantidade"
              type="number"
              value={quantidade}
              onChange={(e) => setQuantidade(parseInt(e.target.value) || 1)}
              min="1"
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              Total de {(quantidade * 100).toLocaleString()} cupons.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor">Valor por Bloco (R$)</Label>
            <Input
              id="valor"
              type="number"
              step="0.01"
              value={valor}
              onChange={(e) => setValor(parseFloat(e.target.value) || 0)}
              min="0.01"
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label>Forma de Pagamento</Label>
            <Select value={formaPagamento} onValueChange={setFormaPagamento} disabled={isPending}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="cartao">Cartão</SelectItem>
                <SelectItem value="boleto">Boleto</SelectItem>
                <SelectItem value="transferencia">Transferência</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendedor">Nome do Vendedor (Opcional)</Label>
            <Input
              id="vendedor"
              type="text"
              value={vendedorNome}
              onChange={(e) => setVendedorNome(e.target.value)}
              placeholder="Digite o nome do vendedor"
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              Informe quem realizou esta venda física
            </p>
          </div>

          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Quantidade:</span>
                  <span>{quantidade} bloco(s)</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Cupons totais:</span>
                  <span>{(quantidade * 100).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Valor por bloco:</span>
                  <span>R$ {valor.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold border-t pt-2">
                  <span>Total a Pagar:</span>
                  <span>R$ {(quantidade * valor).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="flex-1"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                'Confirmar Venda'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};