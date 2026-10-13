import React from 'react';
import {
  Calendar,
  Music,
  Users,
  Shield,
  Home,
  Settings,
  Sparkles,
  Share2,
} from 'lucide-react';
import type { ChurchSettings } from '../types';
import { IEQLogo, IEQFourColorBar } from './IEQLogo';

export type ActiveTab = 'home' | 'agenda' | 'worship' | 'members' | 'pastor' | 'post';

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
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200/90 shadow-2xs">
      <IEQFourColorBar className="h-1.5 w-full" />

      <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-2.5 sm:py-3 gap-2.5">
          {/* Brand Identity */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => onSelectTab('home')}
              className="flex items-center gap-2.5 sm:gap-3 text-left group focus:outline-none cursor-pointer"
            >
              <IEQLogo logoUrl={churchSettings.logoUrl} size="md" />
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-sm sm:text-base md:text-lg font-extrabold tracking-tight text-stone-900 group-hover:text-red-700 transition-colors">
                    {churchSettings.name || 'IEQ VILA ANDREZA'}
                  </span>
                  <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-widest text-red-700">
                    Quadrangular
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-stone-500 font-medium leading-none mt-0.5">
                  {churchSettings.subtitle || 'Igreja do Evangelho Quadrangular'} ·{' '}
                  <span className="text-stone-700 font-semibold">{churchSettings.pastorName}</span>
                </p>
              </div>
            </button>

            {/* Quick config button for Mobile Header */}
            <div className="flex items-center gap-1.5 md:hidden">
              <button
                onClick={onOpenChurchSettings}
                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors cursor-pointer"
                title="Configurar Dados da Igreja"
              >
                <Settings className="w-3.5 h-3.5 text-stone-600" />
                <span className="text-[11px]">Configurar</span>
              </button>
            </div>
          </div>

          {/* Primary Navigation - Refined compact buttons with IEQ palette */}
          <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto pb-1 md:pb-0 no-scrollbar scroll-smooth">
            {/* 1. Início & Bíblia */}
            <button
              onClick={() => onSelectTab('home')}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 active:scale-[0.98] cursor-pointer ${
                activeTab === 'home'
                  ? 'bg-stone-900 text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Início & Bíblia</span>
            </button>

            {/* 2. Agenda (Amarelo Ouro / Alerta IEQ) */}
            <button
              onClick={() => onSelectTab('agenda')}
              className={`relative inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-150 active:scale-[0.98] cursor-pointer ${
                hasNewAgenda
                  ? 'bg-amber-400 hover:bg-amber-300 text-stone-950 ring-2 ring-red-600 shadow-xs'
                  : activeTab === 'agenda'
                  ? 'bg-amber-500 text-stone-950 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
              title={
                hasNewAgenda
                  ? `${unviewedAgendaCount} novidade(s) na agenda! Clique para visualizar.`
                  : 'Agenda da Igreja'
              }
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Agenda</span>
              {hasNewAgenda && (
                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase tracking-wider bg-red-700 text-white">
                  {unviewedAgendaCount}
                </span>
              )}
            </button>

            {/* 3. Grupo de Louvor (Azul Celeste - Jesus Cura) */}
            <button
              onClick={() => onSelectTab('worship')}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 active:scale-[0.98] cursor-pointer ${
                activeTab === 'worship'
                  ? 'bg-sky-600 text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>Louvor</span>
            </button>

            {/* 4. Membros & Liderança (Roxo Imperial - Jesus o Rei) */}
            <button
              onClick={() => onSelectTab('members')}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 active:scale-[0.98] cursor-pointer ${
                activeTab === 'members'
                  ? 'bg-purple-700 text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Membros</span>
            </button>

            {/* 5. Área do Pastor (Vermelho Escarlate - Jesus Salva) */}
            <button
              onClick={() => onSelectTab('pastor')}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 active:scale-[0.98] cursor-pointer ${
                activeTab === 'pastor'
                  ? 'bg-red-700 text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Pastor</span>
            </button>

            {/* 6. NOVO: Aba Post com Agente Inteligente */}
            <button
              onClick={() => onSelectTab('post')}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-150 active:scale-[0.98] cursor-pointer ${
                activeTab === 'post'
                  ? 'bg-gradient-to-r from-red-600 via-purple-600 to-sky-600 text-white shadow-2xs ring-1 ring-purple-400'
                  : 'text-purple-700 hover:text-purple-900 hover:bg-purple-50 font-semibold'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Post & IA</span>
              <span className="hidden sm:inline-block text-[9px] uppercase px-1 py-0.2 rounded bg-purple-900/60 text-white font-extrabold">
                Redes
              </span>
            </button>

            <div className="hidden lg:block h-4 w-px bg-stone-200 mx-1" />

            {/* Configurar Igreja (Desktop) */}
            <button
              onClick={onOpenChurchSettings}
              className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-200 transition-colors cursor-pointer"
              title="Configurar Dados da Igreja, Logo e Limpar Dados"
            >
              <Settings className="w-3.5 h-3.5 text-stone-600" />
              <span>Configurar</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
