-- ============================================================================
-- IEQ VILA ANDREZA - IGREJA DO EVANGELHO QUADRANGULAR
-- SCHEMA COMPLETO SUPABASE / POSTGRESQL 15
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

-- 2. Tabela da Liderança e Cargos
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

-- 4. Tabela de Controle de Cultos (Área do Pastor)
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

-- 7. Tabela de Sincronização em Nuvem do Estado Completo (Escalas, Devocional e Configurações)
CREATE TABLE IF NOT EXISTS public.igreja_store (
    id TEXT PRIMARY KEY DEFAULT 'ieq_vila_andreza_main',
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS e Políticas de Acesso
ALTER TABLE public.membros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lideranca ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cultos_frequencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.louvores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.igreja_store ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso Total IEQ Membros" ON public.membros;
CREATE POLICY "Acesso Total IEQ Membros" ON public.membros FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso Total IEQ Lideranca" ON public.lideranca;
CREATE POLICY "Acesso Total IEQ Lideranca" ON public.lideranca FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso Total IEQ Visitantes" ON public.visitantes;
CREATE POLICY "Acesso Total IEQ Visitantes" ON public.visitantes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso Total IEQ Cultos" ON public.cultos_frequencia;
CREATE POLICY "Acesso Total IEQ Cultos" ON public.cultos_frequencia FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso Total IEQ Agenda" ON public.agenda;
CREATE POLICY "Acesso Total IEQ Agenda" ON public.agenda FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso Total IEQ Louvores" ON public.louvores;
CREATE POLICY "Acesso Total IEQ Louvores" ON public.louvores FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso Total IEQ Store" ON public.igreja_store;
CREATE POLICY "Acesso Total IEQ Store" ON public.igreja_store FOR ALL USING (true) WITH CHECK (true);
