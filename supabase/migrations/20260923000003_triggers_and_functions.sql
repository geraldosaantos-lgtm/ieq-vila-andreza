-- ============================================================================
-- MIGRATION 03: Triggers e Índices de Performance - IEQ VILA ANDREZA
-- Versão: 20260923000003
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_membros_nome ON public.membros(nome);
CREATE INDEX IF NOT EXISTS idx_lideranca_cargo ON public.lideranca(cargo);
CREATE INDEX IF NOT EXISTS idx_visitantes_data ON public.visitantes(data_visita DESC);
CREATE INDEX IF NOT EXISTS idx_cultos_data ON public.cultos_frequencia(data_culto DESC);
CREATE INDEX IF NOT EXISTS idx_agenda_data ON public.agenda(data_evento ASC);

CREATE OR REPLACE FUNCTION public.update_igreja_store_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_igreja_store_updated ON public.igreja_store;
CREATE TRIGGER trg_igreja_store_updated
BEFORE UPDATE ON public.igreja_store
FOR EACH ROW
EXECUTE FUNCTION public.update_igreja_store_timestamp();
