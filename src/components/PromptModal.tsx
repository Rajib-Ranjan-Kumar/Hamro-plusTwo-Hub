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
    <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-700">
        <div className="flex items-center gap-4 mb-4 text-indigo-400">
          <div className="p-3 bg-indigo-900/30 rounded-full">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">{title}</h2>
        </div>
        <p className="text-slate-400 mb-4">{message}</p>
        
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-white mb-6"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') onConfirm(value);
            if (e.key === 'Escape') onCancel();
          }}
        />

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-slate-300 hover:bg-slate-700 rounded-xl transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(value)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors font-medium"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
