
import React, { useState } from 'react';
import { MessageSquare, Trash2, Calendar, Download } from 'lucide-react';
import { Meeting } from '../types';

interface OneOnOneViewProps {
    meetings: Meeting[];
    employees: string[];
    user: any;
    db: any;
}

const OneOnOneView: React.FC<OneOnOneViewProps> = ({ meetings, employees, user, db }) => {
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ employee: '', date: '', summary: '' });

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

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.employee || !formData.date || !formData.summary) return;
        await db.collection('meetings').add({
            ...formData,
            uid: user.uid,
            createdAt: new Date()
        });
        setFormData({ employee: '', date: '', summary: '' });
        setShowForm(false);
    };

    return (
        <div className="animate-fade">
            <header className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Feedbacks 1:1</h2>
                <div className="flex gap-2">
                    <button onClick={() => exportToPDF('meetings-list-content', 'Feedbacks-1-1-Geral')} className="bg-slate-200 text-slate-700 hover:bg-slate-300 px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-xs uppercase transition-colors">
                        <Download size={16} /> PDF Geral
                    </button>
                    <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs shadow-lg">Nova Reunião</button>
                </div>
            </header>

            {showForm && (
                <form onSubmit={save} className="bg-white p-8 rounded-[2rem] shadow-xl mb-10 space-y-4 animate-fade">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <select required className="p-4 border rounded-2xl bg-slate-50 font-bold" value={formData.employee} onChange={e => setFormData({...formData, employee: e.target.value})}>
                            <option value="">Colaborador...</option>
                            {employees.map(e => <option key={e} value={e}>{e}</option>)}
                        </select>
                        <input type="date" required className="p-4 border rounded-2xl bg-slate-50 font-medium" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                    </div>
                    <textarea required rows={4} className="w-full p-4 border rounded-2xl bg-slate-50" placeholder="Resumo do feedback e acordos..." value={formData.summary} onChange={e => setFormData({...formData, summary: e.target.value})} />
                    <button className="bg-slate-900 text-white w-full py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg">Salvar Feedback</button>
                </form>
            )}

            <div id="meetings-list-content" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {meetings.map(m => (
                    <div key={m.id} id={`meeting-card-${m.id}`} className="bg-white p-6 border rounded-[2rem] shadow-sm flex flex-col justify-between group hover:shadow-md transition-all animate-fade">
                        <div className="mb-4">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-black text-slate-800 text-lg">{m.employee}</h4>
                                <div className="flex gap-1">
                                    <button onClick={() => exportToPDF(`meeting-card-${m.id}`, `Feedback-${m.employee}-${m.date}`)} className="text-slate-200 hover:text-emerald-500 p-1 transition-colors" title="Baixar PDF Individual">
                                        <Download size={16} />
                                    </button>
                                    <button onClick={() => db.collection('meetings').doc(m.id).delete()} className="text-slate-200 hover:text-red-500 p-1 transition-colors" title="Excluir Feedback">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <p className="text-sm text-slate-500 italic leading-relaxed">"{m.summary}"</p>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-300 font-bold uppercase tracking-widest border-t pt-4">
                            <Calendar size={12} /> {m.date}
                        </div>
                    </div>
                ))}
                {meetings.length === 0 && <div className="md:col-span-3 text-center py-20 text-slate-300 font-bold uppercase tracking-widest text-xs italic">Nenhum feedback registrado ainda</div>}
            </div>
        </div>
    );
};

export default OneOnOneView;
