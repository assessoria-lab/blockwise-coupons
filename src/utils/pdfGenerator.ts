import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface CupomData {
  numero_formatado: string;
  nome_cliente: string;
  cpf_cliente: string;
  nome_loja: string;
  shopping: string;
  data_atribuicao: string;
  valor_compra: number;
}

export const generateCuponsPDF = async (
  cupons: CupomData[],
  backgroundImage?: string
): Promise<void> => {
  if (cupons.length === 0) {
    throw new Error('Nenhum cupom para gerar PDF');
  }

  // Criar um container temporário fora da tela
  const tempContainer = document.createElement('div');
  tempContainer.style.position = 'absolute';
  tempContainer.style.left = '-9999px';
  tempContainer.style.top = '-9999px';
  tempContainer.style.width = '600px';
  tempContainer.style.height = '400px';
  document.body.appendChild(tempContainer);

  // Criar o PDF
  const pdf = new jsPDF('landscape', 'px', [842, 595]); // A4 landscape em pixels
  const pageWidth = 842;
  const pageHeight = 595;
  const cupomWidth = 400;
  const cupomHeight = 280;
  const margin = 20;
  
  // Calcular quantos cupons por página (2x2)
  const cuponsPerRow = 2;
  const cuponsPerCol = 2;
  const cuponsPerPage = cuponsPerRow * cuponsPerCol;

  let cupomIndex = 0;
  let isFirstPage = true;

  while (cupomIndex < cupons.length) {
    if (!isFirstPage) {
      pdf.addPage();
    }
    isFirstPage = false;

    // Processar até 4 cupons por página
    const cuponsThisPage = cupons.slice(cupomIndex, cupomIndex + cuponsPerPage);
    
    for (let i = 0; i < cuponsThisPage.length; i++) {
      const cupom = cuponsThisPage[i];
      const row = Math.floor(i / cuponsPerRow);
      const col = i % cuponsPerRow;
      
      const x = margin + (col * (cupomWidth + margin));
      const y = margin + (row * (cupomHeight + margin));

      // Criar o HTML do cupom
      tempContainer.innerHTML = `
        <div style="
          position: relative;
          width: 600px;
          height: 400px;
          padding: 24px;
          background: linear-gradient(135deg, #eff6ff 0%, #faf5ff 100%);
          border: 2px dashed #3b82f6;
          border-radius: 8px;
          overflow: hidden;
          font-family: system-ui, -apple-system, sans-serif;
          ${backgroundImage ? `background-image: url(${backgroundImage}); background-size: cover; background-position: center;` : ''}
        ">
          ${backgroundImage ? '<div style="position: absolute; inset: 0; background: rgba(255,255,255,0.8); backdrop-filter: blur(4px);"></div>' : ''}
          
          <div style="position: relative; z-index: 10; height: 100%; display: flex; flex-direction: column; justify-content: space-between;">
            <!-- Header -->
            <div style="text-align: center;">
              <h1 style="margin: 0 0 8px 0; font-size: 32px; font-weight: bold; color: #1e40af;">CUPOM DE SORTEIO</h1>
              <div style="
                font-size: 18px;
                font-weight: 600;
                color: #7c3aed;
                background: #fef3c7;
                padding: 8px 16px;
                border-radius: 9999px;
                display: inline-block;
              ">
                ${cupom.numero_formatado}
              </div>
            </div>

            <!-- Dados do Cliente -->
            <div style="
              background: rgba(255,255,255,0.9);
              border-radius: 8px;
              padding: 16px;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            ">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 14px;">
                <div>
                  <p style="margin: 0 0 4px 0; font-weight: 600; color: #374151;">Cliente:</p>
                  <p style="margin: 0; color: #111827; font-size: 16px; font-weight: 500;">${cupom.nome_cliente}</p>
                </div>
                <div>
                  <p style="margin: 0 0 4px 0; font-weight: 600; color: #374151;">CPF:</p>
                  <p style="margin: 0; color: #111827; font-size: 16px; font-weight: 500;">${cupom.cpf_cliente}</p>
                </div>
                <div>
                  <p style="margin: 0 0 4px 0; font-weight: 600; color: #374151;">Loja:</p>
                  <p style="margin: 0; color: #111827; font-size: 16px; font-weight: 500;">${cupom.nome_loja}</p>
                </div>
                <div>
                  <p style="margin: 0 0 4px 0; font-weight: 600; color: #374151;">Shopping:</p>
                  <p style="margin: 0; color: #111827; font-size: 16px; font-weight: 500;">${cupom.shopping || 'N/A'}</p>
                </div>
              </div>
              
              <div style="
                margin-top: 16px;
                padding-top: 12px;
                border-top: 1px solid #e5e7eb;
                display: flex;
                justify-content: space-between;
                align-items: center;
              ">
                <div>
                  <p style="margin: 0 0 4px 0; font-weight: 600; color: #374151;">Valor da Compra:</p>
                  <p style="margin: 0; color: #059669; font-size: 20px; font-weight: bold;">
                    R$ ${cupom.valor_compra.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div style="text-align: right;">
                  <p style="margin: 0 0 4px 0; font-weight: 600; color: #374151;">Data:</p>
                  <p style="margin: 0; color: #111827; font-weight: 500;">
                    ${new Date(cupom.data_atribuicao).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div style="text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280; font-weight: 500;">
                Válido para sorteios • Mantenha este cupom
              </p>
              <div style="display: flex; justify-content: center; gap: 8px;">
                <div style="width: 12px; height: 12px; background: #3b82f6; border-radius: 50%;"></div>
                <div style="width: 12px; height: 12px; background: #8b5cf6; border-radius: 50%;"></div>
                <div style="width: 12px; height: 12px; background: #eab308; border-radius: 50%;"></div>
              </div>
            </div>
          </div>
        </div>
      `;

      // Converter para canvas e adicionar ao PDF
      try {
        const canvas = await html2canvas(tempContainer, {
          width: 600,
          height: 400,
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: null
        });

        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', x, y, cupomWidth, cupomHeight);
      } catch (error) {
        console.error('Erro ao gerar imagem do cupom:', error);
      }
    }

    cupomIndex += cuponsPerPage;
  }

  // Remover container temporário
  document.body.removeChild(tempContainer);

  // Fazer download do PDF
  const fileName = `cupons_sorteio_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
};

export default generateCuponsPDF;