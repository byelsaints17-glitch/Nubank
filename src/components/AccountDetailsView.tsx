import React from 'react';
import { 
  ArrowLeft, HelpCircle, ArrowDown, ArrowUp, 
  Percent, CircleDot, ChevronRight, Landmark, Receipt, ArrowUpRight
} from 'lucide-react';
import { BankUser, StatementItem } from '../types';

interface AccountDetailsViewProps {
  user: BankUser;
  history: StatementItem[];
  hideBalance: boolean;
  onBack: () => void;
  onNavigate: (screen: 'home' | 'account' | 'card' | 'pix') => void;
  onSelectTransaction: (item: StatementItem) => void;
  onOpenDeposit: () => void;
  onUpdateUser?: (updated: Partial<BankUser>) => void;
}

export default function AccountDetailsView({ 
  user, history, hideBalance, onBack, onNavigate, onSelectTransaction, onOpenDeposit, onUpdateUser 
}: AccountDetailsViewProps) {
  
  const [isEditingBalance, setIsEditingBalance] = React.useState(false);
  const [balanceInput, setBalanceInput] = React.useState(user.balance.toString());

  React.useEffect(() => {
    setBalanceInput(user.balance.toString());
  }, [user.balance]);
  
  const formatValue = (value: number) => {
    if (hideBalance) return '••••';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDateLabel = (dateStr: string) => {
    // Convert YYYY-MM-DD or standard dates to friendly Brazilian labels e.g. "17 JUN"
    try {
      const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
      
      // If the string contains a month abbreviation already (like "03 JAN 2023"), return it in a compact form
      if (typeof dateStr === 'string' && dateStr.split(' ').length >= 2) {
        const parts = dateStr.split(' ');
        return `${parts[0]} ${parts[1].toUpperCase()}`;
      }

      const dateObj = new Date(dateStr);
      if (isNaN(dateObj.getTime())) return dateStr;
      
      const day = String(dateObj.getDate()).padStart(2, '0');
      const monthAbbrev = months[dateObj.getMonth()];
      return `${day} ${monthAbbrev}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white text-neutral-800">
      
      {/* Detail View Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between bg-white border-b border-neutral-100 sticky top-0 z-20">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-neutral-100 text-neutral-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button className="p-2 rounded-full hover:bg-neutral-100 text-neutral-600 transition-colors">
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>

      {/* Available Balance Section */}
      <div className="px-5 pt-4 pb-5 flex flex-col gap-1.5 border-b border-neutral-100">
        <span className="text-xs text-neutral-500 font-bold tracking-tight">Saldo disponível (Toque para editar)</span>
        {isEditingBalance ? (
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const newBal = parseFloat(balanceInput);
              if (!isNaN(newBal)) {
                onUpdateUser?.({ balance: newBal });
              }
              setIsEditingBalance(false);
            }}
            className="flex items-center gap-1.5 max-w-xs"
          >
            <span className="text-xl font-bold text-neutral-400">R$</span>
            <input 
              type="number"
              step="any"
              value={balanceInput}
              onChange={(e) => setBalanceInput(e.target.value)}
              className="bg-neutral-50 border border-neutral-300 text-neutral-900 font-extrabold px-2 py-1 rounded-lg text-lg focus:outline-none focus:border-[#830AD1] w-full"
              autoFocus
              onBlur={() => {
                const newBal = parseFloat(balanceInput);
                if (!isNaN(newBal)) {
                  onUpdateUser?.({ balance: newBal });
                }
                setIsEditingBalance(false);
              }}
            />
            <button type="submit" className="bg-[#830AD1] text-white px-2.5 py-1.5 rounded-lg text-xs font-bold uppercase">OK</button>
          </form>
        ) : (
          <h1 
            onClick={() => setIsEditingBalance(true)}
            className="text-3xl font-extrabold text-neutral-900 tracking-tight font-display cursor-pointer hover:bg-neutral-50 rounded-lg p-1 -ml-1 transition-all w-fit"
            title="Clique para editar o saldo"
          >
            {formatValue(user.balance)}
          </h1>
        )}
      </div>

      {/* Secondary Cards: Money Kept & Income */}
      <div className="px-4 flex flex-col gap-2.5">
        {/* Kept Money */}
        <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200/40 flex items-center justify-between hover:bg-neutral-100/50 transition-colors cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-neutral-200/60 flex items-center justify-center text-neutral-600">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z"/>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-neutral-700">Dinheiro guardado</span>
              <span className="text-xs text-neutral-500 font-medium">Renderá a 100% do CDI</span>
            </div>
          </div>
          <span className="text-sm font-bold text-neutral-800">{formatValue(0)}</span>
        </div>

        {/* CDI Income Card */}
        <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200/40 flex items-center justify-between hover:bg-neutral-100/50 transition-colors cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-neutral-200/60 flex items-center justify-center text-emerald-600">
              <Percent className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-neutral-700">Rendimento total</span>
              <span className="text-xs text-neutral-400">Este mês</span>
            </div>
          </div>
          <span className="text-sm font-bold text-emerald-600">+R$ 14,80</span>
        </div>
      </div>

      {/* Internal Action Circular Row */}
      <div className="mt-5 px-4">
        <div className="grid grid-cols-4 gap-2">
          {/* Action: Depositar */}
          <button 
            onClick={onOpenDeposit}
            className="flex flex-col items-center gap-1.5 group"
          >
            <div className="w-12 h-12 rounded-full bg-neutral-100 group-hover:bg-neutral-200 flex items-center justify-center text-neutral-900 active:scale-95 transition-all">
              <Landmark className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-neutral-600 text-center">
              Depositar
            </span>
          </button>

          {/* Action: Pagar */}
          <button 
            onClick={() => onNavigate('card')}
            className="flex flex-col items-center gap-1.5 group"
          >
            <div className="w-12 h-12 rounded-full bg-neutral-100 group-hover:bg-neutral-200 flex items-center justify-center text-neutral-900 active:scale-95 transition-all">
              <Receipt className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-neutral-600 text-center">
              Pagar
            </span>
          </button>

          {/* Action: Transferir */}
          <button 
            onClick={() => onNavigate('pix')}
            className="flex flex-col items-center gap-1.5 group"
          >
            <div className="w-12 h-12 rounded-full bg-neutral-100 group-hover:bg-neutral-200 flex items-center justify-center text-neutral-900 active:scale-95 transition-all">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-neutral-600 text-center">
              Transferir
            </span>
          </button>

          {/* Action: Cobrar */}
          <button className="flex flex-col items-center gap-1.5 group opacity-75">
            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-900">
              <CircleDot className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-neutral-600 text-center">
              Cobrar
            </span>
          </button>
        </div>
      </div>

      {/* Statement History / Histórico Section */}
      <div className="mt-7 border-t border-neutral-100/80 pt-5 flex-1 flex flex-col">
        <h3 className="text-base font-bold text-neutral-800 px-5 mb-3 font-display">Histórico</h3>
        
        {history.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-10 px-5 text-neutral-400 gap-2">
            <div className="w-12 h-12 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-300">
              <Landmark className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold">Sem transações no extrato</span>
            <p className="text-[10px] text-center text-neutral-400">Insira transações no Painel de Controle ao lado para simular o histórico.</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-neutral-100/70">
            {history.map((item) => (
              <div 
                key={item.id}
                onClick={() => onSelectTransaction(item)}
                className="px-5 py-3.5 hover:bg-neutral-50 active:bg-neutral-100 transition-colors cursor-pointer flex items-start justify-between gap-3 group"
              >
                {/* Left side: Icon, title, recipient, time */}
                <div className="flex gap-3">
                  <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center ${
                    item.incoming ? 'bg-emerald-100 text-emerald-600' : 'bg-neutral-100 text-neutral-600'
                  }`}>
                    {item.incoming ? (
                      <ArrowDown className="w-4 h-4" />
                    ) : (
                      <ArrowUp className="w-4 h-4" />
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[13px] font-bold text-neutral-800 leading-tight">
                      {item.title}
                    </span>
                    <span className="text-xs text-neutral-500 font-medium">
                      {item.incoming 
                        ? (item.senderName || 'Não identificado')
                        : (item.recipientName || 'Não identificado')
                      }
                    </span>
                    <span className="text-[10px] text-neutral-400 font-medium mt-0.5">
                      {item.time.substring(0, 5)}
                    </span>
                  </div>
                </div>

                {/* Right side: Amount and date label */}
                <div className="flex flex-col items-end gap-1 text-right">
                  <span className={`text-[13px] font-bold ${
                    item.incoming ? 'text-emerald-600' : 'text-neutral-800'
                  }`}>
                    {item.incoming ? '+' : '-'} {formatValue(item.amount)}
                  </span>
                  <span className="text-[10px] text-neutral-400 font-bold bg-neutral-100 px-2 py-0.5 rounded-full">
                    {formatDateLabel(item.date)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
