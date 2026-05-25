
import React, { useState, useMemo } from 'react';
import {
    FolderPlus, Plus, Search, Grid,
    X, MousePointer2, CheckCircle2, Calendar, UserPlus, Trash2,
    Save, Tag, AlertTriangle, Loader2, Pencil, Filter,
    Clock, ListFilter, ChevronDown, Inbox
} from 'lucide-react';
import { format, addDays, nextMonday, startOfToday, isBefore, parseISO } from 'date-fns';
import { TodoFolder, TodoTask, TodoNote } from '../types';
import { useTaskSelection } from '../hooks/useTaskSelection';
import TaskItem from './TaskItem';

interface TodoViewProps {
    folders: TodoFolder[];
    tasks: TodoTask[];
    notes: TodoNote[];
    user: any;
    db: any;
}

const TodoView: React.FC<TodoViewProps> = ({ folders, tasks, notes, user, db }) => {
    const {
        selectedIds, isSelectionMode, toggleMode, toggleSelection,
        clearSelection, hasSelection, count
    } = useTaskSelection();

    const [activeFolderId, setActiveFolderId] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'delayed' | 'completed'>('all');
    const [priorityFilter, setPriorityFilter] = useState<TodoTask['priority'] | 'all'>('all');
    const [showFolderModal, setShowFolderModal] = useState(false);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [editingTask, setEditingTask] = useState<TodoTask | null>(null);
    const [bulkModal, setBulkModal] = useState<'reschedule' | 'delegate' | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'matrix'>('list');

    // Estados dos formulários
    const [taskForm, setTaskForm] = useState({
        text: '',
        deadline: format(new Date(), 'yyyy-MM-dd'),
        priority: 'Média' as TodoTask['priority'],
        folderId: 'all',
        comments: '',
        eisenhowerQuadrant: '' as 'q1' | 'q2' | 'q3' | 'q4' | ''
    });

    const [folderForm, setFolderForm] = useState({
        name: '',
        color: '#3b82f6'
    });

    const filteredTasks = useMemo(() => {
        const today = startOfToday();
        return tasks.filter(t => {
            const matchesSearch = t.text.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFolder = activeFolderId === 'all' ? true : t.folderId === activeFolderId;
            const matchesPriority = priorityFilter === 'all' ? true : t.priority === priorityFilter;

            let matchesStatus = true;
            const taskStatus = t.status || (t.completed ? 'done' : 'pending');

            if (statusFilter === 'pending') matchesStatus = taskStatus === 'pending';
            else if (statusFilter === 'completed') matchesStatus = taskStatus === 'done';
            else if (statusFilter === 'delayed') matchesStatus = taskStatus !== 'done' && !!t.deadline && isBefore(parseISO(t.deadline), today);

            return matchesSearch && matchesFolder && matchesStatus && matchesPriority;
        }).sort((a, b) => {
        }).sort((a, b) => {
            const statusA = a.status || (a.completed ? 'done' : 'pending');
            const statusB = b.status || (b.completed ? 'done' : 'pending');

            if (statusA === 'done' && statusB !== 'done') return 1;
            if (statusA !== 'done' && statusB === 'done') return -1;

            const priorityWeight: Record<TodoTask['priority'], number> = { 'Crítica': 4, 'Alta': 3, 'Média': 2, 'Baixa': 1, 'Nenhuma': 0 };
            return priorityWeight[a.priority] - priorityWeight[b.priority];
        });
    }, [tasks, activeFolderId, searchQuery, statusFilter, priorityFilter]);

    const getTaskQuadrant = (t: TodoTask): 'q1' | 'q2' | 'q3' | 'q4' => {
        if (t.eisenhowerQuadrant === 'q1' || t.eisenhowerQuadrant === 'q2' || t.eisenhowerQuadrant === 'q3' || t.eisenhowerQuadrant === 'q4') {
            return t.eisenhowerQuadrant;
        }
        
        // Dynamic inference fallback:
        const isImportant = t.priority === 'Crítica' || t.priority === 'Alta';
        
        let isUrgent = false;
        if (t.deadline) {
            try {
                const today = startOfToday();
                const deadlineDate = parseISO(t.deadline);
                // If deadline is today, past, or in the next 3 days
                const limit = addDays(today, 3);
                isUrgent = isBefore(deadlineDate, limit);
            } catch (e) {
                isUrgent = false;
            }
        }
        
        if (isImportant && isUrgent) return 'q1';
        if (isImportant && !isUrgent) return 'q2';
        if (!isImportant && isUrgent) return 'q3';
        return 'q4';
    };

    const handleMoveQuadrant = async (taskId: string, newQuadrant: 'q1' | 'q2' | 'q3' | 'q4') => {
        try {
            await db.collection('todo_tasks').doc(taskId).update({
                eisenhowerQuadrant: newQuadrant,
                updatedAt: new Date()
            });
        } catch (error) {
            console.error("Erro ao mover quadrante:", error);
        }
    };

    const q1Tasks = useMemo(() => filteredTasks.filter(t => getTaskQuadrant(t) === 'q1'), [filteredTasks]);
    const q2Tasks = useMemo(() => filteredTasks.filter(t => getTaskQuadrant(t) === 'q2'), [filteredTasks]);
    const q3Tasks = useMemo(() => filteredTasks.filter(t => getTaskQuadrant(t) === 'q3'), [filteredTasks]);
    const q4Tasks = useMemo(() => filteredTasks.filter(t => getTaskQuadrant(t) === 'q4'), [filteredTasks]);

    const handleOpenCreateTask = (presetQuadrant?: 'q1' | 'q2' | 'q3' | 'q4') => {
        setEditingTask(null);
        
        let initialPriority: TodoTask['priority'] = activeFolderId === 'inbox' ? 'Nenhuma' : 'Média';
        let initialDeadline = activeFolderId === 'inbox' ? '' : format(new Date(), 'yyyy-MM-dd');
        
        if (presetQuadrant === 'q1') {
            initialPriority = 'Crítica';
        } else if (presetQuadrant === 'q2') {
            initialPriority = 'Alta';
        } else if (presetQuadrant === 'q3') {
            initialPriority = 'Média';
        } else if (presetQuadrant === 'q4') {
            initialPriority = 'Baixa';
            initialDeadline = '';
        }

        setTaskForm({
            text: '',
            deadline: initialDeadline,
            priority: initialPriority,
            folderId: activeFolderId === 'inbox' ? 'inbox' : 'all',
            comments: '',
            eisenhowerQuadrant: presetQuadrant || ''
        });
        setShowTaskModal(true);
    };

    const handleOpenEditTask = (task: TodoTask) => {
        setEditingTask(task);
        setTaskForm({
            text: task.text,
            deadline: task.deadline || '',
            priority: task.priority,
            folderId: task.folderId,
            comments: task.comments || '',
            eisenhowerQuadrant: task.eisenhowerQuadrant || ''
        });
        setShowTaskModal(true);
    };

    const handleCreateOrUpdateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (taskForm.folderId !== 'inbox' && (!taskForm.deadline || taskForm.priority === 'Nenhuma')) {
            alert('Um prazo e uma prioridade válida são obrigatórios para as tarefas fora do Inbox.');
            return;
        }

        if (!taskForm.text.trim() || isSaving) return;
        setIsSaving(true);
        try {
            const finalTaskForm = { ...taskForm };
            if (finalTaskForm.folderId === 'inbox') {
                finalTaskForm.deadline = '';
                finalTaskForm.priority = 'Nenhuma';
            }

            const taskData: any = {
                text: finalTaskForm.text,
                deadline: finalTaskForm.deadline,
                priority: finalTaskForm.priority,
                folderId: finalTaskForm.folderId,
                comments: finalTaskForm.comments
            };

            if (finalTaskForm.eisenhowerQuadrant) {
                taskData.eisenhowerQuadrant = finalTaskForm.eisenhowerQuadrant;
            } else {
                taskData.eisenhowerQuadrant = ''; // auto/fallback
            }

            if (editingTask) {
                await db.collection('todo_tasks').doc(editingTask.id).update({
                    ...taskData,
                    updatedAt: new Date()
                });
            } else {
                await db.collection('todo_tasks').add({
                    ...taskData,
                    status: 'pending',
                    completed: false, // Legacy compatibility
                    uid: user.uid,
                    createdAt: new Date()
                });
            }
            setShowTaskModal(false);
            setEditingTask(null);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreateFolder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!folderForm.name.trim() || isSaving) return;
        setIsSaving(true);
        try {
            await db.collection('todo_folders').add({
                ...folderForm,
                uid: user.uid,
                createdAt: new Date()
            });
            setShowFolderModal(false);
            setFolderForm({ name: '', color: '#3b82f6' });
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteFolder = async (folderId: string) => {
        if (!confirm('Excluir esta pasta? As tarefas dentro dela serão movidas para a pasta Geral.')) return;
        setIsSaving(true);
        try {
            const batch = db.batch();
            const folderTasks = tasks.filter(t => t.folderId === folderId);
            folderTasks.forEach(task => {
                batch.update(db.collection('todo_tasks').doc(task.id), { folderId: 'all' });
            });
            batch.delete(db.collection('todo_folders').doc(folderId));
            await batch.commit();
            if (activeFolderId === folderId) setActiveFolderId('all');
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleBulkComplete = async () => {
        const batch = db.batch();
        selectedIds.forEach(id => {
            batch.update(db.collection('todo_tasks').doc(id), { status: 'done', completed: true });
        });
        await batch.commit();
        clearSelection();
        toggleMode();
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Excluir ${count} tarefas permanentemente?`)) return;
        const batch = db.batch();
        selectedIds.forEach(id => {
            batch.delete(db.collection('todo_tasks').doc(id));
        });
        await batch.commit();
        clearSelection();
        toggleMode();
    };

    const handleBulkReschedule = async (type: 'tomorrow' | 'nextMonday' | 'nextWeek') => {
        let newDate: Date;
        const today = startOfToday();
        if (type === 'tomorrow') newDate = addDays(today, 1);
        else if (type === 'nextMonday') newDate = nextMonday(today);
        else newDate = addDays(today, 7);

        const dateStr = format(newDate, 'yyyy-MM-dd');
        const batch = db.batch();
        selectedIds.forEach(id => {
            batch.update(db.collection('todo_tasks').doc(id), { deadline: dateStr });
        });
        await batch.commit();
        setBulkModal(null);
        clearSelection();
        toggleMode();
    };

    const folderColors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

    const renderMatrixCard = (task: TodoTask, q: 'q1' | 'q2' | 'q3' | 'q4') => {
        const isDone = task.status === 'done' || task.completed;
        const isInProgress = task.status === 'in_progress';
        
        return (
            <div 
                key={task.id} 
                className={`p-3 bg-slate-50 rounded-2xl border transition-all flex flex-col gap-2 relative ${
                    isDone ? 'opacity-60 border-slate-100 bg-slate-50/50' : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                }`}
            >
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                        <button
                            type="button"
                            onClick={() => {
                                db.collection('todo_tasks').doc(task.id).update({
                                    status: isDone ? 'pending' : 'done',
                                    completed: !isDone
                                });
                            }}
                            className={`mt-0.5 w-4 h-4 rounded border transition-all flex items-center justify-center shrink-0 ${
                                isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 bg-white hover:border-slate-400'
                            }`}
                        >
                            {isDone && <CheckCircle2 size={10} className="text-white fill-white" />}
                        </button>
                        <div className="flex flex-col min-w-0">
                            <span className={`text-xs font-bold leading-snug text-slate-800 ${isDone ? 'line-through text-slate-400' : ''}`}>
                                {task.text}
                            </span>
                            {task.comments && (
                                <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{task.comments}</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-2 mt-1 border-t border-slate-100 pt-2 shrink-0">
                    {/* Circle Switcher */}
                    <div className="flex gap-1 items-center">
                        <button 
                            type="button"
                            onClick={() => handleMoveQuadrant(task.id, 'q1')} 
                            className={`w-3.5 h-3.5 rounded-full bg-rose-500 border border-white hover:ring-2 hover:ring-rose-300 transition-all ${q === 'q1' ? 'ring-2 ring-rose-500 ring-offset-1 scale-110' : 'opacity-30'}`}
                            title="Mover para Q1 (Urgente e Importante)"
                        />
                        <button 
                            type="button"
                            onClick={() => handleMoveQuadrant(task.id, 'q2')} 
                            className={`w-3.5 h-3.5 rounded-full bg-blue-500 border border-white hover:ring-2 hover:ring-blue-300 transition-all ${q === 'q2' ? 'ring-2 ring-blue-500 ring-offset-1 scale-110' : 'opacity-30'}`}
                            title="Mover para Q2 (Importante, Não Urgente)"
                        />
                        <button 
                            type="button"
                            onClick={() => handleMoveQuadrant(task.id, 'q3')} 
                            className={`w-3.5 h-3.5 rounded-full bg-amber-500 border border-white hover:ring-2 hover:ring-amber-300 transition-all ${q === 'q3' ? 'ring-2 ring-amber-500 ring-offset-1 scale-110' : 'opacity-30'}`}
                            title="Mover para Q3 (Urgente, Não Importante)"
                        />
                        <button 
                            type="button"
                            onClick={() => handleMoveQuadrant(task.id, 'q4')} 
                            className={`w-3.5 h-3.5 rounded-full bg-slate-400 border border-white hover:ring-2 hover:ring-slate-300 transition-all ${q === 'q4' ? 'ring-2 ring-slate-400 ring-offset-1 scale-110' : 'opacity-30'}`}
                            title="Mover para Q4 (Não Urgente, Não Importante)"
                        />
                    </div>

                    <div className="flex items-center gap-1.5">
                        {task.deadline && (
                            <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                                <Calendar size={10} className="opacity-70" />
                                {format(parseISO(task.deadline), 'dd/MM')}
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={() => handleOpenEditTask(task)}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50 transition-colors"
                        >
                            <Pencil size={11} />
                        </button>
                        <button
                            type="button"
                            onClick={() => { if (confirm('Excluir?')) db.collection('todo_tasks').doc(task.id).delete(); }}
                            className="p-1 text-slate-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors"
                        >
                            <Trash2 size={11} />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8 animate-fade min-h-[calc(100vh-200px)] relative">

            {/* BULK ACTION BAR */}
            {hasSelection && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-fade">
                    <div className="bg-slate-900 text-white rounded-full shadow-2xl px-8 py-4 flex items-center gap-8 border border-white/20 backdrop-blur-md">
                        <div className="flex items-center gap-3 pr-8 border-r border-white/20">
                            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-black">{count}</span>
                            <span className="text-xs font-black uppercase tracking-widest">Selecionados</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={handleBulkComplete} className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 rounded-xl transition-all font-bold text-[10px] uppercase">
                                <CheckCircle2 size={16} /> Concluir
                            </button>
                            <button onClick={() => setBulkModal('reschedule')} className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 rounded-xl transition-all font-bold text-[10px] uppercase">
                                <Calendar size={16} /> Reagendar
                            </button>
                            <button onClick={handleBulkDelete} className="flex items-center gap-2 px-4 py-2 hover:bg-red-500 rounded-xl transition-all font-bold text-[10px] uppercase">
                                <Trash2 size={16} /> Excluir
                            </button>
                        </div>
                        <button onClick={clearSelection} className="ml-4 p-2 hover:bg-white/10 rounded-full"><X size={18} /></button>
                    </div>
                </div>
            )}

            <aside className="w-full lg:w-72 flex flex-col gap-4">
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 lg:sticky lg:top-32">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pastas</h3>
                        <button onClick={() => setShowFolderModal(true)} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"><FolderPlus size={18} /></button>
                    </div>
                    <nav className="space-y-2">
                        <button onClick={() => setActiveFolderId('all')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${activeFolderId === 'all' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                            <Grid size={18} />
                            <span className="text-xs font-bold">Todas / Geral</span>
                        </button>
                        <button onClick={() => setActiveFolderId('inbox')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${activeFolderId === 'inbox' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'}`}>
                            <Inbox size={18} />
                            <span className="text-xs font-bold">Inbox</span>
                        </button>
                        {folders.map(f => (
                            <div key={f.id} className="relative group w-full">
                                <button onClick={() => setActiveFolderId(f.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${activeFolderId === f.id ? 'bg-white border-2 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`} style={activeFolderId === f.id ? { borderColor: f.color } : {}}>
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: f.color }}></div>
                                    <span className="text-xs font-bold truncate pr-8">{f.name}</span>
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteFolder(f.id); }} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all" title="Excluir Pasta">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </nav>
                </div>
            </aside>

            <div className="flex-1 flex flex-col gap-6">
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
                    <div className="p-8 pb-4">
                        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-4">
                            {/* Grupo de Busca e Filtros */}
                            <div className="flex flex-col md:flex-row items-stretch md:items-end gap-4 flex-1 w-full">
                                <div className="relative flex-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 flex items-center gap-1">
                                        <Search size={12} /> Pesquisa
                                    </label>
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                        <input
                                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium transition-all"
                                            placeholder="Descreva o que procura..."
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Dropdown de Status */}
                                <div className="flex flex-col gap-1.5 min-w-[160px]">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                                        <ListFilter size={12} /> Status
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value as any)}
                                            className={`w-full appearance-none pl-4 pr-10 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all border outline-none bg-white cursor-pointer ${statusFilter !== 'all' ? 'border-slate-900 text-slate-900 bg-slate-50' : 'border-slate-100 text-slate-500 hover:border-slate-300'
                                                }`}
                                        >
                                            <option value="all">Todos Status</option>
                                            <option value="pending">Pendentes</option>
                                            <option value="delayed">Atrasados</option>
                                            <option value="completed">Concluídos</option>
                                        </select>
                                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Dropdown de Prioridade */}
                                <div className="flex flex-col gap-1.5 min-w-[160px]">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                                        <Tag size={12} /> Prioridade
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={priorityFilter}
                                            onChange={(e) => setPriorityFilter(e.target.value as any)}
                                            className={`w-full appearance-none pl-6 pr-10 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all border outline-none bg-white cursor-pointer ${priorityFilter !== 'all' ? 'border-slate-900 text-slate-900 bg-slate-50' : 'border-slate-100 text-slate-500 hover:border-slate-300'
                                                }`}
                                        >
                                            <option value="all">Prioridade: Todas</option>
                                            <option value="Crítica">Crítica</option>
                                            <option value="Alta">Alta</option>
                                            <option value="Média">Média</option>
                                            <option value="Baixa">Baixa</option>
                                        </select>
                                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />

                                        {priorityFilter !== 'all' && (
                                            <div className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-1.5 h-4 rounded-full ${priorityFilter === 'Crítica' ? 'bg-red-500' :
                                                priorityFilter === 'Alta' ? 'bg-orange-500' :
                                                    priorityFilter === 'Média' ? 'bg-blue-500' : 'bg-slate-400'
                                                }`} />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Botões de Ação Final */}
                            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto self-end">
                                <div className="flex gap-1 bg-slate-100 p-1.5 rounded-2xl shadow-inner border border-slate-200/50">
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('list')}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                                            viewMode === 'list'
                                                ? 'bg-white text-slate-800 shadow-sm border border-slate-200/30'
                                                : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                    >
                                        Lista Padrão
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('matrix')}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                                            viewMode === 'matrix'
                                                ? 'bg-indigo-600 text-white shadow-sm'
                                                : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                    >
                                        Matriz de Eisenhower
                                    </button>
                                </div>

                                <button type="button" onClick={toggleMode} className={`px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 border transition-all ${isSelectionMode ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-200 text-slate-400'}`}>
                                    <MousePointer2 size={14} /> Seleção
                                </button>
                                <button type="button" onClick={() => handleOpenCreateTask()} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs shadow-lg flex items-center gap-2 hover:bg-blue-700 transition-all whitespace-nowrap">
                                    <Plus size={18} /> Nova Tarefa
                                </button>
                            </div>
                        </div>

                        {/* Indicador de Filtros Ativos (Limpar) */}
                        {(statusFilter !== 'all' || priorityFilter !== 'all' || searchQuery !== '') && (
                            <div className="flex justify-end mb-4 px-1">
                                <button
                                    onClick={() => { setStatusFilter('all'); setPriorityFilter('all'); setSearchQuery(''); }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black text-rose-500 uppercase tracking-[0.15em] hover:bg-rose-50 rounded-lg transition-all border border-rose-100"
                                >
                                    <X size={12} /> Limpar Filtros
                                </button>
                            </div>
                        )}
                    </div>

                    {viewMode === 'list' ? (
                        <div className="border-t border-slate-50">
                            {filteredTasks.length > 0 ? (
                                filteredTasks.map(task => (
                                    <TaskItem
                                        key={task.id}
                                        task={task}
                                        isSelectionMode={isSelectionMode}
                                        isSelected={selectedIds.includes(task.id)}
                                        // onToggle={() => db.collection('todo_tasks').doc(task.id).update({ completed: !task.completed })}
                                        onStatusChange={(newStatus) => {
                                            db.collection('todo_tasks').doc(task.id).update({
                                                status: newStatus,
                                                completed: newStatus === 'done'
                                            });
                                        }}
                                        onToggleSelection={() => toggleSelection(task.id)}
                                        onDelete={() => { if (confirm('Excluir?')) db.collection('todo_tasks').doc(task.id).delete(); }}
                                        onEdit={handleOpenEditTask}
                                    />
                                ))
                            ) : (
                                <div className="p-20 text-center opacity-30 flex flex-col items-center gap-3">
                                    <AlertTriangle size={32} />
                                    <p className="text-sm font-black uppercase tracking-widest text-slate-400">Nenhuma tarefa corresponde aos filtros</p>
                                    <button
                                        type="button"
                                        onClick={() => { setStatusFilter('all'); setPriorityFilter('all'); setSearchQuery(''); }}
                                        className="text-[10px] font-black text-blue-600 uppercase underline"
                                    >
                                        Limpar Filtros
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Visão Eisenhower Matrix */
                        <div className="border-t border-slate-100 bg-slate-50/50 p-6 space-y-6">
                            <div className="text-center mb-2">
                                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Matriz de Priorização de Eisenhower</h4>
                                <p className="text-[10px] text-slate-400 mt-1 font-bold">Distribuição das tarefas com base em Importância e Urgência</p>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                {/* Quadrante 1: Urgente e Importante */}
                                <div className="bg-white rounded-3xl border border-rose-100 shadow-sm overflow-hidden flex flex-col min-h-[300px] transition-all hover:shadow-md">
                                    <div className="bg-rose-50/70 border-b border-rose-100 p-4 px-6 flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                                            <h4 className="font-black uppercase tracking-widest text-[11px] text-rose-800">Q1: Urgente & Importante</h4>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="bg-rose-100 text-rose-700 font-black text-[9px] uppercase px-2 py-0.5 rounded-md">{q1Tasks.length}</span>
                                            <button 
                                                type="button"
                                                onClick={() => handleOpenCreateTask('q1')}
                                                className="p-1 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
                                                title="Adicionar tarefa em Q1"
                                            >
                                                <Plus size={12} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-4 flex-1 flex flex-col gap-2 overflow-y-auto max-h-[400px] custom-scrollbar">
                                        <span className="text-[9px] font-black uppercase tracking-wider text-rose-400 mb-1">🔥 Fazer Imediatamente</span>
                                        {q1Tasks.length > 0 ? (
                                            q1Tasks.map(t => renderMatrixCard(t, 'q1'))
                                        ) : (
                                            <div className="flex-1 flex items-center justify-center py-10 opacity-30 text-[10px] font-bold uppercase text-slate-400">Nenhuma tarefa</div>
                                        )}
                                    </div>
                                </div>

                                {/* Quadrante 2: Importante, Não Urgente */}
                                <div className="bg-white rounded-3xl border border-blue-100 shadow-sm overflow-hidden flex flex-col min-h-[300px] transition-all hover:shadow-md">
                                    <div className="bg-blue-50/70 border-b border-blue-100 p-4 px-6 flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                                            <h4 className="font-black uppercase tracking-widest text-[11px] text-blue-800">Q2: Importante & Não Urgente</h4>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="bg-blue-100 text-blue-700 font-black text-[9px] uppercase px-2 py-0.5 rounded-md">{q2Tasks.length}</span>
                                            <button 
                                                type="button"
                                                onClick={() => handleOpenCreateTask('q2')}
                                                className="p-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                                title="Adicionar tarefa em Q2"
                                            >
                                                <Plus size={12} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-4 flex-1 flex flex-col gap-2 overflow-y-auto max-h-[400px] custom-scrollbar">
                                        <span className="text-[9px] font-black uppercase tracking-wider text-blue-400 mb-1">📅 Planejar / Agendar</span>
                                        {q2Tasks.length > 0 ? (
                                            q2Tasks.map(t => renderMatrixCard(t, 'q2'))
                                        ) : (
                                            <div className="flex-1 flex items-center justify-center py-10 opacity-30 text-[10px] font-bold uppercase text-slate-400">Nenhuma tarefa</div>
                                        )}
                                    </div>
                                </div>

                                {/* Quadrante 3: Urgente, Não Importante */}
                                <div className="bg-white rounded-3xl border border-amber-100 shadow-sm overflow-hidden flex flex-col min-h-[300px] transition-all hover:shadow-md">
                                    <div className="bg-amber-50/70 border-b border-amber-100 p-4 px-6 flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                                            <h4 className="font-black uppercase tracking-widest text-[11px] text-amber-800">Q3: Urgente & Não Importante</h4>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="bg-amber-100 text-amber-700 font-black text-[9px] uppercase px-2 py-0.5 rounded-md">{q3Tasks.length}</span>
                                            <button 
                                                type="button"
                                                onClick={() => handleOpenCreateTask('q3')}
                                                className="p-1 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                                                title="Adicionar tarefa em Q3"
                                            >
                                                <Plus size={12} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-4 flex-1 flex flex-col gap-2 overflow-y-auto max-h-[400px] custom-scrollbar">
                                        <span className="text-[9px] font-black uppercase tracking-wider text-amber-400 mb-1">🤝 Delegar / Minimizar</span>
                                        {q3Tasks.length > 0 ? (
                                            q3Tasks.map(t => renderMatrixCard(t, 'q3'))
                                        ) : (
                                            <div className="flex-1 flex items-center justify-center py-10 opacity-30 text-[10px] font-bold uppercase text-slate-400">Nenhuma tarefa</div>
                                        )}
                                    </div>
                                </div>

                                {/* Quadrante 4: Não Urgente, Não Importante */}
                                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[300px] transition-all hover:shadow-md">
                                    <div className="bg-slate-100 border-b border-slate-200 p-4 px-6 flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                                            <h4 className="font-black uppercase tracking-widest text-[11px] text-slate-800">Q4: Não Urgente & Não Importante</h4>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="bg-slate-200 text-slate-700 font-black text-[9px] uppercase px-2 py-0.5 rounded-md">{q4Tasks.length}</span>
                                            <button 
                                                type="button"
                                                onClick={() => handleOpenCreateTask('q4')}
                                                className="p-1 bg-slate-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
                                                title="Adicionar tarefa em Q4"
                                            >
                                                <Plus size={12} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-4 flex-1 flex flex-col gap-2 overflow-y-auto max-h-[400px] custom-scrollbar">
                                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">🗑️ Eliminar / Inbox</span>
                                        {q4Tasks.length > 0 ? (
                                            q4Tasks.map(t => renderMatrixCard(t, 'q4'))
                                        ) : (
                                            <div className="flex-1 flex items-center justify-center py-10 opacity-30 text-[10px] font-bold uppercase text-slate-400">Nenhuma tarefa</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL NOVA/EDITAR TAREFA */}
            {showTaskModal && (
                <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 animate-fade">
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
                        <div className="p-8 border-b flex justify-between items-center bg-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg">
                                    {editingTask ? <Pencil size={20} /> : <Plus size={20} />}
                                </div>
                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                                    {editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}
                                </h3>
                            </div>
                            <button onClick={() => setShowTaskModal(false)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleCreateOrUpdateTask} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição do Item</label>
                                <input
                                    autoFocus
                                    required
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                                    placeholder="O que precisa ser feito?"
                                    value={taskForm.text}
                                    onChange={e => setTaskForm({ ...taskForm, text: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Comentários / Sub-texto</label>
                                <textarea
                                    rows={2}
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm"
                                    placeholder="Detalhes adicionais ou contexto..."
                                    value={taskForm.comments}
                                    onChange={e => setTaskForm({ ...taskForm, comments: e.target.value })}
                                />
                            </div>
                            {taskForm.folderId !== 'inbox' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Prazo</label>
                                        <input
                                            type="date"
                                            required
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold"
                                            value={taskForm.deadline || ''}
                                            onChange={e => setTaskForm({ ...taskForm, deadline: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Prioridade</label>
                                        <select
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold"
                                            value={taskForm.priority}
                                            onChange={e => setTaskForm({ ...taskForm, priority: e.target.value as any })}
                                        >
                                            {taskForm.priority === 'Nenhuma' && taskForm.folderId !== 'inbox' && <option value="Nenhuma" disabled hidden>Selecione...</option>}
                                            <option value="Baixa">Baixa</option>
                                            <option value="Média">Média</option>
                                            <option value="Alta">Alta</option>
                                            <option value="Crítica">Crítica</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pasta</label>
                                <select
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold"
                                    value={taskForm.folderId}
                                    onChange={e => setTaskForm({ ...taskForm, folderId: e.target.value })}
                                >
                                    <option value="inbox">Inbox (Sem Prazo)</option>
                                    <option value="all">Geral / Nenhuma</option>
                                    {folders.map(f => (
                                        <option key={f.id} value={f.id}>{f.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Matriz de Eisenhower</label>
                                <select
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold"
                                    value={taskForm.eisenhowerQuadrant}
                                    onChange={e => setTaskForm({ ...taskForm, eisenhowerQuadrant: e.target.value as any })}
                                >
                                    <option value="">Automático (Calculado por Prazo e Prioridade)</option>
                                    <option value="q1">Q1: Urgente e Importante (Fazer Imediatamente)</option>
                                    <option value="q2">Q2: Importante, Não Urgente (Planejar/Agendar)</option>
                                    <option value="q3">Q3: Urgente, Não Importante (Delegar/Minimizar)</option>
                                    <option value="q4">Q4: Não Urgente, Não Importante (Eliminar/Inbox)</option>
                                </select>
                            </div>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-all disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 className="animate-spin" size={18} /> : (editingTask ? <Save size={18} /> : <Plus size={18} />)}
                                {editingTask ? 'Salvar Alterações' : 'Agendar Tarefa'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL NOVA PASTA */}
            {showFolderModal && (
                <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 animate-fade">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
                        <div className="p-8 border-b flex justify-between items-center bg-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg">
                                    <FolderPlus size={20} />
                                </div>
                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Nova Pasta</h3>
                            </div>
                            <button onClick={() => setShowFolderModal(false)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleCreateFolder} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome da Pasta</label>
                                <input
                                    autoFocus
                                    required
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                                    placeholder="Ex: Projetos, Manutenção..."
                                    value={folderForm.name}
                                    onChange={e => setFolderForm({ ...folderForm, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cor de Identificação</label>
                                <div className="flex flex-wrap gap-3">
                                    {folderColors.map(c => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setFolderForm({ ...folderForm, color: c })}
                                            className={`w-10 h-10 rounded-xl transition-all ${folderForm.color === c ? 'ring-4 ring-blue-500/20 scale-110 border-2 border-white' : 'opacity-60 hover:opacity-100'}`}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                                Criar Pasta
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL REAGENDAR */}
            {bulkModal === 'reschedule' && (
                <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 animate-fade">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Reagendar Itens</h3>
                            <button onClick={() => setBulkModal(null)} className="text-slate-300 hover:text-red-500 transition-colors"><X size={24} /></button>
                        </div>
                        <div className="space-y-3">
                            <button onClick={() => handleBulkReschedule('tomorrow')} className="w-full flex items-center justify-between p-5 bg-slate-50 rounded-2xl hover:bg-blue-50 hover:text-blue-600 transition-all font-bold text-sm">
                                <span>Amanhã</span>
                                <Plus size={18} />
                            </button>
                            <button onClick={() => handleBulkReschedule('nextMonday')} className="w-full flex items-center justify-between p-5 bg-slate-50 rounded-2xl hover:bg-blue-50 hover:text-blue-600 transition-all font-bold text-sm">
                                <span>Próxima Segunda</span>
                                <Plus size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TodoView;
