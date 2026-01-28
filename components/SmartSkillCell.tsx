
import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Star, Minus } from 'lucide-react';
import { calculateSkillStatus, SkillStatus } from '../utils/GapAnalysisHelper';

interface SmartSkillCellProps {
    currentLevel: number | null;
    requiredLevel: number;
    viewMode: 'all' | 'gaps' | 'instructors';
    onClick: () => void;
}

const SmartSkillCell: React.FC<SmartSkillCellProps> = ({ 
    currentLevel, 
    requiredLevel, 
    viewMode, 
    onClick 
}) => {
    const status = calculateSkillStatus(currentLevel, requiredLevel);
    
    // Decisão de Ícone
    const getIcon = () => {
        if (currentLevel === null) return <Minus size={16} className="text-slate-200" />;
        if (currentLevel >= 4) return <Star size={16} className="text-indigo-600" fill="currentColor" />;
        
        switch (status) {
            case 'ok': return <CheckCircle2 size={16} className="text-emerald-500" />;
            case 'warning': return <AlertTriangle size={16} className="text-amber-500" />;
            case 'critical': return <XCircle size={16} className="text-rose-500" />;
            default: return <Minus size={16} />;
        }
    };

    // Lógica de Visibilidade para Filtros
    const isVisible = () => {
        if (viewMode === 'all') return true;
        if (viewMode === 'gaps') return status === 'critical' || status === 'warning';
        if (viewMode === 'instructors') return currentLevel !== null && currentLevel >= 3;
        return true;
    };

    const opacityClass = isVisible() ? 'opacity-100 scale-100' : 'opacity-10 blur-[1px] grayscale scale-90 pointer-events-none';

    return (
        <div 
            onClick={onClick}
            className={`
                relative w-12 h-12 rounded-2xl flex flex-col items-center justify-center cursor-pointer
                transition-all duration-300 hover:z-20 hover:scale-110 group
                ${status === 'critical' ? 'animate-pulse-subtle ring-2 ring-rose-200' : ''}
                ${status === 'ok' && currentLevel !== null ? 'bg-emerald-50/50' : 'bg-slate-50'}
                ${opacityClass}
            `}
        >
            {/* Ícone Principal */}
            {getIcon()}

            {/* Nível Real (Texto pequeno) */}
            <span className="text-[9px] font-black mt-0.5 text-slate-400">
                {currentLevel !== null ? `N${currentLevel}` : '-'}
            </span>

            {/* Badge de Meta (Required Level) */}
            <div className="absolute -bottom-1 -right-1 bg-white border border-slate-200 shadow-sm rounded-md px-1 py-0.5 scale-75 group-hover:scale-100 transition-transform">
                <span className="text-[8px] font-black text-slate-500 tracking-tighter">
                    /{requiredLevel}
                </span>
            </div>

            {/* Tooltip Nativo */}
            <div className="sr-only">
                {`Nível Atual: ${currentLevel} | Meta do Cargo: ${requiredLevel} | Status: ${status}`}
            </div>

            <style>{`
                @keyframes pulse-subtle {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(244, 63, 94, 0.4); }
                    50% { box-shadow: 0 0 0 6px rgba(244, 63, 94, 0); }
                }
                .animate-pulse-subtle { animation: pulse-subtle 2s infinite ease-in-out; }
            `}</style>
        </div>
    );
};

export default SmartSkillCell;
