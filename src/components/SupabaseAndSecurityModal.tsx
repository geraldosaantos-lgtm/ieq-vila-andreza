import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  ShieldCheck,
  Copy,
  Check,
  ExternalLink,
  Code2,
  Download,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  GitBranch,
  Play,
  Info,
  UploadCloud,
  Globe,
  Rocket,
  Send,
} from 'lucide-react';
import { testSupabaseConnection, normalizeSupabaseUrl } from '../lib/supabase';
import { FULL_SUPABASE_SQL } from '../lib/sqlSchema';
import { seedDemoDataToSupabase } from '../lib/dataService';

interface SupabaseAndSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type MigrationItem = {
  filename: string;
  size: number;
  sql: string;
};

export const SupabaseAndSecurityModal: React.FC<SupabaseAndSecurityModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'github' | 'wizard' | 'migrations' | 'security'>('github');
  const [selectedFile, setSelectedFile] = useState<string>('full_schema.sql');
  const [fullSqlSchema, setFullSqlSchema] = useState<string>(FULL_SUPABASE_SQL);
  const [migrations, setMigrations] = useState<MigrationItem[]>([]);
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedStep3, setCopiedStep3] = useState<boolean>(false);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  // GitHub & Vercel Sync State
  const [githubRepo, setGithubRepo] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('IEQ_GITHUB_REPO');
      if (saved && saved !== 'geraldosaantos-lgtm/moda-praia') {
        return saved;
      }
    }
    return 'geraldosaantos-lgtm/ieq-vila-andreza';
  });
  const [githubBranch, setGithubBranch] = useState<string>(() =>
    typeof window !== 'undefined' ? localStorage.getItem('IEQ_GITHUB_BRANCH') || 'main' : 'main'
  );
  const [githubToken, setGithubToken] = useState<string>(() =>
    typeof window !== 'undefined' ? localStorage.getItem('IEQ_GITHUB_TOKEN') || '' : ''
  );
  const [githubPushStatus, setGithubPushStatus] = useState<{
    loading: boolean;
    success: boolean | null;
    message: string;
  }>({ loading: false, success: null, message: '' });

  const [vercelHookUrl, setVercelHookUrl] = useState<string>(() =>
    typeof window !== 'undefined' ? localStorage.getItem('IEQ_VERCEL_HOOK_URL') || '' : ''
  );
  const [vercelHookStatus, setVercelHookStatus] = useState<{
    loading: boolean;
    success: boolean | null;
    message: string;
  }>({ loading: false, success: null, message: '' });

  // Supabase State
  const [supabaseUrl, setSupabaseUrl] = useState<string>(
    () => (typeof window !== 'undefined' ? localStorage.getItem('AURA_SUPABASE_URL') || '' : '')
  );
  const [supabaseKey, setSupabaseKey] = useState<string>(
    () => (typeof window !== 'undefined' ? localStorage.getItem('AURA_SUPABASE_KEY') || '' : '')
  );
  const [testStatus, setTestStatus] = useState<{
    tested: boolean;
    loading: boolean;
    success: boolean;
    message: string;
    stage?: 'credentials' | 'network' | 'schema' | 'ok';
  }>({
    tested: false,
    loading: false,
    success: false,
    message: '',
  });

  useEffect(() => {
    if (isOpen) {
      fetch('/api/supabase/schema')
        .then((res) => {
          const contentType = res.headers.get('content-type') || '';
          if (res.ok && !contentType.includes('text/html')) {
            return res.text();
          }
          return FULL_SUPABASE_SQL;
        })
        .then((text) => {
          if (text && !text.includes('<!doctype') && !text.includes('<html')) {
            setFullSqlSchema(text);
          }
        })
        .catch(() => setFullSqlSchema(FULL_SUPABASE_SQL));

      fetch('/api/supabase/migrations')
        .then((res) => res.json())
        .then((data) => {
          if (data.migrations) {
            setMigrations(data.migrations);
          }
        })
        .catch((err) => console.error(err));

      fetch('/api/supabase/config')
        .then((res) => res.json())
        .then((data) => {
          if (data.config?.url && !supabaseUrl) setSupabaseUrl(data.config.url);
          if (data.config?.anonKey && !supabaseKey) setSupabaseKey(data.config.anonKey);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentSqlContent =
    selectedFile === 'full_schema.sql'
      ? fullSqlSchema
      : migrations.find((m) => m.filename === selectedFile)?.sql || fullSqlSchema;

  const handleCopySql = (textToCopy?: string, isStep3: boolean = false) => {
    navigator.clipboard.writeText(textToCopy || currentSqlContent);
    if (isStep3) {
      setCopiedStep3(true);
      setTimeout(() => setCopiedStep3(false), 2500);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownloadSql = () => {
    const blob = new Blob([currentSqlContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = selectedFile;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePushToGitHub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubRepo.trim() || !githubToken.trim()) {
      setGithubPushStatus({
        loading: false,
        success: false,
        message: 'Por favor, preencha o nome do repositório e o Personal Access Token do GitHub.',
      });
      return;
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('IEQ_GITHUB_REPO', githubRepo.trim());
      localStorage.setItem('IEQ_GITHUB_BRANCH', githubBranch.trim() || 'main');
      localStorage.setItem('IEQ_GITHUB_TOKEN', githubToken.trim());
    }

    setGithubPushStatus({
      loading: true,
      success: null,
      message: 'Enviando todos os arquivos da IEQ VILA ANDREZA para o GitHub e acionando a Vercel...',
    });

    try {
      const res = await fetch('/api/github/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo: githubRepo.trim(),
          branch: githubBranch.trim() || 'main',
          token: githubToken.trim(),
          commitMessage: 'Deploy IEQ VILA ANDREZA - Igreja do Evangelho Quadrangular',
        }),
      });
      const data = await res.json();
      setGithubPushStatus({
        loading: false,
        success: Boolean(data.success),
        message: data.message || (data.success ? 'Enviado com sucesso!' : 'Falha ao enviar para o GitHub.'),
      });
    } catch (err: any) {
      setGithubPushStatus({
        loading: false,
        success: false,
        message: `Erro ao conectar ao servidor local: ${err?.message || String(err)}`,
      });
    }
  };

  const handleTriggerVercelHook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vercelHookUrl.trim()) {
      setVercelHookStatus({
        loading: false,
        success: false,
        message: 'Cole a URL do Deploy Hook da Vercel antes de acionar.',
      });
      return;
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('IEQ_VERCEL_HOOK_URL', vercelHookUrl.trim());
    }

    setVercelHookStatus({
      loading: true,
      success: null,
      message: 'Acionando novo build na Vercel...',
    });

    try {
      const res = await fetch('/api/vercel/deploy-hook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hookUrl: vercelHookUrl.trim() }),
      });
      const data = await res.json();
      setVercelHookStatus({
        loading: false,
        success: Boolean(data.success),
        message: data.message || 'Resposta recebida da Vercel.',
      });
    } catch (err: any) {
      setVercelHookStatus({
        loading: false,
        success: false,
        message: `Erro ao chamar Deploy Hook: ${err?.message || String(err)}`,
      });
    }
  };

  const handleTestConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = normalizeSupabaseUrl(supabaseUrl);
    const cleanKey = supabaseKey.trim();

    if (!cleanUrl || !cleanKey) {
      setTestStatus({
        tested: true,
        loading: false,
        success: false,
        stage: 'credentials',
        message: 'Por favor, informe a URL do Projeto e a chave "anon public" do Supabase.',
      });
      return;
    }

    setTestStatus({ tested: false, loading: true, success: false, message: 'Conectando ao Supabase...' });

    if (typeof window !== 'undefined') {
      localStorage.setItem('AURA_SUPABASE_URL', cleanUrl);
      localStorage.setItem('AURA_SUPABASE_KEY', cleanKey);
    }

    try {
      await fetch('/api/supabase/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: cleanUrl, anonKey: cleanKey }),
      });
    } catch {
      // ignore
    }

    const result = await testSupabaseConnection(cleanUrl, cleanKey);
    setTestStatus({
      tested: true,
      loading: false,
      success: result.success,
      stage: result.stage,
      message: result.message,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-600" />
              <h2 className="text-xl font-bold text-slate-900 font-editorial">
                Atualizar Vercel, GitHub & Supabase · IEQ VILA ANDREZA
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Envie as atualizações para o GitHub/Vercel e gerencie o banco de dados na nuvem do Supabase.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-3 border-b border-slate-200 flex items-center gap-2 sm:gap-6 text-xs font-semibold bg-white overflow-x-auto">
          <button
            onClick={() => setActiveTab('github')}
            className={`pb-3 flex items-center gap-1.5 transition-colors border-b-2 -mb-px whitespace-nowrap cursor-pointer ${
              activeTab === 'github'
                ? 'border-red-600 text-red-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Rocket className="w-4 h-4 text-red-600" />
            <span>Atualizar Vercel & GitHub (1-Clique)</span>
          </button>

          <button
            onClick={() => setActiveTab('wizard')}
            className={`pb-3 flex items-center gap-1.5 transition-colors border-b-2 -mb-px whitespace-nowrap cursor-pointer ${
              activeTab === 'wizard'
                ? 'border-red-600 text-red-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Play className="w-4 h-4 text-emerald-600" />
            <span>Guia Rápido Supabase (4 Passos)</span>
          </button>

          <button
            onClick={() => setActiveTab('migrations')}
            className={`pb-3 flex items-center gap-1.5 transition-colors border-b-2 -mb-px whitespace-nowrap cursor-pointer ${
              activeTab === 'migrations'
                ? 'border-red-600 text-red-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>SQL das Tabelas da Igreja</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`pb-3 flex items-center gap-1.5 transition-colors border-b-2 -mb-px whitespace-nowrap cursor-pointer ${
              activeTab === 'security'
                ? 'border-red-600 text-red-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Segurança & Permissões Pastorais</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {activeTab === 'github' && (
            <div className="space-y-5">
              {/* Explicação clara sobre o motivo da Vercel não ter atualizado */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-amber-950 text-xs">
                    Por que a Vercel ainda não atualizou sozinha?
                  </h4>
                  <p className="text-amber-800 text-[11px] leading-relaxed">
                    No Google AI Studio, as alterações que fazemos ficam salvas primeiro aqui no seu ambiente de desenvolvimento. A <strong>Vercel</strong> só descobre que o app mudou quando o código novo é enviado (<strong>Commit / Push</strong>) para o seu repositório do <strong>GitHub</strong> (<code>{githubRepo || 'geraldosaantos-lgtm/ieq-vila-andreza'}</code>).
                  </p>
                  <p className="text-amber-900 font-semibold text-[11px]">
                    Escolha uma das duas opções abaixo para enviar agora para o GitHub e atualizar a Vercel imediatamente:
                  </p>
                </div>
              </div>

              {/* OPÇÃO A: Botão Nativo do AI Studio */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[11px] font-bold">
                      A
                    </span>
                    Opção 1 (Pelo Topo do Google AI Studio)
                  </span>
                  <a
                    href={`https://github.com/${githubRepo || 'geraldosaantos-lgtm/ieq-vila-andreza'}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-[11px] font-semibold flex items-center gap-1.5"
                  >
                    <span>Abrir Repositório no GitHub</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Olhe na barra superior do próprio <strong>Google AI Studio</strong> (fora da janela do app, no canto superior direito) e clique no ícone do <strong>GitHub / Sync to GitHub</strong> para conectar ou fazer o commit das alterações no repositório <code>ieq-vila-andreza</code>.
                </p>
              </div>

              {/* OPÇÃO B: Push Direto daqui do App via API do GitHub */}
              <div className="p-4 bg-white border-2 border-red-600/25 rounded-xl space-y-3 shadow-xs">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[11px] font-bold">
                      B
                    </span>
                    Opção 2: Enviar Direto daqui do App para o GitHub + Atualizar Vercel (1-Clique)
                  </span>
                  <a
                    href="https://github.com/settings/tokens/new?scopes=repo&description=IEQ+Vila+Andreza+Deploy"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-[11px] font-semibold flex items-center gap-1.5"
                  >
                    <span>Gerar Token do GitHub (1-Clique)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <p className="text-slate-600 text-[11px]">
                  Se preferir enviar direto por aqui, informe o seu repositório e um <strong>Personal Access Token (classic)</strong> do GitHub com a caixinha <code>repo</code> marcada:
                </p>

                <form onSubmit={handlePushToGitHub} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Repositório GitHub
                      </label>
                      <input
                        type="text"
                        value={githubRepo}
                        onChange={(e) => setGithubRepo(e.target.value)}
                        placeholder="geraldosaantos-lgtm/ieq-vila-andreza"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Branch Principal
                      </label>
                      <input
                        type="text"
                        value={githubBranch}
                        onChange={(e) => setGithubBranch(e.target.value)}
                        placeholder="main"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        GitHub Token (ghp_...)
                      </label>
                      <input
                        type="password"
                        value={githubToken}
                        onChange={(e) => setGithubToken(e.target.value)}
                        placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="submit"
                      disabled={githubPushStatus.loading}
                      className="px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold rounded-lg text-xs flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>
                        {githubPushStatus.loading
                          ? 'Enviando código para o GitHub...'
                          : 'Enviar Código da IEQ VILA ANDREZA para GitHub & Atualizar Vercel'}
                      </span>
                    </button>
                  </div>

                  {githubPushStatus.message && (
                    <div
                      className={`p-3 rounded-lg text-[11px] font-medium flex items-start gap-2 ${
                        githubPushStatus.success === true
                          ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                          : githubPushStatus.success === false
                          ? 'bg-rose-50 text-rose-900 border border-rose-200'
                          : 'bg-blue-50 text-blue-900 border border-blue-200'
                      }`}
                    >
                      {githubPushStatus.success === true ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : githubPushStatus.success === false ? (
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      ) : (
                        <RefreshCw className="w-4 h-4 text-blue-600 shrink-0 mt-0.5 animate-spin" />
                      )}
                      <span>{githubPushStatus.message}</span>
                    </div>
                  )}
                </form>
              </div>

              {/* OPÇÃO C: Deploy Hook da Vercel */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-2">
                    <Globe className="w-4 h-4 text-sky-600" />
                    <span>Opcional: Acionar Deploy Hook Direto da Vercel</span>
                  </span>
                  <a
                    href="https://vercel.com/dashboard"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-[11px] font-semibold flex items-center gap-1.5"
                  >
                    <span>Abrir Painel da Vercel</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-slate-600 text-[11px]">
                  Caso você tenha um <strong>Deploy Hook</strong> configurado na Vercel (<em>Settings &gt; Git &gt; Deploy Hooks</em>), cole abaixo para forçar a reconstrução imediata:
                </p>
                <form onSubmit={handleTriggerVercelHook} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={vercelHookUrl}
                    onChange={(e) => setVercelHookUrl(e.target.value)}
                    placeholder="https://api.vercel.com/v1/integrations/deploy/prj_..."
                    className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-xs"
                  />
                  <button
                    type="submit"
                    disabled={vercelHookStatus.loading}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs whitespace-nowrap cursor-pointer"
                  >
                    {vercelHookStatus.loading ? 'Acionando...' : 'Forçar Deploy na Vercel'}
                  </button>
                </form>
                {vercelHookStatus.message && (
                  <p
                    className={`text-[11px] font-medium p-2 rounded border ${
                      vercelHookStatus.success
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                        : 'bg-rose-50 text-rose-900 border-rose-200'
                    }`}
                  >
                    {vercelHookStatus.message}
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'wizard' && (
            <div className="space-y-6">
              <div className="p-3.5 bg-blue-50/90 border border-blue-200 rounded-xl flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-blue-900 text-xs">
                    O aplicativo da IEQ VILA ANDREZA já está 100% funcionando!
                  </h4>
                  <p className="text-blue-700 text-[11px] mt-0.5 leading-relaxed">
                    Todos os cadastros de membros, liderança, visitantes, escalas do grupo de louvor e cifras já salvam automaticamente. Conecte o Supabase quando desejar sincronizar com o PostgreSQL em nuvem.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* PASSO 1 */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[11px] font-bold">
                        1
                      </span>
                      Acessar seu Projeto no Supabase
                    </span>
                    <a
                      href="https://supabase.com/dashboard/new"
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <span>Abrir Supabase Dashboard</span>
                      <ExternalLink className="w-3 h-3 text-slate-500" />
                    </a>
                  </div>
                </div>

                {/* PASSO 2 */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[11px] font-bold">
                      2
                    </span>
                    Informar Project URL e Anon Key do Supabase
                  </span>

                  <form onSubmit={handleTestConnection} className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          1. Project URL
                        </label>
                        <input
                          type="text"
                          placeholder="https://seu-projeto.supabase.co"
                          value={supabaseUrl}
                          onChange={(e) => setSupabaseUrl(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          2. Project API Key (anon public)
                        </label>
                        <input
                          type="password"
                          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                          value={supabaseKey}
                          onChange={(e) => setSupabaseKey(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <button
                        type="submit"
                        disabled={testStatus.loading}
                        className="py-2 px-4 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{testStatus.loading ? 'Testando...' : 'Salvar & Testar Conexão'}</span>
                      </button>

                      {testStatus.tested && (
                        <div
                          className={`flex-1 p-2 rounded-lg text-[11px] font-medium flex items-center gap-2 ${
                            testStatus.success
                              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                              : 'bg-rose-50 text-rose-900 border border-rose-200'
                          }`}
                        >
                          {testStatus.success ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          )}
                          <span>{testStatus.message}</span>
                        </div>
                      )}
                    </div>
                  </form>
                </div>

                {/* PASSO 3 */}
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-950 text-xs flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[11px] font-bold">
                        3
                      </span>
                      Criar as Tabelas da IEQ Vila Andreza no SQL Editor
                    </span>
                    <a
                      href="https://supabase.com/dashboard/project/_/sql/new"
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <span>Abrir SQL Editor do Supabase</span>
                      <ExternalLink className="w-3 h-3 text-emerald-600" />
                    </a>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => handleCopySql(fullSqlSchema, true)}
                      className="py-2.5 px-4 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      {copiedStep3 ? (
                        <>
                          <Check className="w-4 h-4 text-white" />
                          <span>Script SQL Copiado! Cole no SQL Editor</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copiar Script SQL Completo da Igreja (1-Clique)</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleDownloadSql}
                      className="py-2.5 px-3 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Baixar full_schema.sql</span>
                    </button>
                  </div>
                </div>

                {/* PASSO 4 */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[11px] font-bold">
                      4
                    </span>
                    Sincronizar Dados com o Supabase
                  </span>
                  <div className="pt-1">
                    <button
                      type="button"
                      disabled={isSeeding}
                      onClick={async () => {
                        setIsSeeding(true);
                        setSeedMessage(null);
                        const res = await seedDemoDataToSupabase();
                        setIsSeeding(false);
                        setSeedMessage(res.message);
                      }}
                      className="py-2 px-3 text-xs font-semibold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <UploadCloud className="w-4 h-4 text-emerald-700" />
                      <span>
                        {isSeeding ? 'Enviando...' : 'Sincronizar Cadastros Atuais com o Supabase'}
                      </span>
                    </button>
                    {seedMessage && (
                      <p className="text-[11px] text-emerald-800 font-medium mt-2 bg-emerald-50 p-2 rounded border border-emerald-200">
                        {seedMessage}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'migrations' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="font-semibold text-slate-700 text-xs">
                  Script SQL Unificado (Membros, Liderança, Visitantes, Cultos, Agenda e Louvor)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopySql()}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copied ? 'Copiado!' : 'Copiar SQL'}</span>
                  </button>
                  <button
                    onClick={handleDownloadSql}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              <pre className="p-4 bg-slate-900 text-slate-200 font-mono text-[11px] rounded-xl overflow-x-auto max-h-96 leading-relaxed border border-slate-800 select-all">
                {currentSqlContent}
              </pre>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-red-600" />
                <span>Estrutura de Governança · IEQ VILA ANDREZA</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                O sistema organiza as permissões e áreas dedicadas para Pastor Titular, Liderança de Departamentos, Ministério de Louvor e Membros da igreja.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="text-[11px] text-slate-500">
            <span>IEQ VILA ANDREZA · PostgreSQL, GitHub &amp; Vercel Ready</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
