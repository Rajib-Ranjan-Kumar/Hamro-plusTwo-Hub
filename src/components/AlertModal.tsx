import React from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';

interface AlertModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

export const AlertModal: React.FC<AlertModalProps> = ({ isOpen, title, message, onClose }) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900/95 rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 border border-slate-700/80 backdrop-blur-xl">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-[#F5C21B] shrink-0">
            <Info className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed mb-6">{message}</p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition-all font-bold text-sm shadow-sm hover:shadow-md cursor-pointer"
          >
            OK
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
