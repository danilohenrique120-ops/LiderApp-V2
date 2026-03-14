
import React, { useState } from 'react';
import { MessageSquare, Trash2, Calendar, Download, Sparkles, Loader2, Info, Pencil, ChevronDown, ChevronUp } from 'lucide-react';
import { Meeting, Operator, HumanErrorInvestigation } from '../types';
import { AiService } from '../services/AiService';

interface OneOnOneViewProps {
    meetings: Meeting[];
    employees: string[];
    user: any;
    db: any;
}

const OneOnOneView: React.FC<OneOnOneViewProps> = ({ meetings, employees, user, db }) => {
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState<Partial<Meeting>>({ employee: '', date: '', summary: '', recognition: '', improvements: '', employeeActions: '', managerActions: '' });
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [expandedCard, setExpandedCard] = useState<string | null>(null);

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

            const operator = opsSnap.docs[0]?.data() as Operator;
            const investigations = errsSnap.docs.map(d => d.data() as HumanErrorInvestigation);

            // 2. Processar indicadores
            const gaps = operator ? Object.entries(operator.skills)
                .filter(([_, val]) => val.r < val.p)
                .map(([name]) => name) : [];

            const errorCount = investigations.length;
            const latestActionPlan = investigations[0]?.actionPlan;

            // 3. Chamar AiService
            const prompt = `
                Gere um roteiro de feedback para o colaborador:
                - Nome: ${formData.employee}
                - Desvios Operacionais (mês): ${errorCount}
                - Gaps de Skill detectados: ${gaps.join(', ') || 'Nenhum gap crítico'}
                - Último Plano de Ação: ${latestActionPlan?.action || 'Nenhum pendente'}
                
                Siga a estrutura: 1. Quebra-gelo, 2. Ponto de Atenção (Fatos), 3. Plano de Ação, 4. Fechamento Motivacional.
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

        setFormData({ employee: '', date: '', summary: '', recognition: '', improvements: '', employeeActions: '', managerActions: '' });
        setAiSuggestion(null);
        setShowForm(false);
        setEditingId(null);
    };

    const openEdit = (meeting: Meeting) => {
        setFormData({
            employee: meeting.employee,
            date: meeting.date,
            summary: meeting.summary || '',
            recognition: meeting.recognition || '',
            improvements: meeting.improvements || '',
            employeeActions: meeting.employeeActions || '',
            managerActions: meeting.managerActions || ''
        });
        setEditingId(meeting.id);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleFormToggle = () => {
        if (showForm) {
            setShowForm(false);
            setEditingId(null);
            setFormData({ employee: '', date: '', summary: '', recognition: '', improvements: '', employeeActions: '', managerActions: '' });
        } else {
            setShowForm(true);
        }
        setAiSuggestion(null);
    };

    return (
        <div className="animate-fade">
            <header className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-slate-100 uppercase tracking-tight">Feedbacks 1:1</h2>
                <div className="flex gap-2">
                    <button onClick={() => exportToPDF('meetings-list-content', 'Feedbacks-1-1-Geral')} className="bg-slate-200 text-slate-700 hover:bg-slate-300 px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-xs uppercase transition-colors">
                        <Download size={16} /> PDF Geral
                    </button>
                    <button onClick={handleFormToggle} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs shadow-lg">Nova Reunião</button>
                </div>
            </header>

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
                            <select required className="p-4 border rounded-2xl bg-slate-50 font-bold outline-none focus:ring-2 focus:ring-blue-500" value={formData.employee} onChange={e => setFormData({ ...formData, employee: e.target.value })}>
                                <option value="">Colaborador...</option>
                                {employees.map(e => <option key={e} value={e}>{e}</option>)}
                            </select>
                            <input type="date" required className="p-4 border rounded-2xl bg-slate-50 font-medium outline-none focus:ring-2 focus:ring-blue-500" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                        </div>

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
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Ações do Colaborador (Próximos Passos)</label>
                                <textarea
                                    rows={3}
                                    className="w-full p-4 border rounded-2xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    placeholder="O que o colaborador se compromete a fazer..."
                                    value={formData.employeeActions || ''}
                                    onChange={e => setFormData({ ...formData, employeeActions: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Ações do Gestor (Como vou ajudar)</label>
                                <textarea
                                    rows={3}
                                    className="w-full p-4 border rounded-2xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    placeholder="O que eu como líder farei para apoiar..."
                                    value={formData.managerActions || ''}
                                    onChange={e => setFormData({ ...formData, managerActions: e.target.value })}
                                />
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
                {meetings.map(m => {
                    const isExpanded = expandedCard === m.id;
                    return (
                        <div key={m.id} id={`meeting-card-${m.id}`} className="bg-white p-6 border rounded-[2rem] shadow-sm flex flex-col justify-between group hover:shadow-md transition-all animate-fade">
                            <div className="mb-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-black text-slate-800 text-lg">{m.employee}</h4>
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
                                        {m.employeeActions && (
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Ações do Colaborador</span>
                                                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl">{m.employeeActions}</p>
                                            </div>
                                        )}
                                        {m.managerActions && (
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Ações do Gestor</span>
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
                {meetings.length === 0 && (
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
