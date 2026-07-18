import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, Search, SlidersHorizontal, ArrowDown, ArrowUp, 
  Download, FileSpreadsheet, FileText, Calendar, Filter, X,
  Landmark, Receipt, ArrowUpRight, HelpCircle
} from 'lucide-react';
import { BankUser, StatementItem } from '../types';

interface ExtratoViewProps {
  user: BankUser;
  history: StatementItem[];
  hideBalance: boolean;
  onBack: () => void;
  onSelectTransaction: (item: StatementItem) => void;
  onClearHistory?: () => void;
}

export default function ExtratoView({ 
  user, history, hideBalance, onBack, onSelectTransaction, onClearHistory 
}: ExtratoViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'tudo' | 'entradas' | 'saidas' | 'pix' | 'pagamentos' | 'depositos'>('tudo');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Format currency values
  const formatValue = (value: number) => {
    if (hideBalance) return '••••';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Filter transactions based on active capsule and search input
  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      // 1. Filter by category
      if (activeFilter === 'entradas' && !item.incoming) return false;
      if (activeFilter === 'saidas' && item.incoming) return false;
      if (activeFilter === 'pix' && item.type !== 'Pix') return false;
      if (activeFilter === 'pagamentos' && item.type !== 'Pagamento de Fatura') return false;
      if (activeFilter === 'depositos' && item.type !== 'Depósito') return false;

      // 2. Filter by search text
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const titleMatch = item.title.toLowerCase().includes(query);
        const descMatch = item.description.toLowerCase().includes(query);
        const senderMatch = item.senderName?.toLowerCase().includes(query) || false;
        const recipientMatch = item.recipientName?.toLowerCase().includes(query) || false;
        const valueMatch = item.amount.toString().includes(query);
        const typeMatch = item.type.toLowerCase().includes(query);
        
        return titleMatch || descMatch || senderMatch || recipientMatch || valueMatch || typeMatch;
      }

      return true;
    });
  }, [history, activeFilter, searchQuery]);

  // Summarize filtered transactions
  const summary = useMemo(() => {
    let totalIncoming = 0;
    let totalOutgoing = 0;

    filteredHistory.forEach(item => {
      if (item.incoming) {
        totalIncoming += item.amount;
      } else {
        totalOutgoing += item.amount;
      }
    });

    return {
      incoming: totalIncoming,
      outgoing: totalOutgoing,
      net: totalIncoming - totalOutgoing
    };
  }, [filteredHistory]);

  // Group filtered history items by date
  const groupedHistoryByDate = useMemo(() => {
    const groups: { [key: string]: StatementItem[] } = {};
    
    filteredHistory.forEach(item => {
      const date = item.date; // YYYY-MM-DD
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(item);
    });

    // Sort dates descending
    return Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .map(date => ({
        date,
        items: groups[date]
      }));
  }, [filteredHistory]);

  // Convert YYYY-MM-DD to "Hoje", "Ontem" or "15 JUN"
  const getFriendlyDateHeader = (dateStr: string) => {
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (dateStr === todayStr) {
        return 'Hoje';
      }
      if (dateStr === yesterdayStr) {
        return 'Ontem';
      }

      const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ];
      const dateParts = dateStr.split('-');
      if (dateParts.length === 3) {
        const day = parseInt(dateParts[2], 10);
        const monthIndex = parseInt(dateParts[1], 10) - 1;
        const year = dateParts[0];
        
        // Show year if not current year
        const isCurrentYear = parseInt(year, 10) === today.getFullYear();
        if (isCurrentYear) {
          return `${day} de ${months[monthIndex]}`;
        } else {
          return `${day} de ${months[monthIndex]} de ${year}`;
        }
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Handle Export to TXT/CSV File
  const handleExportStatement = (format: 'txt' | 'csv') => {
    try {
      let content = '';
      const filename = `extrato_${user.name.replace(/\s+/g, '_').toLowerCase()}.${format}`;

      if (format === 'txt') {
        content += `==============================================\n`;
        content += `       EXTRATO SIMULADO - PGBANK              \n`;
        content += `==============================================\n`;
        content += `Cliente: ${user.name}\n`;
        content += `CPF: ${user.cpf}\n`;
        content += `Agência: ${user.agency}  |  Conta: ${user.accountNumber}\n`;
        content += `Exportado em: ${new Date().toLocaleString('pt-BR')}\n`;
        content += `----------------------------------------------\n\n`;
        content += `FILTRO ATIVO: ${activeFilter.toUpperCase()}\n`;
        content += `Total Entradas (+): ${formatValue(summary.incoming)}\n`;
        content += `Total Saídas   (-): ${formatValue(summary.outgoing)}\n`;
        content += `Saldo Líquido     : ${formatValue(summary.net)}\n`;
        content += `----------------------------------------------\n\n`;
        content += `TRANSAÇÕES:\n\n`;

        filteredHistory.forEach(item => {
          const sign = item.incoming ? '(+)' : '(-)';
          const partner = item.incoming ? `De: ${item.senderName || 'N/A'}` : `Para: ${item.recipientName || 'N/A'}`;
          content += `[${item.date} ${item.time}] ${item.title} ${sign}\n`;
          content += `Valor: R$ ${item.amount.toFixed(2)} | Tipo: ${item.type}\n`;
          content += `${partner}\n`;
          content += `Descrição: ${item.description}\n`;
          content += `----------------------------------------------\n`;
        });
      } else {
        // CSV Format
        content += `Data;Hora;Titulo;Tipo;Sentido;Valor;Nome Envolvido;Descricao\n`;
        filteredHistory.forEach(item => {
          const sense = item.incoming ? 'Entrada' : 'Saida';
          const partner = item.incoming ? (item.senderName || '') : (item.recipientName || '');
          content += `"${item.date}";"${item.time}";"${item.title}";"${item.type}";"${sense}";"${item.amount.toFixed(2)}";"${partner}";"${item.description}"\n`;
        });
      }

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);

      setToastMessage(`Extrato baixado com sucesso em .${format.toUpperCase()}!`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      setToastMessage('Falha ao exportar extrato.');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white text-neutral-800 relative select-none">
      
      {/* Toast Alert Notification */}
      {showToast && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-neutral-900 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg z-50 flex items-center gap-2 animate-fade-in">
          <span>{toastMessage}</span>
          <button onClick={() => setShowToast(false)} className="text-white hover:text-neutral-200">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Header Sticky Bar */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between bg-white border-b border-neutral-100 sticky top-0 z-20">
        <div className="flex items-center gap-1.5">
          <button 
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-neutral-100 text-neutral-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-neutral-900 font-display">Extrato da Conta</h1>
        </div>
        <div className="flex items-center gap-1">
          {/* Download Action Menu */}
          <button 
            onClick={() => handleExportStatement('txt')}
            className="p-2 rounded-full hover:bg-neutral-100 text-neutral-600 transition-colors"
            title="Baixar Extrato TXT"
          >
            <Download className="w-4 h-4 text-neutral-800" />
          </button>
          <button 
            onClick={() => handleExportStatement('csv')}
            className="p-2 rounded-full hover:bg-neutral-100 text-neutral-600 transition-colors"
            title="Baixar Extrato CSV Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-neutral-800" />
          </button>
          <button className="p-2 rounded-full hover:bg-neutral-100 text-neutral-600 transition-colors">
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Search and Filter Settings */}
      <div className="px-4 pt-3 pb-3 flex flex-col gap-3 bg-white border-b border-neutral-100/70">
        {/* Elegant Search Input */}
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome, valor ou tipo..."
            className="w-full bg-neutral-50 hover:bg-neutral-100/70 focus:bg-white text-xs text-neutral-800 pl-10 pr-9 py-2.5 rounded-xl border border-neutral-200 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="p-1 rounded-full text-neutral-400 hover:text-neutral-600 absolute right-2.5 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Filter Capsule Rows (Interactive Category Selection!) */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'tudo', label: 'Tudo' },
            { id: 'entradas', label: 'Entradas' },
            { id: 'saidas', label: 'Saídas' },
            { id: 'pix', label: 'Pix' },
            { id: 'pagamentos', label: 'Pagamentos' },
            { id: 'depositos', label: 'Depósitos' }
          ].map(cap => (
            <button
              key={cap.id}
              onClick={() => setActiveFilter(cap.id as any)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all border ${
                activeFilter === cap.id 
                  ? 'bg-neutral-900 border-neutral-900 text-white shadow-sm' 
                  : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {cap.label}
            </button>
          ))}
        </div>
      </div>

      {/* Period summary panel */}
      <div className="px-5 py-4 bg-neutral-50/50 border-b border-neutral-100 flex items-center justify-between gap-2.5 text-xs">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wide">Entradas do filtro</span>
          <span className="font-bold text-emerald-600">{formatValue(summary.incoming)}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wide">Saídas do filtro</span>
          <span className="font-bold text-neutral-800">-{formatValue(summary.outgoing)}</span>
        </div>
        <div className="flex flex-col gap-0.5 text-right">
          <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wide">Resultado líquido</span>
          <span className={`font-bold ${summary.net >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {summary.net >= 0 ? '+' : ''} {formatValue(summary.net)}
          </span>
        </div>
      </div>

      {/* Interactive Statement List Grouped by Day */}
      <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar">
        
        {groupedHistoryByDate.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 px-6 text-neutral-400 gap-3 text-center">
            <div className="w-14 h-14 rounded-full bg-neutral-50 border border-neutral-100 flex items-center justify-center text-neutral-300">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold text-neutral-800">Nenhuma transação encontrada</span>
              <p className="text-xs text-neutral-400 leading-normal max-w-[240px] mx-auto">
                {searchQuery 
                  ? 'Não encontramos resultados para a sua busca. Tente buscar outros termos.' 
                  : 'Não há transações registradas para esse filtro.'}
              </p>
            </div>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="text-neutral-900 font-bold text-xs mt-1 hover:underline"
              >
                Limpar pesquisa
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col">
            {groupedHistoryByDate.map((group) => (
              <div key={group.date} className="flex flex-col">
                {/* Daily Sticky Header */}
                <div className="bg-neutral-50 px-5 py-2 border-b border-neutral-100 sticky top-0 z-10">
                  <span className="text-[11px] font-extrabold text-neutral-500 uppercase tracking-widest">
                    {getFriendlyDateHeader(group.date)}
                  </span>
                </div>

                {/* Items in that day */}
                <div className="divide-y divide-neutral-100/50">
                  {group.items.map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => onSelectTransaction(item)}
                      className="px-5 py-4 hover:bg-neutral-50 active:bg-neutral-100/80 transition-all cursor-pointer flex items-start justify-between gap-3"
                    >
                      {/* Left: Indicator Icon & details */}
                      <div className="flex gap-3">
                        <div className={`mt-0.5 w-8.5 h-8.5 rounded-full flex items-center justify-center border ${
                          item.incoming 
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                            : 'bg-neutral-50 border-neutral-100 text-neutral-600'
                        }`}>
                          {item.incoming ? (
                            <ArrowDown className="w-4 h-4" strokeWidth={2.5} />
                          ) : (
                            <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[13px] font-bold text-neutral-900 leading-tight">
                            {item.title}
                          </span>
                          <span className="text-xs text-neutral-500 font-semibold leading-tight">
                            {item.incoming 
                              ? (item.senderName || 'Não identificado')
                              : (item.recipientName || 'Não identificado')
                            }
                          </span>
                          {item.description && (
                            <p className="text-[10px] text-neutral-400 mt-0.5 line-clamp-1 max-w-[190px]">
                              {item.description}
                            </p>
                          )}
                          <span className="text-[10px] text-neutral-400 font-bold mt-1">
                            {item.time.substring(0, 5)} • {item.type}
                          </span>
                        </div>
                      </div>

                      {/* Right: Amount display */}
                      <div className="flex flex-col items-end gap-1.5 text-right shrink-0">
                        <span className={`text-[13px] font-extrabold font-display ${
                          item.incoming ? 'text-emerald-600' : 'text-neutral-900'
                        }`}>
                          {item.incoming ? '+' : '-'} {formatValue(item.amount)}
                        </span>
                        
                        {/* Interactive receipt tag */}
                        <span className="text-[9px] font-extrabold text-neutral-800 bg-neutral-100 hover:bg-neutral-200 px-2 py-0.5 rounded-md border border-neutral-200/50 uppercase tracking-wide">
                          Recibo
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
