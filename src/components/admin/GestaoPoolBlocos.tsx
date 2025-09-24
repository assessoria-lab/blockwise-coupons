import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Package, 
  Plus, 
  Loader2, 
  Info, 
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

const GestaoPoolBlocos = () => {
  const [quantidadeBlocos, setQuantidadeBlocos] = useState(100);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCreate = async () => {
    if (quantidadeBlocos <= 0) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "A quantidade de blocos deve ser maior que zero.",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate API call - replace with actual Supabase RPC call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Blocos criados com sucesso!",
        description: `${quantidadeBlocos} blocos criados. Total: ${(quantidadeBlocos * 100).toLocaleString('pt-BR')} cupons sequenciais.`,
      });
      
      // Reset form
      setQuantidadeBlocos(100);
    } catch (error) {
      toast({
        variant: "destructive", 
        title: "Erro ao criar blocos",
        description: "Ocorreu um erro ao criar os blocos. Tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const totalCupons = quantidadeBlocos * 100;
  const estimatedId = `BL${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_${String(Math.floor(Math.random() * 999999)).padStart(6, '0')}`;

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Package className="h-6 w-6" />
          Gestão do Pool de Blocos
        </h2>
        <p className="text-muted-foreground mt-1">
          Criar novos blocos de cupons no sistema
        </p>
      </div>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Criar Novos Blocos no Pool
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Form Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Quantidade de blocos
              </label>
              <Input
                type="number"
                value={quantidadeBlocos}
                onChange={(e) => setQuantidadeBlocos(parseInt(e.target.value) || 1)}
                min="1"
                max="10000"
                disabled={isLoading}
                className="text-lg"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Total de cupons
              </label>
              <div className="p-3 bg-accent rounded-lg border">
                <div className="text-2xl font-bold text-foreground">
                  {totalCupons.toLocaleString('pt-BR')}
                </div>
              </div>
            </div>
            
            <Button 
              onClick={handleCreate} 
              disabled={isLoading || quantidadeBlocos <= 0} 
              className="h-12 bg-gradient-primary hover:opacity-90 transition-opacity"
              size="lg"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="animate-spin h-4 w-4" />
                  <span>Criando...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Criar Blocos</span>
                </div>
              )}
            </Button>
          </div>

          {/* Preview Section */}
          <div className="p-4 bg-muted rounded-lg border">
            <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Prévia da Criação
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">ID exemplo do bloco:</span>
                <div className="font-mono font-bold text-foreground">{estimatedId}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Range de cupons:</span>
                <div className="font-mono font-bold text-foreground">
                  CP000001219501 - CP000001{(219501 + totalCupons - 1).toString().padStart(6, '0')}
                </div>
              </div>
            </div>
          </div>

          {/* Info Alerts */}
          <div className="space-y-3">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Numeração Sequencial:</strong> Cada cupom recebe uma numeração única e global, 
                garantida pelo banco de dados. A sequência nunca se repete.
              </AlertDescription>
            </Alert>
            
            <Alert>
              <Package className="h-4 w-4" />
              <AlertDescription>
                <strong>Estrutura do Bloco:</strong> Cada bloco contém exatamente 100 cupons sequenciais. 
                Após a criação, os blocos ficam no "Pool Geral" aguardando compra por lojistas.
              </AlertDescription>
            </Alert>
            
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Atenção:</strong> A criação de blocos é irreversível. Certifique-se da quantidade 
                antes de confirmar a operação.
              </AlertDescription>
            </Alert>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <Badge 
              variant="outline" 
              className="cursor-pointer hover:bg-accent" 
              onClick={() => setQuantidadeBlocos(50)}
            >
              50 blocos
            </Badge>
            <Badge 
              variant="outline" 
              className="cursor-pointer hover:bg-accent"
              onClick={() => setQuantidadeBlocos(100)}
            >
              100 blocos
            </Badge>
            <Badge 
              variant="outline" 
              className="cursor-pointer hover:bg-accent"
              onClick={() => setQuantidadeBlocos(500)}
            >
              500 blocos
            </Badge>
            <Badge 
              variant="outline" 
              className="cursor-pointer hover:bg-accent"
              onClick={() => setQuantidadeBlocos(1000)}
            >
              1.000 blocos
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Card */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Estatísticas do Pool</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-pool-available-bg rounded-lg">
              <div className="text-2xl font-bold text-pool-available">1.250</div>
              <div className="text-sm text-muted-foreground">Blocos Disponíveis</div>
            </div>
            <div className="text-center p-4 bg-lojista-blocks-bg rounded-lg">
              <div className="text-2xl font-bold text-lojista-blocks">850</div>
              <div className="text-sm text-muted-foreground">Blocos Vendidos</div>
            </div>
            <div className="text-center p-4 bg-success-bg rounded-lg">
              <div className="text-2xl font-bold text-success">59.5%</div>
              <div className="text-sm text-muted-foreground">Taxa de Venda</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GestaoPoolBlocos;