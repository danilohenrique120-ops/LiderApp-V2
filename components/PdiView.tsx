
import React, { useState } from 'react';
import { Target, Pencil, Trash2, Check, ListChecks, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { PDI, Goal } from '../types';

interface PdiViewProps {
    pdis: PDI[];
    employees: string[];
    user: any;
    db: any;
}

const PdiView: React.FC<PdiViewProps> = ({ pdis, employees, user, db }) => {
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [minimizedCards, setMinimizedCards] = useState<Record<string, boolean>>({});
    const [formData, setFormData] = useState({ 
        employee: '', careerObjective: '', goals: [] as Goal[], generalComments: '' 
    });
    const [newGoal, setNewGoal] = useState({ text: '', deadline: '' });

    const toggleMinimize = (id: string) => {
        setMinimizedCards(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

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

    const handleEdit = (pdi: PDI) => {
        setFormData({
            employee: pdi.employee,
            careerObjective: pdi.careerObjective,
            goals: pdi.goals || [],
            generalComments: pdi.generalComments || ''
        });
        setEditingId(pdi.id);
        setShowForm(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.goals.length === 0) { alert('Adicione ao menos uma meta.'); return; }
        
        const data = { ...formData, uid: user.uid, status: 'Em Curso' };
        if (editingId) {
            await db.collection('pdis').doc(editingId).update(data);
        } else {
            await db.collection('pdis').add({ ...data, createdAt: new Date() });
        }
        
        setFormData({ employee: '', careerObjective: '', goals: [], generalComments: '' });
        setEditingId(null);
        setShowForm(false);
    };

    const addGoal = () => {
        if (!newGoal.text || !newGoal.deadline) return;
        setFormData({ ...formData, goals: [...formData.goals, { ...newGoal, completed: false, id: Date.now().toString() }] });
        setNewGoal({ text: '', deadline: '' });
    };

    const toggleGoalStatus = async (pdiId: string, goalId: string) => {
        const pdi = pdis.find(p => p.id === pdiId);
        if (!pdi) return;
        const updatedGoals = pdi.goals.map(g => g.id === goalId ? { ...g, completed: !g.completed } : g);
        await db.collection('pdis').doc(pdiId).update({ goals: updatedGoals });
    };

    return (
        <div className="animate-fade">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Planos PDI</h2>
                    <p className="text-slate-500 font-medium">Gestão individual de desenvolvimento e metas.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => exportToPDF('pdi-list-content', 'PDI-Relatorio-Geral')} className="bg-slate-200 text-slate-700 hover:bg-slate-300 px-6 py-4 rounded-2xl flex items-center gap-2 font-bold text-xs uppercase transition-colors">
                        <Download size={16} /> PDF Geral
                    </button>
                    <button 
                        onClick={() => { setShowForm(!showForm); setEditingId(null); setFormData({ employee: '', careerObjective: '', goals: [], generalComments: '' }); }} 
                        className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs shadow-lg shadow-blue-100 transition-all hover:scale-105"
                    >
                        {showForm ? 'Fechar Cadastro' : 'Novo PDI'}
                    </button>
                </div>
            </header>

            {showForm && (
                <form onSubmit={handleSave} className="bg-white p-8 rounded-[2.5rem] border shadow-2xl mb-12 space-y-6 animate-fade">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Colaborador</label>
                            <select required className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-bold text-slate-700" value={formData.employee} onChange={e => setFormData({...formData, employee: e.target.value})}>
                                <option value="">Selecionar...</option>
                                {employees.map(e => <option key={e} value={e}>{e}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Objetivo de Carreira</label>
                            <input required placeholder="Ex: Tornar-se Supervisor" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-medium" value={formData.careerObjective} onChange={e => setFormData({...formData, careerObjective: e.target.value})} />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Metas</label>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <input placeholder="Meta..." className="flex-1 p-4 bg-slate-50 border rounded-2xl outline-none" value={newGoal.text} onChange={e => setNewGoal({...newGoal, text: e.target.value})} />
                            <input type="date" className="sm:w-48 p-4 bg-slate-50 border rounded-2xl outline-none" value={newGoal.deadline} onChange={e => setNewGoal({...newGoal, deadline: e.target.value})} />
                            <button type="button" onClick={addGoal} className="bg-slate-900 text-white px-6 rounded-2xl font-black uppercase text-[10px]">Add</button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {formData.goals.map((g) => (
                                <div key={g.id} className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                                    <span className="text-xs font-black text-blue-900">{g.text} ({g.deadline})</span>
                                    <button type="button" onClick={() => setFormData({...formData, goals: formData.goals.filter(goal => goal.id !== g.id)})} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <textarea rows={3} placeholder="Comentários..." className="w-full p-4 bg-slate-50 border rounded-2xl outline-none" value={formData.generalComments} onChange={e => setFormData({...formData, generalComments: e.target.value})} />
                    <button className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl">Salvar PDI</button>
                </form>
            )}

            <div id="pdi-list-content" className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {pdis.map(p => {
                    const isMinimized = minimizedCards[p.id] || false;
                    const completed = p.goals.filter(g => g.completed).length;
                    const progress = p.goals.length > 0 ? Math.round((completed / p.goals.length) * 100) : 0;
                    
                    return (
                        <div key={p.id} id={`pdi-card-${p.id}`} className={`bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all flex flex-col h-full ${isMinimized ? 'pb-6' : ''}`}>
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg">{p.employee.charAt(0)}</div>
                                    <div>
                                        <h4 className="text-xl font-black text-slate-800">{p.employee}</h4>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{p.status}</span>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => toggleMinimize(p.id)} className="text-slate-300 hover:text-blue-500 p-2 transition-colors" title={isMinimized ? "Expandir" : "Minimizar"}>
                                        {isMinimized ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                                    </button>
                                    <button onClick={() => exportToPDF(`pdi-card-${p.id}`, `PDI-${p.employee}`)} className="text-slate-300 hover:text-emerald-500 p-2 transition-colors" title="Baixar PDF Individual">
                                        <Download size={18} />
                                    </button>
                                    <button onClick={() => handleEdit(p)} className="text-slate-300 hover:text-blue-500 p-2" title="Editar PDI">
                                        <Pencil size={18} />
                                    </button>
                                    <button onClick={() => db.collection('pdis').doc(p.id).delete()} className="text-slate-200 hover:text-red-500 p-2" title="Excluir PDI">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            {!isMinimized && (
                                <div className="animate-fade flex flex-col h-full">
                                    <div className="flex-1 space-y-4 mb-6">
                                        <p className="text-sm font-bold text-slate-700 italic border-l-4 border-blue-500 pl-4">"{p.careerObjective}"</p>
                                        
                                        {p.generalComments && (
                                            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-2xl shadow-sm relative overflow-hidden">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-yellow-400"></div>
                                                <p className="text-[10px] font-black uppercase text-yellow-600 mb-2 tracking-widest">Observações:</p>
                                                <p className="text-xs font-medium text-yellow-900 leading-relaxed italic">
                                                    {p.generalComments}
                                                </p>
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            {p.goals.map(g => (
                                                <div key={g.id} className={`flex items-center gap-3 p-3 rounded-xl border ${g.completed ? 'bg-emerald-50 border-emerald-100' : 'bg-white'}`}>
                                                    <button onClick={() => toggleGoalStatus(p.id, g.id)} className={`w-5 h-5 rounded border-2 flex items-center justify-center ${g.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200'}`}><Check size={12}/></button>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-[11px] font-bold ${g.completed ? 'text-emerald-700 line-through' : 'text-slate-700'}`}>{g.text}</p>
                                                        <p className="text-[8px] font-black text-slate-400 uppercase">{g.deadline}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="mt-auto pt-4 border-t border-slate-50">
                                        <div className="flex justify-between items-end mb-2"><span className="text-[10px] font-black text-slate-500 uppercase">Progresso</span><span className="text-xl font-black text-blue-600">{progress}%</span></div>
                                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-blue-600 transition-all duration-700" style={{width: `${progress}%`}}></div></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
                {pdis.length === 0 && <div className="lg:col-span-2 text-center py-20 text-slate-300 font-bold uppercase tracking-widest text-xs italic">Nenhum PDI registrado</div>}
            </div>
        </div>
    );
};

export default PdiView;
