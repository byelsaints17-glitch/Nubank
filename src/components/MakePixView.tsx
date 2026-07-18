import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, HelpCircle, User, DollarSign, ArrowRight, 
  ShieldCheck, Sparkles, CheckCircle2, KeyRound, Landmark,
  QrCode, Camera, CameraOff, Upload, ScanLine, Info, Terminal
} from 'lucide-react';
import { BankUser, BankRecipient } from '../types';
import jsQR from 'jsqr';

interface MakePixViewProps {
  user: BankUser;
  usersDatabase: BankUser[];
  recipient: BankRecipient;
  onBack: () => void;
  onSendPix: (amount: number, type: 'Pix' | 'Transferência', recipient: BankRecipient) => void;
}

export default function MakePixView({ user, usersDatabase, recipient, onBack, onSendPix }: MakePixViewProps) {
  // Steps: 'key' | 'amount' | 'password' | 'sending' | 'success'
  const [pixStep, setPixStep] = useState<'key' | 'amount' | 'password' | 'sending' | 'success'>('key');
  
  // Tab control inside step 'key'
  const [activeTab, setActiveTab] = useState<'key' | 'qrcode' | 'transfer'>('key');
  
  // QR Scanner / Camera states
  const [useCamera, setUseCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState('');
  const [scanSuccessOverlay, setScanSuccessOverlay] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Bind the camera stream to the video element as soon as it mounts to fix the black screen bug
  useEffect(() => {
    if (useCamera && cameraStream && videoRef.current) {
      const video = videoRef.current;
      video.srcObject = cameraStream;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('muted', 'true');
      video.play().catch(err => {
        console.warn('Erro ao reproduzir o vídeo da câmera:', err);
      });
    }
  }, [useCamera, cameraStream]);

  // Serpro Receita Federal Integration States
  const [isSearchingCPF, setIsSearchingCPF] = useState(false);
  const [serproLog, setSerproLog] = useState<any>(null);
  const [showSerproLog, setShowSerproLog] = useState(false);
  const [lastSearchedCPF, setLastSearchedCPF] = useState('');

  // Track if user manually customized recipient details
  const [userHasEdited, setUserHasEdited] = useState(false);

  // Key identification step states
  const [pixKeyInput, setPixKeyInput] = useState(recipient?.pixKey || '');
  const [selectedKeyType, setSelectedKeyType] = useState<'cpf' | 'telefone' | 'copiacola' | 'outros'>('cpf');
  const [recipientName, setRecipientName] = useState(recipient?.name || '');
  const [recipientBank, setRecipientBank] = useState(recipient?.bankName || 'NU PAGAMENTOS - IP');
  const [recipientAgency, setRecipientAgency] = useState(recipient?.agency || '0001');
  const [recipientAccount, setRecipientAccount] = useState(recipient?.accountNumber || '');
  const [isKeyIdentified, setIsKeyIdentified] = useState(!!recipient?.name);
  const [validationError, setValidationError] = useState('');

  // BrasilAPI Banks list and Search integration
  interface BrasilApiBank {
    code: number | null;
    name: string;
    fullName: string;
    ispb: string;
  }
  const [banks, setBanks] = useState<BrasilApiBank[]>([]);
  const [isLoadingBanks, setIsLoadingBanks] = useState(false);
  const [bankSearchCode, setBankSearchCode] = useState('');
  const [bankSearchError, setBankSearchError] = useState('');

  // Fetch real Brazilian banks from our server-side BrasilAPI Cache on mount
  useEffect(() => {
    setIsLoadingBanks(true);
    fetch('/api/banks')
      .then(res => {
        if (!res.ok) throw new Error('API failed');
        return res.json();
      })
      .then((data: BrasilApiBank[]) => {
        // Filter out those with no codes or names to keep it clean
        const validBanks = data.filter(b => b.code !== null && (b.fullName || b.name));
        validBanks.sort((a, b) => (a.code || 0) - (b.code || 0));
        setBanks(validBanks);
      })
      .catch(err => {
        console.error('Failed to fetch banks list from Express cache', err);
        // Fallback robust lists
        setBanks([
          { code: 260, name: 'NU PAGAMENTOS S.A.', fullName: 'Nu Pagamentos S.A.', ispb: '18236120' },
          { code: 341, name: 'ITAÚ UNIBANCO S.A.', fullName: 'Itaú Unibanco S.A.', ispb: '60701190' },
          { code: 237, name: 'BANCO BRADESCO S.A.', fullName: 'Banco Bradesco S.A.', ispb: '60746948' },
          { code: 1, name: 'BANCO DO BRASIL S.A.', fullName: 'Banco do Brasil S.A.', ispb: '00000000' },
          { code: 104, name: 'CAIXA ECONOMICA FEDERAL', fullName: 'Caixa Econômica Federal', ispb: '00360305' },
          { code: 33, name: 'BANCO SANTANDER (BRASIL) S.A.', fullName: 'Banco Santander (Brasil) S.A.', ispb: '90400888' },
          { code: 77, name: 'BANCO INTER S.A.', fullName: 'Banco Inter S.A.', ispb: '41696805' },
          { code: 290, name: 'PAGSEGURO INTERNET S.A.', fullName: 'PagSeguro Internet S.A.', ispb: '08561701' },
          { code: 323, name: 'MERCADOPAGO.COM REPRESENTACOES LTDA.', fullName: 'Mercado Pago', ispb: '10573521' }
        ]);
      })
      .finally(() => {
        setIsLoadingBanks(false);
      });
  }, []);

  // Synchronize bankSearchCode with recipientBank changes so fields match perfectly
  useEffect(() => {
    if (recipientBank && banks.length > 0) {
      const matched = banks.find(b => 
        b.fullName?.toLowerCase() === recipientBank.toLowerCase() || 
        b.name?.toLowerCase() === recipientBank.toLowerCase()
      );
      if (matched && matched.code !== null && matched.code !== undefined) {
        setBankSearchCode(matched.code.toString());
      }
    }
  }, [recipientBank, banks]);

  const handleLookupBankByCode = async (code: string) => {
    const cleaned = code.trim().replace(/\D/g, '');
    if (!cleaned) return;
    
    setBankSearchError('');
    try {
      const res = await fetch(`/api/banks/${cleaned}`);
      if (!res.ok) {
        throw new Error('Banco não encontrado');
      }
      const data = await res.json();
      if (data && (data.fullName || data.name)) {
        const bankNameFound = data.fullName || data.name;
        setRecipientBank(bankNameFound);
        setBankSearchError('');
      } else {
        throw new Error('No name');
      }
    } catch (err) {
      console.warn('Bank lookup via API failed for code', cleaned, err);
      // Fallback: search in our preloaded banks
      const matched = banks.find(b => b.code?.toString() === cleaned || b.code?.toString() === parseInt(cleaned).toString());
      if (matched) {
        setRecipientBank(matched.fullName || matched.name);
        setBankSearchError('');
      } else {
        setBankSearchError('Código não localizado na BrasilAPI.');
      }
    }
  };

  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {
      console.warn('Web Audio beep failed:', e);
    }
  };

  const parsePixEMV = (emvStr: string) => {
    const result: {
      key?: string;
      name?: string;
      amount?: string;
      city?: string;
      txid?: string;
      raw?: string;
    } = { raw: emvStr };

    try {
      let index = 0;
      while (index < emvStr.length) {
        const tag = emvStr.slice(index, index + 2);
        const lenStr = emvStr.slice(index + 2, index + 4);
        if (!tag || !lenStr) break;
        const len = parseInt(lenStr, 10);
        if (isNaN(len)) break;
        const val = emvStr.slice(index + 4, index + 4 + len);
        index += 4 + len;

        if (tag === '26') {
          let subIndex = 0;
          while (subIndex < val.length) {
            const subTag = val.slice(subIndex, subIndex + 2);
            const subLenStr = val.slice(subIndex + 2, subIndex + 4);
            if (!subTag || !subLenStr) break;
            const subLen = parseInt(subLenStr, 10);
            if (isNaN(subLen)) break;
            const subVal = val.slice(subIndex + 4, subIndex + 4 + subLen);
            subIndex += 4 + subLen;

            if (subTag === '01') {
              result.key = subVal;
            }
          }
        } else if (tag === '54') {
          result.amount = val;
        } else if (tag === '59') {
          result.name = val;
        } else if (tag === '60') {
          result.city = val;
        } else if (tag === '62') {
          let subIndex = 0;
          while (subIndex < val.length) {
            const subTag = val.slice(subIndex, subIndex + 2);
            const subLenStr = val.slice(subIndex + 2, subIndex + 4);
            if (!subTag || !subLenStr) break;
            const subLen = parseInt(subLenStr, 10);
            if (isNaN(subLen)) break;
            const subVal = val.slice(subIndex + 4, subIndex + 4 + subLen);
            subIndex += 4 + subLen;

            if (subTag === '05') {
              result.txid = subVal;
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to parse EMV Pix', err);
    }

    return result;
  };

  const handleQRCodeDetected = (data: string) => {
    playBeep();
    setScanSuccessOverlay(true);
    stopCamera();

    setTimeout(() => {
      if (data.startsWith('000201')) {
        // EMV Pix code
        const parsed = parsePixEMV(data);
        if (parsed.key) {
          setPixKeyInput(parsed.key);
          setRecipientName(parsed.name || 'JULIANA MELO MELO');
          setIsKeyIdentified(true);
          
          if (parsed.amount) {
            setAmountStr(parsed.amount);
          }
          setRecipientBank('NU PAGAMENTOS - IP');
          setRecipientAgency('0001');
          setRecipientAccount('1234567-8');
        } else {
          setPixKeyInput(data);
          setRecipientName('Destinatário QR Code');
          setIsKeyIdentified(true);
        }
      } else {
        // Direct text key
        setPixKeyInput(data);
        // Let the CPF/key lookup handle details
      }
      setScanSuccessOverlay(false);
      setPixStep('amount');
    }, 800);
  };

  const startCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setCameraStream(stream);
      setUseCamera(true);
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('Câmera física indisponível no iframe/navegador. Use a opção de UPLOAD de imagem ou os Presets rápidos abaixo que funcionam 100%!');
      setUseCamera(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setUseCamera(false);
  };

  // Real-time Camera Frame QR Code Scanner Loop
  useEffect(() => {
    if (!useCamera || activeTab !== 'qrcode') return;

    let active = true;
    let animId = 0;
    const canvas = document.createElement('canvas');

    const scanFrame = () => {
      if (!active) return;

      const video = videoRef.current;
      if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
        const width = video.videoWidth;
        const height = video.videoHeight;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, width, height);
          const imageData = ctx.getImageData(0, 0, width, height);
          try {
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'dontInvert',
            });
            if (code && code.data) {
              handleQRCodeDetected(code.data);
              active = false; // Stop scanner loop on success
              return;
            }
          } catch (e) {
            // Silence QR decode errors on empty frames
          }
        }
      }

      animId = requestAnimationFrame(scanFrame);
    };

    const timer = setTimeout(() => {
      animId = requestAnimationFrame(scanFrame);
    }, 400);

    return () => {
      active = false;
      cancelAnimationFrame(animId);
      clearTimeout(timer);
    };
  }, [useCamera, activeTab]);

  // Manage camera state on step or tab changes
  useEffect(() => {
    if (pixStep !== 'key' || activeTab !== 'qrcode') {
      stopCamera();
    }
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [pixStep, activeTab]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, img.width, img.height);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });
          if (code && code.data) {
            handleQRCodeDetected(code.data);
          } else {
            alert('Não foi possível detectar um QR Code nesta imagem. Certifique-se de que é uma imagem nítida de QR Code Pix e tente novamente.');
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const consultarChavePix = async (chave: string) => {
    setIsSearchingCPF(true);
    setValidationError('');
    setSerproLog(null);

    try {
      const res = await fetch('/api/consulta-chave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ chave })
      });

      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) {
        throw new Error(`Erro ao conectar com o banco de dados (Status: ${res.status}).`);
      }

      const resData = await res.json();

      // Grava logs estruturados para exibição no painel administrativo
      setSerproLog({
        url: '/api/consulta-chave',
        method: 'POST',
        payload: { chave },
        response: resData,
        timestamp: new Date().toISOString()
      });

      // Sucesso! Dados identificados através do banco de dados simulado
      setRecipientName(resData.nome);
      setRecipientBank(resData.banco);
      setRecipientAgency(resData.agencia);
      setRecipientAccount(resData.conta);
      setIsKeyIdentified(true);
      setValidationError('');
    } catch (err: any) {
      console.error('Erro na identificação da chave Pix:', err);
      setValidationError(err.message || 'Não foi possível identificar esta chave Pix.');
      setIsKeyIdentified(false);
    } finally {
      setIsSearchingCPF(false);
    }
  };

  const handleScanPreset = (preset: {
    name: string;
    bank: string;
    agency: string;
    account: string;
    cpf: string;
    amount?: string;
  }) => {
    playBeep();
    setScanSuccessOverlay(true);
    
    setTimeout(() => {
      setRecipientName(preset.name);
      setRecipientBank(preset.bank);
      setRecipientAgency(preset.agency);
      setRecipientAccount(preset.account);
      setPixKeyInput(preset.cpf);
      setIsKeyIdentified(true);
      setValidationError('');
      
      if (preset.amount) {
        setAmountStr(preset.amount);
      } else {
        setAmountStr('150.00'); // Default if unspecified
      }
      
      setScanSuccessOverlay(false);
      stopCamera();
      
      // Auto advance to amount selection step so they can check
      setPixStep('amount');
    }, 800);
  };

  // Amount step states
  const [amountStr, setAmountStr] = useState('150.00');
  
  // Password step states
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Auto-format CPF input if digits are typed
  const formatCpf = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      let formatted = numbers;
      if (numbers.length > 3) formatted = `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
      if (numbers.length > 6) formatted = `${formatted.slice(0, 7)}.${formatted.slice(7)}`;
      if (numbers.length > 9) formatted = `${formatted.slice(0, 11)}-${formatted.slice(11)}`;
      return formatted;
    }
    return value;
  };

  // Auto-format Phone input
  const formatPhone = (val: string) => {
    const numbers = val.replace(/\D/g, '');
    let formatted = numbers;
    if (numbers.length > 0) {
      formatted = `(${numbers.slice(0, 2)}`;
    }
    if (numbers.length > 2) {
      formatted = `${formatted}) ${numbers.slice(2, 7)}`;
    }
    if (numbers.length > 7) {
      formatted = `${formatted}-${numbers.slice(7, 11)}`;
    }
    return formatted;
  };

  const handleKeyInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const rawValue = e.target.value;
    if (selectedKeyType === 'cpf') {
      setPixKeyInput(formatCpf(rawValue));
    } else if (selectedKeyType === 'telefone') {
      setPixKeyInput(formatPhone(rawValue));
    } else {
      setPixKeyInput(rawValue);
    }
    setValidationError('');
  };

  // Reset userHasEdited when key type changes
  useEffect(() => {
    setUserHasEdited(false);
  }, [selectedKeyType]);

  // Reset userHasEdited when Pix key is cleared
  useEffect(() => {
    if (!pixKeyInput.trim()) {
      setUserHasEdited(false);
    }
  }, [pixKeyInput]);

  // Perform Pix identification lookup
  useEffect(() => {
    const cleaned = pixKeyInput.trim();
    if (!cleaned) {
      setIsKeyIdentified(false);
      return;
    }

    if (userHasEdited) {
      return;
    }

    const normalized = cleaned.toLowerCase();
    const cleanDigits = cleaned.replace(/\D/g, '');

    // A. Pix Cópia e Cola Parsing Integration
    if (selectedKeyType === 'copiacola') {
      if (cleaned.startsWith('000201') || cleaned.includes('br.gov.bcb.pix')) {
        const parsed = parsePixEMV(cleaned);
        if (parsed.key) {
          setRecipientName(parsed.name || 'JULIANA MELO MELO');
          setRecipientBank(parsed.key.includes('@') ? 'C6 Bank S.A.' : 'NU PAGAMENTOS - IP');
          setRecipientAgency('0001');
          setRecipientAccount('1234567-8');
          setIsKeyIdentified(true);
          
          if (parsed.amount) {
            setAmountStr(parsed.amount);
          }
          return;
        }
      }
    }

    // B. CPF Lookup via Serpro / Local cache
    if (selectedKeyType === 'cpf' && cleanDigits.length === 11) {
      if (lastSearchedCPF !== cleanDigits && !isSearchingCPF) {
        setLastSearchedCPF(cleanDigits);
        consultarChavePix(cleanDigits);
      }
      return;
    }

    // C. Phone / Celular Lookup via Serpro / Local cache
    if (selectedKeyType === 'telefone' && cleanDigits.length >= 10) {
      if (lastSearchedCPF !== cleanDigits && !isSearchingCPF) {
        setLastSearchedCPF(cleanDigits);
        consultarChavePix(cleanDigits);
      }
      return;
    }

    // 2. Try finding exact match by CPF or Name in usersDatabase first
    const matched = usersDatabase.find(u => 
      u.cpf.replace(/\D/g, '') === cleanDigits ||
      u.cpf === cleaned ||
      u.name.toLowerCase().includes(normalized)
    );

    if (matched) {
      setRecipientName(matched.name);
      setRecipientBank(matched.bankName);
      setRecipientAgency(matched.agency);
      setRecipientAccount(matched.accountNumber);
      setIsKeyIdentified(true);
      return;
    }

    // 3. Specific Juliana Melo Melo lookup (Exact match for the uploaded receipt!)
    const isJuliana = 
      normalized.includes('juliana') || 
      normalized.includes('melo') || 
      cleanDigits.includes('443695') ||
      cleanDigits === '12344369500';

    if (isJuliana) {
      setRecipientName('JULIANA MELO MELO');
      setRecipientBank('PAGSEGURO INTERNET S.A.');
      setRecipientAgency('0001');
      setRecipientAccount('1234567-8');
      setIsKeyIdentified(true);
      return;
    }

    // 4. Specific Pedro Gabriel dos Santos Silva lookup
    const isPedro = 
      normalized.includes('pedro') || 
      normalized.includes('gabriel') || 
      cleanDigits.includes('542545') ||
      cleanDigits === '11054254524';

    if (isPedro) {
      setRecipientName('PEDRO GABRIEL DOS SANTOS SILVA');
      setRecipientBank('NU PAGAMENTOS - IP');
      setRecipientAgency('0001');
      setRecipientAccount('11054254-5');
      setIsKeyIdentified(true);
      return;
    }

    // 5. Specific Francisco lookup (as requested and shown on the Nu receipt)
    const isFrancisco = 
      normalized.includes('francisco') || 
      normalized.includes('manoel') || 
      cleanDigits.includes('965814') ||
      cleanDigits.includes('74988440897') ||
      cleaned === '+5574988440897' ||
      cleanDigits === '74988440897';

    if (isFrancisco) {
      setRecipientName('FRANCISCO MANOEL DA SILVA');
      setRecipientBank('Banco Bradesco S.A.');
      setRecipientAgency('0001');
      setRecipientAccount('98844089-7');
      setIsKeyIdentified(true);
      return;
    }

    // 6. If they enter a long string with spaces (assuming a Full Name), let's auto-identify it!
    if (cleaned.length > 5 && cleaned.includes(' ')) {
      setRecipientName(cleaned.toUpperCase());
      setRecipientBank('NU PAGAMENTOS - IP');
      setRecipientAgency('0001');
      setRecipientAccount('1234567-8');
      setIsKeyIdentified(true);
      return;
    }

    // 7. If they type a key, but it's not fully identified, let's still auto-identify with placeholder details
    if (cleaned.length >= 4) {
      setRecipientName('BENEFICIÁRIO IDENTIFICADO');
      setRecipientBank('NU PAGAMENTOS - IP');
      setRecipientAgency('0001');
      setRecipientAccount('443210-9');
      setIsKeyIdentified(true);
      return;
    }

    // Otherwise, keep as unidentified so they can customize
    setIsKeyIdentified(false);
  }, [pixKeyInput, selectedKeyType, usersDatabase, banks, lastSearchedCPF, isSearchingCPF]);

  const handleAdvanceFromKey = () => {
    if (!pixKeyInput.trim() && activeTab !== 'transfer') {
      setValidationError('Por favor, informe uma Chave Pix ou CPF para identificação.');
      return;
    }
    if (!recipientName.trim()) {
      setValidationError('Por favor, informe o Nome Completo do destinatário.');
      return;
    }
    if (!recipientAccount.trim()) {
      setValidationError('Por favor, informe o Número da Conta do destinatário.');
      return;
    }
    setValidationError('');
    setPixStep('amount');
  };

  const handleAdvanceFromAmount = () => {
    const val = parseFloat(amountStr);
    if (isNaN(val) || val <= 0) {
      setValidationError('Por favor, insira um valor válido para transferência.');
      return;
    }

    if (val > user.balance) {
      setValidationError(`Saldo insuficiente. Seu saldo atual é de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(user.balance)}`);
      return;
    }

    setValidationError('');
    setPixStep('password');
  };

  const handleConfirmPassword = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (passwordInput !== user.transactionPassword) {
      setPasswordError('Senha incorreta! Tente novamente.');
      return;
    }

    setPasswordError('');
    setPixStep('sending');

    // Simulate sending sequence
    setTimeout(() => {
      setPixStep('success');
      
      setTimeout(() => {
        const finalRecipient: BankRecipient = {
          name: recipientName,
          cpf: pixKeyInput.includes('.') ? pixKeyInput : '***.***.***-**',
          bankName: recipientBank,
          agency: recipientAgency,
          accountNumber: recipientAccount,
          pixKey: activeTab === 'transfer' ? '' : pixKeyInput
        };
        onSendPix(parseFloat(amountStr), activeTab === 'transfer' ? 'Transferência' : 'Pix', finalRecipient);
      }, 1000);
    }, 1500);
  };

  const handleQuickAmount = (val: number) => {
    setAmountStr(val.toFixed(2));
  };

  return (
    <div className="flex-1 flex flex-col bg-white text-neutral-800">
      
      {/* View Header */}
      <div className="px-4 pt-4 pb-2.5 flex items-center justify-between bg-white border-b border-neutral-100 sticky top-0 z-20">
        <button 
          onClick={() => {
            if (pixStep === 'amount') setPixStep('key');
            else if (pixStep === 'password') setPixStep('amount');
            else if (pixStep === 'key') onBack();
          }}
          className="p-2 -ml-2 rounded-full hover:bg-neutral-100 text-neutral-600 transition-colors"
          disabled={pixStep === 'sending' || pixStep === 'success'}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-bold text-sm tracking-tight text-neutral-800">
          {pixStep === 'key' && 'Identificar Destinatário'}
          {pixStep === 'amount' && 'Valor do Pix'}
          {pixStep === 'password' && 'Confirmar com Senha'}
          {pixStep === 'sending' && 'Segurança Ativa'}
          {pixStep === 'success' && 'Sucesso'}
        </span>
        <button className="p-2 rounded-full hover:bg-neutral-100 text-neutral-600 transition-colors">
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>

      {/* STEP 1: KEY AND USER IDENTIFICATION */}
      {pixStep === 'key' && (
        <div className="flex-1 flex flex-col p-5 gap-4">
          <style>{`
            @keyframes scanLineAnimation {
              0% { top: 4%; }
              50% { top: 94%; }
              100% { top: 4%; }
            }
            .scanner-laser {
              animation: scanLineAnimation 2.2s ease-in-out infinite;
            }
          `}</style>
          
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-extrabold text-neutral-900 font-display">Como você deseja transferir?</h3>
            <p className="text-xs text-neutral-500 font-medium">Selecione uma chave Pix salva ou use a câmera para ler um QR Code.</p>
          </div>

          {/* Interactive Navigation Tabs */}
          <div className="flex border-b border-neutral-100 select-none">
            <button
              type="button"
              onClick={() => {
                setValidationError('');
                setActiveTab('key');
                stopCamera();
              }}
              className={`flex-1 pb-3 text-center text-[11px] font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'key'
                  ? 'border-[#830AD1] text-[#830AD1] font-extrabold'
                  : 'border-transparent text-neutral-400 hover:text-neutral-600'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              Chave Pix
            </button>
            <button
              type="button"
              onClick={() => {
                setValidationError('');
                setActiveTab('transfer');
                stopCamera();
                setPixKeyInput('');
                setIsKeyIdentified(false);
              }}
              className={`flex-1 pb-3 text-center text-[11px] font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'transfer'
                  ? 'border-[#830AD1] text-[#830AD1] font-extrabold'
                  : 'border-transparent text-neutral-400 hover:text-neutral-600'
              }`}
            >
              <Landmark className="w-3.5 h-3.5" />
              Agência e Conta
            </button>
            <button
              type="button"
              onClick={() => {
                setValidationError('');
                setActiveTab('qrcode');
                startCamera();
              }}
              className={`flex-1 pb-3 text-center text-[11px] font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'qrcode'
                  ? 'border-[#830AD1] text-[#830AD1] font-extrabold'
                  : 'border-transparent text-neutral-400 hover:text-neutral-600'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              Ler QR Code
            </button>
          </div>

          {activeTab === 'key' && (
            /* Pix Key Search Input */
            <div className="flex flex-col gap-3">
              {/* Key Type Pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar select-none">
                {[
                  { id: 'cpf', label: 'CPF' },
                  { id: 'telefone', label: 'Celular' },
                  { id: 'copiacola', label: 'Cópia e Cola' },
                  { id: 'outros', label: 'E-mail / Outro' }
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setSelectedKeyType(t.id as any);
                      setPixKeyInput('');
                      setValidationError('');
                      setIsKeyIdentified(false);
                    }}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                      selectedKeyType === t.id
                        ? 'bg-[#830AD1] text-white shadow-sm scale-[1.02]'
                        : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200/60'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  {selectedKeyType === 'cpf' && 'CPF do Destinatário'}
                  {selectedKeyType === 'telefone' && 'Celular do Destinatário'}
                  {selectedKeyType === 'copiacola' && 'Código Pix Cópia e Cola'}
                  {selectedKeyType === 'outros' && 'Chave E-mail ou Aleatória'}
                </label>
                
                <div className="relative flex items-center w-full">
                  {selectedKeyType === 'copiacola' ? (
                    <textarea 
                      value={pixKeyInput}
                      onChange={handleKeyInputChange}
                      placeholder="Cole o código Pix completo (começa com 000201...)"
                      rows={3}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 focus:border-[#830AD1] focus:outline-none rounded-xl text-xs font-bold text-neutral-900 transition-all font-mono placeholder:font-sans resize-none"
                    />
                  ) : (
                    <input 
                      type="text" 
                      value={pixKeyInput}
                      onChange={handleKeyInputChange}
                      placeholder={
                        selectedKeyType === 'cpf' ? 'Ex: 110.542.545-24' :
                        selectedKeyType === 'telefone' ? 'Ex: (74) 98844-0897' :
                        'Ex: pix@empresa.com.br'
                      }
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 focus:border-[#830AD1] focus:outline-none rounded-xl text-sm font-bold text-neutral-900 transition-all font-mono placeholder:font-sans"
                    />
                  )}
                </div>
              </div>

              {isSearchingCPF && (
                <div className="flex items-center gap-2 bg-purple-50 text-[#830AD1] border border-purple-100 p-2.5 rounded-xl text-[11px] font-bold mt-1 animate-pulse">
                  <span className="w-4 h-4 border-2 border-t-transparent border-[#830AD1] rounded-full animate-spin shrink-0" />
                  <span>Consultando dados cadastrais na Receita Federal (Serpro API v2)...</span>
                </div>
              )}

              {!isSearchingCPF && serproLog && (
                <div className="flex flex-col gap-1.5 mt-1.5">
                  <div className="flex items-center justify-between bg-emerald-50 text-emerald-800 border border-emerald-100/40 p-2.5 rounded-xl text-[11px] font-bold">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Nome consultado na Receita Federal via Serpro</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setShowSerproLog(!showSerproLog)}
                      className="text-[#830AD1] hover:underline text-[10px] font-extrabold uppercase shrink-0 cursor-pointer"
                    >
                      {showSerproLog ? 'Ocultar JSON' : 'Ver Log JSON'}
                    </button>
                  </div>
                  
                  {showSerproLog && (
                    <div className="bg-neutral-900 text-neutral-200 rounded-xl p-3 font-mono text-[9px] overflow-x-auto border border-neutral-800 shadow-inner max-h-48 leading-relaxed">
                      <div className="flex justify-between text-neutral-400 border-b border-neutral-800 pb-1 mb-1.5">
                        <span>POST {serproLog.url}</span>
                        <span>{new Date(serproLog.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div className="text-emerald-400 font-bold mb-1">// REQUEST HEADERS:</div>
                      <div>{JSON.stringify(serproLog.headers, null, 2)}</div>
                      <div className="text-emerald-400 font-bold mt-2 mb-1">// REQUEST PAYLOAD:</div>
                      <div>{JSON.stringify(serproLog.payload, null, 2)}</div>
                      <div className="text-purple-400 font-bold mt-2 mb-1">// RESPONSE 200 OK:</div>
                      <pre>{JSON.stringify(serproLog.response, null, 2)}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'transfer' && (
            /* Agency & Account Transfer Input */
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  CPF ou CNPJ do Favorecido (Identificação automática)
                </label>
                
                <div className="relative flex items-center w-full">
                  <input 
                    type="text" 
                    value={pixKeyInput}
                    onChange={(e) => {
                      setSelectedKeyType('cpf');
                      handleKeyInputChange(e);
                    }}
                    placeholder="Ex: 110.542.545-24"
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 focus:border-[#830AD1] focus:outline-none rounded-xl text-sm font-bold text-neutral-900 transition-all font-mono placeholder:font-sans"
                  />
                </div>
                <p className="text-[10.5px] text-neutral-500 leading-normal">
                  💡 <strong>Identificação inteligente de contas:</strong> Digite o CPF acima para buscar os dados oficiais da conta do favorecido de forma automática! Caso não possua, basta digitar os dados diretamente nos campos bancários abaixo.
                </p>
              </div>

              {isSearchingCPF && (
                <div className="flex items-center gap-2 bg-purple-50 text-[#830AD1] border border-purple-100 p-2.5 rounded-xl text-[11px] font-bold mt-1 animate-pulse">
                  <span className="w-4 h-4 border-2 border-t-transparent border-[#830AD1] rounded-full animate-spin shrink-0" />
                  <span>Buscando e identificando conta via BrasilAPI / Serpro...</span>
                </div>
              )}

              {!isSearchingCPF && serproLog && (
                <div className="flex flex-col gap-1.5 mt-1.5">
                  <div className="flex items-center justify-between bg-emerald-50 text-emerald-800 border border-emerald-100/40 p-2.5 rounded-xl text-[11px] font-bold">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Conta localizada e identificada automaticamente!</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'qrcode' && (
            /* QR Code Scanner Interface */
            <div className="flex flex-col gap-3.5">
              
              {/* Camera Area Frame */}
              <div className="relative aspect-video w-full rounded-2xl bg-neutral-950 border border-neutral-800 overflow-hidden flex flex-col items-center justify-center text-white select-none shadow-lg">
                
                {useCamera ? (
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-center p-4 z-10">
                    <QrCode className="w-10 h-10 text-neutral-500 animate-pulse" />
                    <span className="text-[11px] font-bold text-neutral-400">Leitor de QR Code</span>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        type="button"
                        onClick={startCamera}
                        className="px-3 py-1.5 bg-[#830AD1] hover:bg-[#7209B7] text-white rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer shadow-md"
                      >
                        <Camera className="w-3 h-3" />
                        Ativar Câmera
                      </button>
                      <label
                        htmlFor="qr-file-upload"
                        className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer shadow-md"
                      >
                        <Upload className="w-3 h-3" />
                        Upload QR
                      </label>
                      <input 
                        type="file" 
                        id="qr-file-upload" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                        className="hidden" 
                      />
                    </div>
                  </div>
                )}

                {/* Scan HUD Overlay brackets */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-32 h-32 border border-white/20 rounded-2xl relative flex items-center justify-center">
                    
                    {/* Laser scanning beam */}
                    <div className="absolute left-0 w-full h-0.5 bg-purple-400 shadow-[0_0_8px_#830AD1] scanner-laser" />
                    
                    {/* Retro styling corner borders */}
                    <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-4 border-l-4 border-[#830AD1]" />
                    <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-4 border-r-4 border-[#830AD1]" />
                    <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-4 border-l-4 border-[#830AD1]" />
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-4 border-r-4 border-[#830AD1]" />
                  </div>
                </div>

                {/* Scanning Beep Flash Effect overlay */}
                {scanSuccessOverlay && (
                  <div className="absolute inset-0 bg-emerald-500/40 z-20 flex flex-col items-center justify-center animate-fade-in backdrop-blur-[1px]">
                    <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg animate-scale-up">
                      <CheckCircle2 className="w-7 h-7 text-white stroke-[3]" />
                    </div>
                    <span className="mt-2 text-[10px] font-extrabold tracking-widest uppercase bg-black/55 px-2.5 py-1 rounded-full text-white">
                      QR Code Identificado!
                    </span>
                  </div>
                )}
              </div>

              {cameraError && (
                <div className="text-[10px] text-purple-700 bg-purple-50/50 border border-purple-100 p-2 rounded-xl leading-normal text-center">
                  💡 {cameraError}
                </div>
              )}

            </div>
          )}

          {/* Identified / Manual Recipient Fields */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
              🏦 Dados Bancários do Destinatário
            </span>

            {serproLog && (
              <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200/50 flex items-center gap-2.5 animate-fade-in">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider leading-none">
                    Nome Oficial CPF via SERPRO
                  </span>
                  <span className="text-[11px] text-emerald-950 font-semibold mt-1 leading-tight">
                    {recipientName} (Situação: REGULAR)
                  </span>
                </div>
              </div>
            )}

            <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200/50 flex flex-col gap-3">
              <div className="flex justify-between items-center bg-purple-50/60 px-3 py-2 rounded-xl border border-purple-100/40">
                <span className="text-[10px] text-purple-800 font-extrabold uppercase tracking-wide">
                  🔍 Identificador de Dados Bancários
                </span>
                <span className="text-[9px] text-purple-500 font-bold font-mono">BrasilAPI Ativa</span>
              </div>
              
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase">Nome Completo</label>
                <input 
                  type="text" 
                  value={recipientName}
                  onChange={(e) => {
                    setRecipientName(e.target.value);
                    setUserHasEdited(true);
                  }}
                  placeholder="Nome do destinatário"
                  className="bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold text-neutral-800 focus:outline-none focus:border-[#830AD1]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1 flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase">Cód. Banco</label>
                  <input 
                    type="text" 
                    pattern="\d*"
                    maxLength={4}
                    value={bankSearchCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setBankSearchCode(val);
                      setUserHasEdited(true);
                      if (val.length >= 1) {
                        handleLookupBankByCode(val);
                      }
                    }}
                    placeholder="Ex: 260"
                    className="bg-white border border-neutral-200 rounded-xl px-2 py-2 text-xs font-bold text-neutral-800 focus:outline-none focus:border-[#830AD1] text-center font-mono w-full"
                  />
                </div>
                
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase">Selecione o Banco</label>
                  <select
                    value={recipientBank}
                    onChange={(e) => {
                      setRecipientBank(e.target.value);
                      setUserHasEdited(true);
                      // Sync search code field if possible
                      const matched = banks.find(b => b.fullName === e.target.value || b.name === e.target.value);
                      if (matched && matched.code !== null && matched.code !== undefined) {
                        setBankSearchCode(matched.code.toString());
                      }
                    }}
                    className="bg-white border border-neutral-200 rounded-xl px-2 py-2 text-xs font-bold text-neutral-800 focus:outline-none focus:border-[#830AD1] truncate"
                  >
                    {banks.length > 0 ? (
                      banks.map(b => (
                        <option key={b.code || b.name} value={b.fullName || b.name}>
                          {b.code !== null ? `${String(b.code).padStart(3, '0')} - ` : ''}{b.fullName || b.name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Nu Pagamentos S.A.">Nu Pagamentos S.A.</option>
                        <option value="Itaú Unibanco S.A.">Itaú Unibanco S.A.</option>
                        <option value="Banco Bradesco S.A.">Banco Bradesco S.A.</option>
                        <option value="Banco do Brasil S.A.">Banco do Brasil S.A.</option>
                        <option value="Caixa Econômica Federal">Caixa Econômica Federal</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {bankSearchError && (
                <span className="text-[9px] text-amber-600 font-bold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/50 self-start">
                  ⚠️ {bankSearchError}
                </span>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase">Agência</label>
                  <input 
                    type="text" 
                    value={recipientAgency}
                    onChange={(e) => {
                      setRecipientAgency(e.target.value);
                      setUserHasEdited(true);
                    }}
                    placeholder="0001"
                    className="bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold text-neutral-800 focus:outline-none focus:border-[#830AD1] font-mono"
                  />
                </div>
                
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase">Conta Corrente</label>
                  <input 
                    type="text" 
                    value={recipientAccount}
                    onChange={(e) => {
                      setRecipientAccount(e.target.value);
                      setUserHasEdited(true);
                    }}
                    placeholder="Ex: 12345-6"
                    className="bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold text-neutral-800 focus:outline-none focus:border-[#830AD1] font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Validation Error Banner */}
          {validationError && (
            <div className="text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs font-semibold">
              {validationError}
            </div>
          )}

          {/* Action button */}
          <button 
            onClick={handleAdvanceFromKey}
            className="w-full bg-[#830AD1] hover:bg-[#7209B7] text-white py-3.5 rounded-xl font-bold text-sm tracking-wide shadow-md active:scale-[0.99] transition-all mt-auto flex items-center justify-center gap-2 cursor-pointer"
          >
            Continuar para Valor
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STEP 2: AMOUNT SELECTION */}
      {pixStep === 'amount' && (
        <div className="flex-1 flex flex-col p-5 gap-6">
          
          {/* Balance disclaimer */}
          <div className="bg-neutral-50 px-4 py-3 rounded-xl border border-neutral-200/50 flex justify-between items-center text-xs">
            <span className="text-neutral-500 font-bold">Seu saldo disponível</span>
            <span className="font-extrabold text-[#830AD1]">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(user.balance)}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Qual o valor do Pix?</label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-2xl font-extrabold text-neutral-400">R$</span>
              <input 
                type="number" 
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0,00"
                className="w-full pl-14 pr-4 py-4 bg-neutral-50 border border-neutral-200 focus:border-[#830AD1] focus:outline-none rounded-xl text-3xl font-extrabold text-neutral-900 font-display transition-all"
                autoFocus
              />
            </div>

            {/* Quick pre-filled amount pills */}
            <div className="flex gap-2 mt-1 flex-wrap">
              {[20, 50, 150, 500, 1000].map((amt) => (
                <button 
                  key={amt}
                  onClick={() => handleQuickAmount(amt)}
                  className="bg-neutral-100 hover:bg-neutral-200/80 text-xs font-bold text-neutral-600 px-3 py-1.5 rounded-full transition-all active:scale-95"
                >
                  R$ {amt}
                </button>
              ))}
            </div>
          </div>

          {/* Summary Target Recipient Banner */}
          <div className="bg-[#830AD1]/5 rounded-2xl p-4 border border-[#830AD1]/15 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#830AD1]/10 flex items-center justify-center text-[#830AD1]">
              <User className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Destinatário Selecionado</span>
              <span className="text-sm font-bold text-neutral-800 truncate mt-0.5">{recipientName}</span>
              <span className="text-xs text-neutral-500 font-mono">
                {recipientBank} • Cc {recipientAccount}
              </span>
            </div>
          </div>

          {validationError && (
            <div className="text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs font-semibold">
              {validationError}
            </div>
          )}

          {/* Action Button */}
          <button 
            onClick={handleAdvanceFromAmount}
            className="w-full bg-[#830AD1] hover:bg-[#7209B7] text-white py-3.5 rounded-xl font-bold text-sm tracking-wide shadow-md active:scale-[0.99] transition-all mt-auto flex items-center justify-center gap-2 cursor-pointer"
          >
            Confirmar Envio de R$ {parseFloat(amountStr || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STEP 3: TRANSACTION PASSWORD VERIFICATION */}
      {pixStep === 'password' && (
        <div className="flex-1 flex flex-col p-5 gap-6 justify-center">
          
          <div className="flex flex-col items-center text-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-[#830AD1]/10 flex items-center justify-center text-[#830AD1]">
              <KeyRound className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-neutral-900 font-display">Digite sua senha Pix</h3>
            <p className="text-xs text-neutral-500 max-w-[260px]">
              Para finalizar a transferência de <span className="font-bold text-neutral-800">R$ {parseFloat(amountStr).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>, insira sua senha de transação de 4 dígitos.
            </p>
          </div>

          <form onSubmit={handleConfirmPassword} className="flex flex-col gap-4">
            <div className="flex justify-center gap-3">
              {[0, 1, 2, 3].map((index) => {
                const char = passwordInput[index] || '';
                return (
                  <div 
                    key={index}
                    className={`w-12 h-14 rounded-2xl border-2 flex items-center justify-center text-xl font-black transition-all ${
                      char ? 'border-[#830AD1] bg-purple-50 text-[#830AD1]' : 'border-neutral-200 bg-neutral-50'
                    }`}
                  >
                    {char ? '•' : ''}
                  </div>
                );
              })}
            </div>

            {/* Hidden real input for accessibility and mobile keypad activation */}
            <input 
              type="password" 
              maxLength={4}
              pattern="\d*"
              value={passwordInput}
              onChange={(e) => {
                const numbers = e.target.value.replace(/\D/g, '');
                setPasswordInput(numbers);
                setPasswordError('');
              }}
              className="opacity-0 absolute h-0 w-0"
              autoFocus
              id="password-real-input"
            />

            {/* Custom Interactive Numerical Keypad */}
            <div className="grid grid-cols-3 gap-2 max-w-[260px] mx-auto mt-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    if (passwordInput.length < 4) {
                      setPasswordInput(prev => prev + num);
                      setPasswordError('');
                    }
                  }}
                  className="w-16 h-12 bg-neutral-50 hover:bg-neutral-100 rounded-xl font-bold text-lg text-neutral-800 flex items-center justify-center transition-all active:scale-95"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPasswordInput('')}
                className="w-16 h-12 text-xs font-bold text-neutral-400 flex items-center justify-center"
              >
                Limpar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (passwordInput.length < 4) {
                    setPasswordInput(prev => prev + '0');
                    setPasswordError('');
                  }
                }}
                className="w-16 h-12 bg-neutral-50 hover:bg-neutral-100 rounded-xl font-bold text-lg text-neutral-800 flex items-center justify-center transition-all active:scale-95"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => setPasswordInput(prev => prev.slice(0, -1))}
                className="w-16 h-12 text-xs font-bold text-rose-500 flex items-center justify-center"
              >
                Apagar
              </button>
            </div>

            {passwordError && (
              <div className="text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-xs font-bold text-center">
                {passwordError}
              </div>
            )}

            {/* Tip reminding the user of their custom password */}
            <div className="bg-amber-50 rounded-xl p-3 border border-amber-200/50 text-center text-[10px] text-amber-800 font-bold uppercase tracking-wider">
              🔑 Dica de simulação: Sua Senha Pix é <span className="font-extrabold underline text-sm ml-0.5">{user.transactionPassword}</span>
            </div>

            <button
              type="submit"
              className="w-full bg-[#830AD1] hover:bg-[#7209B7] text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider mt-4 cursor-pointer flex items-center justify-center gap-2"
              disabled={passwordInput.length < 4}
            >
              <ShieldCheck className="w-4 h-4" />
              Confirmar Transação Pix
            </button>
          </form>
        </div>
      )}

      {/* STEP 4: SENDING / PROCESSING SEQUENCE */}
      {pixStep === 'sending' && (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#830AD1] text-white p-6 gap-6 relative overflow-hidden animate-fade-in">
          <div className="absolute w-80 h-80 rounded-full border border-white/5 animate-ping opacity-40"></div>
          <div className="absolute w-56 h-56 rounded-full border border-white/10 animate-pulse"></div>

          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full border-4 border-white/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-white border-r-white border-l-transparent border-b-transparent animate-spin"></div>
            <div className="absolute inset-2 flex items-center justify-center text-white/80">
              <ShieldCheck className="w-8 h-8" />
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 text-center max-w-[280px]">
            <span className="text-xl font-extrabold font-display tracking-tight leading-6">
              Processando envio...
            </span>
            <span className="text-xs text-white/70 font-semibold tracking-wide flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Segurança Nu ativa
            </span>
          </div>
        </div>
      )}

      {/* STEP 5: SUCCESS SEQUENCE */}
      {pixStep === 'success' && (
        <div className="flex-1 flex flex-col items-center justify-center bg-white text-neutral-900 p-6 gap-5">
          <div className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-500/20 flex items-center justify-center text-emerald-500 animate-scale-up">
            <svg className="w-10 h-10 stroke-current stroke-3 fill-none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div className="flex flex-col items-center gap-1.5 text-center">
            <span className="text-2xl font-extrabold text-neutral-900 font-display tracking-tight">
              Pix enviado!
            </span>
            <span className="text-sm font-semibold text-neutral-500">
              Transferência realizada com sucesso.
            </span>
          </div>
        </div>
      )}

    </div>
  );
}
