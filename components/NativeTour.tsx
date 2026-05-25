
import React, { useState, useEffect } from 'react';
import {
    Home,
    Layout,
    CheckSquare,
    Sparkles,
    Shield,
    AlertTriangle,
    Search,
    Users,
    Grid,
    Target,
    MessageSquare,
    BookOpen,
    UserCheck,
    ChevronRight,
    ChevronLeft,
    X,
    RotateCcw
} from 'lucide-react';

interface Step {
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
}

interface NativeTourProps {
    devMode?: boolean;
    run?: boolean;
    onFinish?: (targetTab: string) => void;
}

const NativeTour: React.FC<NativeTourProps> = ({ devMode = false, run = false, onFinish }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    const steps: Step[] = [
        {
            title: "Cockpit Operacional",
            description: "Visão Geral: Acompanhe indicadores críticos, identifique gaps de habilidade e receba alertas da IA proativa em tempo real para tomada rápida de decisão.",
            icon: <Home size={40} />,
            color: "text-blue-500 bg-blue-500/10"
        },
        {
            title: "Central de Projetos",
            description: "Projetos & Kanban: Gerencie iniciativas complexas, acompanhe checklists de execução e prazos com cálculo automático de progresso.",
            icon: <Layout size={40} />,
            color: "text-indigo-500 bg-indigo-500/10"
        },
        {
            title: "Controle de Rotina",
            description: "Agenda Operacional: Execute checklists táticos com status em tempo real (Pendente, Em Andamento, Concluído) para garantir que nenhum padrão seja esquecido.",
            icon: <CheckSquare size={40} />,
            color: "text-emerald-500 bg-emerald-500/10"
        },
        {
            title: "Assistentes de Segurança",
            description: "DDS Inteligente: Gere roteiros de diálogo de segurança engajadores e pontuais em segundos, utilizando inteligência artificial.",
            icon: <Sparkles size={40} />,
            color: "text-amber-500 bg-amber-500/10"
        },
        {
            title: "Gestão de Conformidade",
            description: "Segurança & Procedimentos: Garanta a operação padrão mantendo os POPs (Procedimentos Operacionais Padrão) sempre acessíveis e atualizados.",
            icon: <Shield size={40} />,
            color: "text-rose-500 bg-rose-500/10"
        },
        {
            title: "Investigação de Desvios",
            description: "Análise de Fator Humano: Entenda por que os erros humanos ocorrem e crie planos de ação efetivos para evitar reincidências.",
            icon: <AlertTriangle size={40} />,
            color: "text-orange-500 bg-orange-500/10"
        },
        {
            title: "Solução Definitiva",
            description: "Causa Raiz: Conduza análises de causa raiz (Ishikawa/5 Porquês) para extinguir problemas crônicos.",
            icon: <Search size={40} />,
            color: "text-blue-500 bg-blue-500/10"
        },
        {
            title: "Gestão de Efetivo",
            description: "Minha Equipe: Tenha o histórico, qualificações e perfil completo de cada colaborador do seu turno sempre à mão.",
            icon: <Users size={40} />,
            color: "text-emerald-500 bg-emerald-500/10"
        },
        {
            title: "Mapa de Polivalência",
            description: "Matriz de Habilidades: Visualize quem está apto para cada máquina, previna gargalos de cobertura e planeje treinamentos.",
            icon: <Grid size={40} />,
            color: "text-indigo-500 bg-indigo-500/10"
        },
        {
            title: "Jornada de Evolução",
            description: "Plano de Carreira (PDI): Estruture e acompanhe metas de desenvolvimento individual para promover o crescimento consistente da equipe.",
            icon: <Target size={40} />,
            color: "text-purple-500 bg-purple-500/10"
        },
        {
            title: "Repositório de Liderança",
            description: "Feedbacks & 1:1: Centralize registros de conversas, fortalecendo a cultura de feedback e o engajamento diário.",
            icon: <MessageSquare size={40} />,
            color: "text-cyan-500 bg-cyan-500/10"
        },
        {
            title: "Auditoria de Treinamentos",
            description: "Capacitação: Controle as validades de certificações e evite que a sua área opere fora das conformidades.",
            icon: <BookOpen size={40} />,
            color: "text-slate-400 bg-slate-800"
        },
        {
            title: "Roleplay com IA",
            description: "Treino de Liderança: Simule conversas difíceis e receba mentoria da IA antes delas acontecerem na prática. Chegue preparado!",
            icon: <UserCheck size={40} />,
            color: "text-blue-400 bg-blue-500/20"
        }
    ];

    useEffect(() => {
        // Se run prop (acionado via menu) vier true -> abre
        if (run) {
            setIsVisible(true);
            setCurrentStep(0);
            return;
        }

        const hasSeen = localStorage.getItem('native_tour_seen');
        if (!hasSeen) {
            setIsVisible(true);
        }
    }, [run]);

    const handleClose = (completed = false) => {
        if (completed) {
            localStorage.setItem('native_tour_seen', 'true');
            if (onFinish) onFinish('operators');
        }
        setIsVisible(false);
    };

    const resetTour = () => {
        localStorage.removeItem('native_tour_seen');
        setCurrentStep(0);
        setIsVisible(true);
    };

    if (!isVisible && !devMode) return null;

    return (
        <>
            {/* DEV MODE RESET BUTTON */}
            {devMode && (
                <button
                    onClick={resetTour}
                    className="fixed bottom-4 right-4 z-[9999] bg-slate-900 text-white p-3 rounded-full shadow-2xl hover:scale-110 transition-all group"
                    title="Reset Tour (Dev Mode)"
                >
                    <RotateCcw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                </button>
            )}

            {/* MODAL OVERLAY */}
            {isVisible && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-[#0F172A]/80 backdrop-blur-md animate-fade">
                    <div className="bg-[#1E293B] border border-slate-700 w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden relative animate-scale-up">

                        {/* BOTÃO FECHAR / PULAR */}
                        <button
                            onClick={() => handleClose(false)}
                            className="absolute top-6 right-6 p-2 text-slate-300 hover:text-red-500 transition-colors"
                        >
                            <X size={24} />
                        </button>

                        <div className="p-10 flex flex-col items-center text-center">
                            {/* ÍCONE DINÂMICO */}
                            <div className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-inner transition-all duration-500 transform ${steps[currentStep].color}`}>
                                {steps[currentStep].icon}
                            </div>

                            {/* TEXTO */}
                            <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-4">
                                {steps[currentStep].title}
                            </h3>
                            <p className="text-slate-400 font-medium leading-relaxed mb-10 text-sm md:text-base px-2">
                                {steps[currentStep].description}
                            </p>

                            {/* PROGRESS DOTS */}
                            <div className="flex gap-2 mb-10">
                                {steps.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentStep ? 'w-8 bg-blue-600' : 'w-2 bg-slate-200'
                                            }`}
                                    />
                                ))}
                            </div>

                            {/* NAVEGAÇÃO */}
                            <div className="flex items-center justify-between w-full gap-4">
                                {currentStep > 0 ? (
                                    <button
                                        onClick={() => setCurrentStep(prev => prev - 1)}
                                        className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl border border-slate-700 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 hover:text-white transition-all flex-1 md:flex-none"
                                    >
                                        <ChevronLeft size={16} /> Voltar
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleClose(false)}
                                        className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl border border-slate-700 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 hover:text-white transition-all flex-1 md:flex-none"
                                    >
                                        Pular Guia
                                    </button>
                                )}

                                <button
                                    onClick={() => {
                                        if (currentStep < steps.length - 1) {
                                            setCurrentStep(prev => prev + 1);
                                        } else {
                                            handleClose(true);
                                        }
                                    }}
                                    className="bg-blue-600 text-white px-8 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-900/40 hover:bg-blue-700 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 flex-1 md:flex-none"
                                >
                                    {currentStep === steps.length - 1 ? 'Finalizar Tour' : 'Próximo'}
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>

                        {/* DECORAÇÃO INFERIOR */}
                        <div className="h-1 w-full bg-slate-800 flex">
                            <div
                                className="h-full bg-blue-600 transition-all duration-500"
                                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes scaleUp {
                    from { opacity: 0; transform: scale(0.9) translateY(20px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                .animate-scale-up {
                    animation: scaleUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                }
            `}</style>
        </>
    );
};

export default NativeTour;
