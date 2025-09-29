import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, MapPin } from 'lucide-react';

const GraficoDistribuicaoClientes = () => {
  const data = [
    { cidade: 'São Paulo', clientes: 42, percentual: 28, cupons: 126 },
    { cidade: 'Rio de Janeiro', clientes: 35, percentual: 23.3, cupons: 105 },
    { cidade: 'Belo Horizonte', clientes: 28, percentual: 18.7, cupons: 84 },
    { cidade: 'Curitiba', clientes: 24, percentual: 16, cupons: 72 },
    { cidade: 'Porto Alegre', clientes: 21, percentual: 14, cupons: 63 },
  ];

  const COLORS = ['#3b82f6', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b'];

  const totalClientes = data.reduce((acc, item) => acc + item.clientes, 0);
  const totalCupons = data.reduce((acc, item) => acc + item.cupons, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Distribuição Geográfica de Clientes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Total de Clientes</p>
              </div>
              <p className="text-2xl font-bold text-primary">{totalClientes}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Cupons Distribuídos</p>
              </div>
              <p className="text-2xl font-bold text-primary">{totalCupons}</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="category" dataKey="cidade" angle={-45} textAnchor="end" height={80} fontSize={12} />
              <YAxis type="number" />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-background border rounded-lg p-3 shadow-lg">
                        <p className="font-medium flex items-center gap-2 mb-2">
                          <MapPin className="h-4 w-4" />
                          {payload[0].payload.cidade}
                        </p>
                        <div className="space-y-1">
                          <p className="text-sm">
                            <span className="text-muted-foreground">Clientes:</span>{' '}
                            <span className="font-medium">{payload[0].payload.clientes}</span>
                          </p>
                          <p className="text-sm">
                            <span className="text-muted-foreground">Cupons:</span>{' '}
                            <span className="font-medium text-primary">{payload[0].payload.cupons}</span>
                          </p>
                          <p className="text-sm">
                            <span className="text-muted-foreground">Percentual:</span>{' '}
                            <span className="font-medium">{payload[0].payload.percentual}%</span>
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="clientes" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="border rounded-lg divide-y">
            {data.map((item, index) => (
              <div key={item.cidade} className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                  <div>
                    <p className="font-medium">{item.cidade}</p>
                    <p className="text-sm text-muted-foreground">{item.cupons} cupons atribuídos</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{item.clientes}</p>
                  <p className="text-xs text-muted-foreground">{item.percentual}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GraficoDistribuicaoClientes;
