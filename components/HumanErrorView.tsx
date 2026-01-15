
import React, { useState, useMemo, useRef } from 'react';
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
    Eye
} from 'lucide-react';
// @ts-ignore
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import { HumanErrorInvestigation } from '../types';

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

    // Dicionário de Perguntas Técnicas
    const hercaQuestions: Record<string, Record<string, string>> = {
        process: {
            '1.1': 'O processo é complexo ou exige muito esforço físico?',
            '1.2': 'O ritmo de trabalho é controlado pela máquina/linha?',
            '1.3': 'Houve mudança recente no processo ou materiais?',
            '1.4': 'O posto de trabalho possui problemas ergonômicos?'
        },
        procedure: {
            '2.1': 'O procedimento (POP) existe e está disponível no posto?',
            '2.2': 'O procedimento é claro, fácil de ler e atualizado?'
        },
        tools: {
            '3.1': 'As ferramentas/dispositivos estão em bom estado?',
            '3.2': 'A ferramenta utilizada é a correta para a tarefa?',
            '3.3': 'A manutenção das ferramentas está em dia?'
        },
        workplace: {
            '4.1': 'O ambiente possui ruído, calor ou iluminação inadequada?',
            '4.2': 'O local de trabalho está organizado (5S)?',
            '4.3': 'Existem distrações visuais ou sonoras no ambiente?'
        },
        attitude: {
            '5.1': 'O colaborador estava tentando ganhar tempo (atalho)?',
            '5.2': 'Houve excesso de confiança na execução da tarefa?',
            '5.3': 'O colaborador ignorou algum dispositivo de segurança?'
        },
        inattention: {
            '6.1': 'A tarefa é muito repetitiva ou monótona?',
            '6.2': 'O colaborador parecia cansado ou preocupado?'
        }
    };

    const twttpAdvancedQuestions = [
        { id: '1', q: '1. Problema resultante de treinamento incompleto?' },
        { id: '2', q: '2. Falta de conhecimento do método ou ferramenta?' },
        { id: '3', q: '3. Trabalho infrequente (menos de 1x/semana ou >3 meses)?' },
        { id: '4', q: '4. Dificuldade física/tempo para manter o padrão?' },
        { id: '5', q: '5. Operador treinado, mas sem habilidade motora necessária?' }
    ];

    // Estado do formulário
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

    // Lógica de Roteamento
    const handleNextStep = () => {
        setHistory([...history, step]);
        if (step === 1) setStep(2);
        else if (step === 2) {
            if (needsAdvanced) setStep(3); 
            else setStep(4); 
        }
        else if (step === 3) setStep(5); 
        else if (step === 4) setStep(5); 
        else if (step === 5) setStep(6); 
    };

    const handleBackStep = () => {
        if (history.length > 0) {
            const lastStep = history[history.length - 1];
            setStep(lastStep);
            setHistory(history.slice(0, -1));
        }
    };

    const handleGeneratePDF = async () => {
        setIsGeneratingPdf(true);
        const element = document.getElementById('pdf-report-container');
        if (!element) {
            setIsGeneratingPdf(false);
            return;
        }
        const html2pdf = (window as any).html2pdf;
        if (!html2pdf) {
            alert("Biblioteca de PDF não carregada.");
            setIsGeneratingPdf(false);
            return;
        }

        const opt = {
            margin: [10, 10, 10, 10], 
            filename: `INVEST_EH_${occurrence.employee.name.replace(/\s+/g, '_')}_${occurrence.date}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 2, 
                useCORS: true, 
                letterRendering: true,
                logging: false,
                scrollY: 0,
                scrollX: 0
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        try {
            window.scrollTo(0, 0);
            await html2pdf().set(opt).from(element).save();
        } catch (error) {
            console.error(error);
            alert("Falha ao processar o PDF.");
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const handleEdit = (inv: HumanErrorInvestigation) => {
        setOccurrence(inv.occurrence);
        setTwttpDate((inv.twttp as any).date || '');
        const cleanTwttp = { ...inv.twttp };
        delete (cleanTwttp as any).date;
        setTwttp(cleanTwttp as any);
        if (inv.twttpAdvanced) setTwttpAdvanced(inv.twttpAdvanced);
        if (inv.herca) setHerca(inv.herca as any);
        
        const knownCountermeasures = [
            'Treinamento em sala', 'Instrução de Trabalho (LUP)', 'Mudança de Processo', 
            'Poka-Yoke (Dispositivo à prova de erro)', 'Melhoria Ergonômica', 
            'Advertência / Medida Disciplinar', 'Mudança de Posto / Função'
        ];
        
        if (inv.actionPlan.countermeasure && !knownCountermeasures.includes(inv.actionPlan.countermeasure)) {
            setActionPlan({ ...inv.actionPlan, countermeasure: 'Outros' });
            setCustomCountermeasure(inv.actionPlan.countermeasure);
        } else {
            setActionPlan(inv.actionPlan);
            setCustomCountermeasure('');
        }

        setEditingId(inv.id);
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
            if (editingId) {
                await db.collection('human_error_investigations').doc(editingId).update(investigationData);
            } else {
                await db.collection('human_error_investigations').add(investigationData);
            }
            alert('Investigação salva com sucesso!');
            resetForm();
        } catch (err) {
            alert('Erro ao salvar no banco de dados.');
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setStep(1);
        setHistory([]);
        setEditingId(null);
        setCustomCountermeasure('');
        setOccurrence({
            description: '', unit: '', area: '', station: '', failureLocation: '', date: '', time: '',
            employee: { name: '', area: '', function: '' },
            interviewee: { name: '', area: '', function: '' }
        });
        setTwttpDate('');
        setTwttp({ '1': 'possui conhecimento', '2': 'possui conhecimento', '3': 'possui conhecimento', '4': 'possui conhecimento' });
        setTwttpAdvanced({ '1': 'não', '2': 'não', '3': 'não', '4': 'não', '5': 'não' });
        setHerca({
            process: { '1.1': 'não', '1.2': 'não', '1.3': 'não', '1.4': 'não' },
            procedure: { '2.1': 'não', '2.2': 'não' },
            tools: { '3.1': 'não', '3.2': 'não', '3.3': 'não' },
            workplace: { '4.1': 'não', '4.2': 'não', '4.3': 'não' },
            attitude: { '5.1': 'não', '5.2': 'não', '5.3': 'não' },
            inattention: { '6.1': 'não', '6.2': 'não' }
        });
        setActionPlan({ action: '', responsible: '', deadline: '', rootCauses: '', countermeasure: 'Treinamento em sala' });
    };

    return (
        <div className="animate-fade">
            <header className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">ERRO HUMANO</h2>
                    <p className="text-slate-500 font-medium">Investigação técnica Método Sistema Líder.</p>
                </div>
                {!showForm && (
                    <button 
                        onClick={() => { resetForm(); setShowForm(true); }} 
                        className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs shadow-xl flex items-center gap-2 hover:scale-105 transition-all"
                    >
                        <PlusCircle size={18} /> Novo Registro
                    </button>
                )}
            </header>

            {showForm ? (
                <div className="bg-white p-8 rounded-[2.5rem] border shadow-2xl animate-fade mb-10 overflow-hidden relative">
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
                                    <div className="md:col-span-2"><label className="label-Invest">Descrição do Problema</label><textarea placeholder="O que aconteceu de forma técnica?" className="input-Invest" rows={3} value={occurrence.description} onChange={e => setOccurrence({...occurrence, description: e.target.value})} /></div>
                                    <div><label className="label-Invest">Unidade / Estação</label><input className="input-Invest" placeholder="Ex: Planta 1 / Estação 05" value={occurrence.unit} onChange={e => setOccurrence({...occurrence, unit: e.target.value})} /></div>
                                    <div><label className="label-Invest">Data/Hora</label><div className="flex gap-2"><input type="date" className="input-Invest flex-1" value={occurrence.date} onChange={e => setOccurrence({...occurrence, date: e.target.value})} /><input type="time" className="input-Invest w-32" value={occurrence.time} onChange={e => setOccurrence({...occurrence, time: e.target.value})} /></div></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t pt-6">
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Colaborador Envolvido</h4>
                                        <input placeholder="Nome Completo" className="input-Invest" value={occurrence.employee.name} onChange={e => setOccurrence({...occurrence, employee: {...occurrence.employee, name: e.target.value}})} />
                                        <input placeholder="Função / Cargo" className="input-Invest" value={occurrence.employee.function} onChange={e => setOccurrence({...occurrence, employee: {...occurrence.employee, function: e.target.value}})} />
                                        <input placeholder="Área" className="input-Invest" value={occurrence.employee.area} onChange={e => setOccurrence({...occurrence, employee: {...occurrence.employee, area: e.target.value}})} />
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Investigador (Líder)</h4>
                                        <input placeholder="Nome" className="input-Invest" value={occurrence.interviewee.name} onChange={e => setOccurrence({...occurrence, interviewee: {...occurrence.interviewee, name: e.target.value}})} />
                                        <div className="grid grid-cols-2 gap-2">
                                            <input placeholder="Área" className="input-Invest" value={occurrence.interviewee.area} onChange={e => setOccurrence({...occurrence, interviewee: {...occurrence.interviewee, area: e.target.value}})} />
                                            <input placeholder="Função" className="input-Invest" value={occurrence.interviewee.function} onChange={e => setOccurrence({...occurrence, interviewee: {...occurrence.interviewee, function: e.target.value}})} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6 animate-fade">
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><HelpCircle size={18}/> Entrevista TWTTP</h3>
                                <div className="space-y-4">
                                    {[
                                        {id: '1', q: '1. O colaborador entende as atividades que está fazendo?'},
                                        {id: '2', q: '2. Como o colaborador sabe que está trabalhando corretamente?'},
                                        {id: '3', q: '3. Como o colaborador sabe que executou a atividade sem erros?'},
                                        {id: '4', q: '4. O que o colaborador faz caso encontre algum problema?'}
                                    ].map(item => (
                                        <div key={item.id} className="p-6 bg-slate-50 rounded-[2rem] border flex flex-col md:flex-row justify-between items-center gap-4">
                                            <p className="font-bold text-slate-700 text-sm md:flex-1">{item.q}</p>
                                            <div className="flex gap-2">
                                                {['possui conhecimento', 'falta conhecimento'].map(opt => (
                                                    <button key={opt} onClick={() => setTwttp({...twttp, [item.id]: opt as any})} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${twttp[item.id] === opt ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 border'}`}>{opt}</button>
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
                                        <h4 className="text-[10px] font-black text-blue-600 uppercase mb-4">{category === 'process' ? 'Processo' : category === 'procedure' ? 'Procedimento' : category === 'tools' ? 'Ferramenta' : category === 'workplace' ? 'Ambiente' : category === 'attitude' ? 'Atitude' : 'Desatenção'}</h4>
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2"><label className="label-Invest">Causas Raízes Identificadas</label><textarea placeholder="Explique o porquê do erro..." className="input-Invest" rows={2} value={actionPlan.rootCauses} onChange={e => setActionPlan({...actionPlan, rootCauses: e.target.value})} /></div>
                                    <div className="md:col-span-2"><label className="label-Invest">Ação Corretiva Imediata</label><textarea placeholder="O que será feito para evitar reincidência?" className="input-Invest" rows={3} value={actionPlan.action} onChange={e => setActionPlan({...actionPlan, action: e.target.value})} /></div>
                                    <div><label className="label-Invest">Responsável</label><input className="input-Invest" value={actionPlan.responsible} onChange={e => setActionPlan({...actionPlan, responsible: e.target.value})} /></div>
                                    <div>
                                        <label className="label-Invest">Contramedida Técnica</label>
                                        <select className="input-Invest font-bold" value={actionPlan.countermeasure} onChange={e => setActionPlan({...actionPlan, countermeasure: e.target.value})}>
                                            <option>Treinamento em sala</option>
                                            <option>Instrução de Trabalho (LUP)</option>
                                            <option>Mudança de Processo</option>
                                            <option>Poka-Yoke (Dispositivo à prova de erro)</option>
                                            <option>Melhoria Ergonômica</option>
                                            <option>Advertência / Medida Disciplinar</option>
                                            <option>Mudança de Posto / Função</option>
                                            <option value="Outros">Outros...</option>
                                        </select>
                                    </div>
                                    {actionPlan.countermeasure === 'Outros' && (
                                        <div className="md:col-span-2 animate-fade">
                                            <label className="label-Invest text-blue-600">Especifique a Contramedida</label>
                                            <input className="input-Invest border-blue-200" placeholder="Digite aqui a ação customizada..." value={customCountermeasure} onChange={e => setCustomCountermeasure(e.target.value)} />
                                        </div>
                                    )}
                                    <div><label className="label-Invest">Prazo Final</label><input type="date" className="input-Invest" value={actionPlan.deadline} onChange={e => setActionPlan({...actionPlan, deadline: e.target.value})} /></div>
                                </div>
                            </div>
                        )}

                        {step === 6 && (
                            <div className="space-y-8 animate-fade pb-10">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><Eye size={18}/> Relatório Técnico Final</h3>
                                    <button onClick={handleGeneratePDF} disabled={isGeneratingPdf} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] flex items-center gap-2 shadow-lg hover:bg-emerald-700">
                                        {isGeneratingPdf ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Download size={14} />}
                                        Gerar PDF A4
                                    </button>
                                </div>

                                <div className="bg-slate-100 p-8 rounded-[2.5rem] border shadow-inner">
                                    <div 
                                        id="pdf-report-container" 
                                        style={{ 
                                            width: '210mm', 
                                            minHeight: '297mm', 
                                            backgroundColor: '#ffffff',
                                            margin: '0 auto',
                                            padding: '20mm'
                                        }}
                                        className="text-slate-800 font-sans shadow-2xl"
                                    >
                                        {/* Header PDF */}
                                        <div style={{ pageBreakInside: 'avoid', marginBottom: '20px' }} className="flex justify-between items-center border-b-4 border-slate-900 pb-6">
                                            <div>
                                                <h1 className="text-3xl font-black uppercase tracking-tighter">RELATÓRIO DE ERRO HUMANO</h1>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Padrão Sistema Líder • Gestão Industrial</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black uppercase bg-slate-100 px-2 py-1 rounded">DATA: {new Date().toLocaleDateString()}</p>
                                            </div>
                                        </div>

                                        {/* Info Block */}
                                        <div style={{ pageBreakInside: 'avoid', marginBottom: '20px' }} className="grid grid-cols-2 gap-8 border-b pb-8">
                                            <div className="space-y-4">
                                                <h2 className="text-[11px] font-black uppercase bg-slate-900 text-white px-3 py-1 inline-block">1. Informações do Colaborador</h2>
                                                <p className="text-xs"><strong>Nome:</strong> {occurrence.employee.name}</p>
                                                <p className="text-xs"><strong>Função:</strong> {occurrence.employee.function}</p>
                                                <p className="text-xs"><strong>Área:</strong> {occurrence.employee.area}</p>
                                            </div>
                                            <div className="space-y-4">
                                                <h2 className="text-[11px] font-black uppercase bg-slate-900 text-white px-3 py-1 inline-block">2. Investigador Responsável</h2>
                                                <p className="text-xs"><strong>Nome:</strong> {occurrence.interviewee.name}</p>
                                                <p className="text-xs"><strong>Área:</strong> {occurrence.interviewee.area}</p>
                                                <p className="text-xs"><strong>Função:</strong> {occurrence.interviewee.function}</p>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <div style={{ pageBreakInside: 'avoid', marginBottom: '20px' }} className="p-4 bg-slate-50 border-l-4 border-slate-900">
                                            <h2 className="text-[11px] font-black uppercase mb-2">3. Descrição do Desvio</h2>
                                            <p className="text-xs leading-relaxed italic">{occurrence.description}</p>
                                        </div>

                                        {/* TWTTP Result */}
                                        <div style={{ pageBreakInside: 'avoid', marginBottom: '20px' }}>
                                            <h2 className="text-[11px] font-black uppercase mb-4 bg-slate-900 text-white px-3 py-1 inline-block">4. Validação de Conhecimento (TWTTP)</h2>
                                            <table className="w-full border-2 border-slate-900 border-collapse">
                                                <thead className="bg-slate-100">
                                                    <tr>
                                                        <th className="border-2 border-slate-900 p-2 text-left text-[10px] font-black uppercase">Critério Avaliado</th>
                                                        <th className="border-2 border-slate-900 p-2 text-center text-[10px] font-black uppercase">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {Object.entries(twttp).map(([id, status]) => (
                                                        <tr key={id}>
                                                            <td className="border-2 border-slate-900 p-2 text-[10px] font-bold">Avaliação TWTTP #{id}</td>
                                                            <td className={`border-2 border-slate-900 p-2 text-[10px] text-center font-black uppercase ${status === 'falta conhecimento' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>{status}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Advanced or HERCA Result */}
                                        <div style={{ pageBreakInside: 'avoid', marginBottom: '20px' }}>
                                            <h2 className="text-[11px] font-black uppercase mb-4 bg-slate-900 text-white px-3 py-1 inline-block">
                                                {needsAdvanced ? '5. TWTTP Avançada (Gap de Conhecimento)' : '5. Fatores de Risco (HERCA)'}
                                            </h2>
                                            <div className="flex flex-wrap gap-2">
                                                {needsAdvanced ? (
                                                    twttpAdvancedQuestions.filter(q => twttpAdvanced[q.id] === 'sim').map(q => (
                                                        <div key={q.id} className="text-[9px] bg-amber-50 border-2 border-amber-600 p-2 text-amber-900 font-bold uppercase w-full">
                                                            [X] {q.q}
                                                        </div>
                                                    ))
                                                ) : (
                                                    Object.entries(herca).map(([cat, q]) => (
                                                        Object.entries(q).filter(([_, v]) => v === 'sim').map(([qId, _]) => (
                                                            <div key={`${cat}-${qId}`} className="text-[9px] bg-blue-50 border-2 border-blue-600 p-2 text-blue-900 font-bold uppercase">
                                                                [X] {hercaQuestions[cat][qId]}
                                                            </div>
                                                        ))
                                                    )).flat()
                                                )}
                                                {(!needsAdvanced && Object.values(herca).every(cat => Object.values(cat).every(v => v === 'não'))) && (
                                                    <p className="text-xs italic text-slate-400">Nenhum fator crítico HERCA detectado.</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Plan Result */}
                                        <div style={{ pageBreakInside: 'avoid', borderTop: '4px solid #0f172a', paddingTop: '20px' }}>
                                            <h2 className="text-[11px] font-black uppercase bg-emerald-600 text-white px-3 py-1 inline-block mb-6">6. Contramedida e Plano de Ação</h2>
                                            <div className="grid grid-cols-2 gap-10">
                                                <div className="space-y-4">
                                                    <p className="text-[10px] font-black uppercase text-slate-400">Causa Raiz:</p>
                                                    <p className="text-xs font-bold leading-relaxed">{actionPlan.rootCauses}</p>
                                                    <p className="text-[10px] font-black uppercase text-slate-400 mt-4">Contramedida:</p>
                                                    <p className="text-xs font-black text-blue-700 bg-blue-50 border border-blue-200 p-2 uppercase inline-block">
                                                        {actionPlan.countermeasure === 'Outros' ? customCountermeasure : actionPlan.countermeasure}
                                                    </p>
                                                </div>
                                                <div className="space-y-4">
                                                    <p className="text-[10px] font-black uppercase text-slate-400">Ação Principal:</p>
                                                    <p className="text-xs leading-relaxed">{actionPlan.action}</p>
                                                    <div className="pt-4 grid grid-cols-2 gap-2 border-t border-slate-100">
                                                        <div><p className="text-[9px] font-black uppercase text-slate-400">Dono:</p><p className="text-[10px] font-black">{actionPlan.responsible}</p></div>
                                                        <div><p className="text-[9px] font-black uppercase text-slate-400">Prazo:</p><p className="text-[10px] font-black">{actionPlan.deadline}</p></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-12 flex flex-col sm:flex-row justify-between items-center border-t pt-8 gap-4">
                        <div className="flex gap-2 w-full sm:w-auto">
                            {history.length > 0 && (
                                <button onClick={handleBackStep} className="flex-1 sm:flex-none px-6 py-4 rounded-2xl font-black uppercase text-[10px] bg-slate-100 text-slate-400 hover:bg-slate-200 transition-all flex items-center justify-center gap-2"><ArrowLeft size={14} /> Voltar</button>
                            )}
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            {step < 6 ? (
                                <button onClick={handleNextStep} className="w-full sm:w-auto px-12 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-all">Próximo <ChevronRight size={14} /></button>
                            ) : (
                                <button onClick={handleSave} className="w-full sm:w-auto px-12 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-lg flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all">
                                    <Save size={18} /> Salvar e Finalizar
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-6 animate-fade">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {investigations.map(inv => (
                            <div key={inv.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all border-l-4 border-l-blue-500 group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center"><ShieldAlert size={20} /></div>
                                        <div className="flex flex-col overflow-hidden">
                                            <h4 className="font-black text-slate-800 text-sm truncate max-w-[150px]">{inv.occurrence.description}</h4>
                                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{inv.occurrence.date}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => handleEdit(inv)} className="text-slate-300 hover:text-blue-500 p-1"><Pencil size={16}/></button>
                                        <button onClick={() => { if(confirm('Excluir investigação?')) db.collection('human_error_investigations').doc(inv.id).delete() }} className="text-slate-300 hover:text-red-500 p-1"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                                <div className="space-y-2 py-4 border-y border-slate-50">
                                    <div className="flex justify-between text-[10px] font-bold"><span className="text-slate-400 uppercase">Colaborador:</span><span className="text-slate-700 truncate max-w-[100px]">{inv.occurrence.employee.name}</span></div>
                                    <div className="flex justify-between text-[10px] font-bold"><span className="text-slate-400 uppercase">Contramedida:</span><span className="text-blue-600 text-right">{inv.actionPlan.countermeasure}</span></div>
                                </div>
                                <div className="mt-4 flex justify-between items-center">
                                    <span className="px-2 py-1 bg-slate-100 text-[8px] font-black uppercase rounded text-slate-500">{inv.occurrence.area}</span>
                                    <button onClick={() => handleEdit(inv)} className="text-[9px] font-black text-blue-600 uppercase flex items-center gap-1 group-hover:translate-x-1 transition-transform">Ver <Eye size={10}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <style>{`
                .label-Invest { display: block; font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.25rem; }
                .input-Invest { width: 100%; padding: 0.75rem 1rem; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 1rem; outline: none; font-size: 13px; transition: all 0.2s; }
                .input-Invest:focus { border-color: #3b82f6; background-color: #fff; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
            `}</style>
        </div>
    );
};

export default HumanErrorView;
