import React, { useState, useEffect } from 'react';
import type {
  ChurchStoreData,
  ChurchSettings,
  AgendaEvent,
  WorshipMusician,
  WorshipScale,
  WorshipSong,
  ChurchMember,
  LeadershipMember,
  ChurchVisitor,
  ServiceAttendanceRecord,
  SocialPostItem,
  SocialAgentConfig,
} from './types';
import {
  fetchChurchStore,
  syncWithServer,
  getViewedAgendaIds,
  markAllAgendaEventsViewed,
  resetAllTestData,
  loadDemoData,
} from './lib/dataService';
import { DEFAULT_SOCIAL_AGENT_CONFIG } from './lib/initialData';
import { Header, ActiveTab } from './components/Header';
import { HomePage } from './components/HomePage';
import { AgendaSection } from './components/AgendaSection';
import { WorshipMinistry } from './components/WorshipMinistry';
import { MembersAndLeadership } from './components/MembersAndLeadership';
import { PastorDashboard } from './components/PastorDashboard';
import { SocialAgentSection } from './components/SocialAgentSection';
import { CompanySettingsModal } from './components/CompanySettingsModal';
import { IEQFourColorBar } from './components/IEQLogo';
import {
  Home,
  Calendar,
  Music,
  Users,
  Shield,
  Sparkles,
} from 'lucide-react';

export function App() {
  const [store, setStore] = useState<ChurchStoreData | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [viewedAgendaIds, setViewedAgendaIds] = useState<string[]>(() => getViewedAgendaIds());
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    fetchChurchStore().then((data) => {
      setStore(data);
    });
  }, []);

  if (!store) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <div className="text-sm font-bold text-stone-800">
            Carregando Sistema IEQ VILA ANDREZA...
          </div>
          <div className="text-xs text-stone-500">
            Igreja do Evangelho Quadrangular
          </div>
        </div>
      </div>
    );
  }

  const unviewedAgendaCount = store.agenda.filter(
    (ev) => !viewedAgendaIds.includes(ev.id)
  ).length;

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    // Quando o membro abre a Agenda, marca as novidades atuais como visualizadas
    if (tab === 'agenda') {
      markAllAgendaEventsViewed(store.agenda);
      setViewedAgendaIds(store.agenda.map((ev) => ev.id));
    }
  };

  const updateStore = (nextStore: ChurchStoreData) => {
    setStore(nextStore);
    syncWithServer(nextStore);
  };

  // --- Pastoral Message Update ---
  const handleUpdatePastoralMessage = (title: string, content: string, author: string) => {
    const nextStore: ChurchStoreData = {
      ...store,
      church: {
        ...store.church,
        pastoralMessage: {
          ...store.church.pastoralMessage,
          title,
          content,
          author,
          updatedAt: new Date().toISOString().split('T')[0],
        },
      },
    };
    updateStore(nextStore);
  };

  // --- Church Settings Update ---
  const handleSaveChurchSettings = (settings: ChurchSettings) => {
    updateStore({
      ...store,
      church: settings,
    });
  };

  // --- Agenda Handlers ---
  const handleAddAgendaEvent = (eventData: Omit<AgendaEvent, 'id' | 'createdAt'>) => {
    const newEvent: AgendaEvent = {
      ...eventData,
      id: `ag-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    updateStore({
      ...store,
      agenda: [newEvent, ...store.agenda],
    });
  };

  const handleDeleteAgendaEvent = (id: string) => {
    updateStore({
      ...store,
      agenda: store.agenda.filter((ev) => ev.id !== id),
    });
  };

  const handleMarkAllAgendaViewed = () => {
    markAllAgendaEventsViewed(store.agenda);
    setViewedAgendaIds(store.agenda.map((ev) => ev.id));
  };

  // --- Worship Ministry Handlers ---
  const handleUpdateMusiciansAndScales = (
    musicians: WorshipMusician[],
    scales: WorshipScale[]
  ) => {
    updateStore({
      ...store,
      worshipMusicians: musicians,
      worshipScales: scales,
    });
  };

  const handleAddWorshipSong = (songData: Omit<WorshipSong, 'id' | 'createdAt'>) => {
    const newSong: WorshipSong = {
      ...songData,
      id: `song-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    updateStore({
      ...store,
      worshipSongs: [newSong, ...store.worshipSongs],
    });
  };

  const handleDeleteWorshipSong = (id: string) => {
    updateStore({
      ...store,
      worshipSongs: store.worshipSongs.filter((s) => s.id !== id),
    });
  };

  // --- Members & Leadership Handlers ---
  const handleAddMember = (memberData: Omit<ChurchMember, 'id' | 'createdAt'>) => {
    const newMember: ChurchMember = {
      ...memberData,
      id: `mem-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    updateStore({
      ...store,
      members: [newMember, ...store.members],
    });
  };

  const handleDeleteMember = (id: string) => {
    updateStore({
      ...store,
      members: store.members.filter((m) => m.id !== id),
    });
  };

  const handleAddLeadership = (leaderData: Omit<LeadershipMember, 'id' | 'createdAt'>) => {
    const newLeader: LeadershipMember = {
      ...leaderData,
      id: `lid-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    updateStore({
      ...store,
      leadership: [newLeader, ...store.leadership],
    });
  };

  const handleDeleteLeadership = (id: string) => {
    updateStore({
      ...store,
      leadership: store.leadership.filter((l) => l.id !== id),
    });
  };

  // --- Pastor Area: Visitors & Attendance Handlers ---
  const handleAddVisitor = (visitorData: Omit<ChurchVisitor, 'id' | 'createdAt'>) => {
    const newVisitor: ChurchVisitor = {
      ...visitorData,
      id: `vis-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    updateStore({
      ...store,
      visitors: [newVisitor, ...store.visitors],
    });
  };

  const handleUpdateVisitorStatus = (
    id: string,
    status: ChurchVisitor['followUpStatus']
  ) => {
    updateStore({
      ...store,
      visitors: store.visitors.map((v) =>
        v.id === id ? { ...v, followUpStatus: status } : v
      ),
    });
  };

  const handleDeleteVisitor = (id: string) => {
    updateStore({
      ...store,
      visitors: store.visitors.filter((v) => v.id !== id),
    });
  };

  const handleAddServiceRecord = (
    recordData: Omit<ServiceAttendanceRecord, 'id' | 'createdAt'>
  ) => {
    const newRecord: ServiceAttendanceRecord = {
      ...recordData,
      id: `srv-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    updateStore({
      ...store,
      serviceRecords: [newRecord, ...store.serviceRecords],
    });
  };

  const handleDeleteServiceRecord = (id: string) => {
    updateStore({
      ...store,
      serviceRecords: store.serviceRecords.filter((r) => r.id !== id),
    });
  };

  // --- Social Media Agent Handlers ---
  const handleUpdateSocialPosts = (posts: SocialPostItem[]) => {
    updateStore({
      ...store,
      socialPosts: posts,
    });
  };

  const handleUpdateSocialConfig = (cfg: SocialAgentConfig) => {
    updateStore({
      ...store,
      socialAgentConfig: cfg,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50/70 text-stone-900 font-sans selection:bg-red-100 selection:text-red-900">
      <Header
        churchSettings={store.church}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        unviewedAgendaCount={unviewedAgendaCount}
        onOpenChurchSettings={() => setIsSettingsModalOpen(true)}
      />

      {/* Main Content Area - Responsive for Mobile & Notebook */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-7 pb-24 md:pb-10">
        {activeTab === 'home' && (
          <HomePage
            churchSettings={store.church}
            agenda={store.agenda}
            unviewedAgendaCount={unviewedAgendaCount}
            worshipScales={store.worshipScales}
            membersCount={store.members.length}
            visitorsCount={store.visitors.length}
            onNavigateTab={handleSelectTab}
            onUpdatePastoralMessage={handleUpdatePastoralMessage}
          />
        )}

        {activeTab === 'agenda' && (
          <AgendaSection
            churchSettings={store.church}
            agenda={store.agenda}
            viewedIds={viewedAgendaIds}
            onAddEvent={handleAddAgendaEvent}
            onDeleteEvent={handleDeleteAgendaEvent}
            onMarkAllViewed={handleMarkAllAgendaViewed}
          />
        )}

        {activeTab === 'worship' && (
          <WorshipMinistry
            churchSettings={store.church}
            musicians={store.worshipMusicians}
            scales={store.worshipScales}
            songs={store.worshipSongs}
            onUpdateMusiciansAndScales={handleUpdateMusiciansAndScales}
            onAddSong={handleAddWorshipSong}
            onDeleteSong={handleDeleteWorshipSong}
          />
        )}

        {activeTab === 'members' && (
          <MembersAndLeadership
            churchSettings={store.church}
            members={store.members}
            leadership={store.leadership}
            onAddMember={handleAddMember}
            onDeleteMember={handleDeleteMember}
            onAddLeadership={handleAddLeadership}
            onDeleteLeadership={handleDeleteLeadership}
          />
        )}

        {activeTab === 'pastor' && (
          <PastorDashboard
            churchSettings={store.church}
            members={store.members}
            leadership={store.leadership}
            visitors={store.visitors}
            serviceRecords={store.serviceRecords}
            worshipMusicians={store.worshipMusicians}
            worshipScales={store.worshipScales}
            agenda={store.agenda}
            onAddVisitor={handleAddVisitor}
            onUpdateVisitorStatus={handleUpdateVisitorStatus}
            onDeleteVisitor={handleDeleteVisitor}
            onAddServiceRecord={handleAddServiceRecord}
            onDeleteServiceRecord={handleDeleteServiceRecord}
          />
        )}

        {activeTab === 'post' && (
          <SocialAgentSection
            posts={store.socialPosts || []}
            config={store.socialAgentConfig || DEFAULT_SOCIAL_AGENT_CONFIG}
            churchName={store.church.name || 'IEQ Vila Andreza'}
            pastorName={store.church.pastorName || 'Pr. Geraldo Santos'}
            onUpdatePosts={handleUpdateSocialPosts}
            onUpdateConfig={handleUpdateSocialConfig}
          />
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-stone-200 mt-auto">
        <IEQFourColorBar className="h-1.5 w-full" />
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
          <div>
            <strong className="text-stone-800">{store.church.name}</strong> · {store.church.subtitle}
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsSettingsModalOpen(true)}
              className="text-stone-600 hover:text-stone-900 underline cursor-pointer text-xs"
            >
              Configurar Igreja & Dados
            </button>
          </div>
        </div>
      </footer>

      {/* MOBILE BOTTOM NAVIGATION BAR (Smartphones) - Ultra-convenient one-thumb navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/90 px-1.5 py-1 flex items-center justify-around shadow-lg">
        <button
          type="button"
          onClick={() => handleSelectTab('home')}
          className={`flex flex-col items-center justify-center p-1 rounded-lg text-[10px] font-semibold cursor-pointer transition-colors ${
            activeTab === 'home' ? 'text-stone-950 font-bold' : 'text-stone-500'
          }`}
        >
          <Home className={`w-4 h-4 ${activeTab === 'home' ? 'text-stone-950' : 'text-stone-400'}`} />
          <span>Início</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectTab('agenda')}
          className={`relative flex flex-col items-center justify-center p-1 rounded-lg text-[10px] font-semibold cursor-pointer transition-colors ${
            activeTab === 'agenda' ? 'text-amber-700 font-bold' : 'text-stone-500'
          }`}
        >
          <Calendar className={`w-4 h-4 ${activeTab === 'agenda' ? 'text-amber-600' : 'text-stone-400'}`} />
          <span>Agenda</span>
          {unviewedAgendaCount > 0 && (
            <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-red-600 ring-1 ring-white" />
          )}
        </button>

        <button
          type="button"
          onClick={() => handleSelectTab('worship')}
          className={`flex flex-col items-center justify-center p-1 rounded-lg text-[10px] font-semibold cursor-pointer transition-colors ${
            activeTab === 'worship' ? 'text-sky-700 font-bold' : 'text-stone-500'
          }`}
        >
          <Music className={`w-4 h-4 ${activeTab === 'worship' ? 'text-sky-600' : 'text-stone-400'}`} />
          <span>Louvor</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectTab('members')}
          className={`flex flex-col items-center justify-center p-1 rounded-lg text-[10px] font-semibold cursor-pointer transition-colors ${
            activeTab === 'members' ? 'text-purple-700 font-bold' : 'text-stone-500'
          }`}
        >
          <Users className={`w-4 h-4 ${activeTab === 'members' ? 'text-purple-700' : 'text-stone-400'}`} />
          <span>Membros</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectTab('pastor')}
          className={`flex flex-col items-center justify-center p-1 rounded-lg text-[10px] font-semibold cursor-pointer transition-colors ${
            activeTab === 'pastor' ? 'text-red-700 font-bold' : 'text-stone-500'
          }`}
        >
          <Shield className={`w-4 h-4 ${activeTab === 'pastor' ? 'text-red-700' : 'text-stone-400'}`} />
          <span>Pastor</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectTab('post')}
          className={`flex flex-col items-center justify-center p-1 rounded-lg text-[10px] font-semibold cursor-pointer transition-colors ${
            activeTab === 'post' ? 'text-purple-900 font-bold' : 'text-stone-500'
          }`}
        >
          <Sparkles className={`w-4 h-4 ${activeTab === 'post' ? 'text-purple-600' : 'text-stone-400'}`} />
          <span className="text-[10px]">Post IA</span>
        </button>
      </nav>

      <CompanySettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        churchSettings={store.church}
        onSaveSettings={handleSaveChurchSettings}
        onResetAllData={async () => {
          const clean = await resetAllTestData();
          setStore(clean);
        }}
        onLoadDemoData={async () => {
          const demo = await loadDemoData();
          setStore(demo);
          setViewedAgendaIds([]);
        }}
      />
    </div>
  );
}

export default App;
