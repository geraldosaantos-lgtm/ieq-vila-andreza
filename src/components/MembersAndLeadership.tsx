import React, { useState } from 'react';
import {
  Users,
  Award,
  Plus,
  Search,
  Trash2,
  MessageCircle,
  MapPin,
  Phone,
  Send,
  X,
} from 'lucide-react';
import type { ChurchMember, LeadershipMember, ChurchSettings } from '../types';
import { buildWhatsAppUrl } from '../lib/dataService';

interface MembersAndLeadershipProps {
  churchSettings: ChurchSettings;
  members: ChurchMember[];
  leadership: LeadershipMember[];
  onAddMember: (member: Omit<ChurchMember, 'id' | 'createdAt'>) => void;
  onDeleteMember: (id: string) => void;
  onAddLeadership: (leader: Omit<LeadershipMember, 'id' | 'createdAt'>) => void;
  onDeleteLeadership: (id: string) => void;
}

export const MembersAndLeadership: React.FC<MembersAndLeadershipProps> = ({
  churchSettings,
  members,
  leadership,
  onAddMember,
  onDeleteMember,
  onAddLeadership,
  onDeleteLeadership,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'members' | 'leadership'>('members');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // --- Member Form State ---
  const [showMemberForm, setShowMemberForm] = useState<boolean>(false);
  const [memName, setMemName] = useState<string>('');
  const [memAddress, setMemAddress] = useState<string>('');
  const [memNeighborhood, setMemNeighborhood] = useState<string>('Vila Andreza');
  const [memCity, setMemCity] = useState<string>('');
  const [memPhone, setMemPhone] = useState<string>('');
  const [memBirthDate, setMemBirthDate] = useState<string>('');
  const [memBaptized, setMemBaptized] = useState<boolean>(true);
  const [memStatus, setMemStatus] = useState<'ativo' | 'discipulado' | 'afastado'>('ativo');
  const [memNotes, setMemNotes] = useState<string>('');

  // --- Leadership Form State ---
  const [showLeaderForm, setShowLeaderForm] = useState<boolean>(false);
  const [leadName, setLeadName] = useState<string>('');
  const [leadRole, setLeadRole] = useState<string>('');
  const [leadDept, setLeadDept] = useState<string>('Diaconato & Recepção');
  const [leadPhone, setLeadPhone] = useState<string>('');
  const [leadAddress, setLeadAddress] = useState<string>('Vila Andreza');

  // --- Direct WhatsApp Custom Message Modal ---
  const [whatsAppTarget, setWhatsAppTarget] = useState<{
    name: string;
    phone: string;
    roleOrType: string;
  } | null>(null);
  const [whatsAppText, setWhatsAppText] = useState<string>('');

  const handleOpenWhatsAppComposer = (name: string, phone: string, roleOrType: string) => {
    setWhatsAppTarget({ name, phone, roleOrType });
    setWhatsAppText(
      `A Paz do Senhor, *${name}*! Tudo bem com você e sua família?\n\nAqui é da liderança da *${churchSettings.name}*. Passando para deixar um abraço fraternal e lembrar que estamos orando por sua vida!\n\n_"${churchSettings.motto}"_`
    );
  };

  const handleSendWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whatsAppTarget) return;
    const url = buildWhatsAppUrl(whatsAppTarget.phone, whatsAppText);
    window.open(url, '_blank', 'noopener,noreferrer');
    setWhatsAppTarget(null);
  };

  const handleCreateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memName.trim() || !memAddress.trim() || !memPhone.trim()) return;
    onAddMember({
      name: memName.trim(),
      address: memAddress.trim(),
      neighborhood: memNeighborhood.trim() || 'Vila Andreza',
      city: memCity.trim(),
      phone: memPhone.trim(),
      birthDate: memBirthDate || undefined,
      baptized: memBaptized,
      status: memStatus,
      notes: memNotes.trim() || undefined,
    });
    setMemName('');
    setMemAddress('');
    setMemPhone('');
    setMemNotes('');
    setShowMemberForm(false);
  };

  const handleCreateLeader = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName.trim() || !leadRole.trim() || !leadPhone.trim()) return;
    onAddLeadership({
      name: leadName.trim(),
      roleTitle: leadRole.trim(),
      department: leadDept.trim() || 'Ministério Local',
      phone: leadPhone.trim(),
      address: leadAddress.trim() || undefined,
      since: new Date().getFullYear().toString(),
    });
    setLeadName('');
    setLeadRole('');
    setLeadPhone('');
    setShowLeaderForm(false);
  };

  const filteredMembers = members.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.address.toLowerCase().includes(q) ||
      m.phone.toLowerCase().includes(q)
    );
  });

  const filteredLeadership = leadership.filter((l) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.name.toLowerCase().includes(q) ||
      l.roleTitle.toLowerCase().includes(q) ||
      l.department.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header & Sub-tab Switcher */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-700" />
            <h1 className="text-xl font-extrabold text-slate-900">
              Cadastro de Membros & Liderança · {churchSettings.name}
            </h1>
          </div>
          <p className="text-xs text-slate-600">
            Gerencie o rol de membros (nome, endereço, telefone) e os cargos da liderança com disparo direto para o WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveSubTab('members')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeSubTab === 'members'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-purple-700" />
              <span>Membros ({members.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('leadership')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeSubTab === 'leadership'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-amber-600" />
              <span>Liderança & Cargos ({leadership.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Barra de Busca + Botão de Cadastro */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeSubTab === 'members'
                ? 'Buscar membro por nome, endereço ou telefone...'
                : 'Buscar líder por nome, cargo ou ministério...'
            }
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900"
          />
        </div>

        {activeSubTab === 'members' ? (
          <button
            type="button"
            onClick={() => setShowMemberForm(!showMemberForm)}
            className="px-4 py-2.5 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>{showMemberForm ? 'Fechar Cadastro' : 'Novo Cadastro de Membro'}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowLeaderForm(!showLeaderForm)}
            className="px-4 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>{showLeaderForm ? 'Fechar Cadastro' : 'Cadastrar Líder / Cargo'}</span>
          </button>
        )}
      </div>

      {/* =====================================================================
          ABA 1: CADASTRO DE MEMBROS (NOME, ENDEREÇO, TELEFONE)
      ===================================================================== */}
      {activeSubTab === 'members' && (
        <div className="space-y-5">
          {showMemberForm && (
            <form
              onSubmit={handleCreateMember}
              className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4"
            >
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                Ficha de Cadastro de Novo Membro · IEQ Vila Andreza
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome Completo do Membro *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Maria Aparecida Souza"
                    value={memName}
                    onChange={(e) => setMemName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Telefone / WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 11991234567"
                    value={memPhone}
                    onChange={(e) => setMemPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Endereço Completo (Rua e Número) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Rua das Acácias, 230"
                    value={memAddress}
                    onChange={(e) => setMemAddress(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bairro
                  </label>
                  <input
                    type="text"
                    value={memNeighborhood}
                    onChange={(e) => setMemNeighborhood(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    value={memBirthDate}
                    onChange={(e) => setMemBirthDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Situação / Batismo
                  </label>
                  <div className="flex items-center gap-3 pt-1.5">
                    <select
                      value={memStatus}
                      onChange={(e) => setMemStatus(e.target.value as any)}
                      className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="ativo">Membro Ativo</option>
                      <option value="discipulado">Em Discipulado</option>
                      <option value="afastado">Em Acompanhamento</option>
                    </select>
                    <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={memBaptized}
                        onChange={(e) => setMemBaptized(e.target.checked)}
                      />
                      <span>Batizado nas Águas</span>
                    </label>
                  </div>
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Observações Pastorais (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Participa do Grupo Missionário de Mulheres, família na igreja..."
                    value={memNotes}
                    onChange={(e) => setMemNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMemberForm(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg cursor-pointer"
                >
                  Salvar Membro
                </button>
              </div>
            </form>
          )}

          {/* Tabela de Membros */}
          {filteredMembers.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-2">
              <Users className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-900">Nenhum membro encontrado</h3>
              <p className="text-xs text-slate-500">
                Clique em "Novo Cadastro de Membro" para registrar nome, endereço e telefone.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                      <th className="py-3 px-4">Nome do Membro</th>
                      <th className="py-3 px-4">Endereço Completo</th>
                      <th className="py-3 px-4">Telefone / WhatsApp</th>
                      <th className="py-3 px-4">Situação</th>
                      <th className="py-3 px-4 text-right">Integração WhatsApp & Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredMembers.map((mem) => (
                      <tr key={mem.id} className="hover:bg-slate-50/80">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{mem.name}</div>
                          {mem.notes && (
                            <div className="text-[11px] text-slate-500 mt-0.5">{mem.notes}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>
                              {mem.address}
                              {mem.neighborhood ? ` · ${mem.neighborhood}` : ''}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono tabular-nums text-slate-800">
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{mem.phone}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-700">
                            {mem.status === 'ativo'
                              ? 'Ativo'
                              : mem.status === 'discipulado'
                              ? 'Discipulado'
                              : 'Acompanhamento'}
                          </span>
                          <span aria-hidden="true" className="mx-1 text-slate-300">·</span>
                          <span className="text-slate-500">
                            {mem.baptized ? 'Batizado' : 'Não Batizado'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenWhatsAppComposer(mem.name, mem.phone, 'Membro')
                              }
                              className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>Enviar WhatsApp</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => onDeleteMember(mem.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                              title="Remover membro"
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
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          ABA 2: CADASTRO DA LIDERANÇA (NOME, CARGO OCUPADO)
      ===================================================================== */}
      {activeSubTab === 'leadership' && (
        <div className="space-y-5">
          {showLeaderForm && (
            <form
              onSubmit={handleCreateLeader}
              className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4"
            >
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                Cadastrar Integrante da Liderança (Nome e Cargo Ocupado)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome do Líder / Obreiro *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Diácono João Batista"
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cargo Ocupado *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Líder de Jovens / Diácono / Tesoureiro"
                    value={leadRole}
                    onChange={(e) => setLeadRole(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Departamento / Grupo Missionário
                  </label>
                  <select
                    value={leadDept}
                    onChange={(e) => setLeadDept(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Conselho Diretor Local (CDL)">Conselho Diretor Local (CDL)</option>
                    <option value="Pastorado & Ministério">Pastorado & Ministério</option>
                    <option value="Louvor & Adoração">Louvor & Adoração</option>
                    <option value="Diaconato & Recepção">Diaconato & Recepção</option>
                    <option value="Grupo Missionário de Mulheres (GMM)">Grupo Missionário de Mulheres (GMM)</option>
                    <option value="Grupo Missionário de Homens (GMH)">Grupo Missionário de Homens (GMH)</option>
                    <option value="Grupo Missionário de Jovens (GMJ)">Grupo Missionário de Jovens (GMJ)</option>
                    <option value="Ministério Infantil (GMJr)">Ministério Infantil (GMJr)</option>
                    <option value="Células & Evangelismo">Células & Evangelismo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Telefone / WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 11998887766"
                    value={leadPhone}
                    onChange={(e) => setLeadPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono tabular-nums"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLeaderForm(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Salvar Cargo da Liderança
                </button>
              </div>
            </form>
          )}

          {/* Lista da Liderança */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="py-3 px-4">Nome do Líder</th>
                    <th className="py-3 px-4">Cargo Ocupado</th>
                    <th className="py-3 px-4">Departamento / Ministério</th>
                    <th className="py-3 px-4">Telefone / WhatsApp</th>
                    <th className="py-3 px-4 text-right">Contato Direto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLeadership.map((leader) => (
                    <tr key={leader.id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{leader.name}</td>
                      <td className="py-3.5 px-4 font-bold text-red-700">{leader.roleTitle}</td>
                      <td className="py-3.5 px-4 text-slate-600">{leader.department}</td>
                      <td className="py-3.5 px-4 font-mono tabular-nums text-slate-800">
                        {leader.phone}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenWhatsAppComposer(
                                leader.name,
                                leader.phone,
                                leader.roleTitle
                              )
                            }
                            className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Enviar WhatsApp</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteLeadership(leader.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                            title="Remover cargo"
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
          </div>
        </div>
      )}

      {/* Modal de Disparo Personalizado para WhatsApp */}
      {whatsAppTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSendWhatsApp}
            className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Enviar Mensagem Direta para WhatsApp
                </h3>
                <p className="text-xs text-slate-500">
                  Destinatário: <strong>{whatsAppTarget.name}</strong> ({whatsAppTarget.phone})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setWhatsAppTarget(null)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-700 block">
                Modelos Rápidos da {churchSettings.name}:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setWhatsAppText(
                      `A Paz do Senhor, *${whatsAppTarget.name}*! Tudo bem?\n\nPassando em nome do *${churchSettings.pastorName}* e de toda a *${churchSettings.name}* para abençoar sua semana! Contamos com você no nosso próximo culto.`
                    )
                  }
                  className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer"
                >
                  Cuidado Pastoral
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setWhatsAppText(
                      `Olá *${whatsAppTarget.name}*, Paz do Senhor! 🙏\n\nLembrando da nossa programação especial hoje na *${churchSettings.name}*. Venha adorar a Deus conosco com toda a sua família!`
                    )
                  }
                  className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer"
                >
                  Convite para o Culto
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setWhatsAppText(
                      `Parabéns, *${whatsAppTarget.name}*! 🎉🙌\n\nA família *${churchSettings.name}* celebra a sua vida hoje! Que o Senhor derrame saúde, graça e muitas bênçãos sobre os seus caminhos!`
                    )
                  }
                  className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer"
                >
                  Feliz Aniversário
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mensagem que será enviada no WhatsApp:
              </label>
              <textarea
                rows={5}
                required
                value={whatsAppText}
                onChange={(e) => setWhatsAppText(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setWhatsAppTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Abrir no WhatsApp e Enviar</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
