import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, CreditCard, Loader2, Package, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const valorPorBloco = 50; // R$ 50 por bloco (100 cupons)
  const valorTotal = quantidade * valorPorBloco;

  // Busca blocos disponíveis no pool
  const { data: blocosDisponiveis, isLoading: loadingBlocos } = useQuery({
    queryKey: ['blocos-pool'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('blocos')
        .select('*', { count: 'exact', head: true })
        .is('lojista_id', null)
        .eq('status', 'disponivel');

      if (error) throw error;
      return count || 0;
    },
    enabled: open,
  });

  useEffect(() => {
    if (blocosDisponiveis !== undefined && quantidade > blocosDisponiveis) {
      setQuantidade(Math.max(1, blocosDisponiveis));
    }
  }, [blocosDisponiveis, quantidade]);

  const comprarBlocosMutation = useMutation({
    mutationFn: async () => {
      // Validação final antes de processar
      if (!blocosDisponiveis || quantidade > blocosDisponiveis) {
        throw new Error('Não há blocos suficientes disponíveis no momento.');
      }

      const { data, error } = await supabase.functions.invoke('create-mercadopago-payment', {
        body: {
          lojistaId,
          quantidadeBlocos: quantidade,
          valorTotal,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Erro ao criar pagamento');

      console.log('Payment response:', data);

      // Redireciona para o checkout do Mercado Pago
      window.location.href = data.initPoint;
      return data;
    },
    onSuccess: (data) => {
      const modeMessage = data.testMode 
        ? "⚠️ MODO DE TESTE: Use um usuário de teste do Mercado Pago" 
        : "Você será redirecionado para o pagamento.";
      
      toast({
        title: "🔄 Redirecionando...",
        description: modeMessage,
        duration: 3000,
      });
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
          {/* Alerta de blocos insuficientes */}
          {loadingBlocos && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertTitle>Verificando disponibilidade...</AlertTitle>
              <AlertDescription>
                Aguarde enquanto verificamos os blocos disponíveis.
              </AlertDescription>
            </Alert>
          )}

          {!loadingBlocos && blocosDisponiveis === 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Blocos indisponíveis</AlertTitle>
              <AlertDescription>
                No momento não há blocos disponíveis para compra. Entre em contato com o administrador.
              </AlertDescription>
            </Alert>
          )}

          {!loadingBlocos && blocosDisponiveis !== undefined && blocosDisponiveis > 0 && blocosDisponiveis < 10 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Estoque baixo</AlertTitle>
              <AlertDescription>
                Apenas {blocosDisponiveis} bloco(s) disponível(is) no momento.
              </AlertDescription>
            </Alert>
          )}

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
                max={blocosDisponiveis || 50}
                value={quantidade}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  const maxVal = blocosDisponiveis || 50;
                  setQuantidade(Math.max(1, Math.min(val, maxVal)));
                }}
                className="text-center"
                disabled={loadingBlocos || !blocosDisponiveis}
              />
              <p className="text-xs text-muted-foreground">
                {loadingBlocos 
                  ? 'Verificando disponibilidade...' 
                  : `Disponível: ${blocosDisponiveis || 0} bloco(s)`
                }
              </p>
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
              disabled={comprarBlocosMutation.isPending || loadingBlocos || !blocosDisponiveis || blocosDisponiveis === 0}
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