
import React, { useState, useMemo } from 'react';
import { Plus, Check, Minus, AlertCircle } from 'lucide-react';
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
    const [newPop, setNewPop] = useState({ code: '', title: '', date: '', validity: 12 });

    const availableRoles = useMemo(() => {
        const roles = matrixData.map(emp => emp.role.trim().toUpperCase()).filter(Boolean);
        return [...new Set(roles)].sort();
    }, [matrixData]);

    const handleAddProcedure = async (e: React.FormEvent) => {
        e.preventDefault();
        await db.collection('procedures').add({
            code: newPop.code, title: newPop.title, homologationDate: newPop.date, validityMonths: newPop.validity, roles: [], uid: user.uid
        });
        setShowAddForm(false);
        setNewPop({ code: '', title: '', date: '', validity: 12 });
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

    const updateStatus = async (empName: string, popCode: string, status: string) => {
        const key = `${user.uid}_${empName}_${popCode}`;
        await db.collection('training_records').doc(key).set({
            status, empName, popCode, uid: user.uid, date: new Date().toISOString().split('T')[0]
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
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Matriz de Treinamento</h2>
                <div className="flex gap-2">
                    <button onClick={() => setShowAddForm(!showAddForm)} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-black uppercase text-xs shadow-lg">Novo POP</button>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button onClick={() => setViewMode('roles')} className={`px-4 py-2 rounded-lg font-black uppercase text-[10px] transition-all ${viewMode === 'roles' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Cargos</button>
                        <button onClick={() => setViewMode('employees')} className={`px-4 py-2 rounded-lg font-black uppercase text-[10px] transition-all ${viewMode === 'employees' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Individuais</button>
                    </div>
                </div>
            </header>

            {showAddForm && (
                <form onSubmit={handleAddProcedure} className="bg-white p-8 rounded-[2rem] border shadow-xl mb-10 space-y-6 animate-fade">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-1"><label className="text-[10px] font-black">Código</label><input required className="w-full p-3 border rounded-xl bg-slate-50" value={newPop.code} onChange={e => setNewPop({...newPop, code: e.target.value})} /></div>
                        <div className="md:col-span-2 space-y-1"><label className="text-[10px] font-black">Título</label><input required className="w-full p-3 border rounded-xl bg-slate-50" value={newPop.title} onChange={e => setNewPop({...newPop, title: e.target.value})} /></div>
                        <div className="space-y-1"><label className="text-[10px] font-black">Validade (meses)</label><input type="number" required className="w-full p-3 border rounded-xl bg-slate-50" value={newPop.validity} onChange={e => setNewPop({...newPop, validity: parseInt(e.target.value)})} /></div>
                    </div>
                    <div className="space-y-1"><label className="text-[10px] font-black">Data de Homologação</label><input type="date" required className="w-full p-3 border rounded-xl bg-slate-50" value={newPop.date} onChange={e => setNewPop({...newPop, date: e.target.value})} /></div>
                    <button className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase">Adicionar Procedimento</button>
                </form>
            )}

            <div className="bg-white border rounded-[2rem] overflow-x-auto shadow-sm custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-900 text-white text-[10px] uppercase font-black tracking-widest">
                        <tr>
                            <th className="p-6 sticky left-0 bg-slate-900 z-10 min-w-[200px]">Procedimento / POP</th>
                            {viewMode === 'roles' ? 
                                availableRoles.map(r => <th key={r} className="p-4 border-l border-slate-800 text-center">{r}</th>) : 
                                procedures.map(p => <th key={p.code} className="p-4 border-l border-slate-800 text-center">{p.code}</th>)
                            }
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {viewMode === 'roles' ? procedures.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50">
                                <td className="p-6 sticky left-0 bg-white shadow-sm z-10">
                                    <div className="font-black text-slate-800 flex items-center gap-2">
                                        {p.code}
                                        {isExpired(p.homologationDate, p.validityMonths) && <AlertCircle size={14} className="text-red-500 animate-pulse-red" />}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-bold truncate max-w-[200px]">{p.title}</div>
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
                                    if (!required) return <td key={p.code} className="p-4 border-l text-center text-slate-200 text-[10px] font-black uppercase">N/A</td>;
                                    return (
                                        <td key={p.code} className="p-4 border-l text-center">
                                            <select 
                                                className={`text-[9px] font-black uppercase p-2 border rounded-xl outline-none ${expired ? 'bg-red-50 text-red-600 animate-pulse-red border-red-200' : record?.status === 'Concluído' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}
                                                value={record?.status || 'Pendente'}
                                                onChange={e => updateStatus(emp.name, p.code, e.target.value)}
                                            >
                                                <option value="Pendente">Pendente</option>
                                                <option value="Concluído">Concluído</option>
                                                <option value="Atrasado">Atrasado</option>
                                            </select>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {procedures.length === 0 && <div className="text-center py-20 text-slate-300 font-bold uppercase tracking-widest text-xs italic">Nenhum POP cadastrado</div>}
            </div>
        </div>
    );
};

export default TrainingMatrixView;
