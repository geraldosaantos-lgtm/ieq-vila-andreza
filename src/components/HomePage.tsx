import React, { useState } from 'react';
import {
  BookOpen,
  Calendar,
  MessageSquareHeart,
  Share2,
  Edit3,
  Check,
  Search,
  Music,
  Users,
  Shield,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import type { ChurchSettings, BibleVerse, AgendaEvent, WorshipScale } from '../types';
import { BIBLE_VERSES_COLLECTION } from '../lib/initialData';
import { buildWhatsAppUrl } from '../lib/dataService';
import type { ActiveTab } from './Header';
import { IEQLogo } from './IEQLogo';

interface HomePageProps {
  churchSettings: ChurchSettings;
  agenda: AgendaEvent[];
  unviewedAgendaCount: number;
  worshipScales: WorshipScale[];
  membersCount: number;
  visitorsCount: number;
  onNavigateTab: (tab: ActiveTab) => void;
  onUpdatePastoralMessage: (title: string, content: string, author: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  churchSettings,
  agenda,
  unviewedAgendaCount,
  worshipScales,
  membersCount,
  visitorsCount,
  onNavigateTab,
  onUpdatePastoralMessage,
}) => {
  const [selectedVerse, setSelectedVerse] = useState<BibleVerse>(BIBLE_VERSES_COLLECTION[0]);
  const [showBibleReader, setShowBibleReader] = useState<boolean>(false);
  const [bibleFilter, setBibleFilter] = useState<string>('todos');
  const [bibleSearch, setBibleSearch] = useState<string>('');

  // Pastoral message inline editor
  const [isEditingMessage, setIsEditingMessage] = useState<boolean>(false);
  const [msgTitle, setMsgTitle] = useState<string>(churchSettings.pastoralMessage.title);
  const [msgContent, setMsgContent] = useState<string>(churchSettings.pastoralMessage.content);
  const [msgAuthor, setMsgAuthor] = useState<string>(churchSettings.pastoralMessage.author);

  const hasNewAgenda = unviewedAgendaCount > 0;

  const filteredVerses = BIBLE_VERSES_COLLECTION.filter((v) => {
    const matchesPillar = bibleFilter === 'todos' || v.pillar === bibleFilter;
    const matchesQuery =
      !bibleSearch.trim() ||
      v.reference.toLowerCase().includes(bibleSearch.toLowerCase()) ||
      v.text.toLowerCase().includes(bibleSearch.toLowerCase()) ||
      v.theme.toLowerCase().includes(bibleSearch.toLowerCase());
    return matchesPillar && matchesQuery;
  });

  const handleSaveMessage = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePastoralMessage(msgTitle, msgContent, msgAuthor);
    setIsEditingMessage(false);
  };

  const handleShareVerseWhatsApp = (verse: BibleVerse) => {
    const text = `📖 *Versículo do Dia - ${churchSettings.name}*\n\n"${verse.text}"\n— *${verse.reference}*\n\n💡 _${verse.reflection}_\n\n🙏 *${churchSettings.subtitle}*`;
    const url = buildWhatsAppUrl('', text);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSharePastorMessageWhatsApp = () => {
    const pm = churchSettings.pastoralMessage;
    const text = `🕊️ *Palavra Pastoral - ${churchSettings.name}*\n\n*${pm.title}*\n\n${pm.content}\n\n— *${pm.author}* (${pm.authorRole})`;
    const url = buildWhatsAppUrl('', text);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const pillarColorBadge = (pillar: BibleVerse['pillar']) => {
    switch (pillar) {
      case 'salvacao':
        return 'text-red-700';
      case 'espirito_santo':
        return 'text-amber-700';
      case 'cura_divina':
        return 'text-sky-700';
      case 'segunda_vinda':
        return 'text-purple-700';
      default:
        return 'text-slate-600';
    }
  };

  return (
    <div className="space-y-8">
      {/* HERO BANNER: IEQ VILA ANDREZA + BOTÃO AGENDA INTELIGENTE */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-3">
              <IEQLogo logoUrl={churchSettings.logoUrl} size="lg" />
              <div>
                <div className="text-xs font-medium text-slate-500">
                  <span>Igreja do Evangelho Quadrangular</span>
                  <span aria-hidden="true" className="mx-1.5">·</span>
                  <span>{churchSettings.pastorName}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {churchSettings.name}
                </h1>
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              {churchSettings.motto}
            </p>

            {/* Os 4 Pilares Quadrangulares (Sem pílulas pesadas, tipografia limpa com indicadores das 4 cores) */}
            <div className="pt-1 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-semibold text-slate-700">
              <span className="text-red-700">1. Jesus o Salvador (Cruz)</span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="text-amber-600">2. Batizador no Espírito Santo (Pomba)</span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="text-sky-700">3. O Grande Médico (Cálice)</span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="text-purple-700">4. O Rei que Há de Vir (Coroa)</span>
            </div>
          </div>

          {/* Botão Principal de Agenda (Muda de cor quando há novidades até o membro visualizar) */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigateTab('agenda')}
              className={`px-5 py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer whitespace-nowrap shrink-0 ${
                hasNewAgenda
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 ring-2 ring-red-600 shadow-md'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              <Calendar className={`w-5 h-5 ${hasNewAgenda ? 'text-red-700' : 'text-amber-400'}`} />
              <span>
                {hasNewAgenda
                  ? `Agenda da Igreja (${unviewedAgendaCount} Novidade${unviewedAgendaCount > 1 ? 's' : ''}!)`
                  : 'Abrir Agenda da Igreja'}
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-500 text-center lg:text-right">
              {hasNewAgenda
                ? 'Cor em destaque: há novos avisos/cultos ainda não visualizados!'
                : 'Você já visualizou todas as novidades da agenda.'}
            </span>
          </div>
        </div>
      </section>

      {/* GRID PRINCIPAL: VERSÍCULO DO DIA + MENSAGEM DO PASTOR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* COLUNA 1 (7 cols): VERSÍCULO DO DIA & LEITOR BÍBLICO */}
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-red-600" />
                <h2 className="text-lg font-bold text-slate-900">Versículo do Dia</h2>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span className={`text-xs font-semibold ${pillarColorBadge(selectedVerse.pillar)}`}>
                  {selectedVerse.theme}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowBibleReader(!showBibleReader)}
                className="px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{showBibleReader ? 'Ocultar Lista de Textos' : 'Ler Outros Textos da Bíblia'}</span>
              </button>
            </div>

            {/* Versículo em Destaque */}
            <div className="py-2 space-y-3">
              <p className="text-xl sm:text-2xl font-editorial italic text-slate-900 leading-relaxed">
                “{selectedVerse.text}”
              </p>
              <div className="text-sm font-bold text-red-700">
                — {selectedVerse.reference}
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-2 border-t border-slate-100">
                <strong className="text-slate-800">Meditação Quadrangular:</strong> {selectedVerse.reflection}
              </p>
            </div>
          </div>

          {/* Barra de ações do Versículo */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const idx = BIBLE_VERSES_COLLECTION.findIndex((v) => v.id === selectedVerse.id);
                  const next = BIBLE_VERSES_COLLECTION[(idx + 1) % BIBLE_VERSES_COLLECTION.length];
                  setSelectedVerse(next);
                }}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                Próximo Versículo
              </button>
              <button
                type="button"
                onClick={() => setShowBibleReader(true)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                Escolher Livro / Tema
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleShareVerseWhatsApp(selectedVerse)}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Enviar Versículo no WhatsApp</span>
            </button>
          </div>

          {/* Leitor de Outros Textos da Bíblia (Expandível) */}
          {showBibleReader && (
            <div className="pt-4 border-t border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-slate-900">
                  Biblioteca Bíblica & Doutrina Quadrangular ({filteredVerses.length} passagens)
                </h3>
                <div className="relative w-full sm:w-60">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={bibleSearch}
                    onChange={(e) => setBibleSearch(e.target.value)}
                    placeholder="Buscar livro, palavra ou tema..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              {/* Filtros por Pilar Quadrangular */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {[
                  { id: 'todos', label: 'Todos os Textos' },
                  { id: 'salvacao', label: 'Salvação (Cruz)' },
                  { id: 'espirito_santo', label: 'Espírito Santo (Pomba)' },
                  { id: 'cura_divina', label: 'Cura Divina (Cálice)' },
                  { id: 'segunda_vinda', label: '2ª Vinda (Coroa)' },
                  { id: 'devocional', label: 'Salmos & Devocional' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setBibleFilter(tab.id)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      bibleFilter === tab.id
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                {filteredVerses.map((verse) => (
                  <button
                    key={verse.id}
                    type="button"
                    onClick={() => setSelectedVerse(verse)}
                    className={`w-full text-left p-3.5 transition-colors hover:bg-slate-50 cursor-pointer flex items-start justify-between gap-3 ${
                      selectedVerse.id === verse.id ? 'bg-amber-50/60' : 'bg-white'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-slate-900">{verse.reference}</span>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span className={`font-medium ${pillarColorBadge(verse.pillar)}`}>{verse.theme}</span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2">{verse.text}</p>
                    </div>
                    <span className="text-xs font-semibold text-sky-700 shrink-0">Ler</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* COLUNA 2 (5 cols): RECARDO / MENSAGEM DO PASTOR */}
        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquareHeart className="w-5 h-5 text-purple-700" />
                <h2 className="text-lg font-bold text-slate-900">Mensagem do Pastor</h2>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMsgTitle(churchSettings.pastoralMessage.title);
                  setMsgContent(churchSettings.pastoralMessage.content);
                  setMsgAuthor(churchSettings.pastoralMessage.author);
                  setIsEditingMessage(!isEditingMessage);
                }}
                className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditingMessage ? 'Cancelar' : 'Editar Recado'}</span>
              </button>
            </div>

            {isEditingMessage ? (
              <form onSubmit={handleSaveMessage} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Título do Recado Pastoral
                  </label>
                  <input
                    type="text"
                    required
                    value={msgTitle}
                    onChange={(e) => setMsgTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mensagem para a Igreja
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={msgContent}
                    onChange={(e) => setMsgContent(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assinatura / Pastor
                  </label>
                  <input
                    type="text"
                    required
                    value={msgAuthor}
                    onChange={(e) => setMsgAuthor(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 px-4 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Publicar Recado na Página Inicial</span>
                </button>
              </form>
            ) : (
              <div className="space-y-3">
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {churchSettings.pastoralMessage.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {churchSettings.pastoralMessage.content}
                </p>
                <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
                  <div>
                    <strong className="text-slate-900 block">{churchSettings.pastoralMessage.author}</strong>
                    <span>{churchSettings.pastoralMessage.authorRole}</span>
                  </div>
                  <span className="tabular-nums">Atualizado em {churchSettings.pastoralMessage.updatedAt}</span>
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <span className="text-xs text-slate-500">Compartilhar palavra com os membros</span>
            <button
              type="button"
              onClick={handleSharePastorMessageWhatsApp}
              className="px-3.5 py-2 text-xs font-semibold text-purple-800 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Enviar no WhatsApp</span>
            </button>
          </div>
        </section>
      </div>

      {/* STRIP DE ATALHOS DOS MINISTÉRIOS & CONTROLE DA IGREJA */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Grupo de Louvor */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sky-700 font-bold text-sm">
                <Music className="w-4 h-4" />
                <span>Ministério de Louvor</span>
              </div>
              <span className="text-xs text-slate-500 tabular-nums">
                {worshipScales.length} escala(s) ativa(s)
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Programação de ensaios, escala justa automática (com prazo de 3 dias para confirmação), pasta de louvores com mudança de tom e projeção no telão.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('worship')}
            className="w-full py-2 px-4 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Acessar Grupo de Louvor & Cifras</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 2: Membros & Liderança */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-purple-700 font-bold text-sm">
                <Users className="w-4 h-4" />
                <span>Membros & Liderança</span>
              </div>
              <span className="text-xs text-slate-500 tabular-nums">
                {membersCount} membro(s)
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Cadastro completo de membros (nome, endereço, telefone) e liderança da IEQ Vila Andreza com envio direto de mensagens pelo WhatsApp.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('members')}
            className="w-full py-2 px-4 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Gerenciar Membros & Liderança</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 3: Área do Pastor */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
                <Shield className="w-4 h-4" />
                <span>Área do Pastor & Visitantes</span>
              </div>
              <span className="text-xs text-slate-500 tabular-nums">
                {visitorsCount} visitante(s)
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Dashboard pastoral com número de membros, pessoas no culto, cadastro de visitantes e integração direta para acolhimento via WhatsApp.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('pastor')}
            className="w-full py-2 px-4 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Abrir Painel do Pastor</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>
    </div>
  );
};
