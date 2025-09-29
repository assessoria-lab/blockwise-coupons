import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const GraficoRegioesLojistas = () => {
  const data = [
    { name: 'São Paulo', value: 3, lojas: 3 },
    { name: 'Rio de Janeiro', value: 3, lojas: 3 },
    { name: 'Curitiba', value: 2, lojas: 2 },
    { name: 'Belo Horizonte', value: 2, lojas: 2 },
    { name: 'Porto Alegre', value: 1, lojas: 1 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição de Lojistas por Região</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: any, name: string, props: any) => [`${props.payload.lojas} lojas`, name]} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default GraficoRegioesLojistas;
