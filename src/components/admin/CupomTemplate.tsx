import React from 'react';

interface CupomData {
  numero_formatado: string;
  nome_cliente: string;
  cpf_cliente: string;
  nome_loja: string;
  shopping: string;
  data_atribuicao: string;
  valor_compra: number;
}

interface CupomTemplateProps {
  cupom: CupomData;
  backgroundImage?: string;
}

export const CupomTemplate: React.FC<CupomTemplateProps> = ({ 
  cupom, 
  backgroundImage = "/placeholder.svg" 
}) => {
  return (
    <div 
      className="cupom-template relative w-[600px] h-[400px] p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-dashed border-blue-300 rounded-lg overflow-hidden"
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay para garantir legibilidade do texto */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm"></div>
      
      <div className="relative z-10 h-full flex flex-col justify-between">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-blue-800 mb-2">CUPOM DE SORTEIO</h1>
          <div className="text-lg font-semibold text-purple-700 bg-yellow-200 px-4 py-2 rounded-full inline-block">
            {cupom.numero_formatado}
          </div>
        </div>

        {/* Dados do Cliente */}
        <div className="bg-white/90 rounded-lg p-4 shadow-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold text-gray-700">Cliente:</p>
              <p className="text-gray-900 text-base font-medium">{cupom.nome_cliente}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700">CPF:</p>
              <p className="text-gray-900 text-base font-medium">{cupom.cpf_cliente}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700">Loja:</p>
              <p className="text-gray-900 text-base font-medium">{cupom.nome_loja}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700">Shopping:</p>
              <p className="text-gray-900 text-base font-medium">{cupom.shopping}</p>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center">
            <div>
              <p className="font-semibold text-gray-700">Valor da Compra:</p>
              <p className="text-green-600 text-xl font-bold">
                R$ {cupom.valor_compra.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-700">Data:</p>
              <p className="text-gray-900 font-medium">
                {new Date(cupom.data_atribuicao).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-600 font-medium">
            Válido para sorteios • Mantenha este cupom
          </p>
          <div className="mt-2 flex justify-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CupomTemplate;