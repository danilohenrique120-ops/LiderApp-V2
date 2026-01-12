
import React, { useState, useMemo } from 'react';
import { 
    ShieldAlert, 
    PlusCircle, 
    ChevronRight, 
    Save, 
    Trash2, 
    Calendar, 
    ClipboardList,
    HelpCircle,
    CheckCircle2,
    XCircle,
    ArrowLeft
} from 'lucide-react';
// @ts-ignore
import firebase from 'firebase/compat/app';
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
    const [history, setHistory] = useState<number[]>([]); // Pilha de histórico para o botão voltar

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

    // Lógica das Regras
    const needsAdvanced = useMemo(() => Object.values(twttp).some(v => v === 'falta conhecimento'), [twttp]);
    const advancedYes = useMemo(() => Object.values(twttpAdvanced).some(v => v === 'sim'), [twttpAdvanced]);

    const handleNextStep = () => {
        setHistory([...history, step]);
        if (step === 1) setStep(2);
        else if (step === 2) {
            if (needsAdvanced) setStep(3); // Vai para TWTTP Avançada
            else setStep(4); // Vai direto para HERCA
        }
        else if (step === 3) {
            if (advancedYes) setStep(5); // Vai para Plano de Ação
            else setStep(4); // Vai para HERCA
        }
        else if (step === 4) setStep(5); // HERCA para Plano de Ação
    };

    const handleBackStep = () => {
        if (history.length > 0) {
            const lastStep = history[history.length - 1];
            setStep(lastStep);
            setHistory(history.slice(0, -1));
        }
    };

    const handleSave = async () => {
        const investigationData = {
            occurrence,
            twttp: { ...twttp, date: twttpDate },
            twttpAdvanced: needsAdvanced ? twttpAdvanced : null,
            herca: (!needsAdvanced || (needsAdvanced && !advancedYes)) ? herca : null,
            actionPlan,
            uid: user.uid,
            // Fix: Added imports for firebase and firestore so that FieldValue is correctly resolved
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            await db.collection('human_error_investigations').add(investigationData);
            alert('Investigação salva com sucesso.');
            resetForm();
        } catch (err) {
            console.error(err);
            alert('Erro ao salvar investigação.');
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setStep(1);
        setHistory([]);
        setOccurrence({
            description: '', unit: '', area: '', station: '', failureLocation: '', date: '', time: '',
            employee: { name: '', area: '', function: '' },
            interviewee: { name: '', area: '', function: '' }
        });
        setTwttpDate('');
        setActionPlan({ action: '', responsible: '', deadline: '', rootCauses: '', countermeasure: 'Treinamento em sala' });
    };

    const deleteInvestigation = async (id: string) => {
        if (confirm('Deseja excluir este registro permanentemente?')) {
            await db.collection('human_error_investigations').doc(id).delete();
        }
    };

    return (
        <div className="animate-fade">
            <header className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">ERRO HUMANO</h2>
                    <p className="text-slate-500 font-medium">Ferramenta de investigação e análise de causas raiz.</p>
                </div>
                {!showForm && (
                    <button 
                        onClick={() => setShowForm(true)} 
                        className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs shadow-xl flex items-center gap-2 hover:scale-105 transition-all"
                    >
                        <PlusCircle size={18} /> Registrar Novo Desvio
                    </button>
                )}
            </header>

            {showForm ? (
                <div className="bg-white p-8 rounded-[2.5rem] border shadow-2xl animate-fade mb-10 overflow-hidden">
                    <div className="flex justify-between items-center mb-10 border-b pb-6">
                        <div className="flex items-center gap-4">
                            <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${step === 1 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>1. Ocorrência</div>
                            <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${step === 2 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>2. TWTTP</div>
                            {step === 3 && <div className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500 text-white">3. Avançada</div>}
                            {step === 4 && <div className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-600 text-white">4. HERCA</div>}
                            {step === 5 && <div className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-600 text-white">5. Plano</div>}
                        </div>
                        <button onClick={resetForm} className="text-slate-300 hover:text-red-500 transition-colors"><XCircle size={24} /></button>
                    </div>

                    <div className="max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar">
                        {step === 1 && (
                            <div className="space-y-6 animate-fade">
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><ClipboardList size={18}/> Detalhes do Desvio</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2"><label className="label-Invest">Descrição do Problema</label><textarea placeholder="O que aconteceu?" className="input-Invest" rows={3} value={occurrence.description} onChange={e => setOccurrence({...occurrence, description: e.target.value})} /></div>
                                    <div><label className="label-Invest">Unidade</label><input className="input-Invest" value={occurrence.unit} onChange={e => setOccurrence({...occurrence, unit: e.target.value})} /></div>
                                    <div><label className="label-Invest">Área</label><input className="input-Invest" value={occurrence.area} onChange={e => setOccurrence({...occurrence, area: e.target.value})} /></div>
                                    <div><label className="label-Invest">Posto</label><input className="input-Invest" value={occurrence.station} onChange={e => setOccurrence({...occurrence, station: e.target.value})} /></div>
                                    <div><label className="label-Invest">Local da Falha</label><input className="input-Invest" value={occurrence.failureLocation} onChange={e => setOccurrence({...occurrence, failureLocation: e.target.value})} /></div>
                                    <div><label className="label-Invest">Data da ocorrência</label><input type="date" className="input-Invest" value={occurrence.date} onChange={e => setOccurrence({...occurrence, date: e.target.value})} /></div>
                                    <div><label className="label-Invest">Hora da ocorrência</label><input type="time" className="input-Invest" value={occurrence.time} onChange={e => setOccurrence({...occurrence, time: e.target.value})} /></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t pt-6">
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Colaborador</h4>
                                        <input placeholder="Nome" className="input-Invest" value={occurrence.employee.name} onChange={e => setOccurrence({...occurrence, employee: {...occurrence.employee, name: e.target.value}})} />
                                        <input placeholder="Área" className="input-Invest" value={occurrence.employee.area} onChange={e => setOccurrence({...occurrence, employee: {...occurrence.employee, area: e.target.value}})} />
                                        <input placeholder="Função" className="input-Invest" value={occurrence.employee.function} onChange={e => setOccurrence({...occurrence, employee: {...occurrence.employee, function: e.target.value}})} />
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Entrevistado</h4>
                                        <input placeholder="Nome" className="input-Invest" value={occurrence.interviewee.name} onChange={e => setOccurrence({...occurrence, interviewee: {...occurrence.interviewee, name: e.target.value}})} />
                                        <input placeholder="Área" className="input-Invest" value={occurrence.interviewee.area} onChange={e => setOccurrence({...occurrence, interviewee: {...occurrence.interviewee, area: e.target.value}})} />
                                        <input placeholder="Função" className="input-Invest" value={occurrence.interviewee.function} onChange={e => setOccurrence({...occurrence, interviewee: {...occurrence.interviewee, function: e.target.value}})} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6 animate-fade">
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><HelpCircle size={18}/> Entrevista TWTTP</h3>
                                <div className="space-y-1 mb-6">
                                    <label className="label-Invest">Data da Entrevista</label>
                                    <input type="date" className="input-Invest" value={twttpDate} onChange={e => setTwttpDate(e.target.value)} />
                                </div>
                                <div className="space-y-4">
                                    {[
                                        {id: '1', q: '1. O colaborador entende as atividades que está fazendo?'},
                                        {id: '2', q: '2. Como o colaborador sabe que está trabalhando corretamente?'},
                                        {id: '3', q: '3. Como o colaborador sabe que executou a atividade sem nenhum defeito/erro?'},
                                        {id: '4', q: '4. O que o colaborador faz caso encontre algum problema?'}
                                    ].map(item => (
                                        <div key={item.id} className="p-6 bg-slate-50 rounded-[2rem] border flex flex-col md:flex-row justify-between items-center gap-4">
                                            <p className="font-bold text-slate-700 text-sm md:flex-1">{item.q}</p>
                                            <div className="flex gap-2">
                                                {['possui conhecimento', 'falta conhecimento'].map(opt => (
                                                    <button 
                                                        key={opt}
                                                        onClick={() => setTwttp({...twttp, [item.id]: opt as any})}
                                                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${twttp[item.id] === opt ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 border'}`}
                                                    >
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6 animate-fade">
                                <h3 className="text-sm font-black text-amber-500 uppercase tracking-widest flex items-center gap-2"><HelpCircle size={18}/> TWTTP AVANÇADA</h3>
                                <div className="space-y-4">
                                    {[
                                        {id: '1', q: '1. O problema é resultante de um treinamento incompleto/insuficiente?'},
                                        {id: '2', q: '2. O problema é causado por falta de conhecimento do método ou ferramentas a serem usadas?'},
                                        {id: '3', q: '3. Este trabalho é feito menos de uma vez por semana ou já tem mais de 3 meses que foi executado pela última vez?'},
                                        {id: '4', q: '4. O problema é resultado do operador não conseguir desempenhar o trabalho de acordo com the padrão e dentro do tempo de ciclo?'},
                                        {id: '5', q: '5. O operador foi treinado, mas não tem as habilidades necessárias para realizar o trabalho?'}
                                    ].map(item => (
                                        <div key={item.id} className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100 flex flex-col md:flex-row justify-between items-center gap-4">
                                            <p className="font-bold text-amber-900 text-sm md:flex-1">{item.q}</p>
                                            <div className="flex gap-2">
                                                {['sim', 'não'].map(opt => (
                                                    <button 
                                                        key={opt}
                                                        onClick={() => setTwttpAdvanced({...twttpAdvanced, [item.id]: opt as any})}
                                                        className={`px-8 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${twttpAdvanced[item.id] === opt ? 'bg-amber-600 text-white shadow-lg' : 'bg-white text-amber-400 border border-amber-200'}`}
                                                    >
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="space-y-8 animate-fade pb-10">
                                <h3 className="text-sm font-black text-blue-600 uppercase tracking-widest flex items-center gap-2"><ShieldAlert size={18}/> Tópico HERCA</h3>
                                
                                {/* HERCA CATEGORIES */}
                                {[
                                    { title: '1. FRAQUEZA NO PROCESSO', category: 'process', qs: [
                                        {id: '1.1', q: '1.1 Existem problemas ergonômicos quando a atividade é executada?'},
                                        {id: '1.2', q: '1.2 Esta atividade é excessivamente complexa, difícil ou é uma atividade não muito clara?'},
                                        {id: '1.3', q: '1.3 Existe complexidade entre as peças que possam levar a confusão?'},
                                        {id: '1.4', q: '1.4 Este trabalho contém repetitividade excessiva?'}
                                    ]},
                                    { title: '2. FRAQUEZA NO PROCEDIMENTO', category: 'procedure', qs: [
                                        {id: '2.1', q: '2.1 A operação precisa ser descrita de uma forma mais clara e simples?'},
                                        {id: '2.2', q: '2.2 Está faltando alguma parte da operação no procedimento?'}
                                    ]},
                                    { title: '3. FERRAMENTA E EQUIPAMENTOS', category: 'tools', qs: [
                                        {id: '3.1', q: '3.1 Existe falta de condições básicas ou manutenção nas ferramentas?'},
                                        {id: '3.2', q: '3.2 As ferramentas são insuficientes ou inadequadas?'},
                                        {id: '3.3', q: '3.3 O colaborador pode escolher a ferramenta errada para a tarefa?'}
                                    ]},
                                    { title: '4. POSTO & AMBIENTE DE TRABALHO', category: 'workplace', qs: [
                                        {id: '4.1', q: '4.1 Existem problemas causados por carga de trabalho excessiva?'},
                                        {id: '4.2', q: '4.2 O posto de trabalho é desorganizado?'},
                                        {id: '4.3', q: '4.3 Existem condições desfavoráveis (iluminação, barulho, etc.)?'}
                                    ]},
                                    { title: '5. ATITUDE & ENVOLVIMENTO', category: 'attitude', qs: [
                                        {id: '5.1', q: '5.1 Existem problemas na área causados por falta de motivação?'},
                                        {id: '5.2', q: '5.2 O colaborador demonstra excesso de confiança?'},
                                        {id: '5.3', q: '5.3 O colaborador não está integrado na equipe?'}
                                    ]},
                                    { title: '6. DESATENÇÃO & ESQUECIMENTO', category: 'inattention', qs: [
                                        {id: '6.1', q: '6.1 Existem fontes de distração ou foi distraído?'},
                                        {id: '6.2', q: '6.2 O colaborador estava muito cansado?'}
                                    ]}
                                ].map(sub => (
                                    <div key={sub.title} className="space-y-4 bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                                        <h4 className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-4 border-b pb-2">{sub.title}</h4>
                                        <div className="space-y-3">
                                            {sub.qs.map(item => (
                                                <div key={item.id} className="flex flex-col md:flex-row justify-between items-center gap-4 py-2 border-b border-slate-200/50 last:border-0">
                                                    <p className="text-xs font-bold text-slate-600 md:flex-1">{item.q}</p>
                                                    <div className="flex gap-2">
                                                        {['sim', 'não'].map(opt => (
                                                            <button 
                                                                key={opt}
                                                                onClick={() => setHerca({...herca, [sub.category]: {...(herca as any)[sub.category], [item.id]: opt as any}})}
                                                                className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${((herca as any)[sub.category])[item.id] === opt ? 'bg-blue-600 text-white' : 'bg-white text-slate-400 border'}`}
                                                            >
                                                                {opt}
                                                            </button>
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
                                <h3 className="text-sm font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2"><Save size={18}/> Plano de Ação</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2"><label className="label-Invest">Causas Raízes Encontradas</label><textarea className="input-Invest" rows={2} value={actionPlan.rootCauses} onChange={e => setActionPlan({...actionPlan, rootCauses: e.target.value})} /></div>
                                    <div className="md:col-span-2"><label className="label-Invest">Descrição da Ação Corretiva</label><textarea className="input-Invest" rows={3} value={actionPlan.action} onChange={e => setActionPlan({...actionPlan, action: e.target.value})} /></div>
                                    <div><label className="label-Invest">Responsável</label><input className="input-Invest" value={actionPlan.responsible} onChange={e => setActionPlan({...actionPlan, responsible: e.target.value})} /></div>
                                    <div><label className="label-Invest">Prazo</label><input type="date" className="input-Invest" value={actionPlan.deadline} onChange={e => setActionPlan({...actionPlan, deadline: e.target.value})} /></div>
                                    <div className="md:col-span-2">
                                        <label className="label-Invest">Contramedida Sugerida</label>
                                        <select className="input-Invest font-bold" value={actionPlan.countermeasure} onChange={e => setActionPlan({...actionPlan, countermeasure: e.target.value})}>
                                            {['Treinamento em sala', 'Treinamento on the job', 'LUP', 'POP', 'Poka Yoke', 'Kaizen', 'Auxilio Visual', 'Melhoria de WO', 'Aconselhamento', 'outros..'].map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-12 flex justify-between items-center border-t pt-8">
                        {history.length > 0 ? (
                            <button 
                                onClick={handleBackStep} 
                                className="px-8 py-4 rounded-2xl font-black uppercase text-[10px] bg-slate-100 text-slate-400 hover:bg-slate-200 transition-all flex items-center gap-2"
                            >
                                <ArrowLeft size={14} /> Voltar
                            </button>
                        ) : <div></div>}
                        
                        {step < 5 ? (
                            <button 
                                onClick={handleNextStep} 
                                className="px-12 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-lg flex items-center gap-2 hover:bg-blue-700 transition-all"
                            >
                                Próximo <ChevronRight size={14} />
                            </button>
                        ) : (
                            <button 
                                onClick={handleSave} 
                                className="px-12 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-lg flex items-center gap-2 hover:bg-emerald-700 transition-all"
                            >
                                <Save size={18} /> Salvar Investigação
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {investigations.map(inv => (
                            <div key={inv.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all animate-fade border-l-4 border-l-blue-500">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center">
                                            <ShieldAlert size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-800 text-sm truncate max-w-[150px]">{inv.occurrence.description || 'Sem descrição'}</h4>
                                            <div className="flex items-center gap-1 text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                                                <Calendar size={10} /> {inv.occurrence.date}
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => deleteInvestigation(inv.id)} className="text-slate-200 hover:text-red-500 transition-colors p-1">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <div className="space-y-3 py-4 border-y border-slate-50">
                                    <div className="flex justify-between text-[10px]"><span className="font-bold text-slate-400 uppercase tracking-tighter">Colaborador:</span><span className="font-black text-slate-700 truncate">{inv.occurrence.employee.name}</span></div>
                                    <div className="flex justify-between text-[10px]"><span className="font-bold text-slate-400 uppercase tracking-tighter">Contramedida:</span><span className="font-black text-blue-600">{inv.actionPlan.countermeasure}</span></div>
                                    <div className="flex justify-between text-[10px]"><span className="font-bold text-slate-400 uppercase tracking-tighter">Prazo:</span><span className="font-black text-slate-700">{inv.actionPlan.deadline}</span></div>
                                </div>
                                <div className="mt-4 flex justify-between items-center">
                                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter ${inv.twttpAdvanced ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                        {inv.twttpAdvanced ? 'Via TWTTP Avançada' : 'Via HERCA'}
                                    </span>
                                    <span className="text-[9px] font-black text-slate-400">Resp: {inv.actionPlan.responsible}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    {investigations.length === 0 && (
                        <div className="text-center py-20 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
                            <ShieldAlert size={48} className="mx-auto text-slate-100 mb-4" />
                            <p className="text-slate-300 font-black uppercase tracking-widest text-xs italic">Nenhuma investigação registrada</p>
                        </div>
                    )}
                </div>
            )}

            <style>{`
                .label-Invest {
                    display: block;
                    font-size: 10px;
                    font-weight: 900;
                    color: #94a3b8;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    margin-left: 0.25rem;
                    margin-bottom: 0.25rem;
                }
                .input-Invest {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    background-color: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 1rem;
                    outline: none;
                    transition: all 0.2s;
                    font-size: 13px;
                }
                .input-Invest:focus {
                    border-color: #3b82f6;
                    background-color: #fff;
                    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
                }
            `}</style>
        </div>
    );
};

export default HumanErrorView;
