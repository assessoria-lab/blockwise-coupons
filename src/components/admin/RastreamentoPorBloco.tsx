import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Search, Package } from 'lucide-react';

const RastreamentoPorBloco = () => {
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
          <div className="text-center py-8 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            Funcionalidade de rastreamento em desenvolvimento
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RastreamentoPorBloco;