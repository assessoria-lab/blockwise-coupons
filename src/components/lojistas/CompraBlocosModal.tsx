import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, CreditCard, Loader2, Package } from 'lucide-react';

interface CompraBlocosModalProps {
  lojistaId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface VendaBlocosResponse {
  sucesso: boolean;
  mensagem: string;
  blocos_transferidos: number;
  pagamento_id: string;
  valor_total: number;
}

export const CompraBlocosModal = ({ lojistaId, open, onOpenChange }: CompraBlocosModalProps) => {
  const [quantidade, setQuantidade] = useState(1);
  const [formaPagamento, setFormaPagamento] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const valorPorBloco = 50; // R$ 50 por bloco (100 cupons)
  const valorTotal = quantidade * valorPorBloco;

  const comprarBlocosMutation = useMutation({
    mutationFn: async () => {
      if (!formaPagamento) {
        throw new Error('Selecione uma forma de pagamento');
      }

      const { data, error } = await supabase.rpc('vender_blocos_para_lojista_v2', {
        p_lojista_id: lojistaId,
        p_quantidade_blocos: quantidade,
        p_valor_total: valorTotal,
        p_forma_pagamento: formaPagamento
      });

      if (error) throw error;
      
      const resultado = data as unknown as VendaBlocosResponse;
      if (!resultado?.sucesso) throw new Error(resultado?.mensagem || 'Erro na compra');

      return resultado;
    },
    onSuccess: (data) => {
      toast({
        title: "✅ Compra realizada!",
        description: `${data.blocos_transferidos} blocos adquiridos com sucesso. Total: R$ ${valorTotal.toFixed(2)}`,
      });
      
      // Invalidar queries para atualizar dados
      queryClient.invalidateQueries({ queryKey: ['cupons-stats'] });
      queryClient.invalidateQueries({ queryKey: ['lojistas'] });
      
      onOpenChange(false);
      setQuantidade(1);
      setFormaPagamento('');
    },
    onError: (error: any) => {
      toast({
        title: "❌ Erro na compra",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Comprar Blocos de Cupons
          </DialogTitle>
          <DialogDescription>
            Cada bloco contém 100 cupons para distribuir aos seus clientes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do produto */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="h-4 w-4" />
                Detalhes da compra
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Valor por bloco:</span>
                <span className="font-medium">R$ {valorPorBloco.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Cupons por bloco:</span>
                <span className="font-medium">100 cupons</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between font-medium">
                  <span>Total de cupons:</span>
                  <span>{quantidade * 100} cupons</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Valor total:</span>
                  <span className="text-primary">R$ {valorTotal.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Formulário */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quantidade">Quantidade de blocos</Label>
              <Input
                id="quantidade"
                type="number"
                min="1"
                max="50"
                value={quantidade}
                onChange={(e) => setQuantidade(Math.max(1, parseInt(e.target.value) || 1))}
                className="text-center"
              />
              <p className="text-xs text-muted-foreground">
                Mínimo: 1 bloco | Máximo: 50 blocos
              </p>
            </div>

            <div className="space-y-2">
              <Label>Forma de pagamento</Label>
              <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a forma de pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      PIX
                    </div>
                  </SelectItem>
                  <SelectItem value="cartao_credito">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Cartão de Crédito
                    </div>
                  </SelectItem>
                  <SelectItem value="cartao_debito">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Cartão de Débito
                    </div>
                  </SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={comprarBlocosMutation.isPending}
            >
              Cancelar
            </Button>
            <Button 
              onClick={() => comprarBlocosMutation.mutate()}
              disabled={!formaPagamento || comprarBlocosMutation.isPending}
              className="flex-1"
            >
              {comprarBlocosMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Comprar {quantidade} {quantidade === 1 ? 'Bloco' : 'Blocos'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};