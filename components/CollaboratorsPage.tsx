
import React, { useState, useMemo, useEffect } from 'react';
import { 
    Search, 
    Filter, 
    UserPlus, 
    MoreHorizontal, 
    Mail, 
    Briefcase, 
    MapPin, 
    ChevronDown,
    User,
    X,
    CheckCircle2,
    Clock,
    UserMinus,
    Calendar,
    Clock3,
    Trash2,
    Plus,
    Save,
    Loader2,
    RefreshCw
} from 'lucide-react';
// @ts-ignore
import firebase from 'firebase/compat/app';
import { Operator, SkillConfig } from '../types';
import { ROLE_OPTIONS, PREREQUISITE_RULES } from '../constants';

const CollaboratorsPage: React.FC = () => {
    // --- ESTADOS ---
    const [operators, setOperators] = useState<Operator[]>([]);
    const [skills, setSkills] = useState<SkillConfig[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('todos');
    const [deptFilter, setDeptFilter] = useState<string>('todos');
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    // --- ESTADO DO FORMULÁRIO ---
    const [formData, setFormData] = useState({
        nome: '',
        cargo: 'Operador I',
        email: '',
        turno: 'Turno A',
        escala: '6x1',
        status: 'ativo' as Operator['status'],
        departamento: 'Produção'
    });

    // --- FIREBASE SYNC ---
    useEffect(() => {
        const user = firebase.auth().currentUser;
        if (!user) return;

        const unsubscribeOps = firebase.firestore().collection('operators')
            .where('uid', '==', user.uid)
            .onSnapshot(s => setOperators(s.docs.map(d => ({ ...d.data(), id: d.id } as Operator))));

        const unsubscribeSkills = firebase.firestore().collection('skills_config')
            .where('uid', '==', user.uid)
            .onSnapshot(s => setSkills(s.docs.map(d => ({ ...d.data(), id: d.id } as SkillConfig))));

        return () => {
            unsubscribeOps();
            unsubscribeSkills();
        };
    }, []);

    // --- LÓGICA DE ATUALIZAÇÃO DE STATUS ---
    const handleStatusUpdate = async (id: string, newStatus: Operator['status']) => {
        setUpdatingId(id);
        try {
            await firebase.firestore().collection('operators').doc(id).update({
                status: newStatus
            });
        } catch (error) {
            console.error("Erro ao atualizar status:", error);
            alert("Não foi possível atualizar o status.");
        } finally {
            setUpdatingId(null);
        }
    };

    // --- LÓGICA DE CADASTRO ---
    const handleAddOperator = async (e: React.FormEvent) => {
        e.preventDefault();
        const user = firebase.auth().currentUser;
        if (!user || isSaving) return;

        setIsSaving(true);
        try {
            const skillsMap = skills.reduce((acc, s) => {
                const skillRule = PREREQUISITE_RULES[s.name];
                const defaultP = skillRule ? (skillRule[formData.cargo] ?? 2) : 2;
                return { ...acc, [s.name]: { p: defaultP, r: 0 } };
            }, {});

            await firebase.firestore().collection('operators').add({
                name: formData.nome,
                role: formData.cargo,
                email: formData.email,
                shift: formData.turno,
                schedule: formData.escala,
                status: formData.status,
                departamento: formData.departamento,
                skills: skillsMap,
                uid: user.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            setShowAddModal(false);
            setFormData({
                nome: '',
                cargo: 'Operador I',
                email: '',
                turno: 'Turno A',
                escala: '6x1',
                status: 'ativo',
                departamento: 'Produção'
            });
        } catch (error) {
            console.error("Erro ao cadastrar:", error);
            alert("Erro ao salvar colaborador.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Deseja realmente excluir este colaborador?")) {
            await firebase.firestore().collection('operators').doc(id).delete();
        }
    };

    // --- LÓGICA DE FILTRAGEM ---
    const filteredData = useMemo(() => {
        return operators.filter(colab => {
            const matchesSearch = colab.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                colab.role.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'todos' || colab.status === statusFilter;
            // Fix: Using a fallback 'Geral' for departamento to match the departamentos list and ensure filtering works correctly for operators without a department set.
            const matchesDept = deptFilter === 'todos' || (colab.departamento || 'Geral') === deptFilter;
            
            return matchesSearch && matchesStatus && matchesDept;
        });
    }, [operators, searchTerm, statusFilter, deptFilter]);

    // --- COMPONENTE DO SELETOR DE STATUS ---
    const StatusSelector = ({ colab }: { colab: Operator }) => {
        const configs = {
            ativo: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-400', icon: CheckCircle2, label: 'Ativo' },
            ferias: { color: 'bg-amber-50 text-amber-700 border-amber-200 hover:border-amber-400', icon: Clock, label: 'Em Férias' },
            desligado: { color: 'bg-rose-50 text-rose-700 border-rose-200 hover:border-rose-400', icon: UserMinus, label: 'Desligado' }
        };
        const config = configs[colab.status] || configs.ativo;
        const Icon = config.icon;
        const isUpdating = updatingId === colab.id;

        return (
            <div className="relative group/status min-w-[120px]">
                {isUpdating ? (
                    <div className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-400 border border-slate-200 text-[9px] font-black uppercase tracking-wider">
                        <RefreshCw size={10} className="animate-spin" /> Atualizando
                    </div>
                ) : (
                    <div className="relative">
                        <select
                            value={colab.status}
                            onChange={(e) => handleStatusUpdate(colab.id, e.target.value as any)}
                            className={`appearance-none w-full pl-8 pr-8 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider border cursor-pointer transition-all outline-none z-10 relative bg-transparent ${config.color}`}
                        >
                            <option value="ativo" className="bg-white text-emerald-700">Ativo</option>
                            <option value="ferias" className="bg-white text-amber-700">Em Férias</option>
                            <option value="desligado" className="bg-white text-rose-700">Desligado</option>
                        </select>
                        <div className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${config.color.split(' ')[1]}`}>
                            <Icon size={12} strokeWidth={3} />
                        </div>
                        <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 ${config.color.split(' ')[1]}`}>
                            <ChevronDown size={10} strokeWidth={3} />
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    const departamentos = ['todos', ...new Set(operators.map(c => c.departamento || 'Geral'))];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade">
            
            {/* 1. HEADER E AÇÕES PRINCIPAIS */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-3xl font-black text-slate-100 tracking-tighter uppercase leading-none">Gestão de Colaboradores</h1>
                    <p className="text-slate-400 text-sm font-medium mt-2 uppercase tracking-widest text-[10px]">Controle de ativos e disponibilidade de time</p>
                </div>
                <button 
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-200 transition-all hover:scale-105 active:scale-95"
                >
                    <UserPlus size={18} /> Novo Colaborador
                </button>
            </div>

            {/* 2. TOOLBAR DE BUSCA E FILTROS */}
            <div className="flex flex-col gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                        <input 
                            type="text"
                            placeholder="Buscar por nome ou cargo..."
                            className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-bold text-slate-700 shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
                        className={`p-4 rounded-[1.5rem] border transition-all flex items-center gap-2 font-black uppercase text-[10px] tracking-widest ${isFilterPanelOpen ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                    >
                        <Filter size={20} />
                        <span className="hidden sm:inline">Filtros</span>
                        {(statusFilter !== 'todos' || deptFilter !== 'todos') && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                        )}
                    </button>
                </div>

                {isFilterPanelOpen && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6 bg-slate-50 rounded-[2rem] border border-slate-200 animate-fade">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Filtrar por Status</label>
                            <select 
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="todos">Todos os Status</option>
                                <option value="ativo">Ativos</option>
                                <option value="ferias">Em Férias</option>
                                <option value="desligado">Desligados</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Filtrar por Departamento</label>
                            <select 
                                value={deptFilter}
                                onChange={(e) => setDeptFilter(e.target.value)}
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {departamentos.map(d => (
                                    <option key={d} value={d}>{d === 'todos' ? 'Todos os Departamentos' : d}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button 
                                onClick={() => { setStatusFilter('todos'); setDeptFilter('todos'); setSearchTerm(''); }}
                                className="w-full p-3 text-[9px] font-black text-slate-400 uppercase hover:text-red-500 transition-colors flex items-center justify-center gap-2"
                            >
                                <X size={14} /> Limpar Filtros
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* 3. LISTAGEM DE COLABORADORES */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Colaborador</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargo e Área</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Escala / Turno</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status Operacional</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredData.map((colab) => (
                                <tr key={colab.id} className="group hover:bg-slate-50/80 transition-all cursor-default">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xs shadow-lg shadow-slate-200 group-hover:scale-110 transition-transform">
                                                {getInitials(colab.name)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 text-sm leading-none mb-1.5">{colab.name}</p>
                                                <p className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                                                    <Mail size={10} /> {colab.email || 'Sem e-mail'}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                                <Briefcase size={12} className="text-slate-400" /> {colab.role}
                                            </p>
                                            <p className="text-[10px] font-black text-blue-500 uppercase tracking-tight flex items-center gap-1.5">
                                                <MapPin size={10} /> {colab.departamento || 'Geral'}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                                <Clock3 size={12} className="text-slate-400" /> {colab.shift || 'N/A'}
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-tight">
                                                <Calendar size={12} className="text-slate-300" /> {colab.schedule || 'N/A'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <div className="flex justify-center">
                                            <StatusSelector colab={colab} />
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => handleDelete(colab.id)}
                                                className="p-3 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredData.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade">
                        <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-[2rem] flex items-center justify-center mb-6">
                            <User size={40} />
                        </div>
                        <h3 className="text-lg font-black text-slate-400 uppercase tracking-tighter">Nenhum resultado encontrado</h3>
                        <p className="text-slate-400 text-xs mt-2 font-medium">Tente ajustar seus filtros ou termos de busca.</p>
                    </div>
                )}
            </div>

            {/* --- MODAL DE CADASTRO --- */}
            {showAddModal && (
                <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade">
                    <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-8 border-b flex justify-between items-center bg-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg">
                                    <UserPlus size={20} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Novo Colaborador</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Preencha o perfil completo</p>
                                </div>
                            </div>
                            <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><X size={24} /></button>
                        </div>

                        <form onSubmit={handleAddOperator} className="p-8 overflow-y-auto custom-scrollbar space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                                    <input required placeholder="Ex: Alessandro Silva" className="w-full px-5 py-3 rounded-2xl border bg-slate-50 font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cargo / Função</label>
                                    <select className="w-full px-5 py-3 rounded-2xl border bg-slate-50 font-bold outline-none focus:ring-2 focus:ring-blue-500" value={formData.cargo} onChange={e => setFormData({...formData, cargo: e.target.value})}>
                                        {ROLE_OPTIONS.map(role => <option key={role} value={role}>{role}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Corporativo</label>
                                    <input type="email" placeholder="nome@empresa.com" className="w-full px-5 py-3 rounded-2xl border bg-slate-50 font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Departamento</label>
                                    <input placeholder="Ex: Usinagem" className="w-full px-5 py-3 rounded-2xl border bg-slate-50 font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all" value={formData.departamento} onChange={e => setFormData({...formData, departamento: e.target.value})} />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Turno</label>
                                    <select className="w-full px-5 py-3 rounded-2xl border bg-slate-50 font-bold outline-none focus:ring-2 focus:ring-blue-500" value={formData.turno} onChange={e => setFormData({...formData, turno: e.target.value})}>
                                        <option value="Turno A">Turno A (06:00 - 14:00)</option>
                                        <option value="Turno B">Turno B (14:00 - 22:00)</option>
                                        <option value="Turno C">Turno C (22:00 - 06:00)</option>
                                        <option value="ADM">Administrativo</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Escala</label>
                                    <select className="w-full px-5 py-3 rounded-2xl border bg-slate-50 font-bold outline-none focus:ring-2 focus:ring-blue-500" value={formData.escala} onChange={e => setFormData({...formData, escala: e.target.value})}>
                                        <option value="6x1">6x1</option>
                                        <option value="5x2">5x2</option>
                                        <option value="12x36">12x36</option>
                                        <option value="Flexível">Flexível</option>
                                    </select>
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Situação Inicial</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { id: 'ativo', label: 'Ativo', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                                            { id: 'ferias', label: 'Férias', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
                                            { id: 'desligado', label: 'Desligado', icon: UserMinus, color: 'text-rose-500', bg: 'bg-rose-50' }
                                        ].map(s => (
                                            <button
                                                key={s.id}
                                                type="button"
                                                onClick={() => setFormData({...formData, status: s.id as any})}
                                                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${formData.status === s.id ? 'border-blue-500 bg-blue-50/50 shadow-md' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                                            >
                                                <div className={`p-2 rounded-lg ${s.bg} ${s.color} mb-2`}>
                                                    <s.icon size={18} />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-widest">{s.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={isSaving}
                                className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                                Salvar Colaborador
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .animate-fade { animation: fadeIn 0.3s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
            `}</style>
        </div>
    );
};

export default CollaboratorsPage;
