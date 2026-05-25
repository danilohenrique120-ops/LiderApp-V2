
import React, { useState } from 'react';
import { MessageSquare, Trash2, Calendar, Download, Sparkles, Loader2, Info, Pencil, ChevronDown, ChevronUp, Search, CheckCircle2, Circle, Target, Smile, Meh, Frown, Plus } from 'lucide-react';
import { Meeting, Operator, HumanErrorInvestigation, PDI, MeetingAction } from '../types';
import { AiService } from '../services/AiService';

interface OneOnOneViewProps {
    meetings: Meeting[];
    employees: string[];
    user: any;
    db: any;
}

const OneOnOneView: React.FC<OneOnOneViewProps> = ({ meetings, employees, user, db }) => {
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState<Partial<Meeting>>({ employee: '', date: '', summary: '', recognition: '', improvements: '', employeeActions: '', managerActions: '', actionItems: [], sentiment: undefined });
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [expandedCard, setExpandedCard] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [monthFilter, setMonthFilter] = useState('all');
    const [employeeFilter, setEmployeeFilter] = useState('all');
    const [lastMeeting, setLastMeeting] = useState<Meeting | null>(null);
    const [newActionText, setNewActionText] = useState('');
    const [newActionOwner, setNewActionOwner] = useState<'Líder' | 'Liderado'>('Liderado');

    const aiService = AiService.getInstance();

    const exportToPDF = (elementId: string, filename: string) => {
        const element = document.getElementById(elementId);
        const html2pdf = (window as any).html2pdf;
        if (!html2pdf) return;
        const opt = {
            margin: 5,
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
        };
        html2pdf().set(opt).from(element).save();
    };

    const handleGenerateAiFeedback = async () => {
        if (!formData.employee) {
            alert("Selecione um colaborador primeiro para gerar o feedback.");
            return;
        }

        setIsGenerating(true);
        setAiSuggestion(null);

        try {
            // 1. Buscar dados contextuais do colaborador
            const opsSnap = await db.collection('operators')
                .where('uid', '==', user.uid)
                .where('name', '==', formData.employee)
                .get();

            const errsSnap = await db.collection('human_error_investigations')
                .where('uid', '==', user.uid)
                .where('occurrence.employee.name', '==', formData.employee)
                .get();

            const pdisSnap = await db.collection('pdis')
                .where('uid', '==', user.uid)
                .where('employee', '==', formData.employee)
                .get();

            const operator = opsSnap.docs[0]?.data() as Operator;
            const investigations = errsSnap.docs.map((d: any) => d.data() as HumanErrorInvestigation);
            const pdis = pdisSnap.docs.map((d: any) => d.data() as PDI);

            // 2. Processar indicadores
            const gaps = operator ? Object.entries(operator.skills)
                .filter(([_, val]) => val.r < val.p)
                .map(([name]) => name) : [];

            const errorCount = investigations.length;
            const latestActionPlan = investigations[0]?.actionPlan;

            const activePdi = pdis.find(p => p.status !== 'Concluído') || pdis[0];
            let pdiContext = "Nenhum PDI/Metas cadastradas para este colaborador.";
            if (activePdi) {
                const totalGoals = activePdi.goals?.length || 0;
                const completedGoals = activePdi.goals?.filter(g => g.completed).length || 0;

                const todayStr = new Date().toISOString().split('T')[0];
                const pendingGoalsList = activePdi.goals?.filter(g => !g.completed) || [];
                const pendingGoals = pendingGoalsList.map(g => {
                    const isDelayed = g.deadline && g.deadline < todayStr;
                    return `${g.text} (Prazo: ${g.deadline || 'N/A'}${isDelayed ? ' - ATRASADA!' : ''})`;
                }).join('; ') || 'Nenhuma';

                pdiContext = `Objetivo: ${activePdi.careerObjective || 'Não definido'}. Metas: ${completedGoals}/${totalGoals} concluídas. Pendentes: ${pendingGoals}`;
            }

            // 3. Chamar AiService
            const prompt = `
                Gere um roteiro de feedback para o colaborador:
                - Nome: ${formData.employee}
                - Desvios Operacionais (mês): ${errorCount}
                - Gaps de Skill detectados: ${gaps.join(', ') || 'Nenhum gap crítico'}
                - Último Plano de Ação: ${latestActionPlan?.action || 'Nenhum pendente'}
                - PDI e Metas: ${pdiContext}
                
                Siga a estrutura: 1. Quebra-gelo, 2. Ponto de Atenção (Fatos, incluindo andamento das metas do PDI), 3. Plano de Ação, 4. Fechamento Motivacional.
            `;

            const suggestion = await aiService.generateOneOnOneFeedback(prompt);
            setAiSuggestion(suggestion);
        } catch (error: any) {
            console.error("Erro ao gerar feedback com IA:", error);
            alert(`Não foi possível gerar a sugestão no momento:\n${error.message || 'Verifique o console para mais detalhes.'}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.employee || !formData.date) return;

        const payload = {
            employee: formData.employee,
            date: formData.date,
            summary: formData.summary || '',
            recognition: formData.recognition || '',
            improvements: formData.improvements || '',
            employeeActions: formData.employeeActions || '',
            managerActions: formData.managerActions || '',
            uid: user.uid,
            createdAt: new Date()
        };

        if (editingId) {
            await db.collection('meetings').doc(editingId).update({
                ...payload,
                updatedAt: new Date()
            });
        } else {
            await db.collection('meetings').add({
                ...payload,
                createdAt: new Date()
            });
        }

        setFormData({ employee: '', date: '', summary: '', recognition: '', improvements: '', employeeActions: '', managerActions: '', actionItems: [], sentiment: undefined });
        setAiSuggestion(null);
        setShowForm(false);
        setEditingId(null);
        setLastMeeting(null);
    };

    const handleEmployeeSelect = (empName: string) => {
        setFormData({ ...formData, employee: empName });
        const empMeetings = meetings
            .filter(m => m.employee === empName)
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        if (empMeetings.length > 0) {
            setLastMeeting(empMeetings[0]);
        } else {
            setLastMeeting(null);
        }
    };

    const addActionItem = () => {
        if (!newActionText.trim()) return;
        const newItem: MeetingAction = {
            id: Math.random().toString(36).substr(2, 9),
            text: newActionText,
            owner: newActionOwner,
            completed: false
        };
        setFormData({ ...formData, actionItems: [...(formData.actionItems || []), newItem] });
        setNewActionText('');
    };

    const removeActionItem = (id: string) => {
        setFormData({ ...formData, actionItems: (formData.actionItems || []).filter(a => a.id !== id) });
    };

    const toggleActionCompletionInView = async (meetingId: string, actionId: string, currentStatus: boolean) => {
        const meeting = meetings.find(m => m.id === meetingId);
        if (!meeting || !meeting.actionItems) return;
        
        const updatedActions = meeting.actionItems.map(a => 
            a.id === actionId ? { ...a, completed: !currentStatus } : a
        );
        
        await db.collection('meetings').doc(meetingId).update({
            actionItems: updatedActions,
            updatedAt: new Date()
        });
    };

    const openEdit = (meeting: Meeting) => {
        setFormData({
            employee: meeting.employee,
            date: meeting.date,
            summary: meeting.summary || '',
            recognition: meeting.recognition || '',
            improvements: meeting.improvements || '',
            employeeActions: meeting.employeeActions || '',
            managerActions: meeting.managerActions || '',
            actionItems: meeting.actionItems || [],
            sentiment: meeting.sentiment
        });
        setEditingId(meeting.id);
        const empMeetings = meetings
            .filter(m => m.employee === meeting.employee && m.id !== meeting.id)
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setLastMeeting(empMeetings.length > 0 ? empMeetings[0] : null);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleFormToggle = () => {
        if (showForm) {
            setShowForm(false);
            setEditingId(null);
            setFormData({ employee: '', date: '', summary: '', recognition: '', improvements: '', employeeActions: '', managerActions: '', actionItems: [], sentiment: undefined });
            setLastMeeting(null);
        } else {
            setShowForm(true);
        }
        setAiSuggestion(null);
    };

    const currentMonthStr = new Date().toISOString().substring(0, 7); // YYYY-MM
    const currentMonthMeetings = meetings.filter(m => m.date.startsWith(currentMonthStr));
    const coveredEmployeesCount = new Set(currentMonthMeetings.map(m => m.employee)).size;
    const teamCoverage = employees.length > 0 ? Math.round((coveredEmployeesCount / employees.length) * 100) : 0;
    const totalPendingActions = meetings.reduce((acc, m) => acc + (m.actionItems?.filter(a => !a.completed).length || 0), 0);

    const filteredMeetings = meetings.filter(m => {
        const matchSearch = m.employee.toLowerCase().includes(searchTerm.toLowerCase());
        
        let matchEmp = true;
        if (employeeFilter !== 'all') {
            matchEmp = m.employee === employeeFilter;
        }

        let matchMonth = true;
        if (monthFilter === 'current') {
            matchMonth = m.date.startsWith(currentMonthStr);
        }
        
        return matchSearch && matchMonth && matchEmp;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="animate-fade">
            <header className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-slate-100 uppercase tracking-tight">Feedbacks 1:1</h2>
                <div className="flex gap-2">
                    <button onClick={() => exportToPDF('meetings-list-content', 'Feedbacks-1-1-Geral')} className="bg-slate-200 text-slate-700 hover:bg-slate-300 px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-xs uppercase transition-colors shadow-sm">
                        <Download size={16} /> PDF Geral
                    </button>
                    <button onClick={handleFormToggle} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs shadow-lg hover:bg-blue-700 transition-colors">
                        <Plus size={16} className="inline-block mr-1" /> Nova Reunião
                    </button>
                </div>
            </header>

            {!showForm && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-fade">
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-4 group hover:shadow-md transition-all">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <MessageSquare size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Realizados no Mês</p>
                            <h3 className="text-3xl font-black text-slate-800">{currentMonthMeetings.length}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-4 group hover:shadow-md transition-all">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Target size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cobertura do Time ({currentMonthStr})</p>
                            <div className="flex items-end gap-2">
                                <h3 className="text-3xl font-black text-slate-800">{teamCoverage}%</h3>
                                <span className="text-xs font-bold text-emerald-500 mb-1">{coveredEmployeesCount} de {employees.length}</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-4 group hover:shadow-md transition-all">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <CheckCircle2 size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações Pendentes</p>
                            <h3 className="text-3xl font-black text-slate-800">{totalPendingActions}</h3>
                        </div>
                    </div>
                </div>
            )}

            {!showForm && (
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="flex-1 bg-white flex items-center px-4 rounded-2xl border border-slate-100 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 transition-all text-slate-600">
                        <Search size={18} className="text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Buscar colaboradores..." 
                            className="w-full bg-transparent border-none outline-none px-3 py-4 text-sm font-medium"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <select 
                            className="bg-white px-4 py-4 rounded-2xl border border-slate-100 shadow-sm outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-slate-600 cursor-pointer"
                            value={employeeFilter}
                            onChange={e => setEmployeeFilter(e.target.value)}
                        >
                            <option value="all">Todos os Colaboradores</option>
                            {employees.map(e => <option key={e} value={e}>{e}</option>)}
                        </select>
                        <select 
                            className="bg-white px-4 py-4 rounded-2xl border border-slate-100 shadow-sm outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-slate-600 cursor-pointer"
                            value={monthFilter}
                            onChange={e => setMonthFilter(e.target.value)}
                        >
                            <option value="all">Todo Histórico</option>
                            <option value="current">Mês Atual</option>
                        </select>
                    </div>
                </div>
            )}

            {showForm && (
                <div className="space-y-6 animate-fade mb-12">
                    <form onSubmit={save} className="bg-white p-8 rounded-[2rem] shadow-xl border border-blue-50 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Registro de Conversa</h3>
                            <button
                                type="button"
                                onClick={handleGenerateAiFeedback}
                                disabled={isGenerating || !formData.employee}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50"
                            >
                                {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} className="text-blue-400" />}
                                Gerar Roteiro (IA)
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <select required className="p-4 border rounded-2xl bg-slate-50 font-bold outline-none focus:ring-2 focus:ring-blue-500" value={formData.employee || ''} onChange={e => handleEmployeeSelect(e.target.value)}>
                                <option value="">Colaborador...</option>
                                {employees.map(e => <option key={e} value={e}>{e}</option>)}
                            </select>
                            <input type="date" required className="p-4 border rounded-2xl bg-slate-50 font-medium outline-none focus:ring-2 focus:ring-blue-500" value={formData.date || ''} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                        </div>
                        
                        <div className="flex flex-col gap-2 p-4 bg-slate-50 border rounded-2xl">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Sentimento do Colaborador nesta 1:1</label>
                            <div className="flex gap-4">
                                <button type="button" onClick={() => setFormData({ ...formData, sentiment: '😃' })} className={`p-3 rounded-xl flex items-center gap-2 transition-all ${formData.sentiment === '😃' ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500 font-bold' : 'bg-white text-slate-400 hover:bg-slate-100'}`}>
                                    <Smile size={20} /> Ótimo
                                </button>
                                <button type="button" onClick={() => setFormData({ ...formData, sentiment: '😐' })} className={`p-3 rounded-xl flex items-center gap-2 transition-all ${formData.sentiment === '😐' ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-500 font-bold' : 'bg-white text-slate-400 hover:bg-slate-100'}`}>
                                    <Meh size={20} /> Neutro
                                </button>
                                <button type="button" onClick={() => setFormData({ ...formData, sentiment: '🙁' })} className={`p-3 rounded-xl flex items-center gap-2 transition-all ${formData.sentiment === '🙁' ? 'bg-red-100 text-red-700 ring-2 ring-red-500 font-bold' : 'bg-white text-slate-400 hover:bg-slate-100'}`}>
                                    <Frown size={20} /> Preocupante
                                </button>
                            </div>
                        </div>

                        {lastMeeting && !editingId && (
                            <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 animate-fade">
                                <div className="flex items-center gap-2 mb-3">
                                    <Info size={16} className="text-amber-500" />
                                    <h4 className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Resgate da Última 1:1 ({lastMeeting.date})</h4>
                                </div>
                                <div className="space-y-3">
                                    {lastMeeting.actionItems && lastMeeting.actionItems.length > 0 ? (
                                        <div className="bg-white/60 p-3 rounded-xl">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Ações Acordadas:</p>
                                            <ul className="space-y-1">
                                                {lastMeeting.actionItems.map(action => (
                                                    <li key={action.id} className="text-xs text-slate-700 flex items-start gap-2">
                                                        {action.completed ? <CheckCircle2 size={14} className="text-emerald-500 mt-0.5" /> : <Circle size={14} className="text-amber-500 mt-0.5" />}
                                                        <span className={action.completed ? 'line-through opacity-70' : ''}>
                                                            <strong className="text-slate-800">{action.owner}:</strong> {action.text}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-600 italic">Na última 1:1 não foram registradas ações no formato rastreável.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {aiSuggestion && (
                            <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 animate-fade relative group">
                                <div className="absolute -top-3 left-6 px-3 py-1 bg-blue-600 text-white text-[8px] font-black uppercase rounded-full shadow-lg flex items-center gap-1">
                                    <Sparkles size={10} /> Sugestão do Assistente
                                </div>
                                <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
                                    {aiSuggestion}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, summary: aiSuggestion })}
                                    className="mt-4 text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                                >
                                    Copiar para o Resumo
                                </button>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">O que está indo bem (Reconhecimento)</label>
                                <textarea
                                    rows={3}
                                    className="w-full p-4 border rounded-2xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    placeholder="Descreva os pontos fortes e realizações..."
                                    value={formData.recognition || ''}
                                    onChange={e => setFormData({ ...formData, recognition: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Pontos de Atenção / Melhoria</label>
                                <textarea
                                    rows={3}
                                    className="w-full p-4 border rounded-2xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    placeholder="Oportunidades de desenvolvimento..."
                                    value={formData.improvements || ''}
                                    onChange={e => setFormData({ ...formData, improvements: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-2 space-y-4 bg-white p-6 rounded-2xl border">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Planos de Ação (Gestor e Liderado)</label>
                                
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <select 
                                        className="p-3 rounded-xl border bg-slate-50 text-xs font-bold w-full sm:w-1/4 outline-none focus:ring-2 focus:ring-blue-500"
                                        value={newActionOwner}
                                        onChange={e => setNewActionOwner(e.target.value as any)}
                                    >
                                        <option value="Liderado">Liderado fará</option>
                                        <option value="Líder">Líder fará</option>
                                    </select>
                                    <div className="flex flex-1 gap-2">
                                        <input 
                                            type="text"
                                            className="w-full p-3 rounded-xl border bg-slate-50 text-xs outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400"
                                            placeholder="O que será feito..."
                                            value={newActionText}
                                            onChange={e => setNewActionText(e.target.value)}
                                            onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); addActionItem(); } }}
                                        />
                                        <button 
                                            type="button" 
                                            onClick={addActionItem}
                                            className="px-4 py-3 bg-blue-100 text-blue-700 rounded-xl font-bold hover:bg-blue-200 transition-colors"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </div>

                                {formData.actionItems && formData.actionItems.length > 0 && (
                                    <ul className="space-y-2 mt-4">
                                        {formData.actionItems.map(action => (
                                            <li key={action.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 group">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${action.owner === 'Líder' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'}`}>
                                                        {action.owner}
                                                    </span>
                                                    <span className="text-sm text-slate-700">{action.text}</span>
                                                </div>
                                                <button type="button" onClick={() => removeActionItem(action.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                                    <Trash2 size={16} />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Resumo Geral / Anotações Livres</label>
                            <textarea
                                rows={2}
                                className="w-full p-4 border rounded-2xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                placeholder="Resumo do feedback e acordos gerais..."
                                value={formData.summary || ''}
                                onChange={e => setFormData({ ...formData, summary: e.target.value })}
                            />
                        </div>

                        <div className="flex gap-3">
                            <button type="submit" className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all">
                                {editingId ? 'Salvar Alterações' : 'Salvar Feedback'}
                            </button>
                            <button type="button" onClick={handleFormToggle} className="px-8 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black uppercase tracking-widest">Cancelar</button>
                        </div>
                    </form>
                </div>
            )}

            <div id="meetings-list-content" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMeetings.map(m => {
                    const isExpanded = expandedCard === m.id;
                    return (
                        <div key={m.id} id={`meeting-card-${m.id}`} className="bg-white p-6 border rounded-[2rem] shadow-sm flex flex-col justify-between group hover:shadow-md transition-all animate-fade">
                            <div className="mb-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-black text-slate-800 text-lg">{m.employee}</h4>
                                        {m.sentiment === '😃' && <span title="Ótimo" className="text-emerald-500"><Smile size={18} /></span>}
                                        {m.sentiment === '😐' && <span title="Neutro" className="text-amber-500"><Meh size={18} /></span>}
                                        {m.sentiment === '🙁' && <span title="Preocupante" className="text-red-500"><Frown size={18} /></span>}
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => openEdit(m)} className="text-slate-200 hover:text-blue-500 p-1 transition-colors" title="Editar Feedback">
                                            <Pencil size={16} />
                                        </button>
                                        <button onClick={() => exportToPDF(`meeting-card-${m.id}`, `Feedback-${m.employee}-${m.date}`)} className="text-slate-200 hover:text-emerald-500 p-1 transition-colors" title="Baixar PDF Individual">
                                            <Download size={16} />
                                        </button>
                                        <button onClick={() => db.collection('meetings').doc(m.id).delete()} className="text-slate-200 hover:text-red-500 p-1 transition-colors" title="Excluir Feedback">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">
                                    <Calendar size={12} /> {m.date}
                                </div>

                                <button
                                    onClick={() => setExpandedCard(isExpanded ? null : m.id)}
                                    className="w-full flex items-center justify-between px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors text-xs font-bold text-slate-600 uppercase tracking-widest"
                                >
                                    {isExpanded ? 'Ocultar Detalhes' : 'Ver Detalhes'}
                                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>

                                {isExpanded && (
                                    <div className="mt-4 space-y-4 animate-fade">
                                        {m.recognition && (
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Reconhecimento</span>
                                                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl">{m.recognition}</p>
                                            </div>
                                        )}
                                        {m.improvements && (
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Pontos de Atenção</span>
                                                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl">{m.improvements}</p>
                                            </div>
                                        )}
                                        {m.actionItems && m.actionItems.length > 0 && (
                                            <div className="space-y-2 mt-4">
                                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Planos de Ação</span>
                                                <ul className="space-y-2">
                                                    {m.actionItems.map(action => (
                                                        <li key={action.id} className="flex items-start gap-2 bg-slate-50 p-2 rounded-xl group/action">
                                                            <button 
                                                                onClick={() => toggleActionCompletionInView(m.id, action.id, action.completed)}
                                                                className={`mt-0.5 ${action.completed ? 'text-emerald-500' : 'text-slate-300 hover:text-amber-500'} transition-colors`}
                                                            >
                                                                {action.completed ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                                                            </button>
                                                            <div className="flex-1">
                                                                <p className={`text-sm ${action.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                                                    <strong className="text-[10px] uppercase font-bold text-slate-500 mr-1">{action.owner}:</strong>
                                                                    {action.text}
                                                                </p>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {m.employeeActions && (
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Ações do Colaborador (Legado)</span>
                                                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl">{m.employeeActions}</p>
                                            </div>
                                        )}
                                        {m.managerActions && (
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Ações do Gestor (Legado)</span>
                                                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl">{m.managerActions}</p>
                                            </div>
                                        )}
                                        {m.summary && (
                                            <div className="space-y-1 mt-2">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resumo / Anotações (Legado)</span>
                                                <p className="text-sm text-slate-500 italic leading-relaxed bg-slate-50 p-3 rounded-xl">"{m.summary}"</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                {filteredMeetings.length === 0 && (
                    <div className="md:col-span-3">
                        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] py-20 flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-300 mb-6">
                                <MessageSquare size={32} />
                            </div>
                            <h3 className="text-lg font-black text-slate-400 uppercase tracking-tight">Cultura de Feedback</h3>
                            <p className="text-slate-400 text-xs mt-2 max-w-xs leading-relaxed">Registre suas conversas individuais para acompanhar a evolução e o engajamento do seu time.</p>
                            <button onClick={() => setShowForm(true)} className="mt-8 bg-blue-600 text-white px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-100 transition-all hover:scale-105">Começar Agora</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OneOnOneView;
