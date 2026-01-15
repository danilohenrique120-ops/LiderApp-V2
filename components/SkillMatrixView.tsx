
import React, { useState, useMemo } from 'react';
import { Plus, Download, Trash2, XCircle, X } from 'lucide-react';
// @ts-ignore
import firebase from 'firebase/compat/app';
import { Operator, SkillConfig } from '../types';
import { TOPICS_LIST } from '../constants';

interface SkillMatrixViewProps {
    data: Operator[];
    skills: SkillConfig[];
    user: any;
    db: any;
}

const SkillMatrixView: React.FC<SkillMatrixViewProps> = ({ data, skills, user, db }) => {
    const [editing, setEditing] = useState<{ opId: string, s: string, type: 'p' | 'r' } | null>(null);
    const [showAddSkill, setShowAddSkill] = useState(false);
    const [newSkillName, setNewSkillName] = useState('');
    const [newSkillTopic, setNewSkillTopic] = useState('SAP');
    const [customTopic, setCustomTopic] = useState('');
    const [rolePrereqs, setRolePrereqs] = useState<Record<string, number>>({});

    const uniqueRoles = useMemo(() => [...new Set(data.map(op => op.role))].sort(), [data]);

    const groupedSkills = useMemo(() => {
        const groups: Record<string, SkillConfig[]> = {};
        skills.forEach(s => {
            if (!groups[s.topic]) groups[s.topic] = [];
            groups[s.topic].push(s);
        });
        return groups;
    }, [skills]);

    const uniqueTopics = Object.keys(groupedSkills);
    const orderedSkills = uniqueTopics.flatMap(t => groupedSkills[t]);

    const updateValue = async (opId: string, skillKey: string, type: 'p' | 'r', val: string) => {
        const numeric = Math.min(4, Math.max(0, parseInt(val) || 0));
        const op = data.find(o => o.id === opId);
        if (!op) return;
        const updatedSkills = { ...op.skills };
        if (!updatedSkills[skillKey]) updatedSkills[skillKey] = { p: 3, r: 0 };
        updatedSkills[skillKey][type] = numeric;
        await db.collection('operators').doc(opId).update({ skills: updatedSkills });
        setEditing(null);
    };

    const handleAddSkill = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSkillName.trim()) return;
        const finalTopic = newSkillTopic === 'OUTROS' ? customTopic.trim() : newSkillTopic;
        if (!finalTopic) return;

        await db.collection('skills_config').add({
            name: newSkillName.trim(),
            topic: finalTopic,
            uid: user.uid,
            rolePrereqs: rolePrereqs
        });
        
        const snapshot = await db.collection('operators').where('uid', '==', user.uid).get();
        const batch = db.batch();
        snapshot.forEach(doc => {
            const opData = doc.data();
            const pValue = rolePrereqs[opData.role] !== undefined ? rolePrereqs[opData.role] : 3;
            batch.update(doc.ref, { [`skills.${newSkillName.trim()}`]: { p: pValue, r: 0 } });
        });
        await batch.commit();
        
        setShowAddSkill(false);
        setNewSkillName('');
        setCustomTopic('');
    };

    const handleDeleteSkill = async (skill: SkillConfig) => {
        if (!confirm(`Excluir a habilidade "${skill.name}"? Isso removerá os registros de todos os colaboradores.`)) return;
        try {
            const batch = db.batch();
            batch.delete(db.collection('skills_config').doc(skill.id));

            const snapshot = await db.collection('operators').where('uid', '==', user.uid).get();
            snapshot.forEach(doc => {
                batch.update(doc.ref, {
                    [`skills.${skill.name}`]: firebase.firestore.FieldValue.delete()
                });
            });

            await batch.commit();
        } catch (error) {
            console.error("Erro ao excluir skill:", error);
            alert("Erro ao excluir habilidade.");
        }
    };

    const handleDeleteTopic = async (topic: string) => {
        if (!confirm(`Excluir o tópico "${topic}" e TODAS as suas habilidades?`)) return;
        try {
            const topicSkills = skills.filter(s => s.topic === topic);
            const batch = db.batch();
            
            topicSkills.forEach(s => {
                batch.delete(db.collection('skills_config').doc(s.id));
            });

            const snapshot = await db.collection('operators').where('uid', '==', user.uid).get();
            snapshot.forEach(doc => {
                const updates: any = {};
                topicSkills.forEach(s => {
                    updates[`skills.${s.name}`] = firebase.firestore.FieldValue.delete();
                });
                batch.update(doc.ref, updates);
            });

            await batch.commit();
        } catch (error) {
            console.error("Erro ao excluir tópico:", error);
            alert("Erro ao excluir tópico.");
        }
    };

    const getLevelColor = (val: number) => {
        if (val >= 4) return 'bg-blue-600 text-white';
        if (val >= 3) return 'bg-blue-400 text-white';
        if (val >= 2) return 'bg-blue-200 text-blue-900';
        if (val >= 1) return 'bg-orange-100 text-orange-800';
        return 'bg-slate-100 text-slate-400';
    };

    return (
        <div className="animate-fade">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Matriz de Habilidades</h2>
                <div className="flex gap-2">
                    <button onClick={() => setShowAddSkill(!showAddSkill)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs shadow-lg shadow-blue-100 hover:scale-105 transition-all flex items-center gap-2">
                        <Plus size={16} /> Nova Skill
                    </button>
                </div>
            </div>

            {showAddSkill && (
                <form onSubmit={handleAddSkill} className="bg-white p-8 rounded-[2rem] border shadow-xl mb-8 space-y-6 animate-fade">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome da Skill</label>
                            <input required placeholder="Ex: Operação de Caldeira" className="w-full px-4 py-3 rounded-xl border bg-slate-50 font-medium" value={newSkillName} onChange={e => setNewSkillName(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tópico</label>
                            <select className="w-full px-4 py-3 rounded-xl border bg-slate-50 font-medium" value={newSkillTopic} onChange={e => setNewSkillTopic(e.target.value)}>
                                {TOPICS_LIST.map(t => <option key={t} value={t}>{t}</option>)}
                                <option value="OUTROS">Outros...</option>
                            </select>
                        </div>
                    </div>
                    {newSkillTopic === 'OUTROS' && (
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Novo Tópico</label>
                            <input required className="w-full px-4 py-3 rounded-xl border bg-slate-50" value={customTopic} onChange={e => setCustomTopic(e.target.value)} />
                        </div>
                    )}
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <h3 className="text-[11px] font-black text-slate-600 uppercase tracking-widest mb-4">Nível P (Requisito por Cargo)</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {uniqueRoles.map(role => (
                                <div key={role} className="space-y-1">
                                    <label className="text-[9px] font-bold text-slate-500 uppercase truncate block">{role}</label>
                                    <input type="number" min="0" max="4" className="w-full px-3 py-2 rounded-lg border bg-white" value={rolePrereqs[role] || 3} onChange={e => setRolePrereqs({...rolePrereqs, [role]: parseInt(e.target.value)})} />
                                </div>
                            ))}
                        </div>
                    </div>
                    <button className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest shadow-lg">Criar Habilidade</button>
                </form>
            )}

            <div className="bg-white rounded-[2rem] border shadow-xl overflow-hidden">
                <div className="overflow-x-auto overflow-y-auto max-h-[700px] custom-scrollbar">
                    <table className="min-w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-900 text-white">
                                <th rowSpan={3} className="px-8 py-4 text-left font-black text-xs uppercase bg-slate-900 sticky left-0 z-40 border-r border-slate-700 min-w-[200px]">Colaborador</th>
                                {uniqueTopics.map(topic => (
                                    <th key={topic} colSpan={groupedSkills[topic].length * 2} className="px-4 py-3 text-center text-[10px] font-black uppercase border-l border-slate-700">
                                        <div className="flex items-center justify-center gap-2">
                                            {topic}
                                            <button 
                                                onClick={() => handleDeleteTopic(topic)} 
                                                className="p-1 hover:bg-white/20 rounded transition-colors text-slate-400 hover:text-red-400"
                                                title="Excluir Tópico"
                                            >
                                                <X size={10} />
                                            </button>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                            <tr className="bg-blue-50 text-slate-800">
                                {orderedSkills.map(skill => (
                                    <th key={skill.id} colSpan={2} className="px-4 py-3 text-center text-[9px] font-bold border-l border-slate-200 min-w-[100px]">
                                        <div className="flex items-center justify-center gap-2">
                                            {skill.name}
                                            <button 
                                                onClick={() => handleDeleteSkill(skill)} 
                                                className="p-1 hover:bg-slate-200 rounded transition-colors text-slate-400 hover:text-red-500"
                                                title="Excluir Habilidade"
                                            >
                                                <Trash2 size={10} />
                                            </button>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                            <tr className="bg-blue-100/30 text-slate-500 font-black text-[8px] uppercase">
                                {orderedSkills.map(skill => (
                                    <React.Fragment key={`lbl-${skill.id}`}>
                                        <th className="px-1 py-1 text-center border-l">P</th>
                                        <th className="px-1 py-1 text-center">R</th>
                                    </React.Fragment>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.map((emp) => (
                                <tr key={emp.id} className="hover:bg-slate-50">
                                    <td className="px-8 py-4 font-bold text-slate-700 sticky left-0 bg-white z-20 border-r-2 border-slate-100 shadow-sm">{emp.name}</td>
                                    {orderedSkills.map(skill => {
                                        const p = emp.skills[skill.name]?.p || 0;
                                        const r = emp.skills[skill.name]?.r || 0;
                                        return (
                                            <React.Fragment key={`${skill.id}-${emp.id}`}>
                                                <td className="p-2 border-l border-slate-50 text-center">
                                                    <div 
                                                        onClick={() => setEditing({opId: emp.id, s: skill.name, type:'p'})} 
                                                        className={`w-8 h-8 mx-auto rounded-lg flex items-center justify-center font-black text-[10px] matrix-cell ${getLevelColor(p)}`}
                                                    >
                                                        {editing?.opId === emp.id && editing?.s === skill.name && editing?.type === 'p' ? (
                                                            <input autoFocus className="w-full h-full bg-slate-100 text-center outline-none" onBlur={(e) => updateValue(emp.id, skill.name, 'p', e.target.value)} />
                                                        ) : p}
                                                    </div>
                                                </td>
                                                <td className="p-2 text-center relative">
                                                    <div 
                                                        onClick={() => setEditing({opId: emp.id, s: skill.name, type:'r'})} 
                                                        className={`w-8 h-8 mx-auto rounded-lg flex items-center justify-center font-black text-[10px] matrix-cell ${getLevelColor(r)} ${r < p ? 'ring-2 ring-red-400 ring-offset-1' : ''}`}
                                                    >
                                                        {editing?.opId === emp.id && editing?.s === skill.name && editing?.type === 'r' ? (
                                                            <input autoFocus className="w-full h-full bg-slate-100 text-center outline-none" onBlur={(e) => updateValue(emp.id, skill.name, 'r', e.target.value)} />
                                                        ) : r}
                                                    </div>
                                                    {r < p && <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></div>}
                                                </td>
                                            </React.Fragment>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {data.length === 0 && <div className="text-center py-20 text-slate-300 font-bold uppercase tracking-widest text-xs italic">Nenhum dado na matriz</div>}
            </div>
        </div>
    );
};

export default SkillMatrixView;
