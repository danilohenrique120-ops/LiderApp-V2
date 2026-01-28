
import React from 'react';
import { PDI } from '../types';
import { ChevronRight, Target, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { isBefore, parseISO, startOfToday } from 'date-fns';

interface PDIListCompactProps {
  pdis: PDI[];
  onSelect: (pdi: PDI) => void;
  selectedId: string | null;
}

const PDIListCompact: React.FC<PDIListCompactProps> = ({ pdis, onSelect, selectedId }) => {
  const today = startOfToday();

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden animate-fade">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/50 border-b border-slate-100">
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Colaborador</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:table-cell">Objetivo Principal</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Progresso</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ação</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {pdis.map((pdi) => {
            const completed = pdi.goals.filter(g => g.completed).length;
            const total = pdi.goals.length;
            const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
            
            // Verifica se tem meta atrasada
            const hasOverdue = pdi.goals.some(g => !g.completed && isBefore(parseISO(g.deadline), today));
            const isSelected = selectedId === pdi.id;

            return (
              <tr 
                key={pdi.id} 
                onClick={() => onSelect(pdi)}
                className={`group cursor-pointer transition-all ${isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50/80'}`}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs shadow-md group-hover:scale-110 transition-transform">
                      {pdi.employee.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm leading-none mb-1">{pdi.employee}</p>
                      <p className="text-[9px] font-black text-blue-500 uppercase tracking-tighter">Plano Ativo</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 hidden md:table-cell">
                  <div className="flex items-center gap-2 max-w-[200px]">
                    <Target size={12} className="text-slate-300 shrink-0" />
                    <p className="text-xs font-medium text-slate-500 truncate italic">
                      "{pdi.careerObjective}"
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3 w-full max-w-[120px]">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-700 ${progress === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-black text-slate-400">{progress}%</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  {hasOverdue ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[8px] font-black uppercase tracking-widest">
                      <AlertTriangle size={10} /> Atrasado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 text-[8px] font-black uppercase tracking-widest">
                      <CheckCircle2 size={10} /> No Prazo
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className={`p-2 rounded-lg transition-all ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600'}`}>
                    <ChevronRight size={16} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default PDIListCompact;
