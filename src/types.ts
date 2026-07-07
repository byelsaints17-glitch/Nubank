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

export interface BankRecipient {
  name: string;
  cpf: string;
  bankName: string;
  agency: string;
  accountNumber: string;
  pixKey: string;
}

export interface TransactionDetails {
  amount: number;
  type: 'Pix' | 'Transferência' | 'Pagamento de Fatura' | 'Depósito';
  date: string;
  time: string;
  transactionId: string;
}

export interface StatementItem {
  id: string;
  title: string;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM:SS
  type: 'Pix' | 'Transferência' | 'Pagamento de Fatura' | 'Depósito';
  incoming: boolean; // true = positive amount (+), false = negative amount (-)
  recipientName?: string;
  senderName?: string;
}
