
import React, { useState } from 'react';
import { Trash2, PlusCircle, UserCheck, ChevronRight } from 'lucide-react';
import { Operator, SkillConfig } from '../types';
import { PREREQUISITE_RULES } from '../constants';

interface OperatorRegistrationViewProps {
    matrixData: Operator[];
    skills: SkillConfig[];
    user: any;
    db: any;
}

const OperatorRegistrationView: React.FC<OperatorRegistrationViewProps> = ({ matrixData, skills, user, db }) => {
    const [formData, setFormData] = useState({ name: '', role: 'Operador I' });
    const [customRole, setCustomRole] = useState('');

    const handleAddOperator = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = formData.name.trim();
        let trimmedRole = formData.role === 'OUTRO' ? customRole.trim() : formData.role.trim();
        
        if (!trimmedName) return;
        if (formData.role === 'OUTRO' && !trimmedRole) {
            alert('Por favor, insira o nome do cargo personalizado.');
            return;
        }

        const skillsMap = skills.reduce((acc, s) => {
            const skillRule = PREREQUISITE_RULES[s.name];
            // Se o cargo for novo, tenta buscar na regra, senão assume 3 como padrão (Método Sistema Líder)
            const defaultP = skillRule ? (skillRule[trimmedRole] ?? 3) : 3;
            return { ...acc, [s.name]: { p: defaultP, r: 0 } };
        }, {});

        try {
            await db.collection('operators').add({
                name: trimmedName,
                role: trimmedRole,
                skills: skillsMap,
                uid: user.uid,
                createdAt: new Date()
            });
            setFormData({ name: '', role: 'Operador I' });
            setCustomRole('');
            alert('Colaborador registrado com sucesso.');
        } catch (error) {
            console.error("Erro ao adicionar operador:", error);
        }
    };

    return (
        <div className="animate-fade">
            <header className="mb-8">
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Cadastro de Colaboradores</h2>
                <p className="text-slate-500 text-sm font-medium">Adicione novos membros à sua equipe e defina seus cargos.</p>
            </header>

            <form onSubmit={handleAddOperator} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl mb-10 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                        <input 
                            required 
                            placeholder="Ex: João Silva" 
                            className="px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 font-medium transition-all" 
                            value={formData.name} 
                            onChange={e => setFormData({...formData, name: e.target.value})} 
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cargo / Função</label>
                        <select 
                            className="px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 font-medium transition-all"
                            value={formData.role}
                            onChange={e => setFormData({...formData, role: e.target.value})}
                        >
                            <option>Operador III</option>
                            <option>Operador II</option>
                            <option>Operador I</option>
                            <option>Auxiliar de Produção</option>
                            <option value="OUTRO">Outro / Personalizado...</option>
                        </select>
                    </div>
                </div>

                {formData.role === 'OUTRO' && (
                    <div className="flex flex-col gap-2 animate-fade">
                        <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1 flex items-center gap-1">
                            <ChevronRight size={12} /> Especifique o Cargo
                        </label>
                        <input 
                            required 
                            placeholder="Ex: Supervisor de Linha" 
                            className="px-4 py-3 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50/30 font-bold placeholder:font-medium transition-all" 
                            value={customRole} 
                            onChange={e => setCustomRole(e.target.value)} 
                        />
                    </div>
                )}

                <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 hover:scale-[1.01] transition-all flex items-center justify-center gap-2">
                    <PlusCircle size={20} /> Salvar Colaborador
                </button>
            </form>

            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-8 py-5 border-b bg-slate-50/50 flex items-center justify-between">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Equipe Cadastrada</h3>
                    <span className="text-[10px] bg-slate-200 text-slate-600 px-2.5 py-1 rounded-full font-black">{matrixData.length}</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-900 text-white">
                            <tr>
                                <th className="px-8 py-4 text-left text-[10px] uppercase font-black tracking-widest">Colaborador</th>
                                <th className="px-8 py-4 text-left text-[10px] uppercase font-black tracking-widest">Cargo</th>
                                <th className="px-8 py-4 text-right text-[10px] uppercase font-black tracking-widest">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {matrixData.map((op) => (
                                <tr key={op.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-8 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                                                <UserCheck size={16} />
                                            </div>
                                            <span className="font-bold text-slate-700">{op.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4">
                                        <span className="text-slate-500 text-sm font-medium bg-slate-100 px-3 py-1 rounded-full">
                                            {op.role}
                                        </span>
                                    </td>
                                    <td className="px-8 py-4 text-right">
                                        <button 
                                            onClick={() => { if(confirm('Excluir este colaborador?')) db.collection('operators').doc(op.id).delete() }} 
                                            className="text-slate-300 hover:text-red-500 p-2 transition-colors"
                                            title="Remover Colaborador"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {matrixData.length === 0 && (
                    <div className="text-center py-20 text-slate-300 font-bold uppercase tracking-widest text-xs italic">
                        Nenhum colaborador cadastrado
                    </div>
                )}
            </div>
        </div>
    );
};

export default OperatorRegistrationView;
