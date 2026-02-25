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

    const pendingItems = items.filter(item => item.status === 'pending')
        .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

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
                <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between sticky top-0">
                    <h3 className="text-slate-300 font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        Pendências Ativas ({pendingItems.length})
                    </h3>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                    {pendingItems.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60">
                            <CheckCircle2 size={48} className="mb-4 text-emerald-500 border-4 border-emerald-500/20 rounded-full" />
                            <p className="font-bold uppercase tracking-widest text-sm">Tudo Limpo!</p>
                            <p className="text-xs mt-2">Você não está aguardando retorno de ninguém no momento.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {pendingItems.map((item) => {
                                const overdue = isOverdue(item.deadline);
                                return (
                                    <div key={item.id} className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border transition-all hover:shadow-lg ${overdue ? 'bg-rose-950/20 border-rose-900/50 hover:border-rose-700' : 'bg-slate-800/50 border-slate-700 hover:border-blue-500/50'}`}>

                                        <div className="flex-1 mb-4 md:mb-0">
                                            <h4 className="text-white font-bold text-base mb-1">{item.task}</h4>
                                            <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
                                                <span className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800"><User size={12} className="text-blue-400" /> {item.responsible}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Status</span>
                                                {overdue ? (
                                                    <span className="px-3 py-1 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-lg text-xs font-black uppercase tracking-wider animate-pulse flex items-center gap-1.5">
                                                        <Clock size={12} /> Atrasado ({item.deadline.split('-').reverse().join('/')})
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-slate-900 text-slate-300 border border-slate-700 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                                                        <Clock size={12} className="text-emerald-500" /> No Prazo ({item.deadline.split('-').reverse().join('/')})
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2 pl-4 border-l border-slate-700/50">
                                                <button
                                                    onClick={() => handleMarkComplete(item.id)}
                                                    className="w-10 h-10 bg-slate-800 hover:bg-emerald-500/20 border-2 border-slate-700 hover:border-emerald-500 text-slate-400 hover:text-emerald-400 rounded-xl flex items-center justify-center transition-all"
                                                    title="Marcar como recebido/concluído"
                                                >
                                                    <CheckCircle2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="w-10 h-10 bg-slate-800 hover:bg-rose-500/10 border-2 border-transparent text-slate-500 hover:text-rose-400 rounded-xl flex items-center justify-center transition-all"
                                                    title="Excluir"
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
