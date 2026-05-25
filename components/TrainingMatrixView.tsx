
import React, { useState, useMemo } from 'react';
import { Plus, Check, Minus, AlertCircle, Trash2, Pencil, X } from 'lucide-react';
import { Operator, Procedure, TrainingRecord } from '../types';

interface TrainingMatrixViewProps {
    matrixData: Operator[];
    procedures: Procedure[];
    trainingRecords: Record<string, TrainingRecord>;
    user: any;
    db: any;
}

const TrainingMatrixView: React.FC<TrainingMatrixViewProps> = ({ matrixData, procedures, trainingRecords, user, db }) => {
    const [viewMode, setViewMode] = useState<'roles' | 'employees'>('roles');
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingProcedureId, setEditingProcedureId] = useState<string | null>(null);
    const [newPop, setNewPop] = useState({ code: '', title: '', date: '', validity: 12 });

    const availableRoles = useMemo(() => {
        const roles = matrixData.map(emp => emp.role.trim().toUpperCase()).filter(Boolean);
        return [...new Set(roles)].sort();
    }, [matrixData]);

    const handleAddProcedure = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const procedureData = {
            code: newPop.code, 
            title: newPop.title, 
            homologationDate: newPop.date, 
            validityMonths: newPop.validity, 
            uid: user.uid
        };

        try {
            if (editingProcedureId) {
                await db.collection('procedures').doc(editingProcedureId).update(procedureData);
                alert('Procedimento atualizado com sucesso.');
            } else {
                await db.collection('procedures').add({
                    ...procedureData,
                    roles: []
                });
                alert('Procedimento adicionado com sucesso.');
            }
            
            setShowAddForm(false);
            setEditingProcedureId(null);
            setNewPop({ code: '', title: '', date: '', validity: 12 });
        } catch (error) {
            console.error("Erro ao salvar procedimento:", error);
            alert("Erro ao salvar registro.");
        }
    };

    const handleEditClick = (proc: Procedure) => {
        setNewPop({
            code: proc.code,
            title: proc.title,
            date: proc.homologationDate,
            validity: proc.validityMonths
        });
        setEditingProcedureId(proc.id);
        setShowAddForm(true);
    };

    const handleDeleteProcedure = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir este procedimento? Todos os vínculos de cargo serão removidos.')) {
            try {
                await db.collection('procedures').doc(id).delete();
            } catch (error) {
                console.error("Erro ao excluir procedimento:", error);
            }
        }
    };

    const toggleRole = async (codeId: string, role: string) => {
        const proc = procedures.find(p => p.id === codeId);
        if (!proc) return;
        const roleUpper = role.toUpperCase();
        const currentRoles = (proc.roles || []).map(r => r.toUpperCase());
        const newRoles = currentRoles.includes(roleUpper) 
            ? currentRoles.filter(r => r !== roleUpper) 
            : [...currentRoles, roleUpper];
        await db.collection('procedures').doc(codeId).update({ roles: newRoles });
    };

    const updateRecord = async (empName: string, popCode: string, updates: Partial<TrainingRecord>) => {
        const key = `${user.uid}_${empName}_${popCode}`;
        const existing = trainingRecords[key] || { 
            status: 'Pendente', 
            date: new Date().toISOString().split('T')[0] 
        };
        await db.collection('training_records').doc(key).set({
            ...existing,
            ...updates,
            empName,
            popCode,
            uid: user.uid
        });
    };

    const isExpired = (hDate: string, val: number) => {
        if (!hDate) return false;
        const date = new Date(hDate);
        date.setMonth(date.getMonth() + val);
        return new Date() > date;
    };

    return (
        <div className="animate-fade">
            <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-100 uppercase tracking-tight">Matriz de Treinamento</h2>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Gestão de POPs e Qualificações Técnicas</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => {
                            if (showAddForm && editingProcedureId) {
                                setEditingProcedureId(null);
                                setNewPop({ code: '', title: '', date: '', validity: 12 });
                            } else {
                                setShowAddForm(!showAddForm);
                            }
                        }} 
                        className="bg-blue-600 text-white px-4 py-2 rounded-xl font-black uppercase text-xs shadow-lg hover:bg-blue-700 transition-all"
                    >
                        {showAddForm ? 'Cancelar' : 'Novo POP'}
                    </button>
                    <div className="flex bg-slate-800 p-1 rounded-xl">
                        <button onClick={() => setViewMode('roles')} className={`px-4 py-2 rounded-lg font-black uppercase text-[10px] transition-all ${viewMode === 'roles' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400'}`}>Cargos</button>
                        <button onClick={() => setViewMode('employees')} className={`px-4 py-2 rounded-lg font-black uppercase text-[10px] transition-all ${viewMode === 'employees' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400'}`}>Individuais</button>
                    </div>
                </div>
            </header>

            {showAddForm && (
                <form onSubmit={handleAddProcedure} className="bg-white p-8 rounded-[2rem] border shadow-xl mb-10 space-y-6 animate-fade">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                            {editingProcedureId ? 'Editar Procedimento' : 'Novo Procedimento Operacional'}
                        </h3>
                        {editingProcedureId && (
                             <button type="button" onClick={() => { setEditingProcedureId(null); setShowAddForm(false); setNewPop({ code: '', title: '', date: '', validity: 12 }); }} className="text-slate-300 hover:text-red-500"><X size={20}/></button>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400">Código do POP</label>
                            <input required className="w-full p-3 border rounded-xl bg-slate-50 font-bold" value={newPop.code} onChange={e => setNewPop({...newPop, code: e.target.value})} />
                        </div>
                        <div className="md:col-span-2 space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400">Título / Descrição</label>
                            <input required className="w-full p-3 border rounded-xl bg-slate-50 font-medium" value={newPop.title} onChange={e => setNewPop({...newPop, title: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400">Validade (meses)</label>
                            <input type="number" required className="w-full p-3 border rounded-xl bg-slate-50 font-bold" value={newPop.validity} onChange={e => setNewPop({...newPop, validity: parseInt(e.target.value)})} />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400">Data de Homologação</label>
                        <input type="date" required className="w-full p-3 border rounded-xl bg-slate-50 font-bold" value={newPop.date} onChange={e => setNewPop({...newPop, date: e.target.value})} />
                    </div>
                    <button className={`w-full py-4 rounded-xl font-black uppercase transition-all shadow-lg ${editingProcedureId ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                        {editingProcedureId ? 'Salvar Alterações' : 'Adicionar Procedimento'}
                    </button>
                </form>
            )}

            <div className="bg-white border rounded-[2rem] overflow-x-auto shadow-sm custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-900 text-white text-[10px] uppercase font-black tracking-widest">
                        <tr>
                            <th className="p-6 sticky left-0 bg-slate-900 z-10 min-w-[240px]">Procedimento / POP</th>
                            {viewMode === 'roles' ? 
                                availableRoles.map(r => <th key={r} className="p-4 border-l border-slate-800 text-center">{r}</th>) : 
                                procedures.map(p => <th key={p.code} className="p-4 border-l border-slate-800 text-center">{p.code}</th>)
                            }
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {viewMode === 'roles' ? procedures.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50 group">
                                <td className="p-6 sticky left-0 bg-white shadow-sm z-10">
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col">
                                            <div className="font-black text-slate-800 flex items-center gap-2">
                                                {p.code}
                                                {isExpired(p.homologationDate, p.validityMonths) && <AlertCircle size={14} className="text-red-500 animate-pulse-red" />}
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-bold truncate max-w-[180px]">{p.title}</div>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEditClick(p)} className="p-1.5 text-slate-300 hover:text-blue-500 transition-colors" title="Editar POP">
                                                <Pencil size={14} />
                                            </button>
                                            <button onClick={() => handleDeleteProcedure(p.id)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors" title="Excluir POP">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </td>
                                {availableRoles.map(role => (
                                    <td key={role} className="p-4 text-center border-l">
                                        <button 
                                            onClick={() => toggleRole(p.id, role)} 
                                            className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto transition-all ${p.roles?.includes(role.toUpperCase()) ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-300'}`}
                                        >
                                            {p.roles?.includes(role.toUpperCase()) ? <Check size={14} /> : <Minus size={14} />}
                                        </button>
                                    </td>
                                ))}
                            </tr>
                        )) : matrixData.map(emp => (
                            <tr key={emp.id} className="hover:bg-slate-50">
                                <td className="p-6 sticky left-0 bg-white shadow-sm z-10">
                                    <div className="font-black text-slate-700">{emp.name}</div>
                                    <div className="text-[9px] font-bold text-slate-400 uppercase">{emp.role}</div>
                                </td>
                                {procedures.map(p => {
                                    const required = p.roles?.includes(emp.role.toUpperCase());
                                    const record = trainingRecords[`${user.uid}_${emp.name}_${p.code}`];
                                    const expired = isExpired(p.homologationDate, p.validityMonths);
                                    
                                    if (!required) return <td key={p.code} className="p-4 border-l text-center text-slate-200 text-[10px] font-black uppercase group">
                                        <div className="flex flex-col items-center">
                                            <span>N/A</span>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                                                <button onClick={() => handleEditClick(p)} className="text-slate-200 hover:text-blue-500" title="Editar POP"><Pencil size={10}/></button>
                                                <button onClick={() => handleDeleteProcedure(p.id)} className="text-slate-200 hover:text-red-500" title="Excluir POP"><Trash2 size={10}/></button>
                                            </div>
                                        </div>
                                    </td>;

                                    return (
                                        <td key={p.code} className="p-4 border-l text-center group">
                                            <div className="flex flex-col gap-1 items-center min-w-[110px]">
                                                <select 
                                                    className={`text-[9px] font-black uppercase p-2 border rounded-xl outline-none w-full ${expired ? 'bg-red-50 text-red-600 animate-pulse-red border-red-200' : record?.status === 'Concluído' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}
                                                    value={record?.status || 'Pendente'}
                                                    onChange={e => updateRecord(emp.name, p.code, { status: e.target.value as any })}
                                                >
                                                    <option value="Pendente">Pendente</option>
                                                    <option value="Concluído">Concluído</option>
                                                    <option value="Atrasado">Atrasado</option>
                                                </select>
                                                <input 
                                                    type="date"
                                                    className="text-[8px] p-1 border rounded bg-white w-full outline-none font-bold text-slate-600"
                                                    value={record?.date || ''}
                                                    onChange={e => updateRecord(emp.name, p.code, { date: e.target.value })}
                                                    title="Data do último treinamento"
                                                />
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                                                    <button onClick={() => handleEditClick(p)} className="text-slate-300 hover:text-blue-500" title="Editar POP"><Pencil size={10}/></button>
                                                    <button onClick={() => handleDeleteProcedure(p.id)} className="text-slate-300 hover:text-red-500" title="Excluir POP"><Trash2 size={10}/></button>
                                                </div>
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {procedures.length === 0 && <div className="text-center py-20 text-slate-300 font-bold uppercase tracking-widest text-xs italic">Nenhum POP cadastrado</div>}
            </div>
            <style>{`
                @keyframes pulse-red {
                    0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
                    70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }
                .animate-pulse-red { animation: pulse-red 2s infinite; }
            `}</style>
        </div>
    );
};

export default TrainingMatrixView;
