import React from 'react';
import { Link } from 'react-router-dom';
import { ServerCrash, RotateCcw } from 'lucide-react';

export const ServerError = () => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center p-6 bg-amber-100 dark:bg-amber-900/30 rounded-full mb-8">
          <ServerCrash className="w-16 h-16 text-amber-600 dark:text-amber-400" />
        </div>
        <h1 className="text-6xl font-black text-white mb-4 tracking-tight">500</h1>
        <h2 className="text-2xl font-bold text-slate-200 mb-4">Internal Server Error</h2>
        <p className="text-slate-400 mb-8">
          Oops! Something went wrong on our end. We're working to fix it.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors shadow-sm shadow-indigo-600/20"
          >
            <RotateCcw className="w-5 h-5" />
            Try Again
          </button>
          <Link 
            to="/" 
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-300 font-medium rounded-xl border border-slate-700 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};
