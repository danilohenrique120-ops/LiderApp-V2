import React from 'react';
import { Calendar, Check, MessageSquare, Trash2, Pencil, AlertCircle, Clock } from 'lucide-react';
import { TodoTask } from '../types';
import { format, parseISO, isValid, isToday, isTomorrow, isBefore, startOfToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TaskItemProps {
  task: TodoTask;
  isSelectionMode: boolean;
  isSelected: boolean;
  onToggle?: () => void;
  onStatusChange?: (status: 'pending' | 'in_progress' | 'done') => void;
  onToggleSelection: () => void;
  onDelete: () => void;
  onEdit: (task: TodoTask) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({
  task,
  isSelectionMode,
  isSelected,
  onToggle,
  onStatusChange,
  onToggleSelection,
  onDelete,
  onEdit
}) => {
  const priorityStyles = {
    'Crítica': 'bg-red-100 text-red-700',
    'Alta': 'bg-orange-100 text-orange-700',
    'Média': 'bg-blue-100 text-blue-700',
    'Baixa': 'bg-slate-100 text-slate-600'
  };

  const today = startOfToday();
  const deadlineDate = parseISO(task.deadline);

  const isOverdue = task.status !== 'done' && !task.completed && isBefore(deadlineDate, today);
  const isNear = task.status !== 'done' && !task.completed && (isToday(deadlineDate) || isTomorrow(deadlineDate));
  const isDone = task.status === 'done' || task.completed;
  const isInProgress = task.status === 'in_progress';

  // Estilo da barra lateral baseado no status
  const getStatusBorder = () => {
    if (isDone) return 'border-l-emerald-500';
    if (isInProgress) return 'border-l-blue-500 animate-pulse'; // Pulsando para destaque
    if (isOverdue) return 'border-l-rose-500';
    if (isNear) return 'border-l-amber-500';
    return 'border-l-slate-300';
  };

  const getSafeDateDisplay = (deadline: string) => {
    if (!deadline) return '';
    const date = parseISO(deadline);
    if (!isValid(date)) return '';

    if (isToday(date)) return 'Hoje';
    if (isTomorrow(date)) return 'Amanhã';

    return format(date, "dd 'de' MMM", { locale: ptBR });
  };

  return (
    <div
      onClick={() => isSelectionMode && onToggleSelection()}
      className={`group flex items-center justify-between p-5 border-b border-slate-100 border-l-4 transition-all cursor-pointer ${getStatusBorder()} ${isSelected ? 'bg-indigo-50/50' : 'bg-white hover:bg-slate-50'
        }`}
    >
      {/* Esquerda: Checkbox + Título + Comentário */}
      <div className="flex items-start gap-4 flex-1 min-w-0">
        <div className="mt-1 flex-shrink-0">
          {isSelectionMode ? (
            <div className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white group-hover:border-blue-500'
              }`}>
              {isSelected && <Check size={14} strokeWidth={3} />}
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onStatusChange) {
                  // Se estiver concluído -> volta para pendente
                  // Se estiver pendente ou em progresso -> vai para concluído
                  onStatusChange(isDone ? 'pending' : 'done');
                } else if (onToggle) {
                  onToggle();
                }
              }}
              className={`w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center bg-white ${isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 group-hover:border-blue-500'
                }`}
            >
              {isDone && <Check size={14} strokeWidth={3} />}
            </button>
          )}
        </div>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[15px] font-bold text-slate-800 leading-tight truncate ${isDone ? 'line-through text-slate-400 opacity-50' : ''}`}>
              {task.text}
            </span>
            {isInProgress && (
              <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                Em Andamento
              </span>
            )}
            {isOverdue && !isDone && (
              <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                <AlertCircle size={10} /> Atrasado
              </span>
            )}
          </div>
          {task.comments && (
            <div className="flex items-start gap-1.5 text-slate-400">
              <MessageSquare size={13} className="mt-0.5 shrink-0 opacity-70" />
              <span className="text-[11px] font-medium leading-tight line-clamp-2">
                {task.comments}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Direita: Badges + Data + Ações */}
      <div className="flex items-center gap-4 ml-4 shrink-0">
        {/* Priority Badge */}
        <span className={`hidden sm:inline-block px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${priorityStyles[task.priority]}`}>
          {task.priority}
        </span>

        {/* Status Pill Dropdown */}
        <div className="relative">
          <select
            value={task.status || (task.completed ? 'done' : 'pending')}
            onChange={(e) => onStatusChange && onStatusChange(e.target.value as any)}
            onClick={(e) => e.stopPropagation()}
            className={`appearance-none text-[9px] font-bold uppercase tracking-widest py-1.5 pl-3 pr-2 rounded-lg cursor-pointer outline-none transition-all shadow-sm border ${isDone ? 'bg-emerald-100/50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' :
              isInProgress ? 'bg-blue-100/50 text-blue-600 border-blue-200 hover:bg-blue-100 animate-pulse' :
                'bg-slate-100/50 text-slate-500 border-slate-200 hover:bg-slate-100'
              }`}
          >
            <option value="pending">Pendente</option>
            <option value="in_progress">Em Andamento</option>
            <option value="done">Concluído</option>
          </select>
        </div>

        {/* Deadline Pill - Estilizado conforme o status */}
        <div className={`flex items-center gap-2 text-xs font-bold whitespace-nowrap min-w-[95px] px-3 py-1.5 rounded-full transition-all ${isDone ? 'text-slate-400 bg-slate-50' :
          isOverdue ? 'text-rose-600 bg-rose-50' :
            isNear ? 'text-amber-600 bg-amber-50' :
              'text-slate-500 bg-slate-100/50'
          }`}>
          <Calendar size={13} className="opacity-60" />
          <span>{getSafeDateDisplay(task.deadline)}</span>
        </div>

        {/* Ações (Aparece no Hover) */}
        {!isSelectionMode && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(task); }}
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
              title="Editar Tarefa"
            >
              <Pencil size={16} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              title="Excluir Tarefa"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>
    </div >
  );
};

export default TaskItem;