import React, { useState } from 'react';
import {
  Music,
  Calendar,
  Users,
  Plus,
  Check,
  X,
  RefreshCw,
  Monitor,
  Sliders,
  Eye,
  EyeOff,
  FolderOpen,
  Share2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import type {
  ChurchSettings,
  WorshipMusician,
  WorshipScale,
  WorshipSong,
  WorshipInstrumentRole,
} from '../types';
import {
  MUSICAL_KEYS,
  transposeChordProText,
  parseChordProLines,
  stripChordsFromText,
  getProjectionSlides,
} from '../lib/chordTransposer';
import {
  generateFairAssignments,
  findFairReplacementMusician,
  getConfirmationDeadlineStatus,
  buildWhatsAppUrl,
} from '../lib/dataService';

interface WorshipMinistryProps {
  churchSettings: ChurchSettings;
  musicians: WorshipMusician[];
  scales: WorshipScale[];
  songs: WorshipSong[];
  onUpdateMusiciansAndScales: (musicians: WorshipMusician[], scales: WorshipScale[]) => void;
  onAddSong: (song: Omit<WorshipSong, 'id' | 'createdAt'>) => void;
  onDeleteSong: (id: string) => void;
}

const INSTRUMENT_OPTIONS: Array<{ value: WorshipInstrumentRole; label: string }> = [
  { value: 'ministro_louvor', label: 'Ministro(a) de Louvor (Voz Principal)' },
  { value: 'backing_vocal', label: 'Backing Vocal (Cantor/Cantora)' },
  { value: 'violao', label: 'Violão' },
  { value: 'guitarra', label: 'Guitarra' },
  { value: 'teclado', label: 'Teclado / Piano' },
  { value: 'baixo', label: 'Contrabaixo' },
  { value: 'bateria', label: 'Bateria' },
  { value: 'sonoplastia', label: 'Sonoplastia (Mesa de Som)' },
  { value: 'projecao', label: 'Mídia & Projeção (Telão/Parede)' },
];

export const WorshipMinistry: React.FC<WorshipMinistryProps> = ({
  churchSettings,
  musicians,
  scales,
  songs,
  onUpdateMusiciansAndScales,
  onAddSong,
  onDeleteSong,
}) => {
  const [subTab, setSubTab] = useState<'scales' | 'songs' | 'team'>('scales');

  // --- Scale & Rehearsal generator state ---
  const [showScaleModal, setShowScaleModal] = useState<boolean>(false);
  const [scaleTitle, setScaleTitle] = useState<string>('Culto de Celebração & Louvor');
  const [scaleType, setScaleType] = useState<'culto' | 'ensaio'>('culto');
  const [scaleDate, setScaleDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [scaleTime, setScaleTime] = useState<string>('18:30');
  const [scaleNotes, setScaleNotes] = useState<string>(
    'Confirmar participação em até 3 dias pelo aplicativo. Passagem de som 30min antes.'
  );
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>(
    songs.slice(0, 2).map((s) => s.id)
  );

  // --- Song Folder, Chords & Wall Projector state ---
  const [selectedFolder, setSelectedFolder] = useState<string>('todas');
  const [activeSongId, setActiveSongId] = useState<string>(songs[0]?.id || '');
  const [showChords, setShowChords] = useState<boolean>(true);
  const [targetKey, setTargetKey] = useState<string>(songs[0]?.originalKey || 'G');
  const [isProjectingWall, setIsProjectingWall] = useState<boolean>(false);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [projectorFontSize, setProjectorFontSize] = useState<'md' | 'lg' | 'xl'>('lg');

  // --- Add New Song state ---
  const [showAddSongForm, setShowAddSongForm] = useState<boolean>(false);
  const [newSongTitle, setNewSongTitle] = useState<string>('');
  const [newSongArtist, setNewSongArtist] = useState<string>('');
  const [newSongKey, setNewSongKey] = useState<string>('G');
  const [newSongBpm, setNewSongBpm] = useState<number>(72);
  const [newSongFolder, setNewSongFolder] = useState<string>('Louvores de Domingo');
  const [newSongContent, setNewSongContent] = useState<string>(
    `{Primeira Parte}\n[G]Digite a letra com [D/F#]cifras entre colchetes [Em7]aqui\n[C9]Para transpor o tom [D]automaticamente\n\n{Refrão}\n[G]Louvai ao Senhor na [C9]IEQ Vila [G]Andreza`
  );

  // --- Add New Musician state ---
  const [newMusicianName, setNewMusicianName] = useState<string>('');
  const [newMusicianPhone, setNewMusicianPhone] = useState<string>('');
  const [newMusicianInstrument, setNewMusicianInstrument] =
    useState<WorshipInstrumentRole>('backing_vocal');

  const activeSong = songs.find((s) => s.id === activeSongId) || songs[0];

  const handleSelectSong = (song: WorshipSong) => {
    setActiveSongId(song.id);
    setTargetKey(song.originalKey);
    setActiveSlideIndex(0);
  };

  const handleStepSemitone = (delta: number) => {
    const idx = MUSICAL_KEYS.indexOf(targetKey as any);
    const currentIdx = idx === -1 ? 0 : idx;
    const nextIdx = ((currentIdx + delta) % 12 + 12) % 12;
    setTargetKey(MUSICAL_KEYS[nextIdx]);
  };

  // Create fair scale automatically
  const handleCreateFairScale = (e: React.FormEvent) => {
    e.preventDefault();
    const { assignments, updatedMusicians } = generateFairAssignments(musicians);
    const newScale: WorshipScale = {
      id: `scale-${Date.now()}`,
      title: scaleTitle.trim() || 'Escala de Louvor',
      eventType: scaleType,
      date: scaleDate,
      time: scaleTime,
      location: 'Templo IEQ Vila Andreza',
      notes: scaleNotes.trim(),
      songIds: selectedSongIds,
      assignments,
      createdAt: new Date().toISOString(),
    };
    onUpdateMusiciansAndScales(updatedMusicians, [newScale, ...scales]);
    setShowScaleModal(false);
  };

  // Confirm musician participation
  const handleConfirmAssignment = (scaleId: string, musicianId: string) => {
    const updatedScales = scales.map((sc) => {
      if (sc.id !== scaleId) return sc;
      return {
        ...sc,
        assignments: sc.assignments.map((a) =>
          a.musicianId === musicianId
            ? { ...a, status: 'confirmado' as const, confirmedAt: new Date().toISOString() }
            : a
        ),
      };
    });
    onUpdateMusiciansAndScales(musicians, updatedScales);
  };

  // Decline & automatically substitute with next fair musician
  const handleDeclineAndReplace = (scaleId: string, musicianId: string) => {
    const targetScale = scales.find((s) => s.id === scaleId);
    if (!targetScale) return;

    const currentAssignment = targetScale.assignments.find((a) => a.musicianId === musicianId);
    if (!currentAssignment) return;

    const alreadyInScaleIds = targetScale.assignments.map((a) => a.musicianId);
    const replacement = findFairReplacementMusician(
      musicians,
      currentAssignment.instrument,
      alreadyInScaleIds
    );

    const now = new Date();
    const assignedAt = now.toISOString();
    const deadlineAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();

    const updatedMusicians = musicians.map((m) => {
      if (m.id === musicianId) {
        return { ...m, participationsCount: Math.max(0, m.participationsCount - 1) };
      }
      if (replacement && m.id === replacement.id) {
        return {
          ...m,
          participationsCount: m.participationsCount + 1,
          lastScheduledDate: now.toISOString().split('T')[0],
        };
      }
      return m;
    });

    const updatedScales = scales.map((sc) => {
      if (sc.id !== scaleId) return sc;
      return {
        ...sc,
        assignments: sc.assignments.map((a) => {
          if (a.musicianId !== musicianId) return a;
          if (replacement) {
            return {
              musicianId: replacement.id,
              musicianName: replacement.name,
              musicianPhone: replacement.phone,
              instrument: replacement.instrument,
              instrumentLabel: replacement.instrumentLabel,
              status: 'pendente' as const,
              assignedAt,
              deadlineAt,
            };
          }
          return { ...a, status: 'recusado' as const };
        }),
      };
    });

    onUpdateMusiciansAndScales(updatedMusicians, updatedScales);
  };

  const handleDeleteScale = (scaleId: string) => {
    onUpdateMusiciansAndScales(
      musicians,
      scales.filter((s) => s.id !== scaleId)
    );
  };

  const handleNotifyMusicianWhatsApp = (
    scale: WorshipScale,
    musicianName: string,
    musicianPhone: string,
    roleLabel: string
  ) => {
    const scaleSongTitles = scale.songIds
      .map((id) => songs.find((s) => s.id === id)?.title)
      .filter(Boolean)
      .join(', ');

    const msg = `🎵 *Ministério de Louvor - ${churchSettings.name}*\n\nOlá, *${musicianName}*! Paz do Senhor!\nVocê foi escalado(a) pelo sistema de rodízio justo para:\n\n📌 *${scale.title}*\n🗓️ Data: ${scale.date} às ${scale.time}\n🎸 Função: *${roleLabel}*\n🎶 Louvores da Pasta: ${scaleSongTitles || 'Ver na pasta do app'}\n\n⏳ *Importante:* Você tem até *3 dias* para confirmar sua participação diretamente no aplicativo da igreja!`;
    window.open(buildWhatsAppUrl(musicianPhone, msg), '_blank', 'noopener,noreferrer');
  };

  const handleAddMusician = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMusicianName.trim() || !newMusicianPhone.trim()) return;
    const roleObj = INSTRUMENT_OPTIONS.find((o) => o.value === newMusicianInstrument);
    const minCount =
      musicians.length > 0
        ? Math.min(...musicians.map((m) => m.participationsCount))
        : 0;

    const created: WorshipMusician = {
      id: `mus-${Date.now()}`,
      name: newMusicianName.trim(),
      phone: newMusicianPhone.trim(),
      instrument: newMusicianInstrument,
      instrumentLabel: roleObj?.label || 'Integrante do Louvor',
      participationsCount: minCount, // Starts with minimum count for immediate fair opportunity
      active: true,
    };

    onUpdateMusiciansAndScales([...musicians, created], scales);
    setNewMusicianName('');
    setNewMusicianPhone('');
  };

  const handleRemoveMusician = (id: string) => {
    onUpdateMusiciansAndScales(
      musicians.filter((m) => m.id !== id),
      scales
    );
  };

  const handleCreateSong = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSongTitle.trim() || !newSongContent.trim()) return;
    onAddSong({
      title: newSongTitle.trim(),
      artist: newSongArtist.trim() || 'Ministério de Louvor',
      originalKey: newSongKey,
      bpm: Number(newSongBpm) || 72,
      category: 'adoracao',
      folderName: newSongFolder.trim() || 'Louvores de Domingo',
      chordProContent: newSongContent,
    });
    setNewSongTitle('');
    setNewSongArtist('');
    setShowAddSongForm(false);
  };

  // Folders list
  const folders = Array.from(new Set(songs.map((s) => s.folderName)));
  const filteredSongs = songs.filter(
    (s) => selectedFolder === 'todas' || s.folderName === selectedFolder
  );

  // Transposed content for active song
  const transposedContent = activeSong
    ? transposeChordProText(activeSong.chordProContent, activeSong.originalKey, targetKey)
    : '';
  const parsedLines = parseChordProLines(transposedContent);
  const cleanLyricsOnly = stripChordsFromText(transposedContent);
  const projectionSlides = getProjectionSlides(transposedContent);

  return (
    <div className="space-y-6">
      {/* Top Bar of Worship Ministry */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-sky-700" />
            <h1 className="text-xl font-extrabold text-slate-900">
              Grupo de Louvor · Escalas, Ensaios, Cifras & Projeção
            </h1>
          </div>
          <p className="text-xs text-slate-600">
            Controle automático de escalas por igualdade de oportunidades (prazo de 3 dias para confirmação), pasta de louvores com mudança de tom e projeção de letras na parede.
          </p>
        </div>

        {/* Sub-navigation tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setSubTab('scales')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              subTab === 'scales'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-sky-700" />
            <span>Escalas & Ensaios (3 Dias)</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('songs')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              subTab === 'songs'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5 text-amber-600" />
            <span>Pasta de Louvores, Cifras & Projetor</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('team')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              subTab === 'team'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-purple-700" />
            <span>Músicos & Cantores ({musicians.length})</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          SUB-TAB 1: ESCALAS & ENSAIOS (RODÍZIO JUSTO + 3 DIAS PARA CONFIRMAR)
      ===================================================================== */}
      {subTab === 'scales' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-slate-900">
                Sistema Inteligente de Rodízio Justo & Confirmação em até 3 Dias
              </h2>
              <p className="text-xs text-slate-600">
                Ao gerar uma nova escala, o aplicativo seleciona automaticamente os músicos e cantores com menor número de participações. Se alguém recusar ou não confirmar em 3 dias, o sistema escala o próximo da fila automaticamente.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowScaleModal(!showScaleModal)}
              className="px-4 py-2.5 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-xl transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Gerar Escala Automática (Mesma Oportunidade)</span>
            </button>
          </div>

          {/* Modal / Form para Gerar Nova Escala ou Ensaio */}
          {showScaleModal && (
            <form
              onSubmit={handleCreateFairScale}
              className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4"
            >
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                Programar Novo Culto ou Ensaio com Escala Automática Justa
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Título do Culto ou Ensaio *
                  </label>
                  <input
                    type="text"
                    required
                    value={scaleTitle}
                    onChange={(e) => setScaleTitle(e.target.value)}
                    placeholder="Ex: Ensaio Geral de Sábado / Culto de Domingo"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipo
                  </label>
                  <select
                    value={scaleType}
                    onChange={(e) => setScaleType(e.target.value as 'culto' | 'ensaio')}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="culto">Escala de Culto</option>
                    <option value="ensaio">Programação de Ensaio</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Data *
                    </label>
                    <input
                      type="date"
                      required
                      value={scaleDate}
                      onChange={(e) => setScaleDate(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Hora *
                    </label>
                    <input
                      type="time"
                      required
                      value={scaleTime}
                      onChange={(e) => setScaleTime(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg tabular-nums"
                    />
                  </div>
                </div>
              </div>

              {/* Selecionar louvores da pasta para esta escala */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Escolher Louvores da Pasta para este Culto/Ensaio:
                </label>
                <div className="flex flex-wrap gap-2">
                  {songs.map((song) => {
                    const checked = selectedSongIds.includes(song.id);
                    return (
                      <button
                        key={song.id}
                        type="button"
                        onClick={() =>
                          setSelectedSongIds((prev) =>
                            checked ? prev.filter((id) => id !== song.id) : [...prev, song.id]
                          )
                        }
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                          checked
                            ? 'bg-sky-700 text-white border-sky-700'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {song.title} (Tom: {song.originalKey})
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Instruções / Observações do Ensaio ou Culto
                </label>
                <input
                  type="text"
                  value={scaleNotes}
                  onChange={(e) => setScaleNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowScaleModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-lg cursor-pointer"
                >
                  Sortear/Escalar Automaticamente com Equidade
                </button>
              </div>
            </form>
          )}

          {/* Lista de Escalas e Ensaios Programados */}
          <div className="space-y-5">
            {scales.map((scale) => {
              const scaleSongs = scale.songIds
                .map((id) => songs.find((s) => s.id === id))
                .filter(Boolean) as WorshipSong[];

              return (
                <div
                  key={scale.id}
                  className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-sky-700">
                          {scale.eventType === 'ensaio' ? 'PROGRAMAÇÃO DE ENSAIO' : 'ESCALA DE CULTO'}
                        </span>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span className="font-mono tabular-nums font-semibold text-slate-700">
                          {scale.date} às {scale.time}
                        </span>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span className="text-slate-500">{scale.location}</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">{scale.title}</h3>
                      {scale.notes && <p className="text-xs text-slate-600">{scale.notes}</p>}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteScale(scale.id)}
                      className="p-2 text-slate-400 hover:text-red-600 rounded-lg transition-colors self-start sm:self-center cursor-pointer"
                      title="Excluir escala"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Louvores selecionados para esta escala */}
                  {scaleSongs.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-700 block">
                        Louvores da Pasta para este Culto/Ensaio:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {scaleSongs.map((sg) => (
                          <button
                            key={sg.id}
                            type="button"
                            onClick={() => {
                              handleSelectSong(sg);
                              setSubTab('songs');
                            }}
                            className="px-3 py-1.5 text-xs font-semibold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <Music className="w-3.5 h-3.5" />
                            <span>
                              {sg.title} (Tom: {sg.originalKey}) — Abrir Cifra / Projetor
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tabela de Músicos e Cantores Escalados com Prazo de 3 Dias */}
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                          <th className="py-2.5 px-4">Função / Instrumento</th>
                          <th className="py-2.5 px-4">Músico / Cantor Escalado</th>
                          <th className="py-2.5 px-4">Prazo de Confirmação (Até 3 Dias)</th>
                          <th className="py-2.5 px-4">Status</th>
                          <th className="py-2.5 px-4 text-right">Ações & WhatsApp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {scale.assignments.map((assig) => {
                          const deadlineInfo = getConfirmationDeadlineStatus(
                            assig.deadlineAt,
                            assig.status
                          );

                          return (
                            <tr key={`${scale.id}-${assig.musicianId}`} className="hover:bg-slate-50/80">
                              <td className="py-3 px-4 font-semibold text-slate-800">
                                {assig.instrumentLabel}
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-bold text-slate-900">{assig.musicianName}</div>
                                <div className="text-slate-500 font-mono tabular-nums">
                                  {assig.musicianPhone}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-1.5 tabular-nums text-slate-600">
                                  <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                  <span>{deadlineInfo.label}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 font-bold">
                                {assig.status === 'confirmado' ? (
                                  <span className="text-emerald-700">Confirmado</span>
                                ) : assig.status === 'recusado' ? (
                                  <span className="text-red-600">Recusado</span>
                                ) : (
                                  <span className="text-amber-700">Aguardando Confirmação</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {assig.status !== 'confirmado' && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleConfirmAssignment(scale.id, assig.musicianId)
                                      }
                                      className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                      title="Confirmar participação dentro do prazo de 3 dias"
                                    >
                                      <Check className="w-3 h-3" />
                                      <span>Confirmar</span>
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeclineAndReplace(scale.id, assig.musicianId)
                                    }
                                    className="px-2.5 py-1 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                    title="Recusar ou substituir automaticamente pelo próximo músico da fila com menos escalas"
                                  >
                                    <RefreshCw className="w-3 h-3" />
                                    <span>Substituir</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleNotifyMusicianWhatsApp(
                                        scale,
                                        assig.musicianName,
                                        assig.musicianPhone,
                                        assig.instrumentLabel
                                      )
                                    }
                                    className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                    title="Enviar aviso da escala pelo WhatsApp"
                                  >
                                    <Share2 className="w-3 h-3 text-emerald-600" />
                                    <span>WhatsApp</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-TAB 2: PASTA DE LOUVORES, CIFRAS COM TRANSPOSIÇÃO DE TOM & PROJETOR NA PAREDE
      ===================================================================== */}
      {subTab === 'songs' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Coluna Esquerda (4 cols): Pastas e Lista de Louvores */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-amber-600" />
                <h2 className="text-sm font-bold text-slate-900">Pasta de Louvores</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAddSongForm(!showAddSongForm)}
                className="px-2.5 py-1 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Novo Louvor</span>
              </button>
            </div>

            {/* Filtro de Pastas */}
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedFolder('todas')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md cursor-pointer ${
                  selectedFolder === 'todas'
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                Todas as Pastas ({songs.length})
              </button>
              {folders.map((folder) => (
                <button
                  key={folder}
                  type="button"
                  onClick={() => setSelectedFolder(folder)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md cursor-pointer ${
                    selectedFolder === folder
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {folder}
                </button>
              ))}
            </div>

            {/* Formulário de Novo Louvor */}
            {showAddSongForm && (
              <form
                onSubmit={handleCreateSong}
                className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3"
              >
                <h4 className="text-xs font-bold text-slate-900">Adicionar Louvor na Pasta</h4>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Título do Louvor *
                  </label>
                  <input
                    type="text"
                    required
                    value={newSongTitle}
                    onChange={(e) => setNewSongTitle(e.target.value)}
                    placeholder="Ex: Lugar Secreto"
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Cantor / Ministério
                    </label>
                    <input
                      type="text"
                      value={newSongArtist}
                      onChange={(e) => setNewSongArtist(e.target.value)}
                      placeholder="Ex: Gabriela Rocha"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Tom Original
                    </label>
                    <select
                      value={newSongKey}
                      onChange={(e) => setNewSongKey(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                    >
                      {MUSICAL_KEYS.map((k) => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Nome da Pasta
                  </label>
                  <input
                    type="text"
                    value={newSongFolder}
                    onChange={(e) => setNewSongFolder(e.target.value)}
                    placeholder="Ex: Louvores de Domingo"
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Letra com Cifras entre Colchetes (ex: [G]Quão [D]grande) *
                  </label>
                  <textarea
                    rows={5}
                    required
                    value={newSongContent}
                    onChange={(e) => setNewSongContent(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddSongForm(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-xs font-bold text-white bg-sky-700 rounded-lg cursor-pointer"
                  >
                    Salvar na Pasta
                  </button>
                </div>
              </form>
            )}

            {/* Lista de músicas */}
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {filteredSongs.map((song) => (
                <div
                  key={song.id}
                  onClick={() => handleSelectSong(song)}
                  className={`p-3.5 flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                    activeSong?.id === song.id
                      ? 'bg-sky-50/80 text-slate-900'
                      : 'bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-xs text-slate-900">{song.title}</div>
                    <div className="text-[11px] text-slate-500">
                      <span>{song.artist}</span>
                      <span aria-hidden="true" className="mx-1">·</span>
                      <span>Pasta: {song.folderName}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-mono font-bold text-sky-700">
                      Tom {song.originalKey}
                    </span>
                    {songs.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSong(song.id);
                        }}
                        className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                        title="Remover música"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Coluna Direita (8 cols): Visualizador de Letra Com/Sem Cifras, Mudança de Tom & Modo Projeção */}
          {activeSong && (
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
              {/* Cabeçalho do Louvor + Botão PROJETAR NA PAREDE */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="text-xs text-slate-500">
                    <span>Pasta: {activeSong.folderName}</span>
                    <span aria-hidden="true" className="mx-1.5">·</span>
                    <span>Tom Original: {activeSong.originalKey}</span>
                    <span aria-hidden="true" className="mx-1.5">·</span>
                    <span className="tabular-nums">{activeSong.bpm} BPM</span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-900 mt-0.5">
                    {activeSong.title}
                  </h2>
                  <p className="text-xs font-medium text-slate-600">{activeSong.artist}</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveSlideIndex(0);
                    setIsProjectingWall(true);
                  }}
                  className="px-4 py-3 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-xs whitespace-nowrap shrink-0"
                >
                  <Monitor className="w-4 h-4" />
                  <span>Projetar Letra na Parede (Telão)</span>
                </button>
              </div>

              {/* Barra de Controles do Músico: Com/Sem Cifras + Alteração de Tom */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  {/* Toggle Com Cifras / Sem Cifras */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">Visualização:</span>
                    <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setShowChords(true)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                          showChords
                            ? 'bg-sky-700 text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Letra COM Cifras</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowChords(false)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                          !showChords
                            ? 'bg-slate-900 text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Apenas Letra (Sem Cifras)</span>
                      </button>
                    </div>
                  </div>

                  {/* Botões Rápidos -1/2 Tom e +1/2 Tom */}
                  <div className="flex items-center gap-2">
                    <Sliders className="w-3.5 h-3.5 text-sky-700" />
                    <span className="text-xs font-bold text-slate-700">
                      Tom Atual: <strong className="text-sky-700 font-mono text-sm">{targetKey}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleStepSemitone(-1)}
                      className="px-2.5 py-1 text-xs font-mono font-bold bg-white border border-slate-300 hover:bg-slate-100 rounded-md cursor-pointer"
                    >
                      -½ Tom
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStepSemitone(1)}
                      className="px-2.5 py-1 text-xs font-mono font-bold bg-white border border-slate-300 hover:bg-slate-100 rounded-md cursor-pointer"
                    >
                      +½ Tom
                    </button>
                    {targetKey !== activeSong.originalKey && (
                      <button
                        type="button"
                        onClick={() => setTargetKey(activeSong.originalKey)}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 underline cursor-pointer"
                      >
                        Voltar ao Original ({activeSong.originalKey})
                      </button>
                    )}
                  </div>
                </div>

                {/* Régua Completa dos 12 Tons Musicais */}
                <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
                  <span className="text-[11px] font-semibold text-slate-500 mr-1 shrink-0">
                    Mudar Tom:
                  </span>
                  {MUSICAL_KEYS.map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setTargetKey(k)}
                      className={`w-8 h-8 rounded-lg font-mono text-xs font-bold transition-colors shrink-0 cursor-pointer ${
                        targetKey === k
                          ? 'bg-sky-700 text-white shadow-2xs'
                          : k === activeSong.originalKey
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>

              {/* Corpo da Letra (Com Cifras alinhadas acima da sílaba OU Apenas Letra) */}
              <div className="p-5 bg-white border border-slate-200 rounded-xl overflow-x-auto">
                {showChords ? (
                  <div className="space-y-2 font-mono-chords text-sm leading-relaxed">
                    {parsedLines.map((line, idx) => {
                      if (line.type === 'empty') {
                        return <div key={idx} className="h-4" />;
                      }
                      if (line.type === 'section') {
                        return (
                          <div
                            key={idx}
                            className="pt-3 pb-1 text-xs font-sans font-extrabold uppercase tracking-wider text-red-700"
                          >
                            [{line.sectionTitle}]
                          </div>
                        );
                      }
                      return (
                        <div key={idx} className="flex flex-wrap items-end leading-none py-1">
                          {(line.segments || []).map((seg, sIdx) => (
                            <div key={sIdx} className="inline-flex flex-col mr-0.5">
                              <span className="text-xs font-bold text-sky-700 h-4 whitespace-pre">
                                {seg.chord ? `${seg.chord} ` : ' '}
                              </span>
                              <span className="text-sm font-sans text-slate-900 whitespace-pre">
                                {seg.text || ' '}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-1.5 text-base text-slate-800 leading-relaxed whitespace-pre-line font-sans">
                    {cleanLyricsOnly}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          SUB-TAB 3: MÚSICOS & CANTORES (CONTROLE DE EQUIDADE DA ESCALA)
      ===================================================================== */}
      {subTab === 'team' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Formulário de Cadastro de Músico / Cantor */}
          <form
            onSubmit={handleAddMusician}
            className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 space-y-4"
          >
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Cadastrar Músico ou Cantor
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome Completo *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Samuel Rodrigues"
                value={newMusicianName}
                onChange={(e) => setNewMusicianName(e.target.value)}
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
                placeholder="Ex: 11988887777"
                value={newMusicianPhone}
                onChange={(e) => setNewMusicianPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Instrumento / Função no Louvor *
              </label>
              <select
                value={newMusicianInstrument}
                onChange={(e) =>
                  setNewMusicianInstrument(e.target.value as WorshipInstrumentRole)
                }
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                {INSTRUMENT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl transition-colors cursor-pointer"
            >
              Adicionar ao Rodízio do Louvor
            </button>
          </form>

          {/* Tabela de Equidade de Participações */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Controle de Oportunidades (Rodízio Justo Automático)
              </h3>
              <p className="text-xs text-slate-600">
                O sistema prioriza quem possui menos participações acumuladas para que todos os músicos e cantores sirvam com a mesma oportunidade.
              </p>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="py-2.5 px-4">Nome</th>
                    <th className="py-2.5 px-4">Função / Instrumento</th>
                    <th className="py-2.5 px-4 text-right">Participações na Escala</th>
                    <th className="py-2.5 px-4">Última Escala</th>
                    <th className="py-2.5 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {musicians
                    .slice()
                    .sort((a, b) => a.participationsCount - b.participationsCount)
                    .map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-slate-900">{m.name}</td>
                        <td className="py-3 px-4 text-slate-600">{m.instrumentLabel}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold tabular-nums text-sky-700">
                          {m.participationsCount}x escalado(a)
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums text-slate-500">
                          {m.lastScheduledDate || 'Aguardando 1ª vez'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={buildWhatsAppUrl(
                                m.phone,
                                `Olá ${m.name}, paz do Senhor! Mensagem do Ministério de Louvor da ${churchSettings.name}.`
                              )}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md"
                            >
                              WhatsApp
                            </a>
                            <button
                              type="button"
                              onClick={() => handleRemoveMusician(m.id)}
                              className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                              title="Remover integrante"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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

      {/* =====================================================================
          MODAL TELA CHEIA: PROJETOR DE PAREDE / TELÃO DA IGREJA
      ===================================================================== */}
      {isProjectingWall && activeSong && (
        <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col justify-between p-6 sm:p-12 select-none">
          {/* Top Bar do Projetor */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="text-xs font-bold tracking-wider uppercase text-amber-400">
                PROJEÇÃO DE TELÃO · {churchSettings.name}
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                {activeSong.title} — <span className="text-slate-400 text-sm">{activeSong.artist}</span>
              </h2>
            </div>

            <div className="flex items-center gap-3">
              {/* Controle de Tamanho da Fonte na Parede */}
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setProjectorFontSize('md')}
                  className={`px-2.5 py-1 text-xs font-bold rounded cursor-pointer ${
                    projectorFontSize === 'md' ? 'bg-amber-400 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  A
                </button>
                <button
                  type="button"
                  onClick={() => setProjectorFontSize('lg')}
                  className={`px-2.5 py-1 text-sm font-bold rounded cursor-pointer ${
                    projectorFontSize === 'lg' ? 'bg-amber-400 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  A+
                </button>
                <button
                  type="button"
                  onClick={() => setProjectorFontSize('xl')}
                  className={`px-2.5 py-1 text-base font-bold rounded cursor-pointer ${
                    projectorFontSize === 'xl' ? 'bg-amber-400 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  A++
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsProjectingWall(false)}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Sair da Projeção</span>
              </button>
            </div>
          </div>

          {/* Área Central da Letra Projetada na Parede (Sem cifras, foco total para a igreja cantar) */}
          <div className="my-auto py-8 flex flex-col items-center justify-center text-center max-w-5xl mx-auto space-y-6">
            {projectionSlides[activeSlideIndex] ? (
              <>
                <span className="text-xs font-bold uppercase tracking-widest text-amber-400/90">
                  {projectionSlides[activeSlideIndex].label} ({activeSlideIndex + 1} de{' '}
                  {projectionSlides.length})
                </span>
                <div
                  className={`font-extrabold tracking-tight leading-snug text-white space-y-3 ${
                    projectorFontSize === 'xl'
                      ? 'text-4xl sm:text-6xl'
                      : projectorFontSize === 'lg'
                      ? 'text-3xl sm:text-5xl'
                      : 'text-2xl sm:text-4xl'
                  }`}
                >
                  {projectionSlides[activeSlideIndex].lines.map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-3xl font-bold text-slate-400">{cleanLyricsOnly}</p>
            )}
          </div>

          {/* Rodapé de Navegação de Estrofes do Projetor */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-800 pt-4">
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              {projectionSlides.map((sl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveSlideIndex(idx)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    activeSlideIndex === idx
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {idx + 1}. {sl.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                disabled={activeSlideIndex === 0}
                onClick={() => setActiveSlideIndex((i) => Math.max(0, i - 1))}
                className="px-4 py-2.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Estrofe Anterior</span>
              </button>
              <button
                type="button"
                disabled={activeSlideIndex >= projectionSlides.length - 1}
                onClick={() =>
                  setActiveSlideIndex((i) => Math.min(projectionSlides.length - 1, i + 1))
                }
                className="px-4 py-2.5 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 disabled:opacity-40 rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <span>Próxima Estrofe</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
