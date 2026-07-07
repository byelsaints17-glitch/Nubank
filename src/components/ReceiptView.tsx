import React from 'react';
import { ArrowLeft, Download, Share2, ArrowRight, UserCheck, CheckCircle2, Copy, Check } from 'lucide-react';
import { BankUser, BankRecipient, TransactionDetails } from '../types';
import { downloadReceiptAsImage } from './ReceiptDownloader';

interface ReceiptViewProps {
  user: BankUser;
  recipient: BankRecipient;
  transaction: TransactionDetails;
  onBackToHome: () => void;
}

export default function ReceiptView({ user, recipient, transaction, onBackToHome }: ReceiptViewProps) {
  const [copied, setCopied] = React.useState(false);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  const handleDownload = () => {
    downloadReceiptAsImage(
      transaction.type,
      transaction.amount,
      transaction.date,
      transaction.time,
      user.name,
      user.cpf,
      user.bankName,
      user.agency,
      user.accountNumber,
      recipient.name,
      recipient.cpf,
      recipient.bankName,
      recipient.agency,
      recipient.accountNumber,
      transaction.transactionId
    );
  };

  const handleCopyText = () => {
    const text = `
=== COMPROVANTE DE TRANSFERÊNCIA ===
Tipo: ${transaction.type}
Valor: ${formatCurrency(transaction.amount)}
Data/Hora: ${transaction.date} às ${transaction.time}

ORIGEM:
Nome: ${user.name}
Banco: ${user.bankName}
Agência: ${user.agency}
Conta: ${user.accountNumber}

DESTINO:
Nome: ${recipient.name}
Banco: ${recipient.bankName}
Agência: ${recipient.agency}
Conta: ${recipient.accountNumber}

ID da Transação: ${transaction.transactionId}
===================================
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatReceiptDateTime = (dateStr: string, timeStr: string) => {
    let day = '01';
    let month = 'JUL';
    let year = '2026';
    
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        day = parts[0].padStart(2, '0');
        const mIdx = parseInt(parts[1]) - 1;
        const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
        month = months[mIdx] || 'JUL';
        year = parts[2];
      }
    } else if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
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
    
    return `${day} ${month} ${year} - ${timeStr || '17:55:23'}`;
  };

  const maskCpfStr = (val: string) => {
    const cleaned = val ? val.replace(/\D/g, '') : '';
    if (cleaned.length === 11) {
      return `...${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-**`;
    }
    return val || '...***.***-**';
  };

  return (
    <div className="flex-1 flex flex-col bg-neutral-50/60 text-neutral-900 pb-12 select-text">
      
      {/* Receipt Nav */}
      <div className="px-4 py-3 flex items-center justify-between bg-white border-b border-neutral-200/50 sticky top-0 z-10 select-none">
        <button 
          onClick={onBackToHome}
          className="p-2 -ml-2 rounded-full hover:bg-neutral-100 text-neutral-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-bold text-sm tracking-tight text-neutral-800">Comprovante de Transferência</span>
        <div className="w-5"></div> {/* Spacer */}
      </div>

      {/* Main elevated container simulating the rectangular mobile voucher */}
      <div className="w-full max-w-md mx-auto my-6 px-4 select-text">
        <div 
          id="nubank-receipt-print" 
          className="bg-white border border-neutral-200/60 rounded-3xl shadow-xl overflow-hidden flex flex-col pt-8 pb-6 px-7 gap-6"
        >
          {/* Branded Logo and Status Badge */}
          <div className="flex items-center justify-between select-none">
            <div className="flex items-center gap-1">
              <span className="text-[32px] font-extrabold tracking-tighter text-neutral-900 leading-none">nu</span>
              <div className="w-4.5 h-4.5 rounded-full bg-neutral-400 flex items-center justify-center text-white shrink-0 mt-2">
                <Check className="w-2.5 h-2.5 stroke-[4]" />
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="flex flex-col gap-1.5 mt-1">
            <h2 className="text-[26px] font-medium text-neutral-900 tracking-tight leading-8 font-sans">
              Comprovante de
              <br />
              transferência
            </h2>
            <span className="text-xs text-neutral-400 font-bold tracking-tight font-sans">
              {formatReceiptDateTime(transaction.date, transaction.time)}
            </span>
          </div>

          <div className="h-[1px] bg-neutral-100 w-full"></div>

          {/* Amount Table */}
          <div className="flex flex-col gap-4">
            
            {/* Valor Row */}
            <div className="flex justify-between items-center text-sm py-0.5">
              <span className="text-neutral-900 font-bold">Valor</span>
              <span className="text-sm font-normal text-neutral-500 font-sans">
                {formatCurrency(transaction.amount)}
              </span>
            </div>

            {/* Tipo de transferência Row */}
            <div className="flex justify-between items-center text-sm py-0.5">
              <span className="text-neutral-900 font-bold">Tipo de transferência</span>
              <span className="font-normal text-neutral-500">{transaction.type}</span>
            </div>

            {/* ID da transação Row */}
            <div className="flex justify-between items-start text-sm py-0.5">
              <span className="text-neutral-900 font-bold shrink-0">ID da transação</span>
              <span className="font-normal text-neutral-500 text-right break-all max-w-[200px] font-mono leading-tight">
                {transaction.transactionId.length === 32 ? (
                  <>
                    {transaction.transactionId.substring(0, 16)}
                    <br />
                    {transaction.transactionId.substring(16)}
                  </>
                ) : (
                  transaction.transactionId
                )}
              </span>
            </div>

            {/* Destino Sub-table */}
            <div className="flex flex-col gap-3.5 mt-2 border-t border-neutral-100 pt-4">
              <span className="text-sm font-medium text-neutral-400">Destino</span>
              
              <div className="flex justify-between items-start text-sm">
                <span className="text-neutral-900 font-bold shrink-0">Nome</span>
                <span className="font-normal text-neutral-500 text-right max-w-[220px] break-words uppercase">{recipient.name}</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-neutral-900 font-bold">CPF</span>
                <span className="font-normal text-neutral-500 font-mono">
                  {maskCpfStr(recipient.cpf || '')}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-neutral-900 font-bold">Instituição</span>
                <span className="font-normal text-neutral-500 text-right max-w-[220px] uppercase">{recipient.bankName}</span>
              </div>

              {recipient.pixKey && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-900 font-bold">Chave Pix</span>
                  <span className="font-normal text-neutral-500 text-right break-all max-w-[220px]">
                    {recipient.pixKey}
                  </span>
                </div>
              )}
            </div>

            {/* Origem Sub-table */}
            <div className="flex flex-col gap-3.5 mt-2 border-t border-neutral-100 pt-4">
              <span className="text-sm font-medium text-neutral-400">Origem</span>
              
              <div className="flex justify-between items-start text-sm">
                <span className="text-neutral-900 font-bold shrink-0">Nome</span>
                <span className="font-normal text-neutral-500 text-right max-w-[220px] break-words uppercase">{user.name}</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-neutral-900 font-bold">Instituição</span>
                <span className="font-normal text-neutral-500 uppercase">{user.bankName}</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-neutral-900 font-bold">CPF</span>
                <span className="font-normal text-neutral-500 font-mono">
                  {maskCpfStr(user.cpf || '')}
                </span>
              </div>
            </div>

          </div>

          <div className="h-[1px] bg-neutral-100 w-full mt-2"></div>

          {/* Dynamic Nubank styled bottom section from image */}
          <div className="p-5 bg-[#f5f5f5] text-neutral-600 rounded-2xl flex flex-col gap-4 text-xs select-text">
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-neutral-800 text-xs">Nu Pagamentos S.A. - Instituição de Pagamento</span>
              <span className="text-neutral-400 text-[10px]">CNPJ 18.236.120/0001-58</span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="font-bold text-neutral-800 text-[11px]">ID da transação:</span>
              <span className="font-mono text-neutral-500 text-[10px] select-all break-all">{transaction.transactionId}</span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-neutral-500 text-[11px]">Estamos aqui para ajudar se você tiver alguma dúvida.</span>
              <a 
                href="https://nubank.com.br/contato" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-[#830AD1] font-extrabold hover:underline flex items-center gap-1 self-start mt-0.5"
              >
                Me ajuda
                <ArrowRight className="w-3.5 h-3.5 inline text-[#830AD1]" />
              </a>
            </div>
          </div>

          {/* Regulatory Ouvidoria text printed outside gray container */}
          <p className="text-[9px] text-neutral-400 leading-normal px-1 text-center">
            Ouvidoria: 0800 887 0463 ou demais canais em nubank.com.br/contatos#ouvidoria (Atendimento das 8h às 18h em dias úteis).
          </p>

        </div>
      </div>

      {/* Control Buttons (Fully responsive) */}
      <div className="px-6 w-full max-w-md mx-auto flex flex-col gap-2.5 select-none mt-4">
        
        {/* Action: Baixar Comprovante */}
        <button 
          onClick={handleDownload}
          className="w-full bg-[#830AD1] hover:bg-[#7209B7] text-white py-3 rounded-xl font-bold text-sm tracking-wide shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
        >
          <Download className="w-4.5 h-4.5" />
          Baixar Comprovante (PNG)
        </button>

        {/* Action: Copiar texto */}
        <button 
          onClick={handleCopyText}
          className="w-full bg-white hover:bg-neutral-50 text-neutral-700 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border border-neutral-200 transition-all active:scale-[0.99] cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-4.5 h-4.5 text-emerald-600" />
              Texto Copiado!
            </>
          ) : (
            <>
              <Copy className="w-4.5 h-4.5" />
              Copiar Dados em Texto
            </>
          )}
        </button>

        {/* Action: Voltar para Home */}
        <button 
          onClick={onBackToHome}
          className="w-full border-2 border-neutral-200 hover:border-neutral-300 text-neutral-600 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-all active:scale-[0.99] cursor-pointer mt-1"
        >
          Ir para a Tela Inicial
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
}
