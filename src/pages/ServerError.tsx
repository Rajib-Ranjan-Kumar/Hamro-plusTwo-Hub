import React from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, Home, HelpCircle, ShieldAlert } from 'lucide-react';
import { SEO } from '../components/SEO';

export const ServerError: React.FC = () => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <SEO 
        title="Temporary Glitch (500) - Hamro +2 Hub" 
        description="Our servers are experiencing a brief hiccup. We are working on getting things back to normal."
      />
      
      <div className="text-center max-w-lg w-full bg-slate-800/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-700/80 shadow-2xl space-y-6">
        <div className="w-16 h-16 bg-amber-400/10 border border-amber-400/25 text-[#F5C21B] rounded-2xl flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(245,194,27,0.15)]">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-xs font-semibold text-amber-300">
            Status: 500
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Temporary Server Hiccup
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed pt-1">
            Our servers are taking a brief breather. No need to panic—everything is saved and our system will be right back up.
          </p>
          <p className="text-slate-400 text-xs sm:text-sm">
            Please try reloading the page in a few seconds or head back to the home screen.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button 
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto px-6 py-3 bg-[#F5C21B] hover:bg-[#e0b018] text-black font-semibold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
          <Link 
            to="/" 
            className="w-full sm:w-auto px-6 py-3 bg-slate-700/80 hover:bg-slate-700 text-white font-medium text-sm rounded-xl transition-all border border-slate-600 flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>

        <div className="pt-4 border-t border-slate-700/60 text-xs text-slate-400">
          <Link 
            to="/contact" 
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Still experiencing trouble? Report to support</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
