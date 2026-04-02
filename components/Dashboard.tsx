import React, { useMemo, useState, useEffect } from 'react';
import {
    Users,
    Zap,
    Download,
    ChevronRight,
    MessageSquare,
    Target,
    Radar,
    Sparkles,
    Loader2,
    RefreshCw,
    CheckCircle2,
    Clock,
    AlertTriangle
} from 'lucide-react';
import { Operator, PDI, Meeting, SkillConfig, Procedure, TrainingRecord, ProductionEntry, SkillValue, HumanErrorInvestigation, User, TodoTask, FollowUpItem } from '../types';
import { AiService } from '../services/AiService';
import { addDays, isBefore, parseISO, startOfToday, format, differenceInDays } from 'date-fns';

interface DashboardProps {
    matrixData: Operator[];
    pdis: PDI[];
    meetings: Meeting[];
    skills: SkillConfig[];
    procedures: Procedure[];
    trainingRecords: Record<string, TrainingRecord>;
    productionData: ProductionEntry[];
    investigations: HumanErrorInvestigation[];
    todoTasks?: TodoTask[];
    followUpItems?: FollowUpItem[];
    db?: any;
    onNavigate?: (id: string) => void;
    user?: User | null;
}

const Dashboard: React.FC<DashboardProps> = ({
    matrixData,
    pdis,
    meetings,
    skills,
    procedures,
    trainingRecords,
    productionData,
    investigations,
    todoTasks = [],
    followUpItems = [],
    db,
    onNavigate,
    user
}) => {
    const [radarMessage, setRadarMessage] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const aiService = AiService.getInstance();
    const today = startOfToday();
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    // --- ESCANEAMENTO PROATIVO DE RISCOS ---
    const detectedRisks = useMemo(() => {
        const risks: string[] = [];
        const thirtyDaysFromNow = addDays(today, 30);

        matrixData.forEach(emp => {
            procedures.forEach(p => {
                if (p.roles?.includes(emp.role.toUpperCase())) {
                    const rec = trainingRecords[`${emp.uid}_${emp.name}_${p.code}`];
                    if (!rec || rec.status !== 'Concluído') {
                        risks.push(`Treinamento PENDENTE: ${emp.name} precisa do POP ${p.code} (${p.title})`);
                    } else {
                        const hDate = parseISO(p.homologationDate);
                        const expiryDate = addDays(hDate, p.validityMonths * 30);
                        if (isBefore(expiryDate, today)) {
                            risks.push(`Treinamento VENCIDO: ${emp.name} está com POP ${p.code} expirado`);
                        }
                    }
                }
            });
        });

        matrixData.forEach(emp => {
            Object.entries(emp.skills).forEach(([skillName, val]: [string, any]) => {
                if (val.r === 0 && val.p >= 2) {
                    risks.push(`GAP CRÍTICO: ${emp.name} opera com Nível 0 em ${skillName} (Alvo: N${val.p})`);
                }
            });
        });

        const last30Days = addDays(today, -30);
        const errorCounts: Record<string, number> = {};
        investigations.forEach(inv => {
            const invDate = parseISO(inv.occurrence.date);
            if (isBefore(last30Days, invDate)) {
                errorCounts[inv.occurrence.employee.name] = (errorCounts[inv.occurrence.employee.name] || 0) + 1;
            }
        });
        Object.entries(errorCounts).forEach(([name, count]) => {
            if (count > 1) risks.push(`ALERTA REINCIDÊNCIA: ${name} teve ${count} desvios nos últimos 30 dias`);
        });

        return risks;
    }, [matrixData, procedures, trainingRecords, investigations, today]);

    useEffect(() => {
        const fetchRadar = async () => {
            if (!user) return;
            if (user.radarCache && user.radarCache.date === todayStr && user.radarCache.content) {
                setRadarMessage(user.radarCache.content);
                return;
            }

            if (detectedRisks.length > 0) {
                setIsScanning(true);
                try {
                    const message = await aiService.analyzeProactiveRisks(detectedRisks);
                    setRadarMessage(message);
                    if (db) {
                        await db.collection('users').doc(user.uid).update({
                            radarCache: { date: todayStr, content: message }
                        });
                    }
                } catch (error) {
                    setRadarMessage("🔴 Erro de Conexão.\n🟡 Tente novamente mais tarde.\n🟢 Serviços locais ativos.");
                } finally {
                    setIsScanning(false);
                }
            } else {
                const stableMsg = "🔴 Risco Crítico: Nenhum.\n🟡 Atenção: Manter o ritmo.\n🟢 Estável: Operação em conformidade.";
                setRadarMessage(stableMsg);
                if (db) {
                    await db.collection('users').doc(user.uid).update({
                        radarCache: { date: todayStr, content: stableMsg }
                    });
                }
            }
        };

        fetchRadar();
    }, [user?.uid, user?.radarCache?.date, detectedRisks.length, db, aiService, todayStr]);

    const handleManualRefresh = async () => {
        if (!user || detectedRisks.length === 0 || !db) return;
        if (confirm('Gerar uma nova análise agora consumirá 1 crédito. Continuar?')) {
            setIsScanning(true);
            try {
                const message = await aiService.analyzeProactiveRisks(detectedRisks);
                setRadarMessage(message);
                await db.collection('users').doc(user.uid).update({
                    radarCache: { date: todayStr, content: message }
                });
            } catch (error) {} finally {
                setIsScanning(false);
            }
        }
    };

    // Formatação do AI Radar
    const formattedRadar = useMemo(() => {
        if (!radarMessage) return [];
        return radarMessage.split('\n').filter(line => line.trim().length > 0);
    }, [radarMessage]);

    // METRICS
    const criticalGaps = useMemo(() => {
        let count = 0;
        matrixData.forEach((emp: Operator) => {
            (Object.values(emp.skills) as SkillValue[]).forEach((s: SkillValue) => { 
                if (s.r === 0 && s.p >= 2) count++; 
            });
        });
        return count;
    }, [matrixData]);

    // FOCO DE HOJE (MERGE DA AGENDA OPERACIONAL + FOLLOW-UP)
    const todaysFocus = useMemo(() => {
        let merged: Array<{ id: string, type: 'Agenda' | 'Follow-up', title: string, responsible: string, deadline: string, isOverdue: boolean }> = [];
        
        todoTasks.forEach(task => {
            if (task.completed || task.status === 'done') return;
            if (!task.deadline) return;
            const tDate = parseISO(task.deadline);
            if (isBefore(tDate, addDays(today, 1))) {
                merged.push({
                    id: task.id,
                    type: 'Agenda',
                    title: task.text,
                    responsible: 'Eu',
                    deadline: task.deadline,
                    isOverdue: isBefore(tDate, today)
                });
            }
        });

        followUpItems.forEach(item => {
            if (item.status === 'completed') return;
            if (!item.deadline) return;
            const iDate = parseISO(item.deadline);
            if (isBefore(iDate, addDays(today, 1))) {
                merged.push({
                    id: item.id,
                    type: 'Follow-up',
                    title: item.task,
                    responsible: item.responsible,
                    deadline: item.deadline,
                    isOverdue: isBefore(iDate, today)
                });
            }
        });

        merged.sort((a, b) => {
            if (a.isOverdue && !b.isOverdue) return -1;
            if (!a.isOverdue && b.isOverdue) return 1;
            return a.deadline.localeCompare(b.deadline);
        });

        return merged;
    }, [todoTasks, followUpItems, today]);

    const handleQuickComplete = async (item: { id: string, type: 'Agenda' | 'Follow-up' }) => {
        if (!db) return;
        try {
            if (item.type === 'Agenda') {
                await db.collection('todo_tasks').doc(item.id).update({ completed: true, status: 'done' });
            } else {
                await db.collection('follow_up_items').doc(item.id).update({ status: 'completed' });
            }
        } catch (error) {
            console.error("Erro ao dar baixa rápida:", error);
            alert("Não foi possível concluir a tarefa. Tente novamente.");
        }
    };

    // TERMÔMETRO DA EQUIPE (FAROL 1:1)
    const teamThermometer = useMemo(() => {
        return matrixData.map(emp => {
            // Acha o feedback mais recente
            const empMeetings = meetings.filter(m => m.employee === emp.name).sort((a, b) => b.date.localeCompare(a.date));
            const lastMeetingDate = empMeetings.length > 0 ? empMeetings[0].date : null;
            let status: 'green' | 'yellow' | 'red' = 'red';
            
            if (lastMeetingDate) {
                const daysDiff = differenceInDays(today, parseISO(lastMeetingDate));
                if (daysDiff <= 15) status = 'green';
                else if (daysDiff <= 30) status = 'yellow';
            }
            
            return { name: emp.name, role: emp.role, lastMeeting: lastMeetingDate, status };
        }).sort((a, b) => {
            const priority = { 'red': 1, 'yellow': 2, 'green': 3 };
            return priority[a.status] - priority[b.status];
        });
    }, [matrixData, meetings, today]);

    const exportToPDF = () => {
        const element = document.getElementById('print-dashboard');
        const html2pdf = (window as any).html2pdf;
        if (!html2pdf || !element) return;
        
        const opt = {
            margin: 5,
            filename: 'Relatorio-Cockpit.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
        };
        html2pdf().set(opt).from(element).save();
    };

    return (
        <div id="print-dashboard" className="animate-fade bg-[#0F172A] min-h-screen p-0 selection:bg-blue-500/30">
            <header className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Cockpit Operacional</span>
                    </div>
                    <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">Minha Unidade</h2>
                </div>
                <button
                    onClick={exportToPDF}
                    className="bg-[#1E293B] border border-slate-700 text-slate-300 hover:text-white px-6 py-3 rounded-xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all shadow-md"
                >
                    <Download size={16} /> Baixar Analítico
                </button>
            </header>

            {/* SEÇÃO 1: TOPO CRÍTICO E RADAR */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8 animate-fade">
                {/* RADAR LÍDER (AI) */}
                <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl relative">
                    <div className="p-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-transparent"></div>
                    <div className="p-6 md:p-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                <Radar size={16} className={`text-blue-500 ${isScanning ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
                                Copiloto IA • Radar Líder
                            </h3>
                            {!isScanning && (
                                <button
                                    onClick={handleManualRefresh}
                                    className="p-2 border border-slate-700 hover:bg-slate-800 text-slate-400 rounded-lg transition-all group"
                                    title="Regerar Radar"
                                >
                                    <RefreshCw size={14} className="group-hover:rotate-180 transition-transform" />
                                </button>
                            )}
                        </div>

                        {isScanning ? (
                            <div className="flex items-center gap-3 py-4">
                                <Loader2 size={18} className="animate-spin text-blue-500" />
                                <p className="text-slate-400 font-medium italic">Sintetizando informações da unidade...</p>
                            </div>
                        ) : (
                            <div className="space-y-3 mt-4">
                                {formattedRadar.map((line, idx) => {
                                    let textColor = "text-slate-300";
                                    let bgColor = "bg-slate-800/50";
                                    if (line.includes("🔴")) { textColor = "text-rose-400 font-bold"; bgColor = "bg-rose-500/10 border border-rose-500/20"; }
                                    else if (line.includes("🟡")) { textColor = "text-amber-400"; bgColor = "bg-amber-500/10 border border-amber-500/20"; }
                                    else if (line.includes("🟢")) { textColor = "text-emerald-400"; bgColor = "bg-emerald-500/10 border border-emerald-500/20"; }
                                    
                                    return (
                                        <div key={idx} className={`p-4 rounded-xl ${bgColor}`}>
                                            <p className={`text-sm ${textColor} leading-relaxed`}>{line}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* MÉTRICA CRÍTICA: GAPS */}
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] flex flex-col items-center justify-center text-center shadow-xl group">
                    <div className="w-14 h-14 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center border border-rose-500/20 mb-4 transition-transform group-hover:scale-110">
                        <Zap size={24} />
                    </div>
                    <p className="text-5xl font-black text-white tracking-tighter mb-2">{criticalGaps}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Gaps Críticos Abertos</p>
                    <button 
                         onClick={() => onNavigate?.('matrix')}
                         className="mt-6 px-4 py-2 border border-slate-700 hover:border-slate-500 hover:bg-slate-800 rounded-lg text-slate-300 text-[9px] font-bold uppercase tracking-widest transition-all"
                    >Ver Matriz</button>
                </div>
            </div>

            {/* SEÇÃO 2 E 3: FOCO DE HOJE + TERMÔMETRO DA EQUIPE */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                {/* FOCO DE HOJE */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-[2rem] p-8 shadow-xl flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
                                <Target className="text-blue-500" size={24} /> Foco de Hoje
                            </h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Sua Fila de Execução para Hoje</p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                        {todaysFocus.length > 0 ? (
                            todaysFocus.map(item => (
                                <div key={item.id} className={`flex items-center justify-between p-4 rounded-2xl border ${item.isOverdue ? 'bg-red-500/5 border-red-500/30' : 'bg-slate-800/50 border-slate-700'} hover:border-blue-500 transition-colors`}>
                                    <div className="flex flex-col gap-1 w-full mr-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${item.type === 'Agenda' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-fuchsia-500/20 text-fuchsia-400'}`}>
                                                {item.type}
                                            </span>
                                            {item.isOverdue && (
                                                <span className="text-[8px] font-black uppercase tracking-widest bg-red-500/20 text-red-500 px-2 py-0.5 rounded flex items-center gap-1">
                                                    <AlertTriangle size={10} /> Atrasada
                                                </span>
                                            )}
                                        </div>
                                        <h4 className="text-white font-bold text-sm leading-tight mt-1">{item.title}</h4>
                                        <div className="flex items-center gap-4 mt-2">
                                            <span className="text-slate-400 text-xs flex items-center gap-1 font-medium">
                                                <Users size={12} /> {item.responsible}
                                            </span>
                                            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                                                <Clock size={10} /> {item.deadline}
                                            </span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleQuickComplete(item)}
                                        className="shrink-0 w-12 h-12 bg-slate-800 hover:bg-emerald-500 hover:text-white text-slate-400 rounded-xl flex items-center justify-center transition-all border border-slate-700 shadow-md group"
                                        title="Concluir"
                                    >
                                        <CheckCircle2 size={24} className="group-hover:scale-110 transition-transform" />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="h-48 flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-2xl bg-slate-800/30">
                                <Sparkles size={32} className="text-emerald-500/50 mb-3" />
                                <p className="text-slate-400 text-sm font-bold">Nenhum foco crítico pendente para hoje.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* TERMÔMETRO DA EQUIPE E 1:1 */}
                <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 shadow-xl flex flex-col">
                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800">
                        <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center">
                                 <Users size={24} />
                             </div>
                             <div>
                                 <p className="text-2xl font-black text-white">{matrixData.length}</p>
                                 <p className="text-[9px] font-black tracking-widest uppercase text-slate-500">Membros de Equipe</p>
                             </div>
                        </div>
                    </div>

                    <h3 className="text-sm font-black text-white mb-2 flex items-center gap-2">
                        <MessageSquare size={16} className="text-blue-500" />
                        Farol de 1:1
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 mb-6">
                        <div className="flex items-center gap-1.5 border border-slate-700/50 bg-slate-800/30 px-2 py-1 rounded-lg">
                             <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                             <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Em dia</span>
                        </div>
                        <div className="flex items-center gap-1.5 border border-slate-700/50 bg-slate-800/30 px-2 py-1 rounded-lg">
                             <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                             <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Próximo</span>
                        </div>
                        <div className="flex items-center gap-1.5 border border-slate-700/50 bg-slate-800/30 px-2 py-1 rounded-lg">
                             <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></div>
                             <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Atrasado</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                        {teamThermometer.length > 0 ? teamThermometer.map((emp, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-slate-700 text-white rounded flex items-center justify-center text-[10px] font-black">
                                        {emp.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-200">{emp.name}</p>
                                        <p className="text-[8px] font-black text-slate-500 uppercase">{emp.role}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                     {emp.status === 'green' && <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" title="Dentro do prazo"></div>}
                                     {emp.status === 'yellow' && <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" title="Próximo do vencimento"></div>}
                                     {emp.status === 'red' && <div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)] animate-pulse" title="Feedback Atrasado"></div>}
                                </div>
                            </div>
                        )) : (
                            <p className="text-xs text-slate-500 italic text-center py-6">Nenhum dado de equipe encontrado.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
