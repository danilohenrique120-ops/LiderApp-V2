
import React from 'react';
import { 
  Home, 
  CheckSquare, 
  Sparkles, 
  Shield, 
  AlertTriangle, 
  Search, 
  Users, 
  Grid, 
  Target, 
  MessageSquare, 
  BookOpen, 
  UserCheck,
  LogOut
} from 'lucide-react';
import { LogoIcon } from '../constants';

interface SidebarProps {
  activeTab: string;
  onNavigate: (id: string) => void;
  onLogout: () => void;
  isMobile?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onNavigate, onLogout, isMobile }) => {
  const menuSections = [
    {
      label: "Gestão Tática",
      items: [
        { id: 'dashboard', label: 'Visão Geral', icon: Home },
        { id: 'todo', label: 'Agenda Operacional', icon: CheckSquare },
        { id: 'dds', label: 'DDS Inteligente', icon: Sparkles },
      ]
    },
    {
      label: "Segurança & Processos",
      items: [
        { id: 'compliance', label: 'Segurança & Procedimentos', icon: Shield },
        { id: 'human-error', label: 'Registro de Ocorrências', icon: AlertTriangle },
        { id: 'cause-analysis', label: 'Resolução de Problemas', icon: Search },
      ]
    },
    {
      label: "Liderança & Pessoas",
      items: [
        { id: 'operators', label: 'Minha Equipe', icon: Users },
        { id: 'matrix', label: 'Matriz de Polivalência', icon: Grid },
        { id: 'pdi', label: 'Plano de Carreira', icon: Target },
        { id: 'oneone', label: 'Feedbacks & 1:1', icon: MessageSquare },
      ]
    },
    {
      label: "Ferramentas",
      items: [
        { id: 'training', label: 'Capacitação', icon: BookOpen },
        { id: 'roleplay', label: 'Treino de Liderança', icon: UserCheck },
      ]
    }
  ];

  return (
    <div className={`h-full flex flex-col bg-slate-900 ${isMobile ? 'p-6' : 'p-8'} overflow-y-auto custom-scrollbar`}>
      {/* HEADER LOGO - Expandido para formato horizontal dos elos */}
      <div className="flex flex-col gap-4 mb-14 px-1">
        <div className="w-28 h-14 bg-white rounded-2xl flex items-center justify-center shadow-[0_15px_40px_rgba(0,0,0,0.4)] p-1.5 shrink-0 transition-transform hover:scale-105 active:scale-95">
          <LogoIcon />
        </div>
        <div>
          <h1 className="text-white text-lg font-black uppercase tracking-[0.2em] leading-none">
            Sistema <span className="text-blue-500">Líder</span>
          </h1>
          <span className="text-[9px] text-slate-500 font-black uppercase tracking-[0.3em] mt-2 block">
            Industrial SaaS 4.0
          </span>
        </div>
      </div>

      {/* NAVIGATION SECTIONS */}
      <nav className="flex-1 space-y-8">
        {menuSections.map((section) => (
          <div key={section.label}>
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-2">
              {section.label}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all text-left group relative ${
                      isActive 
                        ? 'bg-blue-600/10 text-blue-400 border-l-4 border-blue-500 rounded-l-none' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <item.icon size={18} className={isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'} />
                    <span className="text-sm font-medium tracking-tight">
                      {item.label}
                    </span>
                    {isActive && (
                      <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* FOOTER ACTIONS */}
      <div className="mt-12 pt-6 border-t border-slate-800">
        <button 
          onClick={onLogout} 
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-all font-bold text-sm"
        >
          <LogOut size={18} />
          Sair do Sistema
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
