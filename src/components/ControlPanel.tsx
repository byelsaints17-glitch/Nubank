import React, { useState, useEffect } from 'react';
import { 
  User, CreditCard, DollarSign, Calendar, Clock, Sparkles, 
  RefreshCw, Plus, Landmark, Trash2, ArrowDownCircle, ArrowUpCircle,
  ShieldCheck, ShieldAlert, Terminal, Search, Trash, CheckCircle2, X
} from 'lucide-react';
import { BankUser, BankRecipient, TransactionDetails, StatementItem } from '../types';

interface ControlPanelProps {
  user: BankUser;
  setUser: (u: BankUser) => void;
  recipient: BankRecipient;
  setRecipient: (r: BankRecipient) => void;
  transaction: TransactionDetails;
  setTransaction: (t: TransactionDetails) => void;
  onLoadPreset: (type: 'receipt-example' | 'gabriela-example' | 'clean') => void;
  onAddManualStatementItem: (item: Omit<StatementItem, 'id'>) => void;
  onClearStatementHistory: () => void;
}

export default function ControlPanel({
  user,
  setUser,
  recipient,
  setRecipient,
  transaction,
  setTransaction,
  onLoadPreset,
  onAddManualStatementItem,
  onClearStatementHistory
}: ControlPanelProps) {
  
  // Tab control: 'simulador' | 'operador'
  const [activePanelTab, setActivePanelTab] = useState<'simulador' | 'operador'>('simulador');

  // Local subform state for inserting a statement item manually
  const [manualTitle, setManualTitle] = useState('Transferência recebida');
  const [manualAmount, setManualAmount] = useState('150.00');
  const [manualIncoming, setManualIncoming] = useState(true);
  const [manualOpponent, setManualOpponent] = useState('Pedro Alvares Cabral');

  // Operator states
  const [authorizedCPFs, setAuthorizedCPFs] = useState<string[]>([]);
  const [newCpf, setNewCpf] = useState('');
  const [newName, setNewName] = useState('');
  const [bankCodeSearch, setBankCodeSearch] = useState('');
  const [searchedBankResult, setSearchedBankResult] = useState<any>(null);
  const [searchedBankError, setSearchedBankError] = useState('');
  const [serverLogs, setServerLogs] = useState<any[]>([]);
  const [isRefreshingLogs, setIsRefreshingLogs] = useState(false);

  // Load authorized CPFs from backend
  const loadAuthorizedCPFs = async () => {
    try {
      const res = await fetch('/api/authorized-cpfs');
      if (res.ok) {
        const data = await res.json();
        setAuthorizedCPFs(data.cpfs);
      }
    } catch (err) {
      console.error('Failed to load authorized CPFs', err);
    }
  };

  // Load server logs from backend
  const loadServerLogs = async () => {
    setIsRefreshingLogs(true);
    try {
      const res = await fetch('/api/logs');
      if (res.ok) {
        const data = await res.json();
        setServerLogs(data.logs);
      }
    } catch (err) {
      console.error('Failed to load server logs', err);
    } finally {
      setIsRefreshingLogs(false);
    }
  };

  // Poll logs and CPFs when Operator tab is active
  useEffect(() => {
    if (activePanelTab === 'operador') {
      loadAuthorizedCPFs();
      loadServerLogs();
      const interval = setInterval(() => {
        loadServerLogs();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [activePanelTab]);

  const generateRandomTxId = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'E30680829';
    for (let i = 0; i < 23; i++) {
      result += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    setTransaction({
      ...transaction,
      transactionId: result
    });
  };

  const handleUserChange = (field: keyof BankUser, value: any) => {
    setUser({ ...user, [field]: value });
  };

  const handleRecipientChange = (field: keyof BankRecipient, value: any) => {
    setRecipient({ ...recipient, [field]: value });
  };

  const handleTxChange = (field: keyof TransactionDetails, value: any) => {
    setTransaction({ ...transaction, [field]: value });
  };

  const submitManualStatement = () => {
    const amt = parseFloat(manualAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Por favor, digite um valor válido.');
      return;
    }

    onAddManualStatementItem({
      title: manualTitle,
      description: manualIncoming ? `Recebido de ${manualOpponent}` : `Enviado para ${manualOpponent}`,
      amount: amt,
      date: transaction.date,
      time: transaction.time,
      type: manualIncoming ? 'Depósito' : 'Pix',
      incoming: manualIncoming,
      senderName: manualIncoming ? manualOpponent : undefined,
      recipientName: !manualIncoming ? manualOpponent : undefined,
    });

    // Reset subform
    setManualTitle(manualIncoming ? 'Transferência recebida' : 'Pix enviado');
    setManualAmount('150.00');
    setManualOpponent('Lucas Mendes');
  };

  const handleAuthorizeCPF = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newCpf.replace(/\D/g, '');
    if (clean.length !== 11) {
      alert('Por favor, digite um CPF válido contendo exatamente 11 dígitos.');
      return;
    }
    try {
      const res = await fetch('/api/authorized-cpfs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf: clean, nome: newName || undefined })
      });
      if (res.ok) {
        setNewCpf('');
        setNewName('');
        loadAuthorizedCPFs();
        loadServerLogs();
      } else {
        const err = await res.json();
        alert(err.message || 'Erro ao autorizar o CPF.');
      }
    } catch (err) {
      alert('Erro de conexão com o servidor.');
    }
  };

  const handleRemoveCPF = async (cpf: string) => {
    if (!confirm(`Remover autorização de consulta para o CPF ${cpf}?`)) return;
    try {
      const res = await fetch(`/api/authorized-cpfs/${cpf}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        loadAuthorizedCPFs();
        loadServerLogs();
      } else {
        const err = await res.json();
        alert(err.message || 'Erro ao revogar CPF.');
      }
    } catch (err) {
      alert('Erro de conexão com o servidor.');
    }
  };

  const handleOperatorBankSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = bankCodeSearch.trim().replace(/\D/g, '');
    if (!clean) return;
    setSearchedBankError('');
    setSearchedBankResult(null);
    try {
      const res = await fetch(`/api/banks/${clean}`);
      const data = await res.json();
      if (res.ok) {
        setSearchedBankResult(data);
      } else {
        setSearchedBankError(data.message || 'Código COMPE ou ISPB não localizado.');
      }
    } catch (err) {
      setSearchedBankError('Erro de conexão com o servidor.');
    }
  };

  return (
    <div className="w-full bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-md flex flex-col gap-5 text-neutral-800 text-sm overflow-y-auto h-[85vh] no-scrollbar">
      
      {/* Title */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-100 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <h2 className="text-lg font-bold text-neutral-900 tracking-tight font-display">
            Painel Administrativo PGBANK
          </h2>
        </div>
        <span className="text-[10px] uppercase font-bold text-neutral-400 bg-neutral-100 px-2 py-1 rounded-md">
          v2.0 Full-Stack
        </span>
      </div>

      {/* Visual Tab Selector */}
      <div className="grid grid-cols-2 gap-1 bg-neutral-100 p-1 rounded-2xl border border-neutral-200/50 shrink-0">
        <button
          onClick={() => setActivePanelTab('simulador')}
          className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activePanelTab === 'simulador'
              ? 'bg-white text-neutral-900 shadow-sm font-extrabold shadow-sm border border-neutral-200/20'
              : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          Simulador PGBANK
        </button>
        <button
          onClick={() => {
            setActivePanelTab('operador');
            loadAuthorizedCPFs();
            loadServerLogs();
          }}
          className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activePanelTab === 'operador'
              ? 'bg-white text-neutral-900 shadow-sm font-extrabold shadow-sm border border-neutral-200/20'
              : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Operador (SERPRO + BrasilAPI)
        </button>
      </div>

      {activePanelTab === 'simulador' ? (
        <div className="flex flex-col gap-5">
          {/* Preset Buttons */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Presets de Simulação</span>
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => onLoadPreset('receipt-example')}
                className="bg-neutral-100 hover:bg-neutral-200 active:scale-95 text-neutral-850 font-bold text-xs py-2 px-1 rounded-xl transition-all border border-neutral-200 cursor-pointer"
              >
                Caso Pedro (Nu)
              </button>
              <button 
                onClick={() => onLoadPreset('gabriela-example')}
                className="bg-neutral-100 hover:bg-neutral-200 active:scale-95 text-neutral-850 font-bold text-xs py-2 px-1 rounded-xl transition-all border border-neutral-200 cursor-pointer"
              >
                Caso Gabriela (Bradesco)
              </button>
              <button 
                onClick={() => onLoadPreset('clean')}
                className="bg-neutral-100 hover:bg-neutral-200 text-neutral-600 font-bold text-xs py-2 px-1 rounded-xl transition-all cursor-pointer"
              >
                Limpar Dados
              </button>
            </div>
          </div>

          {/* Section 1: Paying User Settings */}
          <div className="flex flex-col gap-4 border border-neutral-200/50 p-4 rounded-2xl bg-neutral-50/50">
            <h3 className="font-bold text-neutral-900 flex items-center gap-2 font-display">
              <User className="w-4 h-4 text-neutral-800" />
              1. Seus Dados (Pagador / Origem)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-neutral-500 font-semibold">Nome Completo</label>
                <input 
                  type="text" 
                  value={user.name}
                  onChange={(e) => handleUserChange('name', e.target.value)}
                  className="px-3 py-1.5 bg-white border border-neutral-200 rounded-xl focus:border-neutral-900 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-neutral-500 font-semibold">CPF</label>
                <input 
                  type="text" 
                  value={user.cpf}
                  onChange={(e) => handleUserChange('cpf', e.target.value)}
                  className="px-3 py-1.5 bg-white border border-neutral-200 rounded-xl focus:border-neutral-900 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-neutral-500 font-semibold">Saldo Atual (R$)</label>
                <input 
                  type="number" 
                  value={user.balance}
                  onChange={(e) => handleUserChange('balance', parseFloat(e.target.value) || 0)}
                  className="px-3 py-1.5 bg-white border border-neutral-200 rounded-xl focus:border-neutral-900 focus:outline-none font-bold text-neutral-800"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-neutral-500 font-semibold">Número da Conta</label>
                <input 
                  type="text" 
                  value={user.accountNumber}
                  onChange={(e) => handleUserChange('accountNumber', e.target.value)}
                  className="px-3 py-1.5 bg-white border border-neutral-200 rounded-xl focus:border-neutral-900 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Recipient Settings */}
          <div className="flex flex-col gap-4 border border-neutral-200/50 p-4 rounded-2xl bg-neutral-50/50">
            <h3 className="font-bold text-neutral-900 flex items-center gap-2 font-display">
              <User className="w-4 h-4 text-emerald-600" />
              2. Dados do Recebedor (Destino)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-neutral-500 font-semibold">Nome Completo</label>
                <input 
                  type="text" 
                  value={recipient.name}
                  onChange={(e) => handleRecipientChange('name', e.target.value)}
                  className="px-3 py-1.5 bg-white border border-neutral-200 rounded-xl focus:border-neutral-900 focus:outline-none font-bold"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-neutral-500 font-semibold">Banco Destino</label>
                <input 
                  type="text" 
                  value={recipient.bankName}
                  onChange={(e) => handleRecipientChange('bankName', e.target.value)}
                  className="px-3 py-1.5 bg-white border border-neutral-200 rounded-xl focus:border-neutral-900 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-neutral-500 font-semibold">Agência</label>
                <input 
                  type="text" 
                  value={recipient.agency}
                  onChange={(e) => handleRecipientChange('agency', e.target.value)}
                  className="px-3 py-1.5 bg-white border border-neutral-200 rounded-xl focus:border-neutral-900 focus:outline-none font-mono"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-neutral-500 font-semibold">Conta com Dígito</label>
                <input 
                  type="text" 
                  value={recipient.accountNumber}
                  onChange={(e) => handleRecipientChange('accountNumber', e.target.value)}
                  className="px-3 py-1.5 bg-white border border-neutral-200 rounded-xl focus:border-neutral-900 focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Transaction Details */}
          <div className="flex flex-col gap-4 border border-neutral-200/50 p-4 rounded-2xl bg-neutral-50/50">
            <h3 className="font-bold text-neutral-900 flex items-center gap-2 font-display">
              <CreditCard className="w-4 h-4 text-neutral-600" />
              3. Detalhes do Comprovante / Envio
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-neutral-500 font-semibold font-sans">Valor da Transação (R$)</label>
                <input 
                  type="number" 
                  value={transaction.amount}
                  onChange={(e) => handleTxChange('amount', parseFloat(e.target.value) || 0)}
                  className="px-3 py-1.5 bg-white border border-neutral-200 rounded-xl focus:border-neutral-900 focus:outline-none font-extrabold text-neutral-900"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-neutral-500 font-semibold">Data de Envio</label>
                <input 
                  type="text" 
                  value={transaction.date}
                  onChange={(e) => handleTxChange('date', e.target.value)}
                  className="px-3 py-1.5 bg-white border border-neutral-200 rounded-xl focus:border-neutral-900 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-neutral-500 font-semibold">Hora de Envio</label>
                <input 
                  type="text" 
                  value={transaction.time}
                  onChange={(e) => handleTxChange('time', e.target.value)}
                  className="px-3 py-1.5 bg-white border border-neutral-200 rounded-xl focus:border-neutral-900 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-neutral-500 font-semibold">ID da Transação / Autenticação</label>
                  <button 
                    onClick={generateRandomTxId}
                    className="text-[11px] font-bold text-neutral-800 hover:underline flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Novo ID
                  </button>
                </div>
                <input 
                  type="text" 
                  value={transaction.transactionId}
                  onChange={(e) => handleTxChange('transactionId', e.target.value)}
                  className="px-3 py-1.5 bg-white border border-neutral-200 rounded-xl focus:border-neutral-900 focus:outline-none font-mono text-xs font-bold text-neutral-700"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Append Custom items to Extrato / History */}
          <div className="flex flex-col gap-4 border border-neutral-200/50 p-4 rounded-2xl bg-neutral-50/50 pb-6">
            <h3 className="font-bold text-neutral-900 flex items-center justify-between gap-2 font-display">
              <span className="flex items-center gap-2">
                <Landmark className="w-4 h-4 text-neutral-700" />
                4. Inserir no Extrato (Histórico)
              </span>
              <button 
                onClick={onClearStatementHistory}
                className="text-[10px] text-red-600 hover:text-red-700 font-bold bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-full flex items-center gap-1 transition-all cursor-pointer"
                title="Limpar extrato histórico"
              >
                <Trash2 className="w-3 h-3" />
                Limpar
              </button>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-neutral-500 font-semibold">Título do Log</label>
                <input 
                  type="text" 
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="e.g. Pix enviado, Transferência recebida"
                  className="px-3 py-1.5 bg-white border border-neutral-200 rounded-xl focus:border-neutral-900 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-neutral-500 font-semibold">Nome da outra pessoa</label>
                <input 
                  type="text" 
                  value={manualOpponent}
                  onChange={(e) => setManualOpponent(e.target.value)}
                  placeholder="e.g. Matheus, Nathan"
                  className="px-3 py-1.5 bg-white border border-neutral-200 rounded-xl focus:border-neutral-900 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-neutral-500 font-semibold">Valor (R$)</label>
                <input 
                  type="number" 
                  value={manualAmount}
                  onChange={(e) => setManualAmount(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-neutral-200 rounded-xl focus:border-neutral-900 focus:outline-none font-bold text-neutral-800"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-neutral-500 font-semibold font-sans">Tipo de Fluxo</label>
                <div className="grid grid-cols-2 gap-1.5 bg-white p-0.5 rounded-xl border border-neutral-200/50">
                  <button 
                    onClick={() => {
                      setManualIncoming(true);
                      setManualTitle('Transferência recebida');
                    }}
                    className={`py-1 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      manualIncoming 
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/30 font-extrabold' 
                        : 'text-neutral-500 hover:bg-neutral-100'
                    }`}
                  >
                    <ArrowDownCircle className="w-3.5 h-3.5" />
                    Recebido (+)
                  </button>
                  <button 
                    onClick={() => {
                      setManualIncoming(false);
                      setManualTitle('Pix enviado');
                    }}
                    className={`py-1 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      !manualIncoming 
                        ? 'bg-neutral-100 text-neutral-800 border border-neutral-200 font-extrabold' 
                        : 'text-neutral-500 hover:bg-neutral-100'
                    }`}
                  >
                    <ArrowUpCircle className="w-3.5 h-3.5" />
                    Enviado (-)
                  </button>
                </div>
              </div>

              <button 
                onClick={submitManualStatement}
                className="w-full md:col-span-2 bg-neutral-900 hover:bg-neutral-850 text-white py-2.5 rounded-xl font-bold font-sans text-xs tracking-wide flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-[0.98] cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Adicionar Transação ao Extrato
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          
          {/* Section 1: CPFs Autorizados (SERPRO) */}
          <div className="flex flex-col gap-4 border border-neutral-200/50 p-4 rounded-2xl bg-neutral-50/50">
            <h3 className="font-bold text-neutral-900 flex items-center justify-between gap-2 font-display">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                CPFs Autorizados (Consulta SERPRO)
              </span>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                {authorizedCPFs.length} CPFs
              </span>
            </h3>

            <p className="text-xs text-neutral-500 leading-normal">
              As consultas oficiais do SERPRO no simulador estão limitadas aos CPFs listados e autorizados abaixo pelo operador da aplicação, respeitando a LGPD e a segurança cadastral.
            </p>

            {/* Form to Authorize CPF */}
            <form onSubmit={handleAuthorizeCPF} className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1 pb-3 border-b border-neutral-200/40">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-neutral-400 font-bold">CPF (apenas números)</label>
                <input 
                  type="text" 
                  value={newCpf}
                  onChange={(e) => setNewCpf(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  placeholder="Ex: 11054254524"
                  className="px-3 py-1.5 bg-white border border-neutral-200 rounded-xl focus:border-neutral-900 focus:outline-none text-xs font-mono font-bold"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-neutral-400 font-bold">Nome Simulado (Opcional)</label>
                <input 
                  type="text" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nome cadastral Receita"
                  className="px-3 py-1.5 bg-white border border-neutral-200 rounded-xl focus:border-neutral-900 focus:outline-none text-xs"
                />
              </div>

              <button 
                type="submit"
                className="w-full md:col-span-2 bg-neutral-900 hover:bg-neutral-850 text-white py-2 rounded-xl font-bold font-sans text-xs flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-[0.98]"
              >
                <Plus className="w-3.5 h-3.5" />
                Autorizar CPF no Servidor
              </button>
            </form>

            {/* List of Authorized CPFs */}
            <div className="max-h-40 overflow-y-auto pr-1 no-scrollbar flex flex-col gap-1.5">
              {authorizedCPFs.length === 0 ? (
                <div className="text-center py-4 text-xs text-neutral-400">Nenhum CPF autorizado. Cadastre um acima!</div>
              ) : (
                authorizedCPFs.map(cpf => (
                  <div key={cpf} className="flex items-center justify-between bg-white px-3 py-2 border border-neutral-150 rounded-xl hover:border-neutral-200 transition-all">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="font-mono text-xs font-bold text-neutral-700">
                        {cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}
                      </span>
                    </div>
                    <button 
                      onClick={() => handleRemoveCPF(cpf)}
                      className="text-neutral-400 hover:text-red-600 transition-colors p-1 cursor-pointer"
                      title="Revogar autorização de consulta"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section 2: BrasilAPI Bank Lookup Test */}
          <div className="flex flex-col gap-4 border border-neutral-200/50 p-4 rounded-2xl bg-neutral-50/50">
            <h3 className="font-bold text-neutral-900 flex items-center gap-2 font-display">
              <Landmark className="w-4 h-4 text-neutral-600" />
              BrasilAPI - Teste de Banco
            </h3>

            <p className="text-xs text-neutral-500 leading-normal">
              Consulte códigos de compensação (COMPE ou ISPB) diretamente na BrasilAPI do servidor para identificar bancos parceiros:
            </p>

            <form onSubmit={handleOperatorBankSearch} className="flex items-center gap-2">
              <input 
                type="text" 
                value={bankCodeSearch}
                onChange={(e) => setBankCodeSearch(e.target.value)}
                placeholder="Ex: 260 ou 18236120"
                className="px-3 py-1.5 bg-white border border-neutral-200 rounded-xl focus:border-neutral-900 focus:outline-none text-xs font-mono font-bold flex-1"
                required
              />
              <button 
                type="submit"
                className="bg-neutral-900 hover:bg-neutral-850 text-white p-2 rounded-xl flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>

            {searchedBankResult && (
              <div className="bg-emerald-50/50 border border-emerald-200/50 p-3 rounded-xl flex flex-col gap-1 relative overflow-hidden">
                <button 
                  onClick={() => setSearchedBankResult(null)}
                  className="absolute top-2 right-2 text-neutral-400 hover:text-neutral-600 p-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
                <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Identificado com Sucesso</div>
                <div className="font-bold text-neutral-900 text-xs">{searchedBankResult.name}</div>
                <div className="text-neutral-600 text-[11px] leading-tight mt-0.5"><b>Nome completo:</b> {searchedBankResult.fullName || searchedBankResult.name}</div>
                <div className="grid grid-cols-2 gap-2 mt-1.5 pt-1.5 border-t border-emerald-200/20 font-mono text-[10px] text-neutral-500">
                  <div><b>Código COMPE:</b> {searchedBankResult.code || 'N/A'}</div>
                  <div><b>Código ISPB:</b> {searchedBankResult.ispb || 'N/A'}</div>
                </div>
              </div>
            )}

            {searchedBankError && (
              <div className="bg-red-50/50 border border-red-200/30 p-3 rounded-xl flex items-center gap-2 text-red-700 text-xs font-bold">
                <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
                <span>{searchedBankError}</span>
              </div>
            )}
          </div>

          {/* Section 3: Live Audit Logs */}
          <div className="flex flex-col gap-4 border border-neutral-200/50 p-4 rounded-2xl bg-neutral-900 text-neutral-200 pb-5 shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-1.5 font-mono text-xs">
                <Terminal className="w-4 h-4 text-neutral-400" />
                EXPRESS_SERVER_AUDIT_LOGS
              </h3>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-pulse"></span>
                <span className="text-[9px] text-neutral-400 font-mono font-bold">STREAM_LIVE</span>
              </div>
            </div>

            <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 font-mono text-[10px] h-44 overflow-y-auto flex flex-col gap-2 leading-relaxed scrollbar-thin">
              {serverLogs.length === 0 ? (
                <div className="text-neutral-500 italic text-center py-10">Aguardando requisições do simulador...</div>
              ) : (
                serverLogs.map(log => {
                  const levelColors = {
                    INFO: 'text-emerald-400',
                    WARN: 'text-amber-400',
                    ERROR: 'text-red-400'
                  };
                  const catColors = {
                    OAUTH2: 'text-neutral-400',
                    SERPRO: 'text-cyan-400',
                    BRASIL_API: 'text-blue-400',
                    SYSTEM: 'text-neutral-400'
                  };
                  return (
                    <div key={log.id} className="border-b border-neutral-900 pb-1.5 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between text-[9px] text-neutral-500 font-bold mb-0.5">
                        <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                        <div className="flex gap-1 font-mono">
                          <span className={`${levelColors[log.level as keyof typeof levelColors]}`}>{log.level}</span>
                          <span>|</span>
                          <span className={`${catColors[log.category as keyof typeof catColors]}`}>{log.category}</span>
                        </div>
                      </div>
                      <div className="text-neutral-300 font-sans text-[10px] break-words leading-tight">{log.message}</div>
                      {log.details && (
                        <pre className="text-[8px] text-neutral-500 bg-black/40 p-1.5 rounded mt-1 overflow-x-auto whitespace-pre-wrap max-w-full font-mono">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
