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
} from './types';
import {
  fetchChurchStore,
  syncWithServer,
  getViewedAgendaIds,
  markAllAgendaEventsViewed,
  resetAllTestData,
  loadDemoData,
} from './lib/dataService';
import { Header, ActiveTab } from './components/Header';
import { HomePage } from './components/HomePage';
import { AgendaSection } from './components/AgendaSection';
import { WorshipMinistry } from './components/WorshipMinistry';
import { MembersAndLeadership } from './components/MembersAndLeadership';
import { PastorDashboard } from './components/PastorDashboard';
import { CompanySettingsModal } from './components/CompanySettingsModal';
import { IEQFourColorBar } from './components/IEQLogo';

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <div className="text-sm font-bold text-slate-800">
            Carregando Sistema IEQ VILA ANDREZA...
          </div>
          <div className="text-xs text-slate-500">
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
    // Ao criar um novo evento na agenda, ele NÃO está em viewedAgendaIds,
    // fazendo o botão Agenda mudar de cor imediatamente até o membro visualizar!
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

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header
        churchSettings={store.church}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        unviewedAgendaCount={unviewedAgendaCount}
        onOpenChurchSettings={() => setIsSettingsModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
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
      </main>

      <footer className="bg-white border-t border-slate-200 mt-12">
        <IEQFourColorBar className="h-1 w-full" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            <strong className="text-slate-800">{store.church.name}</strong> · {store.church.subtitle}
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsSettingsModalOpen(true)}
              className="hover:text-slate-900 underline cursor-pointer"
            >
              Configurar Igreja & Dados
            </button>
          </div>
        </div>
      </footer>

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
