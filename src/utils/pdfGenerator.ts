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