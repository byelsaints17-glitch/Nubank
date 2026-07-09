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
import ExtratoView from './components/ExtratoView';
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
    bankName: 'Nu Pagamentos S.A.',
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
    bankName: 'NU PAGAMENTOS - IP',
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
  const [usersDatabase, setUsersDatabase] = useState<BankUser[]>(() => {
    const saved = localStorage.getItem('nubank_users_database');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem('nubank_is_authenticated');
    return saved === 'true';
  });

  // Global active banking models
  const [user, setUser] = useState<BankUser>(() => {
    const saved = localStorage.getItem('nubank_active_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_USERS[0];
  });
  const [recipient, setRecipient] = useState<BankRecipient>(() => {
    const saved = localStorage.getItem('nubank_active_recipient');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return PRESET_RECEIPT.recipient;
  });
  const [transaction, setTransaction] = useState<TransactionDetails>(() => {
    const saved = localStorage.getItem('nubank_active_transaction');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return PRESET_RECEIPT.tx;
  });
  const [history, setHistory] = useState<StatementItem[]>(() => {
    const saved = localStorage.getItem('nubank_active_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return PRESET_RECEIPT.history;
  });

  const [comprovantes, setComprovantes] = useState<any[]>(() => {
    const saved = localStorage.getItem('nubank_comprovantes');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  // Persist state changes in localStorage
  useEffect(() => {
    localStorage.setItem('nubank_active_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('nubank_users_database', JSON.stringify(usersDatabase));
  }, [usersDatabase]);

  useEffect(() => {
    localStorage.setItem('nubank_is_authenticated', String(isAuthenticated));
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem('nubank_active_recipient', JSON.stringify(recipient));
    if (user && user.cpf) {
      localStorage.setItem(`nubank_recipient_${user.cpf.replace(/\D/g, '')}`, JSON.stringify(recipient));
    }
  }, [recipient, user]);

  useEffect(() => {
    localStorage.setItem('nubank_active_transaction', JSON.stringify(transaction));
    if (user && user.cpf) {
      localStorage.setItem(`nubank_transaction_${user.cpf.replace(/\D/g, '')}`, JSON.stringify(transaction));
    }
  }, [transaction, user]);

  useEffect(() => {
    localStorage.setItem('nubank_active_history', JSON.stringify(history));
    if (user && user.cpf) {
      localStorage.setItem(`nubank_history_${user.cpf.replace(/\D/g, '')}`, JSON.stringify(history));
    }
  }, [history, user]);

  useEffect(() => {
    localStorage.setItem('nubank_comprovantes', JSON.stringify(comprovantes));
  }, [comprovantes]);

  // Interface toggles
  const [hideBalance, setHideBalance] = useState<boolean>(false);
  const [currentScreen, setCurrentScreen] = useState<'home' | 'account' | 'card' | 'pix' | 'receipt' | 'extrato'>('home');
  
  // Responsive workspace mode (for mobile / small tablets)
  // 'preview' shows the smartphone frame, 'edit' shows the control forms
  const [smallScreenMode, setSmallScreenMode] = useState<'preview' | 'edit'>('preview');

  // Simulated Deposit Popup State inside the phone shell
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('500.00');

  // Synchronize changes to active user back to our dynamic users database and server database
  useEffect(() => {
    setUsersDatabase(prev => prev.map(u => u.cpf === user.cpf ? user : u));
    
    const syncUserToBackend = async () => {
      if (user && user.cpf && isAuthenticated) {
        try {
          await fetch(`/api/users/${encodeURIComponent(user.cpf)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
          });
        } catch (e) {
          console.error("Erro ao sincronizar usuário com o servidor:", e);
        }
      }
    };
    syncUserToBackend();
  }, [user, isAuthenticated]);

  // Fetch users from server on mount or authentication change
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/users');
        if (res.ok) {
          const data = await res.json();
          setUsersDatabase(data);
          
          // Se houver um usuário ativo salvo localmente, atualiza com a versão mais recente do servidor
          const savedActiveUser = localStorage.getItem('nubank_active_user');
          if (savedActiveUser) {
            try {
              const parsed = JSON.parse(savedActiveUser);
              const freshUser = data.find((u: BankUser) => u.cpf === parsed.cpf);
              if (freshUser) {
                setUser(freshUser);
              }
            } catch (e) {}
          }
        }
      } catch (err) {
        console.error("Erro ao carregar banco de dados de usuários do servidor:", err);
      }
    };
    fetchUsers();
  }, [isAuthenticated]);

  // When user.cpf changes, load the correct state for this user from localStorage or defaults
  useEffect(() => {
    if (user && user.cpf) {
      const cleanCpf = user.cpf.replace(/\D/g, '');
      
      // Load history
      const savedHistory = localStorage.getItem(`nubank_history_${cleanCpf}`);
      let userHistory: StatementItem[] = [];
      if (savedHistory) {
        try {
          userHistory = JSON.parse(savedHistory);
        } catch (e) {}
      } else {
        if (user.cpf === PRESET_RECEIPT.user.cpf) {
          userHistory = PRESET_RECEIPT.history;
        } else if (user.cpf === PRESET_GABRIELA.user.cpf) {
          userHistory = PRESET_GABRIELA.history;
        } else {
          userHistory = [];
        }
      }
      setHistory(userHistory);

      // Load active transaction
      const savedTx = localStorage.getItem(`nubank_transaction_${cleanCpf}`);
      if (savedTx) {
        try {
          setTransaction(JSON.parse(savedTx));
        } catch (e) {}
      } else {
        if (user.cpf === PRESET_RECEIPT.user.cpf) {
          setTransaction(PRESET_RECEIPT.tx);
        } else if (user.cpf === PRESET_GABRIELA.user.cpf) {
          setTransaction(PRESET_GABRIELA.tx);
        }
      }

      // Load active recipient
      const savedRecipient = localStorage.getItem(`nubank_recipient_${cleanCpf}`);
      if (savedRecipient) {
        try {
          setRecipient(JSON.parse(savedRecipient));
        } catch (e) {}
      } else {
        if (user.cpf === PRESET_RECEIPT.user.cpf) {
          setRecipient(PRESET_RECEIPT.recipient);
        } else if (user.cpf === PRESET_GABRIELA.user.cpf) {
          setRecipient(PRESET_GABRIELA.recipient);
        }
      }
    }
  }, [user.cpf]);

  // Load transactions/comprovantes from Supabase/Server database for the current user
  useEffect(() => {
    if (user && user.cpf) {
      const userCpfClean = user.cpf.replace(/\D/g, '');
      fetch(`/api/comprovantes?userCpf=${userCpfClean}`)
        .then(res => {
          if (!res.ok) throw new Error('API failed');
          return res.json();
        })
        .then((data: any[]) => {
          if (data && data.length > 0) {
            // Update local state 'comprovantes' by merging server data
            setComprovantes(prev => {
              const combined = [...data, ...prev];
              return combined.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
            });

            const loadedHistory: StatementItem[] = data.map(item => ({
              id: item.id,
              title: item.title,
              description: item.description,
              amount: item.amount,
              date: item.date,
              time: item.time,
              type: item.type,
              incoming: item.incoming,
              recipientName: item.recipientName,
              senderName: item.senderName
            }));
            
            setHistory(prev => {
              const combined = [...loadedHistory, ...prev];
              const unique = combined.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
              return unique;
            });
          }
        })
        .catch(err => {
          console.warn('Erro ao carregar comprovantes do Supabase:', err);
        });
    }
  }, [user.cpf]);

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

    // Save to server / Supabase
    const dbPayload = {
      id: newLog.id,
      userCpf: user.cpf,
      title: newLog.title,
      description: newLog.description,
      amount: newLog.amount,
      date: newLog.date,
      time: newLog.time,
      type: newLog.type,
      incoming: newLog.incoming,
      
      senderName: user.name,
      senderCpf: user.cpf,
      senderBank: user.bankName,
      senderAgency: user.agency,
      senderAccountNumber: user.accountNumber,
      
      recipientName: finalRecipient.name,
      recipientCpf: finalRecipient.cpf,
      recipientBank: finalRecipient.bankName,
      recipientAgency: finalRecipient.agency,
      recipientAccountNumber: finalRecipient.accountNumber,
      pixKey: finalRecipient.pixKey,
      transactionId: txDetails.transactionId
    };

    setComprovantes(prev => {
      const existingIndex = prev.findIndex(c => c.id === dbPayload.id);
      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = dbPayload;
        return updated;
      } else {
        return [dbPayload, ...prev];
      }
    });

    fetch('/api/comprovantes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dbPayload)
    }).catch(err => console.error('Erro ao salvar comprovante no Supabase:', err));

    // 4. Open Comprovante Screen
    setCurrentScreen('receipt');
  };

  // Add a manual statement record from Control Panel
  const handleAddManualStatementItem = (item: Omit<StatementItem, 'id'>) => {
    const newId = 'manual_' + Date.now();
    const newLog: StatementItem = {
      ...item,
      id: newId
    };
    setHistory(prev => [newLog, ...prev]);

    // Save to Supabase via server
    const dbPayload = {
      id: newLog.id,
      userCpf: user.cpf,
      title: newLog.title,
      description: newLog.description,
      amount: newLog.amount,
      date: newLog.date,
      time: newLog.time,
      type: newLog.type,
      incoming: newLog.incoming,
      
      senderName: newLog.incoming ? (newLog.senderName || 'OUTRO OPERADOR') : user.name,
      senderCpf: newLog.incoming ? '***.***.***-**' : user.cpf,
      senderBank: newLog.incoming ? 'BANCO EXTERNO' : user.bankName,
      senderAgency: '0001',
      senderAccountNumber: '12345-6',
      
      recipientName: newLog.incoming ? user.name : (newLog.recipientName || 'REMETENTE EXTERNO'),
      recipientCpf: newLog.incoming ? user.cpf : '***.***.***-**',
      recipientBank: newLog.incoming ? user.bankName : 'BANCO DESTINATÁRIO',
      recipientAgency: '0001',
      recipientAccountNumber: '12345-6',
      pixKey: '***.***.***-**',
      transactionId: `E30680829${newLog.date.replace(/-/g, '')}${Math.floor(100000 + Math.random() * 900000)}TX`
    };

    setComprovantes(prev => {
      const existingIndex = prev.findIndex(c => c.id === dbPayload.id);
      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = dbPayload;
        return updated;
      } else {
        return [dbPayload, ...prev];
      }
    });

    fetch('/api/comprovantes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dbPayload)
    }).catch(err => console.error('Erro ao salvar manual:', err));
  };

  // Empty statement logs
  const handleClearStatementHistory = () => {
    setHistory([]);
    setComprovantes([]);
    const userCpfClean = user.cpf.replace(/\D/g, '');
    fetch(`/api/comprovantes?userCpf=${userCpfClean}`, {
      method: 'DELETE'
    }).catch(err => console.error('Erro ao deletar comprovantes:', err));
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

    // Save deposit to server/Supabase
    const dbPayload = {
      id: newLog.id,
      userCpf: user.cpf,
      title: newLog.title,
      description: newLog.description,
      amount: newLog.amount,
      date: newLog.date,
      time: newLog.time,
      type: newLog.type,
      incoming: newLog.incoming,
      
      senderName: 'Nubank Conveniado S.A.',
      senderCpf: '***.***.***-**',
      senderBank: 'NU PAGAMENTOS - IP',
      senderAgency: '0001',
      senderAccountNumber: '999999-9',
      
      recipientName: user.name,
      recipientCpf: user.cpf,
      recipientBank: user.bankName,
      recipientAgency: user.agency,
      recipientAccountNumber: user.accountNumber,
      pixKey: user.cpf,
      transactionId: `E30680829${newLog.date.replace(/-/g, '')}${Math.floor(100000 + Math.random() * 900000)}TX`
    };

    setComprovantes(prev => {
      const existingIndex = prev.findIndex(c => c.id === dbPayload.id);
      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = dbPayload;
        return updated;
      } else {
        return [dbPayload, ...prev];
      }
    });

    fetch('/api/comprovantes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dbPayload)
    }).catch(err => console.error('Erro ao salvar depósito:', err));
  };

  const handleSelectTransaction = (item: StatementItem) => {
    // Reconstruct default transaction details from statement log click
    const defaultTx: TransactionDetails = {
      amount: item.amount,
      type: item.type,
      date: item.date,
      time: item.time,
      transactionId: 'E30680829' + Date.now() + 'TX'
    };
    
    // Try fetching authentic receipt details from database
    const userCpfClean = user.cpf.replace(/\D/g, '');
    fetch(`/api/comprovantes?userCpf=${userCpfClean}`)
      .then(res => {
        if (!res.ok) throw new Error('API error');
        return res.json();
      })
      .then((comprovantesData: any[]) => {
        if (comprovantesData && comprovantesData.length > 0) {
          setComprovantes(prev => {
            const combined = [...comprovantesData, ...prev];
            return combined.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
          });
        }
        
        // Look up in server data or local state
        const matched = (comprovantesData || []).find(c => c.id === item.id) || comprovantes.find(c => c.id === item.id);
        if (matched) {
          // Perfect database or local cache match! Display the saved recipient/transaction details
          setTransaction({
            amount: matched.amount,
            type: matched.type,
            date: matched.date,
            time: matched.time,
            transactionId: matched.transactionId || defaultTx.transactionId
          });
          setRecipient({
            name: matched.recipientName || 'OUTRO OPERADOR',
            cpf: matched.recipientCpf || '***.***.***-**',
            bankName: matched.recipientBank || 'NU PAGAMENTOS - IP',
            agency: matched.recipientAgency || '0001',
            accountNumber: matched.recipientAccountNumber || '12345-6',
            pixKey: matched.pixKey || '***.***.***-**'
          });
        } else {
          // Fallback if not found anywhere (or standard onboarding logs)
          setTransaction(defaultTx);
          if (item.recipientName) {
            setRecipient(prev => ({
              ...prev,
              name: item.recipientName || prev.name,
              cpf: '***.***.***-**',
              bankName: 'NU PAGAMENTOS - IP',
              agency: '0001',
              accountNumber: '12345-6',
              pixKey: '***.***.***-**'
            }));
          } else if (item.senderName) {
            setRecipient(prev => ({
              ...prev,
              name: item.senderName || prev.name,
              cpf: '***.***.***-**',
              bankName: 'NU PAGAMENTOS - IP',
              agency: '0001',
              accountNumber: '12345-6',
              pixKey: '***.***.***-**'
            }));
          }
        }
        setCurrentScreen('receipt');
      })
      .catch(() => {
        // Fallback to local state if server fails
        const matched = comprovantes.find(c => c.id === item.id);
        if (matched) {
          setTransaction({
            amount: matched.amount,
            type: matched.type,
            date: matched.date,
            time: matched.time,
            transactionId: matched.transactionId || defaultTx.transactionId
          });
          setRecipient({
            name: matched.recipientName || 'OUTRO OPERADOR',
            cpf: matched.recipientCpf || '***.***.***-**',
            bankName: matched.recipientBank || 'NU PAGAMENTOS - IP',
            agency: matched.recipientAgency || '0001',
            accountNumber: matched.recipientAccountNumber || '12345-6',
            pixKey: matched.pixKey || '***.***.***-**'
          });
        } else {
          setTransaction(defaultTx);
          if (item.recipientName) {
            setRecipient(prev => ({ ...prev, name: item.recipientName || prev.name }));
          }
        }
        setCurrentScreen('receipt');
      });
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col font-sans select-none antialiased justify-center">
      
      {/* Main Responsive Full App Workspace */}
      <main className="flex-1 w-full max-w-lg lg:max-w-6xl mx-auto p-0 sm:py-6 sm:px-4 flex flex-col lg:flex-row items-stretch justify-center gap-6">
        
        {/* Centered High-Fidelity App Shell */}
        <div className="w-full max-w-lg bg-white rounded-none sm:rounded-[36px] border border-transparent sm:border-neutral-200 shadow-none sm:shadow-xl overflow-hidden flex flex-col min-h-[740px] relative shrink-0">
          
          <div className="flex-1 flex flex-col relative bg-neutral-50 overflow-y-auto no-scrollbar">
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
                    onSelectTransaction={handleSelectTransaction}
                    onOpenDeposit={() => setDepositOpen(true)}
                  />
                )}

                {currentScreen === 'extrato' && (
                  <ExtratoView 
                    user={user}
                    history={history}
                    hideBalance={hideBalance}
                    onBack={() => setCurrentScreen('home')}
                    onSelectTransaction={handleSelectTransaction}
                    onClearHistory={handleClearStatementHistory}
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
                    recipient={recipient}
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
