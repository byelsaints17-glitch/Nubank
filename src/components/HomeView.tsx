import React, { useState, useEffect } from 'react';
import { 
  Eye, EyeOff, HelpCircle, Mail, ChevronRight, 
  CreditCard, DollarSign, Wallet, TrendingUp, 
  ArrowUpRight, Landmark, Receipt, Smartphone, ShieldAlert, Edit2,
  ArrowUpDown, ShoppingBag, Barcode, Diamond, Coins, User, X,
  ScrollText
} from 'lucide-react';
import { BankUser } from '../types';

interface HomeViewProps {
  user: BankUser;
  hideBalance: boolean;
  setHideBalance: (hide: boolean) => void;
  onNavigate: (screen: 'home' | 'account' | 'card' | 'pix' | 'extrato') => void;
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

  // Profile Modal State (Matches Image 5!)
  const [profileOpen, setProfileOpen] = useState(false);

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
    <div className="flex-1 flex flex-col bg-[#000000] text-white pb-16 relative overflow-y-auto no-scrollbar">
      
      {/* Top Header Section (Matches Image 3) */}
      <div className="px-5 pt-6 pb-4 flex flex-col gap-4">
        
        {/* Top Navbar Row */}
        <div className="flex items-center justify-between">
          {/* Profile Circle (Triggers profile popup matching Image 5!) */}
          <button 
            onClick={() => setProfileOpen(true)}
            className="w-10 h-10 rounded-full bg-[#1c1c1e] border border-neutral-800 flex items-center justify-center font-bold text-sm text-neutral-200 hover:bg-neutral-800 cursor-pointer transition-all duration-250 hover:scale-[1.03]"
            title="Ver Perfil & Agência"
          >
            {getInitials(user.name)}
          </button>
          
          {/* Quick Action Icons */}
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setHideBalance(!hideBalance)}
              className="p-2.5 rounded-full hover:bg-neutral-900 active:scale-95 transition-all"
              title={hideBalance ? "Mostrar saldo" : "Ocultar saldo"}
            >
              {hideBalance ? <EyeOff className="w-5 h-5 text-neutral-300" /> : <Eye className="w-5 h-5 text-neutral-300" />}
            </button>
            <button className="p-2.5 rounded-full hover:bg-neutral-900 transition-colors">
              <HelpCircle className="w-5 h-5 text-neutral-300" />
            </button>
            <button className="p-2.5 rounded-full hover:bg-neutral-900 transition-colors">
              <Mail className="w-5 h-5 text-neutral-300" />
            </button>
          </div>
        </div>

        {/* Greeting / Click-to-edit name */}
        <div className="flex flex-col gap-0.5">
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
                className="bg-[#1c1c1e] border border-purple-500 text-white font-bold px-3 py-1.5 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 w-full max-w-[240px]"
                autoFocus
                onBlur={() => {
                  if (nameInput.trim()) {
                    onUpdateUser?.({ name: nameInput.trim() });
                  }
                  setIsEditingName(false);
                }}
              />
              <button type="submit" className="bg-[#830AD1] text-white px-3 py-1.5 rounded-xl text-xs font-bold uppercase">OK</button>
            </form>
          ) : (
            <div 
              onClick={() => setIsEditingName(true)}
              className="group cursor-pointer flex items-center gap-1.5 hover:bg-neutral-900 py-1 px-1.5 -ml-1.5 rounded-xl transition-all"
              title="Clique para editar o Nome"
            >
              <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                Olá, {user.name}
                <Edit2 className="w-3.5 h-3.5 opacity-30 group-hover:opacity-100 transition-opacity text-neutral-400" />
              </h2>
            </div>
          )}
        </div>
      </div>

      {/* Account Section - click to edit balance directly inside layout (Matches Image 3) */}
      <div className="px-5 mt-2">
        <div 
          onClick={() => onNavigate('account')}
          className="cursor-pointer group flex flex-col gap-1.5 select-none active:opacity-90"
        >
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-white tracking-tight">Conta</span>
            <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
          </div>

          {/* Large balance display */}
          <div className="flex flex-col gap-0.5">
            {isEditingBalance ? (
              <div 
                onClick={(e) => e.stopPropagation()} 
                className="flex flex-col gap-1.5 bg-[#1c1c1e] p-3 rounded-2xl border border-neutral-800"
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
                  className="flex items-center gap-2"
                >
                  <span className="text-base font-bold text-neutral-400">R$</span>
                  <input 
                    type="number"
                    step="any"
                    value={balanceInput}
                    onChange={(e) => setBalanceInput(e.target.value)}
                    className="bg-black border border-purple-500 text-white font-bold px-3 py-1.5 rounded-xl text-sm focus:outline-none w-full"
                    autoFocus
                    onBlur={() => {
                      const newBal = parseFloat(balanceInput);
                      if (!isNaN(newBal)) {
                        onUpdateUser?.({ balance: newBal });
                      }
                      setIsEditingBalance(false);
                    }}
                  />
                  <button type="submit" className="bg-[#830AD1] text-white px-3 py-1.5 rounded-xl text-xs font-bold uppercase">OK</button>
                </form>
              </div>
            ) : (
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingBalance(true);
                }}
                className="group/bal flex items-center justify-between hover:bg-neutral-900 py-1.5 px-2 -ml-2 rounded-2xl transition-all"
                title="Clique no saldo para editar"
              >
                <span className="text-[26px] font-bold text-white tracking-tight font-display flex items-center gap-2">
                  {formatValue(user.balance)}
                  <Edit2 className="w-4 h-4 opacity-0 group-hover/bal:opacity-60 transition-opacity text-neutral-400" />
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Action Horizontal Scrollable Buttons Row (Matches Image 3 circular buttons!) */}
      <div className="mt-6">
        <div className="flex items-start gap-4 overflow-x-auto no-scrollbar py-2 px-5">
          
          {/* Action: Área Pix */}
          <button 
            onClick={() => onNavigate('pix')}
            className="flex flex-col items-center gap-2.5 group cursor-pointer min-w-[72px]"
          >
            <div className="w-13 h-13 rounded-full bg-[#1c1c1e] group-hover:bg-neutral-800 flex items-center justify-center text-white active:scale-95 transition-all border border-neutral-800/65">
              <Diamond className="w-5 h-5" />
            </div>
            <span className="text-[12px] font-bold text-neutral-200 text-center tracking-tight leading-3">
              Área Pix
            </span>
          </button>

          {/* Action: Extrato */}
          <button 
            onClick={() => onNavigate('extrato')}
            className="flex flex-col items-center gap-2.5 group cursor-pointer min-w-[72px]"
          >
            <div className="w-13 h-13 rounded-full bg-[#1c1c1e] group-hover:bg-neutral-800 flex items-center justify-center text-white active:scale-95 transition-all border border-neutral-800/65">
              <ScrollText className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-[12px] font-bold text-neutral-200 text-center tracking-tight leading-3">
              Extrato
            </span>
          </button>

          {/* Action: Pagar */}
          <button 
            onClick={() => onNavigate('card')}
            className="flex flex-col items-center gap-2.5 group cursor-pointer min-w-[72px]"
          >
            <div className="w-13 h-13 rounded-full bg-[#1c1c1e] group-hover:bg-neutral-800 flex items-center justify-center text-white active:scale-95 transition-all border border-neutral-800/65">
              <Barcode className="w-5 h-5" />
            </div>
            <span className="text-[12px] font-bold text-neutral-200 text-center tracking-tight leading-3">
              Pagar
            </span>
          </button>

          {/* Action: Pegar Emprestado (With purple capsule badge R$50.000 underneath, matches Image 3 exactly!) */}
          <button 
            onClick={() => {
              alert('Simulação de empréstimo disponível. O limite atual pré-aprovado é de R$ 50.000,00.');
            }}
            className="flex flex-col items-center gap-2.5 group cursor-pointer min-w-[76px] relative"
          >
            <div className="w-13 h-13 rounded-full bg-[#1c1c1e] group-hover:bg-neutral-800 flex items-center justify-center text-white active:scale-95 transition-all border border-neutral-800/65 relative">
              <Coins className="w-5 h-5" />
              {/* Overlapping purple badge under the icon block */}
              <div className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 bg-[#830AD1] text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-md whitespace-nowrap border border-black uppercase tracking-wide">
                R$50.000
              </div>
            </div>
            <span className="text-[12px] font-bold text-neutral-200 text-center tracking-tight leading-3 mt-1">
              Pegar emprestado
            </span>
          </button>

          {/* Action: Transferir */}
          <button 
            onClick={() => onNavigate('pix')}
            className="flex flex-col items-center gap-2.5 group cursor-pointer min-w-[72px]"
          >
            <div className="w-13 h-13 rounded-full bg-[#1c1c1e] group-hover:bg-neutral-800 flex items-center justify-center text-white active:scale-95 transition-all border border-neutral-800/65">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <span className="text-[12px] font-bold text-neutral-200 text-center tracking-tight leading-3">
              Transferir
            </span>
          </button>

          {/* Action: Recarga celular */}
          <button 
            onClick={() => alert('Simulador de recarga de celular ativo.')}
            className="flex flex-col items-center gap-2.5 group cursor-pointer min-w-[72px]"
          >
            <div className="w-13 h-13 rounded-full bg-[#1c1c1e] group-hover:bg-neutral-800 flex items-center justify-center text-white active:scale-95 transition-all border border-neutral-800/65">
              <Smartphone className="w-5 h-5" />
            </div>
            <span className="text-[12px] font-bold text-neutral-200 text-center tracking-tight leading-3">
              Recarga celular
            </span>
          </button>

          {/* Action: Depositar */}
          <button 
            onClick={() => onNavigate('account')}
            className="flex flex-col items-center gap-2.5 group cursor-pointer min-w-[72px]"
          >
            <div className="w-13 h-13 rounded-full bg-[#1c1c1e] group-hover:bg-neutral-800 flex items-center justify-center text-white active:scale-95 transition-all border border-neutral-800/65">
              <Landmark className="w-5 h-5" />
            </div>
            <span className="text-[12px] font-bold text-neutral-200 text-center tracking-tight leading-3">
              Depositar
            </span>
          </button>
        </div>
      </div>

      {/* Meus Cartões Button (Matches Image 3) */}
      <div className="mt-5 px-5">
        <button 
          onClick={() => onNavigate('card')}
          className="w-full bg-[#1c1c1e] hover:bg-neutral-900 active:scale-[0.99] transition-all rounded-2xl py-4 px-4.5 flex items-center gap-3.5 text-left border border-neutral-800/40"
        >
          <CreditCard className="w-5 h-5 text-neutral-200" />
          <span className="text-sm font-bold text-white tracking-tight">Meus cartões</span>
        </button>
      </div>

      {/* Horizontal Scrollable Promo / Info Carousel (Matches Image 3 cards!) */}
      <div className="mt-5">
        <div className="flex items-stretch gap-3 overflow-x-auto no-scrollbar py-1 px-5">
          {/* Card 1 */}
          <div className="bg-[#1c1c1e] rounded-2xl p-4.5 min-w-[250px] max-w-[250px] flex flex-col justify-between shrink-0 border border-neutral-800/30 text-xs text-neutral-200 leading-normal">
            <p>
              <span className="text-[#830AD1] font-bold">Pix no Crédito:</span> transfira sem usar o saldo da conta.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-[#1c1c1e] rounded-2xl p-4.5 min-w-[250px] max-w-[250px] flex flex-col justify-between shrink-0 border border-neutral-800/30 text-xs text-neutral-200 leading-normal">
            <p>
              Chegou a hora de investir com o seu <span className="text-emerald-400 font-bold">Rendimento Nu</span> garantido.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-[#1c1c1e] rounded-2xl p-4.5 min-w-[250px] max-w-[250px] flex flex-col justify-between shrink-0 border border-neutral-800/30 text-xs text-neutral-200 leading-normal">
            <p>
              Ative a função <span className="text-purple-400 font-bold">Débito Automático</span> e simplifique seu pagamento.
            </p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-neutral-900 mt-6 mx-5"></div>

      {/* Credit Card Card Section (Matches Image 3) */}
      <div className="mt-5 px-5">
        <div 
          onClick={() => onNavigate('card')}
          className="cursor-pointer flex flex-col gap-1 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-white">Cartão de crédito</span>
            <ChevronRight className="w-5 h-5 text-neutral-500 group-hover:translate-x-0.5 transition-transform" />
          </div>
          
          <div className="flex flex-col gap-1.5 mt-1">
            <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Fatura atual (Toque para editar)</span>
            
            {isEditingInvoice ? (
              <div onClick={(e) => e.stopPropagation()} className="bg-[#1c1c1e] p-3 rounded-2xl border border-neutral-800 mb-2">
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
                    className="bg-black border border-purple-500 text-white font-bold px-2.5 py-1.5 rounded-xl text-sm w-full"
                    autoFocus
                    onBlur={() => {
                      const newInvoice = parseFloat(invoiceInput);
                      if (!isNaN(newInvoice)) {
                        onUpdateUser?.({ creditCardInvoice: newInvoice });
                      }
                      setIsEditingInvoice(false);
                    }}
                  />
                  <button type="submit" className="bg-[#830AD1] text-white px-3 py-1.5 rounded-xl text-xs font-bold uppercase">OK</button>
                </form>
              </div>
            ) : (
              <div 
                onClick={(e) => { e.stopPropagation(); setIsEditingInvoice(true); }}
                className="group/inv flex items-center justify-between hover:bg-neutral-900 -mx-1.5 px-1.5 py-1 rounded-xl transition-all w-full"
              >
                <span className="text-xl font-bold text-white font-display flex items-center gap-1.5">
                  {formatValue(user.creditCardInvoice)}
                  <Edit2 className="w-3.5 h-3.5 opacity-0 group-hover/inv:opacity-60 transition-opacity text-neutral-400" />
                </span>
              </div>
            )}

            <div className="text-[12px] text-neutral-400 font-medium flex items-center gap-1.5 flex-wrap">
              <span>Limite disponível de</span>
              {isEditingLimit ? (
                <div onClick={(e) => e.stopPropagation()} className="inline-block bg-[#1c1c1e] p-1 rounded-xl border border-neutral-800">
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
                      className="bg-black border border-purple-500 text-white font-bold px-2 py-1 rounded-lg text-xs w-24"
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
                  className="font-bold text-neutral-200 hover:bg-neutral-900 px-1.5 py-0.5 rounded-lg cursor-pointer transition-all flex items-center gap-1"
                  title="Clique para editar limite"
                >
                  {formatValue(user.creditCardLimit)}
                  <Edit2 className="w-3 h-3 opacity-40 text-neutral-400" />
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-neutral-900 mt-5 mx-5"></div>

      {/* Empréstimo Card Section (Matches Image 3) */}
      <div className="mt-5 px-5">
        <div className="flex flex-col gap-1 group">
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-white">Empréstimo</span>
            <ChevronRight className="w-5 h-5 text-neutral-500 transition-transform" />
          </div>
          
          <div className="flex flex-col gap-0.5 mt-1">
            <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Valor disponível de até</span>
            <span className="text-sm font-bold text-white tracking-tight">
              {formatValue(50000.00)}
            </span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-neutral-900 mt-5 mx-5"></div>

      {/* Personal Finance / Acompanhe seu dinheiro Card */}
      <div className="mt-5 px-5 flex flex-col gap-3">
        <span className="text-sm font-bold text-neutral-400 uppercase tracking-wider">Acompanhe seu dinheiro</span>
        
        <div className="bg-[#1c1c1e] rounded-2xl p-4 border border-neutral-800/40 flex flex-col gap-4">
          {/* Caixinhas */}
          <div className="flex items-center justify-between hover:bg-neutral-900 p-1.5 rounded-xl cursor-pointer transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-950/40 border border-purple-900/30 flex items-center justify-center text-[#830AD1]">
                <Wallet className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white">Caixinhas</span>
                <span className="text-xs text-neutral-400">Organize suas metas financeiras</span>
              </div>
            </div>
            <span className="text-xs font-bold text-purple-300 bg-[#830AD1]/15 border border-[#830AD1]/10 px-2.5 py-1 rounded-full">R$ 100,00</span>
          </div>

          {/* Investimentos */}
          <div className="flex items-center justify-between hover:bg-neutral-900 p-1.5 rounded-xl cursor-pointer transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-950/40 border border-emerald-900/30 flex items-center justify-center text-emerald-400">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white">Investimentos</span>
                <span className="text-xs text-neutral-400">Seu dinheiro rendendo mais</span>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-300 bg-emerald-950/35 border border-emerald-900/20 px-2.5 py-1 rounded-full">R$ 317,94</span>
          </div>
        </div>
      </div>

      {/* Floating Pill Nav Bar & Assistente payment at the bottom (Matches Image 3 layout!) */}
      <div className="mt-8 px-5 w-full flex flex-col items-center gap-4">
        {/* Floating Capsule Controller Bar */}
        <div className="bg-[#1c1c1e] border border-neutral-800 shadow-xl rounded-full py-2 px-5 flex items-center justify-between w-full max-w-[280px] z-20">
          {/* Arrow up/down purple circle */}
          <button 
            onClick={() => onNavigate('pix')}
            className="w-10 h-10 rounded-full bg-[#830AD1] hover:bg-[#7209B7] flex items-center justify-center text-white transition-all active:scale-95 cursor-pointer"
            title="Transferências"
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
          
          {/* Dollar button */}
          <button 
            onClick={() => onNavigate('account')}
            className="p-2.5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title="Conta Extrato"
          >
            <DollarSign className="w-5 h-5" />
          </button>

          {/* Gift/Shop button */}
          <button 
            onClick={() => alert('Parcerias e Shopping Nubank.')}
            className="p-2.5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title="Shopping Nu"
          >
            <ShoppingBag className="w-5 h-5" />
          </button>
        </div>

        {/* Assistente de Pagamentos row */}
        <div className="w-full bg-[#1c1c1e] rounded-2xl p-4 flex items-center justify-between border border-neutral-800/40 select-none">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-purple-400" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white">Assistente de pagamentos</span>
              <span className="text-[10px] text-neutral-400">Contas agendadas e automáticas</span>
            </div>
          </div>
          <span className="text-[9px] font-extrabold bg-[#830AD1] text-white px-2 py-0.5 rounded-md uppercase tracking-wider">Novo</span>
        </div>
      </div>

      {/* PROFILE SIDE-SHEET DIALOG MODAL (Matches Image 5 exactly!) */}
      {profileOpen && (
        <div className="absolute inset-0 bg-black/75 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#1c1c1e] border border-neutral-800 rounded-3xl w-full max-w-[360px] overflow-hidden shadow-2xl flex flex-col p-5 select-none animate-scale-up">
            
            {/* Top row with Close button */}
            <div className="flex items-center justify-between mb-4">
              <button 
                onClick={() => setProfileOpen(false)}
                className="p-1 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <span className="text-[10px] font-extrabold tracking-widest uppercase text-neutral-500">Perfil do Cliente</span>
            </div>

            {/* Profile Avatar & Name */}
            <div className="flex flex-col items-center text-center gap-3 py-4 border-b border-neutral-800/65">
              <div className="w-16 h-16 rounded-full bg-[#830AD1] flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-[#830AD1]/15">
                <User className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">{user.name.toUpperCase()}</h3>
            </div>

            {/* Red Box Section (Agência / Conta matching Image 5 outline highlighted box exactly!) */}
            <div className="my-5 p-3.5 rounded-xl border-2 border-purple-500 bg-purple-950/20 flex flex-col gap-1.5 text-xs text-left">
              <div className="flex items-center justify-between text-[11px] font-bold text-neutral-300">
                <span>Agência {user.agency} • Conta {user.accountNumber}</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-normal">
                Banco 0260 - Nu Pagamentos S.A. - Instituição de Pagamento
              </p>
            </div>

            {/* Navigation Options List */}
            <div className="flex flex-col divide-y divide-neutral-800/50 mb-3">
              <button 
                onClick={() => { setProfileOpen(false); alert('Central de ajuda NuConta.'); }}
                className="py-3 px-1 flex items-center justify-between text-xs font-bold text-neutral-200 hover:text-white group text-left"
              >
                <span>Me ajuda</span>
                <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button 
                onClick={() => { setProfileOpen(false); setIsEditingName(true); }}
                className="py-3 px-1 flex items-center justify-between text-xs font-bold text-neutral-200 hover:text-white group text-left"
              >
                <span>Meus Dados (Editar Nome)</span>
                <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button 
                onClick={() => { setProfileOpen(false); alert('Opções do aplicativo.'); }}
                className="py-3 px-1 flex items-center justify-between text-xs font-bold text-neutral-200 hover:text-white group text-left"
              >
                <span>Configurar app</span>
                <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button 
                onClick={() => { setProfileOpen(false); alert('Segurança e proteção de dados.'); }}
                className="py-3 px-1 flex items-center justify-between text-xs font-bold text-neutral-200 hover:text-white group text-left"
              >
                <span>Segurança</span>
                <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* Logout button */}
            {onLogout && (
              <div className="flex justify-center mt-6">
                <button 
                  onClick={() => {
                    setProfileOpen(false);
                    onLogout();
                  }}
                  className="text-red-400 hover:text-red-300 text-xs font-extrabold uppercase tracking-widest cursor-pointer hover:underline transition-all"
                >
                  Sair da Conta
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
