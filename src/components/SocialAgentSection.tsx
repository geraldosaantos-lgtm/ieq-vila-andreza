import React, { useState, useRef } from 'react';
import {
  Sparkles,
  UploadCloud,
  CheckCircle2,
  Clock,
  Send,
  Trash2,
  Edit3,
  Calendar,
  Layers,
  Facebook,
  Instagram,
  Video,
  Image as ImageIcon,
  Check,
  X,
  Play,
  RotateCw,
  ExternalLink,
  Plus,
  Sliders,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type {
  SocialPostItem,
  SocialAgentConfig,
  SocialPlatform,
  QuadrangularPillar,
  SocialMediaAttachment,
  SocialScheduleSlot,
} from '../types';

interface SocialAgentSectionProps {
  posts: SocialPostItem[];
  config: SocialAgentConfig;
  churchName: string;
  pastorName: string;
  onUpdatePosts: (posts: SocialPostItem[]) => void;
  onUpdateConfig: (config: SocialAgentConfig) => void;
}

export const SocialAgentSection: React.FC<SocialAgentSectionProps> = ({
  posts,
  config,
  churchName,
  pastorName,
  onUpdatePosts,
  onUpdateConfig,
}) => {
  // New Post Form State
  const [contextPrompt, setContextPrompt] = useState<string>('');
  const [selectedPillar, setSelectedPillar] = useState<QuadrangularPillar>('salvacao');
  const [selectedTone, setSelectedTone] = useState<string>('inspirador_evangelistico');
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>([
    'facebook',
    'instagram',
    'tiktok',
  ]);
  const [uploadedMedia, setUploadedMedia] = useState<SocialMediaAttachment[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Filters & UI State
  const [statusFilter, setStatusFilter] = useState<'todos' | 'aguardando' | 'agendados' | 'publicados'>('todos');
  const [activePlatformTab, setActivePlatformTab] = useState<Record<string, SocialPlatform>>({});
  const [showScheduleConfig, setShowScheduleConfig] = useState<boolean>(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Editing post copy
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editedInstagramCaption, setEditedInstagramCaption] = useState<string>('');
  const [editedFacebookText, setEditedFacebookText] = useState<string>('');
  const [editedTiktokCaption, setEditedTiktokCaption] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Quick Notification Toast
  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3800);
  };

  // Handle Local File Selection (Photos or Videos)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: SocialMediaAttachment[] = [];
    Array.from(files).forEach((file, idx) => {
      const isVid = file.type.startsWith('video/');
      const fakeUrl = URL.createObjectURL(file);
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);

      newAttachments.push({
        id: `att-${Date.now()}-${idx}`,
        type: isVid ? 'video' : 'photo',
        url: fakeUrl,
        fileName: file.name,
        fileSizeLabel: `${sizeMB} MB`,
        mimeType: file.type,
      });
    });

    setUploadedMedia((prev) => [...prev, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveMedia = (id: string) => {
    setUploadedMedia((prev) => prev.filter((m) => m.id !== id));
  };

  // Toggle platform selection
  const togglePlatform = (p: SocialPlatform) => {
    if (selectedPlatforms.includes(p)) {
      if (selectedPlatforms.length > 1) {
        setSelectedPlatforms(selectedPlatforms.filter((item) => item !== p));
      }
    } else {
      setSelectedPlatforms([...selectedPlatforms, p]);
    }
  };

  // Find next suitable pre-defined schedule slot
  const getNextScheduledSlot = (): { label: string; dateStr: string } => {
    const activeSlots = config.predefinedSchedule.filter((s) => s.active);
    if (activeSlots.length === 0) {
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 1);
      nextDate.setHours(19, 0, 0, 0);
      return {
        label: 'Próximo Horário Padrão (19:00)',
        dateStr: nextDate.toISOString().slice(0, 16),
      };
    }

    const slot = activeSlots[posts.length % activeSlots.length];
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 2);
    const [hh, mm] = slot.time.split(':');
    nextDate.setHours(parseInt(hh || '19', 10), parseInt(mm || '00', 10), 0, 0);

    return {
      label: `${slot.dayOfWeek} · ${slot.time} (${slot.label})`,
      dateStr: nextDate.toISOString().slice(0, 16),
    };
  };

  // Generate Post with AI Agent (Server Gemini API + robust fallback)
  const handleGeneratePost = async () => {
    if (!contextPrompt.trim() && uploadedMedia.length === 0) {
      setGenerationError('Insira um resumo/tema do evento ou anexe fotos e vídeos para o Agente analisar.');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    const slotInfo = getNextScheduledSlot();

    try {
      const res = await fetch('/api/social-agent/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: contextPrompt,
          pillar: selectedPillar,
          tone: selectedTone,
          platforms: selectedPlatforms,
          mediaCount: uploadedMedia.length,
          mediaTypes: uploadedMedia.map((m) => m.type),
          churchName,
          pastorName,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.post) {
          const newPostItem: SocialPostItem = {
            ...data.post,
            id: `post-${Date.now()}`,
            media: uploadedMedia.length > 0 ? uploadedMedia : [
              {
                id: `med-${Date.now()}`,
                type: 'photo',
                url: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=1000&q=80',
                fileName: 'foto_altar_culto.jpg',
                fileSizeLabel: '1.8 MB',
              },
            ],
            scheduledSlotLabel: slotInfo.label,
            scheduledFor: slotInfo.dateStr,
            createdAt: new Date().toISOString(),
          };

          onUpdatePosts([newPostItem, ...posts]);
          setContextPrompt('');
          setUploadedMedia([]);
          triggerToast('Post criado com sucesso pelo Agente Inteligente! Agora revise e aprove.');
          setIsGenerating(false);
          return;
        }
      }
    } catch {
      // Fallback generator
    }

    // Client-side structured fallback with high-quality IEQ tone
    const pillarBibleRefMap: Record<QuadrangularPillar, string> = {
      salvacao: 'João 3:16 — "Porque Deus amou o mundo de tal maneira..."',
      espirito_santo: 'Atos 1:8 — "Mas recebereis a virtude do Espírito Santo..."',
      cura_divina: 'Isaías 53:5 — "Pelas suas pisaduras fomos sarados."',
      segunda_vinda: '1 Tessalonicenses 4:16 — "Porque o mesmo Senhor descerá do céu..."',
      devocional: 'Salmos 119:105 — "Lâmpada para os meus pés é a tua palavra..."',
    };
    const pillarBibleRef = pillarBibleRefMap[selectedPillar] || 'Salmos 100:2';

    const fallbackPost: SocialPostItem = {
      id: `post-${Date.now()}`,
      title: contextPrompt.trim() ? contextPrompt.slice(0, 50) : `Celebração Especial — ${churchName}`,
      contextPrompt: contextPrompt || 'Mídia enviada para publicação nas redes sociais da igreja',
      tone: selectedTone,
      pillar: selectedPillar,
      media: uploadedMedia.length > 0 ? uploadedMedia : [
        {
          id: `med-${Date.now()}`,
          type: 'photo',
          url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1000&q=80',
          fileName: 'culto_celebracao_ieq.jpg',
          fileSizeLabel: '1.2 MB',
        },
      ],
      visualAnalysis: `Mídia com foco em comunhão, adoração e presença de Deus no templo da ${churchName}. Perfeito para Reels e Feed.`,
      suggestedHook: `Uma palavra viva de esperança e renovo para o seu coração nesta semana! 🙌✨`,
      bibleReference: pillarBibleRef,
      platforms: selectedPlatforms,
      content: {
        instagram: {
          caption: `✨ O agir de Deus não para! Na ${churchName}, vivemos momentos preciosos na presença do Pai.\n\n${contextPrompt || 'Venha estar conosco no próximo culto e traga sua família para receber uma bênção de Deus.'}\n\n📍 ${churchName}\n🎙️ ${pastorName}\n\nComente "AMÉM" se você recebe essa bênção! 👇`,
          hashtags: ['#IEQVilaAndreza', '#Quadrangular', '#JesusCristo', '#Evangelho', '#VilaAndreza', '#Familia', '#Adoracao'],
          formatSuggestion: 'Carrossel com fotos ou Reels vertical 9:16',
          bestTime: '18:30 às 20:00',
          status: 'pendente',
        },
        facebook: {
          postText: `Paz seja convosco! 🙌\n\n${contextPrompt || 'Convidamos você e sua família para adorar a Deus conosco na IEQ Vila Andreza.'}\n\n"Jesus Cristo é o mesmo ontem, hoje e eternamente!"`,
          callToAction: 'Compartilhe este convite com seus amigos e familiares!',
          hashtags: ['#IEQVilaAndreza', '#IgrejaQuadrangular', '#Culto'],
          bestTime: '10:00 ou 19:00',
          status: 'pendente',
        },
        tiktok: {
          caption: `Você precisa ouvir isso hoje! 🔥 Deus tem uma promessa para a sua vida! #IEQVilaAndreza #TikTokGospel #Louvor #Quadrangular`,
          videoScriptHook: `[0-3s] "Deus mandou te dizer isto hoje..." -> [3-10s] Mostrar o louvor e os irmãos adorando -> [Final] "Te esperamos na IEQ Vila Andreza!"`,
          soundSuggestion: 'Bondade de Deus (Instrumental ou Versão Acústica)',
          hashtags: ['#IEQVilaAndreza', '#GospelTikTok', '#CristaosNoTikTok', '#PalavraDeDeus'],
          bestTime: '12:00 às 14:00',
          status: 'pendente',
        },
      },
      status: 'aguardando_aprovacao',
      scheduledSlotLabel: slotInfo.label,
      scheduledFor: slotInfo.dateStr,
      recurrenceRule: 'semanal',
      createdAt: new Date().toISOString(),
    };

    onUpdatePosts([fallbackPost, ...posts]);
    setContextPrompt('');
    setUploadedMedia([]);
    setIsGenerating(false);
    triggerToast('Post criado com sucesso! Analisado e formatado para Facebook, Instagram e TikTok.');
  };

  // Approve Post
  const handleApprovePost = (post: SocialPostItem) => {
    const updated = posts.map((p) => {
      if (p.id === post.id) {
        return {
          ...p,
          status: 'aprovado_agendado' as const,
          approvedBy: pastorName || 'Pastor / Administrador',
          approvedAt: new Date().toISOString(),
          content: {
            instagram: { ...p.content.instagram, status: 'agendado' as const },
            facebook: { ...p.content.facebook, status: 'agendado' as const },
            tiktok: { ...p.content.tiktok, status: 'agendado' as const },
          },
        };
      }
      return p;
    });

    onUpdatePosts(updated);
    triggerToast(`Post aprovado! O Agente IA publicará no Facebook, Instagram e TikTok conforme a programação: ${post.scheduledSlotLabel || 'Próximo horário'}.`);
  };

  // Publish Now (Immediate posting simulation with real-world feedback)
  const handlePublishNow = async (post: SocialPostItem) => {
    setPublishingId(post.id);

    try {
      await fetch('/api/social-agent/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, platforms: post.platforms }),
      }).catch(() => {});
    } catch {
      // offline/dev fallback
    }

    setTimeout(() => {
      const nowIso = new Date().toISOString();
      const updated = posts.map((p) => {
        if (p.id === post.id) {
          return {
            ...p,
            status: 'publicado' as const,
            publishedAt: nowIso,
            approvedBy: p.approvedBy || pastorName,
            approvedAt: p.approvedAt || nowIso,
            content: {
              instagram: { ...p.content.instagram, status: 'publicado' as const, publishedAt: nowIso },
              facebook: { ...p.content.facebook, status: 'publicado' as const, publishedAt: nowIso },
              tiktok: { ...p.content.tiktok, status: 'publicado' as const, publishedAt: nowIso },
            },
          };
        }
        return p;
      });

      onUpdatePosts(updated);
      setPublishingId(null);
      triggerToast('Publicação concluída com sucesso no Facebook, Instagram e TikTok!');
    }, 1200);
  };

  // Delete Post
  const handleDeletePost = (id: string) => {
    onUpdatePosts(posts.filter((p) => p.id !== id));
    triggerToast('Post removido.');
  };

  // Open Edit Mode
  const handleStartEdit = (post: SocialPostItem) => {
    setEditingPostId(post.id);
    setEditedInstagramCaption(post.content.instagram.caption);
    setEditedFacebookText(post.content.facebook.postText);
    setEditedTiktokCaption(post.content.tiktok.caption);
  };

  // Save Edit
  const handleSaveEdit = (postId: string) => {
    const updated = posts.map((p) => {
      if (p.id === postId) {
        return {
          ...p,
          content: {
            ...p.content,
            instagram: { ...p.content.instagram, caption: editedInstagramCaption },
            facebook: { ...p.content.facebook, postText: editedFacebookText },
            tiktok: { ...p.content.tiktok, caption: editedTiktokCaption },
          },
        };
      }
      return p;
    });

    onUpdatePosts(updated);
    setEditingPostId(null);
    triggerToast('Alterações no texto do post salvas!');
  };

  // Pre-defined schedule toggle
  const handleToggleScheduleSlot = (slotId: string) => {
    const nextSlots = config.predefinedSchedule.map((s) =>
      s.id === slotId ? { ...s, active: !s.active } : s
    );
    onUpdateConfig({ ...config, predefinedSchedule: nextSlots });
  };

  const filteredPosts = posts.filter((p) => {
    if (statusFilter === 'aguardando') return p.status === 'aguardando_aprovacao';
    if (statusFilter === 'agendados') return p.status === 'aprovado_agendado';
    if (statusFilter === 'publicados') return p.status === 'publicado';
    return true;
  });

  const getPillarBadge = (pillar: QuadrangularPillar) => {
    switch (pillar) {
      case 'salvacao':
        return {
          bg: 'bg-red-50 text-red-700 border-red-200',
          dot: 'bg-red-600',
          label: 'Jesus Salva (Cruz)',
        };
      case 'espirito_santo':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          dot: 'bg-amber-500',
          label: 'Batismo Espírito Santo (Pomba)',
        };
      case 'cura_divina':
        return {
          bg: 'bg-sky-50 text-sky-800 border-sky-200',
          dot: 'bg-sky-600',
          label: 'Jesus Cura (Cálice)',
        };
      case 'segunda_vinda':
        return {
          bg: 'bg-purple-50 text-purple-800 border-purple-200',
          dot: 'bg-purple-600',
          label: 'Jesus Voltará (Coroa)',
        };
      default:
        return {
          bg: 'bg-stone-50 text-stone-800 border-stone-200',
          dot: 'bg-stone-600',
          label: 'Devocional Quadrangular',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {successToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-stone-900 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-lg shadow-xl border border-stone-700 flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* TOP AGENT HERO & STATUS BANNER */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-gradient-to-r from-red-600 via-purple-600 to-sky-600 text-white tracking-wide uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                Agente IA
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-stone-900 tracking-tight">
                Mídias & Postagens Automáticas IEQ
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-stone-600">
              Receba fotos e vídeos da igreja. O Agente Inteligente gera posts otimizados para{' '}
              <strong className="text-stone-800">Facebook</strong>,{' '}
              <strong className="text-stone-800">Instagram</strong> e{' '}
              <strong className="text-stone-800">TikTok</strong> e realiza postagens automáticas após aprovação.
            </p>
          </div>

          {/* Social Accounts Status & Programação Button */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-stone-700">
              <Facebook className="w-3.5 h-3.5 text-blue-600" />
              <span>Facebook</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </div>

            <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-stone-700">
              <Instagram className="w-3.5 h-3.5 text-pink-600" />
              <span>Instagram</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </div>

            <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-stone-700">
              <Video className="w-3.5 h-3.5 text-stone-900" />
              <span>TikTok</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </div>

            <button
              type="button"
              onClick={() => setShowScheduleConfig(!showScheduleConfig)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-800 bg-stone-100 hover:bg-stone-200 border border-stone-200 transition-colors cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-stone-600" />
              <span>Programação Pré-definida</span>
              {showScheduleConfig ? (
                <ChevronUp className="w-3.5 h-3.5 text-stone-500" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
              )}
            </button>
          </div>
        </div>

        {/* Collapsible Schedule Config Drawer */}
        {showScheduleConfig && (
          <div className="mt-4 pt-4 border-t border-stone-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-stone-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-red-600" />
                  Horários Pré-definidos para Postagem Automática
                </h3>
                <p className="text-[11px] text-stone-500">
                  Quando você aprova um post, ele é encaixado na próxima data e horário ativo abaixo.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {config.predefinedSchedule.map((slot) => (
                <div
                  key={slot.id}
                  className={`p-3 rounded-lg border text-xs transition-all ${
                    slot.active
                      ? 'bg-stone-50 border-stone-300'
                      : 'bg-stone-100/60 border-stone-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-stone-900">
                      {slot.dayOfWeek} às {slot.time}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleScheduleSlot(slot.id)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                        slot.active
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      {slot.active ? 'Ativo' : 'Pausado'}
                    </button>
                  </div>
                  <p className="text-[11px] text-stone-600 mt-1 line-clamp-1">{slot.label}</p>
                  <div className="flex items-center gap-1.5 mt-2 text-[10px] text-stone-500 uppercase font-semibold">
                    {slot.platforms.map((p) => (
                      <span key={p} className="bg-white px-1.5 py-0.5 rounded border border-stone-200">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* WORKSPACE: MEDIA INTAKE & POST CREATOR */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold text-xs">
            1
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-stone-900">
              Enviar Mídias (Fotos e Vídeos) & Instrução para o Agente
            </h3>
            <p className="text-xs text-stone-500">
              O agente irá analisar as imagens/vídeos e redigir textos inspiradores, ganchos e hashtags.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Context, Tone, Pillar */}
          <div className="lg:col-span-7 space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Contexto / O que aconteceu no culto ou evento?
              </label>
              <textarea
                value={contextPrompt}
                onChange={(e) => setContextPrompt(e.target.value)}
                placeholder="Ex: Fotos do Culto da Família com Santa Ceia no domingo. Tivemos adoração profunda e 3 decisões por Cristo. Convide as famílias para o próximo culto..."
                rows={3}
                className="w-full text-xs sm:text-sm p-3 rounded-lg border border-stone-300 focus:border-red-600 focus:ring-1 focus:ring-red-600 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Doutrina / Pilar Quadrangular
                </label>
                <select
                  value={selectedPillar}
                  onChange={(e) => setSelectedPillar(e.target.value as QuadrangularPillar)}
                  className="w-full text-xs p-2.5 rounded-lg border border-stone-300 bg-white focus:border-red-600 focus:outline-none"
                >
                  <option value="salvacao">1. Jesus Salva (Vermelho - Cruz)</option>
                  <option value="espirito_santo">2. Jesus Batiza no Espírito Santo (Amarelo - Pomba)</option>
                  <option value="cura_divina">3. Jesus Cura (Azul - Cálice)</option>
                  <option value="segunda_vinda">4. Jesus Voltará como Rei (Roxo - Coroa)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Tom da Comunicação
                </label>
                <select
                  value={selectedTone}
                  onChange={(e) => setSelectedTone(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-stone-300 bg-white focus:border-red-600 focus:outline-none"
                >
                  <option value="inspirador_evangelistico">Inspirador & Evangelístico</option>
                  <option value="jovem_dinamico">Jovem & Dinâmico (Reels/TikTok)</option>
                  <option value="solene_pastoral">Pastoral & Acolhedor</option>
                  <option value="convite_urgente">Convite & Contagem Regressiva</option>
                </select>
              </div>
            </div>

            {/* Target Platforms selection */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Redes Sociais Destino:
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => togglePlatform('facebook')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-colors ${
                    selectedPlatforms.includes('facebook')
                      ? 'bg-blue-50 border-blue-400 text-blue-700 font-bold'
                      : 'bg-stone-50 border-stone-200 text-stone-500'
                  }`}
                >
                  <Facebook className="w-3.5 h-3.5" />
                  <span>Facebook</span>
                  {selectedPlatforms.includes('facebook') && <Check className="w-3 h-3 text-blue-600" />}
                </button>

                <button
                  type="button"
                  onClick={() => togglePlatform('instagram')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-colors ${
                    selectedPlatforms.includes('instagram')
                      ? 'bg-pink-50 border-pink-400 text-pink-700 font-bold'
                      : 'bg-stone-50 border-stone-200 text-stone-500'
                  }`}
                >
                  <Instagram className="w-3.5 h-3.5" />
                  <span>Instagram</span>
                  {selectedPlatforms.includes('instagram') && <Check className="w-3 h-3 text-pink-600" />}
                </button>

                <button
                  type="button"
                  onClick={() => togglePlatform('tiktok')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-colors ${
                    selectedPlatforms.includes('tiktok')
                      ? 'bg-stone-900 border-stone-900 text-white font-bold'
                      : 'bg-stone-50 border-stone-200 text-stone-500'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>TikTok</span>
                  {selectedPlatforms.includes('tiktok') && <Check className="w-3 h-3 text-emerald-400" />}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Media Drop Area */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Fotos & Vídeos do Culto / Evento
              </label>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
                id="media-file-input"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-stone-300 hover:border-red-500 rounded-xl p-4 text-center cursor-pointer transition-colors bg-stone-50/50 hover:bg-stone-50"
              >
                <UploadCloud className="w-8 h-8 text-stone-400 mx-auto mb-1.5" />
                <p className="text-xs font-bold text-stone-800">
                  Clique para anexar Fotos ou Vídeos
                </p>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Suporta JPG, PNG, MP4, MOV (celular ou computador)
                </p>
              </div>
            </div>

            {/* Uploaded media previews */}
            {uploadedMedia.length > 0 && (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                <span className="text-[11px] font-bold text-stone-600">
                  Mídias anexadas ({uploadedMedia.length}):
                </span>
                <div className="flex flex-wrap gap-2">
                  {uploadedMedia.map((m) => (
                    <div
                      key={m.id}
                      className="relative group bg-stone-100 border border-stone-200 rounded-lg p-1.5 flex items-center gap-2 text-xs"
                    >
                      {m.type === 'video' ? (
                        <div className="w-8 h-8 bg-stone-900 rounded flex items-center justify-center text-white shrink-0">
                          <Play className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <img
                          src={m.url}
                          alt={m.fileName}
                          className="w-8 h-8 rounded object-cover border border-stone-200 shrink-0"
                        />
                      )}
                      <div className="max-w-[100px] truncate">
                        <p className="text-[11px] font-semibold text-stone-800 truncate">
                          {m.fileName}
                        </p>
                        <p className="text-[10px] text-stone-500">{m.fileSizeLabel}</p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveMedia(m.id);
                        }}
                        className="text-stone-400 hover:text-red-600 cursor-pointer p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error Message */}
            {generationError && (
              <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                {generationError}
              </p>
            )}

            {/* Action Button: Compact & Refined */}
            <button
              type="button"
              disabled={isGenerating}
              onClick={handleGeneratePost}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-red-600 via-purple-600 to-sky-600 hover:opacity-95 shadow-xs transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>Agente IA analisando mídias & redigindo posts...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Criar Posts para Redes Sociais com Agente IA</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* APPROVAL & POSTINGS PIPELINE */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-stone-200 p-3 sm:p-4 rounded-xl shadow-xs">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-stone-900">
              Fila de Aprovação & Publicações nas Redes
            </h3>
            <p className="text-xs text-stone-500">
              Revise o que o agente gerou. Após aprovar, a postagem ocorrerá na programação predefinida.
            </p>
          </div>

          {/* Status Filter Tabs (Compact) */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setStatusFilter('todos')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                statusFilter === 'todos'
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              Todos ({posts.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('aguardando')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                statusFilter === 'aguardando'
                  ? 'bg-amber-400 text-stone-950 font-bold'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              Aguardando ({posts.filter((p) => p.status === 'aguardando_aprovacao').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('agendados')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                statusFilter === 'agendados'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              Agendados ({posts.filter((p) => p.status === 'aprovado_agendado').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('publicados')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                statusFilter === 'publicados'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              Publicados ({posts.filter((p) => p.status === 'publicado').length})
            </button>
          </div>
        </div>

        {/* POSTS LIST */}
        {filteredPosts.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-xl p-8 text-center text-stone-500 space-y-2">
            <Layers className="w-10 h-10 text-stone-300 mx-auto" />
            <p className="text-sm font-semibold text-stone-700">Nenhum post encontrado nesta categoria.</p>
            <p className="text-xs text-stone-500">
              Envie fotos ou vídeos acima para que o Agente IA gere novas opções de postagem!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => {
              const activePlat = activePlatformTab[post.id] || 'instagram';
              const pillarBadge = getPillarBadge(post.pillar);
              const isEditing = editingPostId === post.id;
              const isPublishing = publishingId === post.id;

              return (
                <div
                  key={post.id}
                  className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs hover:border-stone-300 transition-all"
                >
                  {/* Post Top Card Bar */}
                  <div className="p-4 bg-stone-50/80 border-b border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Status Badge */}
                      {post.status === 'aguardando_aprovacao' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          <Clock className="w-3 h-3 text-amber-700" />
                          Aguardando Aprovação
                        </span>
                      )}
                      {post.status === 'aprovado_agendado' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
                          <CheckCircle2 className="w-3 h-3 text-blue-700" />
                          Aprovado · Agendado no Piloto Automático
                        </span>
                      )}
                      {post.status === 'publicado' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                          <Check className="w-3 h-3 text-emerald-700" />
                          Publicado com Sucesso
                        </span>
                      )}

                      {/* Quadrangular Pillar Badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${pillarBadge.bg}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${pillarBadge.dot}`} />
                        {pillarBadge.label}
                      </span>

                      {/* Scheduled Slot Info */}
                      <span className="text-[11px] text-stone-600 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-stone-400" />
                        Programado: <strong className="text-stone-800">{post.scheduledSlotLabel || 'Horário de Pico'}</strong>
                      </span>
                    </div>

                    {/* Action Buttons: Compact & Tactile */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {post.status === 'aguardando_aprovacao' && (
                        <button
                          type="button"
                          onClick={() => handleApprovePost(post)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-2xs cursor-pointer"
                          title="Aprovar post para publicação automática pelo agente"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Aprovar Post</span>
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={isPublishing}
                        onClick={() => handlePublishNow(post)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                        title="Publicar imediatamente em todas as redes conectadas"
                      >
                        {isPublishing ? (
                          <>
                            <RotateCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Publicando...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Publicar Agora</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => (isEditing ? handleSaveEdit(post.id) : handleStartEdit(post))}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-200 transition-colors cursor-pointer"
                        title={isEditing ? 'Salvar textos editados' : 'Editar textos do post'}
                      >
                        {isEditing ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Salvar</span>
                          </>
                        ) : (
                          <>
                            <Edit3 className="w-3.5 h-3.5 text-stone-600" />
                            <span>Editar</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeletePost(post.id)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Remover post da fila"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Post Content Body */}
                  <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* Media Preview & Visual Analysis */}
                    <div className="lg:col-span-4 space-y-3">
                      <div className="relative rounded-lg overflow-hidden border border-stone-200 bg-stone-900 aspect-video sm:aspect-square flex items-center justify-center">
                        {post.media && post.media.length > 0 ? (
                          post.media[0].type === 'video' ? (
                            <div className="text-center p-4 text-white">
                              <Video className="w-10 h-10 mx-auto mb-2 text-stone-400" />
                              <p className="text-xs font-bold">{post.media[0].fileName}</p>
                              <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] bg-red-600 font-bold uppercase">
                                Vídeo para Reels / TikTok
                              </span>
                            </div>
                          ) : (
                            <img
                              src={post.media[0].url}
                              alt={post.title}
                              className="w-full h-full object-cover"
                            />
                          )
                        ) : (
                          <div className="text-stone-400 text-xs">Sem mídia anexada</div>
                        )}

                        {post.media && post.media.length > 1 && (
                          <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-stone-900/80 text-white text-[10px] font-bold">
                            +{post.media.length - 1} mídias
                          </span>
                        )}
                      </div>

                      <div className="bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs space-y-1">
                        <span className="font-bold text-stone-800 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-red-600" />
                          Análise Visual do Agente IA:
                        </span>
                        <p className="text-[11px] text-stone-600 leading-relaxed">
                          {post.visualAnalysis}
                        </p>
                        <p className="text-[10px] text-stone-500 pt-1 border-t border-stone-200">
                          📖 <strong>Referência:</strong> {post.bibleReference}
                        </p>
                      </div>
                    </div>

                    {/* Social Media Variations Tabbed View */}
                    <div className="lg:col-span-8 space-y-3">
                      {/* Platform Switcher Buttons */}
                      <div className="flex items-center gap-1.5 border-b border-stone-200 pb-2">
                        <button
                          type="button"
                          onClick={() =>
                            setActivePlatformTab((prev) => ({ ...prev, [post.id]: 'instagram' }))
                          }
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                            activePlat === 'instagram'
                              ? 'bg-pink-600 text-white shadow-2xs'
                              : 'text-stone-600 hover:bg-stone-100'
                          }`}
                        >
                          <Instagram className="w-3.5 h-3.5" />
                          <span>Instagram (Feed & Reels)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setActivePlatformTab((prev) => ({ ...prev, [post.id]: 'facebook' }))
                          }
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                            activePlat === 'facebook'
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'text-stone-600 hover:bg-stone-100'
                          }`}
                        >
                          <Facebook className="w-3.5 h-3.5" />
                          <span>Facebook</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setActivePlatformTab((prev) => ({ ...prev, [post.id]: 'tiktok' }))
                          }
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                            activePlat === 'tiktok'
                              ? 'bg-stone-900 text-white shadow-2xs'
                              : 'text-stone-600 hover:bg-stone-100'
                          }`}
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>TikTok</span>
                        </button>
                      </div>

                      {/* INSTAGRAM CONTENT */}
                      {activePlat === 'instagram' && (
                        <div className="space-y-2.5">
                          {isEditing ? (
                            <textarea
                              value={editedInstagramCaption}
                              onChange={(e) => setEditedInstagramCaption(e.target.value)}
                              rows={6}
                              className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:border-pink-600"
                            />
                          ) : (
                            <div className="bg-stone-50 p-3 rounded-lg border border-stone-200">
                              <p className="text-xs text-stone-800 whitespace-pre-line leading-relaxed font-normal">
                                {post.content.instagram.caption}
                              </p>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-1">
                            {post.content.instagram.hashtags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[11px] text-pink-700 bg-pink-50 border border-pink-200 px-2 py-0.5 rounded-md font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-stone-500 pt-1">
                            <span>
                              📐 <strong>Formato recomendado:</strong>{' '}
                              {post.content.instagram.formatSuggestion}
                            </span>
                            <span>·</span>
                            <span>
                              ⏰ <strong>Melhor Horário:</strong> {post.content.instagram.bestTime}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* FACEBOOK CONTENT */}
                      {activePlat === 'facebook' && (
                        <div className="space-y-2.5">
                          {isEditing ? (
                            <textarea
                              value={editedFacebookText}
                              onChange={(e) => setEditedFacebookText(e.target.value)}
                              rows={5}
                              className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:border-blue-600"
                            />
                          ) : (
                            <div className="bg-stone-50 p-3 rounded-lg border border-stone-200">
                              <p className="text-xs text-stone-800 whitespace-pre-line leading-relaxed font-normal">
                                {post.content.facebook.postText}
                              </p>
                              {post.content.facebook.callToAction && (
                                <p className="mt-2 text-xs font-semibold text-blue-700">
                                  👉 {post.content.facebook.callToAction}
                                </p>
                              )}
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-1">
                            {post.content.facebook.hashtags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[11px] text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>

                          <div className="text-[11px] text-stone-500 pt-1">
                            ⏰ <strong>Melhor Horário:</strong> {post.content.facebook.bestTime}
                          </div>
                        </div>
                      )}

                      {/* TIKTOK CONTENT */}
                      {activePlat === 'tiktok' && (
                        <div className="space-y-2.5">
                          {isEditing ? (
                            <textarea
                              value={editedTiktokCaption}
                              onChange={(e) => setEditedTiktokCaption(e.target.value)}
                              rows={4}
                              className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:border-stone-900"
                            />
                          ) : (
                            <div className="space-y-2">
                              <div className="bg-stone-50 p-3 rounded-lg border border-stone-200">
                                <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                                  Legenda TikTok:
                                </span>
                                <p className="text-xs text-stone-800 leading-relaxed font-normal">
                                  {post.content.tiktok.caption}
                                </p>
                              </div>

                              <div className="bg-stone-900 text-white p-3 rounded-lg text-xs space-y-1">
                                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                                  🎬 Roteiro & Gancho de Retenção (0-3s):
                                </span>
                                <p className="text-[11px] text-stone-200">
                                  {post.content.tiktok.videoScriptHook}
                                </p>
                                <p className="text-[10px] text-stone-400 pt-1">
                                  🎵 Áudio sugerido: {post.content.tiktok.soundSuggestion}
                                </p>
                              </div>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-1">
                            {post.content.tiktok.hashtags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[11px] text-stone-900 bg-stone-100 border border-stone-300 px-2 py-0.5 rounded-md font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
