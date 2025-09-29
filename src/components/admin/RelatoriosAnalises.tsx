import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FileText, BarChart3 } from 'lucide-react';

const RelatoriosAnalises = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Relatórios e Análises
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            Sistema de relatórios em desenvolvimento
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RelatoriosAnalises;