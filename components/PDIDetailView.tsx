import React from 'react';
import { PDI, Goal, MainGoalGroup } from '../types';
import { Check, Clock, Circle, Target, Download, PencilLine, Trash2, Undo2 } from 'lucide-react';
import { isBefore, parseISO, startOfToday } from 'date-fns';

interface PDIDetailViewProps {
  pdi: PDI;
  onEdit: (pdi: PDI) => void;
  onDelete: (id: string) => void;
  onToggleGoal: (pdiId: string, goalId: string, mainGoalId?: string) => void;
  exportPdf: (id: string, name: string) => void;
}

const PDIDetailView: React.FC<PDIDetailViewProps> = ({ pdi, onEdit, onDelete, onToggleGoal, exportPdf }) => {
  const today = startOfToday();
  
  // Normalização para dados legados (que usavam careerObjective como única meta principal)
  const normalizedMainGoals: MainGoalGroup[] = pdi.mainGoals?.length 
    ? pdi.mainGoals 
    : [{ id: 'legacy', title: pdi.careerObjective || 'Objetivo Principal', goals: pdi.goals || [] }];

  const allGoals = normalizedMainGoals.flatMap(mg => mg.goals || []);
  const completedCount = allGoals.filter(g => g.completed).length;
  const progress = allGoals.length > 0 ? Math.round((completedCount / allGoals.length) * 100) : 0;

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-4">
          <div className="flex flex-col justify-center bg-slate-50 p-6 rounded-3xl border border-slate-100">
            <div className="flex justify-between items-end mb-2 px-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conclusão Global das Metas</span>
              <span className="text-xl font-black text-blue-600">{progress}%</span>
            </div>
            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(37,99,235,0.4)]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 font-bold mt-4 text-center">
                {completedCount} de {allGoals.length} submetas concluídas
            </p>
          </div>

          {pdi.fixedResponsibilities && (
            <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl">
              <h3 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Circle size={10} className="fill-amber-400 text-amber-500" />
                Responsabilidades da Função Atual
              </h3>
              <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                {pdi.fixedResponsibilities}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Blocos independentes de Metas Principais */}
      <div className="space-y-6">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Metas Principais e Submetas</h3>

        {normalizedMainGoals.map((mainGoal, mgIdx) => (
            <div key={mainGoal.id} className="bg-white border text-left border-slate-200 rounded-[2.5rem] p-8 shadow-sm group">
               <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                 <Target size={18} className="text-blue-600" />
                 {mainGoal.title}
               </h4>

               <div className="space-y-3">
                 {mainGoal.goals && mainGoal.goals.map((goal) => {
                     const isCompleted = goal.completed;
                     const deadlineDate = parseISO(goal.deadline);
                     const isOverdue = !isCompleted && goal.deadline && isBefore(deadlineDate, today);

                     return (
                         <div key={goal.id} className={`flex items-start justify-between gap-4 p-4 rounded-xl border transition-all ${isCompleted ? 'bg-emerald-50/40 border-emerald-100/50' : 'bg-slate-50/50 border-slate-100 hover:border-blue-200 hover:shadow-md'}`}>
                             <div className="flex-1 mt-1">
                                <h5 className={`text-sm font-bold ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{goal.text}</h5>
                                <div className="flex items-center gap-2 mt-2">
                                  {isOverdue && <span className="text-[8px] px-2 py-0.5 rounded-full bg-red-100 font-black uppercase tracking-widest text-red-600">Atrasado</span>}
                                  {isCompleted && <span className="text-[8px] px-2 py-0.5 rounded-full bg-emerald-100 font-black uppercase tracking-widest text-emerald-600">Concluído</span>}
                                  {!isCompleted && !isOverdue && <span className="text-[8px] px-2 py-0.5 rounded-full bg-blue-100 font-black uppercase tracking-widest text-blue-600">Em Andamento</span>}

                                  <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                                    <Clock size={10} /> {goal.deadline}
                                  </span>
                                  {goal.category && (
                                      <span className="text-[9px] font-black uppercase text-slate-400 border px-1.5 py-0.5 rounded opacity-70">
                                          {goal.category.split(' ')[0]} {/* Apenas 70%, 20%, 10% */}
                                      </span>
                                  )}
                                </div>
                             </div>
                             
                             <button
                               onClick={() => onToggleGoal(pdi.id, goal.id, mainGoal.id)}
                               className={`p-3 rounded-xl transition-all shadow-sm active:scale-95 ${
                                 isCompleted 
                                   ? 'bg-white border text-slate-300 hover:bg-red-50 hover:text-red-500 hover:border-red-200' 
                                   : 'bg-slate-900 border border-slate-900 text-white hover:bg-emerald-500 hover:border-emerald-500 hover:shadow-lg'
                               }`}
                               title={isCompleted ? "Desmarcar meta" : "Marcar meta como concluída"}
                             >
                               {isCompleted ? <Undo2 size={16} strokeWidth={3} /> : <Check size={16} strokeWidth={3} />}
                             </button>
                         </div>
                     );
                 })}
                 {(!mainGoal.goals || mainGoal.goals.length === 0) && (
                     <div className="p-4 bg-slate-50 border border-dashed rounded-xl text-center">
                         <p className="text-xs text-slate-400 italic">Nenhuma submeta definida para esta Meta Principal.</p>
                     </div>
                 )}
               </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default PDIDetailView;
