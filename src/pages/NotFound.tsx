import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search, BookOpen, ArrowLeft } from 'lucide-react';
import { SEO } from '../components/SEO';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <SEO 
        title="Page Not Found (404) - Hamro +2 Hub" 
        description="The page you are looking for does not exist or may have been moved."
      />
      
      <div className="text-center max-w-lg w-full bg-slate-800/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-700/80 shadow-2xl space-y-6">
        <div className="w-16 h-16 bg-amber-400/10 border border-amber-400/25 text-[#F5C21B] rounded-2xl flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(245,194,27,0.15)]">
          <Search className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-xs font-semibold text-amber-300">
            Error 404
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Page Not Found
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed pt-1">
            Oops! The page, question paper, or document you're looking for doesn't exist or may have been moved.
          </p>
          <p className="text-slate-400 text-xs sm:text-sm">
            Please check the URL in your address bar or use the navigation shortcuts below.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link 
            to="/" 
            className="w-full sm:w-auto px-6 py-3 bg-[#F5C21B] hover:bg-[#e0b018] text-black font-semibold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Go to Homepage</span>
          </Link>
          <button 
            onClick={() => window.history.back()}
            className="w-full sm:w-auto px-6 py-3 bg-slate-700/80 hover:bg-slate-700 text-white font-medium text-sm rounded-xl transition-all border border-slate-600 flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
        </div>

        <div className="pt-4 border-t border-slate-700/60 text-xs text-slate-400">
          <span>Need help finding notes or syllabus? </span>
          <Link to="/contact" className="text-[#F5C21B] hover:underline font-medium">
            Contact us
          </Link>
        </div>
      </div>
    </div>
  );
};
