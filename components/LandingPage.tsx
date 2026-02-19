
import React from 'react';
import {
    ChevronRight,
    Zap,
    ShieldCheck,
    Target,
    Brain,
    Layout,
    CheckCircle2,
    Users,
    Activity,
    Coins,
    History,
    Crown,
    MessageCircle,
    Search,
    Clock
} from 'lucide-react';
import { LogoIcon } from '../constants';

interface LandingPageProps {
    onEnter: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
    return (
        <div className="min-h-screen bg-[#0F172A] text-slate-100 overflow-x-hidden">
            {/* Header / Nav */}
            <header className="fixed top-0 w-full z-50 bg-[#0F172A]/80 backdrop-blur-md border-b border-slate-800">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-[1rem] p-1.5 shadow-xl transition-transform hover:rotate-3">
                            <LogoIcon />
                        </div>
                        <span className="font-black uppercase tracking-[0.2em] text-sm">Sistema <span className="text-blue-500">Líder</span></span>
                    </div>
                    <div className="flex items-center gap-6">
                        <button onClick={onEnter} className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Entrar</button>
                        <button onClick={onEnter} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-900/20 hover:bg-blue-700 transition-all">Começar Agora</button>
                    </div>
                </div>
            </header>

            {/* HERO SECTION */}
            <section className="pt-48 pb-24 px-6 relative overflow-hidden">
                <div className="max-w-7xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-full text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8 animate-fade">
                        <Zap size={14} /> Inteligência Industrial 4.0
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8 animate-fade">
                        DOMINE A GESTÃO DO SEU <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">CHÃO DE FÁBRICA</span>
                    </h1>
                    <p className="text-slate-400 text-lg md:text-xl max-w-3xl mx-auto mb-12 font-medium leading-relaxed">
                        A plataforma definitiva para supervisores industriais. Matriz de polivalência,
                        DDS com IA e gestão de pessoas em um único cockpit operacional.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <button
                            onClick={onEnter}
                            className="bg-blue-600 text-white px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl shadow-blue-900/40 hover:scale-105 transition-all flex items-center justify-center gap-3 group"
                        >
                            Ver Demonstração <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        <a href="#planos" className="bg-slate-800 text-white px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-widest border border-slate-700 hover:bg-slate-700 transition-all flex items-center justify-center">Ver Planos e Preços</a>
                    </div>
                </div>

                {/* Decorative Blobs */}
                <div className="absolute top-1/4 left-0 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 blur-[150px] rounded-full"></div>
            </section>

            {/* FEATURES GRID */}
            <section className="py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase mb-4">Arquitetura de Alta Performance</h2>
                        <p className="text-slate-400 font-medium">Ferramentas técnicas desenhadas para o Método Sistema Líder.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                title: "Matriz de Polivalência",
                                desc: "Identifique gaps de treinamento em segundos com nossa visão térmica de habilidades por cargo.",
                                icon: Layout,
                                color: "text-blue-500",
                                bg: "bg-blue-500/10"
                            },
                            {
                                title: "DDS Inteligente (IA)",
                                desc: "Gere roteiros de segurança personalizados usando inteligência artificial baseada nos riscos reais da sua área.",
                                icon: Brain,
                                color: "text-amber-500",
                                bg: "bg-amber-500/10"
                            },
                            {
                                title: "Investigação de Desvios",
                                desc: "Relatórios automatizados de erro humano com metodologias TWTTP e HERCA integradas.",
                                icon: ShieldCheck,
                                color: "text-emerald-500",
                                bg: "bg-emerald-500/10"
                            },
                            {
                                title: "Gestão de Carreira (PDI)",
                                desc: "Acompanhe milestones e jornadas de desenvolvimento individual de forma visual e intuitiva.",
                                icon: Target,
                                color: "text-indigo-500",
                                bg: "bg-indigo-500/10"
                            },
                            {
                                title: "Agenda Operacional",
                                desc: "Checklist tático de rotinas para garantir que nenhum padrão operacional seja esquecido no turno.",
                                icon: Activity,
                                color: "text-rose-500",
                                bg: "bg-rose-500/10"
                            },
                            {
                                title: "Feedbacks & 1:1",
                                desc: "Repositório centralizado de conversas para fortalecer a cultura de liderança e engajamento.",
                                icon: Users,
                                color: "text-cyan-500",
                                bg: "bg-cyan-500/10"
                            }
                        ].map((f, i) => (
                            <div key={i} className="p-8 rounded-[2.5rem] bg-[#1E293B] border border-slate-700/50 hover:border-blue-500/50 transition-all group">
                                <div className={`w-14 h-14 ${f.bg} ${f.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                    <f.icon size={28} />
                                </div>
                                <h3 className="text-xl font-black uppercase tracking-tight mb-3">{f.title}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed font-medium">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* PRICING SECTION */}
            <section id="planos" className="py-32 px-6 bg-slate-900/50">
                <div className="max-w-7xl mx-auto">
                    {/* Título Principal de Planos */}
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-6 leading-tight">
                            O Próximo Nível da Sua <br className="hidden md:block" />
                            <span className="text-blue-500">Liderança Começa Aqui</span>
                        </h2>
                        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-medium">
                            Não perca mais horas "apagando incêndio". Tenha um consultor de elite no seu bolso 24h por dia.
                        </p>
                    </div>

                    {/* Explicação do Modelo (Líder Coins) */}
                    <div className="max-w-4xl mx-auto mb-20 bg-blue-600/5 border border-blue-500/20 p-8 md:p-12 rounded-[3rem] relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Coins size={120} className="text-blue-500" />
                        </div>
                        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                            <div className="w-20 h-20 bg-blue-600 text-white rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-lg shadow-blue-900/40">
                                <Zap size={40} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-widest mb-4">Como funciona nosso modelo?</h3>
                                <p className="text-slate-300 leading-relaxed font-medium">
                                    "No Sistema Líder, você não paga por ferramentas que não usa. Nosso sistema funciona com <span className="text-blue-400 font-bold">Créditos de Inteligência (Líder Coins)</span>. Cada plano te dá uma carga mensal de créditos para usar nas IAs mais poderosas do mercado. É justo, transparente e focado no seu resultado."
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Plan Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto mb-24 items-start">

                        {/* Opção 0: Plano Visitante (Gratuito) */}
                        <div className="p-8 rounded-[2.5rem] border border-slate-800 bg-transparent flex flex-col hover:border-slate-700 transition-all opacity-80 hover:opacity-100">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Plano VISITANTE</h4>
                                    <p className="text-slate-500 text-xs font-bold">Para conhecer o poder da IA.</p>
                                </div>
                            </div>

                            <div className="mb-6">
                                <div className="text-3xl font-black text-slate-400">R$ 0,00<span className="text-xs font-medium text-slate-600">/mês</span></div>
                            </div>

                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex items-center gap-3 text-sm font-bold text-slate-400">
                                    <Coins size={16} className="text-slate-600" />
                                    <span>10 Créditos de IA (Degustação)</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm font-bold text-slate-400">
                                    <Activity size={16} className="text-slate-600" />
                                    <span>Acesso Básico ao Radar Líder</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm font-bold text-slate-600">
                                    <History size={16} className="text-slate-700" />
                                    <span>Histórico de 24h</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm font-bold text-slate-600">
                                    <Target size={16} className="text-slate-700" />
                                    <span>Sem Gestão de Projetos</span>
                                </li>
                            </ul>

                            <button
                                onClick={onEnter}
                                className="w-full py-4 rounded-xl border border-slate-600 text-slate-300 font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 hover:text-white transition-all flex items-center justify-center gap-2"
                            >
                                Criar Conta Grátis
                            </button>
                        </div>

                        {/* Opção 1: Líder Start */}
                        <div className="p-8 rounded-[2.5rem] bg-[#1E293B] border border-slate-700 flex flex-col hover:border-blue-500/50 transition-all relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-2">🚀 Plano LÍDER START</h4>
                                    <p className="text-slate-400 text-xs font-bold">Para quem está assumindo o comando agora.</p>
                                </div>
                            </div>

                            <div className="mb-6">
                                <div className="text-slate-500 text-xs line-through font-black mb-1">R$ 49,90</div>
                                <div className="text-3xl font-black text-white">R$ 29,90<span className="text-xs font-medium text-slate-500">/mês</span></div>
                                <p className="text-[10px] text-slate-500 font-bold mt-2 uppercase tracking-widest">Menos de R$ 1,00 por dia</p>
                            </div>

                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex items-center gap-3 text-sm font-bold text-slate-200">
                                    <CheckCircle2 size={18} className="text-emerald-500" />
                                    <span><span className="text-white">Acesso Total:</span> Todas as IAs liberadas</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm font-bold text-slate-200">
                                    <Coins size={18} className="text-amber-500" />
                                    <span><span className="text-white">50 Créditos:</span> Mensais para uso livre</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm font-bold text-slate-200">
                                    <History size={18} className="text-blue-500" />
                                    <span><span className="text-white">30 Dias:</span> De histórico de registros</span>
                                </li>
                            </ul>

                            <a
                                href="https://buy.stripe.com/test_3cI7sLaPRgL13q16SeabK00"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-4 rounded-xl bg-slate-700 text-white font-black uppercase text-[10px] tracking-widest hover:bg-slate-600 transition-all flex items-center justify-center gap-2"
                            >
                                Quero Começar Agora <ChevronRight size={16} />
                            </a>
                        </div>

                        {/* Opção 2: Líder Pro */}
                        <div className="p-8 rounded-[2.5rem] bg-blue-600 border border-blue-500 shadow-2xl shadow-blue-900/40 flex flex-col relative transform md:scale-105 z-20">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-blue-600 px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl whitespace-nowrap">Best-Seller</div>

                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h4 className="text-[10px] font-black text-blue-100 uppercase tracking-[0.2em] mb-2">👑 Plano LÍDER PRO</h4>
                                    <p className="text-blue-100 text-xs font-bold">Supervisores e Coordenadores de Elite.</p>
                                </div>
                                <Crown size={24} className="text-white opacity-40" />
                            </div>

                            <div className="mb-6">
                                <div className="text-blue-200 text-xs font-black mb-1 uppercase tracking-widest">Investimento</div>
                                <div className="text-4xl font-black text-white">R$ 59,90<span className="text-xs font-medium text-blue-200">/mês</span></div>
                                <p className="text-[10px] text-blue-200 font-bold mt-2 uppercase tracking-widest">4x mais recursos + DDS Livre</p>
                            </div>

                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex items-center gap-3 text-sm font-bold text-white">
                                    <Zap size={18} className="text-amber-300" />
                                    <span><span className="font-black">DDS ILIMITADO:</span> Roteiros sem custo de créditos</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm font-bold text-white">
                                    <Coins size={18} className="text-white" />
                                    <span><span className="font-black">200 Créditos:</span> 4x mais poder de IA</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm font-bold text-white">
                                    <History size={18} className="text-blue-200" />
                                    <span><span className="font-black">Histórico Vitalício:</span> Registro para sempre</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm font-bold text-white">
                                    <CheckCircle2 size={18} className="text-white" />
                                    <span><span className="font-black">Suporte VIP:</span> Atendimento prioritário</span>
                                </li>
                            </ul>

                            <a
                                href="https://buy.stripe.com/test_bJe6oH9LNeCTaSt90mabK01"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-5 rounded-xl bg-white text-blue-600 font-black uppercase text-xs tracking-widest hover:bg-blue-50 transition-all flex items-center justify-center gap-2 shadow-xl"
                            >
                                Quero Ser Líder Pro <ChevronRight size={18} />
                            </a>
                        </div>
                    </div>

                    {/* Tabela de Tangibilização (O que eu faço com meus créditos?) */}
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-10">
                            <h3 className="text-xl font-black uppercase tracking-widest">O que eu faço com meus créditos?</h3>
                            <p className="text-slate-500 text-sm mt-2">Entenda o poder do seu plano mensal em ações reais.</p>
                        </div>

                        <div className="bg-[#1E293B] border border-slate-700 rounded-[2.5rem] overflow-hidden shadow-2xl">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-800/50 border-b border-slate-700">
                                        <tr>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ferramenta</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Custo</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">O que ela faz por você?</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700/50">
                                        {[
                                            {
                                                name: "DDS Inteligente",
                                                cost: "1 Crédito",
                                                desc: "Cria um roteiro engajador em segundos (Grátis no PRO).",
                                                icon: Brain,
                                                color: "text-amber-500"
                                            },
                                            {
                                                name: "Análise de Causa (Ishikawa)",
                                                cost: "5 Créditos",
                                                desc: "Descobre a raiz do problema técnico ou comportamental.",
                                                icon: Search,
                                                color: "text-blue-500"
                                            },
                                            {
                                                name: "Plano de PDI Completo",
                                                cost: "8 Créditos",
                                                desc: "Monta o plano de evolução para o seu funcionário.",
                                                icon: Target,
                                                color: "text-indigo-500"
                                            },
                                            {
                                                name: "Roleplay (Simulador 1:1)",
                                                cost: "10 Créditos",
                                                desc: "Treina você para conversas difíceis antes delas acontecerem.",
                                                icon: MessageCircle,
                                                color: "text-emerald-500"
                                            }
                                        ].map((item, i) => (
                                            <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <item.icon size={18} className={item.color} />
                                                        <span className="text-sm font-black text-slate-200">{item.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <span className="px-3 py-1 bg-slate-800 text-blue-400 rounded-full text-[10px] font-black uppercase border border-slate-700">
                                                        {item.cost}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="text-xs text-slate-400 font-medium leading-relaxed">
                                                        {item.desc}
                                                    </p>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="mt-8 flex items-center justify-center gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <ShieldCheck size={16} className="text-blue-500" />
                            Pagamento Seguro via Stripe • Cancelamento fácil a qualquer momento
                        </div>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="py-20 px-6 border-t border-slate-800">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white rounded-lg p-1">
                            <LogoIcon />
                        </div>
                        <span className="font-black uppercase tracking-widest text-xs text-slate-500">Sistema Líder © 2024</span>
                    </div>
                    <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-slate-500">
                        <a href="#" className="hover:text-white transition-colors">Termos de Uso</a>
                        <a href="#" className="hover:text-white transition-colors">Privacidade</a>
                        <a href="#" className="hover:text-white transition-colors">Contato</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
