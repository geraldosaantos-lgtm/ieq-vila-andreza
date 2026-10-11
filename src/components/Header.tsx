import React from 'react';
import { Calendar, Music, Users, Shield, Home, Settings } from 'lucide-react';
import type { ChurchSettings } from '../types';
import { IEQLogo, IEQFourColorBar } from './IEQLogo';

export type ActiveTab = 'home' | 'agenda' | 'worship' | 'members' | 'pastor';

interface HeaderProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  churchSettings: ChurchSettings;
  unviewedAgendaCount: number;
  onOpenChurchSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  churchSettings,
  unviewedAgendaCount,
  onOpenChurchSettings,
}) => {
  const hasNewAgenda = unviewedAgendaCount > 0;

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-stone-200 shadow-xs">
      <IEQFourColorBar />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-3">
          {/* Brand Identity */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => onSelectTab('home')}
              className="flex items-center gap-3 text-left group focus:outline-none cursor-pointer"
            >
              <IEQLogo logoUrl={churchSettings.logoUrl} size="md" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg font-extrabold tracking-tight text-stone-900 group-hover:text-red-700 transition-colors">
                    {churchSettings.name || 'IEQ VILA ANDREZA'}
                  </span>
                  <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-widest text-red-700">
                    Quadrangular
                  </span>
                </div>
                <p className="text-xs text-stone-500 font-medium">
                  {churchSettings.subtitle || 'Igreja do Evangelho Quadrangular'} ·{' '}
                  <span className="text-stone-700 font-semibold">{churchSettings.pastorName}</span>
                </p>
              </div>
            </button>

            <div className="flex items-center gap-1.5 md:hidden">
              <button
                onClick={onOpenChurchSettings}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors cursor-pointer"
                title="Configurar Dados da Igreja"
              >
                <Settings className="w-4 h-4 text-stone-600" />
                <span>Configurar</span>
              </button>
            </div>
          </div>

          {/* Primary Navigation */}
          <nav className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
            <button
              onClick={() => onSelectTab('home')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'home'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Início & Bíblia</span>
            </button>

            {/* Botão Agenda com Alerta de Novidades */}
            <button
              onClick={() => onSelectTab('agenda')}
              className={`relative inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                hasNewAgenda
                  ? 'bg-amber-400 hover:bg-amber-300 text-stone-950 shadow-sm ring-2 ring-red-600'
                  : activeTab === 'agenda'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
              title={
                hasNewAgenda
                  ? `${unviewedAgendaCount} novidade(s) na agenda! Clique para visualizar.`
                  : 'Agenda da Igreja'
              }
            >
              <Calendar className="w-4 h-4" />
              <span>Agenda</span>
              {hasNewAgenda && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-red-700 text-white">
                  {unviewedAgendaCount} {unviewedAgendaCount === 1 ? 'Novidade' : 'Novidades'}
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectTab('worship')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'worship'
                  ? 'bg-sky-700 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Music className="w-4 h-4" />
              <span>Grupo de Louvor</span>
            </button>

            <button
              onClick={() => onSelectTab('members')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'members'
                  ? 'bg-purple-800 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Membros & Liderança</span>
            </button>

            <button
              onClick={() => onSelectTab('pastor')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'pastor'
                  ? 'bg-red-700 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Área do Pastor</span>
            </button>

            <div className="hidden md:block h-5 w-px bg-stone-200 mx-1" />

            <button
              onClick={onOpenChurchSettings}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-200/80 transition-colors cursor-pointer"
              title="Configurar Dados da Igreja, Logo e Limpar Dados"
            >
              <Settings className="w-3.5 h-3.5 text-stone-600" />
              <span>Configurar Igreja</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
