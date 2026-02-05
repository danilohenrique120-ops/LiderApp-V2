
import React, { useMemo, useState, useEffect } from 'react';
import {
    Users,
    Zap,
    Download,
    ChevronRight,
    ShieldAlert,
    Bell,
    MessageSquare,
    GraduationCap,
    ClipboardCheck,
    TrendingUp,
    Target,
    Radar,
    Sparkles,
    Loader2,
    AlertTriangle,
    RefreshCw
} from 'lucide-react';
import {
    ResponsiveContainer,
    Tooltip,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line
} from 'recharts';
import { Operator, PDI, Meeting, SkillConfig, Procedure, TrainingRecord, ProductionEntry, SkillValue, HumanErrorInvestigation, User } from '../types';
import { AiService } from '../services/AiService';
import { db } from '../services/firebase';
import EmptyState from './EmptyState';
import { addDays, isBefore, parseISO, startOfToday, format } from 'date-fns';

interface DashboardProps {
    matrixData: Operator[];
    pdis: PDI[];
    meetings: Meeting[];
    skills: SkillConfig[];
    procedures: Procedure[];
    trainingRecords: Record<string, TrainingRecord>;
    productionData: ProductionEntry[];
    investigations: HumanErrorInvestigation[];
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
    onNavigate,
    user
}) => {
    const [radarMessage, setRadarMessage] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const aiService = AiService.getInstance();

    // --- ESCANEAMENTO PROATIVO DE RISCOS ---
    const detectedRisks = useMemo(() => {
        const risks: string[] = [];
        const today = startOfToday();
        const thirtyDaysFromNow = addDays(today, 30);

        // 1. Riscos de Treinamento
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
                        } else if (isBefore(expiryDate, thirtyDaysFromNow)) {
                            risks.push(`Treinamento EXPIRANDO: ${emp.name} - POP ${p.code} vence em menos de 30 dias`);
                        }
                    }
                }
            });
        });

        // 2. Riscos de Gaps Críticos de Skill (N0 onde precisa de >= N2)
        matrixData.forEach(emp => {
            Object.entries(emp.skills).forEach(([skillName, val]: [string, any]) => {
                if (val.r === 0 && val.p >= 2) {
                    risks.push(`GAP CRÍTICO: ${emp.name} opera com Nível 0 em ${skillName} (Alvo: N${val.p})`);
                }
            });
        });

        // 3. Riscos de Reincidência de Erro (Fator Humano)
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

        // 4. Riscos de Plano de Ação
        investigations.forEach(inv => {
            const deadline = parseISO(inv.actionPlan.deadline);
            if (isBefore(deadline, today)) {
                risks.push(`PLANO ATRASADO: Ação para ${inv.occurrence.employee.name} venceu em ${inv.actionPlan.deadline}`);
            }
        });

        return risks;
    }, [matrixData, procedures, trainingRecords, investigations]);

    // Chama a IA para sintetizar os riscos / Cache Diário
    useEffect(() => {
        const fetchRadar = async () => {
            if (!user) return;

            const todayStr = format(new Date(), 'yyyy-MM-dd');

            // CENÁRIO A: CACHE VÁLIDO (0 Créditos)
            if (user.radarCache && user.radarCache.date === todayStr && user.radarCache.content) {
                setRadarMessage(user.radarCache.content);
                return;
            }

            // CENÁRIO B: NOVO DIA (1 Crédito)
            // Só executa se houver riscos para analisar
            if (detectedRisks.length > 0) {
                setIsScanning(true);
                try {
                    const message = await aiService.analyzeProactiveRisks(detectedRisks);
                    setRadarMessage(message);

                    // Atualizar Cache e Descontar Crédito
                    await db.collection('users').doc(user.uid).update({
                        radarCache: {
                            date: todayStr,
                            content: message
                        },
                        // credits: (user.credits || 0) - 1 // TODO: Uncomment when credits logic is fully live
                    });

                } catch (error) {
                    console.error("Erro ao gerar Radar:", error);
                    setRadarMessage("Não foi possível gerar a análise no momento.");
                } finally {
                    setIsScanning(false);
                }
            } else {
                const stableMsg = "Operação em conformidade. Continue o bom trabalho!";
                setRadarMessage(stableMsg);
                // Salvar cache "Vazio" para não re-executar hoje
                await db.collection('users').doc(user.uid).update({
                    radarCache: {
                        date: todayStr,
                        content: stableMsg
                    }
                });
            }
        };

        fetchRadar();
    }, [user?.uid, user?.radarCache?.date, detectedRisks.length]); // Dependências ajustadas

    const handleManualRefresh = async () => {
        if (!user || detectedRisks.length === 0) return;

        if (confirm('Gerar uma nova análise agora consumirá 1 crédito. Continuar?')) {
            setIsScanning(true);
            try {
                const message = await aiService.analyzeProactiveRisks(detectedRisks);
                setRadarMessage(message);

                const todayStr = format(new Date(), 'yyyy-MM-dd');
                await db.collection('users').doc(user.uid).update({
                    radarCache: {
                        date: todayStr,
                        content: message
                    },
                    // credits: (user.credits || 0) - 1
                });
            } catch (error) {
                alert("Erro ao atualizar Radar.");
            } finally {
                setIsScanning(false);
            }
        }
    };

    const exportToPDF = (elementId: string, filename: string) => {
        const element = document.getElementById(elementId);
        const html2pdf = (window as any).html2pdf;
        if (!html2pdf) return;
        const opt = {
            margin: 5,
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
        };
        html2pdf().set(opt).from(element).save();
    };

    const tooltipStyle = {
        backgroundColor: '#FFFFFF',
        border: 'none',
        borderRadius: '8px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
        color: '#1E293B',
        fontSize: '12px',
        fontWeight: '700',
        padding: '12px'
    };

    const trainingCompliance = useMemo(() => {
        let mandatory = 0, completed = 0;
        matrixData.forEach(emp => {
            procedures.forEach(p => {
                if (p.roles?.includes(emp.role.toUpperCase())) {
                    mandatory++;
                    const rec = trainingRecords[`${emp.uid}_${emp.name}_${p.code}`];
                    if (rec?.status === 'Concluído') completed++;
                }
            });
        });
        return mandatory > 0 ? Math.round((completed / mandatory) * 100) : 0;
    }, [matrixData, procedures, trainingRecords]);

    const totalGaps = useMemo(() => {
        let count = 0;
        matrixData.forEach((emp: Operator) => {
            (Object.values(emp.skills) as SkillValue[]).forEach((s: SkillValue) => { if (s.r < s.p) count++; });
        });
        return count;
    }, [matrixData]);

    const errorAdherence = useMemo(() => {
        if (investigations.length === 0) return 100;
        const todayStr = new Date().toISOString().split('T')[0];
        const onTime = investigations.filter(inv => inv.actionPlan.deadline >= todayStr).length;
        return Math.round((onTime / investigations.length) * 100);
    }, [investigations]);

    const priorityAlerts = useMemo(() => {
        const alerts: any[] = [];
        matrixData.forEach(op => {
            const errorCount = investigations.filter(inv => inv.occurrence.employee.name === op.name).length;
            if (errorCount > 0) {
                alerts.push({
                    operator: op,
                    type: 'CRITICAL',
                    reason: `${errorCount} Desvios`,
                    color: 'text-rose-400',
                    action: () => onNavigate?.('human-error'),
                });
            }
        });
        return alerts.slice(0, 3);
    }, [matrixData, investigations, onNavigate]);

    const skillLevelDist = useMemo(() => {
        const dist = [
            { name: 'N1', value: 0, color: '#94a3b8' },
            { name: 'N2', value: 0, color: '#3b82f6' },
            { name: 'N3', value: 0, color: '#2563eb' },
            { name: 'N4', value: 0, color: '#1d4ed8' }
        ];
        matrixData.forEach((emp: Operator) => {
            (Object.values(emp.skills) as SkillValue[]).forEach((s: SkillValue) => {
                if (s.r >= 1 && s.r <= 4) dist[s.r - 1].value++;
            });
        });
        return dist.filter(d => d.value > 0);
    }, [matrixData]);

    const gapTrend = [{ v: 40 }, { v: 35 }, { v: 50 }, { v: 45 }, { v: 60 }, { v: 55 }, { v: totalGaps }];

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
                    onClick={() => exportToPDF('print-dashboard', 'Relatorio-Lider')}
                    className="bg-[#1E293B] border border-slate-700 text-slate-300 hover:text-white px-6 py-3 rounded-xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all shadow-md"
                >
                    <Download size={16} /> Baixar Analítico
                </button>
            </header>

            {/* --- IA PROATIVA: RADAR LÍDER --- */}
            <div className="mb-10 animate-fade">
                <div className="bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl relative">
                    <div className="p-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-transparent"></div>
                    <div className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
                        <div className="relative shrink-0">
                            <div className="w-16 h-16 bg-blue-600/20 text-blue-400 rounded-2xl flex items-center justify-center border border-blue-500/30">
                                <Radar size={32} className={isScanning ? 'animate-spin' : ''} style={{ animationDuration: '3s' }} />
                            </div>
                            {detectedRisks.length > 0 && (
                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] font-black border-2 border-slate-900">
                                    {detectedRisks.length}
                                </div>
                            )}
                        </div>

                        <div className="flex-1 text-center md:text-left">
                            <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Radar Líder • Proatividade IA</h3>
                                {isScanning && <Loader2 size={12} className="animate-spin text-blue-500" />}
                                {!isScanning && (
                                    <button
                                        onClick={handleManualRefresh}
                                        className="ml-auto md:ml-3 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-blue-500/30 transition-all flex items-center gap-2 group"
                                        title="Gerar nova análise (Custo: 1 Crédito)"
                                    >
                                        <RefreshCw size={12} className="group-hover:rotate-180 transition-transform duration-500" />
                                        <span>Atualizar Análise</span>
                                    </button>
                                )}
                            </div>
                            {isScanning ? (
                                <p className="text-slate-400 font-medium italic animate-pulse">Escaneando vulnerabilidades e priorizando ações...</p>
                            ) : (
                                <div className="flex flex-col md:flex-row md:items-center gap-4">
                                    <p className="text-white font-bold leading-tight flex-1">
                                        <Sparkles size={16} className="inline mr-2 text-blue-400" />
                                        {radarMessage}
                                    </p>
                                    {detectedRisks.length > 0 && (
                                        <div className="flex gap-2">
                                            <button onClick={() => onNavigate?.('matrix')} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[9px] font-black uppercase tracking-widest border border-slate-700 transition-all">Ver Gaps</button>
                                            <button onClick={() => onNavigate?.('human-error')} className="px-4 py-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 rounded-xl text-[9px] font-black uppercase tracking-widest border border-rose-500/30 transition-all">Ver Desvios</button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* BENTO GRID PRINCIPAL */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* CARD CRÍTICO: GAPS DE SKILL */}
                <div className="md:col-span-2 dashboard-card p-8 relative overflow-hidden group">
                    <div className="relative z-10 flex flex-col h-full">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-lg flex items-center justify-center border border-rose-500/20">
                                    <Zap size={24} />
                                </div>
                                <div className="div">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Capacitação</h3>
                                    <p className="text-white font-bold text-sm">Gaps Detectados</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-emerald-400 text-[10px] font-black flex items-center gap-1 uppercase tracking-tighter">
                                    Tendência Mensal
                                </span>
                                <div className="w-24 h-8 mt-1">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={gapTrend}>
                                            <Line type="monotone" dataKey="v" stroke="#f43f5e" strokeWidth={3} dot={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-baseline gap-4 mb-6">
                            <p className="text-8xl font-black text-white tracking-tighter leading-none">{totalGaps}</p>
                            <div className="space-y-1">
                                <span className="text-2xl font-black text-rose-500 uppercase tracking-tighter block leading-none">Gaps</span>
                                <span className="text-xs font-medium text-slate-400 uppercase tracking-widest block">Ações Necessárias</span>
                            </div>
                        </div>

                        <div className="mt-auto flex items-center justify-between">
                            <button
                                onClick={() => onNavigate?.('matrix')}
                                className="bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] uppercase tracking-[0.2em] py-4 px-8 rounded-xl shadow-lg transition-all flex items-center gap-2"
                            >
                                Mitigar Agora
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>
                </div>

                {/* CARD: COMPLIANCE TREINAMENTOS */}
                <div className="dashboard-card p-8 flex flex-col group">
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-8">
                            <div className="w-12 h-12 bg-slate-700 text-slate-300 rounded-lg flex items-center justify-center group-hover:text-blue-400 transition-colors">
                                <GraduationCap size={24} />
                            </div>
                            <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Matriz POP</span>
                        </div>
                        <div className="flex items-baseline gap-2 mb-3">
                            <p className="text-6xl font-black text-white tracking-tighter">{trainingCompliance}%</p>
                        </div>
                        <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden mb-6">
                            <div
                                className={`h-full transition-all duration-1000 ${trainingCompliance < 50 ? 'bg-rose-500' : 'bg-blue-500'}`}
                                style={{ width: `${trainingCompliance}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed">Aderência aos procedimentos homologados.</p>
                    </div>
                    <button
                        onClick={() => onNavigate?.('training')}
                        className="w-full mt-6 py-3 border border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2"
                    >
                        Auditar Matriz
                    </button>
                </div>

                {/* CARD: TIME ATIVO */}
                <div className="dashboard-card p-8 flex flex-col group">
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-8">
                            <div className="w-12 h-12 bg-slate-700 text-slate-300 rounded-lg flex items-center justify-center group-hover:text-emerald-400 transition-colors">
                                <Users size={24} />
                            </div>
                        </div>
                        <p className="text-6xl font-black text-white tracking-tighter mb-2">{matrixData.length}</p>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Colaboradores no Turno</p>
                    </div>
                    <button
                        onClick={() => onNavigate?.('operators')}
                        className="w-full mt-6 py-3 border border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2"
                    >
                        Gestão Pessoal
                    </button>
                </div>

                {/* CARD: FEEDBACKS */}
                <div className="dashboard-card p-8 flex flex-col group">
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-8">
                            <div className="w-12 h-12 bg-slate-700 text-slate-300 rounded-lg flex items-center justify-center group-hover:text-amber-400 transition-colors">
                                <MessageSquare size={24} />
                            </div>
                        </div>
                        <div className="space-y-3 mb-6">
                            {meetings.slice(0, 2).map(m => (
                                <div key={m.id} className="flex items-center gap-3 bg-slate-900/50 p-2 rounded-lg">
                                    <div className="w-7 h-7 bg-slate-600 rounded flex items-center justify-center text-[10px] font-black text-white">{m.employee.charAt(0)}</div>
                                    <span className="text-[10px] font-bold text-slate-400 truncate">{m.employee}</span>
                                </div>
                            ))}
                            {meetings.length === 0 && <p className="text-[10px] text-slate-600 italic">Sem 1:1 agendados.</p>}
                        </div>
                    </div>
                    <button
                        onClick={() => onNavigate?.('oneone')}
                        className="w-full mt-6 py-3 border border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2"
                    >
                        Ver Agenda 1:1
                    </button>
                </div>

                {/* CARD: ADERÊNCIA AÇÃO */}
                <div className="dashboard-card p-8 flex flex-col group">
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-8">
                            <div className="w-12 h-12 bg-slate-700 text-slate-300 rounded-lg flex items-center justify-center group-hover:text-orange-400 transition-colors">
                                <ClipboardCheck size={24} />
                            </div>
                        </div>
                        <p className="text-6xl font-black text-white tracking-tighter mb-2">{errorAdherence}%</p>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Eficiência em Planos</p>
                    </div>
                    <button
                        onClick={() => onNavigate?.('human-error')}
                        className="w-full mt-6 py-3 border border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2"
                    >
                        Status Desvios
                    </button>
                </div>
            </div>

            {/* SEÇÃO INFERIOR: ALERTAS E MATURIDADE */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                <div className="lg:col-span-2 dashboard-card p-10 flex flex-col">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Análise de Campo</h3>
                            <p className="text-xl font-black text-white tracking-tight">Vulnerabilidades Detectadas</p>
                        </div>
                        <Bell size={24} className="text-blue-500" />
                    </div>

                    <div className="flex-1 space-y-4">
                        {priorityAlerts.length > 0 ? (
                            priorityAlerts.map((alert, idx) => (
                                <div key={idx} className="flex items-center justify-between p-6 rounded-xl bg-slate-900/40 border border-slate-700 group hover:border-blue-500 transition-all">
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center text-white font-black text-sm">
                                            {alert.operator.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-100 text-sm">{alert.operator.name}</h4>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[9px] font-black uppercase tracking-widest ${alert.color}`}>{alert.reason}</span>
                                                <span className="text-[10px] text-slate-500 font-bold uppercase">{alert.operator.role}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={alert.action}
                                        className="p-3 text-slate-500 hover:text-white transition-colors"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <EmptyState
                                title="Operação Estável"
                                description="Nenhum desvio crítico registrado no período."
                                primaryActionLabel="Ver Equipe"
                                onPrimaryAction={() => onNavigate?.('operators')}
                                height="h-full"
                            />
                        )}
                    </div>
                </div>

                <div className="dashboard-card p-10 flex flex-col items-center">
                    <div className="text-center mb-10">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mix de Maturidade</h3>
                        <p className="text-xl font-black text-white tracking-tight">Qualificação do Time</p>
                    </div>
                    <div className="w-full aspect-square relative">
                        {skillLevelDist.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={skillLevelDist} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                                        {skillLevelDist.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#1E293B' }} cursor={{ fill: 'transparent' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center opacity-20">
                                <Target size={32} className="text-slate-500 mb-2" />
                                <p className="text-[10px] font-black uppercase text-slate-100">Sem Dados</p>
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-8 w-full">
                        {skillLevelDist.map(d => (
                            <div key={d.name} className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{d.name}: {d.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
