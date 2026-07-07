import React, { useState, useEffect } from 'react';
import { 
  Eye, EyeOff, HelpCircle, Mail, ChevronRight, 
  QrCode, CreditCard, DollarSign, Wallet, TrendingUp, 
  ArrowUpRight, Landmark, Receipt, Smartphone, ShieldAlert, Edit2
} from 'lucide-react';
import { BankUser } from '../types';

interface HomeViewProps {
  user: BankUser;
  hideBalance: boolean;
  setHideBalance: (hide: boolean) => void;
  onNavigate: (screen: 'home' | 'account' | 'card' | 'pix') => void;
  onLogout?: () => void;
  onUpdateUser?: (updated: Partial<BankUser>) => void;
}

export default function HomeView({ 
  user, hideBalance, setHideBalance, onNavigate, onLogout, onUpdateUser 
}: HomeViewProps) {
  
  // Inline edit states
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user.name);

  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [balanceInput, setBalanceInput] = useState(user.balance.toString());

  const [isEditingInvoice, setIsEditingInvoice] = useState(false);
  const [invoiceInput, setInvoiceInput] = useState(user.creditCardInvoice.toString());

  const [isEditingLimit, setIsEditingLimit] = useState(false);
  const [limitInput, setLimitInput] = useState(user.creditCardLimit.toString());

  // Keep inputs synced if parent changes
  useEffect(() => {
    setNameInput(user.name);
  }, [user.name]);

  useEffect(() => {
    setBalanceInput(user.balance.toString());
  }, [user.balance]);

  useEffect(() => {
    setInvoiceInput(user.creditCardInvoice.toString());
  }, [user.creditCardInvoice]);

  useEffect(() => {
    setLimitInput(user.creditCardLimit.toString());
  }, [user.creditCardLimit]);

  const formatValue = (value: number) => {
    if (hideBalance) return '••••';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(' ');
    if (parts.length === 0 || !parts[0]) return 'U';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + (parts[parts.length - 1][0] || '')).toUpperCase();
  };

  return (
    <div className="flex-1 flex flex-col bg-neutral-100 pb-10 text-neutral-800">
      
      {/* Authentic Nubank Deep Purple Header */}
      <div className="bg-[#830AD1] text-white px-5 pt-6 pb-6 rounded-b-[24px] shadow-sm flex flex-col gap-6">
        
        {/* Top Navbar Row */}
        <div className="flex items-center justify-between">
          {/* Profile Circle */}
          <button 
            onClick={onLogout}
            className="w-11 h-11 rounded-full bg-white/20 border border-white/10 flex items-center justify-center font-bold text-sm text-white hover:bg-white/30 cursor-pointer transition-colors"
            title="Trocar Usuário (CPF)"
          >
            {getInitials(user.name)}
          </button>
          
          {/* Action Icons */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setHideBalance(!hideBalance)}
              className="p-2.5 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
              title={hideBalance ? "Mostrar saldo" : "Ocultar saldo"}
            >
              {hideBalance ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
            <button className="p-2.5 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors">
              <HelpCircle className="w-5 h-5" />
            </button>
            <button className="p-2.5 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors">
              <Mail className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Greeting / Click-to-edit name */}
        <div className="flex flex-col gap-1">
          {isEditingName ? (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (nameInput.trim()) {
                  onUpdateUser?.({ name: nameInput.trim() });
                }
                setIsEditingName(false);
              }}
              className="flex items-center gap-1.5"
            >
              <input 
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="bg-white/15 border border-white/30 text-white font-bold px-2 py-1 rounded-lg text-sm focus:outline-none focus:border-white w-full max-w-[240px]"
                autoFocus
                onBlur={() => {
                  if (nameInput.trim()) {
                    onUpdateUser?.({ name: nameInput.trim() });
                  }
                  setIsEditingName(false);
                }}
              />
              <button type="submit" className="bg-white text-[#830AD1] px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase">OK</button>
            </form>
          ) : (
            <div 
              onClick={() => setIsEditingName(true)}
              className="group cursor-pointer flex items-center gap-1.5 hover:bg-white/10 px-2 py-1 -ml-2 rounded-lg transition-all"
              title="Clique para editar o Nome"
            >
              <h2 className="text-lg font-bold font-display tracking-tight text-white flex items-center gap-1.5">
                Olá, {user.name}
                <Edit2 className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
              </h2>
            </div>
          )}
        </div>
      </div>

      {/* Main Account Balance Card */}
      <div className="px-4 -mt-3.5 z-10">
        <div 
          onClick={() => onNavigate('account')}
          className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-200/50 hover:border-neutral-300 transition-all cursor-pointer flex flex-col gap-2 group active:scale-[0.99]"
        >
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-neutral-800 font-display">Conta</span>
            <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:translate-x-1 transition-transform" />
          </div>

          <div className="flex flex-col gap-1 mt-1">
            {isEditingBalance ? (
              <div 
                onClick={(e) => e.stopPropagation()} 
                className="flex flex-col gap-1 bg-neutral-50 p-2.5 rounded-xl border border-neutral-200"
              >
                <span className="text-[10px] text-neutral-400 font-bold uppercase">Editar Saldo da Conta</span>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const newBal = parseFloat(balanceInput);
                    if (!isNaN(newBal)) {
                      onUpdateUser?.({ balance: newBal });
                    }
                    setIsEditingBalance(false);
                  }}
                  className="flex items-center gap-1.5"
                >
                  <span className="text-lg font-bold text-neutral-400">R$</span>
                  <input 
                    type="number"
                    step="any"
                    value={balanceInput}
                    onChange={(e) => setBalanceInput(e.target.value)}
                    className="bg-white border border-neutral-300 text-neutral-900 font-extrabold px-2.5 py-1.5 rounded-lg text-base focus:outline-none focus:border-[#830AD1] w-full"
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
              </div>
            ) : (
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingBalance(true);
                }}
                className="group/bal flex items-center justify-between hover:bg-neutral-50 -mx-2 px-2 py-1 rounded-xl transition-all"
                title="Clique no saldo para editar"
              >
                <span className="text-2xl font-extrabold text-neutral-900 tracking-tight font-display flex items-center gap-1.5">
                  {formatValue(user.balance)}
                  <Edit2 className="w-4 h-4 opacity-0 group-hover/bal:opacity-50 transition-opacity text-neutral-400" />
                </span>
                <span className="text-[10px] text-[#830AD1] font-bold uppercase tracking-wider opacity-0 group-hover/bal:opacity-100 transition-opacity">
                  ✏️ Editar Saldo
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dados do Usuário & Senhas Card */}
      <div className="mt-4 px-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-200/50 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#830AD1]/10 flex items-center justify-center text-[#830AD1]">
                <ShieldAlert className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-neutral-800 uppercase tracking-wider font-display">Identificação & Senhas</span>
            </div>
            {onLogout && (
              <button 
                onClick={onLogout}
                className="text-[10px] text-[#830AD1] hover:underline font-bold bg-purple-50 hover:bg-purple-100/50 px-2.5 py-1 rounded-full transition-all uppercase tracking-wide"
              >
                Trocar de Conta
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-neutral-600">
            <div className="bg-neutral-50 p-2 rounded-xl flex flex-col">
              <span className="text-[10px] text-neutral-400 font-bold uppercase">Agência / Conta</span>
              <span className="font-bold text-neutral-800 font-mono">Ag. {user.agency} • Cc {user.accountNumber}</span>
            </div>
            <div className="bg-neutral-50 p-2 rounded-xl flex flex-col">
              <span className="text-[10px] text-neutral-400 font-bold uppercase">CPF Cadastrado</span>
              <span className="font-bold text-neutral-800 font-mono">{user.cpf}</span>
            </div>
            <div className="bg-[#830AD1]/5 p-2 rounded-xl flex flex-col border border-[#830AD1]/10">
              <span className="text-[10px] text-[#830AD1] font-bold uppercase flex items-center gap-1">
                🔑 Senha do App
              </span>
              <span className="font-extrabold text-[#830AD1] font-mono text-sm mt-0.5">{user.password || '1105'}</span>
            </div>
            <div className="bg-emerald-50/50 p-2 rounded-xl flex flex-col border border-emerald-500/10">
              <span className="text-[10px] text-emerald-700 font-bold uppercase flex items-center gap-1">
                🔒 Senha Pix (Transação)
              </span>
              <span className="font-extrabold text-emerald-800 font-mono text-sm mt-0.5">{user.transactionPassword || '5424'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Actions Carousel (Scrollable) */}
      <div className="mt-5 px-4">
        <div className="flex items-start gap-3 overflow-x-auto no-scrollbar py-2 -mx-4 px-4 scroll-smooth">
          
          {/* Action: Pix */}
          <button 
            onClick={() => onNavigate('pix')}
            className="flex flex-col items-center gap-2 group cursor-pointer focus:outline-none min-w-[76px]"
          >
            <div className="w-14 h-14 rounded-full bg-neutral-200/80 group-hover:bg-neutral-200 flex items-center justify-center text-neutral-950 active:scale-95 transition-all">
              <QrCode className="w-5 h-5" />
            </div>
            <span className="text-[12px] font-bold text-neutral-700 text-center tracking-tight leading-3">
              Área Pix
            </span>
          </button>

          {/* Action: Pagar */}
          <button 
            onClick={() => onNavigate('card')}
            className="flex flex-col items-center gap-2 group cursor-pointer min-w-[76px]"
          >
            <div className="w-14 h-14 rounded-full bg-neutral-200/80 group-hover:bg-neutral-200 flex items-center justify-center text-neutral-950 active:scale-95 transition-all">
              <Receipt className="w-5 h-5" />
            </div>
            <span className="text-[12px] font-bold text-neutral-700 text-center tracking-tight leading-3">
              Pagar
            </span>
          </button>

          {/* Action: Transferir */}
          <button 
            onClick={() => onNavigate('pix')}
            className="flex flex-col items-center gap-2 group cursor-pointer min-w-[76px]"
          >
            <div className="w-14 h-14 rounded-full bg-neutral-200/80 group-hover:bg-neutral-200 flex items-center justify-center text-neutral-950 active:scale-95 transition-all">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <span className="text-[12px] font-bold text-neutral-700 text-center tracking-tight leading-3">
              Transferir
            </span>
          </button>

          {/* Action: Meus Cartões */}
          <button 
            onClick={() => onNavigate('card')}
            className="flex flex-col items-center gap-2 group cursor-pointer min-w-[76px]"
          >
            <div className="w-14 h-14 rounded-full bg-neutral-200/80 group-hover:bg-neutral-200 flex items-center justify-center text-neutral-950 active:scale-95 transition-all">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="text-[12px] font-bold text-neutral-700 text-center tracking-tight leading-3">
              Meus cartões
            </span>
          </button>

          {/* Action: Recarga */}
          <button className="flex flex-col items-center gap-2 group cursor-pointer opacity-70 min-w-[76px]">
            <div className="w-14 h-14 rounded-full bg-neutral-200/80 flex items-center justify-center text-neutral-950">
              <Smartphone className="w-5 h-5" />
            </div>
            <span className="text-[12px] font-bold text-neutral-700 text-center tracking-tight leading-3">
              Recarga
            </span>
          </button>

          {/* Action: Depositar */}
          <button 
            onClick={() => onNavigate('account')}
            className="flex flex-col items-center gap-2 group cursor-pointer min-w-[76px]"
          >
            <div className="w-14 h-14 rounded-full bg-neutral-200/80 group-hover:bg-neutral-200 flex items-center justify-center text-[#830AD1] active:scale-95 transition-all">
              <Landmark className="w-5 h-5" />
            </div>
            <span className="text-[12px] font-bold text-neutral-700 text-center tracking-tight leading-3">
              Depositar
            </span>
          </button>
        </div>
      </div>

      {/* Meus Cartões Pill */}
      <div className="mt-5 px-4">
        <button 
          onClick={() => onNavigate('card')}
          className="w-full bg-neutral-200/70 hover:bg-neutral-200 active:scale-[0.99] transition-all rounded-xl py-3 px-4 flex items-center gap-3 text-left border border-neutral-300/30"
        >
          <CreditCard className="w-5 h-5 text-neutral-700" />
          <span className="text-sm font-bold text-neutral-800 tracking-tight">Meus cartões</span>
        </button>
      </div>

      {/* Credit Card Card */}
      <div className="mt-4 px-4">
        <div 
          onClick={() => onNavigate('card')}
          className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-200/50 hover:border-neutral-300 transition-all cursor-pointer flex flex-col gap-2 group active:scale-[0.99]"
        >
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-neutral-800 font-display">Cartão de crédito</span>
            <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:translate-x-1 transition-transform" />
          </div>
          
          <div className="flex flex-col gap-1.5 mt-1">
            <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Fatura atual (Toque para editar)</span>
            
            {isEditingInvoice ? (
              <div onClick={(e) => e.stopPropagation()} className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200 mb-2">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const newInvoice = parseFloat(invoiceInput);
                    if (!isNaN(newInvoice)) {
                      onUpdateUser?.({ creditCardInvoice: newInvoice });
                    }
                    setIsEditingInvoice(false);
                  }}
                  className="flex items-center gap-1.5"
                >
                  <span className="text-sm font-bold text-neutral-400">R$</span>
                  <input 
                    type="number"
                    step="any"
                    value={invoiceInput}
                    onChange={(e) => setInvoiceInput(e.target.value)}
                    className="bg-white border border-neutral-300 text-neutral-850 font-bold px-2.5 py-1.5 rounded-lg text-sm w-full"
                    autoFocus
                    onBlur={() => {
                      const newInvoice = parseFloat(invoiceInput);
                      if (!isNaN(newInvoice)) {
                        onUpdateUser?.({ creditCardInvoice: newInvoice });
                      }
                      setIsEditingInvoice(false);
                    }}
                  />
                  <button type="submit" className="bg-[#830AD1] text-white px-2.5 py-1.5 rounded-lg text-xs font-bold uppercase">OK</button>
                </form>
              </div>
            ) : (
              <div 
                onClick={(e) => { e.stopPropagation(); setIsEditingInvoice(true); }}
                className="group/inv flex items-center justify-between hover:bg-neutral-50 -mx-1 px-1 py-0.5 rounded transition-all w-full"
              >
                <span className="text-xl font-extrabold text-[#009B9E] font-display flex items-center gap-1">
                  {formatValue(user.creditCardInvoice)}
                  <Edit2 className="w-3.5 h-3.5 opacity-0 group-hover/inv:opacity-50 transition-opacity text-[#009B9E]" />
                </span>
                <span className="text-[10px] text-[#009B9E] font-bold uppercase tracking-wider opacity-0 group-hover/inv:opacity-100 transition-opacity">
                  ✏️ Editar Fatura
                </span>
              </div>
            )}

            <div className="text-[12px] text-neutral-500 font-medium flex items-center gap-1.5 flex-wrap">
              <span>Limite disponível de</span>
              {isEditingLimit ? (
                <div onClick={(e) => e.stopPropagation()} className="inline-block bg-neutral-50 p-1 rounded border border-neutral-200">
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      const newLim = parseFloat(limitInput);
                      if (!isNaN(newLim)) {
                        onUpdateUser?.({ creditCardLimit: newLim });
                      }
                      setIsEditingLimit(false);
                    }}
                    className="flex items-center gap-1"
                  >
                    <input 
                      type="number"
                      value={limitInput}
                      onChange={(e) => setLimitInput(e.target.value)}
                      className="bg-white border border-neutral-300 text-neutral-800 font-bold px-1.5 py-0.5 rounded text-xs w-24"
                      autoFocus
                      onBlur={() => {
                        const newLim = parseFloat(limitInput);
                        if (!isNaN(newLim)) {
                          onUpdateUser?.({ creditCardLimit: newLim });
                        }
                        setIsEditingLimit(false);
                      }}
                    />
                  </form>
                </div>
              ) : (
                <span 
                  onClick={(e) => { e.stopPropagation(); setIsEditingLimit(true); }}
                  className="font-bold text-neutral-800 hover:bg-neutral-100 px-1 py-0.5 rounded cursor-pointer transition-all flex items-center gap-1"
                  title="Clique para editar limite"
                >
                  {formatValue(user.creditCardLimit)}
                  <Edit2 className="w-3 h-3 opacity-40" />
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Personal Finance / Acompanhe seu dinheiro Card */}
      <div className="mt-4 px-4 flex flex-col gap-3">
        <span className="text-base font-bold text-neutral-800 px-1 font-display">Acompanhe seu dinheiro</span>
        
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-200/50 flex flex-col gap-4">
          {/* Caixinhas */}
          <div className="flex items-center justify-between hover:bg-neutral-50 p-1.5 rounded-xl cursor-pointer transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-[#830AD1]">
                <Wallet className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-neutral-800">Caixinhas</span>
                <span className="text-xs text-neutral-500">Organize suas metas financeiras</span>
              </div>
            </div>
            <span className="text-xs font-bold text-purple-700 bg-purple-100/50 px-2.5 py-1 rounded-full">R$ 100,00</span>
          </div>

          {/* Investimentos */}
          <div className="flex items-center justify-between hover:bg-neutral-50 p-1.5 rounded-xl cursor-pointer transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-neutral-800">Investimentos</span>
                <span className="text-xs text-neutral-500">Seu dinheiro rendendo mais</span>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100/50 px-2.5 py-1 rounded-full">R$ 317,94</span>
          </div>
        </div>
      </div>

    </div>
  );
}
