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
  cupons: CupomData[]
): Promise<void> => {
  if (cupons.length === 0) {
    throw new Error('Nenhum cupom para gerar PDF');
  }

  // Usar a arte oficial do Show de Prêmios
  const backgroundImage = '/assets/cupom-template.png';

  // Criar um container temporário fora da tela
  const tempContainer = document.createElement('div');
  tempContainer.style.position = 'absolute';
  tempContainer.style.left = '-9999px';
  tempContainer.style.top = '-9999px';
  tempContainer.style.width = '1263px'; // Largura da arte original
  tempContainer.style.height = '842px';  // Altura da arte original
  document.body.appendChild(tempContainer);

  // Criar o PDF - formato landscape para acomodar a arte
  const pdf = new jsPDF('landscape', 'px', [842, 595]); // A4 landscape
  const pageWidth = 842;
  const pageHeight = 595;
  const cupomWidth = 800;
  const cupomHeight = 530;
  const margin = 21;

  let isFirstPage = true;

  for (let i = 0; i < cupons.length; i++) {
    if (!isFirstPage) {
      pdf.addPage();
    }
    isFirstPage = false;

    const cupom = cupons[i];

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

        <!-- Nome Completo -->
        <div style="
          position: absolute;
          top: 445px;
          left: 50px;
          width: 1160px;
          height: 45px;
          display: flex;
          align-items: center;
          padding-left: 15px;
          font-size: 22px;
          font-weight: 600;
          color: #1f2937;
        ">
          ${cupom.nome_cliente}
        </div>

        <!-- CPF -->
        <div style="
          position: absolute;
          top: 520px;
          left: 50px;
          width: 575px;
          height: 45px;
          display: flex;
          align-items: center;
          padding-left: 15px;
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
        ">
          ${cupom.cpf_cliente}
        </div>

        <!-- Telefone -->
        <div style="
          position: absolute;
          top: 520px;
          right: 50px;
          width: 575px;
          height: 45px;
          display: flex;
          align-items: center;
          padding-left: 15px;
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
        ">
          ${cupom.nome_cliente.split(' ')[0]} - ${new Date(cupom.data_atribuicao).toLocaleDateString('pt-BR')}
        </div>

        <!-- Shopping/Galeria -->
        <div style="
          position: absolute;
          top: 595px;
          left: 50px;
          width: 810px;
          height: 45px;
          display: flex;
          align-items: center;
          padding-left: 15px;
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
        ">
          ${cupom.shopping}
        </div>

        <!-- Email (usando loja como referência) -->
        <div style="
          position: absolute;
          top: 670px;
          left: 50px;
          width: 1160px;
          height: 45px;
          display: flex;
          align-items: center;
          padding-left: 15px;
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
        ">
          ${cupom.nome_loja} - Valor: R$ ${cupom.valor_compra.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </div>

        <!-- Loja -->
        <div style="
          position: absolute;
          top: 745px;
          left: 50px;
          width: 576px;
          height: 45px;
          display: flex;
          align-items: center;
          padding-left: 15px;
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
        ">
          ${cupom.nome_loja}
        </div>

        <!-- Vendedor (usando data da atribuição) -->
        <div style="
          position: absolute;
          top: 745px;
          right: 50px;
          width: 576px;
          height: 45px;
          display: flex;
          align-items: center;
          padding-left: 15px;
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
        ">
          Data: ${new Date(cupom.data_atribuicao).toLocaleDateString('pt-BR')}
        </div>

      </div>
    `;

    // Converter para canvas e adicionar ao PDF
    try {
      const canvas = await html2canvas(tempContainer, {
        width: 1263,
        height: 842,
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', margin, margin, cupomWidth, cupomHeight);
    } catch (error) {
      console.error('Erro ao gerar imagem do cupom:', error);
    }
  }

  // Remover container temporário
  document.body.removeChild(tempContainer);

  // Fazer download do PDF
  const fileName = `cupons_show_premios_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
};

export default generateCuponsPDF;