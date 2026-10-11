import React, { useState, useRef } from 'react';
import {
  BookOpen,
  Calendar,
  MessageSquareHeart,
  Share2,
  Edit3,
  Check,
  Search,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  BookMarked,
  X,
} from 'lucide-react';
import type { ChurchSettings, AgendaEvent, WorshipScale } from '../types';
import {
  FULL_BIBLE_PASSAGES,
  ALL_BIBLE_BOOKS,
  type BiblePassageFull,
} from '../lib/bibleLibrary';
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
  unviewedAgendaCount,
  onNavigateTab,
  onUpdatePastoralMessage,
}) => {
  const [selectedPassage, setSelectedPassage] = useState<BiblePassageFull>(
    FULL_BIBLE_PASSAGES[0]
  );
  const [showFullChapterInline, setShowFullChapterInline] = useState<boolean>(false);
  const [showBibleReader, setShowBibleReader] = useState<boolean>(false);
  const [readerMode, setReaderMode] = useState<'temas' | 'livros'>('temas');
  const [bibleFilter, setBibleFilter] = useState<string>('todos');
  const [bibleSearch, setBibleSearch] = useState<string>('');
  const [readerFontSize, setReaderFontSize] = useState<'sm' | 'base' | 'lg'>('base');

  // State for browsing all 66 books & chapters (Almeida API + offline fallback)
  const [selectedBookName, setSelectedBookName] = useState<string>('Salmos');
  const [selectedChapterNum, setSelectedChapterNum] = useState<number>(23);
  const [customChapterTitle, setCustomChapterTitle] = useState<string>('Salmos 23');
  const [customChapterVerses, setCustomChapterVerses] = useState<
    Array<{ number: number; text: string }>
  >(FULL_BIBLE_PASSAGES.find((p) => p.book === 'Salmos' && p.chapter === 23)?.fullChapterVerses || FULL_BIBLE_PASSAGES[0].fullChapterVerses);
  const [loadingChapter, setLoadingChapter] = useState<boolean>(false);

  const bibleReaderSectionRef = useRef<HTMLDivElement | null>(null);

  // Pastoral message inline editor
  const [isEditingMessage, setIsEditingMessage] = useState<boolean>(false);
  const [msgTitle, setMsgTitle] = useState<string>(churchSettings.pastoralMessage.title);
  const [msgContent, setMsgContent] = useState<string>(churchSettings.pastoralMessage.content);
  const [msgAuthor, setMsgAuthor] = useState<string>(churchSettings.pastoralMessage.author);

  const hasNewAgenda = unviewedAgendaCount > 0;

  const filteredPassages = FULL_BIBLE_PASSAGES.filter((v) => {
    const matchesPillar = bibleFilter === 'todos' || v.pillar === bibleFilter;
    const matchesQuery =
      !bibleSearch.trim() ||
      v.reference.toLowerCase().includes(bibleSearch.toLowerCase()) ||
      v.book.toLowerCase().includes(bibleSearch.toLowerCase()) ||
      v.text.toLowerCase().includes(bibleSearch.toLowerCase()) ||
      v.theme.toLowerCase().includes(bibleSearch.toLowerCase());
    return matchesPillar && matchesQuery;
  });

  const openBibleReaderAndScroll = (mode?: 'temas' | 'livros') => {
    if (mode) setReaderMode(mode);
    setShowBibleReader(true);
    setTimeout(() => {
      bibleReaderSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 60);
  };

  const handleFetchBibleChapter = async (bookName: string, chapterNum: number) => {
    setSelectedBookName(bookName);
    setSelectedChapterNum(chapterNum);
    setLoadingChapter(true);

    // 1. Check if we already have this book + chapter in our rich local library
    const localMatch = FULL_BIBLE_PASSAGES.find(
      (p) => p.book.toLowerCase() === bookName.toLowerCase() && p.chapter === chapterNum
    );

    const bookMeta = ALL_BIBLE_BOOKS.find((b) => b.name === bookName);
    const queryBook = bookMeta ? bookMeta.EnglishQueryName : bookName;

    try {
      const response = await fetch(
        `https://bible-api.com/${encodeURIComponent(`${queryBook} ${chapterNum}`)}?translation=almeida`
      );
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.verses) && data.verses.length > 0) {
          setCustomChapterTitle(`${bookName} ${chapterNum} (Almeida)`);
          setCustomChapterVerses(
            data.verses.map((v: { verse: number; text: string }) => ({
              number: v.verse,
              text: v.text.trim(),
            }))
          );
          setLoadingChapter(false);
          return;
        }
      }
    } catch {
      // Fallback to local passage if offline
    }

    if (localMatch) {
      setCustomChapterTitle(localMatch.reference);
      setCustomChapterVerses(localMatch.fullChapterVerses);
    } else {
      setCustomChapterTitle(`${bookName} ${chapterNum}`);
      setCustomChapterVerses([
        {
          number: 1,
          text: `Texto selecionado de ${bookName} ${chapterNum}. Conecte-se à internet para carregar todos os versículos deste capítulo na tradução João Ferreira de Almeida, ou selecione uma das passagens completas na aba "Textos & Temas Bíblicos".`,
        },
      ]);
    }
    setLoadingChapter(false);
  };

  const handleSaveMessage = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePastoralMessage(msgTitle, msgContent, msgAuthor);
    setIsEditingMessage(false);
  };

  const handleShareVerseWhatsApp = (passage: BiblePassageFull) => {
    const text = `📖 *Palavra da Bíblia - ${churchSettings.name}*\n\n"${passage.text}"\n— *${passage.reference}*\n\n💡 _${passage.reflection}_\n\n🙏 *${churchSettings.subtitle}*`;
    const url = buildWhatsAppUrl('', text);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShareCustomChapterWhatsApp = () => {
    const sampleText = customChapterVerses
      .slice(0, 6)
      .map((v) => `${v.number}. ${v.text}`)
      .join('\n');
    const text = `📖 *Leitura Bíblica (${customChapterTitle}) - ${churchSettings.name}*\n\n${sampleText}\n\n🙏 *${churchSettings.subtitle}*`;
    const url = buildWhatsAppUrl('', text);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSharePastorMessageWhatsApp = () => {
    const pm = churchSettings.pastoralMessage;
    const text = `🕊️ *Palavra Pastoral - ${churchSettings.name}*\n\n*${pm.title}*\n\n${pm.content}\n\n— *${pm.author}* (${pm.authorRole})`;
    const url = buildWhatsAppUrl('', text);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const pillarColorBadge = (pillar: BiblePassageFull['pillar']) => {
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

  const currentBookMeta =
    ALL_BIBLE_BOOKS.find((b) => b.name === selectedBookName) || ALL_BIBLE_BOOKS[18];

  const fontSizeClass =
    readerFontSize === 'sm'
      ? 'text-xs leading-relaxed'
      : readerFontSize === 'lg'
      ? 'text-base leading-relaxed'
      : 'text-sm leading-relaxed';

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

            {/* Os 4 Pilares Quadrangulares */}
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUNA 1 (7 cols): VERSÍCULO DO DIA & LEITURA BÍBLICA */}
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-red-600" />
                <h2 className="text-lg font-bold text-slate-900">Versículo do Dia</h2>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span className={`text-xs font-semibold ${pillarColorBadge(selectedPassage.pillar)}`}>
                  {selectedPassage.theme}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (showBibleReader) {
                    setShowBibleReader(false);
                  } else {
                    openBibleReaderAndScroll('temas');
                  }
                }}
                className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                  showBibleReader
                    ? 'bg-slate-900 text-white'
                    : 'text-white bg-sky-700 hover:bg-sky-800 shadow-2xs'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>
                  {showBibleReader ? 'Fechar Leitor da Bíblia' : 'Ler Outros Textos da Bíblia'}
                </span>
              </button>
            </div>

            {/* Versículo em Destaque */}
            <div className="py-2 space-y-3">
              <p className="text-xl sm:text-2xl font-editorial italic text-slate-900 leading-relaxed">
                “{selectedPassage.text}”
              </p>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-bold text-red-700">
                  — {selectedPassage.reference}
                </span>
                <button
                  type="button"
                  onClick={() => setShowFullChapterInline(!showFullChapterInline)}
                  className="text-xs font-bold text-sky-700 hover:text-sky-900 inline-flex items-center gap-1 cursor-pointer underline"
                >
                  <span>
                    {showFullChapterInline
                      ? 'Ocultar contexto completo do capítulo'
                      : `Ler passagem completa (${selectedPassage.fullChapterVerses.length} versículos)`}
                  </span>
                  {showFullChapterInline ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Exibição imediata do Capítulo/Passagem Completa quando solicitado */}
              {showFullChapterInline && (
                <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 max-h-72 overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
                    <span className="text-xs font-extrabold text-slate-900">
                      Leitura Completa: {selectedPassage.reference}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Tradução João Ferreira de Almeida
                    </span>
                  </div>
                  {selectedPassage.fullChapterVerses.map((v) => (
                    <p key={v.number} className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                      <strong className="text-red-700 font-mono mr-1.5">{v.number}</strong>
                      {v.text}
                    </p>
                  ))}
                </div>
              )}

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-2 border-t border-slate-100">
                <strong className="text-slate-800">Meditação Quadrangular:</strong>{' '}
                {selectedPassage.reflection}
              </p>
            </div>
          </div>

          {/* Barra de ações do Versículo */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const idx = FULL_BIBLE_PASSAGES.findIndex((v) => v.id === selectedPassage.id);
                  const next = FULL_BIBLE_PASSAGES[(idx + 1) % FULL_BIBLE_PASSAGES.length];
                  setSelectedPassage(next);
                  setShowFullChapterInline(true);
                }}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                Próximo Texto Bíblico
              </button>
              <button
                type="button"
                onClick={() => openBibleReaderAndScroll('livros')}
                className="px-3.5 py-2 text-xs font-semibold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <BookMarked className="w-3.5 h-3.5" />
                <span>Abrir Bíblia Completa (Livros & Capítulos)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleShareVerseWhatsApp(selectedPassage)}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Enviar no WhatsApp</span>
            </button>
          </div>
        </section>

        {/* COLUNA 2 (5 cols): RECADO / MENSAGEM DO PASTOR */}
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
                    <strong className="text-slate-900 block">
                      {churchSettings.pastoralMessage.author}
                    </strong>
                    <span>{churchSettings.pastoralMessage.authorRole}</span>
                  </div>
                  <span className="tabular-nums">
                    Atualizado em {churchSettings.pastoralMessage.updatedAt}
                  </span>
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

      {/* PAINEL COMPLETO DE LEITURA DA BÍBLIA SAGRADA (ABRE AO CLICAR EM "LER OUTROS TEXTOS DA BÍBLIA") */}
      {showBibleReader && (
        <section
          ref={bibleReaderSectionRef}
          className="bg-white border-2 border-sky-700/30 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-sky-700" />
                <h2 className="text-xl font-extrabold text-slate-900">
                  Bíblia Sagrada · Leitura de Textos, Capítulos & Doutrina Quadrangular
                </h2>
              </div>
              <p className="text-xs text-slate-600">
                Escolha abaixo entre as passagens bíblicas temáticas ou selecione qualquer um dos 66 livros da Bíblia para ler o capítulo completo.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              {/* Controle de tamanho de fonte */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setReaderFontSize('sm')}
                  className={`px-2 py-1 rounded cursor-pointer ${
                    readerFontSize === 'sm' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                  }`}
                  title="Fonte menor"
                >
                  A-
                </button>
                <button
                  type="button"
                  onClick={() => setReaderFontSize('base')}
                  className={`px-2 py-1 rounded cursor-pointer ${
                    readerFontSize === 'base' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                  }`}
                  title="Fonte padrão"
                >
                  A
                </button>
                <button
                  type="button"
                  onClick={() => setReaderFontSize('lg')}
                  className={`px-2 py-1 rounded cursor-pointer ${
                    readerFontSize === 'lg' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                  }`}
                  title="Fonte ampliada para leitura"
                >
                  A+
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowBibleReader(false)}
                className="p-2 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                title="Fechar leitor bíblico"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Seletor de Modo: Passagens & Temas vs Todos os 66 Livros da Bíblia */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-xl w-fit">
            <button
              type="button"
              onClick={() => setReaderMode('temas')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                readerMode === 'temas'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1. Textos Bíblicos & 4 Pilares Quadrangulares ({FULL_BIBLE_PASSAGES.length} Textos Completos)
            </button>
            <button
              type="button"
              onClick={() => {
                setReaderMode('livros');
                handleFetchBibleChapter(selectedBookName, selectedChapterNum);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                readerMode === 'livros'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2. Ler Livros & Capítulos da Bíblia (Antigo e Novo Testamento)
            </button>
          </div>

          {readerMode === 'temas' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Coluna Esquerda: Lista e Filtro de Passagens */}
              <div className="lg:col-span-5 space-y-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={bibleSearch}
                    onChange={(e) => setBibleSearch(e.target.value)}
                    placeholder="Buscar livro, salmo, palavra ou tema..."
                    className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                  />
                </div>

                {/* Filtros por Pilar Quadrangular */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { id: 'todos', label: 'Todos' },
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
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                        bibleFilter === tab.id
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                  {filteredPassages.map((passage) => (
                    <button
                      key={passage.id}
                      type="button"
                      onClick={() => {
                        setSelectedPassage(passage);
                        setShowFullChapterInline(true);
                      }}
                      className={`w-full text-left p-3.5 transition-colors hover:bg-slate-50 cursor-pointer flex items-start justify-between gap-3 ${
                        selectedPassage.id === passage.id
                          ? 'bg-sky-50/80 border-l-2 border-l-sky-700'
                          : 'bg-white'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-bold text-slate-900">{passage.reference}</span>
                          <span aria-hidden="true" className="text-slate-300">·</span>
                          <span className={`font-medium ${pillarColorBadge(passage.pillar)}`}>
                            {passage.theme}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2">{passage.text}</p>
                      </div>
                      <span className="text-xs font-bold text-sky-700 shrink-0">
                        {selectedPassage.id === passage.id ? 'Lendo' : 'Abrir'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Coluna Direita: Leitura Completa do Texto Selecionado */}
              <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <span className={`text-xs font-bold ${pillarColorBadge(selectedPassage.pillar)}`}>
                      {selectedPassage.theme}
                    </span>
                    <h3 className="text-lg font-extrabold text-slate-900">
                      {selectedPassage.reference}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleShareVerseWhatsApp(selectedPassage)}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Compartilhar no WhatsApp</span>
                  </button>
                </div>

                {/* Todos os versículos da passagem */}
                <div className={`space-y-2.5 bg-white p-5 rounded-xl border border-slate-200/80 ${fontSizeClass}`}>
                  {selectedPassage.fullChapterVerses.map((v) => (
                    <p key={v.number} className="text-slate-800">
                      <strong className="text-red-700 font-mono mr-2 select-none">
                        {v.number}
                      </strong>
                      <span>{v.text}</span>
                    </p>
                  ))}
                </div>

                <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-slate-700 leading-relaxed">
                  <strong className="text-slate-900 block mb-0.5">
                    Reflexão & Aplicação Pastoral:
                  </strong>
                  {selectedPassage.reflection}
                </div>
              </div>
            </div>
          ) : (
            /* MODO 2: NAVEGADOR COMPLETO DOS 66 LIVROS E CAPÍTULOS DA BÍBLIA */
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Escolher Livro da Bíblia (66 Livros)
                  </label>
                  <select
                    value={selectedBookName}
                    onChange={(e) => {
                      const newBook = e.target.value;
                      handleFetchBibleChapter(newBook, 1);
                    }}
                    className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-lg"
                  >
                    <optgroup label="Antigo Testamento (39 Livros)">
                      {ALL_BIBLE_BOOKS.filter((b) => b.testament === 'AT').map((b) => (
                        <option key={b.name} value={b.name}>
                          {b.name} ({b.chapters} cap.)
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Novo Testamento (27 Livros)">
                      {ALL_BIBLE_BOOKS.filter((b) => b.testament === 'NT').map((b) => (
                        <option key={b.name} value={b.name}>
                          {b.name} ({b.chapters} cap.)
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Escolher Capítulo (1 a {currentBookMeta.chapters})
                  </label>
                  <select
                    value={selectedChapterNum}
                    onChange={(e) =>
                      handleFetchBibleChapter(selectedBookName, Number(e.target.value))
                    }
                    className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-lg"
                  >
                    {Array.from({ length: currentBookMeta.chapters }, (_, i) => i + 1).map(
                      (chap) => (
                        <option key={chap} value={chap}>
                          Capítulo {chap}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    disabled={selectedChapterNum <= 1 || loadingChapter}
                    onClick={() =>
                      handleFetchBibleChapter(selectedBookName, selectedChapterNum - 1)
                    }
                    className="flex-1 py-2 px-3 text-xs font-bold bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-40 rounded-lg cursor-pointer"
                  >
                    ← Cap. Anterior
                  </button>
                  <button
                    type="button"
                    disabled={
                      selectedChapterNum >= currentBookMeta.chapters || loadingChapter
                    }
                    onClick={() =>
                      handleFetchBibleChapter(selectedBookName, selectedChapterNum + 1)
                    }
                    className="flex-1 py-2 px-3 text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40 rounded-lg cursor-pointer"
                  >
                    Próximo Cap. →
                  </button>
                </div>
              </div>

              {/* Exibição dos Versículos do Capítulo */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-xs font-bold text-sky-700">
                      Leitura de Capítulo Completo
                    </span>
                    <h3 className="text-lg font-extrabold text-slate-900">
                      {customChapterTitle}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={handleShareCustomChapterWhatsApp}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Enviar Capítulo no WhatsApp</span>
                  </button>
                </div>

                {loadingChapter ? (
                  <div className="py-12 text-center text-xs font-bold text-slate-600">
                    Carregando versículos de {selectedBookName} {selectedChapterNum}...
                  </div>
                ) : (
                  <div
                    className={`space-y-2.5 bg-white p-5 rounded-xl border border-slate-200 max-h-[460px] overflow-y-auto ${fontSizeClass}`}
                  >
                    {customChapterVerses.map((v) => (
                      <p key={v.number} className="text-slate-800">
                        <strong className="text-red-700 font-mono mr-2 select-none">
                          {v.number}
                        </strong>
                        <span>{v.text}</span>
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
};
