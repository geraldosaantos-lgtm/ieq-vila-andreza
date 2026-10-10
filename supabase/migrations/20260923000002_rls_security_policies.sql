-- ============================================================================
-- MIGRATION 02: Row Level Security (RLS) - IEQ VILA ANDREZA
-- Versão: 20260923000002
-- Descrição: Políticas de segurança e acesso para o sistema da IEQ Vila Andreza
-- ============================================================================

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
