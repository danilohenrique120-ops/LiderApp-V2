
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
    ShieldAlert, 
    Search, 
    CheckCircle2, 
    ChevronRight, 
    ChevronDown, 
    ChevronUp,
    Clock, 
    Send, 
    RotateCcw, 
    AlertTriangle, 
    ListChecks, 
    FileText, 
    Layout, 
    MessageCircle,
    Brain,
    PanelRightOpen,
    PanelRightClose,
    Save,
    CheckSquare,
    Zap,
    Home,
    // Add missing Loader2 import
    Loader2
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { CauseAnalysisReport, HumanErrorInvestigation } from '../types';

// --- Interfaces ---

interface ChatMessage {
    id: string;
    role: 'user' | 'ai';
    text: string;
    stage: number;
    timestamp: Date;
}

interface InvestigacaoState {
    step: number;
    description: string;
    impact: string;
    standard: string;
    whys: string[];
    actions: string[];
    isSidebarOpen: boolean;
}

// --- Mock Data & Helpers ---

const STAGES = [
    { id: 1, title: "Ocorrência", icon: ShieldAlert },
    { id: 2, title: "Contexto", icon: Layout },
    { id: 3, title: "5 Porquês", icon: Brain },
    { id: 4, title: "Plano de Ação", icon: ListChecks }
];

const SUGGESTED_ACTIONS = [
    "Revisão do POP (Procedimento Operacional Padrão)",
    "Treinamento de Reciclagem no Posto de Trabalho",
    "Instalação de Dispositivo Poka-Yoke (Antierro)",
    "Melhoria na Iluminação/Ergonomia do Local",
    "Implementação de Check-list de Verificação Dupla"
];

// --- Sub-componentes ---

const ProgressStepper = ({ currentStep }: { currentStep: number }) => (
    <div className="relative flex justify-between items-center w-full max-w-3xl mx-auto mb-12">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0"></div>
        {STAGES.map((s) => {
            const isCompleted = currentStep > s.id;
            const isActive = currentStep === s.id;
            return (
                <div key={s.id} className="relative z-10 flex flex-col items-center gap-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border-4 ${
                        isCompleted ? 'bg-emerald-500 border-emerald-100 text-white' :
                        isActive ? 'bg-blue-600 border-blue-100 text-white scale-110 shadow-lg shadow-blue-200' :
                        'bg-white border-slate-100 text-slate-300'
                    }`}>
                        {isCompleted ? <CheckCircle2 size={20} /> : <s.icon size={18} />}
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                        {s.title}
                    </span>
                </div>
            );
        })}
    </div>
);

const StageSummaryCard = ({ stage, data, onReopen }: { stage: number, data: any, onReopen: () => void }) => (
    <div className="w-full bg-slate-50/50 border border-slate-100 rounded-[2rem] p-6 mb-4 flex items-center justify-between group hover:bg-white hover:border-blue-200 transition-all cursor-pointer" onClick={onReopen}>
        <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                <CheckCircle2 size={16} />
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Etapa {stage} Concluída</p>
                <p className="text-xs font-bold text-slate-600 truncate max-w-md">{data || "Informação registrada."}</p>
            </div>
        </div>
        <button className="text-blue-500 opacity-0 group-hover:opacity-100 text-[10px] font-black uppercase tracking-widest transition-all">Editar</button>
    </div>
);

// --- Componente Principal ---

const RcaWizard: React.FC<{ investigations: HumanErrorInvestigation[] }> = ({ investigations }) => {
    const [state, setState] = useState<InvestigacaoState>({
        step: 1,
        description: '',
        impact: '',
        standard: '',
        whys: [],
        actions: [],
        isSidebarOpen: true
    });
    
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    const scrollRef = useRef<HTMLDivElement>(null);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Auto-save logic (Debounce)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (state.description) {
                localStorage.setItem('lider_rca_temp', JSON.stringify(state));
                setIsSaving(true);
                setTimeout(() => setIsSaving(false), 1000);
            }
        }, 3000);
        return () => clearTimeout(timer);
    }, [state]);

    // Initial Message
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([{
                id: '1',
                role: 'ai',
                stage: 1,
                text: "Olá. Sou seu assistente de investigação técnica. Vamos analisar o desvio ocorrido? Para começar, descreva brevemente **o que aconteceu e quando**.",
                timestamp: new Date()
            }]);
        }
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages, isGenerating]);

    const handleSend = async (customText?: string) => {
        const text = customText || input;
        if (!text.trim() || isGenerating) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            text,
            stage: state.step,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsGenerating(true);

        try {
            // Lógica de Transição de Etapa e Mock AI
            await new Promise(res => setTimeout(res, 1000)); // Simular pensamento
            
            let aiResponse = "";
            let nextStep = state.step;

            if (state.step === 1) {
                setState(prev => ({ ...prev, description: text, step: 2 }));
                aiResponse = "Entendi o ocorrido. No Sistema Líder, buscamos o padrão: **Como essa tarefa deveria ter sido feita** de acordo com o POP?";
                nextStep = 2;
            } else if (state.step === 2) {
                setState(prev => ({ ...prev, standard: text, step: 3 }));
                aiResponse = "Ótimo. Agora vamos à Análise de Causa Raiz. **Por que** o desvio aconteceu?";
                nextStep = 3;
            } else if (state.step === 3) {
                const updatedWhys = [...state.whys, text];
                setState(prev => ({ ...prev, whys: updatedWhys }));
                
                if (updatedWhys.length < 3) {
                    aiResponse = `Entendido. E **por que** [${text}] aconteceu?`;
                } else {
                    setState(prev => ({ ...prev, step: 4 }));
                    aiResponse = "Chegamos a uma causa sistêmica. Com base no que discutimos, qual dessas **Ações Corretivas** faz mais sentido?";
                    nextStep = 4;
                }
            }

            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'ai',
                stage: nextStep,
                text: aiResponse,
                timestamp: new Date()
            }]);
        } catch (error) {
            console.error(error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleToggleAction = (action: string) => {
        setState(prev => ({
            ...prev,
            actions: prev.actions.includes(action) 
                ? prev.actions.filter(a => a !== action)
                : [...prev.actions, action]
        }));
    };

    return (
        <div className="flex h-[calc(100vh-140px)] bg-slate-50/30 rounded-[3rem] overflow-hidden relative border border-slate-100 shadow-2xl animate-fade">
            
            {/* Sidebar de Resumo (Desktop) */}
            <aside className={`bg-white border-l transition-all duration-500 overflow-y-auto custom-scrollbar flex flex-col ${state.isSidebarOpen ? 'w-80' : 'w-0 opacity-0 border-none'}`}>
                <div className="p-8">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                        <Save size={14} className={isSaving ? 'text-emerald-500 animate-pulse' : ''} /> 
                        {isSaving ? 'Salvando...' : 'Resumo em Tempo Real'}
                    </h3>
                    
                    <div className="space-y-6">
                        <section>
                            <h4 className="text-[9px] font-black text-blue-600 uppercase mb-2">Descrição</h4>
                            <p className="text-xs text-slate-600 leading-relaxed font-bold">{state.description || 'Aguardando...'}</p>
                        </section>
                        <section>
                            <h4 className="text-[9px] font-black text-blue-600 uppercase mb-2">Processo Padrão</h4>
                            <p className="text-xs text-slate-600 leading-relaxed">{state.standard || 'Aguardando...'}</p>
                        </section>
                        <section>
                            <h4 className="text-[9px] font-black text-blue-600 uppercase mb-2">Cadeia de Porquês</h4>
                            <div className="space-y-2">
                                {state.whys.map((w, i) => (
                                    <div key={i} className="flex gap-2">
                                        <span className="text-[9px] font-black text-slate-300 mt-1">{i+1}º</span>
                                        <p className="text-xs text-slate-600 italic font-medium">"{w}"</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                        <section>
                            <h4 className="text-[9px] font-black text-blue-600 uppercase mb-2">Plano de Ação</h4>
                            <div className="space-y-1">
                                {state.actions.map((a, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs text-emerald-600 font-bold">
                                        <CheckCircle2 size={12} /> {a}
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            </aside>

            {/* Área Principal de Chat/Wizard */}
            <div className="flex-1 flex flex-col min-w-0 bg-white shadow-inner">
                
                {/* Header Contextual */}
                <header className="px-10 py-8 border-b bg-white/50 backdrop-blur-md sticky top-0 z-30">
                    <nav className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-6">
                        <Home size={12} /> Home <ChevronRight size={10} /> 
                        <Search size={12} /> Análise de Causa <ChevronRight size={10} /> 
                        <span className="text-blue-600">Nova Investigação</span>
                    </nav>
                    <ProgressStepper currentStep={state.step} />
                </header>

                {/* Área de Chat com Accordion Behavior */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                    
                    {/* Renderização condicional por etapas concluídas */}
                    {state.step > 1 && <StageSummaryCard stage={1} data={state.description} onReopen={() => setState(prev => ({...prev, step: 1}))} />}
                    {state.step > 2 && <StageSummaryCard stage={2} data={state.standard} onReopen={() => setState(prev => ({...prev, step: 2}))} />}

                    {/* Chat da Etapa Atual */}
                    <div className="space-y-6">
                        {messages.filter(m => m.stage === state.step || m.role === 'ai').map((m, idx) => (
                            <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade`}>
                                <div className={`max-w-[80%] p-6 rounded-[2.5rem] text-sm leading-relaxed shadow-sm ${
                                    m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none font-bold' : 
                                    'bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-none font-medium'
                                }`}>
                                    {m.text.split('\n').map((line, i) => <p key={i} className="mb-2 last:mb-0">{line}</p>)}
                                    <div className={`mt-2 text-[9px] font-black uppercase opacity-40 flex items-center gap-1 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <Clock size={10} /> {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {isGenerating && (
                        <div className="flex justify-start animate-pulse">
                            <div className="bg-slate-50 border border-slate-100 p-6 rounded-[2rem] rounded-tl-none">
                                <Loader2 size={20} className="animate-spin text-slate-300" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Adaptativo */}
                <footer className="p-8 bg-white border-t border-slate-50">
                    <div className="max-w-4xl mx-auto space-y-4">
                        
                        {/* Contexto dos 5 Porquês (Etapa 3) */}
                        {state.step === 3 && state.whys.length > 0 && (
                            <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 p-4 rounded-2xl animate-fade">
                                <Brain size={16} className="text-blue-600" />
                                <div className="text-[10px] font-bold text-blue-900 uppercase">
                                    Por que <span className="text-blue-600 underline">"{state.whys[state.whys.length - 1]}"</span> aconteceu?
                                </div>
                            </div>
                        )}

                        {/* Seleção de Ações (Etapa 4) */}
                        {state.step === 4 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-fade">
                                {SUGGESTED_ACTIONS.map((action, i) => (
                                    <button 
                                        key={i}
                                        onClick={() => handleToggleAction(action)}
                                        className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${
                                            state.actions.includes(action) 
                                                ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-md' 
                                                : 'bg-white border-slate-100 text-slate-600 hover:border-blue-200'
                                        }`}
                                    >
                                        <div className={`w-5 h-5 rounded-lg flex items-center justify-center border-2 ${
                                            state.actions.includes(action) ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-100'
                                        }`}>
                                            {state.actions.includes(action) && <CheckSquare size={14} />}
                                        </div>
                                        <span className="text-xs font-bold leading-tight">{action}</span>
                                    </button>
                                ))}
                                <button 
                                    onClick={() => handleSend("Concluir investigação com as ações selecionadas.")}
                                    className="md:col-span-2 bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-3 mt-4 hover:bg-slate-800 transition-all"
                                >
                                    <Zap size={18} fill="currentColor" /> Finalizar e Gerar Plano
                                </button>
                            </div>
                        )}

                        {/* Input Padrão (Etapas 1 a 3) */}
                        {state.step < 4 && (
                            <form 
                                onSubmit={(e) => { e.preventDefault(); handleSend(); }} 
                                className="bg-slate-50 border border-slate-200 rounded-[2.5rem] p-2 flex items-center gap-2 focus-within:shadow-xl focus-within:border-blue-300 transition-all"
                            >
                                <button type="button" onClick={() => setState(prev => ({...prev, isSidebarOpen: !prev.isSidebarOpen}))} className="p-4 text-slate-400 hover:text-blue-500">
                                    {state.isSidebarOpen ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />}
                                </button>
                                <input 
                                    className="flex-1 bg-transparent border-none outline-none py-4 px-2 text-sm font-medium placeholder:text-slate-400"
                                    placeholder="Digite sua resposta técnica aqui..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    disabled={isGenerating}
                                />
                                <button 
                                    type="submit"
                                    disabled={isGenerating || !input.trim()}
                                    className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg hover:scale-105 disabled:opacity-30 transition-all"
                                >
                                    <Send size={20} />
                                </button>
                            </form>
                        )}
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default RcaWizard;
