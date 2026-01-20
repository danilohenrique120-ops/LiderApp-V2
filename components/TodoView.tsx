
import React, { useState, useMemo } from 'react';
import { 
    FolderPlus, 
    Plus, 
    Trash2, 
    Search, 
    Calendar, 
    CheckCircle2, 
    Circle, 
    Grid, 
    ListTodo, 
    XCircle, 
    Pencil, 
    StickyNote, 
    History, 
    Save,
    Clock,
    Filter,
    AlertTriangle
} from 'lucide-react';
import { TodoFolder, TodoTask, TodoNote } from '../types';
// @ts-ignore
import firebase from 'firebase/compat/app';

interface TodoViewProps {
    folders: TodoFolder[];
    tasks: TodoTask[];
    notes: TodoNote[];
    user: any;
    db: any;
}

const TodoView: React.FC<TodoViewProps> = ({ folders, tasks, notes, user, db }) => {
    const [activeFolderId, setActiveFolderId] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'delayed' | 'completed'>('all');
    const [priorityFilter, setPriorityFilter] = useState<string>('all');
    
    const [showFolderModal, setShowFolderModal] = useState(false);
    const [showTaskModal, setShowTaskModal] = useState(false);
    
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [newFolderName, setNewFolderName] = useState('');
    const [newFolderColor, setNewFolderColor] = useState('#3b82f6');
    
    const [newTaskText, setNewTaskText] = useState('');
    const [newTaskDeadline, setNewTaskDeadline] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState<'Baixa' | 'Média' | 'Alta' | 'Crítica'>('Média');
    const [newTaskFolder, setNewTaskFolder] = useState('');

    const [newNoteText, setNewNoteText] = useState('');

    const priorityColors = {
        'Baixa': 'bg-slate-100 text-slate-500',
        'Média': 'bg-blue-100 text-blue-600',
        'Alta': 'bg-orange-100 text-orange-600',
        'Crítica': 'bg-red-100 text-red-600'
    };

    const handleCreateFolder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFolderName.trim()) return;
        await db.collection('todo_folders').add({
            name: newFolderName,
            color: newFolderColor,
            uid: user.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        setNewFolderName('');
        setShowFolderModal(false);
    };

    const openEditTask = (task: TodoTask) => {
        setEditingTaskId(task.id);
        setNewTaskText(task.text);
        setNewTaskDeadline(task.deadline);
        setNewTaskPriority(task.priority);
        setNewTaskFolder(task.folderId);
        setShowTaskModal(true);
    };

    const handleSaveTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskText.trim()) return;

        const taskData = {
            text: newTaskText,
            deadline: newTaskDeadline,
            priority: newTaskPriority,
            folderId: newTaskFolder || (activeFolderId === 'all' ? (folders[0]?.id || '') : activeFolderId),
            uid: user.uid,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (editingTaskId) {
            await db.collection('todo_tasks').doc(editingTaskId).update(taskData);
        } else {
            await db.collection('todo_tasks').add({
                ...taskData,
                completed: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        resetTaskForm();
    };

    const resetTaskForm = () => {
        setEditingTaskId(null);
        setNewTaskText('');
        setNewTaskDeadline('');
        setNewTaskPriority('Média');
        setNewTaskFolder('');
        setShowTaskModal(false);
    };

    const toggleTask = async (task: TodoTask) => {
        await db.collection('todo_tasks').doc(task.id).update({
            completed: !task.completed
        });
    };

    const deleteTask = async (id: string) => {
        if (confirm('Excluir esta tarefa?')) {
            await db.collection('todo_tasks').doc(id).delete();
        }
    };

    const deleteFolder = async (id: string) => {
        if (confirm('Excluir esta pasta e todas as suas tarefas?')) {
            const batch = db.batch();
            batch.delete(db.collection('todo_folders').doc(id));
            tasks.filter(t => t.folderId === id).forEach(t => {
                batch.delete(db.collection('todo_tasks').doc(t.id));
            });
            await batch.commit();
            if (activeFolderId === id) setActiveFolderId('all');
        }
    };

    const handleAddNote = async () => {
        if (!newNoteText.trim()) return;
        await db.collection('todo_notes').add({
            text: newNoteText,
            uid: user.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        setNewNoteText('');
    };

    const deleteNote = async (id: string) => {
        if (confirm('Excluir esta anotação?')) {
            await db.collection('todo_notes').doc(id).delete();
        }
    };

    const getStatusInfo = (deadline: string, completed: boolean) => {
        if (completed) return { label: 'Concluído', class: 'bg-emerald-100 text-emerald-600', pulse: false, overdue: false };
        if (!deadline) return null;

        const today = new Date();
        today.setHours(0,0,0,0);
        const due = new Date(deadline + 'T00:00:00');
        due.setHours(0,0,0,0);
        
        const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { label: 'Atrasado', class: 'bg-red-100 text-red-600 font-black', pulse: true, overdue: true };
        if (diffDays === 0) return { label: 'Vence Hoje', class: 'bg-orange-100 text-orange-600 font-bold', pulse: false, overdue: false };
        if (diffDays <= 3) return { label: `Em ${diffDays} dias`, class: 'bg-blue-100 text-blue-600', pulse: false, overdue: false };
        
        return null;
    };

    const filteredTasks = useMemo(() => {
        return tasks.filter(t => {
            const matchesSearch = t.text.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFolder = activeFolderId === 'all' ? true : t.folderId === activeFolderId;
            const matchesPriority = priorityFilter === 'all' ? true : t.priority === priorityFilter;
            
            let matchesStatus = true;
            if (statusFilter === 'completed') matchesStatus = t.completed;
            else if (statusFilter === 'delayed') {
                const status = getStatusInfo(t.deadline, t.completed);
                matchesStatus = status?.overdue === true;
            }

            return matchesSearch && matchesFolder && matchesPriority && matchesStatus;
        }).sort((a, b) => {
            if (a.completed !== b.completed) return a.completed ? 1 : -1;
            const dateA = a.deadline ? new Date(a.deadline + 'T00:00:00').getTime() : 9999999999999;
            const dateB = b.deadline ? new Date(b.deadline + 'T00:00:00').getTime() : 9999999999999;
            return dateA - dateB;
        });
    }, [tasks, activeFolderId, searchQuery, statusFilter, priorityFilter]);

    const delayedCount = useMemo(() => {
        return tasks.filter(t => {
            const status = getStatusInfo(t.deadline, t.completed);
            return status?.overdue === true;
        }).length;
    }, [tasks]);

    return (
        <div className="flex flex-col lg:flex-row gap-8 animate-fade min-h-[calc(100vh-200px)]">
            {/* Sidebar Lateral: Pastas */}
            <aside className="w-full lg:w-72 flex flex-col gap-4">
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 flex flex-col h-full lg:sticky lg:top-32">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Temas / Projetos</h3>
                        <button onClick={() => setShowFolderModal(true)} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors">
                            <FolderPlus size={18} />
                        </button>
                    </div>

                    <nav className="space-y-2 overflow-y-auto custom-scrollbar pr-2 flex-1">
                        <button 
                            onClick={() => setActiveFolderId('all')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-left ${activeFolderId === 'all' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <Grid size={18} />
                            <span className="text-xs font-bold">Ver Todas</span>
                        </button>
                        
                        {folders.map(folder => (
                            <div key={folder.id} className="group relative">
                                <button 
                                    onClick={() => setActiveFolderId(folder.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-left ${activeFolderId === folder.id ? 'bg-white border-2 shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                                    style={activeFolderId === folder.id ? { borderColor: folder.color } : {}}
                                >
                                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: folder.color }}></div>
                                    <span className={`text-xs font-bold truncate ${activeFolderId === folder.id ? 'text-slate-800' : ''}`}>{folder.name}</span>
                                    <span className="ml-auto text-[10px] bg-slate-100 px-2 py-0.5 rounded-full">
                                        {tasks.filter(t => t.folderId === folder.id && !t.completed).length}
                                    </span>
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }}
                                    className="absolute right-10 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-2 text-red-300 hover:text-red-500 transition-all"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </nav>
                </div>
            </aside>

            {/* Conteúdo Principal: Tarefas + Notas Embaixo */}
            <div className="flex-1 flex flex-col gap-8 min-w-0">
                
                {/* Seção Superior: Lista de Tarefas (Expandida) */}
                <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 flex flex-col">
                    
                    {/* Toolbar de Filtros e Busca */}
                    <div className="flex flex-col gap-6 mb-10">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="relative flex-1 w-full max-w-xl">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                <input 
                                    type="text"
                                    placeholder="Pesquisar atividades..."
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <button 
                                onClick={() => {
                                    resetTaskForm();
                                    if(activeFolderId !== 'all') setNewTaskFolder(activeFolderId);
                                    setShowTaskModal(true);
                                }}
                                className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs shadow-xl flex items-center gap-2 hover:scale-105 transition-all w-full md:w-auto justify-center"
                            >
                                <Plus size={18} /> Nova Tarefa
                            </button>
                        </div>

                        {/* Barra de Filtros Rápidos */}
                        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                            <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-2 md:pb-0">
                                <button 
                                    onClick={() => setStatusFilter('all')}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${statusFilter === 'all' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-200'}`}
                                >
                                    Todos
                                </button>
                                <button 
                                    onClick={() => setStatusFilter('delayed')}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${statusFilter === 'delayed' ? 'bg-red-600 text-white shadow-md' : 'bg-white text-red-400 border border-red-100'}`}
                                >
                                    <AlertTriangle size={12} />
                                    Atrasados {delayedCount > 0 && <span className="bg-red-500 text-white px-1.5 py-0.5 rounded-full text-[8px]">{delayedCount}</span>}
                                </button>
                                <button 
                                    onClick={() => setStatusFilter('completed')}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${statusFilter === 'completed' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-emerald-400 border border-emerald-100'}`}
                                >
                                    Concluídos
                                </button>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 text-slate-400">
                                    <Filter size={14} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Prioridade:</span>
                                </div>
                                <select 
                                    className="bg-white border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                    value={priorityFilter}
                                    onChange={(e) => setPriorityFilter(e.target.value)}
                                >
                                    <option value="all">Todas</option>
                                    <option value="Crítica">Crítica</option>
                                    <option value="Alta">Alta</option>
                                    <option value="Média">Média</option>
                                    <option value="Baixa">Baixa</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {filteredTasks.length > 0 ? (
                            filteredTasks.map(task => {
                                const status = getStatusInfo(task.deadline, task.completed);
                                const folder = folders.find(f => f.id === task.folderId);
                                
                                return (
                                    <div 
                                        key={task.id} 
                                        className={`group bg-white border p-6 rounded-[2rem] transition-all flex items-center gap-6 hover:shadow-md ${task.completed ? 'opacity-60 bg-slate-50 border-slate-100' : 'border-slate-100 shadow-sm'}`}
                                    >
                                        <button 
                                            onClick={() => toggleTask(task)}
                                            className={`transition-colors flex-shrink-0 ${task.completed ? 'text-emerald-500' : 'text-slate-300 hover:text-blue-500'}`}
                                        >
                                            {task.completed ? <CheckCircle2 size={28} /> : <Circle size={28} />}
                                        </button>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                                <h4 className={`text-base font-bold leading-tight ${task.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                                                    {task.text}
                                                </h4>
                                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${priorityColors[task.priority]}`}>
                                                    {task.priority}
                                                </span>
                                            </div>
                                            
                                            <div className="flex flex-wrap items-center gap-5">
                                                {folder && (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: folder.color }}></div>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{folder.name}</span>
                                                    </div>
                                                )}
                                                {task.deadline && (
                                                    <div className="flex items-center gap-1.5 text-slate-400">
                                                        <Calendar size={14} />
                                                        <span className="text-[10px] font-black uppercase">
                                                            {new Date(task.deadline + 'T00:00:00').toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            {status && (
                                                <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${status.class} ${status.pulse ? 'animate-pulse-red' : ''}`}>
                                                    {status.label}
                                                </span>
                                            )}
                                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-all gap-1">
                                                <button 
                                                    onClick={() => openEditTask(task)}
                                                    className="p-2.5 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-xl transition-colors"
                                                    title="Editar"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => deleteTask(task.id)}
                                                    className="p-2.5 bg-red-50 text-red-300 hover:text-red-500 rounded-xl transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center py-24 text-slate-200">
                                <ListTodo size={80} strokeWidth={1} className="mb-6 opacity-20" />
                                <p className="text-sm font-black uppercase tracking-widest">Nenhuma atividade agendada</p>
                                <p className="text-[11px] font-bold mt-2 opacity-60">Experimente ajustar os filtros ou pesquisar por outro termo.</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Seção Inferior: Notas & Insights (Full Width) */}
                <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-8 border-b bg-slate-50/50">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
                                    <StickyNote size={20} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Notas & Insights Gerais</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Registre observações e ideias soltas</p>
                                </div>
                            </div>
                            <span className="text-[10px] bg-slate-200 text-slate-600 px-3 py-1.5 rounded-full font-black uppercase tracking-widest">Histórico Cronológico</span>
                        </div>
                        <div className="relative group">
                            <textarea 
                                placeholder="Registre um insight, lembrete de reunião ou observação do chão de fábrica..."
                                className="w-full p-6 bg-white border border-slate-200 rounded-[2rem] outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium resize-none shadow-sm"
                                rows={4}
                                value={newNoteText}
                                onChange={(e) => setNewNoteText(e.target.value)}
                            />
                            <button 
                                onClick={handleAddNote}
                                className="absolute bottom-4 right-4 bg-blue-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2"
                            >
                                <Save size={14} /> Salvar Insight
                            </button>
                        </div>
                    </div>

                    <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {notes.length > 0 ? (
                                notes.map(note => (
                                    <div key={note.id} className="group p-6 bg-slate-50 rounded-[2rem] border border-slate-100 relative hover:bg-white hover:shadow-xl transition-all flex flex-col h-full">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                <Clock size={12} className="text-blue-400" /> 
                                                {note.createdAt?.toDate ? note.createdAt.toDate().toLocaleString('pt-BR') : 'Agora mesmo'}
                                            </div>
                                            <button 
                                                onClick={() => deleteNote(note.id)}
                                                className="opacity-0 group-hover:opacity-100 p-2 bg-white text-slate-300 hover:text-red-500 rounded-xl shadow-sm transition-all"
                                                title="Excluir Nota"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <p className="text-xs text-slate-600 leading-relaxed font-semibold flex-1 italic">
                                            "{note.text}"
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full flex flex-col items-center justify-center py-16 text-slate-300">
                                    <History size={56} strokeWidth={1} className="mb-4 opacity-10" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Nenhum insight registrado até o momento</p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </div>

            {/* Modais */}
            {showFolderModal && (
                <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
                    <div className="bg-white w-full max-md rounded-[2.5rem] shadow-2xl p-10 animate-fade">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Nova Pasta / Tema</h3>
                            <button onClick={() => setShowFolderModal(false)} className="text-slate-300 hover:text-slate-600"><XCircle size={24} /></button>
                        </div>
                        <form onSubmit={handleCreateFolder} className="space-y-6">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título do Tema</label>
                                <input 
                                    autoFocus
                                    required
                                    placeholder="Ex: Projetos Qualidade"
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold"
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cor do Identificador</label>
                                <div className="flex flex-wrap gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#0f172a', '#64748b'].map(c => (
                                        <button 
                                            key={c}
                                            type="button"
                                            onClick={() => setNewFolderColor(c)}
                                            className={`w-8 h-8 rounded-full border-4 transition-all ${newFolderColor === c ? 'border-white ring-2 ring-blue-500 scale-125' : 'border-transparent'}`}
                                            style={{ backgroundColor: c }}
                                        ></button>
                                    ))}
                                </div>
                            </div>
                            <button className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl">Criar Pasta</button>
                        </form>
                    </div>
                </div>
            )}

            {showTaskModal && (
                <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl p-12 animate-fade">
                        <div className="flex justify-between items-center mb-10">
                            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                                {editingTaskId ? 'Editar Atividade' : 'Nova Atividade'}
                            </h3>
                            <button onClick={resetTaskForm} className="text-slate-300 hover:text-slate-600"><XCircle size={28} /></button>
                        </div>
                        <form onSubmit={handleSaveTask} className="space-y-8">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição</label>
                                <textarea 
                                    autoFocus
                                    required
                                    rows={4}
                                    placeholder="Descreva a atividade..."
                                    className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-base font-bold"
                                    value={newTaskText}
                                    onChange={(e) => setNewTaskText(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Prazo</label>
                                    <input 
                                        type="date"
                                        className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold"
                                        value={newTaskDeadline}
                                        onChange={(e) => setNewTaskDeadline(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Prioridade</label>
                                    <select 
                                        className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-700"
                                        value={newTaskPriority}
                                        onChange={(e) => setNewTaskPriority(e.target.value as any)}
                                    >
                                        <option>Baixa</option>
                                        <option>Média</option>
                                        <option>Alta</option>
                                        <option>Crítica</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tema / Pasta</label>
                                <select 
                                    required
                                    className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-700"
                                    value={newTaskFolder}
                                    onChange={(e) => setNewTaskFolder(e.target.value)}
                                >
                                    <option value="">Selecione um tema...</option>
                                    {folders.map(f => (
                                        <option key={f.id} value={f.id}>{f.name}</option>
                                    ))}
                                </select>
                            </div>

                            <button className="w-full py-6 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all text-sm">
                                {editingTaskId ? 'Atualizar Atividade' : 'Salvar Atividade'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TodoView;
