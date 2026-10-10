export type UserRole = 'pastor' | 'lider_louvor' | 'membro';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  cargo?: string;
}

export interface PastoralMessage {
  title: string;
  content: string;
  author: string;
  authorRole: string;
  updatedAt: string;
}

export interface ChurchSettings {
  name: string;
  subtitle: string;
  pastorName: string;
  pastorPhone: string;
  address: string;
  city: string;
  whatsapp: string;
  instagram?: string;
  logoUrl?: string;
  motto: string;
  pastoralMessage: PastoralMessage;
}

export type QuadrangularPillar =
  | 'salvacao'
  | 'espirito_santo'
  | 'cura_divina'
  | 'segunda_vinda'
  | 'devocional';

export interface BibleVerse {
  id: string;
  reference: string;
  book: string;
  chapter: number;
  verse: string;
  text: string;
  reflection: string;
  theme: string;
  pillar: QuadrangularPillar;
}

export type AgendaCategory = 'culto' | 'ensaio' | 'evento' | 'santa_ceia' | 'aviso' | 'reuniao';

export interface AgendaEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  category: AgendaCategory;
  description: string;
  location: string;
  isNewAnnouncement?: boolean;
  createdAt: string;
}

export type WorshipInstrumentRole =
  | 'ministro_louvor'
  | 'backing_vocal'
  | 'violao'
  | 'guitarra'
  | 'baixo'
  | 'bateria'
  | 'teclado'
  | 'sonoplastia'
  | 'projecao';

export interface WorshipMusician {
  id: string;
  name: string;
  phone: string;
  instrument: WorshipInstrumentRole;
  instrumentLabel: string;
  participationsCount: number;
  lastScheduledDate?: string;
  active: boolean;
}

export type ConfirmationStatus = 'pendente' | 'confirmado' | 'recusado';

export interface ScaleAssignment {
  musicianId: string;
  musicianName: string;
  musicianPhone: string;
  instrument: WorshipInstrumentRole;
  instrumentLabel: string;
  status: ConfirmationStatus;
  assignedAt: string;
  deadlineAt: string; // 3 days from assignedAt
  confirmedAt?: string;
}

export interface WorshipScale {
  id: string;
  title: string;
  eventType: 'culto' | 'ensaio';
  date: string;
  time: string;
  location: string;
  notes: string;
  songIds: string[];
  assignments: ScaleAssignment[];
  createdAt: string;
}

export interface WorshipSong {
  id: string;
  title: string;
  artist: string;
  originalKey: string;
  bpm: number;
  category: 'adoracao' | 'celebracao' | 'santa_ceia' | 'avivamento' | ' clamor';
  folderName: string;
  // Text formatted with inline chords in brackets e.g. "[G]Quão grande [D/F#]é o meu [Em7]Deus"
  chordProContent: string;
  notes?: string;
  createdAt: string;
}

export interface ChurchMember {
  id: string;
  name: string;
  address: string;
  neighborhood: string;
  city: string;
  phone: string;
  birthDate?: string;
  baptized: boolean;
  status: 'ativo' | 'discipulado' | 'afastado';
  cellGroup?: string;
  notes?: string;
  createdAt: string;
}

export interface LeadershipMember {
  id: string;
  name: string;
  roleTitle: string; // Cargo ocupado (Pastor Titular, Diácono, Líder GMJ, etc.)
  department: string; // Diaconato, Ministério de Louvor, Grupo Missionário de Mulheres, etc.
  phone: string;
  address?: string;
  since?: string;
  createdAt: string;
}

export interface ChurchVisitor {
  id: string;
  name: string;
  phone: string;
  address?: string;
  visitDate: string;
  serviceName: string;
  invitedBy?: string;
  prayerRequest?: string;
  followUpStatus: 'novo' | 'mensagem_enviada' | 'em_acompanhamento' | 'integrado';
  createdAt: string;
}

export interface ServiceAttendanceRecord {
  id: string;
  date: string;
  serviceName: string;
  preacher: string;
  membersCount: number;
  visitorsCount: number;
  totalAttendance: number;
  offeringNotes?: string;
  notes?: string;
  createdAt: string;
}

export interface ChurchStoreData {
  church: ChurchSettings;
  agenda: AgendaEvent[];
  worshipMusicians: WorshipMusician[];
  worshipScales: WorshipScale[];
  worshipSongs: WorshipSong[];
  members: ChurchMember[];
  leadership: LeadershipMember[];
  visitors: ChurchVisitor[];
  serviceRecords: ServiceAttendanceRecord[];
  supabaseConfig?: {
    url: string;
    anonKey: string;
    connected: boolean;
  };
}
