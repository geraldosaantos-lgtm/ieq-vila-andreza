-- ============================================================================
-- MIGRATION 01: Initial Schema - IEQ VILA ANDREZA (Igreja do Evangelho Quadrangular)
-- Versão: 20260923000001
-- Descrição: Estrutura inicial de tabelas eclesiásticas para membros, liderança,
--            visitantes, frequência de cultos, agenda, louvores e store em nuvem.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Tabela de Membros da Igreja
CREATE TABLE IF NOT EXISTS public.membros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    endereco TEXT NOT NULL,
    bairro TEXT DEFAULT 'Vila Andreza',
    cidade TEXT DEFAULT '',
    telefone TEXT NOT NULL,
    data_nascimento TEXT,
    batizado BOOLEAN DEFAULT TRUE,
    status TEXT DEFAULT 'ativo',
    observacoes TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela da Liderança e Cargos Eclesiásticos
CREATE TABLE IF NOT EXISTS public.lideranca (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    cargo TEXT NOT NULL,
    ministerio TEXT NOT NULL,
    telefone TEXT NOT NULL,
    endereco TEXT NOT NULL,
    desde TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela de Visitantes e Acompanhamento Pastoral
CREATE TABLE IF NOT EXISTS public.visitantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    telefone TEXT NOT NULL,
    endereco TEXT,
    data_visita DATE NOT NULL DEFAULT CURRENT_DATE,
    culto TEXT NOT NULL,
    convidado_por TEXT,
    pedido_oracao TEXT,
    status_acompanhamento TEXT DEFAULT 'novo',
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabela de Controle de Presença nos Cultos (Área do Pastor)
CREATE TABLE IF NOT EXISTS public.cultos_frequencia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_culto DATE NOT NULL DEFAULT CURRENT_DATE,
    nome_culto TEXT NOT NULL,
    total_presentes INT NOT NULL DEFAULT 0,
    membros_presentes INT NOT NULL DEFAULT 0,
    visitantes_presentes INT NOT NULL DEFAULT 0,
    decisoes_conversoes INT NOT NULL DEFAULT 0,
    pregador TEXT,
    observacoes TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabela da Agenda da Igreja
CREATE TABLE IF NOT EXISTS public.agenda (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    descricao TEXT NOT NULL,
    data_evento DATE NOT NULL,
    horario TEXT NOT NULL,
    local_evento TEXT NOT NULL DEFAULT 'Templo IEQ Vila Andreza',
    categoria TEXT NOT NULL DEFAULT 'culto',
    destaque BOOLEAN DEFAULT FALSE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Tabela de Louvores, Letras e Cifras (Ministério de Louvor)
CREATE TABLE IF NOT EXISTS public.louvores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    artista TEXT NOT NULL,
    tom_original TEXT NOT NULL DEFAULT 'G',
    bpm INT DEFAULT 72,
    categoria TEXT DEFAULT 'Adoração',
    letra_cifrada TEXT NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Tabela de Sincronização Completa do Estado da Igreja (Escalas, Devocional e Configurações)
CREATE TABLE IF NOT EXISTS public.igreja_store (
    id TEXT PRIMARY KEY DEFAULT 'ieq_vila_andreza_main',
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
