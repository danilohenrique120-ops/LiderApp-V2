import React, { useState, useEffect } from 'react';
import {
    Search,
    CheckCircle2,
    Plus,
    ChevronRight,
    ArrowLeft,
    Save,
    AlertTriangle,
    Target,
    ListChecks,
    Users,
    Settings,
    MapPin,
    PenTool,
    BookOpen,
    Trash2,
    CalendarClock,
    Clock,
    GripVertical
} from 'lucide-react';
import { RCAInvestigation, RCAToolType, RCAActionPlanItem, User } from '../types';
import EmptyState from './EmptyState';
import firebase from '../services/firebase';
import { AiService } from '../services/AiService';
interface Props {
    investigations: RCAInvestigation[];
    user: User | null;
    db: any;
}

type ViewState = 'LIST' | 'DETAILS' | 'WIZARD';
type WizardStep = 1 | 2 | 3 | 4;

const ISHIKAWA_CATEGORIES = [
    { id: 'method', label: 'Método (Procedimentos)', icon: BookOpen },
    { id: 'machine', label: 'Máquina (Equipamentos)', icon: Settings },
    { id: 'material', label: 'Material (Matéria-prima)', icon: Target },
    { id: 'manpower', label: 'Mão-de-Obra (Pessoas)', icon: Users },
    { id: 'measurement', label: 'Medida (Indicadores/Inspeção)', icon: ListChecks },
    { id: 'mother_nature', label: 'Meio Ambiente (Local)', icon: MapPin },
];

const CauseAnalysisView: React.FC<Props> = ({ investigations, user, db }) => {
    const [view, setView] = useState<ViewState>('LIST');
    const [currentStep, setCurrentStep] = useState<WizardStep>(1);
    
    // Draft State for new creation
    const [draftTitle, setDraftTitle] = useState('');
    const [draftDescription, setDraftDescription] = useState('');
    const [draftTool, setDraftTool] = useState<RCAToolType | null>(null);
    const [draftWhys, setDraftWhys] = useState<string[]>(['', '', '', '', '']);
    const [draftIshikawa, setDraftIshikawa] = useState<Record<string, string[]>>({
        method: [], machine: [], material: [], manpower: [], measurement: [], mother_nature: []
    });
    const [ishikawaInput, setIshikawaInput] = useState('');
    const [draftActions, setDraftActions] = useState<RCAActionPlanItem[]>([]);
    
    const [newActionItem, setNewActionItem] = useState({ action: '', responsible: '', deadline: '' });
    const [isSaving, setIsSaving] = useState(false);

    // Draft State for Viewing details
    const [selectedInvestigation, setSelectedInvestigation] = useState<RCAInvestigation | null>(null);

    // ======= METODOS WIZARD =======
    const resetWizard = () => {
        setDraftTitle('');
        setDraftDescription('');
        setDraftTool(null);
        setDraftWhys(['', '', '', '', '']);
        setDraftIshikawa({ method: [], machine: [], material: [], manpower: [], measurement: [], mother_nature: [] });
        setDraftActions([]);
        setNewActionItem({ action: '', responsible: '', deadline: '' });
        setCurrentStep(1);
    };

    const startNewInvestigation = () => {
        resetWizard();
        setView('WIZARD');
    };

    const addActionToDraft = () => {
        if (!newActionItem.action.trim()) {
             alert('A tarefa foca (O que fazer?) é obrigatória para o plano de ação.');
             return;
        }
        setDraftActions(prev => [...prev, {
            id: Date.now().toString(),
            action: newActionItem.action.trim(),
            responsible: newActionItem.responsible.trim() || 'Não Definido',
            deadline: newActionItem.deadline || 'Sem Prazo',
            status: 'Pendente'
        }]);
        setNewActionItem({ action: '', responsible: '', deadline: '' });
    };

    const removeActionFromDraft = (id: string) => {
        setDraftActions(prev => prev.filter(a => a.id !== id));
    };

    const addTargetIshikawa = (catId: string) => {
        if (!ishikawaInput.trim()) return;
        setDraftIshikawa(prev => ({
            ...prev,
            [catId]: [...prev[catId], ishikawaInput.trim()]
        }));
        setIshikawaInput('');
    };

    const removeTargetIshikawa = (catId: string, idx: number) => {
        setDraftIshikawa(prev => ({
            ...prev,
            [catId]: prev[catId].filter((_, i) => i !== idx)
        }));
    };

    const saveInvestigation = async () => {
        if (!user || !db || !draftTool) return;
        setIsSaving(true);
        
        try {
            // Cobrança de Créditos
            const aiService = AiService.getInstance();
            const hasCredits = await aiService.consumeCredits(user, db, 5, 'RCA');
            if (!hasCredits) {
                alert("Você não possui Líder Coins suficientes (Custo: 5). Por favor, realize um upgrade do seu plano.");
                setIsSaving(false);
                return;
            }

            const toolData = draftTool === '5_WHYS' ? draftWhys.filter(w => w.trim() !== '') : draftIshikawa;
            
            const newRCA: Omit<RCAInvestigation, "id"> = {
                title: draftTitle,
                description: draftDescription,
                tool: draftTool,
                toolData: toolData,
                actionPlan: draftActions,
                status: 'Aberto',
                uid: user.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await db.collection('rca_investigations').add(newRCA);
            setView('LIST');
        } catch (error) {
            console.error("Erro ao salvar RCA: ", error);
            alert("Não foi possível salvar a investigação.");
        } finally {
            setIsSaving(false);
        }
    };

    // ======= METODOS DETAILS =======
    const toggleActionStatus = async (investigationId: string, actionId: string) => {
        if (!db) return;
        
        const investigation = investigations.find(i => i.id === investigationId);
        if (!investigation) return;

        const originalItem = investigation.actionPlan.find(a => a.id === actionId);
        const newStatus = originalItem?.status === 'Pendente' ? 'Concluído' : 'Pendente';

        const updatedPlan = investigation.actionPlan.map(a => 
            a.id === actionId ? { ...a, status: newStatus } : a
        );

        // Update selected state locally for instant feedback
        if (selectedInvestigation && selectedInvestigation.id === investigationId) {
            setSelectedInvestigation({ ...selectedInvestigation, actionPlan: updatedPlan });
        }

        try {
            await db.collection('rca_investigations').doc(investigationId).update({
                actionPlan: updatedPlan
            });
            
            // Check if all actions are completed, if so, close the RCA automatically
            const allCompleted = updatedPlan.every(a => a.status === 'Concluído');
            const newGlobalStatus = allCompleted ? 'Concluído' : 'Aberto';
            if (investigation.status !== newGlobalStatus) {
                 await db.collection('rca_investigations').doc(investigationId).update({
                    status: newGlobalStatus
                });
            }
            
        } catch (error) {
            console.error("Erro ao dar baixa", error);
        }
    };


    // ======= RENDERIZADORES =======
    const renderList = () => (
        <div className="max-w-6xl mx-auto space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                        <Search className="text-blue-600" />
                        Resolução de Problemas
                    </h2>
                    <p className="text-slate-500 font-medium text-sm mt-1">Histórico de Análises de Causa Raiz e Planos de Ação</p>
                </div>
                <button 
                    onClick={startNewInvestigation}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                >
                    <Plus size={16} /> Nova Análise
                </button>
            </header>

            {investigations.length === 0 ? (
                <EmptyState
                    title="Nenhuma investigação registrada"
                    description="Inicie a sua primeira análise de causa para bloquear reincidências de falhas no seu processo."
                    primaryActionLabel="Criar Primeira Análise"
                    onPrimaryAction={startNewInvestigation}
                    height="h-[60vh]"
                />
            ) : (
                <div className="bg-white border text-center rounded-[2rem] overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100 uppercase text-[10px] tracking-widest text-slate-400 font-bold">
                                    <th className="p-5">Ocorrência</th>
                                    <th className="p-5">Ferramenta R.C.A</th>
                                    <th className="p-5">Plano de Ação</th>
                                    <th className="p-5">Status</th>
                                    <th className="p-5 text-right">Acão</th>
                                </tr>
                            </thead>
                            <tbody>
                                {investigations.map(inv => {
                                    const actionPlan = inv.actionPlan || [];
                                    const completedActions = actionPlan.filter(a => a.status === 'Concluído').length;
                                    const totalActions = actionPlan.length;
                                    
                                    return (
                                        <tr key={inv.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                            <td className="p-5">
                                                <div className="font-bold text-sm text-slate-700">{inv.title}</div>
                                                <div className="text-xs text-slate-400 truncate max-w-[200px] mt-0.5">{inv.description}</div>
                                            </td>
                                            <td className="p-5">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                                    inv.tool === '5_WHYS' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-fuchsia-50 text-fuchsia-600 border border-fuchsia-100'
                                                }`}>
                                                    {inv.tool === '5_WHYS' ? '5 Porquês' : 'Ishikawa'}
                                                </span>
                                            </td>
                                            <td className="p-5">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden w-24">
                                                        <div 
                                                            className={`h-full ${totalActions > 0 && completedActions === totalActions ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                                            style={{ width: `${totalActions > 0 ? (completedActions / totalActions) * 100 : 0}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-[10px] font-black text-slate-500">{completedActions}/{totalActions}</span>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                                    inv.status === 'Concluído' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-amber-50 border-amber-200 text-amber-600'
                                                }`}>
                                                    {inv.status === 'Concluído' ? <CheckCircle2 size={12}/> : <Clock size={12}/>}
                                                    {inv.status}
                                                </span>
                                            </td>
                                            <td className="p-5 text-right">
                                                <button 
                                                    onClick={() => { setSelectedInvestigation(inv); setView('DETAILS'); }}
                                                    className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100 inline-block"
                                                >
                                                    <ChevronRight size={20} />
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );

    const renderDetails = () => {
        if (!selectedInvestigation) return null;
        const actionPlan = selectedInvestigation.actionPlan || [];
        const totalAcoes = actionPlan.length;
        const concluidas = actionPlan.filter(a => a.status === 'Concluído').length;

        return (
            <div className="max-w-4xl mx-auto animate-fade">
                <button onClick={() => setView('LIST')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors mb-8">
                    <ArrowLeft size={16} /> Voltar para Lista
                </button>

                <div className="bg-white border rounded-[2rem] p-8 md:p-10 shadow-sm relative overflow-hidden">
                    <div className="lg:absolute top-0 right-0 p-8 flex items-end flex-col gap-2">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                selectedInvestigation.status === 'Concluído' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-amber-50 border-amber-200 text-amber-600'
                            }`}>
                            {selectedInvestigation.status}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 border border-slate-200`}>
                            {selectedInvestigation.tool === '5_WHYS' ? '5 Porquês' : 'Ishikawa'}
                        </span>
                    </div>

                    <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-tight mb-4 pr-32">{selectedInvestigation.title}</h2>
                    <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-2xl">{selectedInvestigation.description}</p>
                    
                    <hr className="my-10 border-slate-100" />

                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Mapeamento da Causa Raiz</h3>
                    
                    {selectedInvestigation.tool === '5_WHYS' ? (
                         <div className="space-y-4">
                            {(selectedInvestigation.toolData as string[] || []).map((why, i) => (
                                <div key={i} className="flex gap-4 items-start p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-xs shrink-0">
                                        {i + 1}º
                                    </div>
                                    <div className="flex-1 mt-1 font-medium text-slate-700">{why}</div>
                                </div>
                            ))}
                         </div>
                    ) : (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {ISHIKAWA_CATEGORIES.map(cat => {
                                const entries = (selectedInvestigation.toolData as Record<string, string[]>)[cat.id] || [];
                                if (entries.length === 0) return null;
                                return (
                                    <div key={cat.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                        <h4 className="flex items-center gap-2 text-xs font-black text-fuchsia-600 uppercase tracking-widest mb-3">
                                            <cat.icon size={14} /> {cat.label.split(' ')[0]}
                                        </h4>
                                        <ul className="space-y-2">
                                            {entries.map((entry, idx) => (
                                                <li key={idx} className="text-xs font-medium text-slate-600 flex items-start gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-300 mt-1.5"></div>
                                                    {entry}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )
                            })}
                         </div>
                    )}

                    <hr className="my-10 border-slate-100" />

                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Acompanhamento e Execução</h3>
                            <p className="text-xl font-black text-slate-800 tracking-tight mt-1">Plano de Ação</p>
                        </div>
                        <div className="text-right">
                             <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Progresso</div>
                             <div className="text-xl font-black text-blue-600">{concluidas}/{totalAcoes}</div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {(selectedInvestigation.actionPlan || []).map(action => (
                            <div key={action.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                                action.status === 'Concluído' ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200 hover:border-blue-300'
                            }`}>
                                <div className="flex items-center gap-4 flex-1">
                                    <button 
                                        onClick={() => toggleActionStatus(selectedInvestigation.id, action.id)}
                                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                            action.status === 'Concluído' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 text-transparent hover:border-blue-500 hover:text-blue-500'
                                        }`}
                                    >
                                        <CheckCircle2 size={16} />
                                    </button>
                                    <div>
                                        <p className={`text-sm font-bold ${action.status === 'Concluído' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                            {action.action}
                                        </p>
                                        <div className="flex items-center gap-3 mt-1 opacity-70">
                                            <span className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1 text-slate-500">
                                                <Users size={10} /> {action.responsible}
                                            </span>
                                            <span className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1 text-slate-500">
                                                <CalendarClock size={10} /> {action.deadline}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const renderWizard = () => (
        <div className="max-w-4xl mx-auto animate-fade">
             <button onClick={() => setView('LIST')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors mb-8">
                Cancelar Investigação
             </button>

             <div className="flex justify-between items-center mb-10 w-full max-w-sm mx-auto relative relative">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 -z-10 rounded-full"></div>
                <div className="absolute top-1/2 left-0 h-1 bg-blue-500 -translate-y-1/2 -z-10 rounded-full transition-all duration-500" style={{ width: `${((currentStep - 1) / 3) * 100}%`}}></div>
                
                {[1, 2, 3, 4].map(step => (
                    <div key={step} className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all duration-500 ${
                        currentStep === step ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] scale-110' : 
                        currentStep > step ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
                    }`}>
                        {currentStep > step ? <CheckCircle2 size={16} /> : step}
                    </div>
                ))}
             </div>

             <div className="bg-white border rounded-[2rem] p-8 md:p-12 shadow-sm min-h-[400px]">
                 
                 {/* ETAPA 1: OCORRÊNCIA */}
                 {currentStep === 1 && (
                     <div className="space-y-6 animate-fade">
                         <h3 className="text-2xl font-black text-slate-800 tracking-tight">Registro Inicial</h3>
                         <p className="text-slate-500 text-sm font-medium mb-6">Descreva a anomalia ou desvio que precisa ser investigado.</p>
                         
                         <label className="block space-y-2">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título do Problema</span>
                             <input 
                                value={draftTitle} 
                                onChange={e => setDraftTitle(e.target.value)}
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700 focus:ring-4 focus:ring-blue-100 focus:border-blue-300 transition-all"
                                placeholder="Ex: Atraso na Expedição Linha C"
                             />
                         </label>
                         
                         <label className="block space-y-2">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição Detalhada</span>
                             <textarea 
                                value={draftDescription} 
                                onChange={e => setDraftDescription(e.target.value)}
                                rows={5}
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-700 focus:ring-4 focus:ring-blue-100 focus:border-blue-300 transition-all resize-none"
                                placeholder="Relate o que ocorreu, onde e quais foram os impactos imediatos..."
                             ></textarea>
                         </label>

                         <div className="flex justify-end pt-6">
                            <button 
                                onClick={() => setCurrentStep(2)}
                                disabled={!draftTitle.trim() || !draftDescription.trim()}
                                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2"
                            >
                                Selecionar Ferramenta <ChevronRight size={16} />
                            </button>
                         </div>
                     </div>
                 )}

                 {/* ETAPA 2: ESCOLHER FERRAMENTA */}
                 {currentStep === 2 && (
                    <div className="space-y-6 animate-fade">
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">Ferramenta R.C.A</h3>
                        <p className="text-slate-500 text-sm font-medium mb-8">Escolha a metodologia que melhor se adapta a este formato de problema.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <button 
                                onClick={() => setDraftTool('5_WHYS')}
                                className={`text-left p-6 md:p-8 rounded-2xl border-2 transition-all ${
                                    draftTool === '5_WHYS' ? 'border-indigo-500 bg-indigo-50 shadow-[0_10px_30px_rgba(99,102,241,0.2)] scale-[1.02]' : 'border-slate-200 hover:border-indigo-300 bg-white'
                                }`}
                            >
                                <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-6">
                                    <ListChecks size={24} />
                                </div>
                                <h4 className="text-lg font-black text-slate-800 mb-2">5 Porquês</h4>
                                <p className="text-sm font-medium text-slate-500">Técnica linear profunda. Ideal para falhas humanas e de processo lógico onde uma causa gera a outra em cascata.</p>
                            </button>

                            <button 
                                onClick={() => setDraftTool('ISHIKAWA')}
                                className={`text-left p-6 md:p-8 rounded-2xl border-2 transition-all ${
                                    draftTool === 'ISHIKAWA' ? 'border-fuchsia-500 bg-fuchsia-50 shadow-[0_10px_30px_rgba(217,70,239,0.2)] scale-[1.02]' : 'border-slate-200 hover:border-fuchsia-300 bg-white'
                                }`}
                            >
                                <div className="w-12 h-12 rounded-xl bg-fuchsia-100 text-fuchsia-600 flex items-center justify-center mb-6">
                                    <PenTool size={24} />
                                </div>
                                <h4 className="text-lg font-black text-slate-800 mb-2">Ishikawa (Espinha de Peixe)</h4>
                                <p className="text-sm font-medium text-slate-500">Análise sistêmica 360º. Ideal para defeitos de processo com causas desconhecidas mapeando as categorias globais (Herca/6M).</p>
                            </button>
                        </div>

                         <div className="flex justify-between pt-10">
                            <button onClick={() => setCurrentStep(1)} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600">Voltar</button>
                            <button 
                                onClick={() => setCurrentStep(3)}
                                disabled={!draftTool}
                                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2"
                            >
                                Iniciar Análise <ChevronRight size={16} />
                            </button>
                         </div>
                    </div>
                 )}

                 {/* ETAPA 3: 5 PORQUES OU ISHIKAWA */}
                 {currentStep === 3 && (
                     <div className="space-y-6 animate-fade">
                        <div className="flex justify-between items-end mb-8">
                             <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                                <Search className={draftTool === '5_WHYS' ? 'text-indigo-600' : 'text-fuchsia-600'} />
                                Análise Investigativa
                             </h3>
                        </div>

                        {draftTool === '5_WHYS' && (
                             <div className="space-y-4">
                                <p className="text-slate-500 text-sm font-medium mb-6">Pergunte o "Por que" de forma sequencial até atingir a causa sistêmica subjacente.</p>
                                {draftWhys.map((w, i) => (
                                    <div key={i} className="flex gap-4 items-start">
                                        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-black text-lg shrink-0 mt-1">
                                            {i + 1}
                                        </div>
                                        <div className="flex-1 w-full relative group">
                                            <span className="absolute -top-2.5 left-4 bg-white px-2 py-0 text-[10px] font-black text-indigo-500 tracking-widest uppercase">Por que aconteceu?</span>
                                            <textarea 
                                                value={w}
                                                onChange={e => {
                                                    const newArr = [...draftWhys];
                                                    newArr[i] = e.target.value;
                                                    setDraftWhys(newArr);
                                                }}
                                                rows={2}
                                                className="w-full p-4 pt-5 bg-transparent border-2 border-slate-200 rounded-xl outline-none font-medium text-slate-700 focus:border-indigo-400 transition-all resize-none"
                                                placeholder={i === 0 ? "Ex: Máquina parou repentinamente." : `Consequência do ${i}º porquê...`}
                                            />
                                        </div>
                                    </div>
                                ))}
                             </div>
                        )}

                        {draftTool === 'ISHIKAWA' && (
                            <div className="space-y-6">
                                <p className="text-slate-500 text-sm font-medium mb-6">Mapeie as possíveis causas deste problema nos 6M's da qualidade.</p>
                                
                                <div className="flex items-center gap-3 bg-fuchsia-50/50 p-4 rounded-xl border border-fuchsia-100 mb-6">
                                    <input 
                                        value={ishikawaInput}
                                        onChange={e => setIshikawaInput(e.target.value)}
                                        onKeyPress={e => e.key === 'Enter' && e.preventDefault()}
                                        placeholder="Descreva a causa encontrada..."
                                        className="flex-1 bg-transparent outline-none font-bold text-slate-700 placeholder:text-slate-400"
                                    />
                                    <select id="ishikawaSelector" className="bg-white border-2 border-slate-200 rounded-lg p-2 md:p-3 outline-none text-xs font-bold text-slate-600 focus:border-fuchsia-400">
                                        {ISHIKAWA_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                    </select>
                                    <button 
                                        onClick={() => {
                                            const sel = document.getElementById('ishikawaSelector') as HTMLSelectElement;
                                            addTargetIshikawa(sel.value);
                                        }}
                                        className="w-12 h-12 shrink-0 bg-fuchsia-600 text-white rounded-lg flex items-center justify-center hover:bg-fuchsia-700 transition"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     {ISHIKAWA_CATEGORIES.map(cat => (
                                         <div key={cat.id} className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
                                             <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest object-cover mb-3">
                                                 <cat.icon size={14} className="text-fuchsia-500"/> {cat.label}
                                             </h4>
                                             {draftIshikawa[cat.id].length > 0 ? (
                                                 <ul className="space-y-2">
                                                     {draftIshikawa[cat.id].map((item, idx) => (
                                                         <li key={idx} className="bg-white p-3 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 flex justify-between items-start group shadow-sm">
                                                             <span className="flex-1 pr-2 leading-tight">{item}</span>
                                                             <button onClick={() => removeTargetIshikawa(cat.id, idx)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"><Trash2 size={14}/></button>
                                                         </li>
                                                     ))}
                                                 </ul>
                                             ) : <p className="text-[10px] font-medium text-slate-400 italic">Nenhum mapeado.</p>}
                                         </div>
                                     ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between pt-10 border-t border-slate-100 mt-8">
                            <button onClick={() => setCurrentStep(2)} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600">Voltar</button>
                            <button 
                                onClick={() => setCurrentStep(4)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2"
                            >
                                Definir Plano de Ação <ChevronRight size={16} />
                            </button>
                         </div>
                     </div>
                 )}

                 {/* ETAPA 4: PLANO DE AÇÃO E SALVAR */}
                 {currentStep === 4 && (
                     <div className="space-y-6 animate-fade">
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                            <Target className="text-blue-600" /> Plano de Ação (5W2H)
                        </h3>
                        <p className="text-slate-500 text-sm font-medium mb-8">Defina quais tarefas neutralizarão de vez essa causa que você acabou de mapear.</p>

                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-end gap-4 shadow-inner">
                            <label className="flex-1 w-full space-y-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">O que fazer? (Ação)</span>
                                <input value={newActionItem.action} onChange={e => setNewActionItem({...newActionItem, action: e.target.value})} className="w-full text-sm p-3 bg-white border border-slate-300 rounded-lg outline-none focus:border-blue-500 font-bold text-slate-700" placeholder="Ex: Ajustar sensor limitador" />
                            </label>
                            <div className="flex w-full md:w-auto gap-4">
                                <label className="flex-1 w-full md:w-32 space-y-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Quem (Nome)</span>
                                    <input value={newActionItem.responsible} onChange={e => setNewActionItem({...newActionItem, responsible: e.target.value})} className="w-full text-sm p-3 bg-white border border-slate-300 rounded-lg outline-none focus:border-blue-500 font-bold text-slate-700" placeholder="João S." />
                                </label>
                                <label className="flex-1 w-full md:w-40 space-y-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Prazo</span>
                                    <input type="date" value={newActionItem.deadline} onChange={e => setNewActionItem({...newActionItem, deadline: e.target.value})} className="w-full text-sm p-3 bg-white border border-slate-300 rounded-lg outline-none focus:border-blue-500 font-bold text-slate-700 text-slate-500" />
                                </label>
                            </div>
                            <button onClick={addActionToDraft} className="w-12 h-12 shrink-0 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-600 flex items-center justify-center transition-colors">
                                <Plus size={24} />
                            </button>
                        </div>

                        {draftActions.length > 0 ? (
                            <div className="space-y-3">
                                {draftActions.map((act, idx) => (
                                    <div key={act.id} className="flex justify-between items-center bg-white border border-slate-200 p-4 rounded-xl shadow-sm group">
                                        <div className="flex gap-3 items-center">
                                            <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-[9px] font-black text-slate-400">{idx + 1}</div>
                                            <div>
                                                <p className="font-bold text-sm text-slate-700">{act.action}</p>
                                                <div className="flex gap-4 mt-1 opacity-60">
                                                    <span className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1 text-slate-600"><Users size={10}/> {act.responsible}</span>
                                                    <span className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1 text-slate-600"><CalendarClock size={10}/> {act.deadline}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={() => removeActionFromDraft(act.id)} className="text-slate-300 hover:text-red-500 transition-colors p-2"><Trash2 size={16} /></button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center p-8 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                                <p className="text-xs font-bold text-slate-400">Nenhuma ação vinculada a esse RCA. Cadastre acima.</p>
                            </div>
                        )}

                        <div className="flex justify-between pt-10 border-t border-slate-100 mt-8">
                            <button onClick={() => setCurrentStep(3)} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600">Voltar</button>
                            <button 
                                onClick={saveInvestigation}
                                disabled={isSaving || draftActions.length === 0}
                                className="bg-slate-900 disabled:opacity-50 hover:bg-black text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl shadow-slate-300"
                            >
                                {isSaving ? <Settings size={16} className="animate-spin" /> : <Save size={16} />} 
                                Salvar e Finalizar RCA
                            </button>
                         </div>
                     </div>
                 )}
             </div>
        </div>
    );

    // ROOT RENDERER
    return (
        <div className="min-h-screen">
            {view === 'LIST' && renderList()}
            {view === 'DETAILS' && renderDetails()}
            {view === 'WIZARD' && renderWizard()}
        </div>
    );
};

export default CauseAnalysisView;
