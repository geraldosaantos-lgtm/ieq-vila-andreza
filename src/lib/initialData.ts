import type {
  ChurchSettings,
  BibleVerse,
  AgendaEvent,
  WorshipMusician,
  WorshipScale,
  WorshipSong,
  ChurchMember,
  LeadershipMember,
  ChurchVisitor,
  ServiceAttendanceRecord,
} from '../types';

export const DEFAULT_CHURCH_SETTINGS: ChurchSettings = {
  name: 'IEQ VILA ANDREZA',
  subtitle: 'Igreja do Evangelho Quadrangular · Vila Andreza',
  pastorName: 'Pr. Geraldo Santos',
  pastorPhone: '11999990000',
  address: 'Rua Principal, Vila Andreza',
  city: 'Vila Andreza',
  whatsapp: '11999990000',
  instagram: '@ieqvilaandreza',
  logoUrl: '',
  motto: 'Jesus Cristo é o mesmo ontem, e hoje, e eternamente. (Hebreus 13:8)',
  pastoralMessage: {
    title: 'Uma Semana de Fé, Comunhão e Milagres na Casa do Senhor',
    content:
      'Amada igreja IEQ Vila Andreza, que a graça e a paz do nosso Senhor Jesus Cristo estejam sobre cada lar! Nesta semana declaramos portas abertas, famílias restauradas e o derramar do Espírito Santo em nossos cultos. Não deixe de conferir nossa Agenda de Cultos e Ensaios. Você e sua família são parte essencial desta obra!',
    author: 'Pr. Geraldo Santos',
    authorRole: 'Pastor Titular · IEQ Vila Andreza',
    updatedAt: new Date().toISOString().split('T')[0],
  },
};

export const BIBLE_VERSES_COLLECTION: BibleVerse[] = [
  {
    id: 'verse-heb-13-8',
    reference: 'Hebreus 13:8',
    book: 'Hebreus',
    chapter: 13,
    verse: '8',
    text: 'Jesus Cristo é o mesmo, ontem, e hoje, e eternamente.',
    reflection:
      'Versículo tema do Evangelho Quadrangular: O mesmo Jesus que salvou, batizou, curou no passado continua operando hoje em nosso meio e voltará em glória.',
    theme: 'Lema Quadrangular',
    pillar: 'salvacao',
  },
  {
    id: 'verse-lucas-19-10',
    reference: 'Lucas 19:10',
    book: 'Lucas',
    chapter: 19,
    verse: '10',
    text: 'Porque o Filho do Homem veio buscar e salvar o que se havia perdido.',
    reflection:
      '1º Pilar Quadrangular (A Cruz - Cor Vermelha): O Evangelho de Lucas apresenta Jesus Cristo como o Salvador que entregou Sua vida na cruz para nos redimir.',
    theme: 'Jesus, o Salvador (A Cruz)',
    pillar: 'salvacao',
  },
  {
    id: 'verse-joao-1-33',
    reference: 'João 1:33',
    book: 'João',
    chapter: 1,
    verse: '33',
    text: 'Aquele sobre quem vires descer o Espírito, e sobre ele repousar, esse é o que batiza com o Espírito Santo.',
    reflection:
      '2º Pilar Quadrangular (A Pomba - Cor Amarela): O Evangelho de João revela Jesus como o Batizador com o Espírito Santo, revestindo a Igreja de poder e fogo do alto.',
    theme: 'Batismo no Espírito Santo (A Pomba)',
    pillar: 'espirito_santo',
  },
  {
    id: 'verse-marcos-16-17-18',
    reference: 'Marcos 16:17-18',
    book: 'Marcos',
    chapter: 16,
    verse: '17-18',
    text: 'E estes sinais seguirão aos que crerem: em meu nome expulsarão os demônios; falarão novas línguas; porão as mãos sobre os enfermos, e os curarão.',
    reflection:
      '3º Pilar Quadrangular (O Cálice - Cor Azul): O Evangelho de Marcos destaca Jesus Cristo como o Grande Médico que cura nossas dores e enfermidades.',
    theme: 'Cura Divina (O Cálice)',
    pillar: 'cura_divina',
  },
  {
    id: 'verse-mateus-24-30',
    reference: 'Mateus 24:30',
    book: 'Mateus',
    chapter: 24,
    verse: '30',
    text: 'Então aparecerá no céu o sinal do Filho do Homem; e verão o Filho do Homem, vindo sobre as nuvens do céu, com poder e grande glória.',
    reflection:
      '4º Pilar Quadrangular (A Coroa - Cor Roxa): O Evangelho de Mateus anuncia Jesus como o Rei que há de vir para buscar a Sua Igreja fiel.',
    theme: 'O Rei que Há de Vir (A Coroa)',
    pillar: 'segunda_vinda',
  },
  {
    id: 'verse-salmos-91-1-2',
    reference: 'Salmos 91:1-2',
    book: 'Salmos',
    chapter: 91,
    verse: '1-2',
    text: 'Aquele que habita no esconderijo do Altíssimo, à sombra do Onipotente descansará. Direi do Senhor: Ele é o meu Deus, o meu refúgio, a minha fortaleza, e nele confiarei.',
    reflection:
      'A proteção divina não está na ausência de lutas, mas na presença constante do Pai que guarda os Seus filhos debaixo de Suas asas.',
    theme: 'Proteção e Confiança',
    pillar: 'devocional',
  },
  {
    id: 'verse-salmos-23-1-4',
    reference: 'Salmos 23:1-4',
    book: 'Salmos',
    chapter: 23,
    verse: '1-4',
    text: 'O Senhor é o meu pastor, nada me faltará. Deitar-me faz em verdes pastos, guia-me mansamente a águas tranquilas. Refrigera a minha alma; guia-me pelas veredas da justiça, por amor do seu nome.',
    reflection:
      'Quando o Senhor é o nosso Pastor, temos descanso, direção e provisão em todas as estações da vida.',
    theme: 'Cuidado Pastoral de Deus',
    pillar: 'devocional',
  },
  {
    id: 'verse-isaias-41-10',
    reference: 'Isaías 41:10',
    book: 'Isaías',
    chapter: 41,
    verse: '10',
    text: 'Não temas, porque eu sou contigo; não te assombres, porque eu sou teu Deus; eu te fortaleço, e te ajudo, e te sustento com a destra da minha justiça.',
    reflection:
      'Deus renova o vigor daqueles que esperam Nele. Ele mesmo segura a sua mão direita e diz: Não temas!',
    theme: 'Força e Coragem',
    pillar: 'cura_divina',
  },
  {
    id: 'verse-romanos-8-28',
    reference: 'Romanos 8:28',
    book: 'Romanos',
    chapter: 8,
    verse: '28',
    text: 'E sabemos que todas as coisas contribuem juntamente para o bem daqueles que amam a Deus, daqueles que são chamados segundo o seu propósito.',
    reflection:
      'Nenhum capítulo da sua caminhada é desperdiçado quando sua vida está entregue ao propósito eterno do Senhor.',
    theme: 'Propósito Eterno',
    pillar: 'salvacao',
  },
  {
    id: 'verse-atos-1-8',
    reference: 'Atos 1:8',
    book: 'Atos',
    chapter: 1,
    verse: '8',
    text: 'Mas recebereis a virtude do Espírito Santo, que há de vir sobre vós; e ser-me-eis testemunhas, tanto em Jerusalém como em toda a Judeia e Samaria, e até aos confins da terra.',
    reflection:
      'O poder do Espírito Santo nos capacita para viver o evangelho vivo na Vila Andreza e anunciar a salvação a toda criatura.',
    theme: 'Avivamento e Missões',
    pillar: 'espirito_santo',
  },
];

export const INITIAL_AGENDA_EVENTS: AgendaEvent[] = [
  {
    id: 'ag-001',
    title: 'Culto da Família & Celebração Quadrangular',
    date: '2026-10-11',
    time: '19:00',
    category: 'culto',
    description: 'Grande noite de louvor, adoração e ministração da Palavra para toda a família na IEQ Vila Andreza.',
    location: 'Templo Principal - IEQ Vila Andreza',
    isNewAnnouncement: true,
    createdAt: '2026-10-08T10:00:00Z',
  },
  {
    id: 'ag-002',
    title: 'Quarta-Feira do Clamor & Cura Divina',
    date: '2026-10-14',
    time: '19:30',
    category: 'culto',
    description: 'Culto de oração forte, unção com óleo e intercessão pelas famílias e enfermos.',
    location: 'Templo Principal - IEQ Vila Andreza',
    isNewAnnouncement: true,
    createdAt: '2026-10-08T11:00:00Z',
  },
  {
    id: 'ag-003',
    title: 'Ensaio Geral do Ministério de Louvor',
    date: '2026-10-10',
    time: '18:00',
    category: 'ensaio',
    description: 'Passagem de som e ensaio dos louvores de domingo e Santa Ceia. Trazer fones de retorno.',
    location: 'Altar IEQ Vila Andreza',
    isNewAnnouncement: true,
    createdAt: '2026-10-08T12:00:00Z',
  },
];

export const INITIAL_WORSHIP_MUSICIANS: WorshipMusician[] = [
  {
    id: 'mus-001',
    name: 'Lucas Oliveira',
    phone: '11988112233',
    instrument: 'ministro_louvor',
    instrumentLabel: 'Ministro de Louvor (Voz)',
    participationsCount: 2,
    lastScheduledDate: '2026-09-27',
    active: true,
  },
  {
    id: 'mus-002',
    name: 'Rebeca Almeida',
    phone: '11988223344',
    instrument: 'ministro_louvor',
    instrumentLabel: 'Ministra de Louvor (Voz)',
    participationsCount: 1,
    lastScheduledDate: '2026-09-20',
    active: true,
  },
  {
    id: 'mus-003',
    name: 'Débora Nascimento',
    phone: '11988334455',
    instrument: 'backing_vocal',
    instrumentLabel: 'Backing Vocal',
    participationsCount: 1,
    lastScheduledDate: '2026-09-20',
    active: true,
  },
  {
    id: 'mus-004',
    name: 'Gabriel Martins',
    phone: '11988445566',
    instrument: 'backing_vocal',
    instrumentLabel: 'Backing Vocal',
    participationsCount: 2,
    lastScheduledDate: '2026-09-27',
    active: true,
  },
  {
    id: 'mus-005',
    name: 'Matheus Ribeiro',
    phone: '11988556677',
    instrument: 'violao',
    instrumentLabel: 'Violão',
    participationsCount: 1,
    lastScheduledDate: '2026-09-20',
    active: true,
  },
  {
    id: 'mus-006',
    name: 'Felipe Cardoso',
    phone: '11988667788',
    instrument: 'teclado',
    instrumentLabel: 'Teclado / Piano',
    participationsCount: 2,
    lastScheduledDate: '2026-09-27',
    active: true,
  },
  {
    id: 'mus-007',
    name: 'André Souza',
    phone: '11988778899',
    instrument: 'baixo',
    instrumentLabel: 'Contrabaixo',
    participationsCount: 1,
    lastScheduledDate: '2026-09-20',
    active: true,
  },
  {
    id: 'mus-008',
    name: 'Rafael Costa',
    phone: '11988889900',
    instrument: 'bateria',
    instrumentLabel: 'Bateria',
    participationsCount: 1,
    lastScheduledDate: '2026-09-20',
    active: true,
  },
  {
    id: 'mus-009',
    name: 'Tiago Mendes',
    phone: '11988990011',
    instrument: 'bateria',
    instrumentLabel: 'Bateria',
    participationsCount: 2,
    lastScheduledDate: '2026-09-27',
    active: true,
  },
  {
    id: 'mus-010',
    name: 'Daniela Ferreira',
    phone: '11987776655',
    instrument: 'projecao',
    instrumentLabel: 'Mídia & Projeção (Telão)',
    participationsCount: 1,
    lastScheduledDate: '2026-09-20',
    active: true,
  },
];

// Helper to create 3-day confirmation deadline from today
const nowIso = new Date().toISOString();
const threeDaysFromNowIso = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

export const INITIAL_WORSHIP_SCALES: WorshipScale[] = [
  {
    id: 'scale-001',
    title: 'Escala Culto da Família (Domingo à Noite)',
    eventType: 'culto',
    date: '2026-10-11',
    time: '18:30',
    location: 'Templo IEQ Vila Andreza',
    notes: 'Chegar 30 minutos antes para oração e passagem de som. Repertório na pasta de Domingo.',
    songIds: ['song-001', 'song-002', 'song-003'],
    assignments: [
      {
        musicianId: 'mus-002',
        musicianName: 'Rebeca Almeida',
        musicianPhone: '11988223344',
        instrument: 'ministro_louvor',
        instrumentLabel: 'Ministra de Louvor (Voz)',
        status: 'confirmado',
        assignedAt: nowIso,
        deadlineAt: threeDaysFromNowIso,
        confirmedAt: nowIso,
      },
      {
        musicianId: 'mus-003',
        musicianName: 'Débora Nascimento',
        musicianPhone: '11988334455',
        instrument: 'backing_vocal',
        instrumentLabel: 'Backing Vocal',
        status: 'pendente',
        assignedAt: nowIso,
        deadlineAt: threeDaysFromNowIso,
      },
      {
        musicianId: 'mus-005',
        musicianName: 'Matheus Ribeiro',
        musicianPhone: '11988556677',
        instrument: 'violao',
        instrumentLabel: 'Violão',
        status: 'pendente',
        assignedAt: nowIso,
        deadlineAt: threeDaysFromNowIso,
      },
      {
        musicianId: 'mus-006',
        musicianName: 'Felipe Cardoso',
        musicianPhone: '11988667788',
        instrument: 'teclado',
        instrumentLabel: 'Teclado / Piano',
        status: 'confirmado',
        assignedAt: nowIso,
        deadlineAt: threeDaysFromNowIso,
        confirmedAt: nowIso,
      },
      {
        musicianId: 'mus-007',
        musicianName: 'André Souza',
        musicianPhone: '11988778899',
        instrument: 'baixo',
        instrumentLabel: 'Contrabaixo',
        status: 'pendente',
        assignedAt: nowIso,
        deadlineAt: threeDaysFromNowIso,
      },
      {
        musicianId: 'mus-008',
        musicianName: 'Rafael Costa',
        musicianPhone: '11988889900',
        instrument: 'bateria',
        instrumentLabel: 'Bateria',
        status: 'pendente',
        assignedAt: nowIso,
        deadlineAt: threeDaysFromNowIso,
      },
      {
        musicianId: 'mus-010',
        musicianName: 'Daniela Ferreira',
        musicianPhone: '11987776655',
        instrument: 'projecao',
        instrumentLabel: 'Mídia & Projeção (Telão)',
        status: 'confirmado',
        assignedAt: nowIso,
        deadlineAt: threeDaysFromNowIso,
        confirmedAt: nowIso,
      },
    ],
    createdAt: nowIso,
  },
];

export const INITIAL_WORSHIP_SONGS: WorshipSong[] = [
  {
    id: 'song-001',
    title: 'Quão Grande é o Meu Deus',
    artist: 'Soraya Moraes / Hillsong',
    originalKey: 'G',
    bpm: 74,
    category: 'adoracao',
    folderName: 'Louvores de Domingo',
    chordProContent: `{Primeira Parte}
Com [G]esplendor de um Rei, em [Em7]majestade e luz
Faz a [C9]Terra se alegrar, faz a [D4]Terra se ale[D]grar
Ele [G]é a própria Luz, e as [Em7]trevas vão fugir
Tre[C9]mem com Sua voz, tre[D4]mem com Sua [D]voz

{Refrão}
Quão [G]grande é o meu Deus
Can[D/F#]tarei quão grande é o meu Deus
E [Em7]todos hão de ver
Quão [C9]grande é o [D]meu [G]Deus

{Segunda Parte}
Do [G]tempo Ele é o Senhor, e a [Em7]vida está em Suas mãos
Prin[C9]cípio e o Fim, Prin[D4]cípio e o [D]Fim
A [G]Trindade Santa é: o [Em7]Pai, o Filho e o Espírito
Cor[C9]deiro e o Leão, Cor[D4]deiro e o Le[D]ão

{Ponte}
Sobre [G]todo nome é o Seu
Tu és [Em7]digno do louvor
Eu can[C9]tarei quão grande [D]é o meu [G]Deus`,
    createdAt: '2026-10-01',
  },
  {
    id: 'song-002',
    title: 'Bondade de Deus',
    artist: 'Isaías Saad / Bethel Music',
    originalKey: 'A',
    bpm: 68,
    category: 'adoracao',
    folderName: 'Louvores de Domingo',
    chordProContent: `{Primeira Parte}
Te [A]amo, Deus, Tua [D]graça nunca [A]falha
Todos os [F#m7]dias eu es[E]tou em Tuas [D]mãos
Desde [F#m7]quando me le[D]vanto até me [A]deitar [E/G#] [F#m7]
Eu can[D]tarei da bon[E]dade de [A]Deus

{Refrão}
És fi[D]el em todo [A]tempo
És fi[D]el em todo [A]tempo [E/G#]
Com todo [F#m7]fôlego que [D]há em mim
Eu can[Bm7]tarei da bon[E]dade de [A]Deus

{Segunda Parte}
Tua [A]voz me guia em [D]meio ao fogo e [A]trevas
Tu és a[F#m7]migo mesmo [E]na tribula[D]ção
Conhe[F#m7]ci a Ti como [D]Pai e como a[A]migo [E/G#] [F#m7]
Eu vi[D]vi na bon[E]dade de [A]Deus

{Ponte}
Tua bon[A/C#]dade me se[D]guirá
Me se[E]guirá, Se[A]nhor
Tua bon[A/C#]dade me se[D]guirá
Me se[E]guirá, Se[A]nhor`,
    createdAt: '2026-10-02',
  },
  {
    id: 'song-003',
    title: 'Porque Ele Vive',
    artist: 'Harpa Cristã 545',
    originalKey: 'C',
    bpm: 76,
    category: 'santa_ceia',
    folderName: 'Santa Ceia & Comunhão',
    chordProContent: `{Primeira Parte}
Deus [C]enviou Seu Filho [F]amado
Para [C]morrer no meu lu[G7]gar
Na [C]cruz sofreu por meus pe[F]cados
Mas ressur[C]giu e [G7]vivo com o Pai es[C]tá

{Refrão}
Porque Ele [C]vive, posso [F]crer no amanhã
Porque Ele [C]vive, temor não [G7]há
Mas eu bem [C]sei, eu [C7]sei que a minha [F]vida
Está nas [C]mãos de meu Je[G7]sus, que vivo es[C]tá

{Segunda Parte}
E [C]quando, enfim, chegar a [F]hora
Em que a [C]morte enfren[G7]tarei
Sem [C]medo, então, terei vi[F]tória
Verei na [C]Glória o [G7]meu Jesus, que vivo es[C]tá`,
    createdAt: '2026-10-03',
  },
  {
    id: 'song-004',
    title: 'Santo Espírito (És Bem-Vindo Aqui)',
    artist: 'Laura Souguellis',
    originalKey: 'D',
    bpm: 70,
    category: 'avivamento',
    folderName: 'Culto de Quarta (Clamor)',
    chordProContent: `{Primeira Parte}
Não [D]há nada igual, não [G9]há nada melhor
A [Em7]que se compara à espe[A4]rança viva
Tua [D]presença, Se[G9]nhor

{Segunda Parte}
Eu [D]provei e vi o [G9]mais doce amor
Que [Em7]liberta o meu ser e a ver[A4]gonha desfaz
Tua [D]presença, Se[G9]nhor

{Refrão}
Santo Es[D]pírito, és bem-[G9]vindo aqui
Vem inun[Em7]dar, encher esse lu[A4]gar
É o de[D]sejo do meu cora[G9]ção
Sermos inun[Em7]dados por Tua [A4]glória, Se[D]nhor`,
    createdAt: '2026-10-04',
  },
];

// Cleanable / Restorable Demo Data
export const DEMO_MEMBERS: ChurchMember[] = [
  {
    id: 'mem-001',
    name: 'Carlos Eduardo Silva',
    address: 'Rua das Oliveiras, 142',
    neighborhood: 'Vila Andreza',
    city: 'São Paulo',
    phone: '11991112233',
    birthDate: '1984-05-14',
    baptized: true,
    status: 'ativo',
    cellGroup: 'Célula Betel',
    notes: 'Dizimista fiel, participa do Grupo Missionário de Homens.',
    createdAt: '2025-03-10',
  },
  {
    id: 'mem-002',
    name: 'Ana Paula Ferreira',
    address: 'Av. Esperança, 480, Apto 12',
    neighborhood: 'Vila Andreza',
    city: 'São Paulo',
    phone: '11992223344',
    birthDate: '1990-08-22',
    baptized: true,
    status: 'ativo',
    cellGroup: 'Célula Ágape',
    notes: 'Professora da Escola Bíblica Dominical Infantil.',
    createdAt: '2025-06-15',
  },
  {
    id: 'mem-003',
    name: 'Marcos Vinícius Lima',
    address: 'Rua Monte Sinai, 75',
    neighborhood: 'Vila Andreza',
    city: 'São Paulo',
    phone: '11993334455',
    birthDate: '2001-11-03',
    baptized: false,
    status: 'discipulado',
    cellGroup: 'Jovens Quadrangular',
    notes: 'Preparando-se para o próximo batismo nas águas.',
    createdAt: '2026-08-20',
  },
];

export const DEMO_LEADERSHIP: LeadershipMember[] = [
  {
    id: 'lid-001',
    name: 'Pr. Geraldo Santos',
    roleTitle: 'Pastor Titular',
    department: 'Conselho Diretor Local (CDL)',
    phone: '11999990000',
    address: 'Vila Andreza',
    since: '2020',
    createdAt: '2020-01-10',
  },
  {
    id: 'lid-002',
    name: 'Lucas Oliveira',
    roleTitle: 'Líder do Ministério de Louvor',
    department: 'Louvor & Adoração',
    phone: '11988112233',
    address: 'Vila Andreza',
    since: '2023',
    createdAt: '2023-02-15',
  },
  {
    id: 'lid-003',
    name: 'Diaconisa Marta Mendes',
    roleTitle: 'Coordenadora do Diaconato',
    department: 'Diaconato & Recepção',
    phone: '11994445566',
    address: 'Vila Andreza',
    since: '2022',
    createdAt: '2022-05-01',
  },
];

export const DEMO_VISITORS: ChurchVisitor[] = [
  {
    id: 'vis-001',
    name: 'Juliana Pereira',
    phone: '11995556677',
    address: 'Rua Nova Aliança, 88 - Vila Andreza',
    visitDate: '2026-10-04',
    serviceName: 'Culto da Família (Domingo)',
    invitedBy: 'Ana Paula Ferreira',
    prayerRequest: 'Oração pela saúde da família e porta de emprego.',
    followUpStatus: 'novo',
    createdAt: '2026-10-04',
  },
  {
    id: 'vis-002',
    name: 'Roberto Carlos Gomes',
    phone: '11996667788',
    address: 'Rua São João, 210 - Vila Andreza',
    visitDate: '2026-10-07',
    serviceName: 'Quarta-Feira da Cura Divina',
    invitedBy: 'Carlos Eduardo Silva',
    prayerRequest: 'Cura e restauração familiar.',
    followUpStatus: 'mensagem_enviada',
    createdAt: '2026-10-07',
  },
];

export const DEMO_SERVICE_RECORDS: ServiceAttendanceRecord[] = [
  {
    id: 'srv-001',
    date: '2026-10-04',
    serviceName: 'Culto da Família & Santa Ceia',
    preacher: 'Pr. Geraldo Santos',
    membersCount: 84,
    visitorsCount: 12,
    totalAttendance: 96,
    notes: 'Noite abençoada com 3 decisões por Cristo.',
    createdAt: '2026-10-04',
  },
  {
    id: 'srv-002',
    date: '2026-10-07',
    serviceName: 'Quarta-Feira do Clamor & Cura Divina',
    preacher: 'Pr. Geraldo Santos',
    membersCount: 58,
    visitorsCount: 7,
    totalAttendance: 65,
    notes: 'Forte mover de oração e testemunhos de cura.',
    createdAt: '2026-10-07',
  },
];
