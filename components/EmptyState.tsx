
import React from 'react';
import { PlusCircle, Database, ArrowRight, Layout } from 'lucide-react';

interface EmptyStateProps {
    title?: string;
    description?: string;
    primaryActionLabel?: string;
    onPrimaryAction?: () => void;
    onSecondaryAction?: () => void;
    height?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
    title = "Comece a transformar sua gestão", 
    description = "A excelência operacional começa com o primeiro dado. Configure seu time para desbloquear insights poderosos.", 
    primaryActionLabel = "Cadastrar Colaboradores",
    onPrimaryAction,
    onSecondaryAction,
    height = "h-80"
}) => {
    return (
        <div className={`w-full ${height} flex flex-col items-center justify-center p-8 bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-200 animate-fade`}>
            <div className="relative mb-6">
                <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-blue-500 relative z-10 border border-slate-100">
                    <Layout size={36} strokeWidth={1.5} />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 animate-bounce shadow-sm">
                    <PlusCircle size={16} />
                </div>
                <div className="absolute inset-0 bg-blue-500/5 blur-3xl rounded-full scale-150"></div>
            </div>

            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight text-center max-w-xs leading-tight">
                {title}
            </h3>
            <p className="text-slate-400 text-xs font-medium text-center mt-3 max-w-xs leading-relaxed">
                {description}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-8 w-full max-w-xs sm:max-w-none justify-center">
                <button 
                    onClick={onPrimaryAction}
                    className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                >
                    <PlusCircle size={14} /> {primaryActionLabel}
                </button>
                
                {onSecondaryAction && (
                    <button 
                        onClick={onSecondaryAction}
                        className="px-6 py-3 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                    >
                        <Database size={14} /> Ver Exemplo
                    </button>
                )}
            </div>
        </div>
    );
};

export default EmptyState;
