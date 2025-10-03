import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { History, Calendar, User, ShoppingBag } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HistoricoAtribuicoesProps {
  lojistaId: string;
}

export const HistoricoAtribuicoes = ({ lojistaId }: HistoricoAtribuicoesProps) => {
  const { data: atribuicoes = [], isLoading } = useQuery({
    queryKey: ['historico-atribuicoes', lojistaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cupons')
        .select(`
          id,
          numero_formatado,
          valor_compra,
          data_atribuicao,
          status,
          clientes:cliente_id (
            id,
            nome,
            cpf,
            telefone
          )
        `)
        .eq('lojista_id', lojistaId)
        .eq('status', 'atribuido')
        .order('data_atribuicao', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });

  // Agrupar cupons por cliente e data de atribuição
  const atribuicoesAgrupadas = atribuicoes.reduce((acc: any[], cupom: any) => {
    const cliente = cupom.clientes;
    const dataAtribuicao = cupom.data_atribuicao;
    
    const key = `${cliente?.id}-${dataAtribuicao}`;
    const existing = acc.find(item => item.key === key);
    
    if (existing) {
      existing.cupons.push(cupom);
      existing.quantidade++;
    } else {
      acc.push({
        key,
        cliente,
        dataAtribuicao,
        valorCompra: cupom.valor_compra,
        cupons: [cupom],
        quantidade: 1
      });
    }
    
    return acc;
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Atribuições
          </CardTitle>
          <CardDescription>Carregando histórico...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (atribuicoesAgrupadas.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Atribuições
          </CardTitle>
          <CardDescription>Nenhuma atribuição registrada ainda</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Histórico de Atribuições
        </CardTitle>
        <CardDescription>
          Últimas 50 atribuições de cupons realizadas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead className="text-right">Valor Compra</TableHead>
                <TableHead className="text-center">Cupons</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {atribuicoesAgrupadas.map((atribuicao) => (
                <TableRow key={atribuicao.key}>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">
                          {format(new Date(atribuicao.dataAtribuicao), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(atribuicao.dataAtribuicao), 'HH:mm:ss', { locale: ptBR })}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{atribuicao.cliente?.nome}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {atribuicao.cliente?.cpf}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {atribuicao.cliente?.telefone || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">
                        R$ {atribuicao.valorCompra.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="font-semibold">
                      {atribuicao.quantidade} {atribuicao.quantidade === 1 ? 'cupom' : 'cupons'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};