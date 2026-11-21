import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle } from 'lucide-react';

interface PromptModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  placeholder?: string;
  defaultValue?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export const PromptModal: React.FC<PromptModalProps> = ({ 
  isOpen, 
  title, 
  message, 
  placeholder = '', 
  defaultValue = '', 
  onConfirm, 
  onCancel 
}) => {
  const [value, setValue] = useState(defaultValue);

  React.useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
    }
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900/95 rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 border border-slate-700/80 backdrop-blur-xl">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-[#F5C21B] shrink-0">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed mb-4">{message}</p>
        
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 outline-none text-white mb-6 placeholder-slate-500 transition-all"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') onConfirm(value);
            if (e.key === 'Escape') onCancel();
          }}
        />

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors font-semibold text-sm border border-slate-700 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(value)}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all text-sm shadow-sm hover:shadow-md cursor-pointer"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
