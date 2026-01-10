
import React, { useMemo } from 'react';
import { 
    Users, 
    Zap, 
    CheckCircle, 
    Target, 
    Download, 
    TrendingUp, 
    ChevronRight
} from 'lucide-react';
import { 
    ResponsiveContainer, 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    Tooltip, 
    CartesianGrid, 
    Cell, 
    PieChart, 
    Pie 
} from 'recharts';
import { Operator, PDI, Meeting, SkillConfig, Procedure, TrainingRecord, ProductionEntry, SkillValue } from '../types';

interface DashboardProps {
    matrixData: Operator[];
    pdis: PDI[];
    meetings: Meeting[];
    skills: SkillConfig[];
    procedures: Procedure[];
    trainingRecords: Record<string, TrainingRecord>;
    productionData: ProductionEntry[];
}

const Dashboard: React.FC<DashboardProps> = ({ matrixData, pdis, meetings, skills, procedures, trainingRecords, productionData }) => {
    
    const exportToPDF = (elementId: string, filename: string) => {
        const element = document.getElementById(elementId);
        // @ts-ignore
        const html2pdf = window.html2pdf;
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

    const topicScoresData = useMemo(() => {
        const topics = [...new Set(skills.map(s => s.topic))];
        return topics.map(topic => {
            const topicSkills = skills.filter(s => s.topic === topic);
            let sumR = 0;
            let sumP = 0;
            matrixData.forEach(emp => {
                topicSkills.forEach(s => {
                    sumR += (emp.skills[s.name]?.r || 0);
                    sumP += (emp.skills[s.name]?.p || 0);
                });
            });
            const score = sumP > 0 ? Math.round((sumR / sumP) * 100) : 0;
            return { name: topic, score };
        });
    }, [matrixData, skills]);

    const skillLevelDist = useMemo(() => {
        const dist = [
            { name: 'Nível 1', value: 0, color: '#ffedd5' },
            { name: 'Nível 2', value: 0, color: '#bfdbfe' },
            { name: 'Nível 3', value: 0, color: '#60a5fa' },
            { name: 'Nível 4', value: 0, color: '#2563eb' }
        ];
        matrixData.forEach(emp => {
            (Object.values(emp.skills) as SkillValue[]).forEach(s => {
                if (s.r >= 1 && s.r <= 4) dist[s.r - 1].value++;
            });
        });
        return dist.filter(d => d.value > 0);
    }, [matrixData]);

    const pdiCompletion = useMemo(() => {
        let total = 0, completed = 0;
        pdis.forEach(p => p.goals.forEach(g => { total++; if (g.completed) completed++; }));
        return total > 0 ? Math.round((completed / total) * 100) : 0;
    }, [pdis]);

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
        matrixData.forEach(emp => {
            (Object.values(emp.skills) as SkillValue[]).forEach(s => { if (s.r < s.p) count++; });
        });
        return count;
    }, [matrixData]);

    return (
        <div id="print-dashboard" className="animate-fade">
            <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">Painel de Controle Estratégico</h2>
                    <p className="text-slate-500 font-medium">Visão consolidada do time, competências e conformidade.</p>
                </div>
                <button onClick={() => exportToPDF('print-dashboard', 'Dashboard-Lider')} className="bg-slate-200 text-slate-700 hover:bg-slate-300 px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-xs uppercase transition-colors">
                    <Download size={16} /> Baixar PDF
                </button>
            </header>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                            <Users size={20} />
                        </div>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Equipe</span>
                    </div>
                    <p className="text-4xl font-black text-slate-800 tracking-tighter">{matrixData.length}</p>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-tighter">Colaboradores Ativos</p>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                            <Zap size={20} />
                        </div>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Skills</span>
                    </div>
                    <p className="text-4xl font-black text-amber-600 tracking-tighter">{totalGaps}</p>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-tighter">GAPs de Skill Detectados</p>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                            <CheckCircle size={20} />
                        </div>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Treinamento</span>
                    </div>
                    <p className="text-4xl font-black text-emerald-600 tracking-tighter">{trainingCompliance}%</p>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-tighter">Conformidade Legal (POP)</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Aderência por Categoria de Skill (%)</h3>
                        <div className="flex gap-2">
                            <div className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-600 rounded-full"></div><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Real</span></div>
                        </div>
                    </div>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topicScoresData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                <XAxis type="number" domain={[0, 100]} hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#64748b'}} width={100} />
                                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                                <Bar dataKey="score" radius={[0, 8, 8, 0]} barSize={25}>
                                    {topicScoresData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.score > 80 ? '#10b981' : entry.score > 50 ? '#3b82f6' : '#f59e0b'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8 text-center">Distribuição de Níveis</h3>
                    <div className="h-56 flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={skillLevelDist} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                    {skillLevelDist.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                        {skillLevelDist.map((d, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{backgroundColor: d.color}}></div>
                                <span className="text-[9px] font-bold text-slate-500 uppercase truncate">{d.name} ({d.value})</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Progresso de Metas PDI</h3>
                        <TrendingUp size={16} className="text-blue-500" />
                    </div>
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Taxa de Conclusão Global</span>
                                <span className="text-2xl font-black text-blue-400">{pdiCompletion}%</span>
                            </div>
                            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 transition-all duration-1000" style={{width: `${pdiCompletion}%`}}></div>
                            </div>
                        </div>
                        <div className="flex justify-around py-4 border-t border-slate-800">
                            <div className="text-center">
                                <p className="text-xl font-black text-white">{pdis.length}</p>
                                <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Planos Ativos</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xl font-black text-white">{meetings.length}</p>
                                <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Feedbacks 1:1</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Últimos Feedbacks</h3>
                    <div className="space-y-4">
                        {meetings.slice(0, 3).map((m, i) => (
                            <div key={m.id} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:bg-white transition-colors">
                                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-sm">
                                    {m.employee.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-black text-slate-800 truncate">{m.employee}</p>
                                    <p className="text-[10px] text-slate-500 italic truncate">"{m.summary}"</p>
                                </div>
                                <span className="text-[8px] font-black text-slate-300 uppercase mt-1">{m.date}</span>
                            </div>
                        ))}
                        {meetings.length === 0 && <div className="text-center py-10 text-[10px] font-black text-slate-300 uppercase tracking-widest">Nenhum feedback registrado</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
