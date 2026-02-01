
import React, { useState, useRef, useEffect } from 'react';
import { 
    Brain, 
    X, 
    Send, 
    Sparkles, 
    Loader2, 
    MessageSquare, 
    Zap, 
    Terminal,
    ChevronRight,
    Cpu,
    Mic,
    MicOff,
    Volume2,
    VolumeX
} from 'lucide-react';
import { AiService } from '../services/AiService';

interface StrategicConsultantProps {
    matrixData: any[];
    pdis: any[];
    productionData: any[];
    investigations: any[];
}

const StrategicConsultant: React.FC<StrategicConsultantProps> = ({ 
    matrixData, 
    pdis, 
    productionData, 
    investigations 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
    const [input, setInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Estados de Voz
    const [isListening, setIsListening] = useState(false);
    const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
    const recognitionRef = useRef<any>(null);
    
    const scrollRef = useRef<HTMLDivElement>(null);
    const aiService = AiService.getInstance();

    // Inicializar reconhecimento de voz
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.lang = 'pt-BR';
            recognitionRef.current.interimResults = false;

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
                setIsListening(false);
            };

            recognitionRef.current.onerror = () => {
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages, isGenerating]);

    // Função de síntese de voz (TTS)
    const speak = (text: string) => {
        if (!isVoiceEnabled) return;
        window.speechSynthesis.cancel(); // Para falas anteriores
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        utterance.rate = 1.1;
        window.speechSynthesis.speak(utterance);
    };

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            setInput('');
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isGenerating) return;

        const userText = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userText }]);
        setIsGenerating(true);

        const context = {
            equipe_resumo: matrixData.map(o => ({ nome: o.name, cargo: o.role, status: o.status, skills: o.skills })),
            pdis_foco: pdis.map(p => ({ colaborador: p.employee, objetivo: p.careerObjective })),
            oee_recente: productionData.slice(0, 5).map(p => ({ data: p.date, oee: p.oee })),
            desvios_recentes: investigations.slice(0, 5).map(i => ({ colaborador: i.occurrence.employee.name, erro: i.occurrence.description }))
        };

        try {
            const response = await aiService.queryStrategicConsultant(userText, context);
            setMessages(prev => [...prev, { role: 'ai', text: response }]);
            if (isVoiceEnabled) speak(response);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'ai', text: "Desculpe, tive um problema ao processar sua estratégia. Tente novamente." }]);
        } finally {
            setIsGenerating(false);
        }
    };

    const closePanel = () => {
        window.speechSynthesis.cancel();
        setIsOpen(false);
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100]">
            {/* Floating Action Button */}
            {!isOpen && (
                <button 
                    onClick={() => setIsOpen(true)}
                    className="group relative w-16 h-16 bg-slate-900 text-blue-400 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all border border-blue-500/30 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <Brain size={28} className="relative z-10 group-hover:animate-pulse" />
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500 text-[8px] text-white font-black items-center justify-center">AI</span>
                    </span>
                </button>
            )}

            {/* Strategic Panel (Drawer) */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 w-[90vw] md:w-[450px] h-[70vh] bg-slate-950 border border-slate-800 rounded-[2.5rem] shadow-[0_0_50px_rgba(30,58,138,0.5)] flex flex-col overflow-hidden animate-fade">
                    
                    {/* Header Estilo Terminal */}
                    <header className="p-6 bg-slate-900/50 border-b border-slate-800 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600/20 text-blue-400 rounded-xl flex items-center justify-center border border-blue-500/30">
                                <Cpu size={20} className="animate-spin-slow" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-white uppercase tracking-widest">Sala de Guerra</h3>
                                <p className="text-[9px] font-bold text-blue-400 uppercase tracking-tighter flex items-center gap-1">
                                    <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></span>
                                    Analítico Estratégico Ativo
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                                className={`p-2 rounded-lg transition-all ${isVoiceEnabled ? 'bg-blue-500/20 text-blue-400' : 'text-slate-500 hover:text-white'}`}
                                title={isVoiceEnabled ? "Desativar leitura de voz" : "Ativar leitura de voz"}
                            >
                                {isVoiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                            </button>
                            <button onClick={closePanel} className="p-2 text-slate-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                    </header>

                    {/* Área de Chat */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gradient-to-b from-slate-950 to-slate-900">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center px-10">
                                <Terminal size={48} className="text-blue-500/40 mb-4" />
                                <h4 className="text-xs font-black text-slate-100 uppercase tracking-widest mb-2">Pronto para Tomada de Decisão</h4>
                                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">Questione sobre produtividade, substituições, planos de carreira ou tendências de desvios.</p>
                                <div className="mt-8 grid grid-cols-1 gap-3 w-full">
                                    <button onClick={() => setInput("Quem é o melhor substituto para o João no turno B?")} className="px-4 py-3 border border-slate-800 bg-slate-900/50 rounded-xl text-[9px] font-black uppercase text-slate-200 hover:border-blue-500 hover:text-blue-400 transition-all text-left shadow-sm">Substituição de Operador</button>
                                    <button onClick={() => setInput("Baseado nos desvios, onde devo focar o treinamento?")} className="px-4 py-3 border border-slate-800 bg-slate-900/50 rounded-xl text-[9px] font-black uppercase text-slate-200 hover:border-blue-500 hover:text-blue-400 transition-all text-left shadow-sm">Gaps de Capacitação</button>
                                </div>
                            </div>
                        ) : (
                            messages.map((m, idx) => (
                                <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade`}>
                                    <div className={`max-w-[85%] p-5 rounded-[1.8rem] text-sm leading-relaxed shadow-lg ${
                                        m.role === 'user' 
                                            ? 'bg-blue-600 text-white rounded-tr-none font-bold' 
                                            : 'bg-slate-900 text-slate-100 border border-slate-800 rounded-tl-none font-medium'
                                    }`}>
                                        {m.text.split('\n').map((line, i) => <p key={i} className="mb-2 last:mb-0">{line}</p>)}
                                    </div>
                                </div>
                            ))
                        )}
                        {isGenerating && (
                            <div className="flex justify-start animate-pulse">
                                <div className="bg-slate-900 border border-slate-800 p-5 rounded-[1.8rem] rounded-tl-none flex items-center gap-3">
                                    <Loader2 size={16} className="animate-spin text-blue-500" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Processando Inteligência...</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Input com Comando de Voz */}
                    <form onSubmit={handleSendMessage} className="p-6 bg-slate-900/80 border-t border-slate-800">
                        <div className="flex gap-3 bg-slate-950 border border-slate-800 rounded-2xl p-2 focus-within:border-blue-500 transition-all shadow-inner relative">
                            <button 
                                type="button"
                                onClick={toggleListening}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                    isListening 
                                    ? 'bg-rose-600 text-white animate-pulse shadow-[0_0_15px_rgba(225,29,72,0.5)]' 
                                    : 'bg-slate-900 text-slate-500 hover:text-blue-400'
                                }`}
                                title="Comando por Voz"
                            >
                                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                            </button>
                            
                            <input 
                                className="flex-1 bg-transparent border-none outline-none px-2 py-2 text-sm text-white placeholder:text-slate-400 font-medium dark-field"
                                placeholder={isListening ? "Ouvindo gestor..." : "Comando estratégico..."}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                disabled={isGenerating}
                            />
                            
                            <button 
                                type="submit"
                                disabled={isGenerating || !input.trim()}
                                className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-30 transition-all shadow-lg"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                        <div className="mt-3 flex items-center justify-between px-1">
                            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1">
                                <Zap size={8} fill="currentColor" /> Voice Interface v1.0
                            </span>
                            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">
                                Factory Intelligence 1.0
                            </span>
                        </div>
                    </form>
                </div>
            )}
            <style>{`
                .animate-spin-slow { animation: spin 4s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default StrategicConsultant;
