import type {
  ChurchSettings,
  AgendaEvent,
  WorshipMusician,
  WorshipScale,
  WorshipSong,
  ChurchMember,
  LeadershipMember,
  ChurchVisitor,
  ServiceAttendanceRecord,
  ChurchStoreData,
  ScaleAssignment,
  WorshipInstrumentRole,
} from '../types';
import {
  DEFAULT_CHURCH_SETTINGS,
  INITIAL_AGENDA_EVENTS,
  INITIAL_WORSHIP_MUSICIANS,
  INITIAL_WORSHIP_SCALES,
  INITIAL_WORSHIP_SONGS,
  DEMO_MEMBERS,
  DEMO_LEADERSHIP,
  DEMO_VISITORS,
  DEMO_SERVICE_RECORDS,
  DEFAULT_SOCIAL_AGENT_CONFIG,
  DEMO_SOCIAL_POSTS,
} from './initialData';
import { getSupabase } from './supabase';

const STORAGE_KEYS = {
  STORE: 'IEQ_VILA_ANDREZA_STORE_V1',
  VIEWED_AGENDA_IDS: 'IEQ_VILA_ANDREZA_VIEWED_AGENDA_V1',
};

const DEFAULT_STORE: ChurchStoreData = {
  church: DEFAULT_CHURCH_SETTINGS,
  agenda: INITIAL_AGENDA_EVENTS,
  worshipMusicians: INITIAL_WORSHIP_MUSICIANS,
  worshipScales: INITIAL_WORSHIP_SCALES,
  worshipSongs: INITIAL_WORSHIP_SONGS,
  members: DEMO_MEMBERS,
  leadership: DEMO_LEADERSHIP,
  visitors: DEMO_VISITORS,
  serviceRecords: DEMO_SERVICE_RECORDS,
  socialPosts: DEMO_SOCIAL_POSTS,
  socialAgentConfig: DEFAULT_SOCIAL_AGENT_CONFIG,
};

export function getLocalStore(): ChurchStoreData {
  if (typeof window === 'undefined') return DEFAULT_STORE;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STORE);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.STORE, JSON.stringify(DEFAULT_STORE));
      return DEFAULT_STORE;
    }
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_STORE,
      ...parsed,
      church: { ...DEFAULT_CHURCH_SETTINGS, ...(parsed.church || {}) },
      socialPosts: parsed.socialPosts || DEMO_SOCIAL_POSTS,
      socialAgentConfig: {
        ...DEFAULT_SOCIAL_AGENT_CONFIG,
        ...(parsed.socialAgentConfig || {}),
      },
    };
  } catch {
    return DEFAULT_STORE;
  }
}

export function saveLocalStore(data: ChurchStoreData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.STORE, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving to localStorage:', e);
  }
}

/**
 * Sincroniza automaticamente com:
 * 1) LocalStorage (instantâneo)
 * 2) Supabase PostgreSQL (se conectado em nuvem)
 * 3) Servidor API local / Express
 */
export async function syncWithServer(data: ChurchStoreData): Promise<void> {
  saveLocalStore(data);

  // 1) Se Supabase estiver configurado, sincroniza o estado na nuvem automaticamente
  const supabase = getSupabase();
  if (supabase) {
    try {
      await (supabase.from('igreja_store') as any).upsert({
        id: 'ieq_vila_andreza_main',
        payload: data as any,
        atualizado_em: new Date().toISOString(),
      });
    } catch {
      // ignora silenciosamente caso a tabela igreja_store ainda não tenha sido criada
    }
  }

  // 2) Sincroniza com servidor local Express (se rodando em Node)
  try {
    await fetch('/api/church/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch {
    // Fallback to localStorage on Vercel static
  }
}

export async function fetchChurchStore(): Promise<ChurchStoreData> {
  // 1) Se Supabase estiver configurado, busca primeiro o estado mais recente na nuvem
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data: cloudRow, error } = await (supabase.from('igreja_store') as any)
        .select('payload')
        .eq('id', 'ieq_vila_andreza_main')
        .maybeSingle();

      if (!error && cloudRow && cloudRow.payload && cloudRow.payload.church) {
        const mergedCloud: ChurchStoreData = {
          ...DEFAULT_STORE,
          ...cloudRow.payload,
          church: { ...DEFAULT_CHURCH_SETTINGS, ...(cloudRow.payload.church || {}) },
        };
        saveLocalStore(mergedCloud);
        return mergedCloud;
      }
    } catch {
      // Continua para servidor/localStorage
    }
  }

  // 2) Tenta servidor Express
  try {
    const res = await fetch('/api/church/store');
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const serverData = await res.json();
      if (serverData && serverData.church) {
        const localRaw =
          typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.STORE) : null;
        if (localRaw) {
          return getLocalStore();
        }
        saveLocalStore(serverData);
        return serverData;
      }
    }
  } catch {
    // ignore network error and use local store
  }
  return getLocalStore();
}

// ===================== AGENDA VIEWED / UNVIEWED TRACKING =====================
export function getViewedAgendaIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.VIEWED_AGENDA_IDS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getUnviewedAgendaEvents(agenda: AgendaEvent[]): AgendaEvent[] {
  const viewedIds = getViewedAgendaIds();
  return agenda.filter((ev) => !viewedIds.includes(ev.id));
}

export function markAllAgendaEventsViewed(agenda: AgendaEvent[]): void {
  if (typeof window === 'undefined') return;
  const allIds = agenda.map((ev) => ev.id);
  localStorage.setItem(STORAGE_KEYS.VIEWED_AGENDA_IDS, JSON.stringify(allIds));
}

// ===================== FAIR WORSHIP SCALE ALGORITHM (EQUIDADE + 3 DIAS) =====================
export function generateFairAssignments(
  musicians: WorshipMusician[],
  rolesToFill: WorshipInstrumentRole[] = [
    'ministro_louvor',
    'backing_vocal',
    'violao',
    'teclado',
    'baixo',
    'bateria',
    'projecao',
  ]
): { assignments: ScaleAssignment[]; updatedMusicians: WorshipMusician[] } {
  const now = new Date();
  const assignedAt = now.toISOString();
  const deadlineAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();

  const musiciansCopy = musicians.map((m) => ({ ...m }));
  const chosenIds = new Set<string>();
  const assignments: ScaleAssignment[] = [];

  for (const role of rolesToFill) {
    const candidates = musiciansCopy
      .filter((m) => m.active && m.instrument === role && !chosenIds.has(m.id))
      .sort((a, b) => {
        if (a.participationsCount !== b.participationsCount) {
          return a.participationsCount - b.participationsCount;
        }
        const dateA = a.lastScheduledDate || '2000-01-01';
        const dateB = b.lastScheduledDate || '2000-01-01';
        return dateA.localeCompare(dateB);
      });

    if (candidates.length > 0) {
      const selected = candidates[0];
      chosenIds.add(selected.id);
      selected.participationsCount += 1;
      selected.lastScheduledDate = now.toISOString().split('T')[0];

      assignments.push({
        musicianId: selected.id,
        musicianName: selected.name,
        musicianPhone: selected.phone,
        instrument: selected.instrument,
        instrumentLabel: selected.instrumentLabel,
        status: 'pendente',
        assignedAt,
        deadlineAt,
      });
    }
  }

  return { assignments, updatedMusicians: musiciansCopy };
}

export function findFairReplacementMusician(
  musicians: WorshipMusician[],
  instrument: WorshipInstrumentRole,
  excludeMusicianIds: string[]
): WorshipMusician | null {
  const candidates = musicians
    .filter((m) => m.active && m.instrument === instrument && !excludeMusicianIds.includes(m.id))
    .sort((a, b) => a.participationsCount - b.participationsCount);

  return candidates[0] || null;
}

export function getConfirmationDeadlineStatus(
  deadlineAt: string,
  status: 'pendente' | 'confirmado' | 'recusado'
): {
  isExpired: boolean;
  daysLeft: number;
  hoursLeft: number;
  label: string;
} {
  if (status === 'confirmado') {
    return { isExpired: false, daysLeft: 3, hoursLeft: 72, label: 'Confirmado' };
  }
  if (status === 'recusado') {
    return { isExpired: true, daysLeft: 0, hoursLeft: 0, label: 'Recusou Escala' };
  }

  const nowMs = Date.now();
  const deadlineMs = new Date(deadlineAt).getTime();
  const diffMs = deadlineMs - nowMs;

  if (diffMs <= 0) {
    return {
      isExpired: true,
      daysLeft: 0,
      hoursLeft: 0,
      label: 'Prazo de 3 dias expirado',
    };
  }

  const totalHours = Math.ceil(diffMs / (1000 * 60 * 60));
  const daysLeft = Math.floor(totalHours / 24);
  const remHours = totalHours % 24;

  const label =
    daysLeft > 0
      ? `${daysLeft}d ${remHours}h restantes para confirmar`
      : `${totalHours}h restantes para confirmar`;

  return {
    isExpired: false,
    daysLeft,
    hoursLeft: totalHours,
    label,
  };
}

// ===================== WHATSAPP DIRECT LINK BUILDER =====================
export function formatPhoneForWhatsApp(rawPhone: string): string {
  const digits = (rawPhone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('55') && digits.length >= 12) {
    return digits;
  }
  return `55${digits}`;
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = formatPhoneForWhatsApp(phone);
  const encodedMsg = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
}

// ===================== RESET / CLEAR DATA & DEMO SEED =====================
export async function resetAllTestData(): Promise<ChurchStoreData> {
  const current = getLocalStore();
  const cleanStore: ChurchStoreData = {
    church: current.church,
    agenda: [],
    worshipMusicians: [],
    worshipScales: [],
    worshipSongs: INITIAL_WORSHIP_SONGS,
    members: [],
    leadership: [],
    visitors: [],
    serviceRecords: [],
    socialPosts: [],
    socialAgentConfig: current.socialAgentConfig || DEFAULT_SOCIAL_AGENT_CONFIG,
    supabaseConfig: current.supabaseConfig,
  };
  await syncWithServer(cleanStore);
  return cleanStore;
}

export async function loadDemoData(): Promise<ChurchStoreData> {
  const current = getLocalStore();
  const demoStore: ChurchStoreData = {
    ...DEFAULT_STORE,
    church: current.church,
    supabaseConfig: current.supabaseConfig,
  };
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEYS.VIEWED_AGENDA_IDS);
  }
  await syncWithServer(demoStore);
  return demoStore;
}

export async function seedDemoDataToSupabase(): Promise<{ success: boolean; message: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    return {
      success: false,
      message: 'Configure e salve a URL e Anon Key do Supabase primeiro no Passo 2.',
    };
  }

  try {
    const store = getLocalStore();

    // 1. Sincroniza o estado completo na tabela igreja_store
    await (supabase.from('igreja_store') as any).upsert({
      id: 'ieq_vila_andreza_main',
      payload: store as any,
      atualizado_em: new Date().toISOString(),
    });

    // 2. Sincroniza membros
    if (store.members.length > 0) {
      await (supabase.from('membros') as any).insert(
        store.members.map((m) => ({
          nome: m.name,
          endereco: m.address,
          bairro: m.neighborhood,
          cidade: m.city,
          telefone: m.phone,
          batizado: m.baptized,
          status: m.status,
          observacoes: m.notes || null,
        }))
      );
    }

    // 3. Sincroniza liderança
    if (store.leadership.length > 0) {
      await (supabase.from('lideranca') as any).insert(
        store.leadership.map((l) => ({
          nome: l.name,
          cargo: l.roleTitle,
          ministerio: (l as any).department || (l as any).ministry || 'Geral',
          telefone: l.phone,
          endereco: l.address,
          desde: l.since || null,
        }))
      );
    }

    // 4. Sincroniza visitantes
    if (store.visitors.length > 0) {
      await (supabase.from('visitantes') as any).insert(
        store.visitors.map((v) => ({
          nome: v.name,
          telefone: v.phone,
          endereco: v.address || null,
          data_visita: v.visitDate,
          culto: v.serviceName,
          convidado_por: v.invitedBy || null,
          pedido_oracao: v.prayerRequest || null,
          status_acompanhamento: v.followUpStatus,
        }))
      );
    }

    // 5. Sincroniza frequência de cultos
    if (store.serviceRecords.length > 0) {
      await (supabase.from('cultos_frequencia') as any).insert(
        store.serviceRecords.map((s) => ({
          data_culto: s.date,
          nome_culto: s.serviceName,
          total_presentes: s.totalAttendance,
          membros_presentes: s.membersCount,
          visitantes_presentes: s.visitorsCount,
          decisoes_conversoes: (s as any).decisionsCount || 0,
          pregador: s.preacher || null,
          observacoes: s.notes || null,
        }))
      );
    }

    return {
      success: true,
      message:
        'Todos os dados da IEQ Vila Andreza (Membros, Liderança, Visitantes, Cultos e Escalas) foram sincronizados na nuvem Supabase!',
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Erro ao enviar dados para o Supabase: ${err.message || 'Verifique se executou o script SQL no Passo 3.'}`,
    };
  }
}
