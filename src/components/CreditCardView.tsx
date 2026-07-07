import React, { useState } from 'react';
import { ArrowLeft, HelpCircle, Lock, Settings, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { BankUser } from '../types';

interface CreditCardViewProps {
  user: BankUser;
  onBack: () => void;
  onUpdateLimit: (newLimit: number) => void;
}

export default function CreditCardView({ user, onBack, onUpdateLimit }: CreditCardViewProps) {
  const [showSensitive, setShowSensitive] = useState(true);

  const formatCardNumber = (numStr: string) => {
    // Standard 16 digit string format: "5062 9876 1672 3108"
    const cleaned = numStr.replace(/\D/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    if (!groups) return numStr;
    
    if (!showSensitive) {
      return `•••• •••• •••• ${groups[3] || '3108'}`;
    }
    return groups.join(' ');
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  return (
    <div className="flex-1 flex flex-col bg-white text-neutral-800">
      
      {/* Top Bar */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between bg-white border-b border-neutral-100">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-neutral-100 text-neutral-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-bold text-sm tracking-tight text-neutral-700">Cartão virtual</span>
        <button className="p-2 rounded-full hover:bg-neutral-100 text-neutral-600 transition-colors">
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>

      <div className="p-5 flex-1 flex flex-col gap-6">
        
        {/* The Sleek Nubank Purple Virtual Card */}
        <div className="relative w-full aspect-[1.586/1] rounded-2xl bg-gradient-to-br from-[#830AD1] via-[#8B1AD6] to-[#7600C2] p-5 text-white shadow-lg overflow-hidden flex flex-col justify-between">
          {/* Logo brand and card type */}
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-display italic font-extrabold text-2xl tracking-tight text-white select-none">
                nu <span className="text-xs font-normal not-italic opacity-80 ml-1">virtual</span>
              </span>
              <span className="text-[9px] font-extrabold tracking-wide text-emerald-300 mt-0.5 uppercase flex items-center gap-1">
                ● CARTÃO ATIVO E CRÉDITO VÁLIDO
              </span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded border border-white/10">
              platinum
            </span>
          </div>

          {/* Masked Card Number */}
          <div className="flex flex-col gap-0.5 my-3">
            <span className="text-sm font-semibold tracking-wide text-neutral-200">Número do cartão (Luhn Verificado)</span>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold font-mono tracking-wider">
                {formatCardNumber('5222890012345679')}
              </span>
              <button 
                onClick={() => setShowSensitive(!showSensitive)}
                className="p-1 rounded hover:bg-white/10 text-white/80 active:scale-95 transition-all"
              >
                {showSensitive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Footer Details: Holder name, expiry, cvv, Mastercard brand */}
          <div className="flex items-end justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-200">Titular</span>
              <span className="text-sm font-bold tracking-wide font-display">
                {user.name.toUpperCase()}
              </span>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-200">Validade</span>
                <span className="text-xs font-bold font-mono">10/29</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-200">CVV</span>
                <span className="text-xs font-bold font-mono">{showSensitive ? '382' : '•••'}</span>
              </div>
            </div>

            {/* Mastercard logo mockup */}
            <div className="flex -space-x-2 opacity-90 select-none">
              <div className="w-5.5 h-5.5 rounded-full bg-red-500"></div>
              <div className="w-5.5 h-5.5 rounded-full bg-amber-500 bg-opacity-80"></div>
            </div>
          </div>
        </div>

        {/* Card Data Fields - Interactive on click or simply displayed beautifully */}
        <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200/50 flex flex-col divide-y divide-neutral-200/40">
          <div className="py-2.5 flex justify-between items-center text-sm">
            <span className="text-neutral-500 font-medium">Nome no cartão</span>
            <span className="font-bold text-neutral-800">{user.name}</span>
          </div>
          <div className="py-2.5 flex justify-between items-center text-sm">
            <span className="text-neutral-500 font-medium">Categoria</span>
            <span className="font-bold text-purple-700">Mastercard Platinum</span>
          </div>
          <div className="py-2.5 flex justify-between items-center text-sm">
            <span className="text-neutral-500 font-medium">Função</span>
            <span className="font-bold text-neutral-800">Débito e Crédito</span>
          </div>
        </div>

        {/* Adjust Limit Interactive Slider */}
        <div className="bg-white rounded-2xl p-4.5 border border-neutral-200/70 shadow-sm flex flex-col gap-4">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-neutral-800 font-display">Ajustar Limite do Cartão</span>
            <span className="text-xs text-neutral-400 mt-0.5">Arraste para simular o limite do seu cartão de crédito</span>
          </div>

          <div className="flex justify-between items-center bg-neutral-50 p-3 rounded-xl border border-neutral-200/30">
            <div className="flex flex-col">
              <span className="text-[11px] text-neutral-500 font-bold">Fatura Atual</span>
              <span className="text-sm font-bold text-[#009B9E]">{formatCurrency(user.creditCardInvoice)}</span>
            </div>
            <div className="h-6 w-px bg-neutral-200"></div>
            <div className="flex flex-col items-end">
              <span className="text-[11px] text-neutral-500 font-bold">Limite Disponível</span>
              <span className="text-sm font-bold text-neutral-800">{formatCurrency(user.creditCardLimit)}</span>
            </div>
          </div>

          {/* Range input slider */}
          <div className="flex flex-col gap-1 px-1">
            <input 
              type="range" 
              min="500" 
              max="15000" 
              step="100"
              value={user.creditCardLimit}
              onChange={(e) => onUpdateLimit(Number(e.target.value))}
              className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-[#830AD1]"
            />
            <div className="flex justify-between text-[10px] text-neutral-400 font-bold mt-1">
              <span>R$ 500,00</span>
              <span>R$ 15.000,00</span>
            </div>
          </div>
        </div>

        {/* Virtual Actions */}
        <div className="grid grid-cols-2 gap-3 mt-auto">
          <button className="flex items-center justify-center gap-2 border-2 border-[#830AD1]/25 hover:border-[#830AD1]/55 text-[#830AD1] py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98]">
            <Lock className="w-4 h-4" />
            Bloquear cartão
          </button>
          <button className="flex items-center justify-center gap-2 border-2 border-[#830AD1]/25 hover:border-[#830AD1]/55 text-[#830AD1] py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98]">
            <Settings className="w-4 h-4" />
            Configurar
          </button>
        </div>

      </div>

    </div>
  );
}
