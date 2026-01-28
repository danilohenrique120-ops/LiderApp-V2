
import React from 'react';
import { X, AlertCircle, CheckCircle2, Star, Minus } from 'lucide-react';

export type SkillLevel = 0 | 1 | 2 | 3 | 4 | null;

interface SkillCellProps {
    level: SkillLevel;
    pLevel?: number; // Requisito
    viewMode: 'all' | 'gaps' | 'instructors';
    onClick: () => void;
}

const SkillCell: React.FC<SkillCellProps> = ({ level, pLevel = 0, viewMode, onClick }) => {
    // Mapeamento de Configuração Visual
    // Fix: Explicitly defining the config type to include 'null' as a string key and adding the 'bg' property which was being accessed but was missing in the original definitions.
    const config: Record<string | number, { icon: any, color: string, bg: string, label: string, fill?: boolean }> = {
        0: { icon: X, color: 'text-red-500', bg: 'bg-red-50', label: 'Gap Crítico (Nível 0)' },
        1: { icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-50', label: 'Em Treinamento (Nível 1)' },
        2: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Proficiente (Nível 2)' },
        3: { icon: Star, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Especialista (Nível 3)' },
        4: { icon: Star, color: 'text-indigo-600', bg: 'bg-indigo-50 shadow-inner', label: 'Instrutor Master (Nível 4)', fill: true },
        'null': { icon: Minus, color: 'text-slate-200', bg: 'bg-transparent', label: 'N/A' }
    };

    // Fix: Use a safe index lookup by checking for null explicitly and using the string 'null' for the fallback, avoiding the primitive null as an index.
    const current = (level === null ? config['null'] : config[level]) || config['null'];
    const Icon = current.icon;

    // Lógica de Opacidade Baseada no Filtro
    const getOpacity = () => {
        if (viewMode === 'all') return 'opacity-100 scale-100';
        if (viewMode === 'gaps' && (level === 0 || (level !== null && level < pLevel))) return 'opacity-100 scale-110 z-10 shadow-lg';
        if (viewMode === 'instructors' && level !== null && level >= 3) return 'opacity-100 scale-110 z-10 shadow-lg';
        return 'opacity-10 blur-[1px] scale-90 grayscale';
    };

    // Alerta visual se Real (r) for menor que o Planejado (p)
    const isGap = level !== null && level < pLevel;

    return (
        <div 
            onClick={onClick}
            title={`${current.label}${isGap ? ' - ABAIXO DO REQUISITO!' : ''}`}
            className={`
                relative w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer 
                transition-all duration-300 hover:z-20 hover:scale-125
                ${current.bg} ${getOpacity()}
                ${isGap ? 'ring-2 ring-red-400 ring-offset-2 animate-pulse-subtle' : ''}
            `}
        >
            <Icon 
                size={18} 
                className={current.color} 
                fill={current.fill ? 'currentColor' : 'none'} 
                strokeWidth={3}
            />
            {isGap && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
            )}
            
            <style>{`
                @keyframes pulse-subtle {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                .animate-pulse-subtle { animation: pulse-subtle 2s infinite ease-in-out; }
            `}</style>
        </div>
    );
};

export default SkillCell;
