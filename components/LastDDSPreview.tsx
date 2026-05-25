
import React from 'react';
import { Clock, FileText, Download, ChevronRight, Bookmark } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LastDDSPreviewProps {
  lastDds: {
    title: string;
    createdAt: Date;
    topic: string;
  } | null;
  onViewDetails: () => void;
}

const LastDDSPreview: React.FC<LastDDSPreviewProps> = ({ lastDds, onViewDetails }) => {
  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-500">
      <div className="p-8">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Bookmark size={20} />
            </div>
            <div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Registro Recente</h3>
              <p className="text-slate-800 font-black text-sm uppercase tracking-tight">Memória de Segurança</p>
            </div>
          </div>
          <button 
            onClick={onViewDetails}
            className="p-2 text-slate-300 hover:text-blue-600 transition-colors"
          >
            <Download size={20} />
          </button>
        </div>

        {lastDds ? (
          <div className="space-y-4">
            <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 group-hover:bg-white group-hover:border-blue-100 transition-colors">
              <h4 className="text-lg font-black text-slate-800 leading-tight mb-2">
                {lastDds.title}
              </h4>
              <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><Clock size={12} /> {format(lastDds.createdAt, "dd 'de' MMMM", { locale: ptBR })}</span>
                <span className="flex items-center gap-1.5 text-blue-500"><FileText size={12} /> {lastDds.topic}</span>
              </div>
            </div>
            <button 
              onClick={onViewDetails}
              className="w-full py-4 text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 bg-blue-50 rounded-2xl hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2"
            >
              Ver Roteiro Completo <ChevronRight size={14} />
            </button>
          </div>
        ) : (
          <div className="py-10 text-center space-y-4 opacity-50">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
              <FileText size={24} className="text-slate-300" />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhum DDS gerado ainda</p>
            <p className="text-[10px] text-slate-400 px-6">Configure o formulário ao lado para criar seu primeiro diálogo diário.</p>
          </div>
        )}
      </div>
      
      {/* Background Decor */}
      <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
    </div>
  );
};

export default LastDDSPreview;
