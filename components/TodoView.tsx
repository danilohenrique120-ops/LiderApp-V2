
import React, { useState, useMemo } from 'react';
import { 
    FolderPlus, Plus, Search, Grid, 
    X, MousePointer2, CheckCircle2, Calendar, UserPlus, Trash2,
    Save, Tag, AlertTriangle, Loader2, Pencil, Filter,
    Clock, ListFilter, ChevronDown
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

    // Estados dos formulários
    const [taskForm, setTaskForm] = useState({
        text: '',
        deadline: format(new Date(), 'yyyy-MM-dd'),
        priority: 'Média' as TodoTask['priority'],
        folderId: 'all',
        comments: ''
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
            if (statusFilter === 'pending') matchesStatus = !t.completed;
            else if (statusFilter === 'completed') matchesStatus = t.completed;
            else if (statusFilter === 'delayed') matchesStatus = !t.completed && isBefore(parseISO(t.deadline), today);

            return matchesSearch && matchesFolder && matchesStatus && matchesPriority;
        }).sort((a, b) => {
            if (a.completed !== b.completed) return Number(a.completed) - Number(b.completed);
            const priorityWeight = { 'Crítica': 4, 'Alta': 3, 'Média': 2, 'Baixa': 1 };
            return priorityWeight[a.priority] - priorityWeight[b.priority];
        });
    }, [tasks, activeFolderId, searchQuery, statusFilter, priorityFilter]);

    const handleOpenCreateTask = () => {
        setEditingTask(null);
        setTaskForm({ 
            text: '', 
            deadline: format(new Date(), 'yyyy-MM-dd'), 
            priority: 'Média', 
            folderId: activeFolderId === 'all' ? 'all' : activeFolderId,
            comments: ''
        });
        setShowTaskModal(true);
    };

    const handleOpenEditTask = (task: TodoTask) => {
        setEditingTask(task);
        setTaskForm({
            text: task.text,
            deadline: task.deadline,
            priority: task.priority,
            folderId: task.folderId,
            comments: task.comments || ''
        });
        setShowTaskModal(true);
    };

    const handleCreateOrUpdateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!taskForm.text.trim() || isSaving) return;
        setIsSaving(true);
        try {
            if (editingTask) {
                await db.collection('todo_tasks').doc(editingTask.id).update({
                    ...taskForm,
                    updatedAt: new Date()
                });
            } else {
                await db.collection('todo_tasks').add({
                    ...taskForm,
                    completed: false,
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

    const handleBulkComplete = async () => {
        const batch = db.batch();
        selectedIds.forEach(id => {
            batch.update(db.collection('todo_tasks').doc(id), { completed: true });
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
                            <span className="text-xs font-bold">Todas</span>
                        </button>
                        {folders.map(f => (
                            <button key={f.id} onClick={() => setActiveFolderId(f.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${activeFolderId === f.id ? 'bg-white border-2 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`} style={activeFolderId === f.id ? { borderColor: f.color } : {}}>
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: f.color }}></div>
                                <span className="text-xs font-bold truncate">{f.name}</span>
                            </button>
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
                                            className={`w-full appearance-none pl-4 pr-10 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all border outline-none bg-white cursor-pointer ${
                                                statusFilter !== 'all' ? 'border-slate-900 text-slate-900 bg-slate-50' : 'border-slate-100 text-slate-500 hover:border-slate-300'
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
                                            className={`w-full appearance-none pl-6 pr-10 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all border outline-none bg-white cursor-pointer ${
                                                priorityFilter !== 'all' ? 'border-slate-900 text-slate-900 bg-slate-50' : 'border-slate-100 text-slate-500 hover:border-slate-300'
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
                                            <div className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-1.5 h-4 rounded-full ${
                                                priorityFilter === 'Crítica' ? 'bg-red-500' :
                                                priorityFilter === 'Alta' ? 'bg-orange-500' :
                                                priorityFilter === 'Média' ? 'bg-blue-500' : 'bg-slate-400'
                                            }`} />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Botões de Ação Final */}
                            <div className="flex gap-2 w-full xl:w-auto self-end">
                                <button onClick={toggleMode} className={`px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 border transition-all ${isSelectionMode ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-200 text-slate-400'}`}>
                                    <MousePointer2 size={14} /> Seleção
                                </button>
                                <button onClick={handleOpenCreateTask} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs shadow-lg flex items-center gap-2 hover:bg-blue-700 transition-all whitespace-nowrap">
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

                    <div className="border-t border-slate-50">
                        {filteredTasks.length > 0 ? (
                            filteredTasks.map(task => (
                                <TaskItem 
                                    key={task.id}
                                    task={task}
                                    isSelectionMode={isSelectionMode}
                                    isSelected={selectedIds.includes(task.id)}
                                    onToggle={() => db.collection('todo_tasks').doc(task.id).update({ completed: !task.completed })}
                                    onToggleSelection={() => toggleSelection(task.id)}
                                    onDelete={() => { if(confirm('Excluir?')) db.collection('todo_tasks').doc(task.id).delete(); }}
                                    onEdit={handleOpenEditTask}
                                />
                            ))
                        ) : (
                            <div className="p-20 text-center opacity-30 flex flex-col items-center gap-3">
                                <AlertTriangle size={32} />
                                <p className="text-sm font-black uppercase tracking-widest text-slate-400">Nenhuma tarefa corresponde aos filtros</p>
                                <button 
                                    onClick={() => { setStatusFilter('all'); setPriorityFilter('all'); setSearchQuery(''); }}
                                    className="text-[10px] font-black text-blue-600 uppercase underline"
                                >
                                    Limpar Filtros
                                </button>
                            </div>
                        )}
                    </div>
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
                                    onChange={e => setTaskForm({...taskForm, text: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Comentários / Sub-texto</label>
                                <textarea 
                                    rows={2}
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm" 
                                    placeholder="Detalhes adicionais ou contexto..."
                                    value={taskForm.comments}
                                    onChange={e => setTaskForm({...taskForm, comments: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Prazo</label>
                                    <input 
                                        type="date"
                                        required
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold"
                                        value={taskForm.deadline}
                                        onChange={e => setTaskForm({...taskForm, deadline: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Prioridade</label>
                                    <select 
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold"
                                        value={taskForm.priority}
                                        onChange={e => setTaskForm({...taskForm, priority: e.target.value as any})}
                                    >
                                        <option>Baixa</option>
                                        <option>Média</option>
                                        <option>Alta</option>
                                        <option>Crítica</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pasta</label>
                                <select 
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold"
                                    value={taskForm.folderId}
                                    onChange={e => setTaskForm({...taskForm, folderId: e.target.value})}
                                >
                                    <option value="all">Geral / Nenhuma</option>
                                    {folders.map(f => (
                                        <option key={f.id} value={f.id}>{f.name}</option>
                                    ))}
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
                                    onChange={e => setFolderForm({...folderForm, name: e.target.value})}
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cor de Identificação</label>
                                <div className="flex flex-wrap gap-3">
                                    {folderColors.map(c => (
                                        <button 
                                            key={c}
                                            type="button"
                                            onClick={() => setFolderForm({...folderForm, color: c})}
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
