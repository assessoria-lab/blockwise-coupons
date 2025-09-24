import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Search, Package, Users, Calendar, Phone } from 'lucide-react';

interface Cupom {
  id: string;
  numero_formatado: string;
  numero_cupom: number;
  status: string;
  valor_compra?: number;
  data_atribuicao?: string;
  cliente?: {
    nome: string;
    cpf: string;
    telefone?: string;
  };
}

interface DadosBlocoRaw {
  bloco_id: string;
  numero_bloco: string;
  status: string;
  cupons_no_bloco: number;
  cupons_atribuidos: number;
  cupons_disponiveis: number;
  data_venda?: string;
  lojista_id?: string;
  lojista_nome?: string;
  lojista_whatsapp?: string;
  cupons: any; // JSON from database
}

interface DadosBloco {
  bloco_id: string;
  numero_bloco: string;
  status: string;
  cupons_no_bloco: number;
  cupons_atribuidos: number;
  cupons_disponiveis: number;
  data_venda?: string;
  lojista_id?: string;
  lojista_nome?: string;
  lojista_whatsapp?: string;
  cupons: Cupom[];
}

const RastreamentoPorBloco = () => {
  const [numeroBloco, setNumeroBloco] = useState('');
  const [buscarBloco, setBuscarBloco] = useState(false);
  const { toast } = useToast();

  const { data: dadosBloco, isLoading, error } = useQuery<DadosBloco>({
    queryKey: ['bloco-detalhes', numeroBloco],
    queryFn: async (): Promise<DadosBloco> => {
      const { data, error } = await supabase.rpc('buscar_detalhes_bloco', {
        p_numero_bloco: numeroBloco.trim()
      });
      
      if (error) throw new Error(error.message);
      if (!data || data.length === 0) throw new Error('Bloco não encontrado');
      
      const rawData = data[0] as DadosBlocoRaw;
      
      // Transform the raw data to match our interface
      const transformedData: DadosBloco = {
        bloco_id: rawData.bloco_id,
        numero_bloco: rawData.numero_bloco,
        status: rawData.status,
        cupons_no_bloco: rawData.cupons_no_bloco,
        cupons_atribuidos: rawData.cupons_atribuidos,
        cupons_disponiveis: rawData.cupons_disponiveis,
        data_venda: rawData.data_venda,
        lojista_id: rawData.lojista_id,
        lojista_nome: rawData.lojista_nome,
        lojista_whatsapp: rawData.lojista_whatsapp,
        cupons: Array.isArray(rawData.cupons) ? rawData.cupons : []
      };
      
      return transformedData;
    },
    enabled: buscarBloco && !!numeroBloco.trim(),
    retry: false
  });

  const handleBuscar = () => {
    if (!numeroBloco.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, digite o número do bloco",
        variant: "destructive"
      });
      return;
    }
    setBuscarBloco(true);
  };

  const getStatusColor = (status: string) => {
    const statusMap = {
      'disponivel': 'bg-blue-100 text-blue-800',
      'vendido': 'bg-yellow-100 text-yellow-800',
      'atribuido': 'bg-green-100 text-green-800',
      'utilizado': 'bg-purple-100 text-purple-800',
      'cancelado': 'bg-red-100 text-red-800'
    };
    return statusMap[status as keyof typeof statusMap] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const statusMap = {
      'disponivel': 'Disponível',
      'vendido': 'Com Lojista',
      'atribuido': 'Atribuído',
      'utilizado': 'Utilizado',
      'cancelado': 'Cancelado'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  if (error) {
    toast({
      title: "Erro",
      description: error.message,
      variant: "destructive"
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Rastreamento por Bloco
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Digite o número do bloco (ex: BL20241224_000001)"
              value={numeroBloco}
              onChange={(e) => setNumeroBloco(e.target.value)}
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleBuscar()}
            />
            <Button onClick={handleBuscar} disabled={isLoading}>
              <Search className="h-4 w-4 mr-2" />
              {isLoading ? 'Buscando...' : 'Rastrear'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {dadosBloco && (
        <div className="space-y-6">
          {/* Informações do Bloco */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Bloco</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Número do Bloco</label>
                    <p className="font-mono text-lg font-bold">{dadosBloco.numero_bloco}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status Atual</label>
                    <div className="mt-1">
                      <Badge className={getStatusColor(dadosBloco.status)}>
                        {getStatusText(dadosBloco.status)}
                      </Badge>
                    </div>
                  </div>
                  {dadosBloco.lojista_nome && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Lojista</label>
                      <p className="font-medium">{dadosBloco.lojista_nome}</p>
                      {dadosBloco.lojista_whatsapp && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {dadosBloco.lojista_whatsapp}
                        </p>
                      )}
                    </div>
                  )}
                  {dadosBloco.data_venda && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Data da Venda</label>
                      <p className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(dadosBloco.data_venda).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Cupons do Bloco</label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <div className="text-center p-3 bg-secondary rounded-lg">
                        <div className="text-2xl font-bold">{dadosBloco.cupons_no_bloco}</div>
                        <div className="text-xs text-muted-foreground">Total</div>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">{dadosBloco.cupons_disponiveis}</div>
                        <div className="text-xs text-muted-foreground">Disponíveis</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{dadosBloco.cupons_atribuidos}</div>
                        <div className="text-xs text-muted-foreground">Atribuídos</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Utilização</label>
                    <div className="flex items-center gap-2 mt-2">
                      <Progress 
                        value={(dadosBloco.cupons_atribuidos / dadosBloco.cupons_no_bloco) * 100}
                        className="flex-1" 
                      />
                      <span className="text-sm font-medium">
                        {Math.round((dadosBloco.cupons_atribuidos / dadosBloco.cupons_no_bloco) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Cupons do Bloco */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Cupons deste Bloco</span>
                <Badge variant="outline">{dadosBloco.cupons?.length || 0} cupons</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {dadosBloco.cupons?.map((cupom) => (
                  <div
                    key={cupom.numero_cupom}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-medium">
                          {cupom.numero_formatado}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          #{cupom.numero_cupom}
                        </Badge>
                        <Badge className={getStatusColor(cupom.status)}>
                          {getStatusText(cupom.status)}
                        </Badge>
                      </div>
                      {cupom.cliente && (
                        <div className="text-sm text-muted-foreground">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {cupom.cliente.nome}
                            </span>
                            {cupom.valor_compra && (
                              <span>
                                Compra: R$ {cupom.valor_compra.toFixed(2)}
                              </span>
                            )}
                            {cupom.data_atribuicao && (
                              <span>
                                {new Date(cupom.data_atribuicao).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default RastreamentoPorBloco;