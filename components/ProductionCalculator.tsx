
import React, { useState } from 'react';
import { Calculator, Save, History, TrendingUp, AlertTriangle } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ProductionEntry } from '../types';

interface ProductionCalculatorProps {
    productionData: ProductionEntry[];
    user: any;
    db: any;
}

const ProductionCalculator: React.FC<ProductionCalculatorProps> = ({ productionData, user, db }) => {
    const [form, setForm] = useState({
        shift: 'Turno A',
        totalTime: 480, // min (8h)
        downTime: 0,
        targetQty: 1000,
        actualQty: 0,
        defects: 0
    });

    // Calculations
    const availability = form.totalTime > 0 ? ((form.totalTime - form.downTime) / form.totalTime) : 0;
    const netOperatingTime = form.totalTime - form.downTime;
    const performance = (netOperatingTime > 0 && form.targetQty > 0) ? (form.actualQty / (form.targetQty * (netOperatingTime / form.totalTime))) : 0;
    const quality = form.actualQty > 0 ? ((form.actualQty - form.defects) / form.actualQty) : 0;
    const oee = availability * performance * quality;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await db.collection('production_log').add({
                ...form,
                date: new Date().toISOString().split('T')[0],
                availability: Math.round(availability * 100),
                performance: Math.round(performance * 100),
                quality: Math.round(quality * 100),
                oee: Math.round(oee * 100),
                uid: user.uid,
                createdAt: new Date()
            });
            alert('Registro salvo com sucesso!');
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="animate-fade">
            <header className="mb-10">
                <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Cálculo de Produção e OEE</h2>
                <p className="text-slate-500 font-medium">Calcule a eficiência global dos seus equipamentos e processos.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                {/* Form */}
                <form onSubmit={handleSave} className="lg:col-span-1 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-4">
                    <div className="flex items-center gap-2 mb-4 text-blue-600 font-black text-xs uppercase tracking-widest">
                        <Calculator size={16} /> Entradas de Produção
                    </div>
                    
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Turno</label>
                        <select className="w-full p-3 border rounded-xl bg-slate-50 font-bold" value={form.shift} onChange={e => setForm({...form, shift: e.target.value})}>
                            <option>Turno A</option>
                            <option>Turno B</option>
                            <option>Turno C</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tempo Total (min)</label>
                            <input type="number" className="w-full p-3 border rounded-xl bg-slate-50" value={form.totalTime} onChange={e => setForm({...form, totalTime: parseInt(e.target.value) || 0})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Paradas (min)</label>
                            <input type="number" className="w-full p-3 border rounded-xl bg-slate-50 text-red-600" value={form.downTime} onChange={e => setForm({...form, downTime: parseInt(e.target.value) || 0})} />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Meta de Peças (Capacidade)</label>
                        <input type="number" className="w-full p-3 border rounded-xl bg-slate-50" value={form.targetQty} onChange={e => setForm({...form, targetQty: parseInt(e.target.value) || 0})} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Peças Produzidas</label>
                            <input type="number" className="w-full p-3 border rounded-xl bg-slate-50" value={form.actualQty} onChange={e => setForm({...form, actualQty: parseInt(e.target.value) || 0})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Defeitos / Refugo</label>
                            <input type="number" className="w-full p-3 border rounded-xl bg-slate-50 text-red-500" value={form.defects} onChange={e => setForm({...form, defects: parseInt(e.target.value) || 0})} />
                        </div>
                    </div>

                    <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 hover:bg-slate-800 transition-all">
                        <Save size={18} /> Salvar Relatório
                    </button>
                </form>

                {/* Live Results */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-[2rem] border shadow-sm">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Disponibilidade</p>
                            <p className="text-4xl font-black text-slate-800">{Math.round(availability * 100)}%</p>
                        </div>
                        <div className="bg-white p-6 rounded-[2rem] border shadow-sm">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Performance</p>
                            <p className="text-4xl font-black text-slate-800">{Math.round(performance * 100)}%</p>
                        </div>
                        <div className="bg-white p-6 rounded-[2rem] border shadow-sm">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Qualidade</p>
                            <p className="text-4xl font-black text-slate-800">{Math.round(quality * 100)}%</p>
                        </div>
                    </div>

                    <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">OEE - Eficiência Global</h3>
                                <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase ${oee > 0.85 ? 'bg-emerald-500' : oee > 0.65 ? 'bg-amber-500' : 'bg-red-500'}`}>
                                    {oee > 0.85 ? 'World Class' : oee > 0.65 ? 'Estável' : 'Crítico'}
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-7xl font-black tracking-tighter text-blue-400">{Math.round(oee * 100)}%</span>
                                <span className="text-slate-500 font-bold uppercase text-[10px]">Indicador Geral</span>
                            </div>
                            
                            <div className="mt-8 h-40">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={productionData.slice(0, 7).reverse()}>
                                        <defs>
                                            <linearGradient id="colorOee" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                                        <XAxis dataKey="date" hide />
                                        <YAxis hide domain={[0, 100]} />
                                        <Tooltip 
                                            contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '10px'}}
                                            itemStyle={{color: '#fff'}}
                                        />
                                        <Area type="monotone" dataKey="oee" stroke="#3b82f6" fillOpacity={1} fill="url(#colorOee)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                    </div>
                </div>
            </div>

            {/* History Table */}
            <div className="bg-white rounded-[2rem] border shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Histórico de Produção</h3>
                    <History size={16} className="text-slate-300" />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Data / Turno</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest text-center">Disp.</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest text-center">Perf.</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest text-center">Qual.</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest text-right text-blue-600">OEE</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {productionData.map(entry => (
                                <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-8 py-4">
                                        <div className="font-bold text-slate-800">{entry.date}</div>
                                        <div className="text-[9px] font-black uppercase text-slate-400">{entry.shift}</div>
                                    </td>
                                    <td className="px-8 py-4 text-center font-bold text-slate-600">{entry.availability}%</td>
                                    <td className="px-8 py-4 text-center font-bold text-slate-600">{entry.performance}%</td>
                                    <td className="px-8 py-4 text-center font-bold text-slate-600">{entry.quality}%</td>
                                    <td className="px-8 py-4 text-right">
                                        <span className={`px-3 py-1 rounded-full font-black text-xs ${entry.oee > 85 ? 'text-emerald-600 bg-emerald-50' : entry.oee > 65 ? 'text-blue-600 bg-blue-50' : 'text-red-600 bg-red-50'}`}>
                                            {entry.oee}%
                                        </span>
                                    </td>
                                    <td className="px-8 py-4 text-right">
                                        <button onClick={() => db.collection('production_log').doc(entry.id).delete()} className="text-slate-300 hover:text-red-500 p-2">
                                            <TrendingUp size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ProductionCalculator;
