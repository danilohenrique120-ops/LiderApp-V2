
import React, { useState, useEffect, useRef } from 'react';
import { 
    UsersRound, Send, Zap, Brain, Flag, RotateCcw, Sparkles, Loader2, CheckCircle, BarChart3, User, ChevronLeft
} from 'lucide-react';
import { AiService } from '../services/AiService';
import { RoleplayResponse, RoleplayReport } from '../types';

const RoleplayView: React.FC = () => {
    const [config, setConfig] = useState({
        nome_funcionario: 'João',
        cargo: 'Operador de Máquina',
        cenario: 'Chegou atrasado 3x esta semana e parou a linha.',
        personalidade: 'Defensivo e vitimista',
        dificuldade: 'DIFÍCIL'
    });

    const [isStarted, setIsStarted] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string; data?: RoleplayResponse }[]>([]);
    const [input, setInput] = useState('');
    const [report, setReport] = useState<RoleplayReport | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const aiService = AiService.getInstance();

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages, isGenerating]);

    const handleStart = async () => {
        setIsStarted(true);
        setIsGenerating(true);
        try {
            const context = `Simule o funcionário ${config.nome_funcionario}, ${config.cargo}. Cenário: ${config.cenario}. Personalidade: ${config.personalidade}. Nível: ${config.dificuldade}. Responda estritamente em JSON com pensamento_interno, fala_visivel, estado_emocional e sinal_corporal.`;
            const result = await aiService.queryRoleplay("Inicie a conversa.", context);
            setMessages([{ role: 'ai', text: result.fala_visivel, data: result }]);
        } catch (error) {
            alert("Erro ao iniciar simulação.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isGenerating) return;

        const userText = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userText }]);
        setIsGenerating(true);

        try {
            const history = messages.map(m => `${m.role === 'user' ? 'Gestor' : 'Funcionário'}: ${m.text}`).join('\n');
            const context = `Continue o roleplay para ${config.nome_funcionario}. Histórico:\n${history}\nResponda em JSON conforme as regras.`;
            const result = await aiService.queryRoleplay(`O gestor disse: "${userText}"`, context);
            setMessages(prev => [...prev, { role: 'ai', text: result.fala_visivel, data: result }]);
        } catch (error) {
            alert("Erro na resposta da simulação.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleEndRoleplay = async () => {
        setIsGenerating(true);
        try {
            const history = messages.map(m => `${m.role === 'user' ? 'Gestor' : 'Funcionário'}: ${m.text}`).join('\n');
            const reportData = await aiService.generateRoleplayReport(history);
            setReport(reportData);
        } catch (error) {
            alert("Erro ao gerar relatório final.");
        } finally {
            setIsGenerating(false);
        }
    };

    if (report) {
        return (
            <div className="animate-fade max-w-4xl mx-auto py-10">
                <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border">
                    <header className="bg-slate-900 p-10 text-white text-center">
                        <BarChart3 size={48} className="mx-auto mb-4 text-blue-400" />
                        <h2 className="text-3xl font-black uppercase tracking-tighter">Relatório de Mentoria</h2>
                    </header>
                    <div className="p-10 space-y-10">
                        <div className="text-center">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Nota de Comunicação</span>
                            <div className="text-7xl font-black text-blue-600 tracking-tighter">{report.nota_comunicacao}<span className="text-2xl text-slate-300">/10</span></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-emerald-50 p-8 rounded-[2rem] border border-emerald-100">
                                <h3 className="text-emerald-700 font-black uppercase text-xs mb-4 flex items-center gap-2"><CheckCircle size={16} /> Pontos Fortes</h3>
                                <ul className="space-y-2">{report.pontos_fortes.map((p, i) => <li key={i} className="text-sm font-bold text-emerald-900">• {p}</li>)}</ul>
                            </div>
                            <div className="bg-amber-50 p-8 rounded-[2rem] border border-amber-100">
                                <h3 className="text-amber-700 font-black uppercase text-xs mb-4 flex items-center gap-2"><Zap size={16} /> Oportunidades</h3>
                                <ul className="space-y-2">{report.pontos_melhoria.map((p, i) => <li key={i} className="text-sm font-bold text-amber-900">• {p}</li>)}</ul>
                            </div>
                        </div>
                        <div className="bg-blue-600 p-10 rounded-[2.5rem] text-white text-center italic font-black text-xl">"{report.insight_mentor}"</div>
                        <button onClick={() => { setIsStarted(false); setReport(null); setMessages([]); }} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3"><RotateCcw size={18} /> Novo Treino</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade max-w-7xl mx-auto h-[calc(100vh-160px)]">
            {!isStarted ? (
                <div className="h-full flex flex-col justify-center items-center text-center px-6">
                    <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center mb-8"><UsersRound size={40} /></div>
                    <h2 className="text-4xl font-black text-slate-100 tracking-tighter uppercase mb-2">Líder Lab</h2>
                    <p className="text-slate-400 font-medium text-lg max-w-xl mb-12">Simule conversas difíceis com inteligência emocional artificial antes do campo real.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl text-left">
                        <div className="bg-white p-8 rounded-[2.5rem] border shadow-xl space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Funcionário e Cenário</label>
                            <input className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" value={config.nome_funcionario} onChange={e => setConfig({...config, nome_funcionario: e.target.value})} />
                            <textarea className="w-full p-4 bg-slate-50 border rounded-2xl font-medium" rows={2} value={config.cenario} onChange={e => setConfig({...config, cenario: e.target.value})} />
                        </div>
                        <div className="bg-white p-8 rounded-[2.5rem] border shadow-xl space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Personalidade e Dificuldade</label>
                            <select className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" value={config.personalidade} onChange={e => setConfig({...config, personalidade: e.target.value})}>
                                <option>Defensivo e vitimista</option>
                                <option>Passivo-agressivo</option>
                                <option>Explosivo/Reativo</option>
                            </select>
                            <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
                                {['FÁCIL', 'MÉDIA', 'DIFÍCIL'].map(d => (
                                    <button key={d} onClick={() => setConfig({...config, dificuldade: d})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase ${config.dificuldade === d ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>{d}</button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <button onClick={handleStart} className="mt-12 bg-blue-600 text-white px-12 py-5 rounded-[2rem] font-black uppercase flex items-center gap-3">Iniciar Simulação <Sparkles size={18} /></button>
                </div>
            ) : (
                <div className="h-full flex flex-col md:flex-row gap-8 bg-slate-50/50 p-4 md:p-0 rounded-[3rem]">
                    <div className="hidden lg:flex w-72 flex-col gap-6">
                        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Subtexto</h4>
                            <div className="bg-slate-800 p-4 rounded-xl text-[11px] italic min-h-[100px] flex items-center text-center">
                                {messages.filter(m => m.role === 'ai').slice(-1)[0]?.data?.pensamento_interno || "Aguardando..."}
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col bg-white rounded-[3rem] border shadow-2xl overflow-hidden max-w-3xl mx-auto w-full">
                        <header className="p-6 border-b flex justify-between items-center bg-white">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setIsStarted(false)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400"><ChevronLeft size={20} /></button>
                                <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black">{config.nome_funcionario.charAt(0)}</div>
                                <div><h3 className="font-black text-slate-800 text-sm uppercase">{config.nome_funcionario}</h3><span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest animate-pulse">Em Conversa</span></div>
                            </div>
                            <button onClick={handleEndRoleplay} className="px-5 py-2.5 bg-red-50 text-red-600 rounded-xl font-black uppercase text-[9px] border border-red-100 hover:bg-red-100"><Flag size={14} /> Avaliar</button>
                        </header>
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                            {messages.map((m, i) => (
                                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade`}>
                                    <div className={`max-w-[75%] p-5 rounded-[1.8rem] text-[13px] leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'}`}>
                                        {m.text}
                                    </div>
                                </div>
                            ))}
                            {isGenerating && <div className="flex justify-start animate-pulse"><div className="w-8 h-8 rounded-full bg-slate-100 border mr-3"></div><div className="bg-slate-50 border p-5 rounded-[1.8rem]"><Loader2 className="animate-spin text-slate-300" /></div></div>}
                        </div>
                        <form onSubmit={handleSendMessage} className="p-6 border-t flex gap-3 bg-white">
                            <input className="flex-1 px-6 py-4 bg-slate-50 border rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-medium text-sm" placeholder="O que você diria agora?" value={input} onChange={e => setInput(e.target.value)} disabled={isGenerating} />
                            <button type="submit" disabled={isGenerating || !input.trim()} className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl hover:scale-105 transition-all"><Send size={20} /></button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoleplayView;
