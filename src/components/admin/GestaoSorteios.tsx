import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Download, 
  Calendar, 
  Trophy, 
  Users, 
  Award,
  Plus,
  FileText,
  Target
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { generateCuponsPDF } from '@/utils/pdfGenerator';

interface Ganhador {
  id: string;
  numero_cupom: string;
  nome_cliente: string;
  cpf_cliente: string;
  nome_loja: string;
  premio: string;
  valor_premio: number;
  data_sorteio: string;
  tipo_sorteio: 'mensal' | 'semanal' | 'especial';
}

const GestaoSorteios = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [ganhadores, setGanhadores] = useState<Ganhador[]>([]);
  const [filtroData, setFiltroData] = useState({
    data_inicio: '',
    data_fim: '',
    tipo_download: 'todos' // 'todos' | 'intervalo'
  });

  const [novoGanhador, setNovoGanhador] = useState({
    numero_cupom: '',
    premio: '',
    valor_premio: 0,
    tipo_sorteio: 'semanal' as 'mensal' | 'semanal' | 'especial'
  });

  // Buscar dados dos ganhadores
  useEffect(() => {
    fetchGanhadores();
  }, []);

  const fetchGanhadores = async () => {
    try {
      const { data, error } = await supabase
        .from('ganhadores_sorteios')
        .select(`
          *,
          cupons(numero_formatado, clientes(nome, cpf)),
          lojistas(nome_loja)
        `)
        .order('data_sorteio', { ascending: false });

      if (error) throw error;

      const ganhadoresFormatados = data?.map(item => ({
        id: item.id,
        numero_cupom: item.numero_cupom,
        nome_cliente: item.cupons?.clientes?.nome || 'N/A',
        cpf_cliente: item.cupons?.clientes?.cpf || 'N/A',
        nome_loja: item.lojistas?.nome_loja || 'N/A',
        premio: item.premio,
        valor_premio: item.valor_premio,
        data_sorteio: item.data_sorteio,
        tipo_sorteio: item.tipo_sorteio as 'mensal' | 'semanal' | 'especial'
      })) || [];

      setGanhadores(ganhadoresFormatados);
    } catch (error) {
      console.error('Erro ao buscar ganhadores:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar a lista de ganhadores.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadCupons = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('cupons')
        .select(`
          numero_formatado,
          data_atribuicao,
          valor_compra,
          tipo_cliente,
          clientes(nome, cpf, cidade),
          lojistas(nome_loja, shopping)
        `)
        .eq('status', 'atribuido');

      if (filtroData.tipo_download === 'intervalo') {
        if (filtroData.data_inicio) {
          query = query.gte('data_atribuicao', filtroData.data_inicio);
        }
        if (filtroData.data_fim) {
          query = query.lte('data_atribuicao', filtroData.data_fim + 'T23:59:59');
        }
      }

      const { data: cupons, error } = await query
        .select(`
          numero_formatado,
          data_atribuicao,
          valor_compra,
          tipo_cliente,
          clientes(nome, cpf, cidade),
          lojistas(nome_loja, shopping)
        `)
        .order('data_atribuicao', { ascending: true });

      if (error) throw error;

      if (!cupons || cupons.length === 0) {
        toast({
          title: "Nenhum cupom encontrado",
          description: "Não há cupons para gerar PDF no período selecionado.",
          variant: "destructive",
        });
        return;
      }

      // Formatar dados para o PDF
      const cuponsFormatados = cupons.map(cupom => ({
        numero_formatado: cupom.numero_formatado,
        nome_cliente: cupom.clientes?.nome || 'N/A',
        cpf_cliente: cupom.clientes?.cpf || 'N/A',
        nome_loja: cupom.lojistas?.nome_loja || 'N/A',
        shopping: cupom.lojistas?.shopping || 'N/A',
        data_atribuicao: cupom.data_atribuicao,
        valor_compra: cupom.valor_compra || 0,
        tipo_cliente: (cupom.tipo_cliente as 'varejo' | 'atacado') || 'varejo'
      }));

      // Gerar PDF com arte
      await generateCuponsPDF(cuponsFormatados);

      toast({
        title: "PDF gerado com sucesso",
        description: `${cupons.length} cupons foram baixados em PDF.`,
      });

    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Não foi possível gerar o PDF dos cupons.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrarGanhador = async () => {
    if (!novoGanhador.numero_cupom || !novoGanhador.premio || !novoGanhador.valor_premio) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos para registrar o ganhador.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Buscar o cupom pelo número
      const { data: cupomData, error: cupomError } = await supabase
        .from('cupons')
        .select('id, cliente_id, lojista_id')
        .eq('numero_formatado', novoGanhador.numero_cupom)
        .single();

      if (cupomError || !cupomData) {
        toast({
          title: "Cupom não encontrado",
          description: "O número do cupom informado não foi encontrado.",
          variant: "destructive",
        });
        return;
      }

      // Inserir o ganhador
      const { error: insertError } = await supabase
        .from('ganhadores_sorteios')
        .insert({
          numero_cupom: novoGanhador.numero_cupom,
          cupom_id: cupomData.id,
          cliente_id: cupomData.cliente_id,
          lojista_id: cupomData.lojista_id,
          premio: novoGanhador.premio,
          valor_premio: novoGanhador.valor_premio,
          tipo_sorteio: novoGanhador.tipo_sorteio
        });

      if (insertError) throw insertError;

      toast({
        title: "Ganhador registrado",
        description: `Prêmio "${novoGanhador.premio}" registrado com sucesso.`,
      });

      setNovoGanhador({
        numero_cupom: '',
        premio: '',
        valor_premio: 0,
        tipo_sorteio: 'semanal'
      });

      // Recarregar a lista
      fetchGanhadores();

    } catch (error) {
      console.error('Erro ao registrar ganhador:', error);
      toast({
        title: "Erro ao registrar",
        description: "Não foi possível registrar o ganhador.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTipoSorteioBadge = (tipo: string) => {
    const configs = {
      mensal: { variant: 'default' as const, className: 'bg-blue-100 text-blue-800' },
      semanal: { variant: 'secondary' as const, className: 'bg-green-100 text-green-800' },
      especial: { variant: 'outline' as const, className: 'bg-purple-100 text-purple-800' }
    };

    const config = configs[tipo as keyof typeof configs] || configs.semanal;

    return (
      <Badge variant={config.variant} className={config.className}>
        {tipo.toUpperCase()}
      </Badge>
    );
  };

  const estatisticas = {
    total_ganhadores: ganhadores.length,
    sorteios_semanais: ganhadores.filter(g => g.tipo_sorteio === 'semanal').length,
    sorteios_mensais: ganhadores.filter(g => g.tipo_sorteio === 'mensal').length,
    valor_total_premios: ganhadores.reduce((acc, g) => acc + g.valor_premio, 0)
  };

  return (
    <div className="p-6 space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Ganhadores</p>
                <p className="text-2xl font-bold">{estatisticas.total_ganhadores}</p>
              </div>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sorteios Semanais</p>
                <p className="text-2xl font-bold text-green-600">{estatisticas.sorteios_semanais}</p>
              </div>
              <Calendar className="h-4 w-4 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sorteios Mensais</p>
                <p className="text-2xl font-bold text-blue-600">{estatisticas.sorteios_mensais}</p>
              </div>
              <Target className="h-4 w-4 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valor em Prêmios</p>
                <p className="text-2xl font-bold text-yellow-600">
                  R$ {estatisticas.valor_total_premios.toLocaleString('pt-BR')}
                </p>
              </div>
              <Award className="h-4 w-4 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Download de Cupons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Baixar Cupons para Impressão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium">Tipo de Download</label>
              <Select 
                value={filtroData.tipo_download} 
                onValueChange={(value) => setFiltroData(prev => ({ ...prev, tipo_download: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Cupons</SelectItem>
                  <SelectItem value="intervalo">Por Intervalo de Data</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {filtroData.tipo_download === 'intervalo' && (
              <>
                <div>
                  <label className="text-sm font-medium">Data Início</label>
                  <Input
                    type="date"
                    value={filtroData.data_inicio}
                    onChange={(e) => setFiltroData(prev => ({ ...prev, data_inicio: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Data Fim</label>
                  <Input
                    type="date"
                    value={filtroData.data_fim}
                    onChange={(e) => setFiltroData(prev => ({ ...prev, data_fim: e.target.value }))}
                  />
                </div>
              </>
            )}
            
            <div className="flex items-end">
              <Button onClick={handleDownloadCupons} disabled={loading} className="w-full">
                <FileText className="h-4 w-4 mr-2" />
                {loading ? 'Gerando PDF...' : 'Gerar PDF'}
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Os cupons serão impressos usando a arte oficial do Show de Prêmios com os dados dos clientes posicionados corretamente sobre o template.
          </p>
        </CardContent>
      </Card>

      {/* Registrar Ganhador */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Registrar Ganhador de Sorteio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium">Número do Cupom</label>
              <Input
                placeholder="Ex: CP000000001234"
                value={novoGanhador.numero_cupom}
                onChange={(e) => setNovoGanhador(prev => ({ ...prev, numero_cupom: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Tipo de Sorteio</label>
              <Select 
                value={novoGanhador.tipo_sorteio} 
                onValueChange={(value) => setNovoGanhador(prev => ({ ...prev, tipo_sorteio: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semanal">Semanal</SelectItem>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="especial">Especial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Prêmio</label>
              <Input
                placeholder="Ex: Primeiro Prêmio"
                value={novoGanhador.premio}
                onChange={(e) => setNovoGanhador(prev => ({ ...prev, premio: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Valor (R$)</label>
              <Input
                type="number"
                placeholder="5000"
                value={novoGanhador.valor_premio || ''}
                onChange={(e) => setNovoGanhador(prev => ({ ...prev, valor_premio: Number(e.target.value) }))}
              />
            </div>
          </div>
          <Button onClick={handleRegistrarGanhador} disabled={loading} className="w-full">
            <Trophy className="h-4 w-4 mr-2" />
            {loading ? 'Registrando...' : 'Registrar Ganhador'}
          </Button>
        </CardContent>
      </Card>

      {/* Lista de Ganhadores */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Ganhadores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ganhadores.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum ganhador registrado ainda.</p>
              </div>
            ) : (
              ganhadores.map((ganhador) => (
                <div
                  key={ganhador.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{ganhador.premio}</h3>
                        {getTipoSorteioBadge(ganhador.tipo_sorteio)}
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                          R$ {ganhador.valor_premio.toLocaleString('pt-BR')}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p><strong>Cliente:</strong> {ganhador.nome_cliente}</p>
                          <p><strong>CPF:</strong> {ganhador.cpf_cliente}</p>
                        </div>
                        <div>
                          <p><strong>Cupom:</strong> {ganhador.numero_cupom}</p>
                          <p><strong>Loja:</strong> {ganhador.nome_loja}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(ganhador.data_sorteio), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GestaoSorteios;