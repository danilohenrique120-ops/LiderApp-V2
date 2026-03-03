import React, { useState } from 'react';
import { Clock, Plus, CheckCircle2, User, Calendar, Trash2 } from 'lucide-react';
import { FollowUpItem } from '../types';
import firebase from '../services/firebase';

interface FollowUpViewProps {
    items: FollowUpItem[];
    user: firebase.User | null;
    db: firebase.firestore.Firestore;
}

const FollowUpView: React.FC<FollowUpViewProps> = ({ items, user, db }) => {
    const [newTask, setNewTask] = useState('');
    const [newResponsible, setNewResponsible] = useState('');
    const [newDeadline, setNewDeadline] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // New states for toggles and inline editing
    const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editingDate, setEditingDate] = useState<string>('');

    const pendingItems = items.filter(item => item.status === 'pending')
        .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

    const completedItems = items.filter(item => item.status === 'completed')
        .sort((a, b) => new Date(b.createdAt?.toMillis() || 0).getTime() - new Date(a.createdAt?.toMillis() || 0).getTime());

    const displayedItems = activeTab === 'pending' ? pendingItems : completedItems;

    const isOverdue = (deadline: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const deadlineDate = new Date(deadline);
        deadlineDate.setHours(0, 0, 0, 0);
        return deadlineDate < today;
    };

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newTask.trim() || !newResponsible.trim() || !newDeadline) return;

        setIsSubmitting(true);
        try {
            await db.collection('follow_up_items').add({
                task: newTask.trim(),
                responsible: newResponsible.trim(),
                deadline: newDeadline,
                status: 'pending',
                uid: user.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            setNewTask('');
            setNewResponsible('');
            setNewDeadline('');
        } catch (error) {
            console.error("Erro ao adicionar item de follow-up:", error);
            alert("Erro ao adicionar o item. Tente novamente.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleMarkComplete = async (id: string) => {
        try {
            await db.collection('follow_up_items').doc(id).update({
                status: 'completed'
            });
        } catch (error) {
            console.error("Erro ao concluir item:", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Deseja realmente excluir este item?")) {
            try {
                await db.collection('follow_up_items').doc(id).delete();
            } catch (error) {
                console.error("Erro ao excluir item:", error);
            }
        }
    };

    const handleUpdateDeadline = async (id: string) => {
        if (!editingDate) return;
        try {
            await db.collection('follow_up_items').doc(id).update({
                deadline: editingDate
            });
            setEditingItemId(null);
            setEditingDate('');
        } catch (error) {
            console.error("Erro ao atualizar data:", error);
            alert("Erro ao atualizar a data.");
        }
    };

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col">
            <header className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tighter uppercase flex items-center gap-3">
                        <Clock className="text-blue-500" />
                        Follow-up (Aguardando)
                    </h2>
                    <p className="text-slate-400 text-sm font-medium mt-1">Controle de pendências, delegações e retornos esperados de terceiros.</p>
                </div>
            </header>

            {/* Formulário de Adição Rápida */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8 shadow-xl">
                <form onSubmit={handleAddItem} className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">O que estou esperando?</label>
                        <input
                            type="text"
                            value={newTask}
                            onChange={e => setNewTask(e.target.value)}
                            className="w-full !bg-slate-800 !text-white border-2 border-slate-700/50 rounded-xl px-4 py-3 !placeholder-slate-500 focus:border-blue-500 outline-none transition-all font-medium text-sm"
                            placeholder="Ex: Aprovação de orçamento, Peça de manutenção..."
                            required
                        />
                    </div>
                    <div className="w-full md:w-64">
                        <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 flex items-center gap-1"><User size={12} /> Com quem está?</label>
                        <input
                            type="text"
                            value={newResponsible}
                            onChange={e => setNewResponsible(e.target.value)}
                            className="w-full !bg-slate-800 !text-white border-2 border-slate-700/50 rounded-xl px-4 py-3 !placeholder-slate-500 focus:border-blue-500 outline-none transition-all font-medium text-sm"
                            placeholder="Ex: João (Manutenção)"
                            required
                        />
                    </div>
                    <div className="w-full md:w-48">
                        <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 flex items-center gap-1"><Calendar size={12} /> Data Combinada</label>
                        <input
                            type="date"
                            value={newDeadline}
                            onChange={e => setNewDeadline(e.target.value)}
                            className="w-full !bg-slate-800 !text-white border-2 border-slate-700/50 rounded-xl px-4 py-3 !placeholder-slate-500 focus:border-blue-500 outline-none transition-all font-bold text-sm"
                            style={{ colorScheme: 'dark' }}
                            required
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full md:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
                        >
                            <Plus size={16} /> Adicionar
                        </button>
                    </div>
                </form>
            </div>

            {/* Tabela/Lista Limpa */}
            <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-xl">
                <div className="p-4 border-b border-slate-800 bg-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-10">
                    <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-800">
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'pending'
                                    ? 'bg-slate-800 text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            <span className={`w-2 h-2 rounded-full ${activeTab === 'pending' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-slate-700'}`}></span>
                            Pendentes ({pendingItems.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('completed')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'completed'
                                    ? 'bg-slate-800 text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            <span className={`w-2 h-2 rounded-full ${activeTab === 'completed' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-700'}`}></span>
                            Concluídas ({completedItems.length})
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                    {displayedItems.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60">
                            {activeTab === 'pending' ? (
                                <>
                                    <CheckCircle2 size={48} className="mb-4 text-emerald-500 border-4 border-emerald-500/20 rounded-full" />
                                    <p className="font-bold uppercase tracking-widest text-sm">Tudo Limpo!</p>
                                    <p className="text-xs mt-2">Você não está aguardando retorno de ninguém no momento.</p>
                                </>
                            ) : (
                                <>
                                    <Clock size={48} className="mb-4 text-slate-400" />
                                    <p className="font-bold uppercase tracking-widest text-sm">Nenhum Histórico</p>
                                    <p className="text-xs mt-2">Nenhum follow-up foi concluído ainda.</p>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {displayedItems.map((item) => {
                                const isCompleted = item.status === 'completed';
                                const overdue = !isCompleted && isOverdue(item.deadline);
                                const isEditing = editingItemId === item.id;

                                return (
                                    <div key={item.id} className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border transition-all hover:shadow-lg 
                                        ${isCompleted ? 'bg-emerald-950/10 border-emerald-900/30 opacity-70' :
                                            overdue ? 'bg-rose-950/20 border-rose-900/50 hover:border-rose-700' : 'bg-slate-800/50 border-slate-700 hover:border-blue-500/50'}`}>

                                        <div className="flex-1 mb-4 md:mb-0">
                                            <h4 className={`font-bold text-base mb-1 ${isCompleted ? 'text-slate-400 line-through' : 'text-white'}`}>{item.task}</h4>
                                            <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
                                                <span className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
                                                    <User size={12} className={isCompleted ? "text-slate-500" : "text-blue-400"} />
                                                    {item.responsible}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Prazo / Status</span>

                                                {isEditing ? (
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="date"
                                                            value={editingDate}
                                                            onChange={(e) => setEditingDate(e.target.value)}
                                                            className="bg-slate-900 border border-blue-500 text-white rounded p-1 text-xs outline-none"
                                                            style={{ colorScheme: 'dark' }}
                                                        />
                                                        <button
                                                            onClick={() => handleUpdateDeadline(item.id)}
                                                            className="text-xs font-bold uppercase bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-500"
                                                        >
                                                            Salvar
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingItemId(null)}
                                                            className="text-xs font-bold uppercase bg-slate-700 text-white px-2 py-1 rounded hover:bg-slate-600"
                                                        >
                                                            X
                                                        </button>
                                                    </div>
                                                ) : isCompleted ? (
                                                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                                                        <CheckCircle2 size={12} /> Concluído
                                                    </span>
                                                ) : overdue ? (
                                                    <span
                                                        onClick={() => { setEditingItemId(item.id); setEditingDate(item.deadline); }}
                                                        className="px-3 py-1 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-lg text-xs font-black uppercase tracking-wider animate-pulse flex items-center gap-1.5 cursor-pointer hover:bg-rose-500/20 transition-colors"
                                                        title="Clique para alterar a data"
                                                    >
                                                        <Clock size={12} /> Atrasado ({item.deadline.split('-').reverse().join('/')})
                                                    </span>
                                                ) : (
                                                    <span
                                                        onClick={() => { setEditingItemId(item.id); setEditingDate(item.deadline); }}
                                                        className="px-3 py-1 bg-slate-900 text-slate-300 border border-slate-700 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer hover:bg-slate-800 transition-colors"
                                                        title="Clique para alterar a data"
                                                    >
                                                        <Clock size={12} className="text-emerald-500" /> No Prazo ({item.deadline.split('-').reverse().join('/')})
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2 pl-4 border-l border-slate-700/50">
                                                {!isCompleted && (
                                                    <button
                                                        onClick={() => handleMarkComplete(item.id)}
                                                        className="w-10 h-10 bg-slate-800 hover:bg-emerald-500/20 border-2 border-slate-700 hover:border-emerald-500 text-slate-400 hover:text-emerald-400 rounded-xl flex items-center justify-center transition-all"
                                                        title="Marcar como recebido/concluído"
                                                    >
                                                        <CheckCircle2 size={18} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="w-10 h-10 bg-slate-800 hover:bg-rose-500/10 border-2 border-transparent text-slate-500 hover:text-rose-400 rounded-xl flex items-center justify-center transition-all"
                                                    title="Excluir Definitivamente"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>

                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FollowUpView;
