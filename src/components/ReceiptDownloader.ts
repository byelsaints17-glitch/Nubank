/**
 * Utility to programmatically draw a Nubank-style transfer receipt and download it as PNG.
 * Fully client-side, fast, lightweight, and offline-compatible.
 */
export function downloadReceiptAsImage(
  type: 'Pix' | 'Transferência' | 'Pagamento de Fatura' | 'Depósito',
  amount: number,
  dateStr: string,
  timeStr: string,
  senderName: string,
  senderCpf: string,
  senderBank: string,
  senderAgency: string,
  senderAccount: string,
  recipientName: string,
  recipientCpf: string,
  recipientBank: string,
  recipientAgency: string,
  recipientAccount: string,
  transactionId: string
) {
  const canvas = document.createElement('canvas');
  // High DPI rendering for crisp text
  canvas.width = 650;
  canvas.height = 1100; // Increased height to comfortably fit the grey footer container
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textBaseline = 'top';

  // 1. Draw authentic Nubank logo (charcoal dark grey circle with "nu" + purple checkmark badge)
  ctx.fillStyle = '#3D3D3D'; 
  ctx.beginPath();
  ctx.arc(60, 60, 20, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 18px "Plus Jakarta Sans", "Inter", sans-serif';
  ctx.fillText('nu', 51, 48);

  // Purple Checkmark badge overlay
  ctx.fillStyle = '#830AD1';
  ctx.beginPath();
  ctx.arc(76, 76, 9, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(72, 76);
  ctx.lineTo(74, 78);
  ctx.lineTo(79, 73);
  ctx.stroke();

  // "Via do Cliente" badge on the right
  ctx.fillStyle = '#999999';
  ctx.font = 'bold 11px "Inter", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('VIA DO CLIENTE', 610, 52);
  ctx.textAlign = 'left';

  // 2. Comprovante Header
  ctx.fillStyle = '#111111';
  ctx.font = '500 28px "Inter", sans-serif';
  ctx.fillText('Comprovante de', 40, 110);
  ctx.fillText('transferência', 40, 145);

  // Date and Time formatter to match image exactly (uppercase Portuguese months)
  const formatReceiptDateTime = (d: string, t: string) => {
    let day = '01';
    let month = 'JUL';
    let year = '2026';
    
    if (d.includes('/')) {
      const parts = d.split('/');
      if (parts.length === 3) {
        day = parts[0].padStart(2, '0');
        const mIdx = parseInt(parts[1]) - 1;
        const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
        month = months[mIdx] || 'JUL';
        year = parts[2];
      }
    } else if (d.includes('-')) {
      const parts = d.split('-');
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          year = parts[0];
          const mIdx = parseInt(parts[1]) - 1;
          const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
          month = months[mIdx] || 'JUL';
          day = parts[2].padStart(2, '0');
        } else {
          day = parts[0].padStart(2, '0');
          const mIdx = parseInt(parts[1]) - 1;
          const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
          month = months[mIdx] || 'JUL';
          year = parts[2];
        }
      }
    }
    
    return `${day} ${month} ${year} - ${t || '17:55:23'}`;
  };

  ctx.fillStyle = '#888888';
  ctx.font = 'bold 13px "Inter", sans-serif';
  const formattedDateTime = formatReceiptDateTime(dateStr, timeStr);
  ctx.fillText(formattedDateTime, 40, 200);

  // Divider Line
  ctx.strokeStyle = '#EEEEEE';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(40, 235);
  ctx.lineTo(610, 235);
  ctx.stroke();

  let y = 265;

  // Masking Helper using '...' prefix to match image
  const maskCpfStr = (val: string) => {
    const cleaned = val ? val.replace(/\D/g, '') : '';
    if (cleaned.length === 11) {
      return `...${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-**`;
    }
    return val || '...***.***-**';
  };

  // Row Drawing Helper - Left label: Bold Black, Right value: Regular Gray
  const drawRow = (label: string, value: string, isValueBold = false) => {
    // Label (black, bold)
    ctx.fillStyle = '#111111';
    ctx.font = 'bold 15px "Inter", sans-serif';
    ctx.fillText(label, 40, y);

    // Value (gray, regular, aligned to the right)
    ctx.fillStyle = '#666666';
    ctx.font = isValueBold ? 'bold 15px "Inter", sans-serif' : 'normal 15px "Inter", sans-serif';
    ctx.textAlign = 'right';
    
    if (label === 'ID da transação' && value.length === 32) {
      const part1 = value.substring(0, 16);
      const part2 = value.substring(16);
      ctx.fillText(part1, 610, y);
      ctx.fillText(part2, 610, y + 18);
      ctx.textAlign = 'left';
      y += 58; // Extra spacing for the double line
    } else {
      const maxLen = 38;
      const cleanValue = value.length > maxLen ? value.substring(0, maxLen) + '...' : value;
      ctx.fillText(cleanValue, 610, y);
      ctx.textAlign = 'left';
      y += 40;
    }
  };

  // Section Header Helper
  const drawSectionHeader = (title: string) => {
    y += 10;
    // Draw fine border above header to separate sections
    ctx.strokeStyle = '#F3F4F6';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, y - 5);
    ctx.lineTo(610, y - 5);
    ctx.stroke();

    ctx.fillStyle = '#111111';
    ctx.font = 'bold 16px "Inter", sans-serif';
    ctx.fillText(title, 40, y);
    y += 30;
  };

  // Format currency value helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  // 3. Draw Value Information
  drawRow('Valor', formatCurrency(amount), true);
  drawRow('Tipo de transferência', type, false);
  drawRow('ID da transação', transactionId, false);

  // 4. Destination Section (comes first in Nubank layouts)
  drawSectionHeader('Destino');
  drawRow('Nome', recipientName.toUpperCase());
  drawRow('CPF', maskCpfStr(recipientCpf));
  drawRow('Instituição', recipientBank.toUpperCase());

  // 5. Origin Section
  drawSectionHeader('Origem');
  drawRow('Nome', senderName.toUpperCase());
  drawRow('Instituição', 'NU PAGAMENTOS - IP');
  drawRow('CPF', maskCpfStr(senderCpf));

  // 6. Footer Gray Container Block
  y += 20;
  ctx.fillStyle = '#F5F5F5';
  // Draw rounded gray block
  const blockX = 40;
  const blockY = y;
  const blockW = 570;
  const blockH = 220;
  const radius = 16;
  
  ctx.beginPath();
  ctx.moveTo(blockX + radius, blockY);
  ctx.lineTo(blockX + blockW - radius, blockY);
  ctx.quadraticCurveTo(blockX + blockW, blockY, blockX + blockW, blockY + radius);
  ctx.lineTo(blockX + blockW, blockY + blockH - radius);
  ctx.quadraticCurveTo(blockX + blockW, blockY + blockH, blockX + blockW - radius, blockY + blockH);
  ctx.lineTo(blockX + radius, blockY + blockH);
  ctx.quadraticCurveTo(blockX, blockY + blockH, blockX, blockY + blockH - radius);
  ctx.lineTo(blockX, blockY + radius);
  ctx.quadraticCurveTo(blockX, blockY, blockX + radius, blockY);
  ctx.closePath();
  ctx.fill();

  // Draw Footer text inside grey container
  let fy = y + 20;
  
  // CNPJ Block
  ctx.fillStyle = '#111111';
  ctx.font = 'bold 13px "Inter", sans-serif';
  ctx.fillText('Nu Pagamentos S.A. - Instituição de Pagamento', 60, fy);
  fy += 18;
  ctx.fillStyle = '#666666';
  ctx.font = '500 12px "Inter", sans-serif';
  ctx.fillText('CNPJ 18.236.120/0001-58', 60, fy);
  fy += 26;

  // ID Block
  ctx.fillStyle = '#111111';
  ctx.font = 'bold 12px "Inter", sans-serif';
  ctx.fillText('ID da transação:', 60, fy);
  fy += 16;
  ctx.fillStyle = '#555555';
  ctx.font = '500 12px "JetBrains Mono", "Courier", monospace';
  ctx.fillText(transactionId, 60, fy);
  fy += 26;

  // Help Info
  ctx.fillStyle = '#555555';
  ctx.font = '500 12px "Inter", sans-serif';
  ctx.fillText('Estamos aqui para ajudar se você tiver alguma dúvida.', 60, fy);
  fy += 18;
  ctx.fillStyle = '#830AD1';
  ctx.font = 'bold 12px "Inter", sans-serif';
  ctx.fillText('Me ajuda →', 60, fy);
  
  // Regulatory Ouvidoria text below the block
  y += 235;
  ctx.fillStyle = '#999999';
  ctx.font = '500 10px "Inter", sans-serif';
  
  // Wrap text helper for Ouvidoria
  const ouvidoriaText = 'Ouvidoria: 0800 887 0463 ou demais canais em nubank.com.br/contatos#ouvidoria (Atendimento das 8h às 18h em dias úteis).';
  ctx.fillText(ouvidoriaText, 40, y);

  // Export as file
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = `comprovante_nu_${dateStr.replace(/\//g, '-')}_${timeStr.replace(/:/g, '')}.png`;
  link.href = dataUrl;
  link.click();
}
