import React, { useState, useEffect } from 'react';
import { Smartphone, Edit3, Sparkles, Landmark, Plus, ArrowUpRight, Check } from 'lucide-react';
import PhoneShell from './components/PhoneShell';
import HomeView from './components/HomeView';
import AccountDetailsView from './components/AccountDetailsView';
import CreditCardView from './components/CreditCardView';
import MakePixView from './components/MakePixView';
import ReceiptView from './components/ReceiptView';
import ControlPanel from './components/ControlPanel';
import LoginView from './components/LoginView';
import { BankUser, BankRecipient, TransactionDetails, StatementItem } from './types';

// Initial prefilled presets to ensure instantaneous tactile onboarding
const PRESET_RECEIPT: { user: BankUser; recipient: BankRecipient; tx: TransactionDetails; history: StatementItem[] } = {
  user: {
    name: 'PEDRO GABRIEL DOS SANTOS SILVA',
    cpf: '110.542.545-24',
    agency: '0001',
    accountNumber: '11054254-5',
    bankName: 'NU PAGAMENTOS - IP',
    balance: 15420.00,
    creditCardInvoice: 1105.42,
    creditCardLimit: 12000.00,
    password: '1105',
    transactionPassword: '5424'
  },
  recipient: {
    name: 'JULIANA MELO MELO',
    cpf: '123.443.695-00',
    bankName: 'PAGSEGURO INTERNET S.A.',
    agency: '0001',
    accountNumber: '1234567-8',
    pixKey: '***.443.695-**'
  },
  tx: {
    amount: 150.00,
    type: 'Pix',
    date: '07 DE JUL DE 2026',
    time: '17:36:11',
    transactionId: 'E3068082920260707243334TX'
  },
  history: [
    {
      id: 'h1',
      title: 'Pix enviado',
      description: 'Transferência Pix enviada',
      amount: 150.00,
      date: '2026-07-07',
      time: '17:36:11',
      type: 'Pix',
      incoming: false,
      recipientName: 'JULIANA MELO MELO'
    },
    {
      id: 'h2',
      title: 'Função débito ativada',
      description: 'Agora você pode fazer compras no débito',
      amount: 0.00,
      date: '2026-05-10',
      time: '09:12:00',
      type: 'Depósito',
      incoming: true,
      senderName: 'Nubank'
    }
  ]
};

const PRESET_GABRIELA: { user: BankUser; recipient: BankRecipient; tx: TransactionDetails; history: StatementItem[] } = {
  user: {
    name: 'Gabriela M Lima',
    cpf: '888.777.666-55',
    agency: '0001',
    accountNumber: '9827-1',
    bankName: 'Nu Pagamentos S.A.',
    balance: 1357.97,
    creditCardInvoice: 1224.50,
    creditCardLimit: 8500.00,
    password: '8887',
    transactionPassword: '6665'
  },
  recipient: {
    name: 'byel saints',
    cpf: '123.456.789-00',
    bankName: 'C6 Bank S.A.',
    agency: '0001',
    accountNumber: '57262657-9',
    pixKey: 'byel@c6bank.com.br'
  },
  tx: {
    amount: 150.00,
    type: 'Pix',
    date: '07 JUL 2026',
    time: '12:43:00',
    transactionId: 'E3068082920260707124300BS9128X'
  },
  history: [
    {
      id: 'g1',
      title: 'Transferência recebida',
      description: 'Pix recebido de C6 Bank',
      amount: 1357.97,
      date: '2026-07-06',
      time: '11:15:20',
      type: 'Depósito',
      incoming: true,
      senderName: 'Pedro Alvares Cabral'
    },
    {
      id: 'g2',
      title: 'Caixinhas guardado',
      description: 'Dinheiro aplicado na caixinha',
      amount: 100.00,
      date: '2026-07-05',
      time: '14:20:00',
      type: 'Transferência',
      incoming: false,
      recipientName: 'Minhas Metas'
    }
  ]
};

const PRESET_CLEAN: { user: BankUser; recipient: BankRecipient; tx: TransactionDetails; history: StatementItem[] } = {
  user: {
    name: 'Usuário Nu',
    cpf: '000.000.000-00',
    agency: '0001',
    accountNumber: '1111111-1',
    bankName: 'Nu Pagamentos S.A.',
    balance: 0.00,
    creditCardInvoice: 0.00,
    creditCardLimit: 1000.00,
    password: '1234',
    transactionPassword: '1234'
  },
  recipient: {
    name: 'Destinatário',
    cpf: '000.000.000-00',
    bankName: 'Banco do Brasil S.A.',
    agency: '0001',
    accountNumber: '2222222-2',
    pixKey: 'contato@email.com'
  },
  tx: {
    amount: 100.00,
    type: 'Pix',
    date: '07 JUL 2026',
    time: '12:43:00',
    transactionId: 'E30680829000000000000000000000'
  },
  history: []
};

// Initial state for simulated multi-user database
const INITIAL_USERS: BankUser[] = [
  {
    name: 'PEDRO GABRIEL DOS SANTOS SILVA',
    cpf: '110.542.545-24',
    agency: '0001',
    accountNumber: '11054254-5',
    bankName: 'Banco do Brasil S.A.',
    balance: 15420.00,
    creditCardInvoice: 1105.42,
    creditCardLimit: 12000.00,
    password: '1105',
    transactionPassword: '5424'
  },
  {
    name: 'MARIA SIDNEY FERREIRA DOS SANTOS MARTINS',
    cpf: '006.443.695-07',
    agency: '0001',
    accountNumber: '1234567-8',
    bankName: 'PagSeguro Internet S.A.',
    balance: 4500.00,
    creditCardInvoice: 150.00,
    creditCardLimit: 5000.00,
    password: '0064',
    transactionPassword: '6950'
  },
  {
    name: 'FRANCISCO MANOEL DA SILVA',
    cpf: '000.965.814-00',
    agency: '0001',
    accountNumber: '98844089-7',
    bankName: 'Banco Bradesco S.A.',
    balance: 850.00,
    creditCardInvoice: 100.00,
    creditCardLimit: 3000.00,
    password: '1234',
    transactionPassword: '1234'
  },
  {
    name: 'Nathan Henrique Alves Ferreira',
    cpf: '234.567.890-12',
    agency: '0001',
    accountNumber: '48708843-1',
    bankName: 'Nu Pagamentos S.A.',
    balance: 2160.00,
    creditCardInvoice: 1224.50,
    creditCardLimit: 8500.00,
    password: '2345',
    transactionPassword: '8901'
  },
  {
    name: 'Gabriela M Lima',
    cpf: '888.777.666-55',
    agency: '0001',
    accountNumber: '9827-1',
    bankName: 'Nu Pagamentos S.A.',
    balance: 1357.97,
    creditCardInvoice: 1224.50,
    creditCardLimit: 8500.00,
    password: '8887',
    transactionPassword: '6665'
  }
];

export default function App() {
  // Database of users that can be identified by CPF
  const [usersDatabase, setUsersDatabase] = useState<BankUser[]>(INITIAL_USERS);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Global active banking models
  const [user, setUser] = useState<BankUser>(INITIAL_USERS[0]); // Default to Pedro Gabriel dos Santos Silva
  const [recipient, setRecipient] = useState<BankRecipient>(PRESET_RECEIPT.recipient);
  const [transaction, setTransaction] = useState<TransactionDetails>(PRESET_RECEIPT.tx);
  const [history, setHistory] = useState<StatementItem[]>(PRESET_RECEIPT.history);

  // Interface toggles
  const [hideBalance, setHideBalance] = useState<boolean>(false);
  const [currentScreen, setCurrentScreen] = useState<'home' | 'account' | 'card' | 'pix' | 'receipt'>('home');
  
  // Responsive workspace mode (for mobile / small tablets)
  // 'preview' shows the smartphone frame, 'edit' shows the control forms
  const [smallScreenMode, setSmallScreenMode] = useState<'preview' | 'edit'>('preview');

  // Simulated Deposit Popup State inside the phone shell
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('500.00');

  // Automatically lookup and resolve recipient details if their CPF matches any user in our database
  useEffect(() => {
    const cleanedCpf = recipient.cpf.trim();
    if (cleanedCpf.length === 14) {
      const matched = usersDatabase.find(u => u.cpf === cleanedCpf);
      if (matched) {
        setRecipient(prev => ({
          ...prev,
          name: matched.name,
          bankName: matched.bankName,
          agency: matched.agency,
          accountNumber: matched.accountNumber,
          pixKey: matched.cpf
        }));
      }
    }
  }, [recipient.cpf, usersDatabase]);

  // Synchronize changes to active user back to our dynamic users database
  useEffect(() => {
    setUsersDatabase(prev => prev.map(u => u.cpf === user.cpf ? user : u));
  }, [user]);

  // Trigger loading state for templates
  const handleLoadPreset = (type: 'receipt-example' | 'gabriela-example' | 'clean') => {
    let selected;
    if (type === 'receipt-example') selected = PRESET_RECEIPT;
    else if (type === 'gabriela-example') selected = PRESET_GABRIELA;
    else selected = PRESET_CLEAN;

    setUser(selected.user);
    setRecipient(selected.recipient);
    setTransaction(selected.tx);
    setHistory(selected.history);
    setCurrentScreen('home');
    setIsAuthenticated(true);
  };

  // Callback: User completes a custom transaction flow inside the mock app
  const handleSendPix = (amount: number, type: 'Pix' | 'Transferência', finalRecipient: BankRecipient) => {
    // Set recipient state
    setRecipient(finalRecipient);

    // 1. Subtract from balance
    const updatedBalance = Math.max(0, user.balance - amount);
    setUser(prev => ({ ...prev, balance: updatedBalance }));

    // 2. Generate detailed transaction ID matching standard formats
    const today = new Date();
    const formattedDate = today.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase().replace('.', '');
    const formattedTime = today.toTimeString().split(' ')[0];
    
    const idSeed = String(Math.floor(100000 + Math.random() * 900000));
    const randomId = `E30680829${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}${idSeed}TX`;

    const txDetails: TransactionDetails = {
      amount,
      type,
      date: formattedDate,
      time: formattedTime,
      transactionId: randomId
    };

    setTransaction(txDetails);

    // 3. Append to historical statement array
    const newLog: StatementItem = {
      id: 'user_tx_' + Date.now(),
      title: type === 'Pix' ? 'Pix enviado' : 'Transferência enviada',
      description: `${type} para ${finalRecipient.name}`,
      amount,
      date: today.toISOString().split('T')[0],
      time: formattedTime,
      type,
      incoming: false,
      recipientName: finalRecipient.name
    };

    setHistory(prev => [newLog, ...prev]);

    // 4. Open Comprovante Screen
    setCurrentScreen('receipt');
  };

  // Add a manual statement record from Control Panel
  const handleAddManualStatementItem = (item: Omit<StatementItem, 'id'>) => {
    const newLog: StatementItem = {
      ...item,
      id: 'manual_' + Date.now()
    };
    setHistory(prev => [newLog, ...prev]);
  };

  // Empty statement logs
  const handleClearStatementHistory = () => {
    setHistory([]);
  };

  // Confirm simulated deposit inside the device popup
  const handleConfirmDeposit = () => {
    const val = parseFloat(depositAmount);
    if (isNaN(val) || val <= 0) {
      alert('Valor de depósito inválido.');
      return;
    }

    // Update balance
    setUser(prev => ({ ...prev, balance: prev.balance + val }));

    // Create deposit statement log
    const today = new Date();
    const formattedTime = today.toTimeString().split(' ')[0];
    const newLog: StatementItem = {
      id: 'deposit_' + Date.now(),
      title: 'Depósito por Pix recebido',
      description: 'Transferência Pix recebida',
      amount: val,
      date: today.toISOString().split('T')[0],
      time: formattedTime,
      type: 'Depósito',
      incoming: true,
      senderName: 'Nubank Conveniado S.A.'
    };

    setHistory(prev => [newLog, ...prev]);
    setDepositOpen(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col font-sans select-none antialiased justify-between">
      
      {/* Top Banner Branding Header */}
      <header className="bg-white border-b border-neutral-200/80 px-6 py-4 flex items-center justify-between sticky top-0 z-30 select-none shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-[#830AD1] flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-[#830AD1]/20">
            nu
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-extrabold text-neutral-900 tracking-tight font-display">Nubank</h1>
            <span className="text-[10px] text-[#830AD1] font-bold tracking-wide uppercase">Aplicativo Oficial</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated && (
            <button
              onClick={() => setIsAuthenticated(false)}
              className="text-xs bg-rose-50 text-rose-600 hover:bg-rose-100 font-extrabold px-3.5 py-1.5 rounded-xl transition-all uppercase tracking-wider"
            >
              Sair da Conta
            </button>
          )}
        </div>
      </header>

      {/* Main Responsive Full App Workspace */}
      <main className="flex-1 w-full max-w-lg lg:max-w-6xl mx-auto p-0 sm:py-6 sm:px-4 flex flex-col lg:flex-row items-stretch justify-center gap-6">
        
        {/* Centered High-Fidelity App Shell */}
        <div className="w-full max-w-lg bg-white rounded-none sm:rounded-[36px] border border-transparent sm:border-neutral-200 shadow-none sm:shadow-xl overflow-hidden flex flex-col min-h-[740px] relative shrink-0">
          
          <div className="bg-[#830AD1] px-5 py-3 flex items-center justify-between text-white text-[10px] font-bold select-none border-b border-white/10">
            <span className="tracking-wide uppercase text-purple-100 font-display">NUBANK INTERATIVO</span>
            <div className="flex items-center gap-1.5 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>SESSÃO PROTEGIDA</span>
            </div>
          </div>

          <div className="flex-1 flex flex-col relative bg-neutral-50">
            {/* If user is not logged in / identified, show the interactive identification portal */}
            {!isAuthenticated ? (
              <LoginView
                usersDatabase={usersDatabase}
                onLoginSuccess={(selUser) => {
                  setUser(selUser);
                  setIsAuthenticated(true);
                  setCurrentScreen('home');
                }}
                onRegisterUser={(newUser) => {
                  setUsersDatabase(prev => [newUser, ...prev]);
                }}
              />
            ) : (
              /* If logged in, show the full Nubank app itself */
              <>
                {currentScreen === 'home' && (
                  <HomeView 
                    user={user}
                    hideBalance={hideBalance}
                    setHideBalance={setHideBalance}
                    onNavigate={(screen) => setCurrentScreen(screen)}
                    onLogout={() => setIsAuthenticated(false)}
                    onUpdateUser={(updated) => setUser(prev => ({ ...prev, ...updated }))}
                  />
                )}

                {currentScreen === 'account' && (
                  <AccountDetailsView 
                    user={user}
                    history={history}
                    hideBalance={hideBalance}
                    onBack={() => setCurrentScreen('home')}
                    onNavigate={(screen) => setCurrentScreen(screen)}
                    onUpdateUser={(updated) => setUser(prev => ({ ...prev, ...updated }))}
                    onSelectTransaction={(item) => {
                      // Reconstruct transaction details from statement log click
                      const txDetails: TransactionDetails = {
                        amount: item.amount,
                        type: item.type,
                        date: transaction.date, // defaults to active config date/time
                        time: item.time,
                        transactionId: transaction.transactionId
                      };
                      setTransaction(txDetails);
                      
                      // Temporary recipient update for clicking matching receipt
                      if (item.recipientName) {
                        setRecipient(prev => ({ ...prev, name: item.recipientName || prev.name }));
                      } else if (item.senderName) {
                        setRecipient(prev => ({ ...prev, name: item.senderName || prev.name }));
                      }
                      setCurrentScreen('receipt');
                    }}
                    onOpenDeposit={() => setDepositOpen(true)}
                  />
                )}

                {currentScreen === 'card' && (
                  <CreditCardView 
                    user={user}
                    onBack={() => setCurrentScreen('home')}
                    onUpdateLimit={(newLimit) => handleUserChange('creditCardLimit', newLimit)}
                  />
                )}

                {currentScreen === 'pix' && (
                  <MakePixView 
                    user={user}
                    usersDatabase={usersDatabase}
                    onBack={() => setCurrentScreen('home')}
                    onSendPix={handleSendPix}
                  />
                )}

                {currentScreen === 'receipt' && (
                  <ReceiptView 
                    user={user}
                    recipient={recipient}
                    transaction={transaction}
                    onBackToHome={() => setCurrentScreen('home')}
                  />
                )}

                {/* Inner Phone Modal: Simulated Deposit */}
                {depositOpen && (
                  <div className="absolute inset-0 bg-black/60 z-50 flex items-end justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-t-3xl w-full p-5 flex flex-col gap-4 animate-slide-up select-none">
                      <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                        <span className="font-bold text-neutral-800 font-display">Adicionar Saldo Pix</span>
                        <button 
                          onClick={() => setDepositOpen(false)}
                          className="text-neutral-400 font-bold hover:text-neutral-600 p-1"
                        >
                          X
                        </button>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Qual o valor do Pix recebido?</label>
                        <div className="relative flex items-center mt-1">
                          <span className="absolute left-3 text-lg font-bold text-neutral-400">R$</span>
                          <input 
                            type="number" 
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 focus:border-[#830AD1] focus:outline-none rounded-xl text-xl font-bold text-neutral-900"
                          />
                        </div>
                      </div>

                      <button 
                        onClick={handleConfirmDeposit}
                        className="w-full bg-[#830AD1] hover:bg-[#7209B7] text-white py-3.5 rounded-xl font-bold text-xs tracking-wider flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Landmark className="w-4 h-4" />
                        Receber Pix na Conta
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

          </div>

        </div>

        {/* ControlPanel Column (Visible on Wide Desktop Screens) */}
        <div className="flex-1 hidden lg:block max-w-lg min-w-[340px]">
          <ControlPanel 
            user={user}
            setUser={setUser}
            recipient={recipient}
            setRecipient={setRecipient}
            transaction={transaction}
            setTransaction={setTransaction}
            onLoadPreset={handleLoadPreset}
            onAddManualStatementItem={handleAddManualStatementItem}
            onClearStatementHistory={handleClearStatementHistory}
          />
        </div>

      </main>

      <footer className="bg-neutral-50 border-t border-neutral-200/50 py-4 text-center text-[10px] text-neutral-400 font-bold uppercase tracking-widest select-none">
        © {new Date().getFullYear()} NUBANK • CLIQUE NO NOME OU NO SALDO PARA EDITAR DIRETAMENTE
      </footer>

    </div>
  );

  // Helper inside to cleanly handle field updates from control inputs
  function handleUserChange(field: keyof BankUser, value: any) {
    setUser(prev => ({ ...prev, [field]: value }));
  }
}
