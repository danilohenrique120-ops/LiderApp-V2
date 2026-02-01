
import React, { useState, useMemo, useEffect } from 'react';
import { 
    ShieldAlert, 
    PlusCircle, 
    ChevronRight, 
    Save, 
    Trash2, 
    Calendar, 
    ClipboardList,
    HelpCircle,
    XCircle,
    ArrowLeft,
    Pencil,
    Download,
    FileText,
    Eye,
    Sparkles,
    Loader2,
    AlertTriangle,
    Zap,
    CheckCircle2,
    // Fix: Adding missing Brain icon import from lucide-react
    Brain
} from 'lucide-react';
// @ts-ignore
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import { HumanErrorInvestigation } from '../types';
import { AiService } from '../services/AiService';

interface HumanErrorViewProps {
    investigations: HumanErrorInvestigation[];
    user: any;
    db: any;
}

const HumanErrorView: React.FC<HumanErrorViewProps> = ({ investigations, user, db }) => {
    const [showForm, setShowForm] = useState(false);
    const [step, setStep] = useState(1); 
    const [history, setHistory] = useState<number[]>([]); 
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    
    // Estados de IA
    const [isRefining, setIsRefining] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [aiFeedback, setAiFeedback] = useState<string | null>(null);
    const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
    const [recurrenceAlert, setRecurrenceAlert] = useState<string | null>(null);

    const aiService = AiService.getInstance();

    const hercaQuestions: Record<string, Record<string, string>> = {
        process: { '1.1': 'O processo é complexo?', '1.2': 'Ritmo controlado pela máquina?', '1.3': 'Mudança recente?', '1.4': 'Problemas ergonômicos?' },
        procedure: { '2.1': 'POP existe no posto?', '2.2': 'POP é claro e atualizado?' },
        tools: { '3.1': 'Ferramentas em bom estado?', '3.2': 'Ferramenta correta?', '3.3': 'Manutenção em dia?' },
        workplace: { '4.1': 'Ruído/Calor/Iluminação inadequada?', '4.2': 'Organizado (5S)?', '4.3': 'Distrações visuais/sonoras?' },
        attitude: { '5.1': 'Ganhar tempo (atalho)?', '5.2': 'Excesso de confiança?', '5.3': 'Ignorou segurança?' },
        inattention: { '6.1': 'Tarefa repetitiva/monótona?', '6.2': 'Cansado ou preocupado?' }
    };

    const twttpAdvancedQuestions = [
        { id: '1', q: '1. Problema resultante de treinamento incompleto?' },
        { id: '2', q: '2. Falta de conhecimento do método ou ferramenta?' },
        { id: '3', q: '3. Trabalho infrequente (menos de 1x/semana ou >3 meses)?' },
        { id: '4', q: '4. Dificuldade física/tempo para manter o padrão?' },
        { id: '5', q: '5. Operador treinado, mas sem habilidade motora necessária?' }
    ];

    const [occurrence, setOccurrence] = useState({
        description: '', unit: '', area: '', station: '', failureLocation: '', date: '', time: '',
        employee: { name: '', area: '', function: '' },
        interviewee: { name: '', area: '', function: '' }
    });

    const [twttpDate, setTwttpDate] = useState('');
    const [twttp, setTwttp] = useState<Record<string, 'possui conhecimento' | 'falta conhecimento'>>({
        '1': 'possui conhecimento', '2': 'possui conhecimento', '3': 'possui conhecimento', '4': 'possui conhecimento'
    });

    const [twttpAdvanced, setTwttpAdvanced] = useState<Record<string, 'sim' | 'não'>>({
        '1': 'não', '2': 'não', '3': 'não', '4': 'não', '5': 'não'
    });

    const [herca, setHerca] = useState({
        process: { '1.1': 'não', '1.2': 'não', '1.3': 'não', '1.4': 'não' },
        procedure: { '2.1': 'não', '2.2': 'não' },
        tools: { '3.1': 'não', '3.2': 'não', '3.3': 'não' },
        workplace: { '4.1': 'não', '4.2': 'não', '4.3': 'não' },
        attitude: { '5.1': 'não', '5.2': 'não', '5.3': 'não' },
        inattention: { '6.1': 'não', '6.2': 'não' }
    });

    const [actionPlan, setActionPlan] = useState({
        action: '', responsible: '', deadline: '', rootCauses: '', countermeasure: 'Treinamento em sala'
    });
    const [customCountermeasure, setCustomCountermeasure] = useState('');

    const needsAdvanced = useMemo(() => Object.values(twttp).some(v => v === 'falta conhecimento'), [twttp]);

    // PONTO 4: DETECÇÃO DE RECORRÊNCIA
    useEffect(() => {
        if (occurrence.employee.name.length > 3) {
            const matches = investigations.filter(inv => 
                inv.occurrence.employee.name.toLowerCase().includes(occurrence.employee.name.toLowerCase()) &&
                inv.id !== editingId
            );
            if (matches.length > 0) {
                setRecurrenceAlert(`Alerta: ${occurrence.employee.name} possui ${matches.length} investigações anteriores. Verifique se as causas são reincidentes.`);
            } else {
                setRecurrenceAlert(null);
            }
        }
    }, [occurrence.employee.name, investigations]);

    // PONTO 1: REFINAMENTO TÉCNICO
    const handleRefineDescription = async () => {
        if (!occurrence.description) return;
        setIsRefining(true);
        try {
            const refined = await aiService.refineOccurrence(occurrence.description);
            setOccurrence(prev => ({ ...prev, description: refined }));
        } finally {
            setIsRefining(false);
        }
    };

    // PONTO 2: VALIDAÇÃO CRUZADA (Ajustado para passar TWTTP Avançada)
    const handleNextToPlan = async () => {
        setIsValidating(true);
        try {
            const feedback = await aiService.validateConsistency(
                twttp, 
                !needsAdvanced ? herca : null, 
                needsAdvanced ? twttpAdvanced : null
            );
            setAiFeedback(feedback);
            setHistory([...history, step]);
            setStep(5);
        } finally {
            setIsValidating(false);
        }
    };

    // PONTO 3: GERADOR DE CONTRAMEDIDAS (Ajustado para enviar rootCauses)
    const handleSuggestActions = async () => {
        setIsSuggesting(true);
        try {
            const activeFactors: string[] = [];
            // Apenas busca fatores HERCA se eles foram preenchidos (fluxo de conhecimento OK)
            if (!needsAdvanced) {
                Object.entries(herca).forEach(([cat, questions]) => {
                    Object.entries(questions).forEach(([qId, val]) => {
                        if (val === 'sim') activeFactors.push((hercaQuestions as any)[cat][qId]);
                    });
                });
            }
            // Envia os fatores E o texto digitado na Causa Raiz
            const suggestions = await aiService.suggestCountermeasures(activeFactors, actionPlan.rootCauses);
            setAiSuggestions(suggestions);
        } finally {
            setIsSuggesting(false);
        }
    };

    const handleNextStep = () => {
        setHistory([...history, step]);
        if (step === 1) setStep(2);
        else if (step === 2) {
            if (needsAdvanced) setStep(3); 
            else setStep(4); 
        }
        else if (step === 3 || step === 4) handleNextToPlan();
        else if (step === 5) setStep(6); 
    };

    const handleBackStep = () => {
        if (history.length > 0) {
            const lastStep = history[history.length - 1];
            setStep(lastStep);
            setHistory(history.slice(0, -1));
        }
    };

    const handleGeneratePDF = () => {
        const element = document.getElementById('pdf-report-container');
        const html2pdf = (window as any).html2pdf;
        if (!html2pdf) {
            alert("Biblioteca html2pdf não encontrada.");
            return;
        }
        setIsGeneratingPdf(true);
        const opt = {
            margin: 10,
            filename: `Investigacao-${occurrence.employee.name || 'SemNome'}-${occurrence.date || 'SemData'}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save().then(() => setIsGeneratingPdf(false));
    };

    const handleEdit = (inv: HumanErrorInvestigation) => {
        setEditingId(inv.id);
        setOccurrence(inv.occurrence);
        setTwttp(inv.twttp as any);
        setTwttpDate((inv.twttp as any).date || '');
        if (inv.twttpAdvanced) {
            setTwttpAdvanced(inv.twttpAdvanced);
        }
        if (inv.herca) {
            setHerca(inv.herca);
        }
        setActionPlan(inv.actionPlan);
        setCustomCountermeasure(inv.actionPlan.countermeasure);
        setShowForm(true);
        setStep(1);
        setHistory([]);
    };

    const handleSave = async () => {
        const finalCountermeasure = actionPlan.countermeasure === 'Outros' ? customCountermeasure : actionPlan.countermeasure;
        const investigationData = {
            occurrence,
            twttp: { ...twttp, date: twttpDate },
            twttpAdvanced: needsAdvanced ? twttpAdvanced : null,
            herca: !needsAdvanced ? herca : null,
            actionPlan: { ...actionPlan, countermeasure: finalCountermeasure },
            uid: user.uid,
            createdAt: editingId ? investigations.find(i => i.id === editingId)?.createdAt : firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        try {
            if (editingId) await db.collection('human_error_investigations').doc(editingId).update(investigationData);
            else await db.collection('human_error_investigations').add(investigationData);
            alert('Investigação salva com sucesso!');
            resetForm();
        } catch (err) { alert('Erro ao salvar.'); }
    };

    const resetForm = () => {
        setShowForm(false); setStep(1); setHistory([]); setEditingId(null); setCustomCountermeasure(''); setAiFeedback(null); setAiSuggestions([]); setRecurrenceAlert(null);
        setOccurrence({ description: '', unit: '', area: '', station: '', failureLocation: '', date: '', time: '', employee: { name: '', area: '', function: '' }, interviewee: { name: '', area: '', function: '' } });
        setTwttpDate(''); setTwttp({ '1': 'possui conhecimento', '2': 'possui conhecimento', '3': 'possui conhecimento', '4': 'possui conhecimento' });
        setTwttpAdvanced({ '1': 'não', '2': 'não', '3': 'não', '4': 'não', '5': 'não' });
        setHerca({ process: { '1.1': 'não', '1.2': 'não', '1.3': 'não', '1.4': 'não' }, procedure: { '2.1': 'não', '2.2': 'não' }, tools: { '3.1': 'não', '3.2': 'não', '3.3': 'não' }, workplace: { '4.1': 'não', '4.2': 'não', '4.3': 'não' }, attitude: { '5.1': 'não', '5.2': 'não', '5.3': 'não' }, inattention: { '6.1': 'não', '6.2': 'não' } });
        setActionPlan({ action: '', responsible: '', deadline: '', rootCauses: '', countermeasure: 'Treinamento em sala' });
    };

    return (
        <div className="animate-fade">
            <header className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-100 tracking-tight uppercase">Análise de Fator Humano</h2>
                    <p className="text-slate-400 font-medium text-[10px] uppercase tracking-widest mt-1">Investigação técnica Método Sistema Líder.</p>
                </div>
                {!showForm && (
                    <button 
                        onClick={() => { resetForm(); setShowForm(true); }} 
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs shadow-xl shadow-blue-200/50 flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
                    >
                        <PlusCircle size={18} /> Novo Registro
                    </button>
                )}
            </header>

            {showForm ? (
                <div className="bg-white p-8 rounded-[2.5rem] border shadow-2xl animate-fade mb-10 overflow-hidden relative text-slate-900">
                    <div className="flex justify-between items-center mb-10 border-b pb-6 overflow-x-auto custom-scrollbar gap-4">
                        <div className="flex items-center gap-2">
                            {[1, 2, needsAdvanced ? 3 : 4, 5, 6].map((s, idx) => (
                                <div key={idx} className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap ${step === s ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-50 text-slate-400'}`}>
                                    {s === 1 ? 'Ocorrência' : s === 2 ? 'TWTTP' : s === 3 ? 'Avançada' : s === 4 ? 'HERCA' : s === 5 ? 'Plano' : 'Resumo'}
                                </div>
                            ))}
                        </div>
                        <button onClick={resetForm} className="text-slate-300 hover:text-red-500 transition-colors shrink-0"><XCircle size={24} /></button>
                    </div>

                    <div className="max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar">
                        {step === 1 && (
                            <div className="space-y-6 animate-fade">
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><ClipboardList size={18}/> Detalhes da Ocorrência</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2 relative">
                                        <label className="label-Invest text-slate-400">Descrição do Problema</label>
                                        <textarea placeholder="O que aconteceu?" className="input-Invest pr-12 bg-slate-50" rows={3} value={occurrence.description} onChange={e => setOccurrence({...occurrence, description: e.target.value})} />
                                        <button 
                                            onClick={handleRefineDescription}
                                            disabled={isRefining || !occurrence.description}
                                            className="absolute right-3 bottom-3 p-2 bg-slate-900 text-white rounded-lg hover:bg-blue-600 disabled:opacity-20 transition-all group"
                                            title="Refinar com IA"
                                        >
                                            {isRefining ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} className="group-hover:scale-110" />}
                                        </button>
                                    </div>
                                    <div><label className="label-Invest text-slate-400">Unidade / Estação</label><input className="input-Invest bg-slate-50" value={occurrence.unit} onChange={e => setOccurrence({...occurrence, unit: e.target.value})} /></div>
                                    <div><label className="label-Invest text-slate-400">Data/Hora</label><div className="flex gap-2"><input type="date" className="input-Invest flex-1 bg-slate-50" value={occurrence.date} onChange={e => setOccurrence({...occurrence, date: e.target.value})} /><input type="time" className="input-Invest w-32 bg-slate-50" value={occurrence.time} onChange={e => setOccurrence({...occurrence, time: e.target.value})} /></div></div>
                                </div>

                                {recurrenceAlert && (
                                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-3 animate-fade">
                                        <AlertTriangle className="text-amber-500 shrink-0" size={20} />
                                        <p className="text-[10px] font-bold text-amber-800 uppercase leading-tight">{recurrenceAlert}</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t pt-6">
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Colaborador Envolvido</h4>
                                        <input placeholder="Nome Completo" className="input-Invest bg-slate-50" value={occurrence.employee.name} onChange={e => setOccurrence({...occurrence, employee: {...occurrence.employee, name: e.target.value}})} />
                                        <input placeholder="Função / Cargo" className="input-Invest bg-slate-50" value={occurrence.employee.function} onChange={e => setOccurrence({...occurrence, employee: {...occurrence.employee, function: e.target.value}})} />
                                        <input placeholder="Área" className="input-Invest bg-slate-50" value={occurrence.employee.area} onChange={e => setOccurrence({...occurrence, employee: {...occurrence.employee, area: e.target.value}})} />
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Investigador (Líder)</h4>
                                        <input placeholder="Nome" className="input-Invest bg-slate-50" value={occurrence.interviewee.name} onChange={e => setOccurrence({...occurrence, interviewee: {...occurrence.interviewee, name: e.target.value}})} />
                                        <input placeholder="Área" className="input-Invest bg-slate-50" value={occurrence.interviewee.area} onChange={e => setOccurrence({...occurrence, interviewee: {...occurrence.interviewee, area: e.target.value}})} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6 animate-fade">
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><HelpCircle size={18}/> Entrevista TWTTP</h3>
                                <div className="space-y-4">
                                    {['1. Entende as atividades?', '2. Sabe trabalhar corretamente?', '3. Sabe que executou sem erros?', '4. O que faz se encontrar problema?'].map((q, i) => (
                                        <div key={i} className="p-6 bg-slate-50 rounded-[2rem] border flex flex-col md:flex-row justify-between items-center gap-4">
                                            <p className="font-bold text-slate-700 text-sm md:flex-1">{q}</p>
                                            <div className="flex gap-2">
                                                {['possui conhecimento', 'falta conhecimento'].map(opt => (
                                                    <button key={opt} onClick={() => setTwttp({...twttp, [(i+1).toString()]: opt as any})} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${twttp[(i+1).toString()] === opt ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 border'}`}>{opt}</button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6 animate-fade">
                                <h3 className="text-sm font-black text-amber-500 uppercase tracking-widest flex items-center gap-2"><HelpCircle size={18}/> TWTTP AVANÇADA (Gap de Treinamento)</h3>
                                <div className="space-y-4">
                                    {twttpAdvancedQuestions.map(item => (
                                        <div key={item.id} className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100 flex flex-col md:flex-row justify-between items-center gap-4">
                                            <p className="font-bold text-amber-900 text-sm md:flex-1">{item.q}</p>
                                            <div className="flex gap-2">
                                                {['sim', 'não'].map(opt => (
                                                    <button key={opt} onClick={() => setTwttpAdvanced({...twttpAdvanced, [item.id]: opt as any})} className={`px-8 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${twttpAdvanced[item.id] === opt ? 'bg-amber-600 text-white shadow-lg' : 'bg-white text-amber-400 border border-amber-200'}`}>{opt}</button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="space-y-8 animate-fade pb-10">
                                <h3 className="text-sm font-black text-blue-600 uppercase tracking-widest flex items-center gap-2"><ShieldAlert size={18}/> Fatores HERCA (Causas Contribuintes)</h3>
                                {Object.entries(hercaQuestions).map(([category, questions]) => (
                                    <div key={category} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                                        <h4 className="text-[10px] font-black text-blue-600 uppercase mb-4">{category.toUpperCase()}</h4>
                                        <div className="space-y-4">
                                            {Object.entries(questions).map(([qId, questionText]) => (
                                                <div key={qId} className="flex flex-col md:flex-row justify-between items-start md:items-center py-3 border-b border-slate-200 last:border-0 gap-3">
                                                    <p className="text-xs font-bold text-slate-600 flex-1">{questionText}</p>
                                                    <div className="flex gap-2">
                                                        {['sim', 'não'].map(opt => (
                                                            <button key={opt} onClick={() => setHerca({...herca, [category]: {...(herca as any)[category], [qId]: opt}})} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase ${(herca as any)[category][qId] === opt ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-400 border'}`}>{opt}</button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {step === 5 && (
                            <div className="space-y-6 animate-fade">
                                <h3 className="text-sm font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2"><Save size={18}/> Plano de Ação & Contramedida</h3>
                                
                                {aiFeedback && (
                                    <div className="bg-blue-50 border border-blue-200 p-6 rounded-[2rem] flex flex-col gap-2">
                                        <div className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-widest">
                                            <Sparkles size={16} /> Insight de Auditoria IA
                                        </div>
                                        <p className="text-xs text-blue-800 font-bold leading-relaxed italic">"{aiFeedback}"</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="label-Invest text-slate-400">Causas Raízes Identificadas</label>
                                            <button onClick={handleSuggestActions} className="text-[9px] font-black text-blue-600 uppercase flex items-center gap-1 hover:underline">
                                                {isSuggesting ? <Loader2 size={10} className="animate-spin" /> : <Zap size={10} />} Sugerir Engenharia
                                            </button>
                                        </div>
                                        <textarea placeholder="Explique o porquê..." className="input-Invest bg-slate-50" rows={2} value={actionPlan.rootCauses} onChange={e => setActionPlan({...actionPlan, rootCauses: e.target.value})} />
                                        
                                        {aiSuggestions.length > 0 && (
                                            <div className="mt-4 grid grid-cols-1 gap-2">
                                                {aiSuggestions.map((s, i) => (
                                                    <button key={i} onClick={() => setActionPlan({...actionPlan, action: s})} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-left text-[10px] font-bold text-slate-600 hover:bg-blue-50 hover:border-blue-200 transition-all flex items-center gap-2">
                                                        <PlusCircle size={12} className="text-blue-500" /> {s}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="md:col-span-2"><label className="label-Invest text-slate-400">Ação Corretiva Imediata</label><textarea placeholder="O que será feito?" className="input-Invest bg-slate-50" rows={3} value={actionPlan.action} onChange={e => setActionPlan({...actionPlan, action: e.target.value})} /></div>
                                    <div><label className="label-Invest text-slate-400">Responsável</label><input className="input-Invest bg-slate-50" value={actionPlan.responsible} onChange={e => setActionPlan({...actionPlan, responsible: e.target.value})} /></div>
                                    <div>
                                        <label className="label-Invest text-slate-400">Contramedida Técnica</label>
                                        <select className="input-Invest font-bold bg-slate-50" value={actionPlan.countermeasure} onChange={e => setActionPlan({...actionPlan, countermeasure: e.target.value})}>
                                            <option>Treinamento em sala</option>
                                            <option>Instrução de Trabalho (LUP)</option>
                                            <option>Mudança de Processo</option>
                                            <option>Poka-Yoke (Dispositivo à prova de erro)</option>
                                            <option>Melhoria Ergonômica</option>
                                            <option>Medida Disciplinar</option>
                                            <option value="Outros">Outros...</option>
                                        </select>
                                    </div>
                                    <div><label className="label-Invest text-slate-400">Prazo Final</label><input type="date" className="input-Invest bg-slate-50" value={actionPlan.deadline} onChange={e => setActionPlan({...actionPlan, deadline: e.target.value})} /></div>
                                </div>
                            </div>
                        )}

                        {step === 6 && (
                            <div className="space-y-8 animate-fade pb-10">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><Eye size={18}/> Relatório Técnico Final</h3>
                                    <button onClick={handleGeneratePDF} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] flex items-center gap-2 shadow-lg"><Download size={14} /> Gerar PDF A4</button>
                                </div>
                                <div id="pdf-report-container" className="bg-white p-10 rounded-[2.5rem] border shadow-inner text-slate-900">
                                    <div className="border-b-2 border-slate-900 pb-6 mb-8">
                                        <h1 className="text-3xl font-black mb-1 text-slate-900">RELATÓRIO DE INVESTIGAÇÃO</h1>
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Cockpit Sistema Líder • Gestão de Fator Humano</p>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-8 mb-8">
                                        <div>
                                            <h2 className="text-[10px] font-black uppercase text-slate-400 mb-1">Colaborador</h2>
                                            <p className="text-sm font-bold text-slate-800">{occurrence.employee.name}</p>
                                            <p className="text-[10px] text-slate-500 font-medium">{occurrence.employee.function} • {occurrence.employee.area}</p>
                                        </div>
                                        <div className="text-right">
                                            <h2 className="text-[10px] font-black uppercase text-slate-400 mb-1">Data do Evento</h2>
                                            <p className="text-sm font-bold text-slate-800">{occurrence.date} às {occurrence.time}</p>
                                            <p className="text-[10px] text-slate-500 font-medium">{occurrence.unit} • {occurrence.station}</p>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-slate-50 rounded-[2rem] border-l-8 border-slate-900 mb-8">
                                        <h2 className="text-[10px] font-black uppercase text-slate-400 mb-2">Descrição Técnica do Desvio</h2>
                                        <p className="text-sm text-slate-700 leading-relaxed font-medium italic">"{occurrence.description}"</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                        <div className="space-y-4">
                                            <div className="p-5 border rounded-[1.5rem] bg-white">
                                                <h2 className="text-[10px] font-black uppercase text-slate-400 mb-3 flex items-center gap-1"><Brain size={14} className="text-blue-500"/> Causa Raiz</h2>
                                                <p className="text-xs font-bold text-slate-800 leading-relaxed">{actionPlan.rootCauses}</p>
                                            </div>
                                            <div className="p-5 border rounded-[1.5rem] bg-white">
                                                <h2 className="text-[10px] font-black uppercase text-slate-400 mb-3 flex items-center gap-1"><Zap size={14} className="text-amber-500"/> Plano de Ação</h2>
                                                <p className="text-xs font-bold text-slate-800 leading-relaxed">{actionPlan.action}</p>
                                            </div>
                                        </div>
                                        <div className="p-6 bg-blue-50/30 rounded-[2rem] border border-blue-100">
                                            <h2 className="text-[10px] font-black uppercase text-blue-600 mb-4">Contramedida & Prazo</h2>
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center"><ShieldAlert size={16}/></div>
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase">Técnica</p>
                                                        <p className="text-xs font-bold text-slate-800">{actionPlan.countermeasure}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center"><Calendar size={16}/></div>
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase">Deadline</p>
                                                        <p className="text-xs font-bold text-slate-800">{actionPlan.deadline}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-emerald-600 text-white rounded-lg flex items-center justify-center"><CheckCircle2 size={16}/></div>
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase">Responsável</p>
                                                        <p className="text-xs font-bold text-slate-800">{actionPlan.responsible}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-12 pt-8 border-t border-slate-100 flex justify-between items-end">
                                        <div>
                                            <div className="w-48 h-px bg-slate-300 mb-2"></div>
                                            <p className="text-[9px] font-black uppercase text-slate-400">Assinatura do Investigador</p>
                                            <p className="text-[10px] font-bold text-slate-600">{occurrence.interviewee.name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-black uppercase text-slate-300">Documento Gerado Digitalmente</p>
                                            <p className="text-[8px] font-bold text-slate-200 uppercase tracking-widest mt-1">SISTEMA LÍDER INVESTIGATION ENGINE</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-12 flex flex-col sm:flex-row justify-between items-center border-t pt-8 gap-4">
                        <div className="flex gap-2">
                            {history.length > 0 && <button onClick={handleBackStep} className="px-6 py-4 rounded-2xl font-black uppercase text-[10px] bg-slate-100 text-slate-400 hover:bg-slate-200 transition-all flex items-center gap-2"><ArrowLeft size={14} /> Voltar</button>}
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            {step < 6 ? (
                                <button onClick={handleNextStep} disabled={isValidating} className="w-full sm:w-auto px-12 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-all disabled:opacity-50">
                                    {isValidating ? <Loader2 size={16} className="animate-spin" /> : <>Próximo <ChevronRight size={14} /></>}
                                </button>
                            ) : (
                                <button onClick={handleSave} className="w-full sm:w-auto px-12 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-lg flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all"><Save size={18} /> Salvar e Finalizar</button>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade">
                    {investigations.map(inv => (
                        <div key={inv.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all border-l-4 border-l-blue-500">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="font-black text-slate-800 text-sm truncate max-w-[150px]">{inv.occurrence.description}</h4>
                                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{inv.occurrence.date}</span>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => handleEdit(inv)} className="text-slate-300 hover:text-blue-500 p-1"><Pencil size={16}/></button>
                                    <button onClick={() => db.collection('human_error_investigations').doc(inv.id).delete()} className="text-slate-300 hover:text-red-500 p-1"><Trash2 size={16}/></button>
                                </div>
                            </div>
                            <div className="flex justify-between text-[10px] font-bold"><span className="text-slate-400">Colaborador:</span><span className="text-slate-700">{inv.occurrence.employee.name}</span></div>
                            <button onClick={() => handleEdit(inv)} className="mt-4 w-full py-2 bg-slate-50 text-[9px] font-black text-blue-600 uppercase rounded-xl hover:bg-blue-50">Ver Detalhes</button>
                        </div>
                    ))}
                </div>
            )}

            <style>{`
                .label-Invest { display: block; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.25rem; }
                .input-Invest { width: 100%; padding: 0.75rem 1rem; border: 1px solid #e2e8f0; border-radius: 1rem; outline: none; font-size: 13px; transition: all 0.2s; color: #1e293b !important; }
                .input-Invest:focus { border-color: #3b82f6; background-color: #fff; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
            `}</style>
        </div>
    );
};

export default HumanErrorView;
