-- SQL Script to set up your Supabase database tables
-- Copy and paste this script into the Supabase SQL Editor (Dashboard > SQL Editor > New Query) and click "Run".

-- 1. Create 'authorized_cpfs' table
CREATE TABLE IF NOT EXISTS public.authorized_cpfs (
    cpf TEXT PRIMARY KEY,
    nome TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) or keep it disabled/public for direct access depending on your needs.
-- Here we keep it simple, but you can configure RLS as needed.
ALTER TABLE public.authorized_cpfs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read and write" ON public.authorized_cpfs 
    FOR ALL USING (true) WITH CHECK (true);

-- 2. Create 'serpro_database' table
CREATE TABLE IF NOT EXISTS public.serpro_database (
    cpf TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    data_inscricao TEXT,
    data_atualizacao TEXT,
    situacao TEXT DEFAULT 'REGULAR',
    banco TEXT,
    agencia TEXT,
    conta TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.serpro_database ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read and write" ON public.serpro_database 
    FOR ALL USING (true) WITH CHECK (true);

-- 3. Create 'comprovantes' table (History of transactions and receipt logs)
CREATE TABLE IF NOT EXISTS public.comprovantes (
    id TEXT PRIMARY KEY,
    "userCpf" TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    amount NUMERIC(15, 2) NOT NULL,
    date TEXT NOT NULL, -- YYYY-MM-DD
    time TEXT NOT NULL, -- HH:MM:SS
    type TEXT NOT NULL, -- 'Pix' | 'Transferência' | 'Pagamento de Fatura' | 'Depósito'
    incoming BOOLEAN NOT NULL,
    "senderName" TEXT,
    "senderCpf" TEXT,
    "senderBank" TEXT,
    "senderAgency" TEXT,
    "senderAccountNumber" TEXT,
    "recipientName" TEXT,
    "recipientCpf" TEXT,
    "recipientBank" TEXT,
    "recipientAgency" TEXT,
    "recipientAccountNumber" TEXT,
    "pixKey" TEXT,
    "transactionId" TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.comprovantes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read and write" ON public.comprovantes 
    FOR ALL USING (true) WITH CHECK (true);

-- 4. Create 'bank_users' table (Database for storing bank customers and login details)
CREATE TABLE IF NOT EXISTS public.bank_users (
    cpf TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    agency TEXT DEFAULT '0001',
    "accountNumber" TEXT NOT NULL,
    "bankName" TEXT DEFAULT 'Nu Pagamentos S.A.',
    balance NUMERIC(15, 2) DEFAULT 0.00,
    "creditCardInvoice" NUMERIC(15, 2) DEFAULT 0.00,
    "creditCardLimit" NUMERIC(15, 2) DEFAULT 1000.00,
    password TEXT NOT NULL,
    "transactionPassword" TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.bank_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read and write" ON public.bank_users 
    FOR ALL USING (true) WITH CHECK (true);

