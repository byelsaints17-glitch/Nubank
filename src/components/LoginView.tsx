import React, { useState, useEffect } from 'react';
import { ShieldCheck, UserCheck, Key, Plus, Landmark, Eye, EyeOff, Sparkles, HelpCircle } from 'lucide-react';
import { BankUser } from '../types';

interface LoginViewProps {
  usersDatabase: BankUser[];
  onLoginSuccess: (user: BankUser) => void;
  onRegisterUser: (newUser: BankUser) => void;
}

export default function LoginView({ usersDatabase, onLoginSuccess, onRegisterUser }: LoginViewProps) {
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [matchedUser, setMatchedUser] = useState<BankUser | null>(null);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);

  // New user registration fields
  const [newName, setNewName] = useState('');
  const [newAgency, setNewAgency] = useState('0001');
  const [newAccount, setNewAccount] = useState('');
  const [newBalance, setNewBalance] = useState('5000.00');
  const [newPassword, setNewPassword] = useState('');
  const [newTxPassword, setNewTxPassword] = useState('');

  // Auto-format CPF (111.222.333-44)
  const formatCpf = (value: string) => {
    const raw = value.replace(/\D/g, '');
    if (raw.length <= 3) return raw;
    if (raw.length <= 6) return `${raw.slice(0, 3)}.${raw.slice(3)}`;
    if (raw.length <= 9) return `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6)}`;
    return `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6, 9)}-${raw.slice(9, 11)}`;
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCpf(e.target.value);
    setCpf(formatted);
  };

  // Look up CPF in the database in real-time
  useEffect(() => {
    const cleanedCpf = cpf.trim();
    const found = usersDatabase.find(u => u.cpf === cleanedCpf);
    if (found) {
      setMatchedUser(found);
      setIsRegisterMode(false);
      // Auto pre-fill some registration fields if they switch back and forth
    } else {
      setMatchedUser(null);
    }
  }, [cpf, usersDatabase]);

  // Pre-fill fields with realistic defaults for registration
  useEffect(() => {
    if (cpf.length === 14 && !matchedUser && !isRegisterMode) {
      // Suggest registration
      const randomAcc = Math.floor(10000000 + Math.random() * 90000000) + '-' + Math.floor(Math.random() * 9);
      setNewAccount(randomAcc);
      setNewPassword(Math.floor(1000 + Math.random() * 9000).toString());
      setNewTxPassword(Math.floor(1000 + Math.random() * 9000).toString());
    }
  }, [cpf, matchedUser]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchedUser) return;

    if (password === matchedUser.password) {
      onLoginSuccess(matchedUser);
    } else {
      alert('Senha incorreta! Para fins de teste, use a senha informada no painel abaixo.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      alert('Por favor, informe o nome completo do usuário.');
      return;
    }

    const newUser: BankUser = {
      name: newName.trim(),
      cpf: cpf,
      agency: newAgency || '0001',
      accountNumber: newAccount || '1234567-8',
      bankName: 'Nu Pagamentos S.A.',
      balance: parseFloat(newBalance) || 0,
      creditCardInvoice: 0,
      creditCardLimit: 5000,
      password: newPassword || '1234',
      transactionPassword: newTxPassword || '1234'
    };

    onRegisterUser(newUser);
    onLoginSuccess(newUser);
  };

  const handleAutoFillCpf = (targetCpf: string) => {
    setCpf(targetCpf);
  };

  return (
    <div className="flex-1 flex flex-col bg-white text-neutral-800 p-6 min-h-[650px] justify-between">
      
      {/* Top logo & info */}
      <div className="flex flex-col items-center text-center pt-8 gap-3">
        <div className="w-14 h-14 rounded-full bg-[#830AD1] flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-[#830AD1]/20">
          nu
        </div>
        <div className="flex flex-col gap-1 mt-2">
          <h2 className="text-xl font-extrabold text-neutral-900 tracking-tight font-display">
            Acesse sua conta Nu
          </h2>
          <p className="text-xs text-neutral-500 font-medium max-w-[280px] mx-auto">
            Digite seu CPF para acessar sua conta oficial do Nubank.
          </p>
        </div>
      </div>

      {/* Main Login / Search Form */}
      <div className="my-6 flex-1 flex flex-col justify-center max-w-[340px] w-full mx-auto">
        {!isRegisterMode ? (
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            
            {/* CPF Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                CPF do Titular
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  maxLength={14}
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={handleCpfChange}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 focus:border-[#830AD1] focus:outline-none rounded-xl text-base font-bold text-neutral-900 transition-all placeholder:text-neutral-300"
                />
              </div>
            </div>

            {/* If user is IDENTIFIED by CPF */}
            {matchedUser && (
              <div className="bg-[#830AD1]/5 border border-[#830AD1]/15 rounded-2xl p-4 animate-scale-up flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#830AD1]/10 flex items-center justify-center text-[#830AD1]">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-[#830AD1] uppercase tracking-wider">Conta Localizada!</span>
                    <span className="text-sm font-extrabold text-neutral-900 leading-tight">
                      {matchedUser.name}
                    </span>
                  </div>
                </div>

                {/* Account details and Password (Onde fica conta e senha desse usuário) */}
                <div className="border-t border-neutral-200/50 pt-2.5 flex flex-col gap-1.5 text-xs text-neutral-600">
                  <div className="flex justify-between items-center bg-white/60 p-1.5 rounded-lg border border-neutral-100">
                    <span className="font-semibold text-neutral-500">Agência e Conta:</span>
                    <span className="font-bold text-neutral-800">
                      Ag. {matchedUser.agency} • Cc {matchedUser.accountNumber}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center bg-white/60 p-1.5 rounded-lg border border-neutral-100">
                    <span className="font-semibold text-neutral-500 flex items-center gap-1">
                      <Key className="w-3.5 h-3.5 text-[#830AD1]" />
                      Senha do App:
                    </span>
                    <span className="font-extrabold text-[#830AD1] bg-[#830AD1]/10 px-2 py-0.5 rounded-md font-mono text-sm">
                      {matchedUser.password}
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-white/60 p-1.5 rounded-lg border border-neutral-100">
                    <span className="font-semibold text-neutral-500 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Senha Pix (Transação):
                    </span>
                    <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-mono text-sm">
                      {matchedUser.transactionPassword}
                    </span>
                  </div>
                </div>

                {/* Password field to trigger Login */}
                <div className="flex flex-col gap-1.5 mt-1 border-t border-neutral-200/50 pt-3">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                    Confirmar Senha do App ({matchedUser.password})
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      maxLength={8}
                      placeholder="••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-4 pr-10 py-2 bg-white border border-neutral-200 focus:border-[#830AD1] focus:outline-none rounded-xl text-center font-bold text-lg font-mono text-neutral-900 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Convenient quick login option */}
                <button
                  type="button"
                  onClick={() => {
                    setPassword(matchedUser.password || '');
                    onLoginSuccess(matchedUser);
                  }}
                  className="w-full mt-1 py-1.5 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-[10px] font-bold text-neutral-600 transition-all uppercase tracking-wider"
                >
                  Entrar Direto (Ignorar Senha)
                </button>
              </div>
            )}

            {/* If NOT identified, and CPF length completed */}
            {cpf.length === 14 && !matchedUser && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 animate-scale-up flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider">Usuário Não Encontrado</span>
                  <p className="text-xs text-amber-700 font-medium">
                    Não encontramos nenhuma conta cadastrada para o CPF <span className="font-bold">{cpf}</span> no banco de dados.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNewName('');
                    setIsRegisterMode(true);
                  }}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-amber-600/10"
                >
                  <Plus className="w-4 h-4" />
                  Criar Nova Conta com Este CPF
                </button>
              </div>
            )}

            {/* Action buttons */}
            {matchedUser && (
              <button
                type="submit"
                className="w-full bg-[#830AD1] hover:bg-[#7209B7] text-white py-3 rounded-xl font-bold text-sm tracking-wide shadow-md active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                Acessar Conta
              </button>
            )}
          </form>
        ) : (
          /* Registration Subform */
          <form onSubmit={handleRegister} className="flex flex-col gap-3 bg-neutral-50 p-4 border border-neutral-200/50 rounded-2xl animate-scale-up">
            <div className="flex items-center gap-2 border-b border-neutral-200/50 pb-2 mb-1">
              <Landmark className="w-4 h-4 text-[#830AD1]" />
              <span className="text-xs font-bold text-neutral-800 uppercase tracking-wider">Criar Usuário no Nu</span>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-neutral-500 uppercase">CPF Escolhido</label>
              <input
                type="text"
                disabled
                value={cpf}
                className="px-3 py-1.5 bg-neutral-200 border border-neutral-300 rounded-lg text-neutral-600 font-bold font-mono text-xs cursor-not-allowed"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-neutral-500 uppercase">Nome Completo</label>
              <input
                type="text"
                required
                placeholder="Ex: Matheus Carvalho"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="px-3 py-1.5 bg-white border border-neutral-200 rounded-lg focus:border-[#830AD1] focus:outline-none text-xs font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 font-mono">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-sans font-bold text-neutral-500 uppercase">Agência</label>
                <input
                  type="text"
                  required
                  value={newAgency}
                  onChange={(e) => setNewAgency(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-neutral-200 rounded-lg focus:border-[#830AD1] focus:outline-none text-xs"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-sans font-bold text-neutral-500 uppercase">Conta</label>
                <input
                  type="text"
                  required
                  value={newAccount}
                  onChange={(e) => setNewAccount(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-neutral-200 rounded-lg focus:border-[#830AD1] focus:outline-none text-xs"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-neutral-500 uppercase">Saldo Inicial (R$)</label>
              <input
                type="number"
                required
                value={newBalance}
                onChange={(e) => setNewBalance(e.target.value)}
                className="px-3 py-1.5 bg-white border border-neutral-200 rounded-lg focus:border-[#830AD1] focus:outline-none text-xs font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-neutral-500 uppercase">Senha App</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-neutral-200 rounded-lg focus:border-[#830AD1] focus:outline-none text-xs text-center font-bold"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-neutral-500 uppercase">Senha Pix</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={newTxPassword}
                  onChange={(e) => setNewTxPassword(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-neutral-200 rounded-lg focus:border-[#830AD1] focus:outline-none text-xs text-center font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                type="button"
                onClick={() => setIsRegisterMode(false)}
                className="py-2.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-600 font-bold text-xs rounded-xl transition-all"
              >
                Voltar
              </button>
              <button
                type="submit"
                className="py-2.5 bg-[#830AD1] hover:bg-[#7209B7] text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-[#830AD1]/10"
              >
                Registrar e Acessar
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Collapsible Simulation Panel */}
      <div className="border-t border-neutral-100 pt-4 flex flex-col gap-3">
        {!showDemoAccounts ? (
          <button
            type="button"
            id="btn-toggle-demo"
            onClick={() => setShowDemoAccounts(true)}
            className="w-full py-2.5 bg-neutral-50 hover:bg-neutral-100/80 border border-neutral-200/60 rounded-xl text-xs font-bold text-neutral-500 hover:text-[#830AD1] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#830AD1] animate-pulse" />
            Clique aqui para ver contas de teste / demonstração
          </button>
        ) : (
          <div className="bg-neutral-50/50 border border-neutral-200/50 rounded-2xl p-4 animate-scale-up flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-[#830AD1] uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Contas para Simulação
              </span>
              <button
                type="button"
                onClick={() => setShowDemoAccounts(false)}
                className="text-[10px] text-neutral-400 hover:text-neutral-600 font-bold underline cursor-pointer"
              >
                Ocultar
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                id="btn-autofill-pedro"
                onClick={() => handleAutoFillCpf('110.542.545-24')}
                className={`px-3 py-2.5 rounded-xl text-left border flex items-center justify-between text-xs transition-all cursor-pointer ${
                  cpf === '110.542.545-24' 
                    ? 'bg-[#830AD1]/10 border-[#830AD1]/30 text-[#830AD1] font-bold shadow-sm' 
                    : 'bg-white hover:bg-neutral-50 border-neutral-200/80 text-neutral-600 shadow-xs'
                }`}
              >
                <div className="flex flex-col">
                  <span className="font-extrabold text-neutral-800">Pedro Gabriel (BB)</span>
                  <span className="text-[10px] text-neutral-400 font-mono">CPF: 110.542.545-24</span>
                </div>
                <span className="text-[10px] bg-[#830AD1]/5 px-2 py-0.5 rounded border border-[#830AD1]/10 font-mono text-[#830AD1] font-bold">
                  Senha: 1105
                </span>
              </button>

              <button
                type="button"
                id="btn-autofill-mariasidney"
                onClick={() => handleAutoFillCpf('006.443.695-07')}
                className={`px-3 py-2.5 rounded-xl text-left border flex items-center justify-between text-xs transition-all cursor-pointer ${
                  cpf === '006.443.695-07' 
                    ? 'bg-[#830AD1]/10 border-[#830AD1]/30 text-[#830AD1] font-bold shadow-sm' 
                    : 'bg-white hover:bg-neutral-50 border-neutral-200/80 text-neutral-600 shadow-xs'
                }`}
              >
                <div className="flex flex-col">
                  <span className="font-extrabold text-neutral-800">Maria Sidney (PagSeguro)</span>
                  <span className="text-[10px] text-neutral-400 font-mono">CPF: 006.443.695-07</span>
                </div>
                <span className="text-[10px] bg-[#830AD1]/5 px-2 py-0.5 rounded border border-[#830AD1]/10 font-mono text-[#830AD1] font-bold">
                  Senha: 0064
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
