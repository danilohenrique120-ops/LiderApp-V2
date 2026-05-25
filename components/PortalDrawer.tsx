
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface PortalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

const PortalDrawer: React.FC<PortalDrawerProps> = ({ isOpen, onClose, children, title }) => {
  // Impede o scroll do body quando o drawer estiver aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex justify-end overflow-hidden">
      {/* Backdrop com Blur */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity animate-fade"
        onClick={onClose}
      />
      
      {/* Painel Lateral (Drawer) */}
      <div className="relative w-full md:w-3/4 lg:w-2/3 xl:w-[800px] bg-slate-50 shadow-2xl h-full flex flex-col animate-slide-right overflow-hidden">
        {/* Header Fixo */}
        <div className="flex items-center justify-between px-8 py-6 bg-white border-b shadow-sm z-10">
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">
            {title || 'Detalhes da Jornada'}
          </h3>
          <button 
            onClick={onClose}
            className="p-3 bg-slate-100 text-slate-400 hover:text-red-500 rounded-2xl transition-all shadow-sm"
          >
            <X size={24} />
          </button>
        </div>

        {/* Conteúdo com Scroll Próprio */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-slate-50">
          {children}
        </div>
      </div>

      <style>{`
        @keyframes slideRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-right { animation: slideRight 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
      `}</style>
    </div>,
    document.body
  );
};

export default PortalDrawer;
