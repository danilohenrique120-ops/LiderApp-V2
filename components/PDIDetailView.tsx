
import React from 'react';
import { PDI, Goal } from '../types';
import { Check, Clock, Circle, Target, Download, PencilLine, Trash2 } from 'lucide-react';
import { isBefore, parseISO, startOfToday } from 'date-fns';

interface PDIDetailViewProps {
  pdi: PDI;
  onEdit: (pdi: PDI) => void;
  onDelete: (id: string) => void;
  onToggleGoal: (pdiId: string, goalId: string) => void;
  exportPdf: (id: string, name: string) => void;
}

const PDIDetailView: React.FC<PDIDetailViewProps> = ({ pdi, onEdit, onDelete, onToggleGoal, exportPdf }) => {
  const today = startOfToday();
  const goals = pdi.goals || [];
  const completedCount = goals.filter(g => g.completed).length;
  const progress = goals.length > 0 ? Math.round((completedCount / goals.length) * 100) : 0;
  
  // Identifica a meta atual (primeira não concluída)
  const currentGoalIndex = goals.findIndex(g => !g.completed);

  return (
    <div className="animate-fade space-y-8" id={`pdi-report-${pdi.id}`}>
      {/* Bloco Superior: Perfil e Progresso */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-xl shadow-blue-100">
              {pdi.employee.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">{pdi.employee}</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Plano de Desenvolvimento Individual</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => exportPdf(`pdi-report-${pdi.id}`, `PDI-${pdi.employee}`)} className="p-3 bg-slate-50 text-slate-400 hover:text-emerald-500 rounded-xl transition-all border border-slate-100"><Download size={20} /></button>
            <button onClick={() => onEdit(pdi)} className="p-3 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all border border-slate-100"><PencilLine size={20} /></button>
            <button onClick={() => onDelete(pdi.id)} className="p-3 bg-slate-50 text-slate-400 hover:text-red-500 rounded-xl transition-all border border-slate-100"><Trash2 size={20} /></button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Target size={14} /> Objetivo Final
            </p>
            <p className="text-lg font-bold text-slate-800 leading-tight italic">"{pdi.careerObjective}"</p>
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex justify-between items-end mb-2 px-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conclusão da Jornada</span>
              <span className="text-xl font-black text-blue-600">{progress}%</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(37,99,235,0.4)]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Visual (Jornada) */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Milestones e Metas</h3>
        
        <div className="space-y-0 ml-4 border-l-2 border-slate-100">
          {goals.map((goal, index) => {
            const isCompleted = goal.completed;
            const isFocussed = index === currentGoalIndex;
            const deadlineDate = parseISO(goal.deadline);
            const isOverdue = !isCompleted && isBefore(deadlineDate, startOfToday());

            return (
              <div key={goal.id} className="relative pl-10 pb-10 last:pb-0">
                {/* Marcador flutuante na linha */}
                <div className={`absolute left-[-11px] top-0 w-5 h-5 rounded-full border-4 ${
                  isCompleted ? 'bg-emerald-500 border-emerald-100' :
                  isFocussed ? 'bg-blue-600 border-blue-100 animate-pulse' :
                  'bg-white border-slate-200'
                }`} />

                <div className={`p-6 rounded-[2rem] border transition-all ${
                  isCompleted ? 'bg-emerald-50/20 border-emerald-100 opacity-70' :
                  isFocussed ? 'bg-white border-blue-200 shadow-xl shadow-blue-50/50 scale-[1.02]' :
                  'bg-white border-slate-100 opacity-50'
                }`}>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          isCompleted ? 'bg-emerald-100 text-emerald-700' :
                          isOverdue ? 'bg-red-100 text-red-600' :
                          isFocussed ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {isCompleted ? 'Concluído' : isOverdue ? 'Atrasado' : isFocussed ? 'Foco Atual' : 'Planejado'}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                          <Clock size={10} /> {goal.deadline}
                        </span>
                      </div>
                      <h4 className={`text-sm font-black ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                        {goal.text}
                      </h4>
                    </div>
                    
                    {!isCompleted && (
                      <button 
                        onClick={() => onToggleGoal(pdi.id, goal.id)}
                        className="p-3 bg-slate-900 text-white rounded-xl hover:bg-emerald-500 transition-all shadow-md active:scale-90"
                      >
                        <Check size={16} strokeWidth={3} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PDIDetailView;
