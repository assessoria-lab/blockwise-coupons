import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Trophy, Medal, Award, Ticket } from 'lucide-react';

const RankingAtribuicaoCupons = () => {
  const data = [
    { nome: 'Fashion Style', cupons: 52, clientes: 52 },
    { nome: 'Bella Moda', cupons: 48, clientes: 48 },
    { nome: 'Trend Boutique', cupons: 45, clientes: 45 },
    { nome: 'Chic Fashion', cupons: 38, clientes: 38 },
    { nome: 'Look Moderno', cupons: 35, clientes: 35 },
    { nome: 'Vogue Boutique', cupons: 28, clientes: 28 },
    { nome: 'Elite Fashion', cupons: 22, clientes: 22 },
    { nome: 'Glamour Store', cupons: 18, clientes: 18 },
  ];

  const COLORS = ['#FFD700', '#C0C0C0', '#CD7F32', '#22c55e', '#22c55e', '#22c55e', '#22c55e', '#22c55e'];

  const getRankIcon = (index: number) => {
    switch(index) {
      case 0: return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 1: return <Medal className="h-5 w-5 text-gray-400" />;
      case 2: return <Award className="h-5 w-5 text-orange-600" />;
      default: return <span className="font-bold text-muted-foreground">{index + 1}º</span>;
    }
  };

  const totalCupons = data.reduce((acc, item) => acc + item.cupons, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ticket className="h-5 w-5" />
          Ranking de Atribuição de Cupons
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 mb-4">
            <p className="text-sm text-muted-foreground">Total de cupons atribuídos</p>
            <p className="text-3xl font-bold text-primary">{totalCupons}</p>
          </div>

          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.slice(0, 5)} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="category" dataKey="nome" angle={-45} textAnchor="end" height={80} />
              <YAxis type="number" />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-background border rounded-lg p-2 shadow-lg">
                        <p className="font-medium">{payload[0].payload.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          {payload[0].value} cupons atribuídos
                        </p>
                        <p className="text-sm text-primary font-medium">
                          {payload[0].payload.clientes} clientes
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="cupons" radius={[4, 4, 0, 0]}>
                {data.slice(0, 5).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="border rounded-lg divide-y">
            {data.map((item, index) => (
              <div key={item.nome} className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 flex justify-center">
                    {getRankIcon(index)}
                  </div>
                  <div>
                    <p className="font-medium">{item.nome}</p>
                    <p className="text-sm text-muted-foreground">{item.clientes} clientes</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{item.cupons}</p>
                  <p className="text-xs text-muted-foreground">cupons</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RankingAtribuicaoCupons;
