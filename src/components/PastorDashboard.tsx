import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  UserPlus,
  Activity,
  MessageCircle,
  Trash2,
  Send,
  X,
  CheckCircle2,
  Calendar,
  Award,
  SlidersHorizontal,
  BarChart3,
  HeartHandshake,
  Music,
  Eye,
  EyeOff,
  RotateCcw,
  Droplets,
  TrendingUp,
} from 'lucide-react';
import type {
  ChurchSettings,
  ChurchMember,
  LeadershipMember,
  ChurchVisitor,
  ServiceAttendanceRecord,
  WorshipMusician,
  WorshipScale,
  AgendaEvent,
} from '../types';
import { buildWhatsAppUrl } from '../lib/dataService';

interface PastorDashboardProps {
  churchSettings: ChurchSettings;
  members: ChurchMember[];
  leadership: LeadershipMember[];
  visitors: ChurchVisitor[];
  serviceRecords: ServiceAttendanceRecord[];
  worshipMusicians?: WorshipMusician[];
  worshipScales?: WorshipScale[];
  agenda?: AgendaEvent[];
  onAddVisitor: (visitor: Omit<ChurchVisitor, 'id' | 'createdAt'>) => void;
  onUpdateVisitorStatus: (
    id: string,
    status: ChurchVisitor['followUpStatus']
  ) => void;
  onDeleteVisitor: (id: string) => void;
  onAddServiceRecord: (
    record: Omit<ServiceAttendanceRecord, 'id' | 'createdAt'>
  ) => void;
  onDeleteServiceRecord: (id: string) => void;
}

export interface PastorDashboardVisibilityConfig {
  // KPIs
  kpi_total_members: boolean;
  kpi_baptized_members: boolean;
  kpi_last_attendance: boolean;
  kpi_avg_attendance: boolean;
  kpi_total_visitors: boolean;
  kpi_visitors_integrated: boolean;
  kpi_leadership_count: boolean;
  kpi_worship_ministry: boolean;
  kpi_agenda_events: boolean;
  // Sections
  section_whatsapp_center: boolean;
  section_attendance_chart: boolean;
  section_visitors_funnel: boolean;
  section_members_breakdown: boolean;
  section_visitors_table: boolean;
  section_services_table: boolean;
  section_quick_directory: boolean;
}

const DASHBOARD_CONFIG_STORAGE_KEY = 'ieq_pastor_dashboard_config_v1';

const DEFAULT_DASHBOARD_CONFIG: PastorDashboardVisibilityConfig = {
  kpi_total_members: true,
  kpi_baptized_members: true,
  kpi_last_attendance: true,
  kpi_avg_attendance: true,
  kpi_total_visitors: true,
  kpi_visitors_integrated: true,
  kpi_leadership_count: true,
  kpi_worship_ministry: false,
  kpi_agenda_events: false,
  section_whatsapp_center: true,
  section_attendance_chart: true,
  section_visitors_funnel: true,
  section_members_breakdown: true,
  section_visitors_table: true,
  section_services_table: true,
  section_quick_directory: false,
};

const KPI_OPTIONS: Array<{
  key: keyof PastorDashboardVisibilityConfig;
  label: string;
  description: string;
}> = [
  {
    key: 'kpi_total_members',
    label: 'Total de Membros',
    description: 'Quantidade total de membros cadastrados e ativos',
  },
  {
    key: 'kpi_baptized_members',
    label: 'Membros Batizados (%)',
    description: 'Total de batizados nas águas e percentual da igreja',
  },
  {
    key: 'kpi_last_attendance',
    label: 'Pessoas no Último Culto',
    description: 'Público total (membros + visitantes) do último culto',
  },
  {
    key: 'kpi_avg_attendance',
    label: 'Média & Pico de Público nos Cultos',
    description: 'Média de pessoas por culto e maior público registrado',
  },
  {
    key: 'kpi_total_visitors',
    label: 'Número de Visitantes',
    description: 'Total de visitantes e quantos aguardam boas-vindas',
  },
  {
    key: 'kpi_visitors_integrated',
    label: 'Visitantes Acolhidos / Integrados',
    description: 'Visitantes que já receberam mensagem ou foram integrados',
  },
  {
    key: 'kpi_leadership_count',
    label: 'Corpo de Liderança',
    description: 'Total de obreiros, diáconos e líderes de departamentos',
  },
  {
    key: 'kpi_worship_ministry',
    label: 'Ministério de Louvor & Escalas',
    description: 'Músicos/cantores ativos e escalas programadas',
  },
  {
    key: 'kpi_agenda_events',
    label: 'Programações na Agenda',
    description: 'Total de cultos, ensaios e eventos agendados',
  },
];

const SECTION_OPTIONS: Array<{
  key: keyof PastorDashboardVisibilityConfig;
  label: string;
  description: string;
}> = [
  {
    key: 'section_whatsapp_center',
    label: 'Disparo Rápido WhatsApp (Membro ou Visitante)',
    description: 'Barra de seleção rápida para enviar mensagem direta no WhatsApp',
  },
  {
    key: 'section_attendance_chart',
    label: 'Gráfico de Frequência nos Cultos (Membros vs Visitantes)',
    description: 'Visualização comparativa da evolução de público em cada culto',
  },
  {
    key: 'section_visitors_funnel',
    label: 'Funil de Acolhimento & Pedidos de Oração dos Visitantes',
    description: 'Resumo por etapa de acompanhamento e lista de motivos de oração',
  },
  {
    key: 'section_members_breakdown',
    label: 'Raio-X de Membros & Cargos da Liderança',
    description: 'Distribuição de membros por status/batismo e lista de cargos da liderança',
  },
  {
    key: 'section_visitors_table',
    label: 'Tabela de Controle de Visitantes (Nome, Contato e WhatsApp)',
    description: 'Lista completa de visitantes com status e botão de envio WhatsApp',
  },
  {
    key: 'section_services_table',
    label: 'Tabela de Histórico de Pessoas nos Cultos',
    description: 'Relatório detalhado de todos os cultos com contagem de membros e visitantes',
  },
  {
    key: 'section_quick_directory',
    label: 'Diretório Rápido de Membros & Liderança no Painel',
    description: 'Consulta rápida de endereço e telefone de todos os membros e líderes',
  },
];

export const PastorDashboard: React.FC<PastorDashboardProps> = ({
  churchSettings,
  members,
  leadership,
  visitors,
  serviceRecords,
  worshipMusicians = [],
  worshipScales = [],
  agenda = [],
  onAddVisitor,
  onUpdateVisitorStatus,
  onDeleteVisitor,
  onAddServiceRecord,
  onDeleteServiceRecord,
}) => {
  // --- Configurable Dashboard Visibility State ---
  const [dashConfig, setDashConfig] = useState<PastorDashboardVisibilityConfig>(() => {
    try {
      const saved = localStorage.getItem(DASHBOARD_CONFIG_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_DASHBOARD_CONFIG, ...JSON.parse(saved) };
      }
    } catch {
      // ignore storage errors
    }
    return DEFAULT_DASHBOARD_CONFIG;
  });
  const [showConfigurator, setShowConfigurator] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem(DASHBOARD_CONFIG_STORAGE_KEY, JSON.stringify(dashConfig));
    } catch {
      // ignore storage errors
    }
  }, [dashConfig]);

  const toggleConfigItem = (key: keyof PastorDashboardVisibilityConfig) => {
    setDashConfig((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const applyPreset = (preset: 'completo' | 'culto' | 'visitantes' | 'membresia') => {
    if (preset === 'completo') {
      setDashConfig({
        kpi_total_members: true,
        kpi_baptized_members: true,
        kpi_last_attendance: true,
        kpi_avg_attendance: true,
        kpi_total_visitors: true,
        kpi_visitors_integrated: true,
        kpi_leadership_count: true,
        kpi_worship_ministry: true,
        kpi_agenda_events: true,
        section_whatsapp_center: true,
        section_attendance_chart: true,
        section_visitors_funnel: true,
        section_members_breakdown: true,
        section_visitors_table: true,
        section_services_table: true,
        section_quick_directory: true,
      });
    } else if (preset === 'culto') {
      setDashConfig({
        kpi_total_members: true,
        kpi_baptized_members: false,
        kpi_last_attendance: true,
        kpi_avg_attendance: true,
        kpi_total_visitors: true,
        kpi_visitors_integrated: false,
        kpi_leadership_count: false,
        kpi_worship_ministry: true,
        kpi_agenda_events: true,
        section_whatsapp_center: false,
        section_attendance_chart: true,
        section_visitors_funnel: false,
        section_members_breakdown: false,
        section_visitors_table: false,
        section_services_table: true,
        section_quick_directory: false,
      });
    } else if (preset === 'visitantes') {
      setDashConfig({
        kpi_total_members: false,
        kpi_baptized_members: false,
        kpi_last_attendance: true,
        kpi_avg_attendance: false,
        kpi_total_visitors: true,
        kpi_visitors_integrated: true,
        kpi_leadership_count: false,
        kpi_worship_ministry: false,
        kpi_agenda_events: false,
        section_whatsapp_center: true,
        section_attendance_chart: false,
        section_visitors_funnel: true,
        section_members_breakdown: false,
        section_visitors_table: true,
        section_services_table: false,
        section_quick_directory: false,
      });
    } else if (preset === 'membresia') {
      setDashConfig({
        kpi_total_members: true,
        kpi_baptized_members: true,
        kpi_last_attendance: false,
        kpi_avg_attendance: false,
        kpi_total_visitors: false,
        kpi_visitors_integrated: false,
        kpi_leadership_count: true,
        kpi_worship_ministry: true,
        kpi_agenda_events: false,
        section_whatsapp_center: true,
        section_attendance_chart: false,
        section_visitors_funnel: false,
        section_members_breakdown: true,
        section_visitors_table: false,
        section_services_table: false,
        section_quick_directory: true,
      });
    }
  };

  // --- Visitor Registration Form State ---
  const [showVisitorForm, setShowVisitorForm] = useState<boolean>(false);
  const [visName, setVisName] = useState<string>('');
  const [visPhone, setVisPhone] = useState<string>('');
  const [visAddress, setVisAddress] = useState<string>('');
  const [visDate, setVisDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [visService, setVisService] = useState<string>('Culto da Família (Domingo)');
  const [visInvitedBy, setVisInvitedBy] = useState<string>('');
  const [visPrayer, setVisPrayer] = useState<string>('');

  // --- Service Attendance Record Form State ---
  const [showServiceForm, setShowServiceForm] = useState<boolean>(false);
  const [srvDate, setSrvDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [srvName, setSrvName] = useState<string>('Culto da Família & Celebração');
  const [srvPreacher, setSrvPreacher] = useState<string>(churchSettings.pastorName);
  const [srvMembersCount, setSrvMembersCount] = useState<number>(75);
  const [srvVisitorsCount, setSrvVisitorsCount] = useState<number>(8);
  const [srvNotes, setSrvNotes] = useState<string>('');

  // --- WhatsApp Direct Modal State ---
  const [whatsAppModal, setWhatsAppModal] = useState<{
    visitorId?: string;
    recipientName: string;
    recipientPhone: string;
    recipientType: 'visitante' | 'membro';
    prayerRequest?: string;
  } | null>(null);
  const [whatsAppMessage, setWhatsAppMessage] = useState<string>('');

  // --- Quick WhatsApp Selector for any Member or Visitor ---
  const [quickTargetType, setQuickTargetType] = useState<'visitante' | 'membro'>('visitante');
  const [quickSelectedId, setQuickSelectedId] = useState<string>('');

  // Metrics Calculation
  const totalMembers = members.length;
  const activeMembers = members.filter((m) => m.status === 'ativo').length;
  const discipleshipMembers = members.filter((m) => m.status === 'discipulado').length;
  const awayMembers = members.filter((m) => m.status === 'afastado').length;
  const baptizedMembers = members.filter((m) => m.baptized).length;
  const baptizedPercentage =
    totalMembers > 0 ? Math.round((baptizedMembers / totalMembers) * 100) : 0;

  const latestService = serviceRecords[0];
  const lastServiceAttendance = latestService ? latestService.totalAttendance : 0;
  const averageAttendance =
    serviceRecords.length > 0
      ? Math.round(
          serviceRecords.reduce((acc, s) => acc + s.totalAttendance, 0) /
            serviceRecords.length
        )
      : 0;
  const maxAttendance =
    serviceRecords.length > 0
      ? Math.max(...serviceRecords.map((s) => s.totalAttendance))
      : 0;

  const totalVisitors = visitors.length;
  const pendingVisitorsCount = visitors.filter((v) => v.followUpStatus === 'novo').length;
  const contactedVisitorsCount = visitors.filter(
    (v) => v.followUpStatus === 'mensagem_enviada'
  ).length;
  const followUpVisitorsCount = visitors.filter(
    (v) => v.followUpStatus === 'em_acompanhamento'
  ).length;
  const integratedVisitorsCount = visitors.filter(
    (v) => v.followUpStatus === 'integrado'
  ).length;

  const activeMusiciansCount = worshipMusicians.filter((m) => m.active).length;

  const enabledCount = Object.values(dashConfig).filter(Boolean).length;
  const totalWidgetsCount = Object.keys(dashConfig).length;

  const handleCreateVisitor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visName.trim() || !visPhone.trim()) return;
    onAddVisitor({
      name: visName.trim(),
      phone: visPhone.trim(),
      address: visAddress.trim() || undefined,
      visitDate: visDate,
      serviceName: visService.trim() || 'Culto Regular',
      invitedBy: visInvitedBy.trim() || undefined,
      prayerRequest: visPrayer.trim() || undefined,
      followUpStatus: 'novo',
    });
    setVisName('');
    setVisPhone('');
    setVisAddress('');
    setVisInvitedBy('');
    setVisPrayer('');
    setShowVisitorForm(false);
  };

  const handleCreateServiceRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const mCount = Number(srvMembersCount) || 0;
    const vCount = Number(srvVisitorsCount) || 0;
    onAddServiceRecord({
      date: srvDate,
      serviceName: srvName.trim() || 'Culto',
      preacher: srvPreacher.trim() || churchSettings.pastorName,
      membersCount: mCount,
      visitorsCount: vCount,
      totalAttendance: mCount + vCount,
      notes: srvNotes.trim() || undefined,
    });
    setSrvNotes('');
    setShowServiceForm(false);
  };

  const openVisitorWhatsApp = (visitor: ChurchVisitor) => {
    setWhatsAppModal({
      visitorId: visitor.id,
      recipientName: visitor.name,
      recipientPhone: visitor.phone,
      recipientType: 'visitante',
      prayerRequest: visitor.prayerRequest,
    });
    setWhatsAppMessage(
      `A Paz do Senhor, *${visitor.name}*! 🙏\n\nAqui é o *${churchSettings.pastorName}*, da *${churchSettings.name}*. Foi uma grande alegria receber a sua visita em nosso *${visitor.serviceName}*!\n\n${
        visitor.prayerRequest
          ? `Já colocamos o seu pedido de oração (_"${visitor.prayerRequest}"_) em nosso altar de intercessão.`
          : 'Estaremos orando por você e por toda a sua família.'
      }\n\nAs portas da nossa igreja estarão sempre abertas para você!`
    );
  };

  const openMemberWhatsApp = (member: { name: string; phone: string }) => {
    setWhatsAppModal({
      recipientName: member.name,
      recipientPhone: member.phone,
      recipientType: 'membro',
    });
    setWhatsAppMessage(
      `A Paz do Senhor, *${member.name}*! Tudo bem com você?\n\nAqui é o *${churchSettings.pastorName}*, da *${churchSettings.name}*. Passando para deixar uma palavra de bênção sobre o seu lar e lembrar que estamos juntos em oração!`
    );
  };

  const handleSendWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whatsAppModal) return;
    if (whatsAppModal.visitorId) {
      onUpdateVisitorStatus(whatsAppModal.visitorId, 'mensagem_enviada');
    }
    const url = buildWhatsAppUrl(whatsAppModal.recipientPhone, whatsAppMessage);
    window.open(url, '_blank', 'noopener,noreferrer');
    setWhatsAppModal(null);
  };

  const anyKpiVisible = KPI_OPTIONS.some((k) => dashConfig[k.key]);

  return (
    <div className="space-y-6">
      {/* Header da Área do Pastor */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-700" />
            <h1 className="text-xl font-extrabold text-slate-900">
              Área do Pastor · Dashboard Configurável & Acolhimento
            </h1>
          </div>
          <p className="text-xs text-slate-600">
            Personalize quais indicadores, gráficos e relatórios deseja visualizar no seu painel pastoral.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowConfigurator(!showConfigurator)}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap border ${
              showConfigurator
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-amber-50 text-amber-950 border-amber-300 hover:bg-amber-100'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 text-red-700" />
            <span>
              Configurar Dados do Dashboard ({enabledCount}/{totalWidgetsCount})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShowServiceForm(!showServiceForm)}
            className="px-3.5 py-2 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Activity className="w-4 h-4 text-sky-700" />
            <span>Registrar Público do Culto</span>
          </button>

          <button
            type="button"
            onClick={() => setShowVisitorForm(!showVisitorForm)}
            className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            <span>Cadastrar Novo Visitante</span>
          </button>
        </div>
      </div>

      {/* PAINEL CONFIGURADOR DO DASHBOARD (ESCOLHER DADOS A SEREM MOSTRADOS) */}
      {showConfigurator && (
        <div className="bg-white border-2 border-slate-900 rounded-2xl p-6 space-y-6 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-red-700" />
                <h2 className="text-base font-extrabold text-slate-900">
                  Escolher Dados a Serem Mostrados no Dashboard do Pastor
                </h2>
              </div>
              <p className="text-xs text-slate-600">
                Marque ou desmarque abaixo exatamente quais cartões numéricos (KPIs) e quais painéis/tabelas você quer ver. Suas escolhas ficam salvas automaticamente.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => applyPreset('completo')}
                className="px-3 py-1.5 text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                Mostrar Todos
              </button>
              <button
                type="button"
                onClick={() => applyPreset('culto')}
                className="px-3 py-1.5 text-xs font-semibold bg-sky-50 text-sky-900 hover:bg-sky-100 rounded-lg cursor-pointer"
              >
                Visão Cultos & Público
              </button>
              <button
                type="button"
                onClick={() => applyPreset('visitantes')}
                className="px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-900 hover:bg-red-100 rounded-lg cursor-pointer"
              >
                Foco Visitantes & WhatsApp
              </button>
              <button
                type="button"
                onClick={() => applyPreset('membresia')}
                className="px-3 py-1.5 text-xs font-semibold bg-purple-50 text-purple-900 hover:bg-purple-100 rounded-lg cursor-pointer"
              >
                Foco Membros & Liderança
              </button>
              <button
                type="button"
                onClick={() => setDashConfig(DEFAULT_DASHBOARD_CONFIG)}
                className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 cursor-pointer"
                title="Restaurar configuração padrão"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Padrão</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Coluna 1: Cartões de Indicadores (KPIs) */}
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                1. Indicadores Rápidos do Topo (Cartões Numéricos)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {KPI_OPTIONS.map((item) => {
                  const active = dashConfig[item.key];
                  return (
                    <label
                      key={item.key}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                        active
                          ? 'bg-slate-900/5 border-slate-900 text-slate-900'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={() => toggleConfigItem(item.key)}
                        className="mt-0.5 h-4 w-4 rounded accent-red-600 cursor-pointer"
                      />
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold leading-snug">{item.label}</div>
                        <div className="text-[11px] opacity-80 leading-tight">
                          {item.description}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Coluna 2: Seções, Gráficos e Relatórios */}
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                2. Painéis, Gráficos & Tabelas de Dados
              </h3>
              <div className="space-y-2">
                {SECTION_OPTIONS.map((item) => {
                  const active = dashConfig[item.key];
                  return (
                    <label
                      key={item.key}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                        active
                          ? 'bg-slate-900/5 border-slate-900 text-slate-900'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={() => toggleConfigItem(item.key)}
                        className="mt-0.5 h-4 w-4 rounded accent-red-600 cursor-pointer"
                      />
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold leading-snug">{item.label}</div>
                        <div className="text-[11px] opacity-80 leading-tight">
                          {item.description}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowConfigurator(false)}
              className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl cursor-pointer"
            >
              Concluir Personalização do Dashboard
            </button>
          </div>
        </div>
      )}

      {/* INDICADORES DE CONTROLE PASTORAL CONFIGURÁVEIS */}
      {anyKpiVisible && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {dashConfig.kpi_total_members && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-red-700">
                <span>TOTAL DE MEMBROS</span>
                <Users className="w-4 h-4" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900 tabular-nums">
                {totalMembers}
              </div>
              <div className="text-xs text-slate-500 tabular-nums">
                <span>{activeMembers} ativos</span>
                <span aria-hidden="true" className="mx-1.5">·</span>
                <span>{discipleshipMembers} em discipulado</span>
              </div>
            </div>
          )}

          {dashConfig.kpi_baptized_members && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-sky-700">
                <span>MEMBROS BATIZADOS</span>
                <Droplets className="w-4 h-4" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900 tabular-nums">
                {baptizedMembers}{' '}
                <span className="text-base font-bold text-sky-700">
                  ({baptizedPercentage}%)
                </span>
              </div>
              <div className="text-xs text-slate-500 tabular-nums">
                <span>{totalMembers - baptizedMembers} aguardando batismo nas águas</span>
              </div>
            </div>
          )}

          {dashConfig.kpi_last_attendance && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-amber-600">
                <span>PESSOAS NO ÚLTIMO CULTO</span>
                <Activity className="w-4 h-4" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900 tabular-nums">
                {lastServiceAttendance}
              </div>
              <div className="text-xs text-slate-500 tabular-nums">
                {latestService ? (
                  <span>
                    {latestService.membersCount} membros + {latestService.visitorsCount}{' '}
                    visitantes ({latestService.date})
                  </span>
                ) : (
                  <span>Nenhum culto registrado</span>
                )}
              </div>
            </div>
          )}

          {dashConfig.kpi_avg_attendance && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-700">
                <span>MÉDIA & PICO DE PÚBLICO</span>
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900 tabular-nums">
                {averageAttendance}{' '}
                <span className="text-xs font-semibold text-slate-500">pessoas/culto</span>
              </div>
              <div className="text-xs text-slate-500 tabular-nums">
                <span>Maior público: {maxAttendance} pessoas</span>
                <span aria-hidden="true" className="mx-1.5">·</span>
                <span>{serviceRecords.length} cultos</span>
              </div>
            </div>
          )}

          {dashConfig.kpi_total_visitors && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-sky-700">
                <span>NÚMERO DE VISITANTES</span>
                <UserPlus className="w-4 h-4" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900 tabular-nums">
                {totalVisitors}
              </div>
              <div className="text-xs text-slate-500 tabular-nums">
                <span>{pendingVisitorsCount} novo(s) aguardando boas-vindas</span>
              </div>
            </div>
          )}

          {dashConfig.kpi_visitors_integrated && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-700">
                <span>ACOLHIMENTO DE VISITANTES</span>
                <HeartHandshake className="w-4 h-4" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900 tabular-nums">
                {contactedVisitorsCount + followUpVisitorsCount + integratedVisitorsCount}
              </div>
              <div className="text-xs text-slate-500 tabular-nums">
                <span>{integratedVisitorsCount} integrado(s)</span>
                <span aria-hidden="true" className="mx-1.5">·</span>
                <span>{followUpVisitorsCount} em acompanhamento</span>
              </div>
            </div>
          )}

          {dashConfig.kpi_leadership_count && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-purple-700">
                <span>CORPO DE LIDERANÇA</span>
                <Award className="w-4 h-4" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900 tabular-nums">
                {leadership.length}
              </div>
              <div className="text-xs text-slate-500">
                <span>Obreiros, diáconos e líderes ativos</span>
              </div>
            </div>
          )}

          {dashConfig.kpi_worship_ministry && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-sky-700">
                <span>GRUPO DE LOUVOR</span>
                <Music className="w-4 h-4" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900 tabular-nums">
                {activeMusiciansCount}
              </div>
              <div className="text-xs text-slate-500 tabular-nums">
                <span>músicos/cantores</span>
                <span aria-hidden="true" className="mx-1.5">·</span>
                <span>{worshipScales.length} escala(s) ativa(s)</span>
              </div>
            </div>
          )}

          {dashConfig.kpi_agenda_events && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-amber-700">
                <span>AGENDA DA IGREJA</span>
                <Calendar className="w-4 h-4" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900 tabular-nums">
                {agenda.length}
              </div>
              <div className="text-xs text-slate-500">
                <span>Cultos, ensaios e eventos programados</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SEÇÃO 1: CENTRAL RÁPIDA DE ENVIO WHATSAPP (PASTOR -> MEMBRO OU VISITANTE) */}
      {dashConfig.section_whatsapp_center && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>Disparo Rápido do Pastor para WhatsApp (Membro ou Visitante)</span>
            </div>
            <p className="text-xs text-slate-600">
              Selecione qualquer visitante ou membro abaixo para redigir e enviar uma mensagem diretamente pelo WhatsApp.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <select
              value={quickTargetType}
              onChange={(e) => {
                setQuickTargetType(e.target.value as 'visitante' | 'membro');
                setQuickSelectedId('');
              }}
              className="px-3 py-2 text-xs font-semibold border border-slate-300 rounded-lg bg-slate-50"
            >
              <option value="visitante">Enviar para Visitante ({visitors.length})</option>
              <option value="membro">Enviar para Membro ({members.length})</option>
            </select>

            <select
              value={quickSelectedId}
              onChange={(e) => setQuickSelectedId(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white min-w-52"
            >
              <option value="">Escolha o nome na lista...</option>
              {quickTargetType === 'visitante'
                ? visitors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.phone})
                    </option>
                  ))
                : members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.phone})
                    </option>
                  ))}
            </select>

            <button
              type="button"
              disabled={!quickSelectedId}
              onClick={() => {
                if (quickTargetType === 'visitante') {
                  const v = visitors.find((x) => x.id === quickSelectedId);
                  if (v) openVisitorWhatsApp(v);
                } else {
                  const m = members.find((x) => x.id === quickSelectedId);
                  if (m) openMemberWhatsApp(m);
                }
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 rounded-lg flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Escrever Mensagem WhatsApp</span>
            </button>
          </div>
        </div>
      )}

      {/* FORMULÁRIO: CADASTRAR VISITANTE */}
      {showVisitorForm && (
        <form
          onSubmit={handleCreateVisitor}
          className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4"
        >
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
            Cadastrar Novo Visitante no Culto (Nome e Contato para Acolhimento)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome do Visitante *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Fernanda Costa"
                value={visName}
                onChange={(e) => setVisName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Telefone / WhatsApp de Contato *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: 11997776655"
                value={visPhone}
                onChange={(e) => setVisPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Culto que Visitou
              </label>
              <input
                type="text"
                value={visService}
                onChange={(e) => setVisService(e.target.value)}
                placeholder="Ex: Culto da Família"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data da Visita
              </label>
              <input
                type="date"
                value={visDate}
                onChange={(e) => setVisDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Convidado(a) por qual Membro?
              </label>
              <input
                type="text"
                placeholder="Opcional"
                value={visInvitedBy}
                onChange={(e) => setVisInvitedBy(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Endereço / Bairro
              </label>
              <input
                type="text"
                placeholder="Ex: Vila Andreza"
                value={visAddress}
                onChange={(e) => setVisAddress(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pedido de Oração / Motivo da Visita
              </label>
              <input
                type="text"
                placeholder="Ex: Oração pela família e saúde..."
                value={visPrayer}
                onChange={(e) => setVisPrayer(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowVisitorForm(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer"
            >
              Salvar Visitante na Lista do Pastor
            </button>
          </div>
        </form>
      )}

      {/* FORMULÁRIO: REGISTRAR PÚBLICO DO CULTO */}
      {showServiceForm && (
        <form
          onSubmit={handleCreateServiceRecord}
          className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4"
        >
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
            Registrar Número de Pessoas no Culto (Membros + Visitantes)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome do Culto *
              </label>
              <input
                type="text"
                required
                value={srvName}
                onChange={(e) => setSrvName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data *
              </label>
              <input
                type="date"
                required
                value={srvDate}
                onChange={(e) => setSrvDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nº Membros Presentes *
              </label>
              <input
                type="number"
                min={0}
                required
                value={srvMembersCount}
                onChange={(e) => setSrvMembersCount(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nº Visitantes no Culto *
              </label>
              <input
                type="number"
                min={0}
                required
                value={srvVisitorsCount}
                onChange={(e) => setSrvVisitorsCount(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono tabular-nums"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Preletor / Pastor
              </label>
              <input
                type="text"
                value={srvPreacher}
                onChange={(e) => setSrvPreacher(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div className="lg:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Observações do Culto (Decisões, Batismos, Testemunhos)
              </label>
              <input
                type="text"
                value={srvNotes}
                onChange={(e) => setSrvNotes(e.target.value)}
                placeholder="Ex: 2 almas aceitaram a Jesus..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowServiceForm(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              Salvar Relatório de Culto
            </button>
          </div>
        </form>
      )}

      {/* PAINÉIS ANALÍTICOS CONFIGURÁVEIS: GRÁFICO DE FREQUÊNCIA + FUNIL DE VISITANTES */}
      {(dashConfig.section_attendance_chart || dashConfig.section_visitors_funnel) && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* SEÇÃO 2: GRÁFICO DE EVOLUÇÃO DE PÚBLICO NOS CULTOS */}
          {dashConfig.section_attendance_chart && (
            <div
              className={`${
                dashConfig.section_visitors_funnel ? 'lg:col-span-7' : 'lg:col-span-12'
              } bg-white border border-slate-200 rounded-2xl p-6 space-y-4`}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-amber-600" />
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Evolução de Público nos Cultos (Membros vs Visitantes)
                    </h2>
                    <p className="text-xs text-slate-500">
                      Comparativo visual de presença nos últimos cultos registrados.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleConfigItem('section_attendance_chart')}
                  className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
                  title="Ocultar este gráfico do dashboard"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Ocultar</span>
                </button>
              </div>

              {serviceRecords.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">
                  Nenhum culto registrado para gerar gráfico de frequência.
                </p>
              ) : (
                <div className="space-y-3 pt-1">
                  {serviceRecords.slice(0, 6).map((srv) => {
                    const maxBar = Math.max(maxAttendance, 1);
                    const membersWidth = Math.round((srv.membersCount / maxBar) * 100);
                    const visitorsWidth = Math.round((srv.visitorsCount / maxBar) * 100);
                    return (
                      <div key={srv.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-slate-900">{srv.serviceName}</span>
                            <span aria-hidden="true" className="mx-1.5 text-slate-300">
                              ·
                            </span>
                            <span className="font-mono text-slate-500 tabular-nums">
                              {srv.date}
                            </span>
                          </div>
                          <div className="font-mono tabular-nums text-xs">
                            <span className="text-slate-700">{srv.membersCount} membros</span>
                            <span className="mx-1 text-slate-300">+</span>
                            <span className="text-sky-700 font-bold">
                              {srv.visitorsCount} visitantes
                            </span>
                            <span className="ml-2 font-extrabold text-slate-900">
                              = {srv.totalAttendance}
                            </span>
                          </div>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                          <div
                            style={{ width: `${membersWidth}%` }}
                            className="bg-slate-800 h-full transition-all"
                            title={`${srv.membersCount} membros`}
                          />
                          <div
                            style={{ width: `${visitorsWidth}%` }}
                            className="bg-sky-500 h-full transition-all"
                            title={`${srv.visitorsCount} visitantes`}
                          />
                        </div>
                      </div>
                    );
                  })}

                  <div className="pt-2 flex items-center gap-4 text-xs text-slate-600 border-t border-slate-100">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-xs bg-slate-800 inline-block" />
                      Membros Presentes
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-xs bg-sky-500 inline-block" />
                      Visitantes no Culto
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SEÇÃO 3: FUNIL DE ACOLHIMENTO DE VISITANTES & PEDIDOS DE ORAÇÃO */}
          {dashConfig.section_visitors_funnel && (
            <div
              className={`${
                dashConfig.section_attendance_chart ? 'lg:col-span-5' : 'lg:col-span-12'
              } bg-white border border-slate-200 rounded-2xl p-6 space-y-4`}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <HeartHandshake className="w-5 h-5 text-red-700" />
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Funil de Acolhimento & Oração
                    </h2>
                    <p className="text-xs text-slate-500">
                      Status dos visitantes e pedidos de intercessão.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleConfigItem('section_visitors_funnel')}
                  className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
                  title="Ocultar este painel do dashboard"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Ocultar</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-slate-500 font-medium">Novos (Sem Contato)</div>
                  <div className="text-xl font-extrabold text-red-700 tabular-nums mt-0.5">
                    {pendingVisitorsCount}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-slate-500 font-medium">Mensagem Enviada</div>
                  <div className="text-xl font-extrabold text-amber-600 tabular-nums mt-0.5">
                    {contactedVisitorsCount}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-slate-500 font-medium">Em Acompanhamento</div>
                  <div className="text-xl font-extrabold text-sky-700 tabular-nums mt-0.5">
                    {followUpVisitorsCount}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-slate-500 font-medium">Integrados à Igreja</div>
                  <div className="text-xl font-extrabold text-emerald-700 tabular-nums mt-0.5">
                    {integratedVisitorsCount}
                  </div>
                </div>
              </div>

              {/* Pedidos de Oração Recentes */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-800 block">
                  Pedidos de Oração dos Visitantes:
                </span>
                <div className="max-h-36 overflow-y-auto space-y-2">
                  {visitors.filter((v) => v.prayerRequest).length === 0 ? (
                    <p className="text-xs text-slate-500">
                      Nenhum pedido de oração específico registrado.
                    </p>
                  ) : (
                    visitors
                      .filter((v) => v.prayerRequest)
                      .map((v) => (
                        <div
                          key={v.id}
                          className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs flex items-start justify-between gap-2"
                        >
                          <div>
                            <strong className="text-slate-900">{v.name}:</strong>{' '}
                            <span className="text-slate-600">{v.prayerRequest}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => openVisitorWhatsApp(v)}
                            className="text-emerald-700 font-bold hover:underline shrink-0 cursor-pointer"
                          >
                            Orar/WhatsApp
                          </button>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SEÇÃO 4: RAIO-X DE MEMBROS & CARGOS DA LIDERANÇA */}
      {dashConfig.section_members_breakdown && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-700" />
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Raio-X da Membresia & Cargos da Liderança
                </h2>
                <p className="text-xs text-slate-500">
                  Panorama espiritual dos membros cadastrados e distribuição de cargos na IEQ Vila Andreza.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => toggleConfigItem('section_members_breakdown')}
              className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ocultar</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Estatísticas de Membresia */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-slate-500 font-medium">Membros em Comunhão</span>
                <div className="text-2xl font-extrabold text-slate-900 tabular-nums">
                  {activeMembers}
                </div>
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-slate-500 font-medium">Em Discipulado</span>
                <div className="text-2xl font-extrabold text-sky-700 tabular-nums">
                  {discipleshipMembers}
                </div>
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-slate-500 font-medium">Batizados nas Águas</span>
                <div className="text-2xl font-extrabold text-emerald-700 tabular-nums">
                  {baptizedMembers} ({baptizedPercentage}%)
                </div>
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-slate-500 font-medium">Precisam de Visita/Afastados</span>
                <div className="text-2xl font-extrabold text-red-700 tabular-nums">
                  {awayMembers}
                </div>
              </div>
            </div>

            {/* Quadro de Líderes e Cargos Ocupados */}
            <div className="lg:col-span-7 space-y-2">
              <span className="text-xs font-bold text-slate-800 block">
                Liderança Ativa por Cargo Ocupado ({leadership.length}):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto">
                {leadership.map((leader) => (
                  <div
                    key={leader.id}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{leader.name}</div>
                      <div className="text-[11px] text-purple-700 font-semibold">
                        {leader.roleTitle} · {leader.department}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        openMemberWhatsApp({ name: leader.name, phone: leader.phone })
                      }
                      className="px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md cursor-pointer shrink-0"
                    >
                      WhatsApp
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SEÇÃO 5: TABELA DE NOME E CONTATO DOS VISITANTES + DISPARO WHATSAPP */}
      {dashConfig.section_visitors_table && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Controle de Visitantes (Nome, Contato & Integração WhatsApp)
              </h2>
              <p className="text-xs text-slate-500">
                Envie mensagem de boas-vindas diretamente pelo aplicativo para o WhatsApp de cada visitante.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-sky-700 tabular-nums">
                {visitors.length} visitante(s) registrado(s)
              </span>
              <button
                type="button"
                onClick={() => toggleConfigItem('section_visitors_table')}
                className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ocultar</span>
              </button>
            </div>
          </div>

          {visitors.length === 0 ? (
            <div className="p-8 text-center border border-slate-200 rounded-xl space-y-2">
              <p className="text-xs font-semibold text-slate-700">
                Nenhum visitante cadastrado no momento.
              </p>
              <button
                type="button"
                onClick={() => setShowVisitorForm(true)}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-red-600 rounded-lg cursor-pointer"
              >
                Cadastrar Primeiro Visitante
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="py-3 px-4">Nome do Visitante</th>
                    <th className="py-3 px-4">Contato (WhatsApp)</th>
                    <th className="py-3 px-4">Culto & Data da Visita</th>
                    <th className="py-3 px-4">Pedido de Oração / Quem Convidou</th>
                    <th className="py-3 px-4">Status de Acolhimento</th>
                    <th className="py-3 px-4 text-right">Enviar WhatsApp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visitors.map((vis) => (
                    <tr key={vis.id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{vis.name}</div>
                        {vis.address && (
                          <div className="text-[11px] text-slate-500">{vis.address}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold tabular-nums text-slate-800">
                        {vis.phone}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{vis.serviceName}</div>
                        <div className="text-slate-500 font-mono tabular-nums">
                          {vis.visitDate}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs">
                        {vis.prayerRequest && (
                          <div>
                            <strong className="text-slate-800">Oração:</strong>{' '}
                            {vis.prayerRequest}
                          </div>
                        )}
                        {vis.invitedBy && (
                          <div className="text-[11px] text-slate-500">
                            Convidado por: {vis.invitedBy}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={vis.followUpStatus}
                          onChange={(e) =>
                            onUpdateVisitorStatus(
                              vis.id,
                              e.target.value as ChurchVisitor['followUpStatus']
                            )
                          }
                          className="px-2.5 py-1 text-xs font-semibold border border-slate-200 rounded-md bg-white"
                        >
                          <option value="novo">Novo Visitante</option>
                          <option value="mensagem_enviada">Mensagem Enviada</option>
                          <option value="em_acompanhamento">Em Acompanhamento</option>
                          <option value="integrado">Integrado à Igreja</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openVisitorWhatsApp(vis)}
                            className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Mensagem WhatsApp</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteVisitor(vis.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer"
                            title="Excluir visitante"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SEÇÃO 6: TABELA DE HISTÓRICO DE PRESENÇA NOS CULTOS */}
      {dashConfig.section_services_table && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Histórico de Pessoas nos Cultos (Membros & Visitantes)
              </h2>
              <p className="text-xs text-slate-500">
                Acompanhamento de frequência dos cultos de domingo, quarta-feira e eventos especiais.
              </p>
            </div>
            <button
              type="button"
              onClick={() => toggleConfigItem('section_services_table')}
              className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ocultar</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Culto</th>
                  <th className="py-3 px-4">Pregador(a)</th>
                  <th className="py-3 px-4 text-right">Membros</th>
                  <th className="py-3 px-4 text-right">Visitantes</th>
                  <th className="py-3 px-4 text-right">Total de Pessoas no Culto</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {serviceRecords.map((srv) => (
                  <tr key={srv.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-700">
                      {srv.date}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{srv.serviceName}</div>
                      {srv.notes && (
                        <div className="text-[11px] text-slate-500">{srv.notes}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-700">{srv.preacher}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                      {srv.membersCount}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-sky-700">
                      +{srv.visitorsCount}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-extrabold text-slate-900">
                      {srv.totalAttendance} pessoas
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onDeleteServiceRecord(srv.id)}
                        className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                        title="Remover registro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SEÇÃO 7: DIRETÓRIO RÁPIDO DE MEMBROS & LIDERANÇA */}
      {dashConfig.section_quick_directory && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Diretório Rápido de Membros ({members.length})
              </h2>
              <p className="text-xs text-slate-500">
                Consulta rápida de endereço e telefone dos membros diretamente no painel pastoral.
              </p>
            </div>
            <button
              type="button"
              onClick={() => toggleConfigItem('section_quick_directory')}
              className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ocultar</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-3 px-4">Nome do Membro</th>
                  <th className="py-3 px-4">Endereço</th>
                  <th className="py-3 px-4">Telefone</th>
                  <th className="py-3 px-4 text-right">Contato Pastoral</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((mem) => (
                  <tr key={mem.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-bold text-slate-900">{mem.name}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {mem.address} · {mem.neighborhood}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-800">
                      {mem.phone}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => openMemberWhatsApp(mem)}
                        className="px-3 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg inline-flex items-center gap-1 cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Caso o pastor tenha ocultado absolutamente todos os widgets */}
      {enabledCount === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
          <Eye className="w-8 h-8 text-slate-400 mx-auto" />
          <div className="text-sm font-bold text-slate-800">
            Todos os blocos do Dashboard estão ocultos no momento.
          </div>
          <p className="text-xs text-slate-500">
            Clique no botão abaixo para escolher quais indicadores e tabelas deseja mostrar na Área do Pastor.
          </p>
          <button
            type="button"
            onClick={() => setShowConfigurator(true)}
            className="px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl cursor-pointer"
          >
            Escolher Dados a Serem Mostrados
          </button>
        </div>
      )}

      {/* MODAL DE COMPOSIÇÃO E DISPARO WHATSAPP DO PASTOR */}
      {whatsAppModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSendWhatsApp}
            className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Integração WhatsApp · Mensagem Pastoral
                </h3>
                <p className="text-xs text-slate-500">
                  Para: <strong>{whatsAppModal.recipientName}</strong> (
                  {whatsAppModal.recipientPhone})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setWhatsAppModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-700 block">
                Escolha um modelo rápido ou edite livremente:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setWhatsAppMessage(
                      `A Paz do Senhor, *${whatsAppModal.recipientName}*! 🙏\n\nAqui é o *${churchSettings.pastorName}*, da *${churchSettings.name}*. Ficamos muito felizes com a sua presença em nosso culto! Saiba que estamos orando por você e sua família. Volte sempre!`
                    )
                  }
                  className="px-2.5 py-1 text-xs font-medium bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-md cursor-pointer"
                >
                  Boas-Vindas Visitante
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setWhatsAppMessage(
                      `Olá, *${whatsAppModal.recipientName}*! Paz do Senhor!\n\nPassando para dizer que estivemos orando pelo seu pedido na *${churchSettings.name}*. Cremos que Jesus Cristo, o Grande Médico e Salvador, está operando milagres em sua vida!`
                    )
                  }
                  className="px-2.5 py-1 text-xs font-medium bg-sky-50 text-sky-800 hover:bg-sky-100 rounded-md cursor-pointer"
                >
                  Cuidado & Oração
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setWhatsAppMessage(
                      `Paz do Senhor, *${whatsAppModal.recipientName}*! Neste domingo às 19h teremos um Culto da Família especial na *${churchSettings.name}*. Será uma honra receber você e sua casa!`
                    )
                  }
                  className="px-2.5 py-1 text-xs font-medium bg-amber-50 text-amber-900 hover:bg-amber-100 rounded-md cursor-pointer"
                >
                  Convite Culto de Domingo
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Texto da Mensagem:
              </label>
              <textarea
                rows={5}
                required
                value={whatsAppMessage}
                onChange={(e) => setWhatsAppMessage(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setWhatsAppModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar Direto para o WhatsApp</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
