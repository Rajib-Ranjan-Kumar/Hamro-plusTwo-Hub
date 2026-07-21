import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';

export const NotFound = () => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center p-6 bg-rose-100 dark:bg-rose-900/30 rounded-full mb-8">
          <AlertCircle className="w-16 h-16 text-rose-600 dark:text-rose-400" />
        </div>
        <h1 className="text-6xl font-black text-white mb-4 tracking-tight">404</h1>
        <h2 className="text-2xl font-bold text-slate-200 mb-4">Page Not Found</h2>
        <p className="text-slate-400 mb-8">
          Oops! The page you are looking for doesn't exist or has been moved.
        </p>
        <Link 
          to="/" 
          className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors shadow-sm shadow-indigo-600/20"
        >
          <Home className="w-5 h-5" />
          Back to Home
        </Link>
      </div>
    </div>
  );
};
