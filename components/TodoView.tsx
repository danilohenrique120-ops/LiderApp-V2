
import React, { useState, useMemo } from 'react';
import { 
    FolderPlus, 
    Plus, 
    Trash2, 
    Search, 
    Calendar, 
    AlertCircle, 
    CheckCircle2, 
    Circle, 
    ChevronRight,
    Tag,
    Clock,
    MoreVertical,
    Folder,
    // Added missing icon imports
    Grid,
    ListTodo,
    XCircle
} from 'lucide-react';
import { TodoFolder, TodoTask } from '../types';
// @ts-ignore
import firebase from 'firebase/compat/app';

interface TodoViewProps {
    folders: TodoFolder[];
    tasks: TodoTask[];
    user: any;
    db: any;
}

const TodoView: React.FC<TodoViewProps> = ({ folders, tasks, user, db }) => {
    const [activeFolderId, setActiveFolderId] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showFolderModal, setShowFolderModal] = useState(false);
    const [showTaskModal, setShowTaskModal] = useState(false);
    
    const [newFolderName, setNewFolderName] = useState('');
    const [newFolderColor, setNewFolderColor] = useState('#3b82f6');
    
    const [newTaskText, setNewTaskText] = useState('');
    const [newTaskDeadline, setNewTaskDeadline] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState<'Baixa' | 'Média' | 'Alta' | 'Crítica'>('Média');
    const [newTaskFolder, setNewTaskFolder] = useState('');

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

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskText.trim()) return;
        await db.collection('todo_tasks').add({
            text: newTaskText,
            deadline: newTaskDeadline,
            priority: newTaskPriority,
            folderId: newTaskFolder || activeFolderId === 'all' ? (folders[0]?.id || '') : activeFolderId,
            completed: false,
            uid: user.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        setNewTaskText('');
        setNewTaskDeadline('');
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

    const getStatusInfo = (deadline: string, completed: boolean) => {
        if (completed) return { label: 'Concluído', class: 'bg-emerald-100 text-emerald-600', pulse: false };
        if (!deadline) return null;

        const today = new Date();
        today.setHours(0,0,0,0);
        // Fix: Use local time interpretation for YYYY-MM-DD strings
        const due = new Date(deadline + 'T00:00:00');
        due.setHours(0,0,0,0);
        
        const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { label: 'Atrasado', class: 'bg-red-100 text-red-600 font-black', pulse: true };
        if (diffDays === 0) return { label: 'Vence Hoje', class: 'bg-orange-100 text-orange-600 font-bold', pulse: false };
        if (diffDays <= 3) return { label: `Em ${diffDays} dias`, class: 'bg-blue-100 text-blue-600', pulse: false };
        
        return null;
    };

    const filteredTasks = useMemo(() => {
        return tasks.filter(t => {
            const matchesSearch = t.text.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFolder = activeFolderId === 'all' ? true : t.folderId === activeFolderId;
            return matchesSearch && matchesFolder;
        }).sort((a, b) => {
            if (a.completed !== b.completed) return a.completed ? 1 : -1;
            // Fix: Use local time interpretation for sorting as well
            const dateA = a.deadline ? new Date(a.deadline + 'T00:00:00').getTime() : 9999999999999;
            const dateB = b.deadline ? new Date(b.deadline + 'T00:00:00').getTime() : 9999999999999;
            return dateA - dateB;
        });
    }, [tasks, activeFolderId, searchQuery]);

    return (
        <div className="flex flex-col lg:flex-row gap-8 animate-fade h-[calc(100vh-160px)]">
            {/* Folder Sidebar */}
            <aside className="w-full lg:w-72 flex flex-col gap-4">
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pastas / Temas</h3>
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

            {/* Main Content */}
            <section className="flex-1 flex flex-col gap-6 overflow-hidden">
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 flex flex-col h-full">
                    {/* Header/Filters */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                        <div className="relative flex-1 w-full max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            <input 
                                type="text"
                                placeholder="Pesquisar tarefas..."
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button 
                            onClick={() => {
                                if(activeFolderId !== 'all') setNewTaskFolder(activeFolderId);
                                setShowTaskModal(true);
                            }}
                            className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-black uppercase text-xs shadow-xl flex items-center gap-2 hover:scale-105 transition-all w-full md:w-auto justify-center"
                        >
                            <Plus size={18} /> Adicionar Tarefa
                        </button>
                    </div>

                    {/* Task List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                        {filteredTasks.length > 0 ? (
                            filteredTasks.map(task => {
                                const status = getStatusInfo(task.deadline, task.completed);
                                const folder = folders.find(f => f.id === task.folderId);
                                
                                return (
                                    <div 
                                        key={task.id} 
                                        className={`group bg-white border p-6 rounded-[2rem] transition-all flex items-center gap-4 hover:shadow-md ${task.completed ? 'opacity-60 bg-slate-50 border-slate-100' : 'border-slate-100 shadow-sm'}`}
                                    >
                                        <button 
                                            onClick={() => toggleTask(task)}
                                            className={`transition-colors ${task.completed ? 'text-emerald-500' : 'text-slate-300 hover:text-blue-500'}`}
                                        >
                                            {task.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                                        </button>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className={`text-sm font-bold truncate ${task.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                                                    {task.text}
                                                </h4>
                                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${priorityColors[task.priority]}`}>
                                                    {task.priority}
                                                </span>
                                            </div>
                                            
                                            <div className="flex flex-wrap items-center gap-4">
                                                {folder && (
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: folder.color }}></div>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{folder.name}</span>
                                                    </div>
                                                )}
                                                {task.deadline && (
                                                    <div className="flex items-center gap-1.5 text-slate-400">
                                                        <Calendar size={12} />
                                                        <span className="text-[10px] font-bold">
                                                            {/* Fix: Interpret deadline as local time for display */}
                                                            {new Date(task.deadline + 'T00:00:00').toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {status && (
                                                <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${status.class} ${status.pulse ? 'animate-pulse-red' : ''}`}>
                                                    {status.label}
                                                </span>
                                            )}
                                            <button 
                                                onClick={() => deleteTask(task.id)}
                                                className="p-2 text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center py-32 text-slate-300">
                                <ListTodo size={64} strokeWidth={1} className="mb-4 opacity-20" />
                                <p className="text-sm font-black uppercase tracking-widest">Nenhuma tarefa encontrada</p>
                                <p className="text-[10px] font-medium mt-1">Experimente mudar o filtro ou criar uma nova tarefa.</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Modals */}
            {showFolderModal && (
                <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 animate-fade">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Novo Tema / Pasta</h3>
                            <button onClick={() => setShowFolderModal(false)} className="text-slate-300 hover:text-slate-600"><XCircle size={24} /></button>
                        </div>
                        <form onSubmit={handleCreateFolder} className="space-y-6">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Tema</label>
                                <input 
                                    autoFocus
                                    required
                                    placeholder="Ex: Projetos de Engenharia"
                                    className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none"
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cor de Identificação</label>
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
                            <button className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl">Criar Tema</button>
                        </form>
                    </div>
                </div>
            )}

            {showTaskModal && (
                <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-10 animate-fade">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Nova Tarefa</h3>
                            <button onClick={() => setShowTaskModal(false)} className="text-slate-300 hover:text-slate-600"><XCircle size={24} /></button>
                        </div>
                        <form onSubmit={handleCreateTask} className="space-y-6">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição da Atividade</label>
                                <textarea 
                                    autoFocus
                                    required
                                    rows={3}
                                    placeholder="O que precisa ser feito?"
                                    className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm font-medium"
                                    value={newTaskText}
                                    onChange={(e) => setNewTaskText(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Prazo de Entrega</label>
                                    <input 
                                        type="date"
                                        className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none"
                                        value={newTaskDeadline}
                                        onChange={(e) => setNewTaskDeadline(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Importância</label>
                                    <select 
                                        className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-700"
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
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mover para Pasta</label>
                                <select 
                                    required
                                    className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-700"
                                    value={newTaskFolder}
                                    onChange={(e) => setNewTaskFolder(e.target.value)}
                                >
                                    <option value="">Selecionar pasta...</option>
                                    {folders.map(f => (
                                        <option key={f.id} value={f.id}>{f.name}</option>
                                    ))}
                                </select>
                            </div>

                            <button className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl">Salvar Tarefa</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TodoView;
