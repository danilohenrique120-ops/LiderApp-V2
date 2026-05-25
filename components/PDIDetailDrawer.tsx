
import React from 'react';
import { X, List, PencilLine } from 'lucide-react';
import { PDI } from '../types';
import PDIJourneyView from './PDIJourneyView';

interface PDIDetailDrawerProps {
  pdi: PDI | null;
  onClose: () => void;
  onEdit: (pdi: PDI) => void;
  onDelete: (id: string) => void;
  onToggleGoal: (pdiId: string, goalId: string) => void;
  exportPdf: (id: string, name: string) => void;
}

const PDIDetailDrawer: React.FC<PDIDetailDrawerProps> = ({ pdi, onClose, onEdit, onDelete, onToggleGoal, exportPdf }) => {
  if (!pdi) return null;

  return (
    <>
      {/* Overlay com Blur */}
      <div 
        className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md animate-fade"
        onClick={onClose}
      />
      
      {/* Painel Lateral Expandido */}
      <div className="fixed top-0 right-0 z-[110] h-full w-full md:w-3/4 lg:w-2/3 xl:w-3/5 max-w-6xl bg-slate-50 shadow-2xl transition-transform transform translate-x-0 flex flex-col animate-slide-in">
        
        {/* Header Fixo do Drawer */}
        <div className="p-6 border-b bg-white flex justify-between items-center shadow-sm relative z-20">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100">
              <List size={22} />
            </div>
            <div>
              <h3 className="font-black text-slate-800 uppercase tracking-tight text-xl leading-none">Jornada de Carreira</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Visão Detalhada do Colaborador</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onEdit(pdi)}
              className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all shadow-md"
            >
              <PencilLine size={16} /> Editar Plano
            </button>
            <div className="w-px h-8 bg-slate-100 mx-2" />
            <button 
              onClick={onClose}
              className="p-3 bg-slate-100 text-slate-400 hover:text-red-500 rounded-2xl transition-all"
            >
              <X size={24} />
            </button>
          </div>
        </div>
        
        {/* Corpo com Scroll Independente */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-10 bg-slate-50">
          <div className="max-w-4xl mx-auto pb-20">
            <PDIJourneyView 
              pdi={pdi}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleGoal={onToggleGoal}
              exportPdf={exportPdf}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in { animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
      `}</style>
    </>
  );
};

export default PDIDetailDrawer;
