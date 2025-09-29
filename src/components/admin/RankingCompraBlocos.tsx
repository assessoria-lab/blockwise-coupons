import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Trophy, Medal, Award } from 'lucide-react';

const RankingCompraBlocos = () => {
  const data = [
    { nome: 'Bella Moda', blocos: 8, valor: 'R$ 4.000' },
    { nome: 'Fashion Style', blocos: 7, valor: 'R$ 3.500' },
    { nome: 'Trend Boutique', blocos: 6, valor: 'R$ 3.000' },
    { nome: 'Chic Fashion', blocos: 5, valor: 'R$ 2.500' },
    { nome: 'Look Moderno', blocos: 5, valor: 'R$ 2.500' },
    { nome: 'Glamour Store', blocos: 4, valor: 'R$ 2.000' },
    { nome: 'Vogue Boutique', blocos: 4, valor: 'R$ 2.000' },
    { nome: 'Elite Fashion', blocos: 4, valor: 'R$ 2.000' },
  ];

  const COLORS = ['#FFD700', '#C0C0C0', '#CD7F32', '#6366f1', '#6366f1', '#6366f1', '#6366f1', '#6366f1'];

  const getRankIcon = (index: number) => {
    switch(index) {
      case 0: return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 1: return <Medal className="h-5 w-5 text-gray-400" />;
      case 2: return <Award className="h-5 w-5 text-orange-600" />;
      default: return <span className="font-bold text-muted-foreground">{index + 1}º</span>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ranking de Compra de Blocos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
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
                          {payload[0].value} blocos comprados
                        </p>
                        <p className="text-sm text-primary font-medium">
                          {payload[0].payload.valor}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="blocos" radius={[4, 4, 0, 0]}>
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
                    <p className="text-sm text-muted-foreground">{item.valor}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{item.blocos}</p>
                  <p className="text-xs text-muted-foreground">blocos</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RankingCompraBlocos;
