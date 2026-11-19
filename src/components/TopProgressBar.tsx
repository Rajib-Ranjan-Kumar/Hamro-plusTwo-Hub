import React from 'react';
import { useLoading } from '../context/LoadingContext';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2 } from 'lucide-react';

export const TopProgressBar: React.FC = () => {
  const { isLoading, progress, statusText } = useLoading();

  if (!isLoading && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none">
      {/* Progress Bar Track */}
      <div className="h-[3px] w-full bg-transparent overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-500 via-[#F4B400] to-yellow-300 shadow-[0_0_12px_rgba(244,180,0,0.85)] transition-all duration-200 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Floating Status Badge (Appears when active with a message) */}
      <AnimatePresence>
        {statusText && isLoading && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-3 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-amber-400/30 text-amber-300 text-xs shadow-lg backdrop-blur-md"
          >
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
            <span>{statusText}</span>
            <span className="font-semibold text-white ml-1">{Math.round(progress)}%</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
