
import React from 'react';
import { Layers, AlertTriangle, Star, CheckCircle2, X as XIcon, Eye } from 'lucide-react';

interface MatrixControlsProps {
    viewMode: 'all' | 'gaps' | 'instructors';
    setViewMode: (mode: 'all' | 'gaps' | 'instructors') => void;
    totalOperators: number;
}

const MatrixControls: React.FC<MatrixControlsProps> = ({ viewMode, setViewMode, totalOperators }) => {
    return (
        <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm mb-6 rounded-b-[2.5rem]">
            {/* Filtros de Visualização */}
            <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] w-full md:w-auto">
                <button 
                    onClick={() => setViewMode('all')}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'all' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <Eye size={14} /> Ver Todos
                </button>
                <button 
                    onClick={() => setViewMode('gaps')}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'gaps' ? 'bg-red-500 text-white shadow-lg shadow-red-200' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <AlertTriangle size={14} /> Apenas Gaps
                </button>
                <button 
                    onClick={() => setViewMode('instructors')}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'instructors' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <Star size={14} /> Instrutores
                </button>
            </div>

            {/* Legenda de Ícones */}
            <div className="flex flex-wrap items-center justify-center gap-4 border-l border-slate-200 md:pl-8">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-full border border-red-100">
                    <XIcon size={12} className="text-red-500" />
                    <span className="text-[9px] font-black uppercase text-red-600">N0</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-full border border-amber-100">
                    <AlertTriangle size={12} className="text-amber-500" />
                    <span className="text-[9px] font-black uppercase text-amber-600">N1</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
                    <CheckCircle2 size={12} className="text-emerald-500" />
                    <span className="text-[9px] font-black uppercase text-emerald-600">N2</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full border border-blue-100">
                    <Star size={12} className="text-blue-600" />
                    <span className="text-[9px] font-black uppercase text-blue-600">N3/N4</span>
                </div>
                <div className="h-6 w-[1px] bg-slate-200 mx-2"></div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                    Time: <span className="text-slate-900">{totalOperators} Ops</span>
                </div>
            </div>
        </div>
    );
};

export default MatrixControls;
