import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900/95 rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 border border-slate-700/80 backdrop-blur-xl">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors font-semibold text-sm border border-slate-700 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-all font-bold text-sm shadow-sm hover:shadow-md cursor-pointer"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
