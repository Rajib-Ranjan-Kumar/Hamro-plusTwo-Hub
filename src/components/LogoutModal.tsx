import React from 'react';
import { createPortal } from 'react-dom';
import { LogOut, X } from 'lucide-react';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const LogoutModal = ({ isOpen, onClose, onConfirm }: LogoutModalProps) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900/95 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-700/80 backdrop-blur-xl">
        <div className="p-6 sm:p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-4">
            <LogOut className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2 tracking-tight">Sign Out</h2>
          <p className="text-sm text-slate-300 leading-relaxed mb-6">Are you sure you want to sign out from Hamro +2 Hub?</p>
          
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold rounded-xl transition-colors border border-slate-700 text-sm cursor-pointer"
            >
              Cancel
            </button>
            <button 
              onClick={onConfirm}
              className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition-all text-sm shadow-sm hover:shadow-md cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
