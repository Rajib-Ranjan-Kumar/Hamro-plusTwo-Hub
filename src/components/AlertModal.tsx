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
    <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-700">
        <div className="flex items-center gap-4 mb-4 text-emerald-400">
          <div className="p-3 bg-emerald-900/30 rounded-full">
            <Info className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">{title}</h2>
        </div>
        <p className="text-slate-400 mb-6">{message}</p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors font-medium"
          >
            OK
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
