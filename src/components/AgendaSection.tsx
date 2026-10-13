import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Trash2,
  Share2,
  CheckCircle2,
  BellRing,
} from 'lucide-react';
import type { AgendaEvent, AgendaCategory, ChurchSettings } from '../types';
import { buildWhatsAppUrl } from '../lib/dataService';

interface AgendaSectionProps {
  churchSettings: ChurchSettings;
  agenda: AgendaEvent[];
  viewedIds: string[];
  onAddEvent: (event: Omit<AgendaEvent, 'id' | 'createdAt'>) => void;
  onDeleteEvent: (id: string) => void;
  onMarkAllViewed: () => void;
}

export const AgendaSection: React.FC<AgendaSectionProps> = ({
  churchSettings,
  agenda,
  viewedIds,
  onAddEvent,
  onDeleteEvent,
  onMarkAllViewed,
}) => {
  const [filterCat, setFilterCat] = useState<string>('todos');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  const [title, setTitle] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>('19:30');
  const [category, setCategory] = useState<AgendaCategory>('culto');
  const [location, setLocation] = useState<string>('Templo Principal - IEQ Vila Andreza');
  const [description, setDescription] = useState<string>('');

  const unviewedEvents = agenda.filter((ev) => !viewedIds.includes(ev.id));

  const filteredEvents = agenda
    .filter((ev) => filterCat === 'todos' || ev.category === filterCat)
    .sort((a, b) => a.date.localeCompare(b.date));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddEvent({
      title: title.trim(),
      date,
      time,
      category,
      location: location.trim() || 'Templo IEQ Vila Andreza',
      description: description.trim(),
      isNewAnnouncement: true,
    });
    setTitle('');
    setDescription('');
    setShowAddForm(false);
  };

  const handleShareEventWhatsApp = (ev: AgendaEvent) => {
    const msg = `📅 *Agenda ${churchSettings.name}*\n\n*${ev.title}*\n🗓️ Data: ${ev.date} às ${ev.time}\n📍 Local: ${ev.location}\n\n${ev.description}\n\nEsperamos por você e sua família!`;
    window.open(buildWhatsAppUrl('', msg), '_blank', 'noopener,noreferrer');
  };

  const categoryLabel = (cat: AgendaCategory) => {
    switch (cat) {
      case 'culto':
        return { text: 'Culto', color: 'text-red-700' };
      case 'ensaio':
        return { text: 'Ensaio de Louvor', color: 'text-sky-700' };
      case 'santa_ceia':
        return { text: 'Santa Ceia', color: 'text-purple-700' };
      case 'evento':
        return { text: 'Evento Especial', color: 'text-amber-700' };
      case 'reuniao':
        return { text: 'Reunião de Liderança', color: 'text-slate-700' };
      default:
        return { text: 'Aviso Importante', color: 'text-emerald-700' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Status de Visualização das Novidades */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-600" />
            <h1 className="text-xl font-extrabold text-slate-900">
              Agenda de Cultos, Ensaios & Eventos
            </h1>
          </div>
          <p className="text-xs text-slate-600">
            Sempre que um novo evento ou aviso é cadastrado, o botão Agenda muda de cor até o membro visualizar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {unviewedEvents.length > 0 ? (
            <button
              type="button"
              onClick={onMarkAllViewed}
              className="px-3 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-all duration-150 active:scale-[0.98] shadow-2xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-red-700" />
              <span>Confirmar Leitura ({unviewedEvents.length} Novidade{unviewedEvents.length > 1 ? 's' : ''})</span>
            </button>
          ) : (
            <span className="text-xs font-medium text-emerald-700 flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Todas as novidades visualizadas</span>
            </span>
          )}

          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-all duration-150 active:scale-[0.98] shadow-2xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showAddForm ? 'Fechar Formulário' : 'Nova Programação / Aviso'}</span>
          </button>
        </div>
      </div>

      {/* Formulário para Adicionar Evento (Ativa o destaque de novidade no botão Agenda) */}
      {showAddForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BellRing className="w-4 h-4 text-amber-600" />
              <span>Publicar Nova Programação na Agenda (Aciona Alerta de Novidade)</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Título do Culto / Evento / Aviso *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Culto de Santa Ceia & Batismo nas Águas"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900 tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Horário *
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900 tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AgendaCategory)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-slate-900"
              >
                <option value="culto">Culto Regular</option>
                <option value="santa_ceia">Santa Ceia</option>
                <option value="ensaio">Ensaio do Louvor</option>
                <option value="evento">Evento / Campanha</option>
                <option value="reuniao">Reunião da Liderança</option>
                <option value="aviso">Aviso Geral</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Local
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Descrição / Observações
              </label>
              <textarea
                rows={2}
                placeholder="Detalhes sobre preletor, vestimenta, ou avisos especiais..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors cursor-pointer"
            >
              Salvar e Publicar na Agenda
            </button>
          </div>
        </form>
      )}

      {/* Barra de Filtros */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {[
          { id: 'todos', label: 'Toda a Agenda' },
          { id: 'culto', label: 'Cultos' },
          { id: 'santa_ceia', label: 'Santa Ceia' },
          { id: 'ensaio', label: 'Ensaios' },
          { id: 'evento', label: 'Eventos Especiais' },
          { id: 'reuniao', label: 'Liderança' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterCat(tab.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              filterCat === tab.id
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Lista de Eventos */}
      {filteredEvents.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
          <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900">Nenhum evento programado nesta categoria</h3>
            <p className="text-xs text-slate-500">
              Clique em "Nova Programação / Aviso" acima para cadastrar cultos, ensaios ou campanhas.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEvents.map((ev) => {
            const isUnviewed = !viewedIds.includes(ev.id);
            const catInfo = categoryLabel(ev.category);
            return (
              <div
                key={ev.id}
                className={`bg-white rounded-2xl p-5 border transition-all flex flex-col justify-between space-y-4 ${
                  isUnviewed
                    ? 'border-amber-400 ring-1 ring-amber-400/50 bg-amber-50/10'
                    : 'border-slate-200'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${catInfo.color}`}>{catInfo.text}</span>
                      {isUnviewed && (
                        <>
                          <span aria-hidden="true" className="text-slate-300">·</span>
                          <span className="font-bold text-red-600">NOVO NA AGENDA</span>
                        </>
                      )}
                    </div>
                    <span className="text-slate-500 font-mono tabular-nums">
                      {ev.date} · {ev.time}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{ev.title}</h3>
                  {ev.description && (
                    <p className="text-xs text-slate-600 leading-relaxed">{ev.description}</p>
                  )}

                  <div className="pt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1 tabular-nums">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {ev.date} às {ev.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {ev.location}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleShareEventWhatsApp(ev)}
                    className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Convidar via WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteEvent(ev.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                    title="Remover evento"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
