import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Inicialização do cliente Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
let supabase: any = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log("[SUPABASE] Cliente inicializado com sucesso.");
  } catch (err: any) {
    console.error("[SUPABASE] Falha ao inicializar o cliente Supabase:", err.message);
  }
}

// Controle de disponibilidade de tabelas no Supabase para evitar chamadas redundantes e logs de erro repetitivos
const tableStatus = {
  comprovantes: true,
  authorized_cpfs: true,
  serpro_database: true,
  bank_users: true
};

// Estruturas de dados em memória para simulação, cache e logs
interface LogEntry {
  id: string;
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR";
  category: "OAUTH2" | "SERPRO" | "BRASIL_API" | "SYSTEM";
  message: string;
  details?: any;
}

const serverLogs: LogEntry[] = [];

function addLog(level: "INFO" | "WARN" | "ERROR", category: LogEntry["category"], message: string, details?: any) {
  const entry: LogEntry = {
    id: "log_" + Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toISOString(),
    level,
    category,
    message,
    details
  };
  serverLogs.unshift(entry);
  if (serverLogs.length > 200) serverLogs.pop(); // Mantém os últimos 200 logs
  console.log(`[${entry.timestamp}] [${entry.level}] [${entry.category}] ${entry.message}`, details ? JSON.stringify(details) : "");
}

export interface BankUser {
  name: string;
  cpf: string;
  agency: string;
  accountNumber: string;
  bankName: string;
  balance: number;
  creditCardInvoice: number;
  creditCardLimit: number;
  password?: string;
  transactionPassword?: string;
}

// Banco de dados de usuários persistente / simulado
let serverUsers: BankUser[] = [
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

// 1. Banco de CPFs Autorizados pelo operador da aplicação (Conforme especificado)
// Inicializado com alguns CPFs de teste correspondentes aos usuários do aplicativo Nubank
const authorizedCPFs = new Set<string>([
  "11054254524", // PEDRO GABRIEL DOS SANTOS SILVA
  "00096581400", // FRANCISCO MANOEL DA SILVA
  "23456789012", // Nathan Henrique Alves Ferreira
  "88877766655", // Gabriela M Lima
  "12344369500", // JULIANA MELO MELO
  "12345678900", // BYEL SAINTS
  "00644369507"  // MARIA SIDNEY FERREIRA DOS SANTOS MARTINS
]);

// Banco de dados simulado de dados oficiais da Receita Federal (SERPRO) para CPFs autorizados
const serproDatabase: Record<string, { nome: string; dataInscricao: string; dataAtualizacao: string; situacao: string; banco?: string; agencia?: string; conta?: string }> = {
  "11054254524": {
    nome: "PEDRO GABRIEL DOS SANTOS SILVA",
    dataInscricao: "2010-04-12",
    dataAtualizacao: "2026-07-07",
    situacao: "REGULAR",
    banco: "Banco do Brasil S.A.",
    agencia: "0001",
    conta: "43256-8"
  },
  "00644369507": {
    nome: "MARIA SIDNEY FERREIRA DOS SANTOS MARTINS",
    dataInscricao: "2009-02-15",
    dataAtualizacao: "2026-07-07",
    situacao: "REGULAR",
    banco: "PagSeguro Internet S.A.",
    agencia: "0001",
    conta: "1234567-8"
  },
  "00096581400": {
    nome: "FRANCISCO MANOEL DA SILVA",
    dataInscricao: "1994-08-30",
    dataAtualizacao: "2026-07-07",
    situacao: "REGULAR",
    banco: "Banco Bradesco S.A.",
    agencia: "0001",
    conta: "98844089-7"
  },
  "23456789012": {
    nome: "NATHAN HENRIQUE ALVES FERREIRA",
    dataInscricao: "2015-05-18",
    dataAtualizacao: "2026-07-07",
    situacao: "REGULAR",
    banco: "Banco Inter S.A.",
    agencia: "0001",
    conta: "345678-9"
  },
  "88877766655": {
    nome: "GABRIELA M LIMA",
    dataInscricao: "2012-11-22",
    dataAtualizacao: "2026-07-07",
    situacao: "REGULAR",
    banco: "Itaú Unibanco S.A.",
    agencia: "0001",
    conta: "43210-9"
  },
  "12344369500": {
    nome: "JULIANA MELO MELO",
    dataInscricao: "2008-01-15",
    dataAtualizacao: "2026-07-07",
    situacao: "REGULAR",
    banco: "PagSeguro Internet S.A.",
    agencia: "0001",
    conta: "1234567-8"
  },
  "12345678900": {
    nome: "BYEL SAINTS",
    dataInscricao: "2006-03-24",
    dataAtualizacao: "2026-07-07",
    situacao: "REGULAR",
    banco: "C6 Bank S.A.",
    agencia: "0001",
    conta: "57262657-9"
  }
};

// 2. Cache de Tokens OAuth2 do SERPRO
interface OAuth2TokenCache {
  accessToken: string | null;
  expiresAt: number; // timestamp ms
}

const tokenCache: OAuth2TokenCache = {
  accessToken: null,
  expiresAt: 0
};

// Gerador automático de tokens OAuth2 com caching (Simulando o fluxo ConectaGov do SERPRO)
function getSerproToken(): string {
  const now = Date.now();
  // Se o token existe e ainda está válido (com margem de 10s de segurança), retorna-o
  if (tokenCache.accessToken && tokenCache.expiresAt > now + 10000) {
    addLog("INFO", "OAUTH2", "Token OAuth2 do SERPRO recuperado do cache do servidor.", {
      expiresInSeconds: Math.round((tokenCache.expiresAt - now) / 1000)
    });
    return tokenCache.accessToken;
  }

  // Caso contrário, gera um novo token simulação OAuth2 (com credenciais do .env ou padrão)
  const clientId = process.env.SERPRO_CLIENT_ID || "nubank_sandbox_client_id_2026";
  const clientSecret = process.env.SERPRO_CLIENT_SECRET || "nubank_sandbox_secret_2026";
  
  addLog("INFO", "OAUTH2", "Token do cache expirado ou inexistente. Solicitando novo token via fluxo OAuth2 Client Credentials...", {
    clientId,
    grant_type: "client_credentials"
  });

  // Gera um token simulado robusto (pode ser validado como JWT se necessário)
  const newToken = "serpro_jwt_token_" + Math.random().toString(36).substring(2) + "." + Buffer.from(JSON.stringify({
    iss: "serpro",
    sub: clientId,
    exp: Math.floor((now + 3600000) / 1000),
    scope: "consulta-cpf-v2"
  })).toString("base64");

  tokenCache.accessToken = newToken;
  tokenCache.expiresAt = now + 3600000; // Validade de 1 hora

  addLog("INFO", "OAUTH2", "Novo Token OAuth2 emitido com sucesso e salvo em cache.", {
    expiresAt: new Date(tokenCache.expiresAt).toLocaleTimeString(),
    tokenPreview: newToken.substring(0, 30) + "..."
  });

  return newToken;
}

// 3. Cache para a BrasilAPI (Para acelerar o carregamento de bancos e reduzir requisições redundantes)
let cachedBanksList: any[] = [];
let cachedBanksTimestamp = 0;
const cachedSingleBanks: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL = 30 * 60 * 1000; // Cache de 30 minutos

// 4. Middlewares de Segurança e Validação

// Middleware para verificar autenticação OAuth2 do SERPRO (Simula o gateway)
function verifySerproAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    addLog("WARN", "SERPRO", "Tentativa de consulta bloqueada: Cabeçalho Authorization ausente ou inválido.", {
      path: req.path
    });
    return res.status(401).json({
      error: "Unauthorized",
      message: "Cabeçalho de autorização 'Bearer <token>' é obrigatório para acessar os dados cadastrais do SERPRO."
    });
  }

  const token = authHeader.split(" ")[1];
  // No ambiente do operador, o token fornecido deve bater com o nosso token cacheado ativo
  if (token !== tokenCache.accessToken) {
    addLog("WARN", "SERPRO", "Tentativa de consulta bloqueada: Token de autenticação inválido ou expirado.", {
      providedTokenPreview: token ? token.substring(0, 20) + "..." : null
    });
    return res.status(403).json({
      error: "Forbidden",
      message: "Token inválido, expirado ou não autorizado. Favor obter um novo token do provedor OAuth2."
    });
  }

  next();
}

// Função utilitária para validar matematicamente os dígitos de um CPF
function isValidCPF(cpf: string): boolean {
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11) return false;
  
  // Evita CPFs conhecidos inválidos formados por repetição de dígitos
  if (/^(\d)\1{10}$/.test(clean)) return false;

  let sum = 0;
  let remainder;

  for (let i = 1; i <= 9; i++) {
    sum += parseInt(clean.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(clean.substring(9, 10))) return false;

  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(clean.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(clean.substring(10, 11))) return false;

  return true;
}

// Função utilitária para fazer o parsing de códigos Pix Cópia e Cola (padrão EMV BR Code)
function parsePixEMV(emvStr: string) {
  const result: {
    key?: string;
    name?: string;
    amount?: string;
    city?: string;
    txid?: string;
  } = {};

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
    console.error('Falha ao decodificar Pix EMV no servidor:', err);
  }

  return result;
}

// ==================== ENDPOINTS DA API ====================

// Endpoint para listar os logs do servidor para exibição em tempo real na interface do operador
app.get("/api/logs", (req: Request, res: Response) => {
  res.json({ logs: serverLogs });
});

// Endpoint de Saúde do Servidor
app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    authorizedCpfsCount: authorizedCPFs.size
  });
});

// Endpoint do Fluxo OAuth2 do SERPRO: Obtém o token atual e exibe logs
app.post("/api/oauth2/token", (req: Request, res: Response) => {
  try {
    const token = getSerproToken();
    res.json({
      access_token: token,
      token_type: "Bearer",
      expires_in: Math.round((tokenCache.expiresAt - Date.now()) / 1000),
      scope: "consulta-cpf-v2",
      cached: true
    });
  } catch (error: any) {
    addLog("ERROR", "OAUTH2", "Erro fatal na geração do token OAuth2.", { error: error.message });
    res.status(500).json({ error: "Internal Server Error", message: "Erro ao gerar o token OAuth2." });
  }
});

// Endpoint para gerenciar a lista de CPFs autorizados pelo operador
app.get("/api/authorized-cpfs", (req: Request, res: Response) => {
  res.json({ cpfs: Array.from(authorizedCPFs) });
});

app.post("/api/authorized-cpfs", (req: Request, res: Response) => {
  const { cpf, nome } = req.body;
  if (!cpf) {
    return res.status(400).json({ error: "Missing parameter", message: "O CPF é obrigatório." });
  }
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11) {
    return res.status(400).json({ error: "Invalid format", message: "O CPF deve conter exatamente 11 dígitos." });
  }

  authorizedCPFs.add(clean);
  
  // Se fornecer um nome, adicionamos no banco simulado oficial do SERPRO
  if (nome) {
    serproDatabase[clean] = {
      nome: nome.toUpperCase(),
      dataInscricao: new Date().toISOString().split("T")[0],
      dataAtualizacao: new Date().toISOString().split("T")[0],
      situacao: "REGULAR"
    };
  } else if (!serproDatabase[clean]) {
    // Nome padrão genérico realista baseado em sementes de CPF
    const names = ["BRUNA SOUZA ALMEIDA", "ALEXANDRE SILVA GOMES", "CLARICE PINTO FERREIRA", "LUIS CARLOS OLIVEIRA", "THIAGO COSTA RODRIGUES"];
    const randName = names[parseInt(clean.slice(0, 3)) % names.length];
    serproDatabase[clean] = {
      nome: randName,
      dataInscricao: "2018-10-15",
      dataAtualizacao: new Date().toISOString().split("T")[0],
      situacao: "REGULAR"
    };
  }

  addLog("INFO", "SYSTEM", `Novo CPF autorizado pelo operador com sucesso: ${clean}`, { nome: serproDatabase[clean]?.nome });

  // Sync to Supabase if configured
  if (supabase) {
    const details = serproDatabase[clean];
    const promises = [];
    if (tableStatus.authorized_cpfs) {
      promises.push(supabase.from("authorized_cpfs").upsert({ cpf: clean, nome: details?.nome }));
    }
    if (tableStatus.serpro_database) {
      promises.push(supabase.from("serpro_database").upsert({
        cpf: clean,
        nome: details?.nome,
        data_inscricao: details?.dataInscricao,
        data_atualizacao: details?.dataAtualizacao,
        situacao: details?.situacao,
        banco: details?.banco,
        agencia: details?.agencia,
        conta: details?.conta
      }));
    }
    if (promises.length > 0) {
      Promise.all(promises).catch((err: any) => {
        addLog("WARN", "SYSTEM", "Erro ao salvar em tempo real no Supabase. É possível que as tabelas não tenham sido criadas.", { error: err.message });
      });
    }
  }

  res.json({ success: true, cpf: clean, name: serproDatabase[clean]?.nome, total: authorizedCPFs.size });
});

// Endpoint de Remoção de CPF autorizado
app.delete("/api/authorized-cpfs/:cpf", (req: Request, res: Response) => {
  const clean = req.params.cpf.replace(/\D/g, "");
  if (authorizedCPFs.has(clean)) {
    authorizedCPFs.delete(clean);
    addLog("INFO", "SYSTEM", `CPF removido das autorizações do operador: ${clean}`);

    // Sync deletion to Supabase
    if (supabase) {
      const promises = [];
      if (tableStatus.authorized_cpfs) {
        promises.push(supabase.from("authorized_cpfs").delete().eq("cpf", clean));
      }
      if (tableStatus.serpro_database) {
        promises.push(supabase.from("serpro_database").delete().eq("cpf", clean));
      }
      if (promises.length > 0) {
        Promise.all(promises).catch((err: any) => {
          addLog("WARN", "SYSTEM", "Erro ao deletar do Supabase.", { error: err.message });
        });
      }
    }

    res.json({ success: true, message: "CPF removido com sucesso." });
  } else {
    res.status(444).json({ error: "Not found", message: "CPF não consta na lista de autorizados." });
  }
});

// 5. CONSULTA CPF OFICIAL DO SERPRO (ConectaGov v2) com Middleware de Verificação de Token
app.post("/api/consulta/dados-cadastrais-pf", verifySerproAuth, (req: Request, res: Response) => {
  const { cpf } = req.body;
  
  if (!cpf) {
    addLog("WARN", "SERPRO", "Consulta CPF inválida: Corpo da requisição sem campo 'cpf'.");
    return res.status(400).json({
      error: "Bad Request",
      message: "O parâmetro 'cpf' é obrigatório no corpo da requisição."
    });
  }

  const cleanCpf = cpf.replace(/\D/g, "");

  // 1. Validação matemática do CPF antes de qualquer consulta (Conforme especificado)
  if (!isValidCPF(cleanCpf)) {
    addLog("WARN", "SERPRO", `Consulta CPF rejeitada: CPF matematicamente inválido.`, { cpf: cleanCpf });
    return res.status(422).json({
      error: "Unprocessable Entity",
      message: "CPF Inválido! Os dígitos verificadores do CPF não são matematicamente válidos."
    });
  }

  // 2. Filtro de Autorização de CPFs pelo Operador (Conforme especificado: "Consultar apenas CPFs autorizados pelo operador")
  if (!authorizedCPFs.has(cleanCpf)) {
    addLog("WARN", "SERPRO", `Consulta CPF negada: CPF não autorizado pelo operador.`, { cpf: cleanCpf });
    return res.status(403).json({
      error: "Forbidden",
      message: "Consulta não autorizada! Este CPF não foi previamente cadastrado e autorizado pelo operador da aplicação."
    });
  }

  // Se tudo passar, busca os dados da base oficial simulada do SERPRO
  const officialData = serproDatabase[cleanCpf];

  addLog("INFO", "SERPRO", `Consulta de dados cadastrais PF realizada com sucesso via API SERPRO v2.`, {
    cpf: cleanCpf,
    nome: officialData.nome
  });

  // Retorna os campos estruturados de forma idêntica ao SERPRO ConectaGov oficial
  res.json({
    ni: cleanCpf,
    nome: officialData.nome,
    situacao: {
      codigo: "0",
      descricao: officialData.situacao
    },
    dataInscricao: officialData.dataInscricao,
    dataAtualizacao: officialData.dataAtualizacao,
    origem: "Receita Federal do Brasil via SERPRO ConectaGov v2 API",
    requisicaoId: "req_" + Math.random().toString(36).substring(2, 12).toUpperCase(),
    timestamp: new Date().toISOString()
  });
});

// Endpoint unificado e simplificado para identificar Chaves Pix sem a necessidade de APIs externas ou de tokens OAuth2
app.post("/api/consulta-chave", async (req: Request, res: Response) => {
  const { chave } = req.body;
  if (!chave) {
    addLog("WARN", "SYSTEM", "Consulta de chave rejeitada: Chave ausente.");
    return res.status(400).json({ error: "Missing parameter", message: "A chave Pix é obrigatória." });
  }

  const cleaned = chave.trim();
  const normalized = cleaned.toLowerCase();
  const cleanDigits = cleaned.replace(/\D/g, "");

  addLog("INFO", "SYSTEM", `Iniciando identificação de chave Pix: ${cleaned}`);

  // A. PIX CÓPIA E COLA / EMV CODE PARSING
  if (cleaned.startsWith("000201") || cleaned.includes("br.gov.bcb.pix")) {
    const parsed = parsePixEMV(cleaned);
    addLog("INFO", "SYSTEM", "Chave Pix Cópia e Cola identificada e decodificada com sucesso.", parsed);
    
    const key = parsed.key || "";
    const cleanKeyDigits = key.replace(/\D/g, "");
    
    // Se a chave interna for um CNPJ, podemos buscar dinamicamente
    let finalName = parsed.name || "JULIANA MELO MELO";
    let finalBank = "NU PAGAMENTOS - IP";
    
    if (cleanKeyDigits.length === 14) {
      try {
        const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanKeyDigits}`);
        if (response.ok) {
          const data: any = await response.json();
          if (data && data.razao_social) {
            finalName = data.razao_social;
          }
        }
      } catch (e) {}
    }

    return res.json({
      nome: finalName.toUpperCase(),
      banco: key.includes("@") ? "C6 Bank S.A." : finalBank,
      agencia: "0001",
      conta: "1234567-8",
      cpf: key || "123.443.695-00",
      pixKey: key,
      amount: parsed.amount ? parseFloat(parsed.amount) : undefined,
      isCopiaCola: true
    });
  }

  // B. CNPJ LOOKUP (Live Public API - BrasilAPI)
  if (cleanDigits.length === 14) {
    addLog("INFO", "SYSTEM", `Buscando dados do CNPJ ${cleanDigits} via API pública BrasilAPI...`);
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanDigits}`);
      if (response.ok) {
        const data: any = await response.json();
        if (data && data.razao_social) {
          const companyName = data.razao_social.toUpperCase();
          addLog("INFO", "SYSTEM", `CNPJ localizado com sucesso na BrasilAPI: ${companyName}`);
          return res.json({
            nome: companyName,
            banco: "NU PAGAMENTOS - IP",
            agencia: "0001",
            conta: "48708843-1",
            cpf: cleanDigits,
            isCompany: true
          });
        }
      }
    } catch (err: any) {
      addLog("WARN", "SYSTEM", "Falha temporária ao consultar BrasilAPI CNPJ, usando fallback de simulação.", { error: err.message });
    }

    // Fallback simulação caso a API de CNPJ falhe
    return res.json({
      nome: "LORENA E BYEL SOLUCOES DIGITAIS LTDA",
      banco: "C6 Bank S.A.",
      agencia: "0001",
      conta: "57262657-9",
      cpf: cleanDigits,
      isCompany: true
    });
  }

  // C. CPF LOOKUP
  if (cleanDigits.length === 11) {
    const officialData = serproDatabase[cleanDigits];
    if (officialData) {
      addLog("INFO", "SYSTEM", `Chave CPF localizada com sucesso: ${cleanDigits}`, { nome: officialData.nome });
      
      const seed1 = parseInt(cleanDigits.slice(0, 3)) || 1;
      const seed2 = parseInt(cleanDigits.slice(3, 6)) || 2;
      const seed3 = parseInt(cleanDigits.slice(6, 9)) || 3;
      
      const banks = [
        "NU PAGAMENTOS - IP",
        "Banco Bradesco S.A.",
        "Itaú Unibanco S.A.",
        "Banco do Brasil S.A.",
        "Caixa Econômica Federal",
        "Banco Santander (Brasil) S.A.",
        "Banco Inter S.A.",
        "PagSeguro Internet S.A.",
        "Mercado Pago IP Ltda."
      ];
      
      const bankSelected = officialData.banco || banks[seed1 % banks.length];
      const randomAccount = officialData.conta || `${seed2}${seed3 % 10}-${seed1 % 10}`;
      const agencySelected = officialData.agencia || "0001";

      return res.json({
        nome: officialData.nome,
        banco: bankSelected,
        agencia: agencySelected,
        conta: randomAccount,
        cpf: cleanDigits
      });
    } else {
      // Se for um CPF válido matematicamente, mas não cadastrado, geramos dados realistas para simular a identificação de vazamento
      const names = ["BRUNA SOUZA ALMEIDA", "ALEXANDRE SILVA GOMES", "CLARICE PINTO FERREIRA", "LUIS CARLOS OLIVEIRA", "THIAGO COSTA RODRIGUES"];
      const randName = names[parseInt(cleanDigits.slice(0, 3)) % names.length];
      
      // Salva no banco de dados temporário de forma persistente na sessão atual
      serproDatabase[cleanDigits] = {
        nome: randName,
        dataInscricao: new Date().toISOString().split("T")[0],
        dataAtualizacao: new Date().toISOString().split("T")[0],
        situacao: "REGULAR"
      };
      authorizedCPFs.add(cleanDigits);

      const seed1 = parseInt(cleanDigits.slice(0, 3)) || 1;
      const seed2 = parseInt(cleanDigits.slice(3, 6)) || 2;
      const seed3 = parseInt(cleanDigits.slice(6, 9)) || 3;
      const banks = ["NU PAGAMENTOS - IP", "Banco Bradesco S.A.", "Itaú Unibanco S.A.", "Banco Inter S.A."];
      const bankSelected = banks[seed1 % banks.length];
      const randomAccount = `${seed2}${seed3 % 10}-${seed1 % 10}`;

      addLog("INFO", "SYSTEM", `Chave CPF gerada dinamicamente via consulta a vazamentos pública: ${randName}`);

      return res.json({
        nome: randName,
        banco: bankSelected,
        agencia: "0001",
        conta: randomAccount,
        cpf: cleanDigits
      });
    }
  }

  // D. EMAIL LOOKUP
  if (normalized.includes("@")) {
    const userMatches = [
      { key: "byel@c6bank.com.br", nome: "BYEL SAINTS", banco: "C6 Bank S.A.", agencia: "0001", conta: "57262657-9" },
      { key: "juliana@melo.com", nome: "JULIANA MELO MELO", banco: "PAGSEGURO INTERNET S.A.", agencia: "0001", conta: "1234567-8" }
    ];
    const found = userMatches.find(m => normalized.includes(m.key) || m.key.includes(normalized));
    if (found) {
       addLog("INFO", "SYSTEM", `Chave de Email localizada: ${cleaned}`, { nome: found.nome });
       return res.json(found);
    }
    return res.json({
      nome: "JULIANA MELO MELO",
      banco: "PAGSEGURO INTERNET S.A.",
      agencia: "0001",
      conta: "1234567-8",
      cpf: "12344369500"
    });
  }

  // E. TELEFONE / CELULAR LOOKUP (Dynamic lookup based on digits seed)
  if (cleanDigits.length >= 8 && cleanDigits.length <= 15) {
    if (cleanDigits.includes("965814") || cleanDigits.includes("988440897")) {
      addLog("INFO", "SYSTEM", `Chave de Telefone localizada: ${cleaned}`, { nome: "FRANCISCO MANOEL DA SILVA" });
      return res.json({
        nome: "FRANCISCO MANOEL DA SILVA",
        banco: "Banco Bradesco S.A.",
        agencia: "0001",
        conta: "98844089-7",
        cpf: "000.965.814-00"
      });
    }

    // Gerar dados realistas dinâmicos a partir dos números do telefone para dar sensação de consulta a vazamentos / API real
    const seed = parseInt(cleanDigits.slice(-4)) || 1234;
    const names = [
      "LUCAS REIS MONTEIRO", 
      "BEATRIZ GONCALVES DIAS", 
      "GABRIEL NUNES REZENDE", 
      "AMANDA VIEIRA CARVALHO", 
      "RODRIGO BARBOSA CARDOSO"
    ];
    const banksList = [
      "Itaú Unibanco S.A.",
      "Banco Bradesco S.A.",
      "Banco do Brasil S.A.",
      "Nu Pagamentos S.A.",
      "Banco Santander (Brasil) S.A."
    ];
    
    const selectedName = names[seed % names.length];
    const selectedBank = banksList[(seed * 3) % banksList.length];
    const randomAccount = `${(seed * 7) % 100000}-${seed % 10}`;
    
    addLog("INFO", "SYSTEM", `Chave de Telefone localizada via DICT pública: ${cleaned}`, { nome: selectedName });
    
    return res.json({
      nome: selectedName,
      banco: selectedBank,
      agencia: "0001",
      conta: randomAccount,
      cpf: `***.${(seed % 900) + 100}.***-**`
    });
  }

  // F. GENERIC (Name lookup fallback)
  addLog("INFO", "SYSTEM", `Chave genérica (Nome) identificada: ${cleaned}`);
  return res.json({
    nome: cleaned.toUpperCase(),
    banco: "NU PAGAMENTOS - IP",
    agencia: "0001",
    conta: "11054254-5",
    cpf: "11054254524"
  });
});

// 6. INTEGRAÇÃO BRASILAPI (Consulta de Bancos com Caching no Servidor)
app.get("/api/banks", async (req: Request, res: Response) => {
  const now = Date.now();
  if (cachedBanksList.length > 0 && now - cachedBanksTimestamp < CACHE_TTL) {
    addLog("INFO", "BRASIL_API", "Retornando lista completa de bancos do cache de servidor.", {
      count: cachedBanksList.length
    });
    return res.json(cachedBanksList);
  }

  addLog("INFO", "BRASIL_API", "Buscando lista de bancos em tempo real na BrasilAPI...");
  try {
    const response = await fetch("https://brasilapi.com.br/api/banks/v1");
    if (!response.ok) {
      throw new Error(`BrasilAPI respondeu com status ${response.status}`);
    }
    const data: any = await response.json();
    
    // Filtra bancos com nome ou código válidos
    const validBanks = data.filter((b: any) => b.code !== null && (b.fullName || b.name));
    validBanks.sort((a: any, b: any) => (a.code || 0) - (b.code || 0));

    cachedBanksList = validBanks;
    cachedBanksTimestamp = now;

    addLog("INFO", "BRASIL_API", "Lista de bancos obtida com sucesso da BrasilAPI e cacheada.", {
      count: validBanks.length
    });

    res.json(validBanks);
  } catch (error: any) {
    addLog("ERROR", "BRASIL_API", "Falha ao buscar bancos na BrasilAPI. Utilizando cache offline interno.", {
      error: error.message
    });
    
    // Fallback caso a BrasilAPI esteja fora do ar ou sem rede
    const fallbackBanks = [
      { code: 260, name: "NU PAGAMENTOS S.A.", fullName: "Nu Pagamentos S.A.", ispb: "18236120" },
      { code: 341, name: "ITAÚ UNIBANCO S.A.", fullName: "Itaú Unibanco S.A.", ispb: "60701190" },
      { code: 237, name: "BANCO BRADESCO S.A.", fullName: "Banco Bradesco S.A.", ispb: "60746948" },
      { code: 1, name: "BANCO DO BRASIL S.A.", fullName: "Banco do Brasil S.A.", ispb: "00000000" },
      { code: 104, name: "CAIXA ECONOMICA CEF", fullName: "Caixa Econômica Federal", ispb: "00360305" },
      { code: 33, name: "BANCO SANTANDER S.A.", fullName: "Banco Santander (Brasil) S.A.", ispb: "90400888" },
      { code: 77, name: "BANCO INTER S.A.", fullName: "Banco Inter S.A.", ispb: "41696805" },
      { code: 290, name: "PAGSEGURO IP S.A.", fullName: "PagSeguro Internet S.A.", ispb: "08561701" },
      { code: 323, name: "MERCADO PAGO IP LTDA", fullName: "Mercado Pago IP Ltda.", ispb: "10573521" }
    ];
    res.json(fallbackBanks);
  }
});

// Endpoint para consultar banco individual por COMPE ou ISPB via BrasilAPI (com Cache)
app.get("/api/banks/:code", async (req: Request, res: Response) => {
  const code = req.params.code.trim();
  const now = Date.now();

  if (cachedSingleBanks[code] && now - cachedSingleBanks[code].timestamp < CACHE_TTL) {
    addLog("INFO", "BRASIL_API", `Retornando banco ${code} do cache do servidor.`, cachedSingleBanks[code].data);
    return res.json(cachedSingleBanks[code].data);
  }

  addLog("INFO", "BRASIL_API", `Consultando banco ${code} em tempo real na BrasilAPI...`);
  try {
    const response = await fetch(`https://brasilapi.com.br/api/banks/v1/${code}`);
    if (!response.ok) {
      throw new Error(`Banco ${code} não localizado na BrasilAPI.`);
    }
    const data = await response.json();

    cachedSingleBanks[code] = {
      data,
      timestamp: now
    };

    addLog("INFO", "BRASIL_API", `Banco ${code} localizado com sucesso.`, data);
    res.json(data);
  } catch (error: any) {
    addLog("WARN", "BRASIL_API", `Falha ao localizar banco ${code}. Procurando localmente nos cadastros...`);
    
    // Fallback de busca na base local cacheada/padrão
    const matchedFallback = [
      { code: 260, name: "NU PAGAMENTOS S.A.", fullName: "Nu Pagamentos S.A.", ispb: "18236120" },
      { code: 341, name: "ITAÚ UNIBANCO S.A.", fullName: "Itaú Unibanco S.A.", ispb: "60701190" },
      { code: 237, name: "BANCO BRADESCO S.A.", fullName: "Banco Bradesco S.A.", ispb: "60746948" },
      { code: 1, name: "BANCO DO BRASIL S.A.", fullName: "Banco do Brasil S.A.", ispb: "00000000" },
      { code: 104, name: "CAIXA ECONOMICA CEF", fullName: "Caixa Econômica Federal", ispb: "00360305" }
    ].find(b => b.code.toString() === code || b.ispb === code);

    if (matchedFallback) {
      addLog("INFO", "BRASIL_API", `Banco ${code} resolvido através de base local offline de segurança.`, matchedFallback);
      return res.json(matchedFallback);
    }

    res.status(404).json({
       error: "Not Found",
      message: `Código bancário (COMPE ou ISPB) '${code}' não pôde ser identificado na BrasilAPI.`
    });
  }
});


// ==================== BANCO DE DADOS PARA COMPROVANTES DE TRANSFERÊNCIA ====================

interface ComprovanteEntry {
  id: string;
  userCpf: string;
  title: string;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM:SS
  type: 'Pix' | 'Transferência' | 'Pagamento de Fatura' | 'Depósito';
  incoming: boolean;
  senderName?: string;
  senderCpf?: string;
  senderBank?: string;
  senderAgency?: string;
  senderAccountNumber?: string;
  recipientName?: string;
  recipientCpf?: string;
  recipientBank?: string;
  recipientAgency?: string;
  recipientAccountNumber?: string;
  pixKey?: string;
  transactionId?: string;
}

const serverComprovantes: ComprovanteEntry[] = [];

// 10. GET /api/comprovantes - Retorna todos os comprovantes filtrados por usuário
app.get("/api/comprovantes", async (req: Request, res: Response) => {
  const userCpf = (req.query.userCpf as string || "").replace(/\D/g, "");
  
  try {
    if (supabase && tableStatus.comprovantes) {
      const { data, error } = await supabase
        .from("comprovantes")
        .select("*")
        .order("date", { ascending: false });
        
      if (!error && data) {
        // Filtrar por CPF do usuário se especificado
        const filtered = userCpf 
          ? data.filter((item: any) => item.userCpf?.replace(/\D/g, "") === userCpf)
          : data;
        return res.json(filtered);
      } else {
        if (error) {
          const isMissingTable = error.message?.includes("schema cache") || error.message?.includes("relation") || error.message?.includes("does not exist");
          if (isMissingTable) {
            tableStatus.comprovantes = false;
            addLog("INFO", "SYSTEM", "A tabela 'comprovantes' não existe no Supabase. Desativando consultas a ela e usando banco em memória local.");
          } else {
            addLog("WARN", "SYSTEM", "Erro ao buscar comprovantes do Supabase. Usando banco em memória.", { error: error.message });
          }
        }
      }
    }
  } catch (err: any) {
    addLog("WARN", "SYSTEM", "Erro na rota de comprovantes.", { error: err.message });
  }

  // Fallback para em memória
  const filtered = userCpf 
    ? serverComprovantes.filter(item => item.userCpf?.replace(/\D/g, "") === userCpf)
    : serverComprovantes;
  res.json(filtered);
});

// 11. POST /api/comprovantes - Cadastra um novo comprovante de transferência
app.post("/api/comprovantes", async (req: Request, res: Response) => {
  const comprovante: ComprovanteEntry = req.body;
  
  if (!comprovante.id || !comprovante.userCpf) {
    return res.status(400).json({ error: "Missing parameter", message: "Os campos id e userCpf são obrigatórios." });
  }

  // Limpa CPF
  comprovante.userCpf = comprovante.userCpf.replace(/\D/g, "");

  // Salva em memória
  // Evitar duplicados
  const existingIndex = serverComprovantes.findIndex(item => item.id === comprovante.id);
  if (existingIndex !== -1) {
    serverComprovantes[existingIndex] = comprovante;
  } else {
    serverComprovantes.unshift(comprovante);
  }

  addLog("INFO", "SYSTEM", `Comprovante salvo em memória: ${comprovante.title} de R$ ${comprovante.amount}`);

  // Tenta salvar no Supabase
  if (supabase && tableStatus.comprovantes) {
    try {
      const { error } = await supabase
        .from("comprovantes")
        .upsert(comprovante);
        
      if (error) {
        const isMissingTable = error.message?.includes("schema cache") || error.message?.includes("relation") || error.message?.includes("does not exist");
        if (isMissingTable) {
          tableStatus.comprovantes = false;
          addLog("INFO", "SYSTEM", "A tabela 'comprovantes' não existe no Supabase. Desativando consultas a ela e usando banco em memória local.");
        } else {
          addLog("WARN", "SYSTEM", "Falha ao gravar comprovante no Supabase. Continuando em memória local.", { error: error.message });
        }
      } else {
        addLog("INFO", "SYSTEM", "Comprovante gravado com sucesso no Supabase!");
      }
    } catch (supabaseErr: any) {
      addLog("WARN", "SYSTEM", "Erro ao persistir no Supabase.", { error: supabaseErr.message });
    }
  }

  res.json({ success: true, data: comprovante });
});

// 12. DELETE /api/comprovantes - Limpa histórico de comprovantes customizados do usuário
app.delete("/api/comprovantes", async (req: Request, res: Response) => {
  const userCpf = (req.query.userCpf as string || "").replace(/\D/g, "");

  if (!userCpf) {
    return res.status(400).json({ error: "Missing parameter", message: "O CPF do usuário é obrigatório." });
  }

  // Remove de memória
  for (let i = serverComprovantes.length - 1; i >= 0; i--) {
    if (serverComprovantes[i].userCpf === userCpf) {
      serverComprovantes.splice(i, 1);
    }
  }

  // Remove do Supabase
  if (supabase && tableStatus.comprovantes) {
    try {
      const { error } = await supabase
        .from("comprovantes")
        .delete()
        .eq("userCpf", userCpf);
        
      if (error) {
        const isMissingTable = error.message?.includes("schema cache") || error.message?.includes("relation") || error.message?.includes("does not exist");
        if (isMissingTable) {
          tableStatus.comprovantes = false;
          addLog("INFO", "SYSTEM", "A tabela 'comprovantes' não existe no Supabase. Desativando consultas a ela e usando banco em memória local.");
        } else {
          addLog("WARN", "SYSTEM", "Falha ao deletar comprovantes do Supabase.", { error: error.message });
        }
      }
    } catch (e: any) {
      addLog("WARN", "SYSTEM", "Erro ao deletar no Supabase.", { error: e.message });
    }
  }

  addLog("INFO", "SYSTEM", `Histórico de comprovantes limpo para o CPF: ${userCpf}`);
  res.json({ success: true, message: "Histórico de comprovantes limpo com sucesso." });
});

// 13. GET /api/users - Retorna a lista de usuários cadastrados
app.get("/api/users", async (req: Request, res: Response) => {
  if (supabase && tableStatus.bank_users) {
    try {
      const { data, error } = await supabase
        .from("bank_users")
        .select("*");
      if (!error && data) {
        const mapped: BankUser[] = data.map((u: any) => ({
          name: u.name,
          cpf: u.cpf,
          agency: u.agency,
          accountNumber: u.accountNumber,
          bankName: u.bankName,
          balance: Number(u.balance),
          creditCardInvoice: Number(u.creditCardInvoice),
          creditCardLimit: Number(u.creditCardLimit),
          password: u.password,
          transactionPassword: u.transactionPassword
        }));
        serverUsers = mapped;
        return res.json(mapped);
      } else if (error) {
        const isMissingTable = error.message?.includes("schema cache") || error.message?.includes("relation") || error.message?.includes("does not exist");
        if (isMissingTable) {
          tableStatus.bank_users = false;
        }
      }
    } catch (err: any) {
      addLog("WARN", "SYSTEM", "Erro ao recuperar usuários do Supabase. Usando local.", { error: err.message });
    }
  }
  res.json(serverUsers);
});

// 14. POST /api/users - Cadastra ou atualiza um usuário no banco de dados
app.post("/api/users", async (req: Request, res: Response) => {
  const newUser: BankUser = req.body;
  if (!newUser.cpf || !newUser.name) {
    return res.status(400).json({ error: "Missing parameter", message: "Os campos CPF e Nome são obrigatórios." });
  }

  // Normaliza CPF para salvar
  const cleanCpf = newUser.cpf.trim();
  const existingIndex = serverUsers.findIndex(u => u.cpf === cleanCpf);
  
  if (existingIndex !== -1) {
    serverUsers[existingIndex] = newUser;
  } else {
    serverUsers.push(newUser);
  }

  // Garante autorização do CPF no sistema
  authorizedCPFs.add(cleanCpf.replace(/\D/g, ""));

  addLog("INFO", "SYSTEM", `Usuário salvo/atualizado em memória: ${newUser.name} (CPF: ${newUser.cpf})`);

  // Persiste no Supabase se disponível
  if (supabase && tableStatus.bank_users) {
    try {
      const { error } = await supabase
        .from("bank_users")
        .upsert({
          cpf: cleanCpf,
          name: newUser.name,
          agency: newUser.agency || "0001",
          accountNumber: newUser.accountNumber,
          bankName: newUser.bankName || "Nu Pagamentos S.A.",
          balance: newUser.balance,
          creditCardInvoice: newUser.creditCardInvoice,
          creditCardLimit: newUser.creditCardLimit,
          password: newUser.password || "1234",
          transactionPassword: newUser.transactionPassword || "1234"
        });

      if (error) {
        const isMissingTable = error.message?.includes("schema cache") || error.message?.includes("relation") || error.message?.includes("does not exist");
        if (isMissingTable) {
          tableStatus.bank_users = false;
        } else {
          addLog("WARN", "SYSTEM", "Erro ao salvar usuário no Supabase.", { error: error.message });
        }
      } else {
        addLog("INFO", "SYSTEM", "Usuário salvo com sucesso no Supabase!");
      }
    } catch (err: any) {
      addLog("WARN", "SYSTEM", "Erro ao persistir no Supabase.", { error: err.message });
    }
  }

  res.json({ success: true, data: newUser });
});

// 15. PUT /api/users/:cpf - Atualiza campos específicos do usuário
app.put("/api/users/:cpf", async (req: Request, res: Response) => {
  const { cpf } = req.params;
  const updatedFields: Partial<BankUser> = req.body;
  
  const cleanCpfParam = cpf.replace(/\D/g, "");
  const existingIndex = serverUsers.findIndex(u => u.cpf.replace(/\D/g, "") === cleanCpfParam);

  if (existingIndex === -1) {
    return res.status(404).json({ error: "User not found", message: "Usuário não encontrado." });
  }

  // Atualiza em memória
  serverUsers[existingIndex] = {
    ...serverUsers[existingIndex],
    ...updatedFields
  };

  const updatedUser = serverUsers[existingIndex];
  addLog("INFO", "SYSTEM", `Usuário atualizado em memória: ${updatedUser.name} (CPF: ${updatedUser.cpf})`);

  // Atualiza no Supabase se disponível
  if (supabase && tableStatus.bank_users) {
    try {
      const { error } = await supabase
        .from("bank_users")
        .upsert({
          cpf: updatedUser.cpf,
          name: updatedUser.name,
          agency: updatedUser.agency,
          accountNumber: updatedUser.accountNumber,
          bankName: updatedUser.bankName,
          balance: updatedUser.balance,
          creditCardInvoice: updatedUser.creditCardInvoice,
          creditCardLimit: updatedUser.creditCardLimit,
          password: updatedUser.password,
          transactionPassword: updatedUser.transactionPassword
        });

      if (error) {
        addLog("WARN", "SYSTEM", "Erro ao atualizar usuário no Supabase.", { error: error.message });
      }
    } catch (err: any) {
      addLog("WARN", "SYSTEM", "Erro ao persistir atualização no Supabase.", { error: err.message });
    }
  }

  res.json({ success: true, data: updatedUser });
});

// 16. POST /api/login - Valida o login do usuário
app.post("/api/login", async (req: Request, res: Response) => {
  const { cpf, password } = req.body;
  if (!cpf || !password) {
    return res.status(400).json({ error: "Missing parameter", message: "CPF e Senha são obrigatórios." });
  }

  const cleanCpf = cpf.replace(/\D/g, "");
  let foundUser = serverUsers.find(u => u.cpf.replace(/\D/g, "") === cleanCpf);

  // Se tiver Supabase, busca direto para garantir dados atualizados
  if (supabase && tableStatus.bank_users) {
    try {
      const { data, error } = await supabase
        .from("bank_users")
        .select("*")
        .eq("cpf", cpf)
        .single();
      
      if (!error && data) {
        foundUser = {
          name: data.name,
          cpf: data.cpf,
          agency: data.agency,
          accountNumber: data.accountNumber,
          bankName: data.bankName,
          balance: Number(data.balance),
          creditCardInvoice: Number(data.creditCardInvoice),
          creditCardLimit: Number(data.creditCardLimit),
          password: data.password,
          transactionPassword: data.transactionPassword
        };
      }
    } catch (err) {}
  }

  if (!foundUser) {
    return res.status(404).json({ error: "Not found", message: "Usuário com este CPF não está cadastrado." });
  }

  if (foundUser.password !== password) {
    return res.status(401).json({ error: "Unauthorized", message: "Senha incorreta." });
  }

  addLog("INFO", "OAUTH2", `Login efetuado com sucesso para o usuário: ${foundUser.name}`);
  res.json({ success: true, user: foundUser });
});


// ==================== CONFIGURAÇÃO DO VITE / PRODUÇÃO ====================

// Sincronização em tempo real e de inicialização com o Supabase
async function syncDatabaseWithSupabase() {
  if (!supabase) {
    addLog("INFO", "SYSTEM", "Supabase não configurado via variáveis de ambiente. Utilizando cache e persistência em memória local.");
    return;
  }

  addLog("INFO", "SYSTEM", "Sincronizando banco de dados com as tabelas do Supabase...");

  try {
    // 1. Tenta recuperar CPFs Autorizados
    const { data: authData, error: authError } = await supabase
      .from("authorized_cpfs")
      .select("*");

    if (authError) {
      if (authError.message?.includes("relation") || authError.message?.includes("does not exist") || authError.message?.includes("schema cache")) {
        tableStatus.authorized_cpfs = false;
        addLog("INFO", "SYSTEM", "A tabela 'authorized_cpfs' não foi criada no Supabase ainda. Usando banco em memória local.");
      } else {
        throw authError;
      }
    } else if (authData) {
      addLog("INFO", "SYSTEM", `Recuperados ${authData.length} CPFs autorizados do Supabase.`);
      authData.forEach((row: any) => {
        if (row.cpf) {
          authorizedCPFs.add(row.cpf.replace(/\D/g, ""));
        }
      });
    }

    // 2. Tenta recuperar banco do SERPRO
    const { data: serproData, error: serproError } = await supabase
      .from("serpro_database")
      .select("*");

    if (serproError) {
      if (serproError.message?.includes("relation") || serproError.message?.includes("does not exist") || serproError.message?.includes("schema cache")) {
        tableStatus.serpro_database = false;
        addLog("INFO", "SYSTEM", "A tabela 'serpro_database' não foi criada no Supabase ainda. Usando banco em memória local.");
      } else {
        throw serproError;
      }
    } else if (serproData) {
      addLog("INFO", "SYSTEM", `Recuperadas ${serproData.length} entradas oficiais de CPF do Supabase.`);
      serproData.forEach((row: any) => {
        if (row.cpf) {
          const clean = row.cpf.replace(/\D/g, "");
          serproDatabase[clean] = {
            nome: row.nome,
            dataInscricao: row.data_inscricao || "2026-07-07",
            dataAtualizacao: row.data_atualizacao || "2026-07-07",
            situacao: row.situacao || "REGULAR",
            banco: row.banco,
            agencia: row.agencia,
            conta: row.conta
          };
          authorizedCPFs.add(clean);
        }
      });
    }

    // 3. Tenta testar a tabela de comprovantes
    const { error: comprovantesError } = await supabase
      .from("comprovantes")
      .select("*")
      .limit(1);

    if (comprovantesError) {
      if (comprovantesError.message?.includes("relation") || comprovantesError.message?.includes("does not exist") || comprovantesError.message?.includes("schema cache")) {
        tableStatus.comprovantes = false;
        addLog("INFO", "SYSTEM", "A tabela 'comprovantes' não foi criada no Supabase ainda. Usando banco em memória local.");
      }
    }

    // 3.5 Tenta recuperar e testar a tabela de bank_users
    const { data: dbUsers, error: bankUsersError } = await supabase
      .from("bank_users")
      .select("*");

    if (bankUsersError) {
      if (bankUsersError.message?.includes("relation") || bankUsersError.message?.includes("does not exist") || bankUsersError.message?.includes("schema cache")) {
        tableStatus.bank_users = false;
        addLog("INFO", "SYSTEM", "A tabela 'bank_users' não foi criada no Supabase ainda. Usando banco em memória local.");
      } else {
        throw bankUsersError;
      }
    } else if (dbUsers) {
      addLog("INFO", "SYSTEM", `Recuperados ${dbUsers.length} usuários cadastrados do Supabase.`);
      if (dbUsers.length > 0) {
        serverUsers = dbUsers.map((u: any) => ({
          name: u.name,
          cpf: u.cpf,
          agency: u.agency,
          accountNumber: u.accountNumber,
          bankName: u.bankName,
          balance: Number(u.balance),
          creditCardInvoice: Number(u.creditCardInvoice),
          creditCardLimit: Number(u.creditCardLimit),
          password: u.password,
          transactionPassword: u.transactionPassword
        }));

        dbUsers.forEach((u: any) => {
          if (u.cpf) {
            authorizedCPFs.add(u.cpf.replace(/\D/g, ""));
          }
        });
      }
    }

    // 4. Auto-seeding: Se as tabelas existirem, garante que nossos usuários padrão (Pedro Gabriel e Maria Sidney) existam nelas
    if (tableStatus.serpro_database && tableStatus.authorized_cpfs) {
      addLog("INFO", "SYSTEM", "Atualizando/semeando tabelas do Supabase com usuários padrão...");
      for (const [cpf, details] of Object.entries(serproDatabase)) {
        try {
          await supabase
            .from("serpro_database")
            .upsert({
              cpf,
              nome: details.nome,
              data_inscricao: details.dataInscricao,
              data_atualizacao: details.dataAtualizacao,
              situacao: details.situacao,
              banco: details.banco,
              agencia: details.agencia,
              conta: details.conta
            });

          await supabase
            .from("authorized_cpfs")
            .upsert({
              cpf,
              nome: details.nome
            });
        } catch (e) {
          // Silenciosamente falha caso o schema ou tabelas não estejam criados
        }
      }
    }

    // Se a tabela bank_users existir e estiver vazia, faz o seed dos usuários padrão
    if (tableStatus.bank_users && (!dbUsers || dbUsers.length === 0)) {
      addLog("INFO", "SYSTEM", "Semeando tabela 'bank_users' no Supabase com usuários iniciais...");
      for (const u of serverUsers) {
        try {
          await supabase
            .from("bank_users")
            .upsert({
              cpf: u.cpf,
              name: u.name,
              agency: u.agency,
              accountNumber: u.accountNumber,
              bankName: u.bankName,
              balance: u.balance,
              creditCardInvoice: u.creditCardInvoice,
              creditCardLimit: u.creditCardLimit,
              password: u.password,
              transactionPassword: u.transactionPassword
            });
        } catch (e) {
          addLog("WARN", "SYSTEM", `Falha ao semear usuário ${u.name} no Supabase.`);
        }
      }
    }

    addLog("INFO", "SYSTEM", "Sincronização com o Supabase finalizada com sucesso!");
  } catch (error: any) {
    addLog("ERROR", "SYSTEM", "Falha ao sincronizar com o Supabase. Verifique se as credenciais e tabelas estão corretas.", {
      message: error.message
    });
  }
}

// Vite Middleware para Desenvolvimento vs Atendimento estático para Produção
async function configureFrontend() {
  // Sincroniza o banco de dados antes de iniciar
  await syncDatabaseWithSupabase();

  if (process.env.NODE_ENV !== "production") {
    addLog("INFO", "SYSTEM", "Iniciando servidor Express com Vite integrado (Modo Desenvolvimento)...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    addLog("INFO", "SYSTEM", "Iniciando servidor Express pronto para Produção (Arquivos Estáticos)...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Inicialização do servidor na porta 3000
  app.listen(PORT, "0.0.0.0", () => {
    addLog("INFO", "SYSTEM", `Servidor rodando com sucesso no endereço http://localhost:${PORT}`);
  });
}

// Inicializa a configuração
configureFrontend();
