import React, { useState, useEffect } from 'react';
import { 
  Eye, EyeOff, HelpCircle, Mail, ChevronRight, 
  CreditCard, DollarSign, Wallet, TrendingUp, 
  ArrowUpRight, Landmark, Receipt, Smartphone, ShieldAlert, Edit2,
  ArrowUpDown, ShoppingBag, Barcode, Diamond, Coins, User, X,
  ScrollText, ShieldCheck, Check, Sparkles, AlertCircle
} from 'lucide-react';
import { BankUser, StatementItem } from '../types';

interface HomeViewProps {
  user: BankUser;
  hideBalance: boolean;
  setHideBalance: (hide: boolean) => void;
  onNavigate: (screen: 'home' | 'account' | 'card' | 'pix' | 'extrato') => void;
  onLogout?: () => void;
  onUpdateUser?: (updated: Partial<BankUser>) => void;
  onAddManualStatementItem?: (item: Omit<StatementItem, 'id'>) => void;
}

export default function HomeView({ 
  user, hideBalance, setHideBalance, onNavigate, onLogout, onUpdateUser, onAddManualStatementItem
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

  // Modals for all unactivated functions
  const [loanModalOpen, setLoanModalOpen] = useState(false);
  const [loanAmount, setLoanAmount] = useState('10000');
  const [loanInstallments, setLoanInstallments] = useState(12);
  const [loanSuccess, setLoanSuccess] = useState(false);

  const [rechargeModalOpen, setRechargeModalOpen] = useState(false);
  const [rechargePhone, setRechargePhone] = useState('');
  const [rechargeOperator, setRechargeOperator] = useState('Vivo');
  const [rechargeAmount, setRechargeAmount] = useState(30);
  const [rechargeSuccess, setRechargeSuccess] = useState(false);
  const [rechargeError, setRechargeError] = useState('');

  const [shoppingModalOpen, setShoppingModalOpen] = useState(false);
  const [shoppingSuccess, setShoppingSuccess] = useState(false);
  const [purchasedGiftCard, setPurchasedGiftCard] = useState<any>(null);

  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [securityModalOpen, setSecurityModalOpen] = useState(false);

  const handleConfirmLoan = () => {
    const val = parseFloat(loanAmount);
    if (isNaN(val) || val <= 0 || val > 50000) {
      alert('Valor de empréstimo inválido. O limite é de R$ 50.000,00.');
      return;
    }

    onUpdateUser?.({ balance: user.balance + val });
    
    const today = new Date();
    const formattedTime = today.toTimeString().split(' ')[0];
    onAddManualStatementItem?.({
      title: 'Empréstimo PG Conta',
      description: `Contrato de Empréstimo em ${loanInstallments}x`,
      amount: val,
      date: today.toISOString().split('T')[0],
      time: formattedTime,
      type: 'Depósito',
      incoming: true,
      senderName: 'PG Pagamentos S.A.'
    });

    setLoanSuccess(true);
    setTimeout(() => {
      setLoanSuccess(false);
      setLoanModalOpen(false);
    }, 2000);
  };

  const handleConfirmRecharge = () => {
    const phoneDigits = rechargePhone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      setRechargeError('Por favor, insira um número de celular válido com DDD.');
      return;
    }

    if (user.balance < rechargeAmount) {
      setRechargeError('Saldo insuficiente para realizar esta recarga.');
      return;
    }

    onUpdateUser?.({ balance: user.balance - rechargeAmount });

    const today = new Date();
    const formattedTime = today.toTimeString().split(' ')[0];
    onAddManualStatementItem?.({
      title: 'Recarga Celular',
      description: `Recarga ${rechargeOperator} para ${rechargePhone}`,
      amount: rechargeAmount,
      date: today.toISOString().split('T')[0],
      time: formattedTime,
      type: 'Transferência',
      incoming: false,
      recipientName: `${rechargeOperator} Celular`
    });

    setRechargeError('');
    setRechargeSuccess(true);
    setTimeout(() => {
      setRechargeSuccess(false);
      setRechargeModalOpen(false);
      setRechargePhone('');
    }, 2000);
  };

  const handleBuyGiftCard = (card: { name: string; price: number; cashbackPct: number }) => {
    if (user.balance < card.price) {
      alert('Saldo insuficiente para comprar este Gift Card.');
      return;
    }

    const cashbackAmount = card.price * (card.cashbackPct / 100);
    const finalBalance = user.balance - card.price + cashbackAmount;

    onUpdateUser?.({ balance: finalBalance });

    const today = new Date();
    const formattedTime = today.toTimeString().split(' ')[0];
    
    // Debit transaction
    onAddManualStatementItem?.({
      title: 'Gift Card Shopping',
      description: `Gift Card ${card.name} no Shopping`,
      amount: card.price,
      date: today.toISOString().split('T')[0],
      time: formattedTime,
      type: 'Transferência',
      incoming: false,
      recipientName: `Shopping PGBANK - ${card.name}`
    });

    // Cashback transaction
    onAddManualStatementItem?.({
      title: 'Cashback Shopping',
      description: `Cashback de ${card.cashbackPct}% sobre compra ${card.name}`,
      amount: cashbackAmount,
      date: today.toISOString().split('T')[0],
      time: formattedTime,
      type: 'Depósito',
      incoming: true,
      senderName: 'PG Shopping S.A.'
    });

    setPurchasedGiftCard({ ...card, cashback: cashbackAmount });
    setShoppingSuccess(true);
    setTimeout(() => {
      setShoppingSuccess(false);
      setShoppingModalOpen(false);
      setPurchasedGiftCard(null);
    }, 2500);
  };

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
    <div className="flex-1 flex flex-col bg-white text-neutral-800 pb-16 relative overflow-y-auto no-scrollbar">
      
      {/* Top Header Section (Matches Image 3) */}
      <div className="px-5 pt-6 pb-4 flex flex-col gap-4">
        
        {/* Top Navbar Row */}
        <div className="flex items-center justify-between">
          {/* Profile Circle (Triggers profile popup matching Image 5!) */}
          <button 
            onClick={() => setProfileOpen(true)}
            className="w-10 h-10 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center font-bold text-sm text-neutral-700 hover:bg-neutral-200 cursor-pointer transition-all duration-250 hover:scale-[1.03]"
            title="Ver Perfil & Agência"
          >
            {getInitials(user.name)}
          </button>
          
          {/* Quick Action Icons */}
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setHideBalance(!hideBalance)}
              className="p-2.5 rounded-full hover:bg-neutral-100 active:scale-95 transition-all"
              title={hideBalance ? "Mostrar saldo" : "Ocultar saldo"}
            >
              {hideBalance ? <EyeOff className="w-5 h-5 text-neutral-600" /> : <Eye className="w-5 h-5 text-neutral-600" />}
            </button>
            <button className="p-2.5 rounded-full hover:bg-neutral-100 transition-colors">
              <HelpCircle className="w-5 h-5 text-neutral-600" />
            </button>
            <button className="p-2.5 rounded-full hover:bg-neutral-100 transition-colors">
              <Mail className="w-5 h-5 text-neutral-600" />
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
                className="bg-neutral-50 border border-neutral-300 text-neutral-900 font-bold px-3 py-1.5 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-neutral-450 w-full max-w-[240px]"
                autoFocus
                onBlur={() => {
                  if (nameInput.trim()) {
                    onUpdateUser?.({ name: nameInput.trim() });
                  }
                  setIsEditingName(false);
                }}
              />
              <button type="submit" className="bg-neutral-900 text-white px-3 py-1.5 rounded-xl text-xs font-bold uppercase hover:bg-neutral-800">OK</button>
            </form>
          ) : (
            <div 
              onClick={() => setIsEditingName(true)}
              className="group cursor-pointer flex items-center gap-1.5 hover:bg-neutral-100 py-1 px-1.5 -ml-1.5 rounded-xl transition-all"
              title="Clique para editar o Nome"
            >
              <h2 className="text-base font-bold text-neutral-800 flex items-center gap-1.5">
                Olá, {user.name}
                <Edit2 className="w-3.5 h-3.5 opacity-30 group-hover:opacity-100 transition-opacity text-neutral-450" />
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
            <span className="text-base font-bold text-neutral-850 tracking-tight">Conta</span>
            <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
          </div>

          {/* Large balance display */}
          <div className="flex flex-col gap-0.5">
            {isEditingBalance ? (
              <div 
                onClick={(e) => e.stopPropagation()} 
                className="flex flex-col gap-1.5 bg-neutral-50 p-3 rounded-2xl border border-neutral-200"
              >
                <span className="text-[10px] text-neutral-500 font-bold uppercase">Editar Saldo da Conta</span>
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
                    className="bg-white border border-neutral-300 text-neutral-900 font-bold px-3 py-1.5 rounded-xl text-sm focus:outline-none w-full"
                    autoFocus
                    onBlur={() => {
                      const newBal = parseFloat(balanceInput);
                      if (!isNaN(newBal)) {
                        onUpdateUser?.({ balance: newBal });
                      }
                      setIsEditingBalance(false);
                    }}
                  />
                  <button type="submit" className="bg-neutral-900 text-white px-3 py-1.5 rounded-xl text-xs font-bold uppercase hover:bg-neutral-850">OK</button>
                </form>
              </div>
            ) : (
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingBalance(true);
                }}
                className="group/bal flex items-center justify-between hover:bg-neutral-100 py-1.5 px-2 -ml-2 rounded-2xl transition-all"
                title="Clique no saldo para editar"
              >
                <span className="text-[26px] font-bold text-neutral-900 tracking-tight font-display flex items-center gap-2">
                  {formatValue(user.balance)}
                  <Edit2 className="w-4 h-4 opacity-0 group-hover/bal:opacity-60 transition-opacity text-neutral-450" />
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
            <div className="w-13 h-13 rounded-full bg-neutral-100 group-hover:bg-neutral-200 flex items-center justify-center text-neutral-800 active:scale-95 transition-all border border-neutral-200">
              <Diamond className="w-5 h-5 text-neutral-700" />
            </div>
            <span className="text-[12px] font-bold text-neutral-600 text-center tracking-tight leading-3">
              Área Pix
            </span>
          </button>
 
          {/* Action: Extrato */}
          <button 
            onClick={() => onNavigate('extrato')}
            className="flex flex-col items-center gap-2.5 group cursor-pointer min-w-[72px]"
          >
            <div className="w-13 h-13 rounded-full bg-neutral-100 group-hover:bg-neutral-200 flex items-center justify-center text-neutral-800 active:scale-95 transition-all border border-neutral-200">
              <ScrollText className="w-5 h-5 text-neutral-700" />
            </div>
            <span className="text-[12px] font-bold text-neutral-600 text-center tracking-tight leading-3">
              Extrato
            </span>
          </button>
 
          {/* Action: Pagar */}
          <button 
            onClick={() => onNavigate('card')}
            className="flex flex-col items-center gap-2.5 group cursor-pointer min-w-[72px]"
          >
            <div className="w-13 h-13 rounded-full bg-neutral-100 group-hover:bg-neutral-200 flex items-center justify-center text-neutral-800 active:scale-95 transition-all border border-neutral-200">
              <Barcode className="w-5 h-5 text-neutral-700" />
            </div>
            <span className="text-[12px] font-bold text-neutral-600 text-center tracking-tight leading-3">
              Pagar
            </span>
          </button>
 
          {/* Action: Pegar Emprestado (With black/silver capsule badge R$50.000 underneath) */}
          <button 
            onClick={() => setLoanModalOpen(true)}
            className="flex flex-col items-center gap-2.5 group cursor-pointer min-w-[76px] relative"
          >
            <div className="w-13 h-13 rounded-full bg-neutral-100 group-hover:bg-neutral-200 flex items-center justify-center text-neutral-800 active:scale-95 transition-all border border-neutral-200 relative">
              <Coins className="w-5 h-5 text-neutral-700" />
              {/* Overlapping black badge under the icon block */}
              <div className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 bg-neutral-900 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-md whitespace-nowrap border border-white uppercase tracking-wide">
                R$50.000
              </div>
            </div>
            <span className="text-[12px] font-bold text-neutral-600 text-center tracking-tight leading-3 mt-1">
              Pegar empréstado
            </span>
          </button>
 
          {/* Action: Transferir */}
          <button 
            onClick={() => onNavigate('pix')}
            className="flex flex-col items-center gap-2.5 group cursor-pointer min-w-[72px]"
          >
            <div className="w-13 h-13 rounded-full bg-neutral-100 group-hover:bg-neutral-200 flex items-center justify-center text-neutral-800 active:scale-95 transition-all border border-neutral-200">
              <ArrowUpRight className="w-5 h-5 text-neutral-700" />
            </div>
            <span className="text-[12px] font-bold text-neutral-600 text-center tracking-tight leading-3">
              Transferir
            </span>
          </button>
 
          {/* Action: Recarga celular */}
          <button 
            onClick={() => setRechargeModalOpen(true)}
            className="flex flex-col items-center gap-2.5 group cursor-pointer min-w-[72px]"
          >
            <div className="w-13 h-13 rounded-full bg-neutral-100 group-hover:bg-neutral-200 flex items-center justify-center text-neutral-800 active:scale-95 transition-all border border-neutral-200">
              <Smartphone className="w-5 h-5 text-neutral-700" />
            </div>
            <span className="text-[12px] font-bold text-neutral-600 text-center tracking-tight leading-3">
              Recarga celular
            </span>
          </button>
 
          {/* Action: Depositar */}
          <button 
            onClick={() => onNavigate('account')}
            className="flex flex-col items-center gap-2.5 group cursor-pointer min-w-[72px]"
          >
            <div className="w-13 h-13 rounded-full bg-neutral-100 group-hover:bg-neutral-200 flex items-center justify-center text-neutral-800 active:scale-95 transition-all border border-neutral-200">
              <Landmark className="w-5 h-5 text-neutral-700" />
            </div>
            <span className="text-[12px] font-bold text-neutral-600 text-center tracking-tight leading-3">
              Depositar
            </span>
          </button>
        </div>
      </div>

      {/* Meus Cartões Button (Matches Image 3) */}
      <div className="mt-5 px-5">
        <button 
          onClick={() => onNavigate('card')}
          className="w-full bg-neutral-50 hover:bg-neutral-100 active:scale-[0.99] transition-all rounded-2xl py-4 px-4.5 flex items-center gap-3.5 text-left border border-neutral-200"
        >
          <CreditCard className="w-5 h-5 text-neutral-600" />
          <span className="text-sm font-bold text-neutral-800 tracking-tight">Meus cartões</span>
        </button>
      </div>

      {/* Horizontal Scrollable Promo / Info Carousel (Matches Image 3 cards!) */}
      <div className="mt-5">
        <div className="flex items-stretch gap-3 overflow-x-auto no-scrollbar py-1 px-5">
          {/* Card 1 */}
          <div className="bg-neutral-50 rounded-2xl p-4.5 min-w-[250px] max-w-[250px] flex flex-col justify-between shrink-0 border border-neutral-200 text-xs text-neutral-600 leading-normal">
            <p>
              <span className="text-neutral-900 font-bold">Pix no Crédito:</span> transfira sem usar o saldo da conta.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-neutral-50 rounded-2xl p-4.5 min-w-[250px] max-w-[250px] flex flex-col justify-between shrink-0 border border-neutral-200 text-xs text-neutral-600 leading-normal">
            <p>
              Chegou a hora de investir com o seu <span className="text-emerald-600 font-bold">Rendimento PGBANK</span> garantido.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-neutral-50 rounded-2xl p-4.5 min-w-[250px] max-w-[250px] flex flex-col justify-between shrink-0 border border-neutral-200 text-xs text-neutral-600 leading-normal">
            <p>
              Ative a função <span className="text-neutral-800 font-bold">Débito Automático</span> e simplifique seu pagamento.
            </p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-neutral-150 mt-6 mx-5"></div>

      {/* Credit Card Card Section (Matches Image 3) */}
      <div className="mt-5 px-5">
        <div 
          onClick={() => onNavigate('card')}
          className="cursor-pointer flex flex-col gap-1 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-neutral-850">Cartão de crédito</span>
            <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
          
          <div className="flex flex-col gap-1.5 mt-1">
            <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Fatura atual (Toque para editar)</span>
            
            {isEditingInvoice ? (
              <div onClick={(e) => e.stopPropagation()} className="bg-neutral-50 p-3 rounded-2xl border border-neutral-200 mb-2">
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
                    className="bg-white border border-neutral-300 text-neutral-900 font-bold px-2.5 py-1.5 rounded-xl text-sm w-full"
                    autoFocus
                    onBlur={() => {
                      const newInvoice = parseFloat(invoiceInput);
                      if (!isNaN(newInvoice)) {
                        onUpdateUser?.({ creditCardInvoice: newInvoice });
                      }
                      setIsEditingInvoice(false);
                    }}
                  />
                  <button type="submit" className="bg-neutral-900 text-white px-3 py-1.5 rounded-xl text-xs font-bold uppercase hover:bg-neutral-850">OK</button>
                </form>
              </div>
            ) : (
              <div 
                onClick={(e) => { e.stopPropagation(); setIsEditingInvoice(true); }}
                className="group/inv flex items-center justify-between hover:bg-neutral-100 -mx-1.5 px-1.5 py-1 rounded-xl transition-all w-full"
              >
                <span className="text-xl font-bold text-neutral-900 font-display flex items-center gap-1.5">
                  {formatValue(user.creditCardInvoice)}
                  <Edit2 className="w-3.5 h-3.5 opacity-0 group-hover/inv:opacity-60 transition-opacity text-neutral-400" />
                </span>
              </div>
            )}

            <div className="text-[12px] text-neutral-500 font-medium flex items-center gap-1.5 flex-wrap">
              <span>Limite disponível de</span>
              {isEditingLimit ? (
                <div onClick={(e) => e.stopPropagation()} className="inline-block bg-neutral-50 p-1 rounded-xl border border-neutral-200">
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
                      className="bg-white border border-neutral-300 text-neutral-900 font-bold px-2 py-1 rounded-lg text-xs w-24"
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
                  className="font-bold text-neutral-700 hover:bg-neutral-100 px-1.5 py-0.5 rounded-lg cursor-pointer transition-all flex items-center gap-1"
                  title="Clique para editar limite"
                >
                  {formatValue(user.creditCardLimit)}
                  <Edit2 className="w-3 h-3 opacity-45 text-neutral-400" />
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-neutral-150 mt-5 mx-5"></div>

      {/* Empréstimo Card Section (Matches Image 3) */}
      <div className="mt-5 px-5">
        <div className="flex flex-col gap-1 group">
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-neutral-850">Empréstimo</span>
            <ChevronRight className="w-5 h-5 text-neutral-400 transition-transform" />
          </div>
          
          <div className="flex flex-col gap-0.5 mt-1">
            <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Valor disponível de até</span>
            <span className="text-sm font-bold text-neutral-900 tracking-tight">
              {formatValue(50000.00)}
            </span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-neutral-150 mt-5 mx-5"></div>

      {/* Personal Finance / Acompanhe seu dinheiro Card */}
      <div className="mt-5 px-5 flex flex-col gap-3">
        <span className="text-sm font-bold text-neutral-400 uppercase tracking-wider">Acompanhe seu dinheiro</span>
        
        <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200 flex flex-col gap-4">
          {/* Caixinhas */}
          <div className="flex items-center justify-between hover:bg-neutral-100 p-1.5 rounded-xl cursor-pointer transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-neutral-200 border border-neutral-350 flex items-center justify-center text-neutral-850">
                <Wallet className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-neutral-800">Caixinhas</span>
                <span className="text-xs text-neutral-400">Organize suas metas financeiras</span>
              </div>
            </div>
            <span className="text-xs font-bold text-neutral-700 bg-neutral-200 border border-neutral-300 px-2.5 py-1 rounded-full">R$ 100,00</span>
          </div>

          {/* Investimentos */}
          <div className="flex items-center justify-between hover:bg-neutral-100 p-1.5 rounded-xl cursor-pointer transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-neutral-800">Investimentos</span>
                <span className="text-xs text-neutral-400">Seu dinheiro rendendo mais</span>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">R$ 317,94</span>
          </div>
        </div>
      </div>

      {/* Floating Pill Nav Bar & Assistente payment at the bottom (Matches Image 3 layout!) */}
      <div className="mt-8 px-5 w-full flex flex-col items-center gap-4">
        {/* Floating Capsule Controller Bar */}
        <div className="bg-neutral-50 border border-neutral-250 shadow-xl rounded-full py-2 px-5 flex items-center justify-between w-full max-w-[280px] z-20">
          {/* Arrow up/down black circle */}
          <button 
            onClick={() => onNavigate('pix')}
            className="w-10 h-10 rounded-full bg-neutral-900 hover:bg-neutral-800 flex items-center justify-center text-white transition-all active:scale-95 cursor-pointer"
            title="Transferências"
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
          
          {/* Dollar button */}
          <button 
            onClick={() => onNavigate('account')}
            className="p-2.5 text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
            title="Conta Extrato"
          >
            <DollarSign className="w-5 h-5" />
          </button>

          {/* Gift/Shop button */}
          <button 
            onClick={() => setShoppingModalOpen(true)}
            className="p-2.5 text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
            title="Shopping PG"
          >
            <ShoppingBag className="w-5 h-5" />
          </button>
        </div>

        {/* Assistente de Pagamentos row */}
        <div className="w-full bg-neutral-50 rounded-2xl p-4 flex items-center justify-between border border-neutral-200 select-none">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-neutral-500" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-neutral-800">Assistente de pagamentos</span>
              <span className="text-[10px] text-neutral-400">Contas agendadas e automáticas</span>
            </div>
          </div>
          <span className="text-[9px] font-extrabold bg-neutral-900 text-white px-2 py-0.5 rounded-md uppercase tracking-wider">Novo</span>
        </div>
      </div>

      {/* PROFILE SIDE-SHEET DIALOG MODAL (Matches Image 5 exactly!) */}
      {profileOpen && (
        <div className="absolute inset-0 bg-neutral-950/45 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-neutral-250 rounded-3xl w-full max-w-[360px] overflow-hidden shadow-2xl flex flex-col p-5 select-none animate-scale-up">
            
            {/* Top row with Close button */}
            <div className="flex items-center justify-between mb-4">
              <button 
                onClick={() => setProfileOpen(false)}
                className="p-1 rounded-full hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <span className="text-[10px] font-extrabold tracking-widest uppercase text-neutral-500">Perfil do Cliente</span>
            </div>

            {/* Profile Avatar & Name */}
            <div className="flex flex-col items-center text-center gap-3 py-4 border-b border-neutral-200">
              <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-neutral-900/15">
                <User className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-neutral-900 tracking-tight">{user.name.toUpperCase()}</h3>
            </div>

            {/* Agência / Conta highlighted box exactly */}
            <div className="my-5 p-3.5 rounded-xl border-2 border-neutral-900 bg-neutral-50 flex flex-col gap-1.5 text-xs text-left">
              <div className="flex items-center justify-between text-[11px] font-bold text-neutral-700">
                <span>Agência {user.agency} • Conta {user.accountNumber}</span>
              </div>
              <p className="text-[11px] text-neutral-500 leading-normal">
                Banco 0260 - PG Pagamentos S.A. - Instituição de Pagamento
              </p>
            </div>

            {/* Navigation Options List */}
            <div className="flex flex-col divide-y divide-neutral-100 mb-3">
              <button 
                onClick={() => { setProfileOpen(false); setHelpModalOpen(true); }}
                className="py-3 px-1 flex items-center justify-between text-xs font-bold text-neutral-600 hover:text-neutral-900 group text-left"
              >
                <span>Me ajuda</span>
                <ChevronRight className="w-4 h-4 text-neutral-450 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button 
                onClick={() => { setProfileOpen(false); setIsEditingName(true); }}
                className="py-3 px-1 flex items-center justify-between text-xs font-bold text-neutral-600 hover:text-neutral-900 group text-left"
              >
                <span>Meus Dados (Editar Nome)</span>
                <ChevronRight className="w-4 h-4 text-neutral-450 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button 
                onClick={() => { setProfileOpen(false); setConfigModalOpen(true); }}
                className="py-3 px-1 flex items-center justify-between text-xs font-bold text-neutral-600 hover:text-neutral-900 group text-left"
              >
                <span>Configurar app</span>
                <ChevronRight className="w-4 h-4 text-neutral-450 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button 
                onClick={() => { setProfileOpen(false); setSecurityModalOpen(true); }}
                className="py-3 px-1 flex items-center justify-between text-xs font-bold text-neutral-600 hover:text-neutral-900 group text-left"
              >
                <span>Segurança</span>
                <ChevronRight className="w-4 h-4 text-neutral-450 group-hover:translate-x-0.5 transition-transform" />
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
                  className="text-red-500 hover:text-red-600 text-xs font-extrabold uppercase tracking-widest cursor-pointer hover:underline transition-all"
                >
                  Sair da Conta
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* 1. LOAN MODAL */}
      {loanModalOpen && (
        <div className="absolute inset-0 bg-neutral-950/45 z-50 flex items-center justify-center p-4 animate-fade-in select-none">
          <div className="bg-white border border-neutral-250 rounded-3xl w-full max-w-[360px] overflow-hidden shadow-2xl flex flex-col p-5 animate-scale-up">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-neutral-100">
              <span className="text-sm font-bold text-neutral-805">Contratar Empréstimo</span>
              <button onClick={() => setLoanModalOpen(false)} className="p-1 rounded-full hover:bg-neutral-100 text-neutral-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            {loanSuccess ? (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 animate-bounce">
                  <Check className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-neutral-900">Empréstimo Concedido!</h3>
                <p className="text-xs text-neutral-500 max-w-[240px]">
                  O valor de <b>{formatValue(parseFloat(loanAmount))}</b> foi creditado instantaneamente na sua conta.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4 text-left">
                <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-neutral-500">Simulador de Crédito</span>
                  <div className="flex flex-col gap-1 mt-2">
                    <label className="text-xs font-bold text-neutral-700">Valor desejado (R$):</label>
                    <input 
                      type="number" 
                      min="500" 
                      max="50000"
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(e.target.value)}
                      className="bg-white border border-neutral-300 rounded-xl px-3 py-2 text-sm font-bold w-full focus:ring-1 focus:ring-neutral-900 focus:outline-none text-neutral-800"
                    />
                    <span className="text-[10px] text-neutral-450">Limite máximo pré-aprovado: R$ 50.000,00</span>
                  </div>

                  <div className="flex flex-col gap-1 mt-4">
                    <label className="text-xs font-bold text-neutral-700">Parcelas:</label>
                    <select 
                      value={loanInstallments} 
                      onChange={(e) => setLoanInstallments(Number(e.target.value))}
                      className="bg-white border border-neutral-300 rounded-xl px-2 py-2 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-neutral-900 text-neutral-800"
                    >
                      <option value={6}>6 parcelas</option>
                      <option value={12}>12 parcelas</option>
                      <option value={18}>18 parcelas</option>
                      <option value={24}>24 parcelas</option>
                    </select>
                  </div>
                </div>

                <div className="bg-neutral-900 text-white p-4 rounded-xl flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">Taxa de juros:</span>
                    <span className="font-bold text-emerald-400">1,99% a.m.</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">Valor da parcela:</span>
                    <span className="font-bold">
                      {formatValue((parseFloat(loanAmount) || 0) * (1.12 / loanInstallments))}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs border-t border-neutral-850 pt-1.5 mt-1">
                    <span className="text-neutral-400 font-bold">Total a pagar:</span>
                    <span className="font-bold text-sm">
                      {formatValue((parseFloat(loanAmount) || 0) * 1.12)}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={handleConfirmLoan}
                  className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 active:scale-98 transition-all text-white font-bold text-xs uppercase tracking-wider rounded-xl mt-1 cursor-pointer"
                >
                  Contratar Empréstimo
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. RECHARGE MODAL */}
      {rechargeModalOpen && (
        <div className="absolute inset-0 bg-neutral-950/45 z-50 flex items-center justify-center p-4 animate-fade-in select-none">
          <div className="bg-white border border-neutral-250 rounded-3xl w-full max-w-[360px] overflow-hidden shadow-2xl flex flex-col p-5 animate-scale-up">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-neutral-100">
              <span className="text-sm font-bold text-neutral-805">Recarga Celular</span>
              <button onClick={() => setRechargeModalOpen(false)} className="p-1 rounded-full hover:bg-neutral-100 text-neutral-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            {rechargeSuccess ? (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 animate-bounce">
                  <Check className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-neutral-900">Recarga Efetuada!</h3>
                <p className="text-xs text-neutral-500 max-w-[240px]">
                  Sua recarga no valor de <b>{formatValue(rechargeAmount)}</b> para <b>{rechargePhone}</b> ({rechargeOperator}) foi realizada.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4 text-left">
                {rechargeError && (
                  <div className="bg-red-50 text-red-650 text-xs p-3 rounded-xl flex items-center gap-2 border border-red-100 animate-shake">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{rechargeError}</span>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-neutral-700">Número de Celular:</label>
                  <input 
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={rechargePhone}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '');
                      let formatted = clean;
                      if (clean.length > 2) {
                        formatted = `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
                      }
                      if (clean.length > 7) {
                        formatted = `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7, 11)}`;
                      }
                      setRechargePhone(formatted.slice(0, 15));
                    }}
                    className="bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-neutral-800 w-full focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-neutral-700">Operadora:</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['Vivo', 'Claro', 'TIM', 'Oi'].map((op) => (
                      <button 
                        key={op}
                        type="button"
                        onClick={() => setRechargeOperator(op)}
                        className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          rechargeOperator === op 
                            ? 'bg-neutral-900 text-white border-neutral-900' 
                            : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
                        }`}
                      >
                        {op}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-neutral-700">Valor da Recarga:</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[20, 30, 50, 100].map((amt) => (
                      <button 
                        key={amt}
                        type="button"
                        onClick={() => setRechargeAmount(amt)}
                        className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          rechargeAmount === amt 
                            ? 'bg-neutral-900 text-white border-neutral-900' 
                            : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
                        }`}
                      >
                        R$ {amt}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={handleConfirmRecharge}
                  className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 active:scale-98 transition-all text-white font-bold text-xs uppercase tracking-wider rounded-xl mt-2 cursor-pointer"
                >
                  Confirmar Recarga ({formatValue(rechargeAmount)})
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. SHOPPING MODAL */}
      {shoppingModalOpen && (
        <div className="absolute inset-0 bg-neutral-950/45 z-50 flex items-center justify-center p-4 animate-fade-in select-none">
          <div className="bg-white border border-neutral-250 rounded-3xl w-full max-w-[360px] overflow-hidden shadow-2xl flex flex-col p-5 animate-scale-up">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-neutral-100">
              <div className="flex items-center gap-1.5 text-neutral-800">
                <ShoppingBag className="w-5 h-5 text-neutral-900" />
                <span className="text-sm font-bold">Shopping PGBANK</span>
              </div>
              <button onClick={() => setShoppingModalOpen(false)} className="p-1 rounded-full hover:bg-neutral-100 text-neutral-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            {shoppingSuccess ? (
              <div className="flex flex-col items-center justify-center py-6 text-center gap-3">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 animate-bounce">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-neutral-900">Compra Confirmada!</h3>
                {purchasedGiftCard && (
                  <div className="flex flex-col gap-1 text-xs text-neutral-500 max-w-[240px]">
                    <p>Você adquiriu o Gift Card <b>{purchasedGiftCard.name}</b> no valor de <b>{formatValue(purchasedGiftCard.price)}</b>.</p>
                    <span className="text-emerald-600 font-extrabold mt-1">
                      Cashback de +{formatValue(purchasedGiftCard.cashback)} creditado!
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200 flex justify-between items-center text-xs">
                  <span className="text-neutral-550 font-bold">Seu saldo atual:</span>
                  <span className="text-neutral-900 font-extrabold">{formatValue(user.balance)}</span>
                </div>

                <span className="text-[10px] uppercase font-extrabold tracking-wider text-neutral-450 mt-1 text-left">GIFT CARDS COM CASHBACK</span>
                <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                  {[
                    { name: 'Spotify Premium', price: 20, cashbackPct: 5, bg: 'bg-emerald-500 text-white' },
                    { name: 'Netflix Premium', price: 50, cashbackPct: 4, bg: 'bg-red-600 text-white' },
                    { name: 'Steam Wallet', price: 30, cashbackPct: 6, bg: 'bg-blue-600 text-white' },
                    { name: 'Uber Cash', price: 40, cashbackPct: 3, bg: 'bg-neutral-900 text-white' }
                  ].map((card) => (
                    <div 
                      key={card.name}
                      onClick={() => handleBuyGiftCard(card)}
                      className="border border-neutral-150 p-3 rounded-xl flex items-center justify-between hover:border-neutral-900 cursor-pointer transition-all active:scale-[0.99] bg-neutral-50/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center font-extrabold text-[12px] uppercase tracking-tighter`}>
                          {card.name[0]}
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="text-xs font-bold text-neutral-800">{card.name}</span>
                          <span className="text-[10px] text-emerald-600 font-extrabold">{card.cashbackPct}% cashback</span>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold text-neutral-900">R$ {card.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. HELP CENTER MODAL */}
      {helpModalOpen && (
        <div className="absolute inset-0 bg-neutral-950/45 z-50 flex items-center justify-center p-4 animate-fade-in select-none">
          <div className="bg-white border border-neutral-250 rounded-3xl w-full max-w-[360px] overflow-hidden shadow-2xl flex flex-col p-5 animate-scale-up">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-neutral-100">
              <span className="text-sm font-bold text-neutral-800 flex items-center gap-1.5">
                <HelpCircle className="w-5 h-5 text-neutral-600" />
                Central de Ajuda PGBANK
              </span>
              <button onClick={() => setHelpModalOpen(false)} className="p-1 rounded-full hover:bg-neutral-100 text-neutral-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1">
              {[
                { q: 'Como recuperar minha senha de transação?', a: 'Sua senha de transação pode ser redefinida acessando Perfil > Configurações de Segurança. Lembre-se que ela deve ter 4 dígitos numéricos.' },
                { q: 'Qual o prazo para compensação de transferências?', a: 'Transferências via Pix são instantâneas 24/7. Transferências via Agência e Conta (TED) levam até 1 hora útil dentro do expediente bancário.' },
                { q: 'Como aumentar o limite do meu cartão de crédito?', a: 'Seu limite atual é pré-aprovado automaticamente por análises recorrentes baseadas na sua movimentação de conta e pagamento de faturas.' },
                { q: 'O aplicativo PGBANK é totalmente seguro?', a: 'Sim. Seus fundos estão protegidos sob custódia integral de PG Pagamentos S.A., operando sob todas as diretrizes do Banco Central do Brasil.' }
              ].map((faq, idx) => (
                <div key={idx} className="bg-neutral-50 p-3 rounded-xl border border-neutral-200/60 text-left">
                  <h4 className="text-xs font-bold text-neutral-900 mb-1">{faq.q}</h4>
                  <p className="text-[10px] text-neutral-500 leading-normal font-sans">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. APP CONFIGURATION MODAL */}
      {configModalOpen && (
        <div className="absolute inset-0 bg-neutral-950/45 z-50 flex items-center justify-center p-4 animate-fade-in select-none">
          <div className="bg-white border border-neutral-250 rounded-3xl w-full max-w-[360px] overflow-hidden shadow-2xl flex flex-col p-5 animate-scale-up">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-neutral-100">
              <span className="text-sm font-bold text-neutral-805">Configuração do App</span>
              <button onClick={() => setConfigModalOpen(false)} className="p-1 rounded-full hover:bg-neutral-100 text-neutral-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-left">
              {[
                { title: 'Notificações Instantâneas', desc: 'Alertar sobre Pix recebidos ou compras no cartão.', defaultVal: true },
                { title: 'Pix Automático Recorrente', desc: 'Permitir agendamentos automáticos inteligentes.', defaultVal: false },
                { title: 'Biometria Facial / Touch ID', desc: 'Solicitar autenticação para abertura rápida do app.', defaultVal: true },
                { title: 'Modo Desenvolvedor (Mock)', desc: 'Persistir transações e simulações na base local.', defaultVal: true }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-neutral-50/50 border border-neutral-100 text-left">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-neutral-800">{item.title}</span>
                    <span className="text-[10px] text-neutral-450 font-sans max-w-[200px] leading-tight">{item.desc}</span>
                  </div>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <div className="w-9 h-5 bg-neutral-900 rounded-full transition-colors relative">
                      <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all ${item.defaultVal ? 'right-[3px]' : 'left-[3px]'}`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. SECURITY MODAL */}
      {securityModalOpen && (
        <div className="absolute inset-0 bg-neutral-950/45 z-50 flex items-center justify-center p-4 animate-fade-in select-none">
          <div className="bg-white border border-neutral-250 rounded-3xl w-full max-w-[360px] overflow-hidden shadow-2xl flex flex-col p-5 animate-scale-up">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-neutral-100">
              <span className="text-sm font-bold text-neutral-800 flex items-center gap-1.5">
                <ShieldCheck className="w-5 h-5 text-neutral-950" />
                Segurança da Conta PGBANK
              </span>
              <button onClick={() => setSecurityModalOpen(false)} className="p-1 rounded-full hover:bg-neutral-100 text-neutral-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3.5 text-left">
              <div className="bg-emerald-50 border border-emerald-150 p-3.5 rounded-xl text-left flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-xs font-extrabold text-emerald-800">Proteção Avançada Ativa</span>
                  <p className="text-[10px] text-emerald-600 font-sans mt-0.5 leading-normal">
                    Seu saldo e transações estão blindados com criptografia de ponta a ponta e cripto-tokens rotativos de segurança.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 text-left">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-neutral-400">Opções Rápidas</span>
                <div className="divide-y divide-neutral-100 text-xs">
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="font-bold text-neutral-700">Bloquear Cartão Virtual</span>
                    <span className="text-[10px] font-extrabold text-red-500 uppercase cursor-pointer hover:underline">Bloquear</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="font-bold text-neutral-700">Modo de Acesso Seguro</span>
                    <span className="text-[10px] font-extrabold text-neutral-500 uppercase">Ativo</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="font-bold text-neutral-700">Dispositivos Autorizados</span>
                    <span className="text-[10px] font-extrabold text-neutral-900 uppercase">1 Dispositivo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
