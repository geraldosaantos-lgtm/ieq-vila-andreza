# ✝️🕊️🍷👑 IEQ VILA ANDREZA — Sistema de Gestão Eclesiástica (Igreja do Evangelho Quadrangular)

Sistema completo para gestão eclesiástica da **IEQ Vila Andreza**, incluindo Devocional Diário, Mensagem Pastoral, Agenda de Eventos com alerta de novidades, Ministério de Louvor (escala justa automática com confirmação em até 3 dias + pasta de louvores com cifras, transposição de tom e Modo Projeção Telão), Cadastro de Membros e Liderança, e Painel Pastoral com controle de visitantes e envio direto via WhatsApp.

---

## 🏗️ Arquitetura do Projeto

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + Lucide Icons.
- **Backend**: Express com endpoints REST e sincronização local/nuvem.
- **Banco de Dados**: **Supabase (PostgreSQL 15)** com sincronização automática em tempo real e fallback local.
- **CI/CD & Hospedagem**: GitHub Actions + Deploy automático na **Vercel**.

---

## 🔄 Como Atualizar a Vercel (Passo a Passo Rápido)

A Vercel atualiza automaticamente sempre que o código novo é enviado para o seu repositório do **GitHub**.

### Opção 1: Pelo botão nativo do Google AI Studio (Mais fácil)
1. No canto superior direito da tela do **Google AI Studio**, clique no ícone do **GitHub** (ou menu de exportação/sincronização com GitHub).
2. Faça o **Commit & Push** das alterações para o seu repositório (`geraldosaantos-lgtm/ieq-vila-andreza`).
3. Assim que o envio para o GitHub concluir, a **Vercel** detectará o novo commit e publicará a versão da **IEQ VILA ANDREZA** em cerca de 30 a 60 segundos!

### Opção 2: Sincronização Direta pelo Painel do App (GitHub API / Deploy Hook da Vercel)
1. Dentro do próprio aplicativo da **IEQ VILA ANDREZA**, clique no botão **"GitHub & Supabase"** no topo da página.
2. Abra a aba **"GitHub CI/CD & Vercel Deploy"**.
3. Você pode acionar um **Deploy Hook da Vercel** com 1 clique ou sincronizar os arquivos diretamente com seu repositório do GitHub usando seu Personal Access Token.

---

## 🗄️ Estrutura de Migrations do Supabase

Todas as migrations do banco de dados estão localizadas na pasta [`/supabase/migrations`](./supabase/migrations):

| Migration | Arquivo | Descrição |
| :--- | :--- | :--- |
| **01 - Schema Inicial** | `20260923000001_initial_schema.sql` | Tabelas `membros`, `lideranca`, `visitantes`, `cultos_frequencia`, `agenda`, `louvor_musicos`, `louvor_escalas`, `louvores` e `igreja_store`. |
| **02 - Segurança & RLS** | `20260923000002_rls_security_policies.sql` | Políticas de Row Level Security (RLS) para leitura e escrita da igreja. |
| **03 - Triggers & Índices** | `20260923000003_triggers_and_functions.sql` | Índices de performance para agenda, escalas, membros e visitantes. |
| **04 - Dados Iniciais (Seed)** | `20260923000004_seed_data.sql` | Dados iniciais da IEQ Vila Andreza. |
| **Unificado (1-Click)** | `supabase/full_schema.sql` | Script único consolidado pronto para colar e executar no SQL Editor do Supabase. |
