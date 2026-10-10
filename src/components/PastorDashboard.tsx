import React, { useState } from 'react';
import {
  Shield,
  Users,
  UserPlus,
  Activity,
  MessageCircle,
  Plus,
  Trash2,
  Send,
  X,
  CheckCircle2,
  Calendar,
  Award,
} from 'lucide-react';
import type {
  ChurchSettings,
  ChurchMember,
  LeadershipMember,
  ChurchVisitor,
  ServiceAttendanceRecord,
} from '../types';
import { buildWhatsAppUrl } from '../lib/dataService';

interface PastorDashboardProps {
  churchSettings: ChurchSettings;
  members: ChurchMember[];
  leadership: LeadershipMember[];
  visitors: ChurchVisitor[];
  serviceRecords: ServiceAttendanceRecord[];
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

export const PastorDashboard: React.FC<PastorDashboardProps> = ({
  churchSettings,
  members,
  leadership,
  visitors,
  serviceRecords,
  onAddVisitor,
  onUpdateVisitorStatus,
  onDeleteVisitor,
  onAddServiceRecord,
  onDeleteServiceRecord,
}) => {
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
  const latestService = serviceRecords[0];
  const lastServiceAttendance = latestService ? latestService.totalAttendance : 0;
  const averageAttendance =
    serviceRecords.length > 0
      ? Math.round(
          serviceRecords.reduce((acc, s) => acc + s.totalAttendance, 0) /
            serviceRecords.length
        )
      : 0;
  const totalVisitors = visitors.length;
  const pendingVisitorsCount = visitors.filter((v) => v.followUpStatus === 'novo').length;

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

  const openMemberWhatsApp = (member: ChurchMember) => {
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

  return (
    <div className="space-y-6">
      {/* Header da Área do Pastor */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-700" />
            <h1 className="text-xl font-extrabold text-slate-900">
              Área do Pastor · Painel de Controle & Acolhimento
            </h1>
          </div>
          <p className="text-xs text-slate-600">
            Controle pastoral de membros, contagem de pessoas nos cultos, cadastro de visitantes e disparo direto para WhatsApp.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
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

      {/* 4 KPIs DE CONTROLE PASTORAL (NAS 4 CORES DA DOUTRINA QUADRANGULAR) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Número de Membros */}
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
            <span>{members.filter((m) => m.baptized).length} batizados</span>
          </div>
        </div>

        {/* KPI 2: Número de Pessoas no Culto */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-amber-600">
            <span>PESSOAS NO ÚLTIMO CULTO</span>
            <Activity className="w-4 h-4" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tabular-nums">
            {lastServiceAttendance}
          </div>
          <div className="text-xs text-slate-500 tabular-nums">
            <span>Média: {averageAttendance} pessoas/culto</span>
          </div>
        </div>

        {/* KPI 3: Número de Visitantes */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-sky-700">
            <span>NÚMERO DE VISITANTES</span>
            <UserPlus className="w-4 h-4" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tabular-nums">
            {totalVisitors}
          </div>
          <div className="text-xs text-slate-500 tabular-nums">
            <span>{pendingVisitorsCount} aguardando boas-vindas</span>
          </div>
        </div>

        {/* KPI 4: Liderança Ativa */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-purple-700">
            <span>CORPO DE LIDERANÇA</span>
            <Award className="w-4 h-4" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tabular-nums">
            {leadership.length}
          </div>
          <div className="text-xs text-slate-500">
            <span>Obreiros, diáconos e líderes</span>
          </div>
        </div>
      </div>

      {/* CENTRAL RÁPIDA DE ENVIO WHATSAPP (PASTOR -> MEMBRO OU VISITANTE) */}
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

      {/* TABELA 1: NOME E CONTATO DOS VISITANTES + DISPARO WHATSAPP */}
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
          <span className="text-xs font-bold text-sky-700 tabular-nums">
            {visitors.length} visitante(s) registrado(s)
          </span>
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
                      <div className="text-slate-500 font-mono tabular-nums">{vis.visitDate}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs">
                      {vis.prayerRequest && (
                        <div>
                          <strong className="text-slate-800">Oração:</strong> {vis.prayerRequest}
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
                          onUpdateVisitorStatus(vis.id, e.target.value as any)
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

      {/* TABELA 2: HISTÓRICO DE PRESENÇA NOS CULTOS */}
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
                    {srv.notes && <div className="text-[11px] text-slate-500">{srv.notes}</div>}
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
                  Para: <strong>{whatsAppModal.recipientName}</strong> ({whatsAppModal.recipientPhone})
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
