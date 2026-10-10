-- ============================================================================
-- MIGRATION 04: Dados Iniciais (Seed) - IEQ VILA ANDREZA
-- Versão: 20260923000004
-- ============================================================================

INSERT INTO public.agenda (titulo, descricao, data_evento, horario, local_evento, categoria, destaque)
VALUES
  ('Culto da Família & Santa Ceia', 'Noite de adoração, comunhão e celebração da Santa Ceia do Senhor com toda a igreja.', CURRENT_DATE + INTERVAL '3 days', '19:00', 'Templo Principal - IEQ Vila Andreza', 'santa_ceia', true),
  ('Culto de Cura e Libertação (Cálice Azul)', 'Clamor especial por milagres, cura divina e restauração de famílias.', CURRENT_DATE + INTERVAL '6 days', '19:30', 'Templo Principal - IEQ Vila Andreza', 'culto', true),
  ('Ensaio Geral do Ministério de Louvor', 'Passagem de som e preparação do repertório de domingo.', CURRENT_DATE + INTERVAL '2 days', '19:30', 'Altar IEQ Vila Andreza', 'ensaio', false)
ON CONFLICT DO NOTHING;
