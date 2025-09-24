import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Trophy, 
  Calendar, 
  Gift, 
  Users, 
  Play, 
  Pause, 
  Settings, 
  Award,
  Clock,
  Target
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Sorteio {
  id: string;
  nome: string;
  descricao: string;
  data_sorteio: string;
  status: 'agendado' | 'em_andamento' | 'finalizado' | 'cancelado';
  total_participantes: number;
  premios: Array<{
    posicao: number;
    descricao: string;
    valor: number;
  }>;
  tipo: 'mensal' | 'especial' | 'promocional';
}

const GestaoSorteios = () => {
  const [novoSorteio, setNovoSorteio] = useState({
    nome: '',
    descricao: '',
    data_sorteio: '',
    tipo: 'mensal',
    premios: [
      { posicao: 1, descricao: 'Primeiro Prêmio', valor: 0 }
    ]
  });

  // Dados mockados para demonstração
  const sorteios: Sorteio[] = [
    {
      id: '1',
      nome: 'Sorteio Mensal - Janeiro 2025',
      descricao: 'Sorteio mensal com prêmios em dinheiro para clientes participantes',
      data_sorteio: '2025-01-31T20:00:00',
      status: 'agendado',
      total_participantes: 1250,
      premios: [
        { posicao: 1, descricao: 'Primeiro Prêmio', valor: 50000 },
        { posicao: 2, descricao: 'Segundo Prêmio', valor: 20000 },
        { posicao: 3, descricao: 'Terceiro Prêmio', valor: 10000 }
      ],
      tipo: 'mensal'
    },
    {
      id: '2',
      nome: 'Sorteio Especial de Natal',
      descricao: 'Sorteio especial comemorativo com prêmios extras',
      data_sorteio: '2024-12-24T19:00:00',
      status: 'finalizado',
      total_participantes: 2100,
      premios: [
        { posicao: 1, descricao: 'Grande Prêmio de Natal', valor: 100000 },
        { posicao: 2, descricao: 'Segundo Prêmio', valor: 30000 }
      ],
      tipo: 'especial'
    }
  ];

  const getStatusBadge = (status: string) => {
    const configs = {
      agendado: { variant: 'outline' as const, color: 'text-blue-600', icon: Clock },
      em_andamento: { variant: 'default' as const, color: 'text-green-600', icon: Play },
      finalizado: { variant: 'secondary' as const, color: 'text-gray-600', icon: Award },
      cancelado: { variant: 'destructive' as const, color: 'text-red-600', icon: Pause }
    };

    const config = configs[status as keyof typeof configs] || configs.agendado;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={`flex items-center gap-1 ${config.color}`}>
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getTipoBadge = (tipo: string) => {
    const configs = {
      mensal: { variant: 'default' as const, color: 'bg-blue-100 text-blue-800' },
      especial: { variant: 'secondary' as const, color: 'bg-purple-100 text-purple-800' },
      promocional: { variant: 'outline' as const, color: 'bg-green-100 text-green-800' }
    };

    const config = configs[tipo as keyof typeof configs] || configs.mensal;

    return (
      <Badge variant={config.variant} className={config.color}>
        {tipo.toUpperCase()}
      </Badge>
    );
  };

  const adicionarPremio = () => {
    setNovoSorteio(prev => ({
      ...prev,
      premios: [
        ...prev.premios,
        { posicao: prev.premios.length + 1, descricao: '', valor: 0 }
      ]
    }));
  };

  const estatisticas = {
    total_sorteios: sorteios.length,
    agendados: sorteios.filter(s => s.status === 'agendado').length,
    finalizados: sorteios.filter(s => s.status === 'finalizado').length,
    total_participantes: sorteios.reduce((acc, s) => acc + s.total_participantes, 0),
    valor_total_premios: sorteios.reduce((acc, s) => 
      acc + s.premios.reduce((sum, p) => sum + p.valor, 0), 0
    )
  };

  return (
    <div className="p-6 space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Sorteios</p>
                <p className="text-2xl font-bold">{estatisticas.total_sorteios}</p>
              </div>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Agendados</p>
                <p className="text-2xl font-bold text-blue-600">{estatisticas.agendados}</p>
              </div>
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Finalizados</p>
                <p className="text-2xl font-bold text-green-600">{estatisticas.finalizados}</p>
              </div>
              <Award className="h-4 w-4 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Participantes</p>
                <p className="text-2xl font-bold text-purple-600">{estatisticas.total_participantes.toLocaleString()}</p>
              </div>
              <Users className="h-4 w-4 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valor em Prêmios</p>
                <p className="text-2xl font-bold text-yellow-600">
                  R$ {(estatisticas.valor_total_premios).toLocaleString('pt-BR')}
                </p>
              </div>
              <Gift className="h-4 w-4 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Criar Novo Sorteio */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Criar Novo Sorteio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium">Nome do Sorteio</label>
              <Input
                placeholder="Ex: Sorteio Mensal - Fevereiro 2025"
                value={novoSorteio.nome}
                onChange={(e) => setNovoSorteio(prev => ({ ...prev, nome: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Data e Hora</label>
              <Input
                type="datetime-local"
                value={novoSorteio.data_sorteio}
                onChange={(e) => setNovoSorteio(prev => ({ ...prev, data_sorteio: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="text-sm font-medium">Descrição</label>
            <Textarea
              placeholder="Descreva o sorteio e suas regras..."
              value={novoSorteio.descricao}
              onChange={(e) => setNovoSorteio(prev => ({ ...prev, descricao: e.target.value }))}
            />
          </div>

          <div className="mb-4">
            <label className="text-sm font-medium">Tipo de Sorteio</label>
            <Select value={novoSorteio.tipo} onValueChange={(value) => setNovoSorteio(prev => ({ ...prev, tipo: value as any }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mensal">Mensal</SelectItem>
                <SelectItem value="especial">Especial</SelectItem>
                <SelectItem value="promocional">Promocional</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Prêmios</label>
              <Button onClick={adicionarPremio} size="sm" variant="outline">
                Adicionar Prêmio
              </Button>
            </div>
            <div className="space-y-2">
              {novoSorteio.premios.map((premio, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-1">
                    <Badge variant="outline">{premio.posicao}º</Badge>
                  </div>
                  <div className="col-span-6">
                    <Input
                      placeholder="Descrição do prêmio"
                      value={premio.descricao}
                      onChange={(e) => {
                        const newPremios = [...novoSorteio.premios];
                        newPremios[index].descricao = e.target.value;
                        setNovoSorteio(prev => ({ ...prev, premios: newPremios }));
                      }}
                    />
                  </div>
                  <div className="col-span-5">
                    <Input
                      type="number"
                      placeholder="Valor (R$)"
                      value={premio.valor || ''}
                      onChange={(e) => {
                        const newPremios = [...novoSorteio.premios];
                        newPremios[index].valor = Number(e.target.value);
                        setNovoSorteio(prev => ({ ...prev, premios: newPremios }));
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button className="w-full">
            <Trophy className="h-4 w-4 mr-2" />
            Criar Sorteio
          </Button>
        </CardContent>
      </Card>

      {/* Lista de Sorteios */}
      <Card>
        <CardHeader>
          <CardTitle>Sorteios Existentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sorteios.map((sorteio) => (
              <div
                key={sorteio.id}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{sorteio.nome}</h3>
                      {getStatusBadge(sorteio.status)}
                      {getTipoBadge(sorteio.tipo)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{sorteio.descricao}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(sorteio.data_sorteio), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {sorteio.total_participantes.toLocaleString()} participantes
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Configurar
                    </Button>
                    {sorteio.status === 'agendado' && (
                      <Button size="sm">
                        <Play className="h-4 w-4 mr-2" />
                        Iniciar
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="border-t pt-3">
                  <h4 className="font-medium text-sm mb-2">Prêmios:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {sorteio.premios.map((premio) => (
                      <div key={premio.posicao} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm">{premio.posicao}º - {premio.descricao}</span>
                        <Badge variant="outline">
                          R$ {premio.valor.toLocaleString('pt-BR')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GestaoSorteios;