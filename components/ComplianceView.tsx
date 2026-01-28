
import React, { useState, useRef, useEffect } from 'react';
import { 
    ShieldCheck, 
    FileText, 
    Upload, 
    Send, 
    Loader2, 
    Trash2, 
    AlertTriangle, 
    MessageSquare, 
    Search,
    X,
    Lock,
    Eye,
    Droplet,
    GraduationCap,
    ShieldAlert,
    Menu,
    Paperclip,
    Copy,
    Check,
    Clock,
    History as HistoryIcon
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { KnowledgeDoc } from '../types';

interface Message {
    id: string;
    role: 'user' | 'ai';
    text: string;
    timestamp: Date;
}

interface ComplianceViewProps {
    user: any;
    db: any;
    documents: KnowledgeDoc[];
}

const SUGGESTED_CHIPS = [
    { id: 1, text: "Qual o passo a passo para o bloqueio de energia (LOTO)?", icon: Lock, color: "text-blue-500", bg: "bg-blue-50" },
    { id: 2, text: "Como faço o descarte seguro de resíduos químicos da limpeza?", icon: Trash2, color: "text-emerald-500", bg: "bg-emerald-50" },
    { id: 3, text: "O que fazer se houver respingo de produto químico nos olhos?", icon: Eye, color: "text-red-500", bg: "bg-red-50" },
    { id: 4, text: "Como agir em caso de vazamento de óleo no setor de prensa?", icon: Droplet, color: "text-orange-500", bg: "bg-orange-50" },
    { id: 5, text: "Quais treinamentos preciso para operar a ponte rolante com segurança?", icon: GraduationCap, color: "text-purple-500", bg: "bg-purple-50" },
    { id: 6, text: "Qual o EPI obrigatório para entrar na área de manipulação ácida?", icon: ShieldAlert, color: "text-amber-500", bg: "bg-amber-50" }
];

const ComplianceView: React.FC<ComplianceViewProps> = ({ user, db, documents }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages, isGenerating]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        try {
            const reader = new FileReader();
            reader.onload = async (event) => {
                await db.collection('knowledge_docs').add({
                    name: file.name,
                    type: file.type,
                    size: (file.size / 1024).toFixed(2) + ' KB',
                    content: (event.target?.result as string).substring(0, 50000),
                    uid: user.uid,
                    uploadedAt: new Date()
                });
                setIsUploading(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            };
            reader.readAsText(file);
        } catch (error) {
            console.error(error);
            setIsUploading(false);
        }
    };

    const handleSendMessage = async (text: string) => {
        if (!text.trim() || isGenerating) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            text,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsGenerating(true);

        try {
            const contextText = documents.map(doc => `DOC: ${doc.name}\n${doc.content}`).join('\n---\n');
            const prompt = `CONTEXTO:\n${contextText}\n\nPERGUNTA: ${text}`;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: {
                    systemInstruction: "Você é o Assistente EHS do Sistema Líder. Responda de forma técnica, curta e baseada nos documentos fornecidos. Use negrito para alertas. Cite a fonte [Arquivo X]."
                }
            });

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'ai',
                text: response.text || 'Não consegui processar a informação.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error(error);
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // Sub-componente para a Sidebar/Drawer
    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-slate-900 text-white p-6">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <HistoryIcon size={14} /> Consultas Recentes
                </h3>
                <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white">
                    <X size={20} />
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
                {documents.length > 0 ? (
                    documents.slice(0, 8).map(doc => (
                        <div key={doc.id} className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50 hover:bg-slate-800 transition-all cursor-pointer group">
                            <div className="flex items-start gap-3">
                                <FileText size={16} className="text-blue-400 mt-1 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-xs font-bold truncate pr-4">{doc.name}</p>
                                    <p className="text-[9px] font-black text-slate-500 uppercase mt-1">Grounding Ativo</p>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 opacity-20">
                        <MessageSquare size={32} className="mx-auto mb-2" />
                        <p className="text-[9px] font-black uppercase tracking-widest">Sem histórico</p>
                    </div>
                )}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-800">
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20"
                >
                    {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                    Treinar IA com POPs
                </button>
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
            </div>
        </div>
    );

    return (
        <div className="flex h-[calc(100vh-140px)] bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden relative">
            
            {/* Overlay Mobile para Sidebar */}
            {isSidebarOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] md:hidden" onClick={() => setIsSidebarOpen(false)}></div>
            )}

            {/* Sidebar Desktop e Drawer Mobile */}
            <aside className={`fixed md:relative z-[70] md:z-10 h-full w-80 transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                <SidebarContent />
            </aside>

            {/* Área Principal do Chat */}
            <main className="flex-1 flex flex-col min-w-0 bg-white">
                
                {/* Header do Chat */}
                <header className="px-8 py-6 border-b flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 bg-slate-50 rounded-xl text-slate-500">
                            <Menu size={20} />
                        </button>
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Assistente EHS</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                IA Conectada aos seus POPs
                            </p>
                        </div>
                    </div>
                </header>

                {/* Área de Mensagens */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-slate-50/20">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center animate-fade">
                            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-sm">
                                <ShieldCheck size={40} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-100 tracking-tight mb-2">Como posso ajudar na segurança hoje?</h3>
                            <p className="text-slate-400 text-sm font-medium mb-12">Selecione uma dúvida comum ou digite sua consulta técnica abaixo.</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                {SUGGESTED_CHIPS.map(chip => (
                                    <button 
                                        key={chip.id}
                                        onClick={() => handleSendMessage(chip.text)}
                                        className="flex items-center gap-4 p-5 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all text-left group"
                                    >
                                        <div className={`p-3 rounded-2xl ${chip.bg} ${chip.color} group-hover:scale-110 transition-transform`}>
                                            <chip.icon size={20} />
                                        </div>
                                        <span className="text-xs font-bold text-slate-600 leading-tight">{chip.text}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        messages.map((m) => (
                            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade group`}>
                                <div className="max-w-[85%] relative">
                                    <div className={`p-6 rounded-[2.5rem] text-sm leading-relaxed shadow-sm relative ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none font-bold' : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none font-medium'}`}>
                                        <div className="prose prose-sm max-w-none">
                                            {m.text.split('\n').map((line, idx) => (
                                                <p key={idx} className="mb-2 last:mb-0">
                                                    {line.split('**').map((part, pIdx) => (
                                                        pIdx % 2 === 1 ? <strong key={pIdx} className={m.role === 'ai' ? "text-red-600 font-black" : ""}>{part}</strong> : part
                                                    ))}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className={`flex items-center gap-3 mt-2 px-4 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1">
                                            <Clock size={10} /> {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {m.role === 'ai' && (
                                            <button 
                                                onClick={() => copyToClipboard(m.text, m.id)}
                                                className="opacity-0 group-hover:opacity-100 text-[9px] font-black uppercase text-blue-500 flex items-center gap-1 transition-all"
                                            >
                                                {copiedId === m.id ? <Check size={12} /> : <Copy size={12} />}
                                                {copiedId === m.id ? 'Copiado' : 'Copiar Resposta'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                    
                    {isGenerating && (
                        <div className="flex justify-start animate-pulse">
                            <div className="bg-white border border-slate-100 p-6 rounded-[2.5rem] rounded-tl-none flex items-center gap-3">
                                <div className="flex gap-1">
                                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">IA Consultando Normas...</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Área de Input Fixo */}
                <footer className="p-8 bg-white border-t border-slate-100">
                    <form 
                        onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }} 
                        className="max-w-4xl mx-auto bg-slate-50 border border-slate-200 rounded-[2.5rem] p-2 flex items-center gap-2 shadow-sm focus-within:shadow-xl focus-within:border-blue-200 transition-all"
                    >
                        <button type="button" className="p-4 text-slate-400 hover:text-blue-500 transition-colors">
                            <Paperclip size={20} />
                        </button>
                        
                        <input 
                            className="flex-1 bg-transparent border-none outline-none py-4 px-2 text-sm font-medium placeholder:text-slate-400"
                            placeholder={documents.length > 0 ? "Consulte um procedimento ou regra de segurança..." : "Aguardando documentos técnicos..."}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={isGenerating || documents.length === 0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage(input);
                                }
                            }}
                        />

                        <div className="flex items-center gap-4 pr-4">
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest hidden sm:block">
                                {input.length}/500
                            </span>
                            <button 
                                type="submit"
                                disabled={isGenerating || !input.trim() || documents.length === 0}
                                className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg hover:scale-105 disabled:opacity-30 disabled:hover:scale-100 transition-all"
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    </form>
                    <p className="text-center mt-4 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">
                        Padrão de Segurança Sistema Líder • Respostas limitadas à base de dados
                    </p>
                </footer>
            </main>
        </div>
    );
};

export default ComplianceView;
