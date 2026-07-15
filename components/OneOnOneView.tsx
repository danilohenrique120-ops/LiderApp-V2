import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    MessageSquare, Trash2, Calendar, Download, Sparkles, Loader2, Info, Pencil, 
    ChevronDown, ChevronUp, Search, CheckCircle2, Circle, Target, Smile, Meh, Frown, 
    Plus, User, ArrowLeft, TrendingUp, Award, AlertTriangle, FileText, Check, 
    BookOpen, Briefcase, History, Clock, Heart, ShieldAlert, CheckSquare
} from 'lucide-react';
import { Meeting, Operator, HumanErrorInvestigation, PDI, MeetingAction } from '../types';
import { AiService } from '../services/AiService';

interface OneOnOneViewProps {
    meetings: Meeting[];
    employees: string[];
    user: any;
    db: any;
}

const IcebreakerSuggestions = [
    "Como você tem se sentido com relação ao seu trabalho e à equipe nas últimas semanas?",
    "Qual foi a maior vitória profissional que você teve desde a nossa última conversa?",
    "Existe algum obstáculo ou frustração atrapalhando sua rotina que eu possa ajudar a remover?",
    "O que você aprendeu ou desenvolveu de novo recentemente que achou interessante?",
    "Pensando nas suas metas de carreira, como você avalia seu progresso atual?",
    "Como eu, como seu líder, posso te apoiar de forma mais eficiente no seu dia a dia?"
];

const OneOnOneView: React.FC<OneOnOneViewProps> = ({ meetings, employees, user, db }) => {
    // Selection state
    const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
    const [activeSubTab, setActiveSubTab] = useState<'meetings' | 'pdi' | 'analytics'>('meetings');
    const [operatorSearch, setOperatorSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'done'>('all');

    // On-demand real-time data states for selected operator
    const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
    const [selectedOperatorPdi, setSelectedOperatorPdi] = useState<PDI | null>(null);
    const [selectedOperatorInvestigations, setSelectedOperatorInvestigations] = useState<HumanErrorInvestigation[]>([]);
    const [loadingDetails, setLoadingDetails] = useState(false);

    // Form states
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState<Partial<Meeting>>({ 
        employee: '', 
        date: '', 
        summary: '', 
        recognition: '', 
        improvements: '', 
        employeeActions: '', 
        managerActions: '', 
        actionItems: [], 
        sentiment: undefined 
    });
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [expandedCard, setExpandedCard] = useState<string | null>(null);
    const [lastMeeting, setLastMeeting] = useState<Meeting | null>(null);
    const [newActionText, setNewActionText] = useState('');
    const [newActionOwner, setNewActionOwner] = useState<'Líder' | 'Liderado'>('Liderado');

    // Icebreaker tool state
    const [icebreakerIndex, setIcebreakerIndex] = useState(0);

    // AI diagnostic state
    const [isGeneratingDiagnostic, setIsGeneratingDiagnostic] = useState(false);
    const [aiDiagnostic, setAiDiagnostic] = useState<string | null>(null);

    // Voice recording & transcription states
    const [isRecording, setIsRecording] = useState(false);
    const [liveTranscript, setLiveTranscript] = useState('');
    const [isStructuring, setIsStructuring] = useState(false);
    
    // Referências síncronas para controle da gravação por microfone
    const isRecordingRef = useRef<boolean>(false);
    const recognitionRef = useRef<any>(null);

    const aiService = AiService.getInstance();

    const startSpeechRecording = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("O reconhecimento de fala não é suportado pelo seu navegador atual. Use o Google Chrome, Edge ou Safari.");
            return;
        }

        setLiveTranscript('');
        setIsRecording(true);
        isRecordingRef.current = true;

        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'pt-BR';
        recognitionRef.current = rec;

        let accumulatedFinal = '';

        rec.onresult = (event: any) => {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    accumulatedFinal += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }
            setLiveTranscript(accumulatedFinal + interimTranscript);
        };

        rec.onerror = (event: any) => {
            console.error("Erro no reconhecimento de fala:", event.error);
            if (event.error === 'no-speech') {
                return;
            }
            if (event.error === 'not-allowed') {
                alert("Permissão de microfone negada. Conceda acesso ao microfone nas configurações do seu navegador para usar o recurso.");
                isRecordingRef.current = false;
                setIsRecording(false);
            }
        };

        rec.onend = () => {
            if (isRecordingRef.current) {
                try {
                    rec.start();
                } catch (e) {
                    console.error("Erro ao reiniciar reconhecimento de fala:", e);
                }
            } else {
                setIsRecording(false);
            }
        };

        rec.start();
    };

    const stopSpeechRecording = () => {
        isRecordingRef.current = false;
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) {
                console.error("Erro ao parar gravação:", e);
            }
        }
        setIsRecording(false);
    };

    const handleProcessTranscription = async () => {
        if (!liveTranscript.trim()) {
            alert("A transcrição está vazia. Grave ou digite algo no painel antes de processar.");
            return;
        }

        setIsStructuring(true);
        try {
            const result = await aiService.structureTranscription(liveTranscript);
            
            setFormData(prev => ({
                ...prev,
                recognition: result.recognition || prev.recognition,
                improvements: result.improvements || prev.improvements,
                summary: result.summary || prev.summary,
                sentiment: result.sentiment || prev.sentiment,
                actionItems: [
                    ...(prev.actionItems || []), 
                    ...(result.actionItems || []).map((a: any) => ({
                        id: Math.random().toString(36).substr(2, 9),
                        text: a.text,
                        owner: a.owner,
                        completed: false
                    }))
                ]
            }));

            alert("Formulário preenchido com sucesso a partir da transcrição da conversa!");
        } catch (error: any) {
            console.error("Erro ao processar áudio com IA:", error);
            alert(`Não foi possível processar a transcrição com a IA: ${error.message || 'Erro de conexão.'}`);
        } finally {
            setIsStructuring(false);
        }
    };

    // Setup local listeners for selected operator's details
    useEffect(() => {
        if (!selectedEmployee || !db || !user) {
            setSelectedOperator(null);
            setSelectedOperatorPdi(null);
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
                console.error("Error fetching operator details:", err);
                setLoadingDetails(false);
            });

        const unsubscribePdi = db.collection('pdis')
            .where('uid', '==', user.uid)
            .where('employee', '==', selectedEmployee)
            .onSnapshot((snapshot: any) => {
                if (!snapshot.empty) {
                    const doc = snapshot.docs[0];
                    setSelectedOperatorPdi({ id: doc.id, ...doc.data() } as PDI);
                } else {
                    setSelectedOperatorPdi(null);
                }
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
            unsubscribePdi();
            unsubscribeErrors();
        };
    }, [selectedEmployee, db, user]);

    // Reset diagnostic and sub tab when selected operator changes
    useEffect(() => {
        setAiDiagnostic(null);
        setAiSuggestion(null);
        setShowForm(false);
        setEditingId(null);
        setLiveTranscript('');
        setIsRecording(false);
        setFormData({ 
            employee: selectedEmployee || '', 
            date: new Date().toISOString().split('T')[0], 
            summary: '', 
            recognition: '', 
            improvements: '', 
            employeeActions: '', 
            managerActions: '', 
            actionItems: [], 
            sentiment: undefined 
        });
        
        if (selectedEmployee) {
            const empMeetings = meetings
                .filter(m => m.employee === selectedEmployee)
                .sort((a,b) => b.date.localeCompare(a.date));
            setLastMeeting(empMeetings[0] || null);
        } else {
            setLastMeeting(null);
        }
    }, [selectedEmployee, meetings]);

    // PDF Exporter
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

    // Calculate metrics per operator
    const operatorStats = useMemo(() => {
        const stats: Record<string, { lastMeetingDate: string | null; lastSentiment: string | null; pendingActions: number; status: 'green' | 'yellow' | 'red' }> = {};
        
        employees.forEach(emp => {
            const empMeetings = meetings
                .filter(m => m.employee === emp)
                .sort((a, b) => b.date.localeCompare(a.date));
            
            const last = empMeetings[0] || null;
            const lastMeetingDate = last ? last.date : null;
            const lastSentiment = last ? last.sentiment || null : null;
            
            const pendingActions = empMeetings.reduce((acc, m) => acc + (m.actionItems?.filter(a => !a.completed).length || 0), 0);
            
            let status: 'green' | 'yellow' | 'red' = 'red';
            if (lastMeetingDate) {
                const today = new Date();
                const lastDate = new Date(lastMeetingDate + 'T12:00:00');
                const diffTime = Math.abs(today.getTime() - lastDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays <= 15) status = 'green';
                else if (diffDays <= 30) status = 'yellow';
            }
            
            stats[emp] = { lastMeetingDate, lastSentiment, pendingActions, status };
        });
        
        return stats;
    }, [employees, meetings]);

    // Group meetings by month for selected operator
    const groupedMeetings = useMemo(() => {
        if (!selectedEmployee) return {};
        const empMeetings = meetings
            .filter(m => m.employee === selectedEmployee)
            .sort((a, b) => b.date.localeCompare(a.date));

        const groups: Record<string, Meeting[]> = {};
        empMeetings.forEach(m => {
            const dateObj = new Date(m.date + 'T12:00:00');
            const monthName = dateObj.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
            const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
            if (!groups[capitalizedMonth]) {
                groups[capitalizedMonth] = [];
            }
            groups[capitalizedMonth].push(m);
        });
        return groups;
    }, [selectedEmployee, meetings]);

    // Filtered employees list
    const filteredEmployees = useMemo(() => {
        return employees.filter(emp => {
            const matchesSearch = emp.toLowerCase().includes(operatorSearch.toLowerCase());
            if (!matchesSearch) return false;
            
            const stats = operatorStats[emp];
            if (statusFilter === 'pending') {
                return !stats || stats.status === 'red';
            } else if (statusFilter === 'done') {
                return stats && stats.status !== 'red';
            }
            return true;
        });
    }, [employees, operatorSearch, statusFilter, operatorStats]);

    // Team General metrics (Default view)
    const currentMonthStr = new Date().toISOString().substring(0, 7); // YYYY-MM
    const currentMonthMeetings = meetings.filter(m => m.date.startsWith(currentMonthStr));
    const coveredEmployeesCount = new Set(currentMonthMeetings.map(m => m.employee)).size;
    const teamCoverage = employees.length > 0 ? Math.round((coveredEmployeesCount / employees.length) * 100) : 0;
    const totalPendingActions = meetings.reduce((acc, m) => acc + (m.actionItems?.filter(a => !a.completed).length || 0), 0);

    const teamPendingActionsList = useMemo(() => {
        const list: Array<{ meetingId: string; employee: string; date: string; action: MeetingAction }> = [];
        meetings.forEach(m => {
            if (m.actionItems) {
                m.actionItems.forEach(action => {
                    if (!action.completed) {
                        list.push({ meetingId: m.id, employee: m.employee, date: m.date, action });
                    }
                });
            }
        });
        return list.sort((a, b) => b.date.localeCompare(a.date));
    }, [meetings]);

    // AI suggestions prompt generator
    const handleGenerateAiFeedback = async () => {
        if (!selectedEmployee) return;

        setIsGenerating(true);
        setAiSuggestion(null);

        try {
            // Skills gaps
            const gaps = selectedOperator && selectedOperator.skills ? Object.entries(selectedOperator.skills)
                .filter(([_, val]) => val.r < val.p)
                .map(([name]) => name) : [];

            // Human errors context
            const errorCount = selectedOperatorInvestigations.length;
            const latestActionPlan = selectedOperatorInvestigations[0]?.actionPlan;

            // PDI context
            let pdiContext = "Nenhum PDI ativo cadastrado para este colaborador.";
            if (selectedOperatorPdi) {
                const totalGoals = selectedOperatorPdi.goals?.length || 0;
                const completedGoals = selectedOperatorPdi.goals?.filter(g => g.completed).length || 0;
                const pendingGoalsList = selectedOperatorPdi.goals?.filter(g => !g.completed) || [];
                const pendingGoals = pendingGoalsList.map(g => `${g.text} (Prazo: ${g.deadline || 'N/A'})`).join('; ') || 'Nenhuma';
                pdiContext = `Objetivo Carreira: ${selectedOperatorPdi.careerObjective || 'Não definido'}. Metas: ${completedGoals}/${totalGoals} concluídas. Pendentes: ${pendingGoals}`;
            }

            const prompt = `
                Gere um roteiro de feedback completo de 1:1 estruturado para o colaborador:
                - Nome: ${selectedEmployee}
                - Cargo: ${selectedOperator?.role || 'Operador'}
                - Desvios Operacionais Recentes: ${errorCount} ocorrências.
                - Competências com Gaps Críticos: ${gaps.join(', ') || 'Nenhum gap crítico'}
                - Último plano de ação operacional: ${latestActionPlan?.action || 'Nenhum'}
                - Metas do PDI: ${pdiContext}
                
                Siga exatamente a estrutura metodológica do Sistema Líder:
                1. QUEBRA-GELO (Que pergunta pessoal/profissional fazer?)
                2. RECONHECIMENTO (O que elogiar com base no perfil ou esforço?)
                3. PONTOS DE ATENÇÃO (Fatos e dados, incluindo andamento das metas do PDI e desvios)
                4. PLANO DE AÇÃO ACORDADO (Sugestões de tarefas para Líder e Liderado)
                5. FECHAMENTO MOTIVACIONAL
            `;

            const suggestion = await aiService.generateOneOnOneFeedback(prompt);
            setAiSuggestion(suggestion);
        } catch (error: any) {
            console.error("Erro ao gerar feedback com IA:", error);
            alert(`Não foi possível gerar a sugestão com IA: ${error.message || 'Verifique sua chave de API.'}`);
        } finally {
            setIsGenerating(false);
        }
    };

    // AI Leadership diagnostic
    const handleGenerateAiDiagnostic = async () => {
        if (!selectedEmployee) return;
        setIsGeneratingDiagnostic(true);
        setAiDiagnostic(null);

        try {
            const context = {
                employee: selectedEmployee,
                role: selectedOperator?.role || 'Operador',
                department: selectedOperator?.departamento || 'Não informado',
                shift: selectedOperator?.shift || 'Não informado',
                skills: selectedOperator && selectedOperator.skills ? Object.entries(selectedOperator.skills).map(([k, v]) => ({ name: k, planejado: v.p, real: v.r })) : [],
                errors: selectedOperatorInvestigations.length,
                pdi: selectedOperatorPdi ? {
                    careerObjective: selectedOperatorPdi.careerObjective,
                    goals: selectedOperatorPdi.goals || [],
                    mainGoals: selectedOperatorPdi.mainGoals || []
                } : null,
                meetings: meetings.filter(m => m.employee === selectedEmployee).map(m => ({ date: m.date, sentiment: m.sentiment, recognition: m.recognition, improvements: m.improvements }))
            };

            const prompt = `
                Você é um Mentor de Liderança e Consultor de Gestão Industrial Sênior. 
                Gere um Diagnóstico Estratégico de Liderança detalhado para o colaborador ${selectedEmployee}.
                Analise:
                1. Evolução de sentimento (está motivado, neutro ou preocupado?).
                2. Taxa de gaps de skills (como sanar?).
                3. Ocorrências de erros e reincidências.
                4. Progresso no PDI.
                
                Forneça 3 conselhos práticos de gestão (Plano de Mentoria) para o líder aplicar no dia a dia deste liderado para potencializar sua performance.
            `;

            const result = await aiService.queryStrategicConsultant(prompt, context);
            setAiDiagnostic(result);
        } catch (error: any) {
            console.error("Erro ao gerar diagnóstico IA:", error);
            alert("Não foi possível gerar a análise estratégica de mentoria.");
        } finally {
            setIsGeneratingDiagnostic(false);
        }
    };

    // Save or update 1:1 meeting
    const saveMeeting = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEmployee || !formData.date) return;

        const payload = {
            employee: selectedEmployee,
            date: formData.date,
            summary: formData.summary || '',
            recognition: formData.recognition || '',
            improvements: formData.improvements || '',
            employeeActions: formData.employeeActions || '',
            managerActions: formData.managerActions || '',
            actionItems: formData.actionItems || [],
            sentiment: formData.sentiment || null,
            uid: user.uid
        };

        try {
            if (editingId) {
                await db.collection('meetings').doc(editingId).update({
                    ...payload,
                    updatedAt: new Date()
                });
            } else {
                await db.collection('meetings').add({
                    ...payload,
                    createdAt: new Date()
                });
            }

            // Reset form
            setFormData({ 
                employee: selectedEmployee, 
                date: new Date().toISOString().split('T')[0], 
                summary: '', 
                recognition: '', 
                improvements: '', 
                employeeActions: '', 
                managerActions: '', 
                actionItems: [], 
                sentiment: undefined 
            });
            setLiveTranscript('');
            setIsRecording(false);
            setAiSuggestion(null);
            setShowForm(false);
            setEditingId(null);
            
            // Refresh last meeting context
            const empMeetings = meetings
                .filter(m => m.employee === selectedEmployee)
                .sort((a,b) => b.date.localeCompare(a.date));
            setLastMeeting(empMeetings[0] || null);
        } catch (error) {
            console.error("Error saving meeting:", error);
            alert("Erro ao salvar a reunião no servidor.");
        }
    };

    // Open meeting for editing
    const openEdit = (meeting: Meeting) => {
        setFormData({
            employee: meeting.employee,
            date: meeting.date,
            summary: meeting.summary || '',
            recognition: meeting.recognition || '',
            improvements: meeting.improvements || '',
            employeeActions: meeting.employeeActions || '',
            managerActions: meeting.managerActions || '',
            actionItems: meeting.actionItems || [],
            sentiment: meeting.sentiment
        });
        setEditingId(meeting.id);
        const empMeetings = meetings
            .filter(m => m.employee === meeting.employee && m.id !== meeting.id)
            .sort((a,b) => b.date.localeCompare(a.date));
        setLastMeeting(empMeetings.length > 0 ? empMeetings[0] : null);
        setShowForm(true);
    };

    // Toggle meeting action completion status (both from list and form)
    const toggleActionCompletion = async (meetingId: string, actionId: string, currentStatus: boolean) => {
        const meeting = meetings.find(m => m.id === meetingId);
        if (!meeting || !meeting.actionItems) return;

        const updatedActions = meeting.actionItems.map(a => 
            a.id === actionId ? { ...a, completed: !currentStatus } : a
        );

        try {
            await db.collection('meetings').doc(meetingId).update({
                actionItems: updatedActions,
                updatedAt: new Date()
            });
        } catch (error) {
            console.error("Error toggling action completion:", error);
        }
    };

    // Delete a meeting
    const deleteMeeting = async (meetingId: string) => {
        if (confirm("Tem certeza que deseja excluir permanentemente o registro desta reunião de 1:1?")) {
            try {
                await db.collection('meetings').doc(meetingId).delete();
            } catch (error) {
                console.error("Error deleting meeting:", error);
            }
        }
    };

    // Toggle PDI Goal Status
    const handleTogglePdiGoal = async (goalId: string) => {
        if (!selectedOperatorPdi) return;
        
        let updatedPayload: any = {};
        
        if (selectedOperatorPdi.goals) {
            updatedPayload.goals = selectedOperatorPdi.goals.map(g => 
                g.id === goalId ? { ...g, completed: !g.completed } : g
            );
        }
        
        if (selectedOperatorPdi.mainGoals) {
            updatedPayload.mainGoals = selectedOperatorPdi.mainGoals.map(group => ({
                ...group,
                goals: group.goals.map(g => 
                    g.id === goalId ? { ...g, completed: !g.completed } : g
                )
            }));
        }

        try {
            await db.collection('pdis').doc(selectedOperatorPdi.id).update(updatedPayload);
        } catch (error) {
            console.error("Error updating PDI Goal:", error);
            alert("Erro ao atualizar o PDI no banco de dados.");
        }
    };

    // Add action item to form list
    const addActionItem = () => {
        if (!newActionText.trim()) return;
        const newItem: MeetingAction = {
            id: Math.random().toString(36).substr(2, 9),
            text: newActionText.trim(),
            owner: newActionOwner,
            completed: false
        };
        setFormData({ ...formData, actionItems: [...(formData.actionItems || []), newItem] });
        setNewActionText('');
    };

    // Remove action item from form list
    const removeActionItem = (id: string) => {
        setFormData({ ...formData, actionItems: (formData.actionItems || []).filter(a => a.id !== id) });
    };

    // Rotator for Icebreakers
    const rotateIcebreaker = () => {
        setIcebreakerIndex((prev) => (prev + 1) % IcebreakerSuggestions.length);
    };

    return (
        <div className="animate-fade text-slate-100 min-h-screen pb-12">
            
            {/* MASTER-DETAIL CONTROLLER */}
            <div className="flex flex-col lg:flex-row gap-6">
                
                {/* COLUMN 1: LEFT SIDEBAR (OPERATORS LIST) */}
                <div className={`w-full lg:w-80 shrink-0 bg-slate-800 border border-slate-700 rounded-[2rem] p-4 flex flex-col h-[calc(100vh-140px)] sticky top-24 ${selectedEmployee ? 'hidden lg:flex' : 'flex'}`}>
                    
                    {/* Header */}
                    <div className="mb-4">
                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-3">Colaboradores</h3>
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
                            onClick={() => setStatusFilter('pending')} 
                            className={`flex-1 text-[9px] font-black uppercase tracking-widest py-2 rounded-lg transition-all ${statusFilter === 'pending' ? 'bg-rose-950/40 text-rose-400 border border-rose-900/30' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Atrasados
                        </button>
                        <button 
                            onClick={() => setStatusFilter('done')} 
                            className={`flex-1 text-[9px] font-black uppercase tracking-widest py-2 rounded-lg transition-all ${statusFilter === 'done' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Em dia
                        </button>
                    </div>

                    {/* Operator List Scroll */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                        {filteredEmployees.map(emp => {
                            const stats = operatorStats[emp];
                            const isSelected = selectedEmployee === emp;
                            
                            return (
                                <button
                                    key={emp}
                                    onClick={() => setSelectedEmployee(emp)}
                                    className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center gap-3 group relative ${
                                        isSelected 
                                            ? 'bg-blue-600/10 border-blue-500/50 text-white' 
                                            : 'bg-slate-950 border-slate-900 hover:border-slate-600 text-slate-300 hover:text-white'
                                    }`}
                                >
                                    {/* Initials & Status light */}
                                    <div className="relative">
                                        <div className="w-10 h-10 bg-slate-800 text-slate-200 rounded-xl flex items-center justify-center font-black text-xs uppercase group-hover:scale-105 transition-transform">
                                            {emp.charAt(0)}
                                        </div>
                                        <div 
                                            className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 flex items-center justify-center ${
                                                stats?.status === 'green' ? 'bg-emerald-500' :
                                                stats?.status === 'yellow' ? 'bg-amber-500' : 'bg-rose-500 animate-pulse'
                                            }`}
                                            title={stats?.status === 'green' ? 'Em dia' : stats?.status === 'yellow' ? 'Alinhamento próximo' : 'Feedback pendente'}
                                        />
                                    </div>

                                    {/* Name and Last meeting info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-xs truncate leading-tight">{emp}</p>
                                        <p className="text-[9px] font-black uppercase text-slate-500 mt-1 flex items-center gap-1">
                                            {stats?.lastMeetingDate ? (
                                                <>
                                                    <Clock size={8} /> {stats.lastMeetingDate}
                                                    {stats.lastSentiment && <span className="ml-1">{stats.lastSentiment}</span>}
                                                </>
                                            ) : (
                                                <span className="text-rose-500 font-bold">Sem alinhamentos</span>
                                            )}
                                        </p>
                                    </div>

                                    {/* Badges */}
                                    {stats && stats.pendingActions > 0 && (
                                        <span className="bg-amber-500/10 text-amber-500 text-[8px] font-black px-2 py-0.5 rounded-md border border-amber-500/20">
                                            {stats.pendingActions} Ações
                                        </span>
                                    )}
                                </button>
                            );
                        })}

                        {filteredEmployees.length === 0 && (
                            <div className="text-center py-12">
                                <User size={24} className="text-slate-700 mx-auto mb-2" />
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Nenhum colaborador encontrado</p>
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
                                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Painel Operacional</span>
                                    <h2 className="text-3xl font-black text-slate-100 tracking-tight uppercase">Cockpit Geral 1:1</h2>
                                </div>
                                <button 
                                    onClick={() => exportToPDF('general-one-on-one-cockpit', 'Cockpit-General-1-1')} 
                                    className="bg-slate-800 border border-slate-700 text-slate-300 hover:text-white px-4 py-2.5 rounded-xl flex items-center gap-2 font-black text-[9px] uppercase tracking-widest transition-colors shadow-sm"
                                >
                                    <Download size={14} /> PDF Completo
                                </button>
                            </header>

                            <div id="general-one-on-one-cockpit" className="space-y-6">
                                {/* Statistics Cards Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-slate-800 border border-slate-700 p-6 rounded-[2rem] shadow-sm flex items-center gap-4 group hover:border-slate-600 transition-colors">
                                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:scale-105 transition-transform border border-blue-500/20">
                                            <MessageSquare size={24} />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Alinhados no Mês</p>
                                            <h3 className="text-2xl font-black text-slate-100 mt-1">{currentMonthMeetings.length}</h3>
                                        </div>
                                    </div>
                                    <div className="bg-slate-800 border border-slate-700 p-6 rounded-[2rem] shadow-sm flex items-center gap-4 group hover:border-slate-600 transition-colors">
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-105 transition-transform border border-emerald-500/20">
                                            <Target size={24} />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Cobertura da Equipe</p>
                                            <div className="flex items-end gap-2 mt-1">
                                                <h3 className="text-2xl font-black text-slate-100">{teamCoverage}%</h3>
                                                <span className="text-[10px] font-bold text-slate-500 mb-0.5">({coveredEmployeesCount} de {employees.length})</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-slate-800 border border-slate-700 p-6 rounded-[2rem] shadow-sm flex items-center gap-4 group hover:border-slate-600 transition-colors">
                                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-105 transition-transform border border-amber-500/20">
                                            <CheckSquare size={24} />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Planos de Ação Ativos</p>
                                            <h3 className="text-2xl font-black text-slate-100 mt-1">{totalPendingActions}</h3>
                                        </div>
                                    </div>
                                </div>

                                {/* Central Action Items & Leadership Guide split */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Action Items List */}
                                    <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-[2rem] p-6 flex flex-col h-[500px]">
                                        <div className="mb-4">
                                            <h4 className="font-black text-slate-200 text-sm uppercase tracking-wider flex items-center gap-2">
                                                <Target size={16} className="text-blue-500" />
                                                Fila de Ações do Time
                                            </h4>
                                            <p className="text-[9px] font-bold uppercase text-slate-500 mt-1">Ações de reuniões pendentes de conclusão</p>
                                        </div>
                                        
                                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                                            {teamPendingActionsList.map(({ meetingId, employee, date, action }) => (
                                                <div key={action.id} className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-900 rounded-2xl hover:border-slate-600 transition-colors">
                                                    <div className="flex-1 min-w-0 pr-4">
                                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                                            <span className="text-[9px] font-black bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded border border-blue-950">
                                                                {employee}
                                                            </span>
                                                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${action.owner === 'Líder' ? 'bg-indigo-900/40 text-indigo-400 border border-indigo-950' : 'bg-emerald-900/40 text-emerald-400 border border-emerald-950'}`}>
                                                                {action.owner}
                                                            </span>
                                                            <span className="text-slate-500 text-[8px] flex items-center gap-1 font-bold uppercase">
                                                                <Calendar size={10} /> {date}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-slate-300 font-medium leading-tight">{action.text}</p>
                                                    </div>
                                                    <button 
                                                        onClick={() => toggleActionCompletion(meetingId, action.id, action.completed)}
                                                        className="w-10 h-10 bg-slate-800 border border-slate-700 hover:bg-emerald-500 hover:text-white hover:border-emerald-600 rounded-xl flex items-center justify-center transition-all shadow text-slate-500 shrink-0"
                                                        title="Concluir Ação"
                                                    >
                                                        <Check size={18} />
                                                    </button>
                                                </div>
                                            ))}

                                            {teamPendingActionsList.length === 0 && (
                                                <div className="h-full flex flex-col items-center justify-center text-center py-20">
                                                    <CheckCircle2 size={36} className="text-emerald-500/40 mb-3" />
                                                    <h5 className="text-xs font-bold text-slate-300 uppercase">Tudo em dia!</h5>
                                                    <p className="text-slate-500 text-[10px] mt-1 max-w-xs">Nenhum plano de ação de 1:1 pendente de execução.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Meeting Leadership Guide */}
                                    <div className="bg-slate-800 border border-slate-700 rounded-[2rem] p-6 flex flex-col justify-between">
                                        <div>
                                            <h4 className="font-black text-slate-200 text-sm uppercase tracking-wider flex items-center gap-2 mb-4">
                                                <BookOpen size={16} className="text-blue-500" />
                                                Guia do Facilitador
                                            </h4>
                                            
                                            <div className="space-y-4">
                                                <div className="flex gap-3 items-start">
                                                    <div className="w-6 h-6 bg-blue-500/10 text-blue-500 rounded flex items-center justify-center font-black text-xs border border-blue-500/20 shrink-0">1</div>
                                                    <div>
                                                        <h5 className="text-[10px] font-black uppercase text-slate-300">Regra 80/20 de Escuta</h5>
                                                        <p className="text-[9px] text-slate-500 mt-0.5 leading-relaxed">A reunião pertence ao liderado. O gestor fala 20% do tempo (faz perguntas) e ouve ativamente nos outros 80%.</p>
                                                    </div>
                                                </div>

                                                <div className="flex gap-3 items-start">
                                                    <div className="w-6 h-6 bg-blue-500/10 text-blue-500 rounded flex items-center justify-center font-black text-xs border border-blue-500/20 shrink-0">2</div>
                                                    <div>
                                                        <h5 className="text-[10px] font-black uppercase text-slate-300">Cobrança Saudável</h5>
                                                        <p className="text-[9px] text-slate-500 mt-0.5 leading-relaxed">Sempre comece revisando as ações pendentes da 1:1 anterior. Isso gera prestação de contas e responsabilidade.</p>
                                                    </div>
                                                </div>

                                                <div className="flex gap-3 items-start">
                                                    <div className="w-6 h-6 bg-blue-500/10 text-blue-500 rounded flex items-center justify-center font-black text-xs border border-blue-500/20 shrink-0">3</div>
                                                    <div>
                                                        <h5 className="text-[10px] font-black uppercase text-slate-300">Integre Desenvolvimento</h5>
                                                        <p className="text-[9px] text-slate-500 mt-0.5 leading-relaxed">Use a 1:1 para verificar o andamento do PDI (Plano de Desenvolvimento Individual). Conecte competências e metas.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
                                            <p className="text-[9px] text-slate-500 italic leading-relaxed">"Reuniões de 1:1 consistentes reduzem o turnover do setor em até 30%."</p>
                                            <p className="text-[9px] font-black uppercase text-blue-400 mt-2 tracking-wider">Selecione um operador para iniciar</p>
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
                            <div className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-3xl p-4">
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
                                            {selectedOperator?.status && (
                                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${selectedOperator.status === 'ativo' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30' : 'bg-amber-950/40 text-amber-400 border border-amber-900/30'}`}>
                                                    {selectedOperator.status}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">
                                            {selectedOperator?.role || 'Operador'} • {selectedOperator?.departamento || 'Setor'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => exportToPDF(`workspace-individual-${selectedEmployee}`, `Relatorio-Feedback-1-1-${selectedEmployee}`)} 
                                        className="bg-slate-950 border border-slate-800 text-slate-300 hover:text-white px-3.5 py-2 rounded-xl flex items-center gap-1.5 font-bold text-[9px] uppercase tracking-wider transition-colors"
                                    >
                                        <Download size={12} /> Relatório PDF
                                    </button>
                                    <button 
                                        onClick={() => setShowForm(!showForm)} 
                                        className={`px-4 py-2 rounded-xl font-black uppercase text-[9px] tracking-wider shadow-lg transition-colors flex items-center gap-1 ${showForm ? 'bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-700' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                                    >
                                        {showForm ? 'Cancelar Reunião' : <><Plus size={12} /> Iniciar 1:1</>}
                                    </button>
                                </div>
                            </div>

                            {/* Operator Quick Stats Bar */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-slate-800 border border-slate-700 p-4 rounded-2xl flex flex-col justify-center">
                                    <span className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Total de Reuniões</span>
                                    <p className="text-lg font-black text-white mt-0.5">{meetings.filter(m => m.employee === selectedEmployee).length}</p>
                                </div>
                                <div className="bg-slate-800 border border-slate-700 p-4 rounded-2xl flex flex-col justify-center">
                                    <span className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Último Encontro</span>
                                    <p className="text-xs font-bold text-slate-200 mt-1 truncate">{lastMeeting?.date || 'Não registrado'}</p>
                                </div>
                                <div className="bg-slate-800 border border-slate-700 p-4 rounded-2xl flex flex-col justify-center">
                                    <span className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Pendências de Planos</span>
                                    <p className="text-lg font-black text-amber-400 mt-0.5">{operatorStats[selectedEmployee]?.pendingActions || 0}</p>
                                </div>
                                <div className="bg-slate-800 border border-slate-700 p-4 rounded-2xl flex flex-col justify-center">
                                    <span className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Último Sentimento</span>
                                    <p className="text-lg mt-0.5">{lastMeeting?.sentiment || '—'}</p>
                                </div>
                            </div>

                            {/* Inner Sub Tabs Navigation */}
                            <div className="flex gap-1 border-b border-slate-800">
                                <button
                                    onClick={() => setActiveSubTab('meetings')}
                                    className={`px-4 py-3 text-[10px] font-black uppercase tracking-wider border-b-2 transition-colors ${activeSubTab === 'meetings' ? 'border-blue-500 text-blue-400 font-bold' : 'border-transparent text-slate-500 hover:text-slate-350'}`}
                                >
                                    Reuniões & Histórico
                                </button>
                                <button
                                    onClick={() => setActiveSubTab('pdi')}
                                    className={`px-4 py-3 text-[10px] font-black uppercase tracking-wider border-b-2 transition-colors ${activeSubTab === 'pdi' ? 'border-blue-500 text-blue-400 font-bold' : 'border-transparent text-slate-500 hover:text-slate-355'}`}
                                >
                                    PDI & Competências
                                </button>
                                <button
                                    onClick={() => setActiveSubTab('analytics')}
                                    className={`px-4 py-3 text-[10px] font-black uppercase tracking-wider border-b-2 transition-colors ${activeSubTab === 'analytics' ? 'border-blue-500 text-blue-400 font-bold' : 'border-transparent text-slate-500 hover:text-slate-360'}`}
                                >
                                    Diagnóstico & Relatórios
                                </button>
                            </div>

                            {/* MAIN WORKSPACE SECTION */}
                            <div id={`workspace-individual-${selectedEmployee}`} className="space-y-6">

                                {/* SUB-TAB 1: MEETINGS & HISTORY */}
                                {activeSubTab === 'meetings' && (
                                    <div className="space-y-6">
                                        
                                        {/* FORM: ACTIVE MEETING */}
                                        {showForm && (
                                            <div className="bg-slate-800 border border-slate-700 rounded-[2rem] p-6 space-y-6 animate-fade">
                                                
                                                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                                    <div>
                                                        <h3 className="text-xs font-black uppercase text-blue-400 tracking-wider">
                                                            {editingId ? 'Editar Registro de 1:1' : 'Conduzindo Nova Reunião'}
                                                        </h3>
                                                        <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">Defina pontos táticos e planos de ação</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={handleGenerateAiFeedback}
                                                        disabled={isGenerating}
                                                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-50 shadow-md shadow-blue-950/20"
                                                    >
                                                        {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                                        Roteiro da IA
                                                    </button>
                                                </div>

                                                <form onSubmit={saveMeeting} className="space-y-5">
                                                    
                                                    {/* Row 1: Date & Sentiment */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="flex flex-col gap-1.5">
                                                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Data do Alinhamento</label>
                                                            <input 
                                                                type="date" 
                                                                required 
                                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-semibold text-slate-100 focus:outline-none focus:border-blue-500" 
                                                                value={formData.date || ''} 
                                                                onChange={e => setFormData({ ...formData, date: e.target.value })} 
                                                            />
                                                        </div>

                                                        <div className="flex flex-col gap-1.5">
                                                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Sentimento do Colaborador</label>
                                                            <div className="grid grid-cols-3 gap-2">
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => setFormData({ ...formData, sentiment: '😃' })} 
                                                                    className={`py-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                                                                        formData.sentiment === '😃' 
                                                                            ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.1)]' 
                                                                            : 'bg-slate-950 border-slate-800 text-slate-450 hover:bg-slate-850'
                                                                    }`}
                                                                >
                                                                    <Smile size={16} /> Ótimo
                                                                </button>
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => setFormData({ ...formData, sentiment: '😐' })} 
                                                                    className={`py-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                                                                        formData.sentiment === '😐' 
                                                                            ? 'bg-amber-950/40 border-amber-500 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.1)]' 
                                                                            : 'bg-slate-950 border-slate-800 text-slate-450 hover:bg-slate-850'
                                                                    }`}
                                                                >
                                                                    <Meh size={16} /> Neutro
                                                                </button>
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => setFormData({ ...formData, sentiment: '🙁' })} 
                                                                    className={`py-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                                                                        formData.sentiment === '🙁' 
                                                                            ? 'bg-rose-950/40 border-rose-500 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.1)]' 
                                                                            : 'bg-slate-950 border-slate-800 text-slate-450 hover:bg-slate-850'
                                                                    }`}
                                                                >
                                                                    <Frown size={16} /> Preocupante
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Icebreaker Rotator Panel */}
                                                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex justify-between items-start gap-4 animate-fade">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-1.5 text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1.5">
                                                                <Heart size={10} /> Quebra-Gelo Recomendado
                                                            </div>
                                                            <p className="text-xs text-slate-350 italic leading-relaxed">
                                                                "{IcebreakerSuggestions[icebreakerIndex]}"
                                                            </p>
                                                        </div>
                                                        <button 
                                                            type="button" 
                                                            onClick={rotateIcebreaker}
                                                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[8px] font-black uppercase tracking-widest rounded-lg shrink-0 text-slate-400 hover:text-white"
                                                        >
                                                            Próximo
                                                        </button>
                                                    </div>

                                                    {/* Voice Recorder & Transcription Panel */}
                                                    <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 space-y-4">
                                                        <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-3.5 h-3.5 rounded-full bg-rose-600 ${isRecording ? 'animate-pulse' : ''}`} />
                                                                <h4 className="text-[10px] font-black uppercase text-slate-350 tracking-wider">
                                                                    Gravação & Transcrição por Voz
                                                                </h4>
                                                            </div>
                                                            {isRecording && (
                                                                <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest animate-pulse flex items-center gap-1">
                                                                    🎙️ Gravando conversa...
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="flex flex-col md:flex-row gap-3 items-center">
                                                            <button
                                                                type="button"
                                                                onClick={isRecording ? stopSpeechRecording : startSpeechRecording}
                                                                className={`w-full md:w-auto px-5 py-3 rounded-xl font-black uppercase text-[10px] tracking-wider transition-all flex items-center justify-center gap-2 shadow-md border ${
                                                                    isRecording 
                                                                        ? 'bg-rose-950/20 border-rose-500/50 text-rose-400 hover:bg-rose-900/40' 
                                                                        : 'bg-blue-600 border-blue-505 hover:bg-blue-700 text-white'
                                                                }`}
                                                            >
                                                                {isRecording ? 'Parar Gravação' : 'Iniciar Gravação'}
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={handleProcessTranscription}
                                                                disabled={isRecording || isStructuring || !liveTranscript.trim()}
                                                                className="w-full md:w-auto px-5 py-3 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md"
                                                            >
                                                                {isStructuring ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                                                Estruturar com IA (Preencher Formulário)
                                                            </button>
                                                        </div>

                                                        {(liveTranscript.trim() || isRecording) && (
                                                            <div className="flex flex-col gap-1.5 animate-fade pt-1">
                                                                <label className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Transcrição Bruta (Editável)</label>
                                                                <textarea
                                                                    rows={3}
                                                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3.5 text-xs text-slate-300 font-semibold focus:outline-none focus:border-blue-500"
                                                                    placeholder="O texto gravado aparecerá aqui. Você também pode digitar correções manuais..."
                                                                    value={liveTranscript}
                                                                    onChange={e => setLiveTranscript(e.target.value)}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* REVIEW PREVIOUS MEETING ACTIONS */}
                                                    {lastMeeting && !editingId && lastMeeting.actionItems && lastMeeting.actionItems.length > 0 && (
                                                        <div className="bg-amber-950/10 border border-amber-900/30 rounded-2xl p-4">
                                                            <h4 className="text-[9px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5 mb-2">
                                                                <AlertTriangle size={12} />
                                                                Revisão das Ações da 1:1 Anterior ({lastMeeting.date})
                                                            </h4>
                                                            <ul className="space-y-2">
                                                                {lastMeeting.actionItems.map(action => (
                                                                    <li key={action.id} className="flex items-start gap-2.5 bg-slate-950/60 p-2.5 rounded-xl border border-slate-900">
                                                                        <button 
                                                                            type="button"
                                                                            onClick={() => toggleActionCompletion(lastMeeting.id, action.id, action.completed)}
                                                                            className={`mt-0.5 shrink-0 ${action.completed ? 'text-emerald-500' : 'text-slate-600 hover:text-amber-500'} transition-all`}
                                                                        >
                                                                            {action.completed ? <CheckSquare size={16} /> : <Circle size={16} />}
                                                                        </button>
                                                                        <div className="flex-1">
                                                                            <p className={`text-xs ${action.completed ? 'text-slate-550 line-through opacity-70' : 'text-slate-200'}`}>
                                                                                <strong className="text-[9px] uppercase font-bold text-slate-400 mr-1">{action.owner}:</strong>
                                                                                {action.text}
                                                                            </p>
                                                                        </div>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}

                                                    {/* Copilot Suggestion Box */}
                                                    {aiSuggestion && (
                                                        <div className="bg-blue-950/20 border border-blue-900/30 rounded-[2rem] p-5 relative animate-fade space-y-3">
                                                            <div className="absolute -top-3 left-6 px-3 py-1 bg-blue-600 text-white text-[8px] font-black uppercase rounded-full shadow-lg flex items-center gap-1">
                                                                <Sparkles size={10} /> Roteiro Sugerido
                                                            </div>
                                                            <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto custom-scrollbar pt-2 font-medium">
                                                                {aiSuggestion}
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => setFormData({ ...formData, summary: aiSuggestion })}
                                                                className="text-[9px] font-black text-blue-400 uppercase tracking-widest hover:underline"
                                                            >
                                                                Copiar Roteiro para o Resumo
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* Textareas: Recognition & Improvements */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="flex flex-col gap-1.5">
                                                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Reconhecimento (O que está indo bem)</label>
                                                            <textarea
                                                                rows={3}
                                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-semibold text-slate-100 placeholder-slate-650 focus:outline-none focus:border-blue-500"
                                                                placeholder="Destaque pontos fortes, conquistas e condutas exemplares..."
                                                                value={formData.recognition || ''}
                                                                onChange={e => setFormData({ ...formData, recognition: e.target.value })}
                                                            />
                                                        </div>
                                                        <div className="flex flex-col gap-1.5">
                                                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Pontos de Atenção & Melhorias</label>
                                                            <textarea
                                                                rows={3}
                                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-semibold text-slate-100 placeholder-slate-650 focus:outline-none focus:border-blue-500"
                                                                placeholder="Gaps de skills, atitudes ou metas de PDI que precisam de ajuste..."
                                                                value={formData.improvements || ''}
                                                                onChange={e => setFormData({ ...formData, improvements: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* INTERACTIVE PLAN OF ACTION EDITOR */}
                                                    <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 space-y-4">
                                                        <div>
                                                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Novos Planos de Ação Acordados</label>
                                                            <p className="text-[8px] text-slate-550 uppercase font-bold mt-0.5">Adicione ações com proprietários específicos para a próxima 1:1</p>
                                                        </div>

                                                        <div className="flex flex-col sm:flex-row gap-2">
                                                            <select 
                                                                className="p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 w-full sm:w-1/4 focus:outline-none focus:border-blue-500"
                                                                value={newActionOwner}
                                                                onChange={e => setNewActionOwner(e.target.value as any)}
                                                            >
                                                                <option value="Liderado">Liderado fará</option>
                                                                <option value="Líder">Líder fará</option>
                                                            </select>
                                                            
                                                            <div className="flex flex-1 gap-2">
                                                                <input 
                                                                    type="text"
                                                                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                                                                    placeholder="Qual será a tarefa específica acordada..."
                                                                    value={newActionText}
                                                                    onChange={e => setNewActionText(e.target.value)}
                                                                    onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); addActionItem(); } }}
                                                                />
                                                                <button 
                                                                    type="button" 
                                                                    onClick={addActionItem}
                                                                    className="px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-md"
                                                                >
                                                                    <Plus size={16} />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {formData.actionItems && formData.actionItems.length > 0 && (
                                                            <ul className="space-y-2 pt-2">
                                                                {formData.actionItems.map(action => (
                                                                    <li key={action.id} className="flex justify-between items-center bg-slate-800 border border-slate-700/80 p-3 rounded-xl group animate-fade">
                                                                        <div className="flex items-center gap-2.5">
                                                                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${action.owner === 'Líder' ? 'bg-indigo-900/40 text-indigo-400 border border-indigo-955' : 'bg-emerald-900/40 text-emerald-400 border border-emerald-955'}`}>
                                                                                {action.owner}
                                                                            </span>
                                                                            <span className="text-xs text-slate-250 font-medium">{action.text}</span>
                                                                        </div>
                                                                        <button 
                                                                            type="button" 
                                                                            onClick={() => removeActionItem(action.id)} 
                                                                            className="text-slate-500 hover:text-rose-500 p-1 opacity-0 group-hover:opacity-100 transition-all"
                                                                        >
                                                                            <Trash2 size={14} />
                                                                        </button>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </div>

                                                    {/* Summary free notes */}
                                                    <div className="flex flex-col gap-1.5">
                                                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Anotações Gerais / Conclusão</label>
                                                        <textarea
                                                            rows={2}
                                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-semibold text-slate-100 placeholder-slate-650 focus:outline-none focus:border-blue-500"
                                                            placeholder="Resuma os acordos de fechamento e anote livremente..."
                                                            value={formData.summary || ''}
                                                            onChange={e => setFormData({ ...formData, summary: e.target.value })}
                                                        />
                                                    </div>

                                                    {/* Action Buttons */}
                                                    <div className="flex gap-3 pt-2">
                                                        <button 
                                                            type="submit" 
                                                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-black uppercase tracking-wider shadow-lg shadow-blue-950/20 transition-all text-xs"
                                                        >
                                                            {editingId ? 'Salvar Alterações' : 'Gravar Reunião de 1:1'}
                                                        </button>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => { setShowForm(false); setEditingId(null); setAiSuggestion(null); }} 
                                                            className="px-6 py-3.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-xl font-black uppercase tracking-wider text-xs text-slate-400"
                                                        >
                                                            Cancelar
                                                        </button>
                                                    </div>

                                                </form>

                                            </div>
                                        )}

                                        {/* MONTH BY MONTH TIMELINE */}
                                        <div className="space-y-6">
                                            <h3 className="text-xs font-black uppercase text-slate-450 tracking-wider border-b border-slate-800 pb-2">Linha do Tempo de Alinhamentos</h3>
                                            
                                            <div className="relative border-l border-slate-800 ml-4 pl-6 space-y-8">
                                                {Object.keys(groupedMeetings).map(monthStr => (
                                                    <div key={monthStr} className="space-y-4 relative">
                                                        {/* Month Dot Tag */}
                                                        <div className="absolute -left-[31px] top-1.5 bg-slate-950 border border-slate-800 text-slate-350 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-sm">
                                                            {monthStr}
                                                        </div>

                                                        <div className="pt-8 space-y-4">
                                                            {groupedMeetings[monthStr].map(m => {
                                                                const isExpanded = expandedCard === m.id;
                                                                return (
                                                                    <div key={m.id} id={`meeting-card-${m.id}`} className="bg-slate-800 border border-slate-700 rounded-[2rem] p-5 shadow-sm space-y-4 hover:border-slate-600 transition-colors animate-fade">
                                                                        
                                                                        {/* Card Header info */}
                                                                        <div className="flex justify-between items-start">
                                                                            <div>
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="font-bold text-sm text-slate-200">{m.employee}</span>
                                                                                    {m.sentiment === '😃' && <span title="Ótimo" className="text-emerald-500"><Smile size={18} /></span>}
                                                                                    {m.sentiment === '😐' && <span title="Neutro" className="text-amber-500"><Meh size={18} /></span>}
                                                                                    {m.sentiment === '🙁' && <span title="Preocupante" className="text-rose-500"><Frown size={18} /></span>}
                                                                                </div>
                                                                                <p className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1.5 mt-1">
                                                                                    <Calendar size={12} /> {m.date}
                                                                                </p>
                                                                            </div>

                                                                            {/* Options */}
                                                                            <div className="flex gap-1.5">
                                                                                <button onClick={() => openEdit(m)} className="text-slate-600 hover:text-blue-500 p-1.5 rounded-lg hover:bg-slate-950 border border-transparent hover:border-slate-850 transition-all" title="Editar Registro">
                                                                                    <Pencil size={14} />
                                                                                </button>
                                                                                <button onClick={() => exportToPDF(`meeting-card-${m.id}`, `Feedback-1-1-${m.employee}-${m.date}`)} className="text-slate-600 hover:text-emerald-500 p-1.5 rounded-lg hover:bg-slate-950 border border-transparent hover:border-slate-850 transition-all" title="Baixar PDF">
                                                                                    <Download size={14} />
                                                                                </button>
                                                                                <button onClick={() => deleteMeeting(m.id)} className="text-slate-600 hover:text-rose-500 p-1.5 rounded-lg hover:bg-slate-950 border border-transparent hover:border-slate-850 transition-all" title="Excluir Registro">
                                                                                    <Trash2 size={14} />
                                                                                </button>
                                                                            </div>
                                                                        </div>

                                                                        {/* Toggle Button */}
                                                                        <button
                                                                            onClick={() => setExpandedCard(isExpanded ? null : m.id)}
                                                                            className="w-full flex items-center justify-between px-4 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-900 rounded-xl transition-all text-[9px] font-black text-slate-400 uppercase tracking-widest"
                                                                        >
                                                                            {isExpanded ? 'Ocular Relato' : 'Ver Detalhes da Conversa'}
                                                                            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                                                        </button>

                                                                        {/* EXPANDED CONTENT */}
                                                                        {isExpanded && (
                                                                            <div className="space-y-4 pt-2 border-t border-slate-850 animate-fade">
                                                                                {m.recognition && (
                                                                                    <div className="space-y-1">
                                                                                        <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Reconhecimento</span>
                                                                                        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-950">{m.recognition}</p>
                                                                                    </div>
                                                                                )}
                                                                                {m.improvements && (
                                                                                    <div className="space-y-1">
                                                                                        <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest">Pontos de Desenvolvimento</span>
                                                                                        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-955">{m.improvements}</p>
                                                                                    </div>
                                                                                )}
                                                                                {m.actionItems && m.actionItems.length > 0 && (
                                                                                    <div className="space-y-2">
                                                                                        <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Plano de Ação Acordado</span>
                                                                                        <ul className="space-y-2">
                                                                                            {m.actionItems.map(action => (
                                                                                                <li key={action.id} className="flex items-start gap-2.5 bg-slate-950 p-2.5 rounded-xl border border-slate-950">
                                                                                                    <button 
                                                                                                        onClick={() => toggleActionCompletion(m.id, action.id, action.completed)}
                                                                                                        className={`mt-0.5 shrink-0 ${action.completed ? 'text-emerald-500' : 'text-slate-700 hover:text-amber-500'} transition-all`}
                                                                                                    >
                                                                                                        {action.completed ? <CheckSquare size={16} /> : <Circle size={16} />}
                                                                                                    </button>
                                                                                                    <div className="flex-1">
                                                                                                        <p className={`text-xs ${action.completed ? 'text-slate-550 line-through opacity-70' : 'text-slate-200'}`}>
                                                                                                            <strong className="text-[9px] uppercase font-bold text-slate-400 mr-1">{action.owner}:</strong>
                                                                                                            {action.text}
                                                                                                        </p>
                                                                                                    </div>
                                                                                                </li>
                                                                                            ))}
                                                                                        </ul>
                                                                                    </div>
                                                                                )}
                                                                                {m.summary && (
                                                                                    <div className="space-y-1">
                                                                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Anotações / Resumo</span>
                                                                                        <p className="text-xs text-slate-400 italic leading-relaxed bg-slate-955 p-3 rounded-xl border border-slate-955">"{m.summary}"</p>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        )}

                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}

                                                {Object.keys(groupedMeetings).length === 0 && (
                                                    <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
                                                        <MessageSquare size={32} className="text-slate-800 mx-auto mb-3" />
                                                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Histórico Limpo</p>
                                                        <p className="text-slate-600 text-[10px] mt-1">Este colaborador ainda não possui registros de 1:1 salvos.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                    </div>
                                )}

                                {/* SUB-TAB 2: PDI & EVOLUTION */}
                                {activeSubTab === 'pdi' && (
                                    <div className="space-y-6 animate-fade">
                                        
                                        {/* Competence Gaps Grid */}
                                        <div className="bg-slate-800 border border-slate-700 rounded-[2rem] p-6">
                                            <h4 className="font-black text-slate-200 text-sm uppercase tracking-wider flex items-center gap-2 mb-4">
                                                <Award size={16} className="text-blue-500" />
                                                Gaps de Competências Operacionais
                                            </h4>

                                            {selectedOperator && selectedOperator.skills && Object.keys(selectedOperator.skills).length > 0 ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {Object.entries(selectedOperator.skills || {}).map(([skillName, levels]: [string, any]) => {
                                                        const gap = levels.p - levels.r;
                                                        const hasGap = gap > 0;
                                                        
                                                        return (
                                                            <div key={skillName} className={`p-4 rounded-2xl border ${hasGap ? 'bg-rose-950/10 border-rose-900/20' : 'bg-slate-950 border-slate-900'} flex justify-between items-center`}>
                                                                <div className="min-w-0 pr-3">
                                                                    <p className="text-xs font-bold text-slate-250 truncate">{skillName}</p>
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

                                        {/* PDI Goals panel */}
                                        <div className="bg-slate-800 border border-slate-700 rounded-[2rem] p-6">
                                            <h4 className="font-black text-slate-200 text-sm uppercase tracking-wider flex items-center gap-2 mb-2">
                                                <Target size={16} className="text-blue-500" />
                                                Metas do Plano de Desenvolvimento Individual (PDI)
                                            </h4>
                                            <p className="text-[9px] font-bold text-slate-500 uppercase mb-4">Acompanhe e conclua objetivos profissionais em tempo real</p>

                                            {selectedOperatorPdi ? (
                                                <div className="space-y-4">
                                                    {/* Career Objective Banner */}
                                                    <div className="bg-slate-950 border border-slate-900 p-4 rounded-2xl">
                                                        <span className="text-[8px] font-black uppercase text-blue-400 tracking-wider">Objetivo de Carreira Principal</span>
                                                        <p className="text-sm font-bold text-slate-200 mt-1">{selectedOperatorPdi.careerObjective || 'Não cadastrado'}</p>
                                                    </div>

                                                    {/* Goal Checklist */}
                                                    <div className="space-y-2">
                                                        <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Submetas e Marcos</span>
                                                        
                                                        {selectedOperatorPdi.goals && selectedOperatorPdi.goals.length > 0 ? (
                                                            <div className="space-y-2">
                                                                {selectedOperatorPdi.goals.map(g => (
                                                                    <div key={g.id} className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-900 rounded-xl">
                                                                        <div className="flex-1 pr-4">
                                                                            <p className={`text-xs font-semibold ${g.completed ? 'text-slate-550 line-through opacity-70' : 'text-slate-250'}`}>{g.text}</p>
                                                                            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1 block">
                                                                                Prazo: {g.deadline || 'Não estipulado'}
                                                                            </span>
                                                                        </div>

                                                                        <button 
                                                                            onClick={() => handleTogglePdiGoal(g.id)}
                                                                            className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
                                                                                g.completed 
                                                                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.1)]' 
                                                                                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                                                                            }`}
                                                                            title={g.completed ? 'Reabrir Meta' : 'Concluir Meta'}
                                                                        >
                                                                            <Check size={16} />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : selectedOperatorPdi.mainGoals && selectedOperatorPdi.mainGoals.length > 0 ? (
                                                            <div className="space-y-4">
                                                                {selectedOperatorPdi.mainGoals.map(group => (
                                                                    <div key={group.id} className="bg-slate-950/40 p-4 border border-slate-900 rounded-2xl space-y-2">
                                                                        <h5 className="text-[10px] font-black uppercase text-slate-350">{group.title}</h5>
                                                                        <div className="space-y-2">
                                                                            {group.goals.map(g => (
                                                                                <div key={g.id} className="flex items-center justify-between p-3 bg-slate-950 border border-slate-900 rounded-xl">
                                                                                    <div className="flex-1 pr-4">
                                                                                        <p className={`text-xs font-semibold ${g.completed ? 'text-slate-550 line-through opacity-70' : 'text-slate-250'}`}>{g.text}</p>
                                                                                        <span className="text-[8px] font-bold text-slate-500 uppercase mt-1 block">Prazo: {g.deadline}</span>
                                                                                    </div>
                                                                                    <button 
                                                                                        onClick={() => handleTogglePdiGoal(g.id)}
                                                                                        className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${g.completed ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-slate-900 border-slate-800 text-slate-550'}`}
                                                                                    >
                                                                                        <Check size={14} />
                                                                                    </button>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs text-slate-500 italic text-center py-6">Nenhuma meta específica adicionada ao PDI deste colaborador.</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center py-8">
                                                    <p className="text-xs text-slate-500 italic">Não há um Plano de Desenvolvimento Individual (PDI) cadastrado para este colaborador.</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Occurrence log */}
                                        <div className="bg-slate-800 border border-slate-700 rounded-[2rem] p-6">
                                            <h4 className="font-black text-slate-200 text-sm uppercase tracking-wider flex items-center gap-2 mb-4">
                                                <AlertTriangle size={16} className="text-rose-500" />
                                                Ocorrências de Erros & Desvios Operacionais
                                            </h4>

                                            {selectedOperatorInvestigations.length > 0 ? (
                                                <div className="space-y-3">
                                                    {selectedOperatorInvestigations.map(inv => (
                                                        <div key={inv.id} className="p-4 bg-slate-950 border border-slate-900 rounded-2xl space-y-2">
                                                            <div className="flex justify-between items-start">
                                                                <span className="text-[8px] font-black bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2 py-0.5 rounded uppercase">
                                                                    Investigação Ativa
                                                                </span>
                                                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{inv.occurrence.date} às {inv.occurrence.time}</span>
                                                            </div>
                                                            <p className="text-xs font-semibold text-slate-350">{inv.occurrence.description}</p>
                                                            <div className="bg-slate-900/50 p-2.5 rounded-xl border border-slate-900 mt-2">
                                                                <span className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Ação Preventiva Definida</span>
                                                                <p className="text-[10px] text-slate-300 font-medium mt-0.5">{inv.actionPlan.action} (Prazo: {inv.actionPlan.deadline})</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="py-8 text-center bg-slate-950/20 border border-slate-900 rounded-2xl border-dashed">
                                                    <CheckSquare size={24} className="text-emerald-500/30 mx-auto mb-2" />
                                                    <p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Zero Desvios Operacionais</p>
                                                    <p className="text-[9px] text-slate-650 mt-0.5">Nenhuma ocorrência registrada sob responsabilidade deste colaborador.</p>
                                                </div>
                                            )}
                                        </div>

                                    </div>
                                )}

                                {/* SUB-TAB 3: DIAGNOSTIC & MENTORSHIP */}
                                {activeSubTab === 'analytics' && (
                                    <div className="space-y-6 animate-fade">
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Sentiment breakdown visual */}
                                            <div className="bg-slate-800 border border-slate-700 rounded-[2rem] p-6 flex flex-col justify-between h-[280px]">
                                                <div>
                                                    <h4 className="font-black text-slate-200 text-sm uppercase tracking-wider flex items-center gap-2 mb-1">
                                                        <Smile size={16} className="text-blue-500" />
                                                        Farol de Sentimento Histórico
                                                    </h4>
                                                    <p className="text-[8px] text-slate-500 uppercase font-bold mb-4">Proporção de percepção de 1:1s realizadas</p>
                                                </div>

                                                {/* Visual Sentiment Bars */}
                                                {(() => {
                                                    const empMeetings = meetings.filter(m => m.employee === selectedEmployee);
                                                    const total = empMeetings.length;
                                                    const otimo = empMeetings.filter(m => m.sentiment === '😃').length;
                                                    const neutro = empMeetings.filter(m => m.sentiment === '😐').length;
                                                    const preocupante = empMeetings.filter(m => m.sentiment === '🙁').length;
                                                    
                                                    const pctOtimo = total > 0 ? Math.round((otimo / total) * 100) : 0;
                                                    const pctNeutro = total > 0 ? Math.round((neutro / total) * 100) : 0;
                                                    const pctPreocupante = total > 0 ? Math.round((preocupante / total) * 100) : 0;

                                                    return (
                                                        <div className="space-y-3 flex-1 flex flex-col justify-center">
                                                            <div className="space-y-1">
                                                                <div className="flex justify-between text-[10px] font-bold">
                                                                    <span className="text-emerald-400 flex items-center gap-1"><Smile size={12} /> Ótimo</span>
                                                                    <span className="text-slate-400">{otimo} ({pctOtimo}%)</span>
                                                                </div>
                                                                <div className="w-full bg-slate-950 rounded-full h-2">
                                                                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${pctOtimo}%` }}></div>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <div className="flex justify-between text-[10px] font-bold">
                                                                    <span className="text-amber-400 flex items-center gap-1"><Meh size={12} /> Neutro</span>
                                                                    <span className="text-slate-400">{neutro} ({pctNeutro}%)</span>
                                                                </div>
                                                                <div className="w-full bg-slate-950 rounded-full h-2">
                                                                    <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${pctNeutro}%` }}></div>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <div className="flex justify-between text-[10px] font-bold">
                                                                    <span className="text-rose-400 flex items-center gap-1"><Frown size={12} /> Preocupante</span>
                                                                    <span className="text-slate-400">{preocupante} ({pctPreocupante}%)</span>
                                                                </div>
                                                                <div className="w-full bg-slate-950 rounded-full h-2">
                                                                    <div className="bg-rose-500 h-2 rounded-full" style={{ width: `${pctPreocupante}%` }}></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </div>

                                            {/* Action Plan Execution Circular Gauge */}
                                            <div className="bg-slate-800 border border-slate-700 rounded-[2rem] p-6 flex flex-col justify-between h-[280px]">
                                                <div>
                                                    <h4 className="font-black text-slate-200 text-sm uppercase tracking-wider flex items-center gap-2 mb-1">
                                                        <TrendingUp size={16} className="text-blue-500" />
                                                        Eficácia do Plano de Ação
                                                    </h4>
                                                    <p className="text-[8px] text-slate-500 uppercase font-bold mb-4">Porcentagem de tarefas de 1:1 já concluídas</p>
                                                </div>

                                                {(() => {
                                                    const empMeetings = meetings.filter(m => m.employee === selectedEmployee);
                                                    let totalActions = 0;
                                                    let completedActions = 0;
                                                    
                                                    empMeetings.forEach(m => {
                                                        if (m.actionItems) {
                                                            totalActions += m.actionItems.length;
                                                            completedActions += m.actionItems.filter(a => a.completed).length;
                                                        }
                                                    });

                                                    const rate = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

                                                    return (
                                                        <div className="flex flex-col items-center justify-center flex-1 space-y-2">
                                                            {/* SVG Progress Ring */}
                                                            <div className="relative w-24 h-24">
                                                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                                                    <path
                                                                        className="text-slate-950"
                                                                        strokeWidth="3.5"
                                                                        stroke="currentColor"
                                                                        fill="none"
                                                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                                    />
                                                                    <path
                                                                        className="text-blue-500 transition-all duration-500"
                                                                        strokeWidth="3.5"
                                                                        strokeDasharray={`${rate}, 100`}
                                                                        strokeLinecap="round"
                                                                        stroke="currentColor"
                                                                        fill="none"
                                                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                                    />
                                                                </svg>
                                                                <div className="absolute inset-0 flex items-center justify-center">
                                                                    <span className="text-lg font-black text-white">{rate}%</span>
                                                                </div>
                                                            </div>
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">
                                                                {completedActions} de {totalActions} concluídas
                                                            </p>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>

                                        {/* AI strategic leadership mentorship diagnostic */}
                                        <div className="bg-slate-800 border border-slate-700 rounded-[2rem] p-6 space-y-4">
                                            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                                                <div>
                                                    <h4 className="font-black text-slate-200 text-sm uppercase tracking-wider flex items-center gap-2">
                                                        <Sparkles size={16} className="text-blue-400" />
                                                        Espaço de Mentoria e Diagnóstico Tático IA
                                                    </h4>
                                                    <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">Cruze dados de performance e obtenha aconselhamento do Mentor do Sistema Líder</p>
                                                </div>

                                                <button
                                                    onClick={handleGenerateAiDiagnostic}
                                                    disabled={isGeneratingDiagnostic}
                                                    className="px-4 py-2 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all disabled:opacity-50"
                                                >
                                                    {isGeneratingDiagnostic ? <Loader2 size={12} className="animate-spin" /> : 'Gerar Diagnóstico'}
                                                </button>
                                            </div>

                                            {aiDiagnostic ? (
                                                <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap animate-fade font-medium">
                                                    {aiDiagnostic}
                                                </div>
                                            ) : (
                                                <div className="py-12 text-center bg-slate-950/20 border border-slate-900 border-dashed rounded-2xl">
                                                    <ShieldAlert size={28} className="text-slate-800 mx-auto mb-2" />
                                                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Aconselhamento Pendente</p>
                                                    <p className="text-slate-600 text-[10px] mt-0.5 max-w-sm mx-auto">Gere o relatório acima para obter uma leitura analítica sobre sentimentos, erros operacionais e gaps de skills de {selectedEmployee}.</p>
                                                </div>
                                            )}
                                        </div>

                                    </div>
                                )}

                            </div>

                        </div>
                    )}

                </div>

            </div>

        </div>
    );
};

export default OneOnOneView;
