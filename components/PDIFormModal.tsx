
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Target, Save, Plus } from 'lucide-react';
import { Goal } from '../types';

interface PDIFormModalProps {
  isOpen: boolean;
  editingId: string | null;
  employees: string[];
  formData: {
    employee: string;
    careerObjective: string;
    goals: Goal[];
    fixedResponsibilities: string;
  };
  setFormData: any;
  newGoal: { text: string; deadline: string; category?: string };
  setNewGoal: any;
  editingGoalId: string | null;
  setEditingGoalId: any;
  onAddGoal: () => void;
  onSave: (e: React.FormEvent) => void;
  onClose: () => void;
}

const PDIFormModal: React.FC<PDIFormModalProps> = ({
  isOpen, editingId, employees, formData, setFormData, newGoal, setNewGoal, editingGoalId, setEditingGoalId, onAddGoal, onSave, onClose
}) => {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 md:p-8">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-fade"
        onClick={onClose}
      />

      {/* Container do Modal */}
      <form
        onSubmit={onSave}
        className="relative bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl flex flex-col max-h-[95vh] animate-scale-up overflow-hidden"
      >
        <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
              <Target size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">
                {editingId ? 'Editar Plano' : 'Novo PDI'}
              </h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Configuração de Desenvolvimento</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-3 bg-white border rounded-2xl text-slate-300 hover:text-red-500 transition-all"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-10 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Colaborador</label>
              <select required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-700 focus:ring-4 focus:ring-blue-100 transition-all" value={formData.employee} onChange={e => setFormData({ ...formData, employee: e.target.value })}>
                <option value="">Selecionar...</option>
                {employees.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Objetivo de Carreira</label>
              <input required placeholder="Ex: Supervisor" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold focus:ring-4 focus:ring-blue-100 transition-all" value={formData.careerObjective} onChange={e => setFormData({ ...formData, careerObjective: e.target.value })} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Responsabilidades Fixas</label>
            <textarea rows={3} placeholder="Descreva as atribuições diárias..." className="w-full p-6 bg-slate-50 border border-slate-200 rounded-[2rem] outline-none font-medium focus:ring-4 focus:ring-blue-100 transition-all" value={formData.fixedResponsibilities} onChange={e => setFormData({ ...formData, fixedResponsibilities: e.target.value })} />
          </div>

          <div className="bg-blue-50/30 p-8 rounded-[2.5rem] border border-blue-100 space-y-8">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                <Target size={18} /> Adicionar Milestones
              </label>
              <span className="text-[10px] font-black text-blue-400 uppercase">{formData.goals.length} Meta(s)</span>
            </div>

            <div className="flex flex-col lg:flex-row gap-4">
              <input placeholder="Descrição da meta..." className="flex-1 p-4 bg-white border border-blue-100 rounded-xl outline-none font-bold" value={newGoal.text} onChange={e => setNewGoal({ ...newGoal, text: e.target.value })} />
              <select className="lg:w-48 p-4 bg-white border border-blue-100 rounded-xl outline-none font-bold text-sm text-slate-700" value={newGoal.category || '70% (Prática/Experiência)'} onChange={e => setNewGoal({ ...newGoal, category: e.target.value })}>
                <option value="70% (Prática/Experiência)">70% (Experiência)</option>
                <option value="20% (Mentoria/Exposição)">20% (Exposição)</option>
                <option value="10% (Cursos/Educação)">10% (Educação)</option>
              </select>
              <input type="date" className="lg:w-48 p-4 bg-white border border-blue-100 rounded-xl outline-none font-bold" value={newGoal.deadline} onChange={e => setNewGoal({ ...newGoal, deadline: e.target.value })} />
              <button type="button" onClick={onAddGoal} className="bg-slate-900 text-white px-8 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-600 shadow-lg transition-all">
                {editingGoalId ? 'Atualizar' : 'Adicionar'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {formData.goals.map((g) => (
                <div key={g.id} className={`flex items-center justify-between p-4 bg-white border rounded-2xl shadow-sm transition-all ${editingGoalId === g.id ? 'border-blue-400 ring-2 ring-blue-100' : 'border-blue-100'}`}>
                  <div className="truncate flex-1 pr-4">
                    <p className="text-xs font-black text-slate-800 truncate">{g.text}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {g.category && (
                        <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 border border-slate-200">
                          {g.category.split(' ')[0]} {/* 70%, 20%, 10% */}
                        </span>
                      )}
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{g.deadline}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button type="button" onClick={() => {
                      setNewGoal({ text: g.text, deadline: g.deadline, category: g.category || '70% (Prática/Experiência)' });
                      setEditingGoalId(g.id);
                    }} className="text-slate-300 hover:text-blue-500 p-2 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
                    </button>
                    <button type="button" onClick={() => {
                      if (editingGoalId === g.id) {
                        setNewGoal({ text: '', deadline: '', category: '70% (Prática/Experiência)' });
                        setEditingGoalId(null);
                      }
                      setFormData({ ...formData, goals: formData.goals.filter(goal => goal.id !== g.id) });
                    }} className="text-slate-300 hover:text-red-400 p-2 transition-colors"><Plus className="rotate-45" size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-8 border-t bg-slate-50/50 flex gap-4">
          <button type="submit" className="flex-1 py-5 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
            <Save size={18} /> Salvar Plano
          </button>
          <button type="button" onClick={onClose} className="px-10 py-5 bg-white border border-slate-200 text-slate-400 rounded-[2rem] font-black uppercase text-xs tracking-widest hover:bg-slate-50 transition-all">Cancelar</button>
        </div>
      </form>

      <style>{`
        @keyframes scaleUp { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-scale-up { animation: scaleUp 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
      `}</style>
    </div>,
    document.body
  );
};

export default PDIFormModal;
