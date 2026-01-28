
import React, { useState, useEffect } from 'react';
import { 
    Rocket, 
    Users, 
    Sparkles, 
    CheckCircle2, 
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
    onFinish?: (targetTab: string) => void;
}

const NativeTour: React.FC<NativeTourProps> = ({ devMode = false, onFinish }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    const steps: Step[] = [
        {
            title: "Bem-vindo ao Líder App! 🚀",
            description: "Seu painel de gestão industrial inteligente está pronto. Vamos configurar sua operação em 30 segundos?",
            icon: <Rocket size={48} />,
            color: "text-blue-600 bg-blue-50"
        },
        {
            title: "1. Cadastre sua Equipe",
            description: "Tudo começa no menu 'Minha Equipe'. Adicione seus colaboradores para habilitar as matrizes de habilidade e polivalência.",
            icon: <Users size={48} />,
            color: "text-indigo-600 bg-indigo-50"
        },
        {
            title: "2. DDS com Inteligência Artificial",
            description: "Com a equipe configurada, use nossa IA no menu 'DDS' para gerar Diálogos Diários de Segurança baseados nos riscos reais da sua área.",
            icon: <Sparkles size={48} />,
            color: "text-amber-600 bg-amber-50"
        },
        {
            title: "Tudo pronto para decolar! ✅",
            description: "A excelência operacional está a um clique. Vamos começar cadastrando seu primeiro colaborador?",
            icon: <CheckCircle2 size={48} />,
            color: "text-emerald-600 bg-emerald-50"
        }
    ];

    useEffect(() => {
        const hasSeen = localStorage.getItem('native_tour_seen');
        if (!hasSeen) {
            setIsVisible(true);
        }
    }, []);

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
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-fade">
                    <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden relative border border-white animate-scale-up">
                        
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
                            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-4">
                                {steps[currentStep].title}
                            </h3>
                            <p className="text-slate-500 font-medium leading-relaxed mb-10">
                                {steps[currentStep].description}
                            </p>

                            {/* PROGRESS DOTS */}
                            <div className="flex gap-2 mb-10">
                                {steps.map((_, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`h-1.5 rounded-full transition-all duration-300 ${
                                            idx === currentStep ? 'w-8 bg-blue-600' : 'w-2 bg-slate-200'
                                        }`}
                                    />
                                ))}
                            </div>

                            {/* NAVEGAÇÃO */}
                            <div className="flex items-center justify-between w-full gap-4">
                                {currentStep > 0 ? (
                                    <button 
                                        onClick={() => setCurrentStep(prev => prev - 1)}
                                        className="flex items-center gap-2 px-6 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-600 transition-colors"
                                    >
                                        <ChevronLeft size={16} /> Voltar
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => handleClose(false)}
                                        className="px-6 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-600 transition-colors"
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
                                    className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 hover:scale-[1.02] transition-all flex items-center gap-2"
                                >
                                    {currentStep === steps.length - 1 ? 'Começar Agora' : 'Próximo'}
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>

                        {/* DECORAÇÃO INFERIOR */}
                        <div className="h-2 w-full bg-slate-50 flex">
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
