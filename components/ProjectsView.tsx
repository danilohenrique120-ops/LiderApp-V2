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
    Layout
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
        status: 'todo',
        priority: 'medium',
        dueDate: new Date().toISOString().split('T')[0],
        budget: 0,
        teamName: ''
    });
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
                teamName: project.teamName || ''
            });
        } else {
            setEditingProject(null);
            setFormData({
                title: '',
                description: '',
                status: 'todo',
                priority: 'medium',
                dueDate: new Date().toISOString().split('T')[0],
                budget: 0,
                teamName: ''
            });
        }
        setIsModalOpen(true);
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
                        <div className={`p-2 rounded-lg ${status === 'todo' ? 'bg-slate-800' : status === 'in-progress' ? 'bg-blue-900/30' : 'bg-emerald-900/30'}`}>
                            {React.createElement(icon, { size: 16, className: status === 'todo' ? 'text-slate-400' : status === 'in-progress' ? 'text-blue-400' : 'text-emerald-400' })}
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
                                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${getPriorityColor(project.priority)}`}>
                                        {project.priority === 'high' ? 'Alta' : project.priority === 'medium' ? 'Média' : 'Baixa'}
                                    </span>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openModal(project)} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-blue-400"><Edit2 size={14} /></button>
                                        <button onClick={() => handleDelete(project.id)} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-rose-400"><Trash2 size={14} /></button>
                                    </div>
                                </div>

                                <h4 className="font-bold text-white mb-2 leading-snug">{project.title}</h4>
                                {project.description && <p className="text-slate-400 text-xs line-clamp-2 mb-3">{project.description}</p>}

                                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-700/50">
                                    <div className="flex items-center gap-1 text-slate-500">
                                        <Calendar size={12} />
                                        <span className="text-[10px] font-bold">
                                            {project.dueDate ? format(parseISO(project.dueDate), 'dd/MM', { locale: ptBR }) : '-'}
                                        </span>
                                    </div>

                                    {/* Simplified Move Action */}
                                    <div className="flex bg-slate-900 rounded-lg p-0.5">
                                        {status !== 'todo' && (
                                            <button onClick={() => handleStatusChange(project.id, 'todo')} className="p-1 hover:bg-slate-700 rounded text-slate-500 hover:text-white" title="Mover para A Fazer">
                                                <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                                            </button>
                                        )}
                                        {status !== 'in-progress' && (
                                            <button onClick={() => handleStatusChange(project.id, 'in-progress')} className="p-1 hover:bg-slate-700 rounded text-slate-500 hover:text-blue-400" title="Mover para Em Andamento">
                                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
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

            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden min-h-0 pb-2">
                {renderColumn('A Fazer', 'todo', AlertCircle)}
                {renderColumn('Em Execução', 'in-progress', Clock)}
                {renderColumn('Concluído', 'done', CheckCircle2)}
            </div>

            {/* Modal de Criação/Edição */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                            <h3 className="text-white font-black uppercase tracking-wider">{editingProject ? 'Editar Projeto' : 'Novo Projeto'}</h3>
                            <button onClick={closeModal} className="text-slate-400 hover:text-white"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Título</label>
                                <input
                                    autoFocus
                                    type="text"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full !bg-slate-800 !text-white border-2 border-slate-700/50 rounded-lg px-4 py-3 placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all font-bold"
                                    style={{ colorScheme: 'dark' }}
                                    placeholder="Ex: Instalação de Sensores Linha 2"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Nome do Time / Responsável</label>
                                <input
                                    type="text"
                                    value={formData.teamName || ''}
                                    onChange={e => setFormData({ ...formData, teamName: e.target.value })}
                                    className="w-full !bg-slate-800 !text-white border-2 border-slate-700/50 rounded-lg px-4 py-3 placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all font-bold"
                                    style={{ colorScheme: 'dark' }}
                                    placeholder="Ex: Manutenção Mecânica, Equipe Alpha..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Status</label>
                                    <div className="relative">
                                        <select
                                            value={formData.status}
                                            onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                                            className="w-full !bg-slate-800 !text-white border-2 border-slate-700/50 rounded-lg px-4 py-3 appearance-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all font-bold"
                                        >
                                            <option value="todo">A Fazer</option>
                                            <option value="in-progress">Em Execução</option>
                                            <option value="done">Concluído</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Prioridade</label>
                                    <div className="relative">
                                        <select
                                            value={formData.priority}
                                            onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
                                            className="w-full !bg-slate-800 !text-white border-2 border-slate-700/50 rounded-lg px-4 py-3 appearance-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all font-bold"
                                        >
                                            <option value="low">Baixa</option>
                                            <option value="medium">Média</option>
                                            <option value="high">Alta</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Data de Entrega</label>
                                    <input
                                        type="date"
                                        value={formData.dueDate}
                                        onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                                        className="w-full !bg-slate-800 !text-white border-2 border-slate-700/50 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all font-bold"
                                        style={{ colorScheme: 'dark' }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Budget (R$)</label>
                                    <input
                                        type="number"
                                        value={formData.budget}
                                        onChange={e => setFormData({ ...formData, budget: Number(e.target.value) })}
                                        className="w-full !bg-slate-800 !text-white border-2 border-slate-700/50 rounded-lg px-4 py-3 placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all font-bold"
                                        placeholder="0.00"
                                        style={{ colorScheme: 'dark' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Descrição</label>
                                <textarea
                                    rows={3}
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full !bg-slate-800 !text-white border-2 border-slate-700/50 rounded-lg px-4 py-3 placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none transition-all font-bold"
                                    placeholder="Detalhes do projeto..."
                                    style={{ colorScheme: 'dark' }}
                                />
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20 flex justify-center items-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : 'Salvar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectsView;
