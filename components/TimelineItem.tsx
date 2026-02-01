
import React from 'react';
import { Check, Clock, Circle, AlertCircle } from 'lucide-react';
import { Goal } from '../types';
import { isBefore, parseISO, startOfToday } from 'date-fns';

interface TimelineItemProps {
  goal: Goal;
  isFirst: boolean;
  isLast: boolean;
  isCurrent: boolean;
  onToggle: (goalId: string) => void;
}

const TimelineItem: React.FC<TimelineItemProps> = ({ goal, isFirst, isLast, isCurrent, onToggle }) => {
  const today = startOfToday();
  const deadlineDate = parseISO(goal.deadline);
  const isOverdue = !goal.completed && isBefore(deadlineDate, today);

  return (
    <div className="relative flex gap-6 group">
      {/* Linha Conectora */}
      <div className="flex flex-col items-center">
        <div 
          className={`w-0.5 h-full ${isLast ? 'h-8' : 'h-full'} ${
            goal.completed ? 'bg-emerald-500' : 'bg-slate-200'
          } ${isFirst ? 'mt-8' : ''}`} 
        />
        
        {/* Marcador (Bolinha) */}
        <div className="absolute top-8">
          {goal.completed ? (
            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-200 z-10">
              <Check size={16} strokeWidth={4} />
            </div>
          ) : isCurrent ? (
            <div className="relative flex items-center justify-center z-10">
              <div className="absolute w-8 h-8 bg-blue-400 rounded-full animate-ping opacity-25"></div>
              <div className="w-8 h-8 bg-white border-4 border-blue-600 rounded-full flex items-center justify-center shadow-lg z-10">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center text-slate-300 z-10 group-hover:border-slate-400 transition-colors">
              <Circle size={10} fill="currentColor" />
            </div>
          )}
        </div>
      </div>

      {/* Conteúdo da Meta */}
      <div className={`flex-1 pb-12 pt-7 transition-all duration-300 ${isCurrent ? 'scale-105 origin-left' : ''}`}>
        <div className={`p-6 rounded-[2rem] border transition-all ${
          goal.completed ? 'bg-emerald-50/30 border-emerald-100' : 
          isCurrent ? 'bg-white border-blue-200 shadow-xl shadow-blue-50' : 
          'bg-white border-slate-100 opacity-60'
        }`}>
          <div className="flex justify-between items-start gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                  goal.completed ? 'bg-emerald-100 text-emerald-700' : 
                  isOverdue ? 'bg-red-100 text-red-600' :
                  isCurrent ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {goal.completed ? 'Concluído' : isOverdue ? 'Atrasado' : isCurrent ? 'Em Foco' : 'Pendente'}
                </span>
                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                  <Clock size={10} /> {goal.deadline}
                </span>
              </div>
              <h4 className={`text-sm font-black leading-tight ${
                goal.completed ? 'text-slate-500 line-through' : 'text-slate-800'
              }`}>
                {goal.text}
              </h4>
            </div>

            {!goal.completed && (
              <button 
                onClick={() => onToggle(goal.id)}
                className="shrink-0 p-3 rounded-xl bg-slate-900 text-white hover:bg-blue-600 transition-all shadow-md group-hover:scale-110"
                title="Marcar como concluído"
              >
                <Check size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineItem;
