
import React from 'react';
import { PDI, Goal } from '../types';
import TimelineItem from './TimelineItem';
import { Download, Pencil, Trash2, Target, ChevronRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { isBefore, parseISO, startOfToday, differenceInDays } from 'date-fns';

interface PDIJourneyViewProps {
  pdi: PDI;
  onEdit: (pdi: PDI) => void;
  onDelete: (id: string) => void;
  onToggleGoal: (pdiId: string, goalId: string) => void;
  exportPdf: (id: string, name: string) => void;
}

const PDIJourneyView: React.FC<PDIJourneyViewProps> = ({ pdi, onEdit, onDelete, onToggleGoal, exportPdf }) => {
  const today = startOfToday();
  const goals = pdi.goals || [];
  const completedCount = goals.filter(g => g.completed).length;
  const progress = goals.length > 0 ? Math.round((completedCount / goals.length) * 100) : 0;

  // Encontrar a primeira meta não concluída para destacar
  const currentGoalIndex = goals.findIndex(g => !g.completed);
  
  // Analisar status do prazo geral
  const nextIncompleteGoal = goals[currentGoalIndex];
  let deadlineStatus: 'ok' | 'warning' | 'overdue' = 'ok';
  
  if (nextIncompleteGoal) {
    const deadline = parseISO(nextIncompleteGoal.deadline);
    if (isBefore(deadline, today)) deadlineStatus = 'overdue';
    else if (differenceInDays(deadline, today) <= 3) deadlineStatus = 'warning';
  }

  return (
    <div id={`pdi-card-${pdi.id}`} className="bg-white rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all flex flex-col h-full overflow-hidden">
      {/* Header do Card (Resumo) */}
      <div className="p-8 pb-4">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-xl shadow-slate-200">
              {pdi.employee.charAt(0)}
            </div>
            <div>
              <h4 className="text-xl font-black text-slate-800 tracking-tight">{pdi.employee}</h4>
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                  deadlineStatus === 'overdue' ? 'bg-red-100 text-red-600' :
                  deadlineStatus === 'warning' ? 'bg-amber-100 text-amber-600' :
                  'bg-emerald-100 text-emerald-600'
                }`}>
                  {deadlineStatus === 'overdue' ? 'Prazo Crítico' : 
                   deadlineStatus === 'warning' ? 'Atenção ao Prazo' : 'Cronograma OK'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <button onClick={() => exportPdf(`pdi-card-${pdi.id}`, `PDI-${pdi.employee}`)} className="p-2.5 text-slate-300 hover:text-emerald-500 transition-colors"><Download size={18} /></button>
            <button onClick={() => onEdit(pdi)} className="p-2.5 text-slate-300 hover:text-blue-500 transition-colors"><Pencil size={18} /></button>
            <button onClick={() => onDelete(pdi.id)} className="p-2.5 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
          </div>
        </div>

        {/* Objetivo Principal */}
        <div className="bg-slate-50 p-6 rounded-3xl mb-8 relative group overflow-hidden border border-slate-100">
            <Target className="absolute -right-4 -bottom-4 text-slate-200 opacity-50 group-hover:scale-110 transition-transform" size={80} />
            <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Objetivo de Carreira</p>
            <p className="text-lg font-black text-slate-800 leading-tight relative z-10">
                "{pdi.careerObjective}"
            </p>
        </div>

        {/* Barra de Progresso */}
        <div className="mb-10">
            <div className="flex justify-between items-end mb-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Evolução da Jornada</span>
                <span className="text-2xl font-black text-blue-600 tracking-tighter">{progress}%</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div 
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
      </div>

      {/* Timeline da Jornada */}
      <div className="px-8 pb-10 flex-1">
        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            Milestones da Carreira <ChevronRight size={12} />
        </h5>
        <div className="flex flex-col">
          {goals.map((goal, index) => (
            <TimelineItem 
              key={goal.id}
              goal={goal}
              isFirst={index === 0}
              isLast={index === goals.length - 1}
              isCurrent={index === currentGoalIndex}
              onToggle={(goalId) => onToggleGoal(pdi.id, goalId)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PDIJourneyView;
