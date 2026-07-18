import React, { useState, useEffect } from 'react';
import { ArrowRight, ChevronDown, UserCheck, Key, ShieldCheck, Landmark, Plus, HelpCircle, Sparkles } from 'lucide-react';
import { BankUser } from '../types';

interface LoginViewProps {
  usersDatabase: BankUser[];
  onLoginSuccess: (user: BankUser) => void;
  onRegisterUser: (newUser: BankUser) => void;
}

export default function LoginView({ usersDatabase, onLoginSuccess, onRegisterUser }: LoginViewProps) {
  const [showSplash, setShowSplash] = useState(true);
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
  const [newBalance, setNewBalance] = useState('1500.00');
  const [newPassword, setNewPassword] = useState('');
  const [newTxPassword, setNewTxPassword] = useState('');
  const [newBankName, setNewBankName] = useState('Nu Pagamentos S.A.');
  const [newCreditCardLimit, setNewCreditCardLimit] = useState('5000.00');
  const [newCreditCardInvoice, setNewCreditCardInvoice] = useState('0.00');

  // Recovery states
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [recoveryCpf, setRecoveryCpf] = useState('');
  const [recoveryCpfError, setRecoveryCpfError] = useState('');
  const [recoveryPhone, setRecoveryPhone] = useState('');
  const [recoveryStep, setRecoveryStep] = useState<'cpf' | 'phone' | 'sending' | 'code' | 'display'>('cpf');
  const [recoveryUser, setRecoveryUser] = useState<BankUser | null>(null);
  const [sentCode, setSentCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [recoveryPhoneError, setRecoveryPhoneError] = useState('');
  const [recoveryCodeError, setRecoveryCodeError] = useState('');

  const formatPhone = (val: string) => {
    const raw = val.replace(/\D/g, '');
    if (raw.length <= 2) return raw;
    if (raw.length <= 7) return `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
    return `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7, 11)}`;
  };

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
    } else {
      setMatchedUser(null);
    }
  }, [cpf, usersDatabase]);

  // Pre-fill realistic defaults for registration if user is creating a new one
  useEffect(() => {
    if (cpf.length === 14 && !matchedUser && !isRegisterMode) {
      const randomAcc = Math.floor(10000000 + Math.random() * 90000000) + '-' + Math.floor(Math.random() * 9);
      setNewAccount(randomAcc);
      setNewPassword(Math.floor(1000 + Math.random() * 9000).toString());
      setNewTxPassword(Math.floor(1000 + Math.random() * 9000).toString());
    }
  }, [cpf, matchedUser]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchedUser) return;

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf: matchedUser.cpf, password })
      });
      
      let success = false;
      let userResult = null;
      let message = '';
      
      if (response.ok) {
        try {
          const result = await response.json();
          success = result.success;
          userResult = result.user;
          message = result.message;
        } catch (jsonErr) {
          console.warn('Erro ao decodificar JSON de login do servidor:', jsonErr);
        }
      }
      
      if (success && userResult) {
        onLoginSuccess(userResult);
      } else {
        // Se a resposta do servidor disser especificamente "senha incorreta" com JSON válido, alertamos o usuário
        if (message && message.includes("incorreta")) {
          alert(message);
        } else {
          // Caso contrário (erro de rota, status 404, etc), faz o fallback para validação local da senha
          if (password === matchedUser.password) {
            onLoginSuccess(matchedUser);
          } else {
            alert('Senha incorreta! Para fins de teste, use a senha informada no painel ou clique em "Acesso Direto".');
          }
        }
      }
    } catch (err) {
      console.warn("Erro ao conectar com servidor de login, tentando autenticação local:", err);
      // Fallback local em caso de erro de conexão completo (ex: Vercel estático)
      if (password === matchedUser.password) {
        onLoginSuccess(matchedUser);
      } else {
        alert('Senha incorreta! Para fins de teste, use a senha informada no painel ou clique em "Acesso Direto".');
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      alert('Por favor, informe o nome completo do usuário.');
      return;
    }
    if (cpf.length < 14) {
      alert('Por favor, informe um CPF válido.');
      return;
    }

    const newUser: BankUser = {
      name: newName.trim(),
      cpf: cpf,
      agency: newAgency || '0001',
      accountNumber: newAccount || '1234567-8',
      bankName: newBankName || 'Nu Pagamentos S.A.',
      balance: parseFloat(newBalance) || 0,
      creditCardInvoice: parseFloat(newCreditCardInvoice) || 0,
      creditCardLimit: parseFloat(newCreditCardLimit) || 0,
      password: newPassword || '1234',
      transactionPassword: newTxPassword || '1234'
    };

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      
      let success = false;
      let message = '';
      
      if (response.ok) {
        try {
          const result = await response.json();
          success = result.success;
          message = result.message;
        } catch (jsonErr) {
          console.warn('Erro ao decodificar JSON do cadastro do servidor:', jsonErr);
        }
      }
      
      if (success) {
        onRegisterUser(newUser);
        onLoginSuccess(newUser);
      } else {
        // Fallback local: Se o servidor retornou erro mas a requisição ocorreu (ex: rota inexistente no Vercel estático),
        // registramos localmente para manter uma experiência de teste impecável.
        console.warn("Servidor de cadastro retornou erro ou não-JSON. Ativando fallback local.");
        onRegisterUser(newUser);
        onLoginSuccess(newUser);
      }
    } catch (err) {
      console.warn("Erro de conexão ao registrar no servidor. Usando fallback local:", err);
      // Fallback local completo para erros de conexão
      onRegisterUser(newUser);
      onLoginSuccess(newUser);
    }
  };

  const handleAutoFillCpf = (targetCpf: string, targetPass?: string) => {
    setCpf(targetCpf);
    if (targetPass) {
      setPassword(targetPass);
    }
    const found = usersDatabase.find(u => u.cpf === targetCpf);
    if (found) {
      setMatchedUser(found);
    }
  };

  // Eyelashes Custom Icons (Matching the eyelash image 2 exactly!)
  const renderEyelashIcon = () => {
    if (!showPassword) {
      // Closed lashes
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" className="text-neutral-500">
          <path d="M3 10a13.4 13.4 0 0 0 18 0" />
          <path d="m5 11-1.5 2.5" />
          <path d="m19 11 1.5 2.5" />
          <path d="m9 14.5-1 3" />
          <path d="m15 14.5 1 3" />
          <path d="m12 15.5v3.5" />
        </svg>
      );
    } else {
      // Open eye with eyelashes
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" className="text-neutral-900">
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    }
  };

  // Render Onboarding Splash Screen (Image 1)
  if (showSplash) {
    return (
      <div className="flex-1 flex flex-col bg-white text-neutral-900 justify-between p-6 select-none animate-fade-in relative overflow-hidden min-h-[660px]">
        {/* Top bar with logo and country selector */}
        <div className="flex items-center justify-between w-full pt-4">
          <div className="text-neutral-900 font-extrabold text-3xl font-display tracking-tight">
            pg<span className="text-neutral-500 font-normal">bank</span>
          </div>
          <button className="flex items-center gap-1 bg-neutral-100 text-neutral-800 text-[11px] font-bold px-3 py-1.5 rounded-full hover:bg-neutral-200 transition-colors">
            Brasil <ChevronDown className="w-3.5 h-3.5 text-neutral-600" />
          </button>
        </div>

        {/* Diagonal Cards Fan Mockup - matching Image 1 exactly! */}
        <div className="relative w-full h-[280px] flex items-center justify-center my-6">
          <div className="relative w-full max-w-[260px] h-full">
            {/* Bottom Card - Silver/Grey Business Card */}
            <div className="absolute top-[110px] left-[55px] w-[170px] h-[105px] rounded-xl bg-gradient-to-br from-neutral-200 to-neutral-300 shadow-[2px_10px_20px_rgba(0,0,0,0.1)] border border-neutral-100/30 transform rotate-[18deg] translate-x-12 translate-y-6 flex flex-col justify-between p-3.5">
              <span className="text-neutral-800 font-extrabold text-lg font-display">pg</span>
              <span className="text-neutral-500 font-bold text-[10px] self-end uppercase tracking-wider font-display">business</span>
            </div>

            {/* Middle Card - Medium Grey */}
            <div className="absolute top-[50px] left-[25px] w-[170px] h-[105px] rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-950 shadow-[2px_8px_18px_rgba(0,0,0,0.15)] transform rotate-[1deg] translate-x-4 translate-y-3 flex flex-col justify-between p-3.5">
              <span className="text-white font-extrabold text-lg font-display">pg</span>
            </div>

            {/* Top Card - Classic Vibrant White/Silver Card */}
            <div className="absolute top-[0px] left-[0px] w-[170px] h-[105px] rounded-xl bg-gradient-to-br from-white via-neutral-50 to-neutral-200 shadow-[4px_12px_24px_rgba(0,0,0,0.15)] border border-neutral-300 transform rotate-[-16deg] -translate-x-2 -translate-y-2 flex flex-col justify-between p-3.5">
              <div className="flex items-start justify-between">
                <span className="text-neutral-800 font-extrabold text-lg font-display">pg</span>
                <span className="text-neutral-600 text-[7px] font-bold bg-neutral-100 px-1 rounded border border-neutral-300">Brasil</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content text */}
        <div className="flex flex-col gap-5 text-left mb-6">
          <h2 className="text-[32px] font-bold text-neutral-900 leading-[1.1] tracking-tight font-display max-w-[280px]">
            Um mundo financeiro sem complexidades
          </h2>
        </div>

        {/* Primary Bottom Button */}
        <div className="w-full pb-4">
          <button
            onClick={() => setShowSplash(false)}
            className="w-full bg-neutral-900 hover:bg-neutral-800 text-white py-4 rounded-full font-bold text-sm tracking-wide active:scale-[0.98] transition-all cursor-pointer shadow-md shadow-neutral-900/15"
          >
            Começar
          </button>
        </div>
      </div>
    );
  }

  // Render Login Input Screen (Image 2)
  if (isRecoveryMode) {
    return (
      <div className="flex-1 flex flex-col bg-white text-neutral-900 p-6 min-h-[660px] justify-between select-none animate-fade-in">
        {/* Top row with Brand Logo */}
        <div className="flex items-center justify-between w-full pt-4">
          <div className="text-neutral-900 font-extrabold text-3xl font-display tracking-tight">
            pg<span className="text-neutral-500 font-normal">bank</span>
          </div>
          <button 
            type="button"
            onClick={() => setIsRecoveryMode(false)}
            className="text-xs text-neutral-900 hover:text-neutral-700 font-bold cursor-pointer"
          >
            Voltar ao login
          </button>
        </div>

        {/* Main Form Area */}
        <div className="my-auto flex-1 flex flex-col justify-center max-w-[340px] w-full mx-auto py-6">
          <h2 className="text-2xl font-bold text-neutral-900 tracking-tight font-display mb-2">
            Esqueci minha senha
          </h2>
          <p className="text-xs text-neutral-500 mb-6 font-medium">
            Recuperação de conta para <span className="font-bold text-neutral-900">{recoveryUser?.name || matchedUser?.name || 'Cliente'}</span>
          </p>

          {recoveryStep === 'cpf' && (
            <div className="flex flex-col gap-6 animate-scale-up">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-neutral-500">
                  Informe seu CPF
                </label>
                <input
                  type="text"
                  maxLength={14}
                  placeholder="000.000.000-00"
                  value={recoveryCpf}
                  onChange={(e) => {
                    setRecoveryCpf(formatCpf(e.target.value));
                    setRecoveryCpfError('');
                  }}
                  className="w-full py-2 border-b-2 border-neutral-200 focus:border-neutral-900 focus:outline-none text-base font-bold text-neutral-900 transition-all placeholder:text-neutral-300"
                />
                {recoveryCpfError && (
                  <span className="text-xs text-rose-500 font-semibold">{recoveryCpfError}</span>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  const cleanedCpf = recoveryCpf.trim();
                  const found = usersDatabase.find(u => u.cpf === cleanedCpf);
                  if (found) {
                    setRecoveryUser(found);
                    setRecoveryStep('phone');
                  } else {
                    setRecoveryCpfError('Este CPF não foi encontrado em nosso banco de dados. Digite um CPF válido.');
                  }
                }}
                className="w-full bg-neutral-900 hover:bg-neutral-800 text-white py-3.5 rounded-full font-bold text-sm tracking-wide shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Buscar Conta
              </button>
            </div>
          )}

          {recoveryStep === 'phone' && (
            <div className="flex flex-col gap-6 animate-scale-up">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-neutral-500">
                  Número de Celular cadastrado
                </label>
                <input
                  type="text"
                  maxLength={15}
                  placeholder="(00) 00000-0000"
                  value={recoveryPhone}
                  onChange={(e) => {
                    setRecoveryPhone(formatPhone(e.target.value));
                    setRecoveryPhoneError('');
                  }}
                  className="w-full py-2 border-b-2 border-neutral-200 focus:border-neutral-900 focus:outline-none text-base font-bold text-neutral-900 transition-all placeholder:text-neutral-300"
                />
                {recoveryPhoneError && (
                  <span className="text-xs text-rose-500 font-semibold">{recoveryPhoneError}</span>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  const clean = recoveryPhone.replace(/\D/g, '');
                  if (clean.length < 10) {
                    setRecoveryPhoneError('Por favor, informe um número de celular válido com DDD.');
                    return;
                  }
                  setRecoveryStep('sending');
                  const code = Math.floor(1000 + Math.random() * 9000).toString();
                  setSentCode(code);
                  
                  setTimeout(() => {
                    setRecoveryStep('code');
                  }, 1500);
                }}
                className="w-full bg-neutral-900 hover:bg-neutral-800 text-white py-3.5 rounded-full font-bold text-sm tracking-wide shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Receber Código de Recuperação por SMS
              </button>
            </div>
          )}

          {recoveryStep === 'sending' && (
            <div className="flex flex-col items-center justify-center py-8 gap-4 animate-scale-up">
              <div className="w-12 h-12 border-4 border-t-neutral-900 border-neutral-100 rounded-full animate-spin"></div>
              <p className="text-sm font-bold text-neutral-600">Enviando código por SMS...</p>
            </div>
          )}

          {recoveryStep === 'code' && (
            <div className="flex flex-col gap-6 animate-scale-up">
              {/* Test helper banner */}
              <div className="bg-neutral-50 border border-neutral-200 p-4 rounded-2xl flex flex-col gap-1.5 text-xs">
                <span className="font-bold text-neutral-900 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> SMS Recebido com Sucesso!
                </span>
                <p className="text-neutral-600 leading-normal">
                  Código de segurança de teste enviado para <span className="font-bold text-neutral-800">{recoveryPhone}</span>:
                </p>
                <span className="text-xl font-mono font-bold text-neutral-900 bg-white border border-neutral-250 rounded-lg py-1 px-4 self-start mt-0.5 shadow-sm">
                  {sentCode}
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-neutral-500">
                  Código de Verificação de 4 dígitos
                </label>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="0000"
                  value={enteredCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setEnteredCode(val);
                    setRecoveryCodeError('');
                    if (val === sentCode) {
                      setRecoveryStep('display');
                    }
                  }}
                  className="w-full py-2 border-b-2 border-neutral-200 focus:border-neutral-900 focus:outline-none text-xl font-bold font-mono tracking-[0.5em] text-center text-neutral-900 transition-all placeholder:text-neutral-300 placeholder:tracking-normal"
                />
                {recoveryCodeError && (
                  <span className="text-xs text-rose-500 font-semibold">{recoveryCodeError}</span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (enteredCode === sentCode) {
                      setRecoveryStep('display');
                    } else {
                      setRecoveryCodeError('Código incorreto! Digite o código de teste acima.');
                    }
                  }}
                  className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white py-3.5 rounded-full font-bold text-sm tracking-wide cursor-pointer"
                >
                  Confirmar Código
                </button>
              </div>
            </div>
          )}

          {recoveryStep === 'display' && (
            <div className="flex flex-col gap-6 animate-scale-up">
              <div className="bg-emerald-50 border border-emerald-100 p-4.5 rounded-2xl flex flex-col gap-3">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" /> Identidade Confirmada!
                </span>
                <p className="text-xs text-emerald-700 font-medium">
                  Seu celular foi verificado. Veja as suas credenciais abaixo para acessar o aplicativo:
                </p>
                
                <div className="border-t border-emerald-100/50 pt-3 flex flex-col gap-2.5 text-xs text-neutral-700">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-neutral-500">Senha do App:</span>
                    <span className="font-bold text-neutral-900 bg-white border border-neutral-200 px-2.5 py-1 rounded font-mono text-sm shadow-sm">
                      {recoveryUser?.password || matchedUser?.password}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-neutral-500">Senha do Pix (4 dígitos):</span>
                    <span className="font-bold text-neutral-900 bg-white border border-neutral-200 px-2.5 py-1 rounded font-mono text-sm shadow-sm">
                      {recoveryUser?.transactionPassword || matchedUser?.transactionPassword}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const targetUser = recoveryUser || matchedUser;
                  if (targetUser) {
                    setCpf(targetUser.cpf);
                    setPassword(targetUser.password); // Autofill
                  }
                  setIsRecoveryMode(false);
                }}
                className="w-full bg-neutral-900 hover:bg-neutral-800 text-white py-3.5 rounded-full font-bold text-sm cursor-pointer shadow-md shadow-neutral-900/15"
              >
                Voltar e Entrar
              </button>
            </div>
          )}
        </div>

        <div></div> {/* Spacer */}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white text-neutral-900 p-6 min-h-[660px] justify-between select-none animate-fade-in">
      
      {/* Top row with Brand Logo */}
      <div className="flex items-center justify-between w-full pt-4">
        <div className="text-neutral-900 font-extrabold text-3xl font-display tracking-tight">
          pg<span className="text-neutral-500 font-normal">bank</span>
        </div>
        <button 
          onClick={() => setShowSplash(true)}
          className="text-xs text-neutral-400 hover:text-neutral-600 font-bold"
        >
          Voltar
        </button>
      </div>

      {/* Main Acesse sua conta form */}
      <div className="my-auto flex-1 flex flex-col justify-center max-w-[340px] w-full mx-auto py-6">
        <h2 className="text-2xl font-bold text-neutral-900 tracking-tight font-display mb-8">
          Acesse sua conta
        </h2>

        {!isRegisterMode ? (
          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            
            {/* CPF Input Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-neutral-500">
                CPF
              </label>
              <input
                type="text"
                maxLength={14}
                placeholder="000.000.000-00"
                value={cpf}
                onChange={handleCpfChange}
                className="w-full py-2 border-b-2 border-neutral-200 focus:border-neutral-900 focus:outline-none text-base font-bold text-neutral-900 transition-all placeholder:text-neutral-300"
              />
              {!matchedUser && (
                <div className="flex justify-end mt-1 text-[11px] font-medium">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRecoveryMode(true);
                      setRecoveryStep('cpf');
                      setRecoveryCpf(cpf);
                      setRecoveryCpfError('');
                      setRecoveryPhone('');
                      setEnteredCode('');
                      setRecoveryPhoneError('');
                      setRecoveryCodeError('');
                    }}
                    className="text-neutral-900 hover:text-neutral-700 font-bold hover:underline cursor-pointer"
                  >
                    Esqueci minha senha
                  </button>
                </div>
              )}
            </div>

            {/* Identified User State & Password Field */}
            {matchedUser && (
              <div className="flex flex-col gap-5 animate-scale-up border-t border-neutral-100 pt-5">
                {/* Account info card */}
                <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6.5 h-6.5 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-800">
                      <UserCheck className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-neutral-800 uppercase tracking-wider">Identificado</span>
                      <span className="text-sm font-bold text-neutral-900 leading-tight">
                        {matchedUser.name}
                      </span>
                    </div>
                  </div>

                  {/* Password helper indicators (For the operator) */}
                  <div className="border-t border-neutral-200/50 pt-2.5 flex flex-col gap-1.5 text-xs text-neutral-600">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-neutral-400">Dados Bancários:</span>
                      <span className="font-bold text-neutral-700">
                        Ag. {matchedUser.agency} • Cc {matchedUser.accountNumber}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-neutral-400 flex items-center gap-1">
                        <Key className="w-3 h-3 text-neutral-850" />
                        Senha do App:
                      </span>
                      <span className="font-bold text-neutral-900 bg-neutral-200 px-2 py-0.5 rounded font-mono text-sm">
                        {matchedUser.password}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-neutral-400 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        Senha Pix:
                      </span>
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono text-sm">
                        {matchedUser.transactionPassword}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Password field with eyelash design */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-neutral-500">
                    Senha
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      maxLength={8}
                      placeholder="Senha do app"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full py-2 pr-12 border-b-2 border-neutral-200 focus:border-neutral-900 focus:outline-none text-base font-bold font-mono text-neutral-900 tracking-wider transition-all placeholder:text-neutral-300 placeholder:font-sans placeholder:tracking-normal"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-1 p-2 rounded-full hover:bg-neutral-50 text-neutral-400 hover:text-neutral-600 transition-all cursor-pointer"
                    >
                      {renderEyelashIcon()}
                    </button>
                  </div>
                  <div className="flex justify-between items-center mt-1 text-[11px] font-medium">
                    <span className="text-neutral-400">
                      Possui 8 caracteres ou mais
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsRecoveryMode(true);
                        setRecoveryStep('cpf');
                        setRecoveryCpf(cpf);
                        setRecoveryCpfError('');
                        setRecoveryPhone('');
                        setEnteredCode('');
                        setRecoveryPhoneError('');
                        setRecoveryCodeError('');
                      }}
                      className="text-neutral-900 hover:text-neutral-700 font-bold hover:underline cursor-pointer"
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Unrecognized CPF Handler */}
            {cpf.length === 14 && !matchedUser && (
              <div className="bg-amber-50/70 border border-amber-200/50 rounded-2xl p-4 animate-scale-up flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Novo CPF Identificado</span>
                  <p className="text-xs text-amber-700 font-medium leading-relaxed">
                    Este CPF não está no banco local. Vamos criar uma nova conta personalizada?
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNewName('');
                    setIsRegisterMode(true);
                  }}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs tracking-wide rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Criar Conta com Este CPF
                </button>
              </div>
            )}

            {/* Bottom Form Action Button */}
            {matchedUser && (
              <button
                type="submit"
                className="w-full bg-neutral-900 hover:bg-neutral-800 text-white py-4 rounded-full font-bold text-sm tracking-wide shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                Continuar
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            )}

            {!matchedUser && (
              <div className="flex flex-col gap-2 mt-4">
                <div className="text-center text-[10px] font-bold text-neutral-400 uppercase tracking-wider my-1">Ainda não tem conta?</div>
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(true);
                    setNewName('');
                    const randomAcc = Math.floor(10000000 + Math.random() * 90000000) + '-' + Math.floor(Math.random() * 9);
                    setNewAccount(randomAcc);
                    setNewPassword(Math.floor(1000 + Math.random() * 9000).toString());
                    setNewTxPassword(Math.floor(1000 + Math.random() * 9000).toString());
                    setNewBankName('PG Pagamentos S.A.');
                    setNewCreditCardLimit('5000.00');
                    setNewCreditCardInvoice('0.00');
                    setNewBalance('1500.00');
                  }}
                  className="w-full bg-white hover:bg-neutral-50 border border-neutral-350 text-neutral-750 py-3.5 rounded-full font-bold text-xs tracking-wide active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4 text-neutral-900" />
                  Criar Conta Corrente Grátis
                </button>
              </div>
            )}
          </form>
        ) : (
          /* High-Fidelity Registration Form */
          <form onSubmit={handleRegister} className="flex flex-col gap-3.5 bg-neutral-50/50 p-4 border border-neutral-200/60 rounded-2xl animate-scale-up max-h-[500px] overflow-y-auto">
            <div className="flex items-center gap-2 border-b border-neutral-200/50 pb-2 mb-0.5 sticky top-0 bg-neutral-50/95 backdrop-blur-xs z-10">
              <Landmark className="w-4 h-4 text-neutral-900" />
              <span className="text-xs font-bold text-neutral-800 uppercase tracking-wider">Criar Nova Conta Corrente</span>
            </div>

            {/* SEÇÃO 1: DADOS PESSOAIS */}
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-bold text-neutral-700 uppercase tracking-wider">1. Dados Pessoais</span>
              <div className="grid grid-cols-1 gap-2.5">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase">Nome Completo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Pedro Gabriel Silva"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="px-3 py-2 bg-white border border-neutral-200 rounded-xl focus:border-neutral-900 focus:outline-none text-xs font-bold text-neutral-950"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase">CPF</label>
                  <input
                    type="text"
                    required
                    maxLength={14}
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(formatCpf(e.target.value))}
                    className="px-3 py-2 bg-white border border-neutral-200 rounded-xl focus:border-neutral-900 focus:outline-none text-xs font-bold font-mono text-neutral-950"
                  />
                </div>
              </div>
            </div>

            {/* SEÇÃO 2: DADOS BANCÁRIOS */}
            <div className="flex flex-col gap-2 border-t border-neutral-200/50 pt-2.5">
              <span className="text-[9px] font-bold text-neutral-700 uppercase tracking-wider">2. Dados da Conta</span>
              
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-neutral-500 uppercase">Instituição Bancária</label>
                <select
                  value={newBankName}
                  onChange={(e) => setNewBankName(e.target.value)}
                  className="px-3 py-2 bg-white border border-neutral-200 rounded-xl focus:border-neutral-900 focus:outline-none text-xs font-bold text-neutral-800"
                >
                  <option value="PG Pagamentos S.A.">PG Pagamentos S.A. (PGBANK)</option>
                  <option value="Banco Bradesco S.A.">Banco Bradesco S.A.</option>
                  <option value="Itaú Unibanco S.A.">Itaú Unibanco S.A.</option>
                  <option value="Banco do Brasil S.A.">Banco do Brasil S.A.</option>
                  <option value="Caixa Econômica Federal">Caixa Econômica Federal</option>
                  <option value="Banco Santander (Brasil) S.A.">Banco Santander</option>
                  <option value="Banco Inter S.A.">Banco Inter S.A.</option>
                  <option value="C6 Bank S.A.">C6 Bank S.A.</option>
                  <option value="PagSeguro Internet S.A.">PagSeguro S.A.</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-sans font-bold text-neutral-500 uppercase">Agência</label>
                  <input
                    type="text"
                    required
                    value={newAgency}
                    onChange={(e) => setNewAgency(e.target.value)}
                    className="px-3 py-2 bg-white border border-neutral-200 rounded-xl focus:border-neutral-900 focus:outline-none text-xs text-neutral-950 font-bold"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-sans font-bold text-neutral-500 uppercase">Nº da Conta</label>
                  <input
                    type="text"
                    required
                    value={newAccount}
                    onChange={(e) => setNewAccount(e.target.value)}
                    className="px-3 py-2 bg-white border border-neutral-200 rounded-xl focus:border-neutral-900 focus:outline-none text-xs text-neutral-950 font-bold"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-neutral-500 uppercase">Saldo Inicial da Conta (R$)</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={newBalance}
                  onChange={(e) => setNewBalance(e.target.value)}
                  className="px-3 py-2 bg-white border border-neutral-200 rounded-xl focus:border-neutral-900 focus:outline-none text-xs font-bold text-neutral-950"
                />
              </div>
            </div>

            {/* SEÇÃO 3: CARTÃO DE CRÉDITO */}
            <div className="flex flex-col gap-2 border-t border-neutral-200/50 pt-2.5">
              <span className="text-[9px] font-bold text-neutral-700 uppercase tracking-wider">3. Cartão de Crédito</span>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase">Limite (R$)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={newCreditCardLimit}
                    onChange={(e) => setNewCreditCardLimit(e.target.value)}
                    className="px-3 py-2 bg-white border border-neutral-200 rounded-xl focus:border-neutral-900 focus:outline-none text-xs font-bold text-neutral-950"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase">Fatura Inicial (R$)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={newCreditCardInvoice}
                    onChange={(e) => setNewCreditCardInvoice(e.target.value)}
                    className="px-3 py-2 bg-white border border-neutral-200 rounded-xl focus:border-neutral-900 focus:outline-none text-xs font-bold text-neutral-950"
                  />
                </div>
              </div>
            </div>

            {/* SEÇÃO 4: SEGURANÇA */}
            <div className="flex flex-col gap-2 border-t border-neutral-200/50 pt-2.5">
              <span className="text-[9px] font-bold text-neutral-700 uppercase tracking-wider">4. Segurança e Senhas</span>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase">Senha App (Login)</label>
                  <input
                    type="text"
                    maxLength={8}
                    required
                    placeholder="Ex: 1105"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="px-3 py-2 bg-white border border-neutral-200 rounded-xl focus:border-neutral-900 focus:outline-none text-xs text-center font-bold font-mono text-neutral-950"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase">Senha Pix (4 dígitos)</label>
                  <input
                    type="text"
                    maxLength={4}
                    required
                    placeholder="Ex: 5424"
                    value={newTxPassword}
                    onChange={(e) => setNewTxPassword(e.target.value)}
                    className="px-3 py-2 bg-white border border-neutral-200 rounded-xl focus:border-neutral-900 focus:outline-none text-xs text-center font-bold font-mono text-neutral-950"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3.5 pt-2.5 border-t border-neutral-200/50 sticky bottom-0 bg-neutral-50/95 backdrop-blur-xs z-10">
              <button
                type="button"
                onClick={() => setIsRegisterMode(false)}
                className="py-3 bg-neutral-200 hover:bg-neutral-300 text-neutral-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="py-3 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-neutral-900/10 cursor-pointer"
              >
                Salvar Conta Corrente
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Subtle Demo Accounts Portal Drawer Link (Keeps it beautiful while fully functional) */}
      <div className="border-t border-neutral-150 pt-4 flex flex-col gap-2.5">
        {!showDemoAccounts ? (
          <button
            type="button"
            onClick={() => setShowDemoAccounts(true)}
            className="w-full py-2 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/50 rounded-xl text-[11px] font-bold text-neutral-500 hover:text-neutral-900 transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-neutral-900 animate-pulse" />
            Contas de teste (Clique para preencher)
          </button>
        ) : (
          <div className="bg-neutral-50 border border-neutral-200/50 rounded-2xl p-4 animate-scale-up flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1">
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
              {usersDatabase.slice(0, 3).map((u) => (
                <button
                  key={u.cpf}
                  type="button"
                  onClick={() => handleAutoFillCpf(u.cpf, u.password)}
                  className={`px-3 py-2 rounded-xl text-left border flex items-center justify-between text-xs transition-all cursor-pointer ${
                    cpf === u.cpf 
                      ? 'bg-neutral-150 border-neutral-300 text-neutral-900 font-bold' 
                      : 'bg-white hover:bg-neutral-50 border-neutral-200/70 text-neutral-600'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-neutral-800 text-[11px]">{u.name.split(' ').slice(0, 2).join(' ')}</span>
                    <span className="text-[9px] text-neutral-400 font-mono">CPF: {u.cpf}</span>
                  </div>
                  <div className="text-[9px] bg-neutral-105 border border-neutral-200 px-2 py-0.5 rounded font-mono text-neutral-800 font-bold">
                    Senha: {u.password}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
