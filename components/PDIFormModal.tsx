import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Target, Save, Plus, Trash2 } from 'lucide-react';
import { Goal, MainGoalGroup } from '../types';

interface PDIFormModalProps {
  isOpen: boolean;
  editingId: string | null;
  employees: string[];
  formData: {
    employee: string;
    careerObjective: string;
    goals: Goal[];
    fixedResponsibilities: string;
    mainGoals: MainGoalGroup[];
  };
  setFormData: any;
  onSave: (e: React.FormEvent) => void;
  onClose: () => void;
}

const PDIFormModal: React.FC<PDIFormModalProps> = ({
  isOpen, editingId, employees, formData, setFormData, onSave, onClose
}) => {
  const [newMainGoalTitle, setNewMainGoalTitle] = useState('');
  
  // States para gerenciar a adição de metas
  const [activeMainGoalId, setActiveMainGoalId] = useState<string | null>(null);
  const [newGoalInput, setNewGoalInput] = useState({ text: '', deadline: '', category: '70% (Prática/Experiência)' });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (!formData.mainGoals || formData.mainGoals.length === 0) {
        // Inicializa com um array vazio se não vier do server
        setFormData((prev: any) => ({ ...prev, mainGoals: [] }));
      }
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddMainGoal = () => {
    if (!newMainGoalTitle.trim()) return;
    const newMain: MainGoalGroup = {
      id: Date.now().toString(),
      title: newMainGoalTitle,
      goals: []
    };
    setFormData({ ...formData, mainGoals: [...(formData.mainGoals || []), newMain] });
    setNewMainGoalTitle('');
  };

  const handeRemoveMainGoal = (mgId: string) => {
    if (window.confirm("Remover esta meta principal e todas as suas submetas?")) {
      setFormData({ ...formData, mainGoals: formData.mainGoals.filter(mg => mg.id !== mgId) });
    }
  };

  const handleAddSubGoal = (mainGoalId: string) => {
    if (!newGoalInput.text || !newGoalInput.deadline) return;
    
    const newSubGoal: Goal = {
      id: Math.random().toString(36).substr(2, 9),
      text: newGoalInput.text,
      deadline: newGoalInput.deadline,
      category: newGoalInput.category,
      completed: false
    };

    const updatedMainGoals = formData.mainGoals.map(mg => {
      if (mg.id === mainGoalId) return { ...mg, goals: [...mg.goals, newSubGoal] };
      return mg;
    });

    setFormData({ ...formData, mainGoals: updatedMainGoals });
    setNewGoalInput({ text: '', deadline: '', category: '70% (Prática/Experiência)' });
    setActiveMainGoalId(null);
  };

  const handleRemoveSubGoal = (mainGoalId: string, goalId: string) => {
    const updatedMainGoals = formData.mainGoals.map(mg => {
      if (mg.id === mainGoalId) return { ...mg, goals: mg.goals.filter(g => g.id !== goalId) };
      return mg;
    });
    setFormData({ ...formData, mainGoals: updatedMainGoals });
  };

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 md:p-8">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-fade" onClick={onClose} />

      <form onSubmit={onSave} className="relative bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl flex flex-col max-h-[95vh] animate-scale-up overflow-hidden">
        <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><Target size={24} /></div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">{editingId ? 'Editar Plano' : 'Novo PDI'}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Construtor de Metas de Carreira</p>
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
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Responsabilidades Fixas (Opcional)</label>
              <input placeholder="Atribuições diárias do cargo..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-medium focus:ring-4 focus:ring-blue-100 transition-all" value={formData.fixedResponsibilities || ''} onChange={e => setFormData({ ...formData, fixedResponsibilities: e.target.value })} />
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                   Múltiplas Metas Principais
                </h4>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest leading-relaxed">Crie painéis de metas grandes (ex: Bater a cota, Virar Supervisor) e divida-os em submetas na sequência abaixo.</p>
            </div>

            <div className="flex gap-2">
              <input 
                 placeholder="Ex: Aprender a operar a Máquina 3..." 
                 className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-700 focus:ring-4 focus:ring-blue-100 transition-all" 
                 value={newMainGoalTitle} 
                 onChange={e => setNewMainGoalTitle(e.target.value)}
                 onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); handleAddMainGoal(); } }}
              />
              <button type="button" onClick={handleAddMainGoal} className="px-6 bg-blue-100 text-blue-700 font-black rounded-2xl hover:bg-blue-200 transition-all text-xs uppercase shadow-sm">
                + Adicionar Meta Principal
              </button>
            </div>

            <div className="space-y-6 mt-6">
              {formData.mainGoals?.map((mg, index) => (
                <div key={mg.id} className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
                   <div className="flex justify-between items-start mb-4">
                      <h5 className="text-sm font-black text-slate-800 uppercase flex items-center gap-2">
                          <Target size={16} className="text-blue-500" /> Meta {index + 1}: {mg.title}
                      </h5>
                      <button type="button" onClick={() => handeRemoveMainGoal(mg.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={16} /></button>
                   </div>

                   {/* Subgoals List */}
                   {mg.goals.length > 0 && (
                      <ul className="mb-4 space-y-2">
                          {mg.goals.map(g => (
                              <li key={g.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 group">
                                  <div className="flex items-center gap-3">
                                      <span className="text-[9px] font-black uppercase text-slate-500 bg-white border px-1.5 py-0.5 rounded shadow-sm">{g.deadline}</span>
                                      <span className="text-sm font-bold text-slate-700">{g.text}</span>
                                      <span className="text-[8px] uppercase font-black text-slate-400 ml-2">{g.category?.split(' ')[0]}</span>
                                  </div>
                                  <button type="button" onClick={() => handleRemoveSubGoal(mg.id, g.id)} className="text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                                      <X size={16} />
                                  </button>
                              </li>
                          ))}
                      </ul>
                   )}

                   {/* Form to add new Subgoal under this specific Main Goal */}
                   {activeMainGoalId === mg.id ? (
                      <div className="flex flex-col lg:flex-row gap-2 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                         <input autoFocus placeholder="Passo prático..." className="flex-1 p-3 bg-white border border-slate-200 rounded-xl outline-none text-xs font-bold" value={newGoalInput.text} onChange={e => setNewGoalInput({...newGoalInput, text: e.target.value})} />
                         <select className="p-3 bg-white border border-slate-200 rounded-xl outline-none text-[10px] font-black uppercase text-slate-600" value={newGoalInput.category} onChange={e => setNewGoalInput({...newGoalInput, category: e.target.value})}>
                            <option value="70% (Prática/Experiência)">70% Experiência</option>
                            <option value="20% (Mentoria/Exposição)">20% Mentoria</option>
                            <option value="10% (Cursos/Educação)">10% Educação</option>
                         </select>
                         <input type="date" className="p-3 bg-white border border-slate-200 rounded-xl outline-none text-[10px] font-black uppercase text-slate-600" value={newGoalInput.deadline} onChange={e => setNewGoalInput({...newGoalInput, deadline: e.target.value})} />
                         <div className="flex gap-2">
                             <button type="button" onClick={() => setActiveMainGoalId(null)} className="p-3 bg-white border rounded-xl text-slate-400 hover:text-red-500"><X size={16} /></button>
                             <button type="button" onClick={() => handleAddSubGoal(mg.id)} className="px-6 py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 tracking-widest uppercase text-[10px] shadow-sm">Salvar</button>
                         </div>
                      </div>
                   ) : (
                      <button type="button" onClick={() => setActiveMainGoalId(mg.id)} className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1 hover:text-blue-500 transition-colors">
                          <Plus size={14} /> Adicionar Nova Submeta
                      </button>
                   )}
                </div>
              ))}
            </div>
            {(!formData.mainGoals || formData.mainGoals.length === 0) && (
                <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50 italic text-slate-400 text-xs">
                    Nenhuma meta principal cadastrada. Tente adicionar uma acima.
                </div>
            )}
          </div>
        </div>

        <div className="p-8 border-t bg-slate-50/50 flex gap-4">
          <button type="submit" className="flex-1 py-5 bg-emerald-500 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2">
            <Save size={18} /> Salvar Plano Definitivo
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
