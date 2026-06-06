import React, { useState, useEffect, useMemo } from 'react';
import { 
    Target, Plus, Search, ArrowLeft, TrendingUp, Award, AlertTriangle, FileText, Check, 
    BookOpen, Briefcase, History, Clock, Smile, HelpCircle, Trash2, Pencil, Sparkles,
    Download, RefreshCw, Loader2, ShieldAlert, CheckSquare, CheckCircle2
} from 'lucide-react';
import { PDI, Goal, Operator, HumanErrorInvestigation, MainGoalGroup } from '../types';
import { AiService } from '../services/AiService';

interface PdiViewProps {
    pdis: PDI[];
    employees: string[];
    user: any;
    db: any;
}

const PdiView: React.FC<PdiViewProps> = ({ pdis, employees, user, db }) => {
    // Selection state
    const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
    const [activeSubTab, setActiveSubTab] = useState<'goals' | 'skills' | 'ai'>('goals');
    const [operatorSearch, setOperatorSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'no-pdi' | 'active' | 'overdue'>('all');

    // On-demand real-time data states for selected operator
    const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
    const [selectedOperatorInvestigations, setSelectedOperatorInvestigations] = useState<HumanErrorInvestigation[]>([]);
    const [loadingDetails, setLoadingDetails] = useState(false);

    // Form inputs for inline creation/editing
    const [creationObjective, setCreationObjective] = useState('');
    const [creationResponsibilities, setCreationResponsibilities] = useState('');
    const [isCreatingPdi, setIsCreatingPdi] = useState(false);

    // Header inline editing state
    const [isEditingHeader, setIsEditingHeader] = useState(false);
    const [editObjective, setEditObjective] = useState('');
    const [editResponsibilities, setEditResponsibilities] = useState('');

    // Inline Main Goal & Subgoal states
    const [newMainGoalTitle, setNewMainGoalTitle] = useState('');
    const [activeMainGoalId, setActiveMainGoalId] = useState<string | null>(null);
    const [newGoalText, setNewGoalText] = useState('');
    const [newGoalDeadline, setNewGoalDeadline] = useState('');
    const [newGoalCategory, setNewGoalCategory] = useState('70% (Prática/Experiência)');

    // AI Career roadmap states
    const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
    const [aiRoadmap, setAiRoadmap] = useState<string | null>(null);

    const aiService = AiService.getInstance();

    // setup local listeners for selected operator details
    useEffect(() => {
        if (!selectedEmployee || !db || !user) {
            setSelectedOperator(null);
            setSelectedOperatorInvestigations([]);
            return;
        }

        setLoadingDetails(true);

        const unsubscribeOp = db.collection('operators')
            .where('uid', '==', user.uid)
            .where('name', '==', selectedEmployee)
            .onSnapshot((snapshot: any) => {
                if (!snapshot.empty) {
                    const doc = snapshot.docs[0];
                    setSelectedOperator({ id: doc.id, ...doc.data() } as Operator);
                } else {
                    setSelectedOperator(null);
                }
                setLoadingDetails(false);
            }, (err: any) => {
                console.error("Error fetching operator details in PDI:", err);
                setLoadingDetails(false);
            });

        const unsubscribeErrors = db.collection('human_error_investigations')
            .where('uid', '==', user.uid)
            .where('occurrence.employee.name', '==', selectedEmployee)
            .onSnapshot((snapshot: any) => {
                const list = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as HumanErrorInvestigation));
                setSelectedOperatorInvestigations(list);
            });

        return () => {
            unsubscribeOp();
            unsubscribeErrors();
        };
    }, [selectedEmployee, db, user]);

    // Reset inner states when selected operator changes
    useEffect(() => {
        setAiRoadmap(null);
        setIsEditingHeader(false);
        setNewMainGoalTitle('');
        setActiveMainGoalId(null);
        setNewGoalText('');
        setNewGoalDeadline('');
        setNewGoalCategory('70% (Prática/Experiência)');
        setCreationObjective('');
        setCreationResponsibilities('');
        
        const currentPdi = pdis.find(p => p.employee === selectedEmployee);
        if (currentPdi) {
            setEditObjective(currentPdi.careerObjective || '');
            setEditResponsibilities(currentPdi.fixedResponsibilities || '');
        } else {
            setEditObjective('');
            setEditResponsibilities('');
        }
    }, [selectedEmployee, pdis]);

    // Exporter PDF
    const exportToPDF = (elementId: string, filename: string) => {
        const element = document.getElementById(elementId);
        const html2pdf = (window as any).html2pdf;
        if (!html2pdf || !element) return;
        const opt = {
            margin: 5,
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, backgroundColor: '#0f172a' },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
    };

    // YYYY-MM-DD comparison for overdue deadlines
    const isOverdueGoal = (deadline: string) => {
        if (!deadline) return false;
        const todayStr = new Date().toISOString().split('T')[0];
        return deadline < todayStr;
    };

    // Calculate stats for all operators
    const operatorPdiStats = useMemo(() => {
        const stats: Record<string, { pdi: PDI | null; progress: number; completedCount: number; totalCount: number; hasOverdue: boolean }> = {};
        
        employees.forEach(emp => {
            const pdi = pdis.find(p => p.employee === emp) || null;
            if (!pdi) {
                stats[emp] = { pdi: null, progress: 0, completedCount: 0, totalCount: 0, hasOverdue: false };
                return;
            }
            
            const allGoals = [...(pdi.goals || [])];
            if (pdi.mainGoals) {
                pdi.mainGoals.forEach(mg => allGoals.push(...(mg.goals || [])));
            }
            
            const completedCount = allGoals.filter(g => g.completed).length;
            const totalCount = allGoals.length;
            const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
            
            const hasOverdue = allGoals.some(g => !g.completed && g.deadline && isOverdueGoal(g.deadline));
            
            stats[emp] = { pdi, progress, completedCount, totalCount, hasOverdue };
        });
        
        return stats;
    }, [employees, pdis]);

    // Filtered list of employees
    const filteredEmployees = useMemo(() => {
        return employees.filter(emp => {
            const matchesSearch = emp.toLowerCase().includes(operatorSearch.toLowerCase());
            if (!matchesSearch) return false;
            
            const stats = operatorPdiStats[emp];
            if (statusFilter === 'no-pdi') {
                return !stats.pdi;
            } else if (statusFilter === 'active') {
                return !!stats.pdi;
            } else if (statusFilter === 'overdue') {
                return stats.pdi && stats.hasOverdue;
            }
            
            return true;
        });
    }, [employees, operatorSearch, statusFilter, operatorPdiStats]);

    // Team General development stats (Default cockpit)
    const activePdiCount = pdis.length;
    
    const teamProgressMetrics = useMemo(() => {
        let totalVal = 0;
        let activeCount = 0;
        let totalOverdue = 0;
        
        let count70 = 0;
        let count20 = 0;
        let count10 = 0;

        pdis.forEach(p => {
            const stats = operatorPdiStats[p.employee];
            if (stats.pdi) {
                totalVal += stats.progress;
                activeCount++;
                
                const allGoals = [...(p.goals || [])];
                if (p.mainGoals) {
                    p.mainGoals.forEach(mg => allGoals.push(...(mg.goals || [])));
                }

                totalOverdue += allGoals.filter(g => !g.completed && g.deadline && isOverdueGoal(g.deadline)).length;

                // 70/20/10 distribution
                allGoals.forEach(g => {
                    if (g.category?.includes('70%')) count70++;
                    else if (g.category?.includes('20%')) count20++;
                    else if (g.category?.includes('10%')) count10++;
                });
            }
        });

        const avgProgress = activeCount > 0 ? Math.round(totalVal / activeCount) : 0;
        const totalCategorized = count70 + count20 + count10;
        
        return {
            avgProgress,
            totalOverdue,
            dist70: totalCategorized > 0 ? Math.round((count70 / totalCategorized) * 100) : 0,
            dist20: totalCategorized > 0 ? Math.round((count20 / totalCategorized) * 100) : 0,
            dist10: totalCategorized > 0 ? Math.round((count10 / totalCategorized) * 100) : 0,
            count70,
            count20,
            count10
        };
    }, [pdis, operatorPdiStats]);

    const teamOverdueGoalsList = useMemo(() => {
        const list: Array<{ pdiId: string; employee: string; title: string; mainGoalId: string; goal: Goal }> = [];
        pdis.forEach(p => {
            const allGoalGroups = p.mainGoals?.length 
                ? p.mainGoals 
                : [{ id: 'legacy', title: p.careerObjective || 'Objetivo Principal', goals: p.goals || [] }];

            allGoalGroups.forEach(group => {
                group.goals?.forEach(g => {
                    if (!g.completed && g.deadline && isOverdueGoal(g.deadline)) {
                        list.push({ pdiId: p.id, employee: p.employee, title: group.title, mainGoalId: group.id, goal: g });
                    }
                });
            });
        });
        return list.sort((a, b) => a.goal.deadline.localeCompare(b.goal.deadline));
    }, [pdis]);

    // Toggle Goal status in Firestore
    const handleToggleGoal = async (pdiId: string, goalId: string, mainGoalId?: string) => {
        const pdi = pdis.find(p => p.id === pdiId);
        if (!pdi) return;

        let dataToUpdate: any = {};

        if (mainGoalId && mainGoalId !== 'legacy' && pdi.mainGoals) {
            const updatedMainGoals = pdi.mainGoals.map(mg => {
                if (mg.id === mainGoalId) {
                    return { ...mg, goals: mg.goals.map(g => g.id === goalId ? { ...g, completed: !g.completed } : g) };
                }
                return mg;
            });
            dataToUpdate = { mainGoals: updatedMainGoals };
        } else {
            const updatedGoals = (pdi.goals || []).map(g => g.id === goalId ? { ...g, completed: !g.completed } : g);
            dataToUpdate = { goals: updatedGoals };
        }

        try {
            await db.collection('pdis').doc(pdiId).update({
                ...dataToUpdate,
                updatedAt: new Date()
            });
        } catch (error) {
            console.error("Error toggling PDI goal:", error);
        }
    };

    // Inline PDI creation with credit check
    const handleCreatePdi = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEmployee || !creationObjective.trim()) return;

        setIsCreatingPdi(true);

        try {
            // Credit check
            const hasCredits = await aiService.consumeCredits(user, db, 8, 'PDI');
            if (!hasCredits) {
                alert("Você não possui Líder Coins suficientes (Custo: 8). Por favor, realize um upgrade do seu plano.");
                setIsCreatingPdi(false);
                return;
            }

            const payload = {
                employee: selectedEmployee,
                careerObjective: creationObjective.trim(),
                fixedResponsibilities: creationResponsibilities.trim(),
                goals: [],
                mainGoals: [
                    {
                        id: Date.now().toString(),
                        title: 'Primeiros Passos / Metas Iniciais',
                        goals: []
                    }
                ],
                generalComments: '',
                status: 'Em Curso',
                uid: user.uid,
                createdAt: new Date()
            };

            await db.collection('pdis').add(payload);
            
            // Clean inputs
            setCreationObjective('');
            setCreationResponsibilities('');
        } catch (error) {
            console.error("Error creating PDI:", error);
            alert("Não foi possível criar o plano de carreira no banco de dados.");
        } finally {
            setIsCreatingPdi(false);
        }
    };

    // Inline Objective & Responsibilities Header updates
    const handleUpdateHeader = async () => {
        const currentPdi = pdis.find(p => p.employee === selectedEmployee);
        if (!currentPdi || !editObjective.trim()) return;

        try {
            await db.collection('pdis').doc(currentPdi.id).update({
                careerObjective: editObjective.trim(),
                fixedResponsibilities: editResponsibilities.trim(),
                updatedAt: new Date()
            });
            setIsEditingHeader(false);
        } catch (error) {
            console.error("Error updating PDI header:", error);
            alert("Erro ao atualizar o objetivo do PDI.");
        }
    };

    // Inline Main Goal creation
    const handleAddMainGoal = async () => {
        const currentPdi = pdis.find(p => p.employee === selectedEmployee);
        if (!currentPdi || !newMainGoalTitle.trim()) return;

        const newMain: MainGoalGroup = {
            id: Date.now().toString(),
            title: newMainGoalTitle.trim(),
            goals: []
        };

        try {
            await db.collection('pdis').doc(currentPdi.id).update({
                mainGoals: [...(currentPdi.mainGoals || []), newMain],
                updatedAt: new Date()
            });
            setNewMainGoalTitle('');
        } catch (error) {
            console.error("Error adding Main Goal:", error);
        }
    };

    // Inline Main Goal removal
    const handleRemoveMainGoal = async (mgId: string) => {
        const currentPdi = pdis.find(p => p.employee === selectedEmployee);
        if (!currentPdi) return;

        if (confirm("Remover esta meta principal e todas as suas submetas?")) {
            try {
                await db.collection('pdis').doc(currentPdi.id).update({
                    mainGoals: (currentPdi.mainGoals || []).filter(mg => mg.id !== mgId),
                    updatedAt: new Date()
                });
            } catch (error) {
                console.error("Error removing Main Goal:", error);
            }
        }
    };

    // Inline Subgoal creation
    const handleAddSubGoal = async (mainGoalId: string) => {
        const currentPdi = pdis.find(p => p.employee === selectedEmployee);
        if (!currentPdi || !newGoalText.trim() || !newGoalDeadline) return;

        const newSubGoal: Goal = {
            id: Math.random().toString(36).substr(2, 9),
            text: newGoalText.trim(),
            deadline: newGoalDeadline,
            category: newGoalCategory,
            completed: false
        };

        let dataToUpdate: any = {};
        if (mainGoalId === 'legacy') {
            dataToUpdate = { goals: [...(currentPdi.goals || []), newSubGoal] };
        } else {
            dataToUpdate = {
                mainGoals: (currentPdi.mainGoals || []).map(mg => {
                    if (mg.id === mainGoalId) {
                        return { ...mg, goals: [...(mg.goals || []), newSubGoal] };
                    }
                    return mg;
                })
            };
        }

        try {
            await db.collection('pdis').doc(currentPdi.id).update({
                ...dataToUpdate,
                updatedAt: new Date()
            });
            setNewGoalText('');
            setNewGoalDeadline('');
            setNewGoalCategory('70% (Prática/Experiência)');
            setActiveMainGoalId(null);
        } catch (error) {
            console.error("Error adding Subgoal:", error);
        }
    };

    // Inline Subgoal removal
    const handleRemoveSubGoal = async (mainGoalId: string, goalId: string) => {
        const currentPdi = pdis.find(p => p.employee === selectedEmployee);
        if (!currentPdi) return;

        try {
            let dataToUpdate: any = {};
            if (mainGoalId === 'legacy') {
                dataToUpdate = { goals: (currentPdi.goals || []).filter(g => g.id !== goalId) };
            } else {
                dataToUpdate = {
                    mainGoals: (currentPdi.mainGoals || []).map(mg => {
                        if (mg.id === mainGoalId) {
                            return { ...mg, goals: mg.goals.filter(g => g.id !== goalId) };
                        }
                        return mg;
                    })
                };
            }

            await db.collection('pdis').doc(currentPdi.id).update({
                ...dataToUpdate,
                updatedAt: new Date()
            });
        } catch (error) {
            console.error("Error removing Subgoal:", error);
        }
    };

    // PDI Deletion
    const handleDeletePdi = async (pdiId: string) => {
        if (confirm("Excluir permanentemente o PDI deste colaborador?")) {
            try {
                await db.collection('pdis').doc(pdiId).delete();
                setSelectedEmployee(null);
            } catch (error) {
                console.error("Error deleting PDI:", error);
            }
        }
    };

    // AI Career roadmap generation
    const handleGenerateAiRoadmap = async () => {
        if (!selectedEmployee) return;

        setIsGeneratingRoadmap(true);
        setAiRoadmap(null);

        const currentPdi = pdis.find(p => p.employee === selectedEmployee);

        try {
            const gaps = selectedOperator && selectedOperator.skills ? Object.entries(selectedOperator.skills)
                .filter(([_, val]) => val.r < val.p)
                .map(([name]) => name) : [];

            const context = {
                employee: selectedEmployee,
                role: selectedOperator?.role || 'Operador',
                skillsWithGaps: gaps,
                careerObjective: currentPdi?.careerObjective || 'Não cadastrado',
                fixedResponsibilities: currentPdi?.fixedResponsibilities || '',
                errors: selectedOperatorInvestigations.length
            };

            const prompt = `
                Como um Especialista em Gestão de Pessoas e Mentor de Carreira Industrial 4.0:
                Gere uma trilha de desenvolvimento estruturada de alta performance baseada na metodologia 70/20/10 para o colaborador ${selectedEmployee}.
                
                DADOS DO COLABORADOR:
                - Cargo: ${context.role}
                - Objetivo de Carreira: "${context.careerObjective}"
                - Responsabilidades Fixas: "${context.fixedResponsibilities}"
                - Gaps Críticos de Skills: ${context.skillsWithGaps.join(', ') || 'Nenhum'}
                - Erros industriais catalogados: ${context.errors} ocorrências.

                A trilha deve ser estruturada contendo:
                1. AÇÕES ON-THE-JOB (70% - Prática e Experiência): Ações práticas diárias, projetos ou responsabilidades novas.
                2. AÇÕES DE EXPOSIÇÃO/MENTORIA (20% - Mentoria e Social): Quem deve mentorá-lo e o que ele deve observar.
                3. AÇÕES DE EDUCAÇÃO (10% - Cursos e Teoria): Sugestões de treinamentos formais, POPs e procedimentos para leitura.
                4. CRONOGRAMA DE EVOLUÇÃO SUGERIDO (Milestones mensais de curto e médio prazo).
            `;

            const roadmap = await aiService.queryStrategicConsultant(prompt, context);
            setAiRoadmap(roadmap);
        } catch (error: any) {
            console.error("Error generating career roadmap:", error);
            alert("Não foi possível gerar a sugestão de trilha de sucesso com a IA no momento.");
        } finally {
            setIsGeneratingRoadmap(false);
        }
    };

    // Find PDI for selected employee
    const currentOperatorPdi = selectedEmployee ? pdis.find(p => p.employee === selectedEmployee) || null : null;

    // Normalizing goal groups for selected PDI
    const currentMainGoals = useMemo(() => {
        if (!currentOperatorPdi) return [];
        return currentOperatorPdi.mainGoals?.length 
            ? currentOperatorPdi.mainGoals 
            : [{ id: 'legacy', title: currentOperatorPdi.careerObjective || 'Objetivo Principal', goals: currentOperatorPdi.goals || [] }];
    }, [currentOperatorPdi]);

    return (
        <div className="animate-fade text-slate-100 min-h-screen pb-12">
            
            {/* MASTER-DETAIL CONTROLLER */}
            <div className="flex flex-col lg:flex-row gap-6">
                
                {/* COLUMN 1: LEFT SIDEBAR (OPERATORS LIST) */}
                <div className={`w-full lg:w-80 shrink-0 bg-slate-900 border border-slate-800 rounded-[2rem] p-4 flex flex-col h-[calc(100vh-140px)] sticky top-24 ${selectedEmployee ? 'hidden lg:flex' : 'flex'}`}>
                    
                    {/* Header */}
                    <div className="mb-4">
                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-3">Plano de Carreira</h3>
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="Buscar operador..." 
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-semibold text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors pl-9"
                                value={operatorSearch}
                                onChange={e => setOperatorSearch(e.target.value)}
                            />
                            <Search size={14} className="absolute left-3 top-3.5 text-slate-500" />
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex gap-1 mb-4 border-b border-slate-800 pb-3">
                        <button 
                            onClick={() => setStatusFilter('all')} 
                            className={`flex-1 text-[9px] font-black uppercase tracking-widest py-2 rounded-lg transition-all ${statusFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Todos
                        </button>
                        <button 
                            onClick={() => setStatusFilter('active')} 
                            className={`flex-1 text-[9px] font-black uppercase tracking-widest py-2 rounded-lg transition-all ${statusFilter === 'active' ? 'bg-blue-950/40 text-blue-400 border border-blue-900/30' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Ativos
                        </button>
                        <button 
                            onClick={() => setStatusFilter('no-pdi')} 
                            className={`flex-1 text-[9px] font-black uppercase tracking-widest py-2 rounded-lg transition-all ${statusFilter === 'no-pdi' ? 'bg-slate-950 border border-slate-800 text-slate-400' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Sem PDI
                        </button>
                    </div>

                    {/* Operator List Scroll */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                        {filteredEmployees.map(emp => {
                            const stats = operatorPdiStats[emp];
                            const isSelected = selectedEmployee === emp;
                            
                            return (
                                <button
                                    key={emp}
                                    onClick={() => setSelectedEmployee(emp)}
                                    className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center gap-3 group relative ${
                                        isSelected 
                                            ? 'bg-blue-600/10 border-blue-500/50 text-white' 
                                            : 'bg-slate-950 border-slate-900 hover:border-slate-800 text-slate-300 hover:text-white'
                                    }`}
                                >
                                    {/* Initials & Status light */}
                                    <div className="relative">
                                        <div className="w-10 h-10 bg-slate-800 text-slate-200 rounded-xl flex items-center justify-center font-black text-xs uppercase group-hover:scale-105 transition-transform">
                                            {emp.charAt(0)}
                                        </div>
                                        {stats.pdi && (
                                            <div 
                                                className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 flex items-center justify-center ${
                                                    stats.hasOverdue ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
                                                }`}
                                                title={stats.hasOverdue ? 'Metas Atrasadas' : 'Plano em Dia'}
                                            />
                                        )}
                                    </div>

                                    {/* Name and Last meeting info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-xs truncate leading-tight">{emp}</p>
                                        <p className="text-[9px] font-black uppercase mt-1 flex items-center gap-1">
                                            {stats.pdi ? (
                                                <span className="text-blue-400">Progresso: {stats.progress}%</span>
                                            ) : (
                                                <span className="text-slate-500">Sem plano ativo</span>
                                            )}
                                        </p>
                                    </div>

                                    {/* Badges */}
                                    {!stats.pdi && (
                                        <span className="bg-slate-850 text-slate-500 text-[8px] font-black px-2 py-0.5 rounded-md border border-slate-800">
                                            Pendente
                                        </span>
                                    )}
                                </button>
                            );
                        })}

                        {filteredEmployees.length === 0 && (
                            <div className="text-center py-12">
                                <Target size={24} className="text-slate-700 mx-auto mb-2" />
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Nenhum plano encontrado</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* COLUMN 2: RIGHT WORKSPACE */}
                <div className="flex-1 min-w-0">
                    
                    {/* STATE A: NO EMPLOYEE SELECTED (TEAM OVERVIEW) */}
                    {!selectedEmployee && (
                        <div className="space-y-6">
                            
                            {/* Header */}
                            <header className="flex justify-between items-center mb-2 px-2">
                                <div>
                                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Painel de Carreira</span>
                                    <h2 className="text-3xl font-black text-slate-100 tracking-tight uppercase">Dashboard de Desenvolvimento</h2>
                                </div>
                                <button 
                                    onClick={() => exportToPDF('general-pdi-cockpit', 'Cockpit-General-PDI')} 
                                    className="bg-slate-800 border border-slate-700 text-slate-300 hover:text-white px-4 py-2.5 rounded-xl flex items-center gap-2 font-black text-[9px] uppercase tracking-widest transition-colors shadow-sm"
                                >
                                    <Download size={14} /> PDF Geral
                                </button>
                            </header>

                            <div id="general-pdi-cockpit" className="space-y-6">
                                {/* Statistics Cards Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] shadow-sm flex items-center gap-4 group hover:border-slate-700 transition-colors">
                                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
                                            <Target size={24} />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">PDIs Ativos no Time</p>
                                            <h3 className="text-2xl font-black text-slate-100 mt-1">{activePdiCount}</h3>
                                        </div>
                                    </div>
                                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] shadow-sm flex items-center gap-4 group hover:border-slate-700 transition-colors">
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                                            <TrendingUp size={24} />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Progresso Médio Global</p>
                                            <h3 className="text-2xl font-black text-slate-100 mt-1">{teamProgressMetrics.avgProgress}%</h3>
                                        </div>
                                    </div>
                                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] shadow-sm flex items-center gap-4 group hover:border-slate-700 transition-colors">
                                        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20">
                                            <AlertTriangle size={24} />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Submetas Atrasadas</p>
                                            <h3 className="text-2xl font-black text-rose-500 mt-1">{teamProgressMetrics.totalOverdue}</h3>
                                        </div>
                                    </div>
                                </div>

                                {/* 70/20/10 distribution & Overdue Queue split */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* 70/20/10 visual breakdown */}
                                    <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 flex flex-col justify-between h-[380px]">
                                        <div>
                                            <h4 className="font-black text-slate-200 text-sm uppercase tracking-wider flex items-center gap-2 mb-1">
                                                <BookOpen size={16} className="text-blue-500" />
                                                Distribuição 70 / 20 / 10
                                            </h4>
                                            <p className="text-[8px] text-slate-500 uppercase font-bold mb-4">Divisão metodológica de metas ativas</p>
                                        </div>

                                        <div className="space-y-4 flex-1 flex flex-col justify-center">
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-[10px] font-bold">
                                                    <span className="text-blue-400">70% Prática (Ações de Trabalho)</span>
                                                    <span className="text-slate-400">{teamProgressMetrics.count70} ({teamProgressMetrics.dist70}%)</span>
                                                </div>
                                                <div className="w-full bg-slate-950 rounded-full h-2">
                                                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${teamProgressMetrics.dist70}%` }}></div>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-[10px] font-bold">
                                                    <span className="text-indigo-400">20% Mentoria (Feedbacks/Shadowing)</span>
                                                    <span className="text-slate-400">{teamProgressMetrics.count20} ({teamProgressMetrics.dist20}%)</span>
                                                </div>
                                                <div className="w-full bg-slate-950 rounded-full h-2">
                                                    <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${teamProgressMetrics.dist20}%` }}></div>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-[10px] font-bold">
                                                    <span className="text-violet-400">10% Educação (Cursos/Teoria)</span>
                                                    <span className="text-slate-400">{teamProgressMetrics.count10} ({teamProgressMetrics.dist10}%)</span>
                                                </div>
                                                <div className="w-full bg-slate-950 rounded-full h-2">
                                                    <div className="bg-violet-500 h-2 rounded-full" style={{ width: `${teamProgressMetrics.dist10}%` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Overdue subgoals queue */}
                                    <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-[2rem] p-6 flex flex-col h-[380px]">
                                        <div className="mb-4">
                                            <h4 className="font-black text-slate-200 text-sm uppercase tracking-wider flex items-center gap-2">
                                                <AlertTriangle size={16} className="text-rose-500 animate-pulse" />
                                                Fila de Cobrança: Metas Atrasadas do Time
                                            </h4>
                                            <p className="text-[9px] font-bold uppercase text-slate-500 mt-1">Submetas de PDI ativas vencidas</p>
                                        </div>
                                        
                                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                                            {teamOverdueGoalsList.map(({ pdiId, employee, title, mainGoalId, goal }) => (
                                                <div key={goal.id} className="flex items-center justify-between p-3.5 bg-slate-955 border border-slate-900 rounded-2xl hover:border-slate-855 transition-colors">
                                                    <div className="flex-1 min-w-0 pr-4">
                                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                                            <span className="text-[9px] font-black bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded border border-blue-955">
                                                                {employee}
                                                            </span>
                                                            <span className="text-[8px] font-black uppercase text-slate-500 bg-slate-900 border px-1.5 py-0.5 rounded border-slate-800">
                                                                {title}
                                                            </span>
                                                            <span className="text-rose-500 text-[8px] font-black uppercase flex items-center gap-1">
                                                                <Clock size={10} /> Atrasado ({goal.deadline})
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-slate-350 font-medium leading-tight">{goal.text}</p>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleToggleGoal(pdiId, goal.id, mainGoalId)}
                                                        className="w-10 h-10 bg-slate-900 border border-slate-800 hover:bg-emerald-500 hover:text-white hover:border-emerald-600 rounded-xl flex items-center justify-center transition-all text-slate-500 shrink-0"
                                                        title="Marcar como Concluído"
                                                    >
                                                        <Check size={18} />
                                                    </button>
                                                </div>
                                            ))}

                                            {teamOverdueGoalsList.length === 0 && (
                                                <div className="h-full flex flex-col items-center justify-center text-center py-20 bg-slate-950/20 rounded-2xl border border-slate-950">
                                                    <CheckCircle2 size={36} className="text-emerald-550/40 mb-3" />
                                                    <h5 className="text-xs font-bold text-slate-450 uppercase">Tudo em dia!</h5>
                                                    <p className="text-slate-600 text-[10px] mt-1">Nenhuma meta de desenvolvimento atrasada para o time.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}

                    {/* STATE B: OPERATOR SELECTED (WORKSPACE ACTIVE) */}
                    {selectedEmployee && (
                        <div className="space-y-6">
                            
                            {/* Navigation Header */}
                            <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-3xl p-4">
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => setSelectedEmployee(null)} 
                                        className="p-2 bg-slate-950 border border-slate-800 hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-white"
                                    >
                                        <ArrowLeft size={16} />
                                    </button>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-lg font-black text-slate-100 leading-none">{selectedEmployee}</h2>
                                            {currentOperatorPdi && (
                                                <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-blue-950/40 text-blue-400 border border-blue-900/30">
                                                    PDI Ativo ({operatorPdiStats[selectedEmployee]?.progress}%)
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">
                                            {selectedOperator?.role || 'Operador'} • {selectedOperator?.departamento || 'Setor'}
                                        </p>
                                    </div>
                                </div>

                                {currentOperatorPdi && (
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => exportToPDF(`pdi-workspace-individual-${selectedEmployee}`, `Plano-Carreira-PDI-${selectedEmployee}`)} 
                                            className="bg-slate-950 border border-slate-800 text-slate-350 hover:text-white px-3.5 py-2 rounded-xl flex items-center gap-1.5 font-bold text-[9px] uppercase tracking-wider transition-colors"
                                        >
                                            <Download size={12} /> Exportar PDI
                                        </button>
                                        <button 
                                            onClick={() => handleDeletePdi(currentOperatorPdi.id)} 
                                            className="bg-slate-950 hover:bg-rose-950/30 border border-slate-800 text-slate-500 hover:text-rose-500 p-2.5 rounded-xl transition-colors"
                                            title="Excluir PDI"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* STATE B1: OPERATOR HAS NO ACTIVE PDI (CREATE FORM INLINE) */}
                            {!currentOperatorPdi && (
                                <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 space-y-6 animate-fade">
                                    <div className="border-b border-slate-800 pb-3">
                                        <h3 className="text-xs font-black uppercase text-blue-400 tracking-wider flex items-center gap-2">
                                            <Target size={16} />
                                            Iniciar Plano de Desenvolvimento Individual (PDI)
                                        </h3>
                                        <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">Defina o foco de carreira e responsabilidades profissionais para {selectedEmployee}</p>
                                    </div>

                                    <form onSubmit={handleCreatePdi} className="space-y-4">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Objetivo de Carreira Principal</label>
                                            <input 
                                                type="text" 
                                                required
                                                placeholder="Ex: Assumir a liderança da Linha 3 de Montagem como Operador Especialista em 6 meses..."
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-xs font-semibold text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500" 
                                                value={creationObjective}
                                                onChange={e => setCreationObjective(e.target.value)}
                                            />
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Responsabilidades Fixas da Função (Opcional)</label>
                                            <textarea 
                                                rows={3}
                                                placeholder="Descreva as atribuições fixas no cargo atual ou expectativas diárias de conduta..."
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs font-semibold text-slate-100 placeholder-slate-650 focus:outline-none focus:border-blue-500" 
                                                value={creationResponsibilities}
                                                onChange={e => setCreationResponsibilities(e.target.value)}
                                            />
                                        </div>

                                        <div className="bg-slate-950 border border-slate-900 rounded-2xl p-4 flex items-center gap-3">
                                            <HelpCircle size={20} className="text-blue-500 shrink-0" />
                                            <p className="text-[9px] text-slate-500 leading-normal uppercase">
                                                Custo de Criação: <strong>8 Líder Coins</strong>. Uma vez criado, você poderá estruturar múltiplas metas e submetas metodológicas de forma totalmente inline no painel.
                                            </p>
                                        </div>

                                        <button 
                                            type="submit" 
                                            disabled={isCreatingPdi || !creationObjective.trim()}
                                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3.5 rounded-xl font-black uppercase text-xs tracking-wider transition-all shadow-lg shadow-blue-950/20"
                                        >
                                            {isCreatingPdi ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Inicializar Plano de Carreira'}
                                        </button>
                                    </form>
                                </div>
                            )}

                            {/* STATE B2: OPERATOR HAS ACTIVE PDI (SHOW WORKSPACE) */}
                            {currentOperatorPdi && (
                                <>
                                    {/* Inner Sub Tabs Navigation */}
                                    <div className="flex gap-1 border-b border-slate-800">
                                        <button
                                            onClick={() => setActiveSubTab('goals')}
                                            className={`px-4 py-3 text-[10px] font-black uppercase tracking-wider border-b-2 transition-colors ${activeSubTab === 'goals' ? 'border-blue-500 text-blue-400 font-bold' : 'border-transparent text-slate-500 hover:text-slate-350'}`}
                                        >
                                            Metas & Evolução (Checklist)
                                        </button>
                                        <button
                                            onClick={() => setActiveSubTab('skills')}
                                            className={`px-4 py-3 text-[10px] font-black uppercase tracking-wider border-b-2 transition-colors ${activeSubTab === 'skills' ? 'border-blue-500 text-blue-400 font-bold' : 'border-transparent text-slate-500 hover:text-slate-355'}`}
                                        >
                                            Habilidades & Gaps
                                        </button>
                                        <button
                                            onClick={() => setActiveSubTab('ai')}
                                            className={`px-4 py-3 text-[10px] font-black uppercase tracking-wider border-b-2 transition-colors ${activeSubTab === 'ai' ? 'border-blue-500 text-blue-400 font-bold' : 'border-transparent text-slate-500 hover:text-slate-360'}`}
                                        >
                                            Trilha de Sucesso (IA)
                                        </button>
                                    </div>

                                    {/* WORKSPACE DETAILED REPORT ELEMENT */}
                                    <div id={`pdi-workspace-individual-${selectedEmployee}`} className="space-y-6">

                                        {/* TAB 1: GOALS & CHECKLIST */}
                                        {activeSubTab === 'goals' && (
                                            <div className="space-y-6">
                                                
                                                {/* Header objective & responsibilities (Editable inline) */}
                                                <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 space-y-4">
                                                    <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
                                                        <span className="text-[9px] font-black uppercase text-blue-400 tracking-wider">Alinhamento de Carreira</span>
                                                        <button 
                                                            onClick={() => {
                                                                if (isEditingHeader) handleUpdateHeader();
                                                                else {
                                                                    setEditObjective(currentOperatorPdi.careerObjective || '');
                                                                    setEditResponsibilities(currentOperatorPdi.fixedResponsibilities || '');
                                                                    setIsEditingHeader(true);
                                                                }
                                                            }}
                                                            className="text-[9px] font-black uppercase text-slate-400 hover:text-white flex items-center gap-1"
                                                        >
                                                            {isEditingHeader ? <><Check size={12} /> Salvar</> : <><Pencil size={12} /> Editar Objetivo</>}
                                                        </button>
                                                    </div>

                                                    {isEditingHeader ? (
                                                        <div className="space-y-4 animate-fade">
                                                            <div className="flex flex-col gap-1">
                                                                <label className="text-[9px] font-black uppercase text-slate-500">Objetivo de Carreira</label>
                                                                <input 
                                                                    type="text" 
                                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                                                                    value={editObjective}
                                                                    onChange={e => setEditObjective(e.target.value)}
                                                                />
                                                            </div>
                                                            <div className="flex flex-col gap-1">
                                                                <label className="text-[9px] font-black uppercase text-slate-500">Responsabilidades Fixas</label>
                                                                <textarea 
                                                                    rows={2}
                                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none"
                                                                    value={editResponsibilities}
                                                                    onChange={e => setEditResponsibilities(e.target.value)}
                                                                />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 leading-normal">
                                                            <div className="space-y-1">
                                                                <h4 className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Objetivo de Carreira</h4>
                                                                <p className="text-xs font-bold text-slate-200">"{currentOperatorPdi.careerObjective || 'Não cadastrado'}"</p>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <h4 className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Responsabilidades do Cargo</h4>
                                                                <p className="text-xs font-semibold text-slate-450 italic">
                                                                    {currentOperatorPdi.fixedResponsibilities || 'Nenhuma responsabilidade fixa descrita.'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Main goals listing and inline creators */}
                                                <div className="space-y-6">
                                                    <div className="flex justify-between items-center">
                                                        <h4 className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Grade de Metas</h4>
                                                        <div className="flex gap-2 w-full max-w-sm">
                                                            <input 
                                                                type="text" 
                                                                placeholder="Adicionar Meta Principal (Painel)..." 
                                                                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-[10px] text-white focus:outline-none"
                                                                value={newMainGoalTitle}
                                                                onChange={e => setNewMainGoalTitle(e.target.value)}
                                                                onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); handleAddMainGoal(); } }}
                                                            />
                                                            <button 
                                                                type="button" 
                                                                onClick={handleAddMainGoal}
                                                                className="px-3 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[8px] tracking-widest rounded-xl"
                                                            >
                                                                Adicionar
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Groups of goals */}
                                                    <div className="space-y-4">
                                                        {currentMainGoals.map((mg, index) => (
                                                            <div key={mg.id} className="bg-slate-900 border border-slate-800 rounded-[2rem] p-5 space-y-4 animate-fade">
                                                                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                                                                    <h5 className="text-xs font-black uppercase text-slate-300 flex items-center gap-2">
                                                                        <Target size={14} className="text-blue-500" />
                                                                        Meta {index + 1}: {mg.title}
                                                                    </h5>
                                                                    {mg.id !== 'legacy' && (
                                                                        <button 
                                                                            onClick={() => handleRemoveMainGoal(mg.id)}
                                                                            className="text-slate-650 hover:text-rose-500 transition-colors"
                                                                        >
                                                                            <Trash2 size={14} />
                                                                        </button>
                                                                    )}
                                                                </div>

                                                                {/* Subgoals Checklist */}
                                                                <div className="space-y-2">
                                                                    {mg.goals && mg.goals.map(g => {
                                                                        const isOverdue = !g.completed && g.deadline && isOverdueGoal(g.deadline);
                                                                        return (
                                                                            <div key={g.id} className={`flex items-center justify-between p-3.5 bg-slate-950 border rounded-xl group transition-colors ${g.completed ? 'border-emerald-950/20 bg-emerald-950/5' : 'border-slate-950 hover:border-slate-800 bg-slate-950'}`}>
                                                                                <div className="flex-1 pr-4 min-w-0">
                                                                                    <p className={`text-xs font-semibold ${g.completed ? 'text-slate-550 line-through opacity-70' : 'text-slate-200'}`}>{g.text}</p>
                                                                                    <div className="flex items-center gap-2 mt-2">
                                                                                        {isOverdue && <span className="text-[7px] font-black uppercase bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2 py-0.5 rounded">Prazo Atrasado</span>}
                                                                                        {g.completed && <span className="text-[7px] font-black uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded">Concluído</span>}
                                                                                        {!g.completed && !isOverdue && <span className="text-[7px] font-black uppercase bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2 py-0.5 rounded">Ativo</span>}
                                                                                        
                                                                                        <span className="text-slate-500 text-[8px] font-bold uppercase flex items-center gap-1">
                                                                                            <Clock size={8} /> {g.deadline}
                                                                                        </span>
                                                                                        {g.category && (
                                                                                            <span className="text-[8px] font-black text-slate-550 border border-slate-800 px-1 py-0.5 rounded">
                                                                                                {g.category.split(' ')[0]}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>

                                                                                <div className="flex items-center gap-2">
                                                                                    <button 
                                                                                        type="button"
                                                                                        onClick={() => handleRemoveSubGoal(mg.id, g.id)}
                                                                                        className="text-slate-700 hover:text-rose-500 p-1 opacity-0 group-hover:opacity-100 transition-all"
                                                                                    >
                                                                                        <Trash2 size={14} />
                                                                                    </button>
                                                                                    <button 
                                                                                        onClick={() => handleToggleGoal(currentOperatorPdi.id, g.id, mg.id)}
                                                                                        className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${
                                                                                            g.completed 
                                                                                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-550 shadow-[0_0_8px_rgba(16,185,129,0.1)]' 
                                                                                                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                                                                                        }`}
                                                                                    >
                                                                                        <Check size={14} />
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}

                                                                    {(!mg.goals || mg.goals.length === 0) && (
                                                                        <p className="text-[10px] text-slate-500 italic text-center py-4">Nenhuma submeta criada para este grupo.</p>
                                                                    )}
                                                                </div>

                                                                {/* Inline Subgoal Builder */}
                                                                {activeMainGoalId === mg.id ? (
                                                                    <div className="flex flex-col lg:flex-row gap-2 bg-slate-950 border border-slate-900 p-3.5 rounded-2xl animate-fade">
                                                                        <input 
                                                                            autoFocus
                                                                            type="text" 
                                                                            placeholder="Descreva o passo prático da submeta..." 
                                                                            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                                                                            value={newGoalText}
                                                                            onChange={e => setNewGoalText(e.target.value)}
                                                                        />
                                                                        <select 
                                                                            className="bg-slate-900 border border-slate-800 rounded-xl px-2 py-2 text-[10px] font-black uppercase text-slate-350 focus:outline-none cursor-pointer"
                                                                            value={newGoalCategory}
                                                                            onChange={e => setNewGoalCategory(e.target.value)}
                                                                        >
                                                                            <option value="70% (Prática/Experiência)">70% Experiência</option>
                                                                            <option value="20% (Mentoria/Exposição)">20% Mentoria</option>
                                                                            <option value="10% (Cursos/Educação)">10% Educação</option>
                                                                        </select>
                                                                        <input 
                                                                            type="date" 
                                                                            className="bg-slate-900 border border-slate-800 rounded-xl px-2 py-2 text-[10px] font-black uppercase text-slate-350 focus:outline-none"
                                                                            value={newGoalDeadline}
                                                                            onChange={e => setNewGoalDeadline(e.target.value)}
                                                                        />
                                                                        
                                                                        <div className="flex gap-2">
                                                                            <button 
                                                                                type="button" 
                                                                                onClick={() => setActiveMainGoalId(null)}
                                                                                className="p-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-slate-400 hover:text-rose-500 transition-colors"
                                                                            >
                                                                                Cancelar
                                                                            </button>
                                                                            <button 
                                                                                type="button" 
                                                                                onClick={() => handleAddSubGoal(mg.id)}
                                                                                className="px-5 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] tracking-wider rounded-xl shadow-md shadow-blue-950/20"
                                                                            >
                                                                                Salvar
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <button 
                                                                        onClick={() => setActiveMainGoalId(mg.id)}
                                                                        className="text-[9px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1 hover:text-blue-350 transition-colors mt-2"
                                                                    >
                                                                        <Plus size={12} /> Adicionar Submeta
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                            </div>
                                        )}

                                        {/* TAB 2: SKILLS & GAPS */}
                                        {activeSubTab === 'skills' && (
                                            <div className="space-y-6 animate-fade">
                                                
                                                {/* Skill Gaps Card */}
                                                <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6">
                                                    <h4 className="font-black text-slate-200 text-sm uppercase tracking-wider flex items-center gap-2 mb-4">
                                                        <Award size={16} className="text-blue-500" />
                                                        Matriz de Competências & Gaps Críticos
                                                    </h4>

                                                    {selectedOperator && selectedOperator.skills && Object.keys(selectedOperator.skills).length > 0 ? (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {Object.entries(selectedOperator.skills || {}).map(([skillName, levels]: [string, any]) => {
                                                                const gap = levels.p - levels.r;
                                                                const hasGap = gap > 0;
                                                                
                                                                return (
                                                                    <div key={skillName} className={`p-4 rounded-2xl border ${hasGap ? 'bg-rose-955/10 border-rose-900/20' : 'bg-slate-950 border-slate-900'} flex justify-between items-center`}>
                                                                        <div className="min-w-0 pr-3 leading-normal">
                                                                            <p className="text-xs font-bold text-slate-200 truncate">{skillName}</p>
                                                                            <div className="flex gap-4 mt-2">
                                                                                <span className="text-[9px] font-black uppercase text-slate-500">Real: <strong className="text-slate-350 font-black">N{levels.r}</strong></span>
                                                                                <span className="text-[9px] font-black uppercase text-slate-500">Alvo: <strong className="text-slate-350 font-black">N{levels.p}</strong></span>
                                                                            </div>
                                                                        </div>

                                                                        {hasGap ? (
                                                                            <span className="bg-rose-500/10 text-rose-500 text-[8px] font-black px-2 py-1 rounded-md border border-rose-500/20 shrink-0 flex items-center gap-1.5 animate-pulse">
                                                                                <AlertTriangle size={10} /> Gap de N{gap}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="bg-emerald-500/10 text-emerald-500 text-[8px] font-black px-2 py-1 rounded-md border border-emerald-500/20 shrink-0 flex items-center gap-1">
                                                                                <Check size={10} /> Conforme
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-slate-500 italic text-center py-6">Nenhuma competência cadastrada na matriz para este operador.</p>
                                                    )}
                                                </div>

                                                {/* Human Error Investigations log */}
                                                <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6">
                                                    <h4 className="font-black text-slate-200 text-sm uppercase tracking-wider flex items-center gap-2 mb-4">
                                                        <AlertTriangle size={16} className="text-rose-500" />
                                                        Registro de Ocorrências e Desvios do Liderado
                                                    </h4>

                                                    {selectedOperatorInvestigations.length > 0 ? (
                                                        <div className="space-y-3">
                                                            {selectedOperatorInvestigations.map(inv => (
                                                                <div key={inv.id} className="p-4 bg-slate-950 border border-slate-900 rounded-2xl space-y-2">
                                                                    <div className="flex justify-between items-center">
                                                                        <span className="text-[8px] font-black bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2 py-0.5 rounded uppercase">
                                                                            Investigação
                                                                        </span>
                                                                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{inv.occurrence.date}</span>
                                                                    </div>
                                                                    <p className="text-xs font-semibold text-slate-350">{inv.occurrence.description}</p>
                                                                    <div className="bg-slate-900/50 p-2.5 rounded-xl border border-slate-900 mt-2">
                                                                        <span className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Ação no Plano Operacional</span>
                                                                        <p className="text-[10px] text-slate-300 font-medium mt-0.5">{inv.actionPlan.action} (Prazo: {inv.actionPlan.deadline})</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="py-8 text-center bg-slate-950/20 border border-slate-900 border-dashed rounded-2xl">
                                                            <CheckSquare size={24} className="text-emerald-500/30 mx-auto mb-2" />
                                                            <p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Zero Desvios Operacionais</p>
                                                            <p className="text-[9px] text-slate-650 mt-0.5">Nenhuma ocorrência registrada sob responsabilidade deste colaborador.</p>
                                                        </div>
                                                    )}
                                                </div>

                                            </div>
                                        )}

                                        {/* TAB 3: AI DEVELOPMENT MENTORSHIP */}
                                        {activeSubTab === 'ai' && (
                                            <div className="space-y-6 animate-fade">
                                                
                                                {/* Strategic roadmap advisor */}
                                                <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 space-y-4">
                                                    <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                                                        <div>
                                                            <h4 className="font-black text-slate-200 text-sm uppercase tracking-wider flex items-center gap-2">
                                                                <Sparkles size={16} className="text-blue-400" />
                                                                Consultor de Carreira & Trilha do Liderado (IA)
                                                            </h4>
                                                            <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">Monte um plano de mentoria e evolução profissional 70/20/10 com IA</p>
                                                        </div>

                                                        <button
                                                            onClick={handleGenerateAiRoadmap}
                                                            disabled={isGeneratingRoadmap}
                                                            className="px-4 py-2 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all disabled:opacity-50"
                                                        >
                                                            {isGeneratingRoadmap ? <Loader2 size={12} className="animate-spin" /> : 'Gerar Trilha'}
                                                        </button>
                                                    </div>

                                                    {aiRoadmap ? (
                                                        <div className="bg-slate-955 border border-slate-900 rounded-2xl p-5 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap animate-fade font-medium">
                                                            {aiRoadmap}
                                                        </div>
                                                    ) : (
                                                        <div className="py-12 text-center bg-slate-955/20 border border-slate-900 border-dashed rounded-2xl">
                                                            <ShieldAlert size={28} className="text-slate-800 mx-auto mb-2" />
                                                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Trilha Tática Não Gerada</p>
                                                            <p className="text-slate-650 text-[10px] mt-0.5 max-w-sm mx-auto">Solicite a geração acima para obter um roteiro customizado de mentorias, desafios práticos e cursos recomendados para {selectedEmployee}.</p>
                                                        </div>
                                                    )}
                                                </div>

                                            </div>
                                        )}

                                    </div>
                                </>
                            )}

                        </div>
                    )}

                </div>

            </div>

        </div>
    );
};

export default PdiView;
