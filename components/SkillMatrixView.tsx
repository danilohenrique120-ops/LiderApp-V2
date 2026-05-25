
import React, { useState, useMemo } from 'react';
import { Plus, Trash2, X, ChevronRight, Settings2, Info, Target, Users } from 'lucide-react';
// @ts-ignore
import firebase from 'firebase/compat/app';
import { Operator, SkillConfig } from '../types';
import { TOPICS_LIST, ROLE_OPTIONS } from '../constants';
import SmartSkillCell from './SmartSkillCell';
import MatrixControls from './MatrixControls';

interface SkillMatrixViewProps {
    data: Operator[];
    skills: SkillConfig[];
    user: any;
    db: any;
}

const SkillMatrixView: React.FC<SkillMatrixViewProps> = ({ data, skills, user, db }) => {
    const [viewMode, setViewMode] = useState<'all' | 'gaps' | 'instructors'>('all');
    const [showAddSkill, setShowAddSkill] = useState(false);
    
    // Estados do Cadastro
    const [newSkillName, setNewSkillName] = useState('');
    const [newSkillTopic, setNewSkillTopic] = useState('SAP');
    const [customTopic, setCustomTopic] = useState('');
    
    // Novo Estado: Metas por Cargo
    const [rolePrereqs, setRolePrereqs] = useState<Record<string, number>>(
        ROLE_OPTIONS.reduce((acc, role) => ({ ...acc, [role]: 2 }), {})
    );

    // Agrupamento por tópico
    const skillsByTopic = useMemo(() => {
        const grouped: Record<string, SkillConfig[]> = {};
        skills.forEach(s => {
            if (!grouped[s.topic]) grouped[s.topic] = [];
            grouped[s.topic].push(s);
        });
        return grouped;
    }, [skills]);

    // Memoizing the flattened list of skills
    const flatSkills = useMemo(() => (Object.values(skillsByTopic) as SkillConfig[][]).flat() as SkillConfig[], [skillsByTopic]);

    const handleUpdateSkillLevel = async (opId: string, skill: SkillConfig, currentLevel: number) => {
        const nextLevel = (currentLevel + 1) % 5;
        const op = data.find(o => o.id === opId);
        if (!op) return;

        const targetLevel = skill.rolePrereqs?.[op.role] ?? 2;

        const updatedSkills = { ...op.skills };
        updatedSkills[skill.name] = { p: targetLevel, r: nextLevel };

        try {
            await db.collection('operators').doc(opId).update({ skills: updatedSkills });
        } catch (error) {
            console.error("Erro ao atualizar nível:", error);
        }
    };

    const handleAddSkill = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSkillName.trim()) return;
        const finalTopic = newSkillTopic === 'OUTROS' ? customTopic.trim() : newSkillTopic;
        if (!finalTopic) return;

        try {
            await db.collection('skills_config').add({
                name: newSkillName.trim(),
                topic: finalTopic,
                uid: user.uid,
                rolePrereqs: rolePrereqs,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            const snapshot = await db.collection('operators').where('uid', '==', user.uid).get();
            const batch = db.batch();
            
            snapshot.forEach(doc => {
                const opData = doc.data();
                const targetForThisOp = rolePrereqs[opData.role] ?? 2;
                batch.update(doc.ref, { 
                    [`skills.${newSkillName.trim()}`]: { p: targetForThisOp, r: 0 } 
                });
            });
            
            await batch.commit();
            setShowAddSkill(false);
            setNewSkillName('');
            setCustomTopic('');
        } catch (error) {
            console.error("Erro ao cadastrar skill:", error);
        }
    };

    return (
        <div className="animate-fade">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-black text-slate-100 uppercase tracking-tighter leading-none">Matriz de Habilidades</h2>
                    <p className="text-slate-400 text-sm font-medium mt-1 uppercase tracking-widest text-[10px]">Análise de Gaps por Perfil de Cargo</p>
                </div>
                <button 
                    onClick={() => setShowAddSkill(true)} 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-200/50 flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
                >
                    <Plus size={16} /> Configurar Habilidade
                </button>
            </header>

            {/* MODAL DE CADASTRO */}
            {showAddSkill && (
                <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade">
                    <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-8 border-b flex justify-between items-center bg-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
                                    <Target size={20} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Nova Habilidade Técnica</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Defina o nome e as metas por cargo</p>
                                </div>
                            </div>
                            <button onClick={() => setShowAddSkill(false)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><X size={24} /></button>
                        </div>

                        <form onSubmit={handleAddSkill} className="p-8 overflow-y-auto custom-scrollbar space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome da Skill</label>
                                    <input required placeholder="Ex: Operação Forno 01" className="w-full px-6 py-4 rounded-2xl border bg-slate-50 font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all" value={newSkillName} onChange={e => setNewSkillName(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
                                    <select className="w-full px-6 py-4 rounded-2xl border bg-slate-50 font-bold outline-none focus:ring-2 focus:ring-indigo-500" value={newSkillTopic} onChange={e => setNewSkillTopic(e.target.value)}>
                                        {TOPICS_LIST.map(t => <option key={t} value={t}>{t}</option>)}
                                        <option value="OUTROS">Outros...</option>
                                    </select>
                                </div>
                            </div>

                            {newSkillTopic === 'OUTROS' && (
                                <div className="space-y-2 animate-fade">
                                    <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1">Especifique a Categoria</label>
                                    <input required placeholder="Ex: Qualidade Especial" className="w-full px-6 py-4 rounded-2xl border bg-indigo-50/30 font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all" value={customTopic} onChange={e => setCustomTopic(e.target.value)} />
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Users size={16} className="text-indigo-600" />
                                    <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Nível Exigido por Perfil (Target)</h4>
                                </div>
                                <div className="bg-slate-50 rounded-3xl border border-slate-100 overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                            <tr>
                                                <th className="px-6 py-4">Cargo / Função</th>
                                                <th className="px-6 py-4 text-center">Nível Alvo</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {ROLE_OPTIONS.map(role => (
                                                <tr key={role} className="hover:bg-white transition-colors">
                                                    <td className="px-6 py-4 font-bold text-slate-700">{role}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex justify-center gap-2">
                                                            {[0, 1, 2, 3, 4].map(level => (
                                                                <button
                                                                    key={level}
                                                                    type="button"
                                                                    onClick={() => setRolePrereqs(prev => ({ ...prev, [role]: level }))}
                                                                    className={`w-8 h-8 rounded-lg font-black text-[10px] transition-all ${rolePrereqs[role] === level ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-400 hover:border-indigo-300'}`}
                                                                >
                                                                    N{level}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <button className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                                <Plus size={20} /> Salvar e Aplicar a Matriz
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <MatrixControls viewMode={viewMode} setViewMode={setViewMode} totalOperators={data.length} />

            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden">
                <div className="overflow-x-auto overflow-y-auto max-h-[75vh] custom-scrollbar pb-4">
                    <table className="min-w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-900 text-white">
                                <th className="w-64 p-8 text-left font-black text-xs uppercase bg-slate-900 sticky left-0 z-50 border-r-2 border-slate-700">Time Industrial</th>
                                {(Object.entries(skillsByTopic) as [string, SkillConfig[]][]).map(([topic, group]) => (
                                    <th key={topic} colSpan={group.length} className="px-4 py-3 text-center text-[10px] font-black uppercase border-r border-slate-700 bg-slate-800">
                                        {topic}
                                    </th>
                                ))}
                            </tr>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="p-4 sticky left-0 z-40 bg-slate-50 border-r-2 border-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0.05)]"></th>
                                {flatSkills.map(skill => (
                                    <th key={skill.id} className="h-64 relative border-r border-slate-200 min-w-[120px] max-w-[120px] align-bottom overflow-visible">
                                        {/* AJUSTE DE ALINHAMENTO: left-[calc(50%+24px)] compensa a inclinação de -45 graus */}
                                        <div className="absolute left-[calc(50%+24px)] bottom-32 -translate-x-1/2 w-48 flex justify-center pointer-events-none">
                                            <div className="transform -rotate-45 origin-bottom flex items-center justify-center">
                                                <span 
                                                    className="text-[10px] font-black uppercase text-slate-500 tracking-tight flex items-center justify-center gap-2 group cursor-pointer hover:text-red-500 whitespace-normal break-words leading-tight text-center max-w-[110px] pointer-events-auto" 
                                                    onClick={() => { if(confirm('Excluir skill?')) db.collection('skills_config').doc(skill.id).delete(); }}
                                                >
                                                    {skill.name} 
                                                    <Trash2 size={10} className="opacity-0 group-hover:opacity-100 shrink-0" />
                                                </span>
                                            </div>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.map((emp) => (
                                <tr key={emp.id} className="group hover:bg-blue-50/20 transition-colors">
                                    <td className="px-8 py-4 sticky left-0 bg-white z-30 border-r-2 border-slate-200 shadow-[2px_0_10px_rgba(0,0,0,0.05)]">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-slate-800 truncate">{emp.name}</span>
                                            <span className="text-[8px] text-slate-400 uppercase font-black tracking-tighter">{emp.role}</span>
                                        </div>
                                    </td>
                                    {flatSkills.map(skill => {
                                        const realLevel = emp.skills[skill.name]?.r ?? 0;
                                        const targetLevel = skill.rolePrereqs?.[emp.role] ?? 2;
                                        
                                        return (
                                            <td key={`${skill.id}-${emp.id}`} className="p-2 border-r border-slate-100 min-w-[120px] max-w-[120px]">
                                                <div className="flex justify-center">
                                                    <SmartSkillCell 
                                                        currentLevel={realLevel} 
                                                        requiredLevel={targetLevel} 
                                                        viewMode={viewMode}
                                                        onClick={() => handleUpdateSkillLevel(emp.id, skill, realLevel)}
                                                    />
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SkillMatrixView;
