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
  tipo_cliente: 'varejo' | 'atacado';
  telefone_cliente?: string;
  email_cliente?: string;
  vendedor?: string;
}

export const generateCuponsPDF = async (
  cupons: CupomData[]
): Promise<void> => {
  if (cupons.length === 0) {
    throw new Error('Nenhum cupom para gerar PDF');
  }

  // Limitar quantidade de cupons por PDF para evitar erro de memória
  const MAX_CUPONS_PER_PDF = 50;
  const totalPDFs = Math.ceil(cupons.length / MAX_CUPONS_PER_PDF);
  
  for (let pdfIndex = 0; pdfIndex < totalPDFs; pdfIndex++) {
    const startIndex = pdfIndex * MAX_CUPONS_PER_PDF;
    const endIndex = Math.min(startIndex + MAX_CUPONS_PER_PDF, cupons.length);
    const cuponsBatch = cupons.slice(startIndex, endIndex);
    
    await generateSinglePDF(cuponsBatch, pdfIndex + 1, totalPDFs);
  }
};

const generateSinglePDF = async (
  cupons: CupomData[],
  pdfNumber: number,
  totalPDFs: number
): Promise<void> => {
  // Usar a arte oficial do Show de Prêmios
  const backgroundImage = '/assets/cupom-template.png';

  // Formato 10x15 cm (283.46 x 425.20 pontos no PDF)
  const pageWidthCm = 10;
  const pageHeightCm = 15;
  const pageWidth = pageWidthCm * 28.346;
  const pageHeight = pageHeightCm * 28.346;
  
  // Criar o PDF no formato 10x15 cm (retrato)
  const pdf = new jsPDF('portrait', 'pt', [pageWidth, pageHeight]);
  
  // Dimensões do cupom proporcional
  const aspectRatio = 1263 / 842;
  const margin = 5;
  const cupomHeight = (pageHeight / 2) - (margin * 1.5);
  const cupomWidth = cupomHeight * aspectRatio;
  
  const maxCupomWidth = pageWidth - (margin * 2);
  let finalCupomWidth = cupomWidth;
  let finalCupomHeight = cupomHeight;
  
  if (cupomWidth > maxCupomWidth) {
    finalCupomWidth = maxCupomWidth;
    finalCupomHeight = finalCupomWidth / aspectRatio;
  }

  // Criar um container temporário
  const tempContainer = document.createElement('div');
  tempContainer.style.position = 'absolute';
  tempContainer.style.left = '-9999px';
  tempContainer.style.top = '-9999px';
  tempContainer.style.width = '1263px';
  tempContainer.style.height = '842px';
  document.body.appendChild(tempContainer);

  // Processar cupons em lotes de 2 por página
  for (let i = 0; i < cupons.length; i++) {
    const cupom = cupons[i];
    const positionInPage = i % 2; // 0 = primeiro cupom, 1 = segundo cupom
    
    // Adicionar nova página se necessário (exceto na primeira vez e no primeiro cupom da página)
    if (i > 0 && positionInPage === 0) {
      pdf.addPage();
    }
    
    // Calcular posição Y do cupom na página
    const yPosition = margin + (positionInPage * (finalCupomHeight + margin));
    const xPosition = (pageWidth - finalCupomWidth) / 2; // Centralizar horizontalmente

    // Criar o HTML do cupom usando a arte oficial como fundo
    tempContainer.innerHTML = `
      <div style="
        position: relative;
        width: 1263px;
        height: 842px;
        background-image: url(${backgroundImage});
        background-size: contain;
        background-position: center;
        background-repeat: no-repeat;
        font-family: 'Arial', sans-serif;
      ">
        
        <!-- Número de Identificação do Cupom (canto superior direito) -->
        <div style="
          position: absolute;
          top: 20px;
          right: 40px;
          background: rgba(255, 255, 255, 0.95);
          padding: 8px 16px;
          border-radius: 6px;
          border: 2px solid #2563eb;
          font-size: 16px;
          font-weight: bold;
          color: #1e40af;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        ">
          ID: ${cupom.numero_formatado}
        </div>

        <!-- Nome Completo - ajustado mais para cima e direita -->
        <div style="
          position: absolute;
          top: 400px;
          left: 280px;
          width: 1000px;
          height: 30px;
          display: flex;
          align-items: center;
          font-size: 22px;
          font-weight: 600;
          color: #1f2937;
        ">
          ${cupom.nome_cliente}
        </div>

        <!-- CPF - ajustado mais para cima e direita -->
        <div style="
          position: absolute;
          top: 495px;
          left: 120px;
          width: 520px;
          height: 30px;
          display: flex;
          align-items: center;
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
        ">
          ${cupom.cpf_cliente}
        </div>

        <!-- Telefone - dados corretos (telefone do cliente) ajustado mais para cima e direita -->
        <div style="
          position: absolute;
          top: 495px;
          left: 820px;
          width: 420px;
          height: 30px;
          display: flex;
          align-items: center;
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
        ">
          ${cupom.telefone_cliente || ''}
        </div>

        <!-- Shopping/Galeria - ajustado mais para cima e direita -->
        <div style="
          position: absolute;
          top: 590px;
          left: 220px;
          width: 680px;
          height: 30px;
          display: flex;
          align-items: center;
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
        ">
          ${cupom.shopping}
        </div>

        <!-- Marcar X dentro da bolinha correta baseado no tipo_cliente salvo -->
        <div style="
          position: absolute;
          top: 590px;
          left: ${cupom.tipo_cliente === 'varejo' ? '940' : '1150'}px;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: bold;
          color: #1f2937;
        ">
          ✗
        </div>

        <!-- Email - dados corretos (email do cliente) ajustado mais para cima e direita -->
        <div style="
          position: absolute;
          top: 665px;
          left: 120px;
          width: 1100px;
          height: 30px;
          display: flex;
          align-items: center;
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
        ">
          ${cupom.email_cliente || ''}
        </div>

        <!-- Loja - mantido como estava (correto) -->
        <div style="
          position: absolute;
          top: 753px;
          left: 120px;
          width: 520px;
          height: 30px;
          display: flex;
          align-items: center;
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
        ">
          ${cupom.nome_loja}
        </div>

        <!-- Vendedor - dados corretos (nome do vendedor/responsável) mantido como estava -->
        <div style="
          position: absolute;
          top: 753px;
          left: 820px;
          width: 420px;
          height: 30px;
          display: flex;
          align-items: center;
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
        ">
          ${cupom.vendedor || ''}
        </div>

      </div>
    `;

    // Converter para canvas com scale reduzido para diminuir tamanho
    try {
      const canvas = await html2canvas(tempContainer, {
        width: 1263,
        height: 842,
        scale: 1, // Reduzido de 1.5 para 1 para economizar memória
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.85); // JPEG com qualidade 85% para reduzir tamanho
      pdf.addImage(imgData, 'JPEG', xPosition, yPosition, finalCupomWidth, finalCupomHeight);
    } catch (error) {
      console.error('Erro ao gerar imagem do cupom:', error);
    }
  }

  // Remover container temporário
  document.body.removeChild(tempContainer);

  // Fazer download do PDF
  const fileName = totalPDFs > 1 
    ? `cupons_show_premios_parte${pdfNumber}_de_${totalPDFs}_${new Date().toISOString().split('T')[0]}.pdf`
    : `cupons_show_premios_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
};

export default generateCuponsPDF;