import React, { useState, useEffect } from 'react';
import {
    Plus,
    Calendar,
    MoreVertical,
    Edit2,
    Trash2,
    X,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Clock,
    DollarSign,
    Layout,
    Users,
    AlertTriangle
} from 'lucide-react';
import { Project } from '../types';
import { ProjectService } from '../services/ProjectService';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProjectsViewProps {
    userPlan?: string;
}

const ProjectsView: React.FC<ProjectsViewProps> = ({ userPlan }) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [formData, setFormData] = useState<Partial<Project>>({
        title: '',
        description: '',
        status: 'planning',
        priority: 'medium',
        dueDate: new Date().toISOString().split('T')[0],
        budget: 0,
        teamName: '',
        progress: 0,
        members: [],
        actions: []
    });
    const [membersInput, setMembersInput] = useState('');
    const [newActionInput, setNewActionInput] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (userPlan !== 'pro') return; // Don't subscribe if not pro

        const unsubscribe = ProjectService.subscribeToProjects(
            (data) => {
                setProjects(data);
                setLoading(false);
            },
            (error) => {
                console.error("Projects subscription error:", error);
                setLoading(false);
                alert("Erro ao carregar projetos. Verifique o console.");
            }
        );
        return () => unsubscribe();
    }, [userPlan]);

    if (userPlan !== 'pro') {
        return (
            <div className="h-[calc(100vh-100px)] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                <div className="bg-slate-900 border border-slate-700/50 p-10 rounded-[2.5rem] max-w-2xl shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-5">
                        <DollarSign size={200} className="text-blue-500" />
                    </div>

                    <div className="w-20 h-20 bg-blue-600/20 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/10">
                        <Layout size={40} />
                    </div>

                    <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-4">
                        Funcionalidade Exclusiva <span className="text-blue-500">Líder Pro</span>
                    </h2>

                    <p className="text-slate-400 text-lg mb-8 font-medium leading-relaxed">
                        A Gestão de Projetos Avançada com Kanban é uma ferramenta de alta performance para supervisores que precisam entregar resultados.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 text-left max-w-lg mx-auto">
                        <div className="flex items-center gap-3 text-slate-300 font-bold text-sm">
                            <CheckCircle2 size={18} className="text-blue-500" /> Gestão Visual Kanban
                        </div>
                        <div className="flex items-center gap-3 text-slate-300 font-bold text-sm">
                            <CheckCircle2 size={18} className="text-blue-500" /> Prazos e Prioridades
                        </div>
                        <div className="flex items-center gap-3 text-slate-300 font-bold text-sm">
                            <CheckCircle2 size={18} className="text-blue-500" /> Delegação de Times
                        </div>
                        <div className="flex items-center gap-3 text-slate-300 font-bold text-sm">
                            <CheckCircle2 size={18} className="text-blue-500" /> Orçamento e Custos
                        </div>
                    </div>

                    <a
                        href="https://buy.stripe.com/test_bJe6oH9LNeCTaSt90mabK01"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-600/20 transition-all hover:scale-105"
                    >
                        Desbloquear Agora <DollarSign size={16} />
                    </a>

                    <p className="text-[10px] text-slate-500 font-bold mt-4 uppercase tracking-widest">
                        Acesso imediato após confirmação
                    </p>
                </div>
            </div>
        );
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title) return;

        setIsSaving(true);
        try {
            if (editingProject) {
                await ProjectService.updateProject(editingProject.id, formData);
            } else {
                await ProjectService.addProject(formData as any);
            }
            closeModal();
        } catch (error) {
            alert('Erro ao salvar projeto');
        } finally {
            setIsSaving(false);
        }
    };

    // Helper to generate avatars from input
    const handleMembersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMembersInput(e.target.value);
        const initials = e.target.value.split(',').map(name => {
            const trimmed = name.trim();
            if (!trimmed) return '';
            const parts = trimmed.split(' ');
            if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }).filter(Boolean);
        setFormData(prev => ({ ...prev, members: initials }));
    };

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir este projeto?')) {
            try {
                await ProjectService.deleteProject(id);
            } catch (error) {
                alert('Erro ao excluir projeto');
            }
        }
    };

    const handleStatusChange = async (id: string, newStatus: Project['status']) => {
        try {
            await ProjectService.updateStatus(id, newStatus);
        } catch (error) {
            console.error("Erro ao mover card", error);
        }
    };

    const openModal = (project?: Project) => {
        if (project) {
            setEditingProject(project);
            setFormData({
                title: project.title,
                description: project.description,
                status: project.status,
                priority: project.priority,
                dueDate: project.dueDate,
                budget: project.budget || 0,
                teamName: project.teamName || '',
                progress: project.progress || 0,
                members: project.members || [],
                actions: project.actions || []
            });
            setMembersInput(project.members ? project.members.join(', ') : '');
        } else {
            setEditingProject(null);
            setFormData({
                title: '',
                description: '',
                status: 'planning',
                priority: 'medium',
                dueDate: new Date().toISOString().split('T')[0],
                budget: 0,
                teamName: '',
                progress: 0,
                members: []
            });
            setMembersInput('');
            setNewActionInput('');
        }
        setIsModalOpen(true);
    };

    const handleAddAction = () => {
        if (!newActionInput.trim()) return;

        const newAction = {
            id: crypto.randomUUID(),
            title: newActionInput.trim(),
            completed: false
        };

        const updatedActions = [...(formData.actions || []), newAction];

        // Auto-calc progress
        const completed = updatedActions.filter(a => a.completed).length;
        const progress = Math.round((completed / updatedActions.length) * 100);

        setFormData(prev => ({
            ...prev,
            actions: updatedActions,
            progress
        }));
        setNewActionInput('');
    };

    const handleToggleAction = (actionId: string) => {
        const updatedActions = (formData.actions || []).map(a =>
            a.id === actionId ? { ...a, completed: !a.completed } : a
        );

        // Auto-calc progress
        const completed = updatedActions.filter(a => a.completed).length;
        const progress = Math.round((completed / updatedActions.length) * 100);

        setFormData(prev => ({
            ...prev,
            actions: updatedActions,
            progress
        }));
    };

    const handleUpdateAction = (actionId: string, field: 'title' | 'deadline', value: string) => {
        const updatedActions = (formData.actions || []).map(a =>
            a.id === actionId ? { ...a, [field]: value } : a
        );
        setFormData(prev => ({ ...prev, actions: updatedActions }));
    };

    const handleDeleteAction = (actionId: string) => {
        const updatedActions = (formData.actions || []).filter(a => a.id !== actionId);

        // Auto-calc progress
        const completed = updatedActions.filter(a => a.completed).length;
        const progress = updatedActions.length > 0 ? Math.round((completed / updatedActions.length) * 100) : 0;

        setFormData(prev => ({
            ...prev,
            actions: updatedActions,
            progress
        }));
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingProject(null);
    };

    const getPriorityColor = (p: string) => {
        switch (p) {
            case 'high': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
            case 'medium': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
            case 'low': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
            default: return 'bg-slate-700 text-slate-400';
        }
    };

    const renderColumn = (title: string, status: Project['status'], icon: any) => {
        const columnProjects = projects.filter(p => p.status === status);

        return (
            <div className="flex flex-col h-full bg-slate-900/50 rounded-2xl border border-slate-800/50 backdrop-blur-sm overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/90 z-10 backdrop-blur-md">
                    <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${status === 'planning' ? 'bg-slate-800' : status === 'in-progress' ? 'bg-blue-900/30' : status === 'blocked' ? 'bg-amber-900/30' : 'bg-emerald-900/30'}`}>
                            {React.createElement(icon, { size: 16, className: status === 'planning' ? 'text-slate-400' : status === 'in-progress' ? 'text-blue-400' : status === 'blocked' ? 'text-amber-400' : 'text-emerald-400' })}
                        </div>
                        <h3 className="font-bold text-slate-300 text-sm uppercase tracking-wider">{title}</h3>
                    </div>
                    <span className="bg-slate-800 text-slate-400 text-xs font-bold px-2 py-1 rounded-md">{columnProjects.length}</span>
                </div>

                <div className="flex-1 p-3 overflow-y-auto custom-scrollbar space-y-3">
                    {columnProjects.length === 0 ? (
                        <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-xl m-2">
                            <p className="text-slate-600 text-xs font-bold uppercase tracking-widest">Vazio</p>
                        </div>
                    ) : (
                        columnProjects.map(project => (
                            <div key={project.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 hover:border-blue-500/50 hover:shadow-lg transition-all group animate-fade-in relative">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex flex-col gap-1">
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border w-fit ${getPriorityColor(project.priority)}`}>
                                            {project.priority === 'high' ? 'Alta Prioridade' : project.priority === 'medium' ? 'Prioridade Média' : 'Prioridade Baixa'}
                                        </span>
                                        <h4 className="font-bold text-white leading-snug text-sm">{project.title}</h4>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openModal(project)} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-blue-400"><Edit2 size={12} /></button>
                                        <button onClick={() => handleDelete(project.id)} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-rose-400"><Trash2 size={12} /></button>
                                    </div>
                                </div>

                                {/* Team & Members */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        {project.teamName && (
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-900/50 px-2 py-1 rounded">
                                                {project.teamName}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex -space-x-1.5">
                                        {project.members && project.members.map((m, i) => (
                                            <div key={i} className="w-6 h-6 rounded-full bg-slate-700 border border-slate-800 flex items-center justify-center text-[8px] font-bold text-white shadow-sm ring-2 ring-slate-800" title={m}>
                                                {m}
                                            </div>
                                        ))}
                                        {(!project.members || project.members.length === 0) && (
                                            <div className="w-6 h-6 rounded-full bg-slate-700/50 border border-slate-700 border-dashed flex items-center justify-center text-[8px] text-slate-500">
                                                ?
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Footer Info */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                        <span>Progresso</span>
                                        <span>{project.progress || 0}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${(project.progress || 0) === 100 ? 'bg-emerald-500' :
                                                (project.progress || 0) > 50 ? 'bg-blue-500' : 'bg-amber-500'
                                                }`}
                                            style={{ width: `${project.progress || 0}%` }}
                                        ></div>
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
                                        <div className={`flex items-center gap-1.5 text-[10px] font-bold ${new Date(project.dueDate) < new Date() && project.status !== 'done' ? 'text-rose-400' : 'text-slate-400'
                                            }`}>
                                            <Clock size={12} />
                                            <span>
                                                {project.dueDate ? format(parseISO(project.dueDate), "dd MMM", { locale: ptBR }).toUpperCase() : '-'}
                                            </span>
                                        </div>

                                        {/* Move Actions */}
                                        <div className="flex bg-slate-900 rounded-lg p-0.5">
                                            {status !== 'planning' && (
                                                <button onClick={() => handleStatusChange(project.id, 'planning')} className="p-1 hover:bg-slate-700 rounded text-slate-500 hover:text-white" title="Mover para Planejamento">
                                                    <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                                                </button>
                                            )}
                                            {status !== 'in-progress' && (
                                                <button onClick={() => handleStatusChange(project.id, 'in-progress')} className="p-1 hover:bg-slate-700 rounded text-slate-500 hover:text-blue-400" title="Mover para Em Andamento">
                                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                </button>
                                            )}
                                            {status !== 'blocked' && (
                                                <button onClick={() => handleStatusChange(project.id, 'blocked')} className="p-1 hover:bg-slate-700 rounded text-slate-500 hover:text-amber-400" title="Mover para Em Pausa/Bloqueado">
                                                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                                </button>
                                            )}
                                            {status !== 'done' && (
                                                <button onClick={() => handleStatusChange(project.id, 'done')} className="p-1 hover:bg-slate-700 rounded text-slate-500 hover:text-emerald-400" title="Mover para Concluído">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    };

    if (loading) return (
        <div className="h-[calc(100vh-100px)] flex flex-col items-center justify-center">
            <Loader2 size={40} className="text-blue-500 animate-spin mb-4" />
            <p className="text-slate-400 text-sm font-bold animate-pulse">Carregando Projetos...</p>
        </div>
    );

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col">
            <header className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tighter uppercase flex items-center gap-3">
                        <Layout className="text-blue-500" />
                        Gestão de Projetos
                    </h2>
                    <p className="text-slate-400 text-sm font-medium mt-1">Acompanhe o andamento das iniciativas da unidade.</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                >
                    <Plus size={16} /> Novo Projeto
                </button>
            </header>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 overflow-hidden min-h-0 pb-2">
                {renderColumn('Planejamento', 'planning', Layout)}
                {renderColumn('Em Andamento', 'in-progress', Clock)}
                {renderColumn('Pausado/Bloqueado', 'blocked', AlertTriangle)}
                {renderColumn('Concluído', 'done', CheckCircle2)}
            </div>

            {/* Modal de Criação/Edição */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                        {/* Header */}
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                            <div>
                                <h3 className="text-white text-xl font-black uppercase tracking-wider">{editingProject ? 'Editar Projeto' : 'Novo Projeto'}</h3>
                                <p className="text-slate-400 text-xs font-medium mt-1">Central de Comando do Projeto</p>
                            </div>
                            <button onClick={closeModal} className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-full transition-all"><X size={24} /></button>
                        </div>

                        {/* Body - Scrollable */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <form id="project-form" onSubmit={handleSave} className="p-8 grid grid-cols-12 gap-8">

                                {/* COLUNA ESQUERDA - METADADOS (35%) */}
                                <div className="col-span-12 md:col-span-4 space-y-6 border-r border-slate-800 pr-8">
                                    <h4 className="text-blue-500 font-black uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
                                        <Layout size={14} /> Dados do Projeto
                                    </h4>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Título do Projeto</label>
                                        <input
                                            autoFocus
                                            type="text"
                                            value={formData.title}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full !bg-slate-800 !text-white border-2 border-slate-700/50 rounded-lg px-4 py-3 !placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all font-bold text-sm"
                                            style={{ colorScheme: 'dark' }}
                                            placeholder="Ex: Instalação Sensores"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Status</label>
                                            <div className="relative">
                                                <select
                                                    value={formData.status}
                                                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                                                    className="w-full !bg-slate-800 !text-white border-2 border-slate-700/50 rounded-lg px-3 py-2.5 appearance-none focus:border-blue-500 outline-none transition-all font-bold text-xs"
                                                >
                                                    <option value="planning">Planejamento</option>
                                                    <option value="in-progress">Em Andamento</option>
                                                    <option value="blocked">Em Pausa/Bloqueado</option>
                                                    <option value="done">Concluído</option>
                                                </select>
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Prioridade</label>
                                            <div className="relative">
                                                <select
                                                    value={formData.priority}
                                                    onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
                                                    className="w-full !bg-slate-800 !text-white border-2 border-slate-700/50 rounded-lg px-3 py-2.5 appearance-none focus:border-blue-500 outline-none transition-all font-bold text-xs"
                                                >
                                                    <option value="low">Baixa</option>
                                                    <option value="medium">Média</option>
                                                    <option value="high">Alta</option>
                                                </select>
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Data de Entrega</label>
                                        <input
                                            type="date"
                                            value={formData.dueDate}
                                            onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                                            className="w-full !bg-slate-800 !text-white border-2 border-slate-700/50 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all font-bold text-sm"
                                            style={{ colorScheme: 'dark' }}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Orçamento (R$)</label>
                                        <div className="relative">
                                            <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                            <input
                                                type="number"
                                                value={formData.budget}
                                                onChange={e => setFormData({ ...formData, budget: Number(e.target.value) })}
                                                className="w-full !bg-slate-800 !text-white border-2 border-slate-700/50 rounded-lg pl-9 pr-4 py-3 !placeholder-slate-400 focus:border-blue-500 outline-none transition-all font-bold text-sm"
                                                placeholder="0.00"
                                                style={{ colorScheme: 'dark' }}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Responsável / Time</label>
                                        <input
                                            type="text"
                                            value={formData.teamName || ''}
                                            onChange={e => setFormData({ ...formData, teamName: e.target.value })}
                                            className="w-full !bg-slate-800 !text-white border-2 border-slate-700/50 rounded-lg px-4 py-3 !placeholder-slate-400 focus:border-blue-500 outline-none transition-all font-bold text-sm"
                                            placeholder="Ex: Manutenção"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Membros (Iniciais)</label>
                                        <div className="relative">
                                            <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                            <input
                                                type="text"
                                                value={membersInput}
                                                onChange={handleMembersChange}
                                                className="w-full !bg-slate-800 !text-white border-2 border-slate-700/50 rounded-lg pl-9 pr-4 py-3 !placeholder-slate-400 focus:border-blue-500 outline-none transition-all font-bold text-sm"
                                                placeholder="Separe por vírgula..."
                                            />
                                        </div>
                                        {formData.members && formData.members.length > 0 && (
                                            <div className="flex gap-1 mt-2 flex-wrap">
                                                {formData.members.map((m, i) => (
                                                    <div key={i} className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-black text-white border-2 border-slate-800 shadow-sm">
                                                        {m}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* COLUNA DIREITA - EXECUÇÃO (65%) */}
                                <div className="col-span-12 md:col-span-8 space-y-6 pl-2">
                                    <h4 className="text-emerald-500 font-black uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
                                        <CheckCircle2 size={14} /> Plano de Execução
                                    </h4>

                                    {/* Description */}
                                    <div className="relative">
                                        <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Descrição Detalhada</label>
                                        <textarea
                                            rows={3}
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full !bg-slate-800 !text-white border-2 border-slate-700/50 rounded-xl px-4 py-3 !placeholder-slate-400 focus:border-blue-500 outline-none resize-none transition-all font-medium text-sm leading-relaxed"
                                            placeholder="Descreva o escopo e objetivos do projeto..."
                                            style={{ colorScheme: 'dark' }}
                                        />
                                    </div>

                                    {/* Checklist Pro */}
                                    <div className="bg-slate-950/50 rounded-2xl border border-slate-800 overflow-hidden flex flex-col h-[400px]">
                                        <div className="p-4 border-b border-slate-800/50 bg-slate-900/50 flex justify-between items-center">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                                Checklist de Ações
                                            </label>
                                            <span className={`text-xs font-bold px-2 py-1 rounded-md ${formData.progress === 100 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                                {formData.progress}% Concluído
                                            </span>
                                        </div>

                                        {/* Actions List */}
                                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                                            {(!formData.actions || formData.actions.length === 0) && (
                                                <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-3 opacity-60">
                                                    <div className="p-4 bg-slate-800/50 rounded-full">
                                                        <CheckCircle2 size={32} />
                                                    </div>
                                                    <p className="text-sm font-medium">Nenhuma ação planejada</p>
                                                    <p className="text-xs">Use o campo abaixo para adicionar etapas.</p>
                                                </div>
                                            )}

                                            {formData.actions?.map(action => (
                                                <div key={action.id} className="flex items-center gap-3 bg-slate-800 p-2 rounded-lg border border-slate-700/50 group hover:border-slate-600 transition-all">

                                                    {/* Checkbox */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleAction(action.id)}
                                                        className={`w-5 h-5 flex-shrink-0 rounded-[4px] border-2 flex items-center justify-center transition-all ${action.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-500 hover:border-blue-500 bg-slate-900'
                                                            }`}
                                                    >
                                                        {action.completed && <CheckCircle2 size={12} strokeWidth={3} />}
                                                    </button>

                                                    {/* Editable Name */}
                                                    <input
                                                        type="text"
                                                        value={action.title}
                                                        onChange={(e) => handleUpdateAction(action.id, 'title', e.target.value)}
                                                        className={`flex-1 bg-transparent border-none outline-none text-sm font-medium transition-colors ${action.completed ? '!text-white line-through opacity-70' : '!text-white'}`}
                                                    />

                                                    {/* Deadline Input */}
                                                    <div className="flex items-center gap-1 bg-slate-900 rounded px-2 py-1 border border-slate-700">
                                                        <Calendar size={10} className="text-slate-500" />
                                                        <input
                                                            type="date"
                                                            value={action.deadline || ''}
                                                            onChange={(e) => handleUpdateAction(action.id, 'deadline', e.target.value)}
                                                            className="bg-transparent border-none outline-none text-[10px] !text-white font-bold w-[70px] cursor-pointer"
                                                            style={{ colorScheme: 'dark' }}
                                                        />
                                                    </div>

                                                    {/* Delete */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteAction(action.id)}
                                                        className="text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 p-1.5 rounded transition-colors opacity-0 group-hover:opacity-100"
                                                        title="Remover ação"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Add Action Bar */}
                                        <div className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
                                            <input
                                                type="text"
                                                value={newActionInput}
                                                onChange={e => setNewActionInput(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleAddAction();
                                                    }
                                                }}
                                                className="flex-1 !bg-slate-800 !text-white border-2 border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:border-blue-500 outline-none transition-all font-medium !placeholder-slate-400"
                                                placeholder="Adicionar nova etapa (Enter)..."
                                            />
                                            <button
                                                type="button"
                                                onClick={handleAddAction}
                                                className="bg-blue-600 hover:bg-blue-500 text-white px-4 rounded-lg transition-colors font-bold shadow-lg shadow-blue-500/20"
                                            >
                                                <Plus size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Sticky Footer */}
                        <div className="p-6 border-t border-slate-800 bg-slate-950 flex justify-end gap-3 z-20">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave} // Trigger form submit via function
                                disabled={isSaving}
                                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : 'Salvar Projeto'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectsView;
