import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Footer } from './Footer';
import { SEO } from './SEO';
import { Sparkles, ArrowRight } from 'lucide-react';

interface PublicLayoutProps {
  children?: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col relative overflow-x-hidden selection:bg-[#F5C21B]/30">
      <SEO />

      {/* Nature-inspired background with subtle dark overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none site-bg opacity-75">
        <div className="absolute inset-0 bg-[#080A0E]/75 z-10"></div>
      </div>

      {/* Public Navigation Header */}
      <header className="sticky top-0 left-0 right-0 h-16 bg-slate-900/85 backdrop-blur-xl border-b border-slate-700/60 z-50 px-4 sm:px-8 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 select-none group">
          <div className="bg-[#F4B400] text-black text-xs font-black h-8 w-8 flex items-center justify-center rounded-lg shadow-[0_0_12px_rgba(244,180,0,0.35)] group-hover:scale-105 transition-transform">
            +2
          </div>
          <span className="text-base sm:text-lg font-bold text-white tracking-wide">Hamro +2 Hub</span>
        </Link>

        {/* Navigation links */}
        <nav className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm font-medium">
          <Link 
            to="/" 
            className="text-slate-300 hover:text-white transition-colors"
          >
            Home
          </Link>
          <Link 
            to="/about" 
            className="text-slate-300 hover:text-white transition-colors"
          >
            About
          </Link>
          <Link 
            to="/contact" 
            className="text-slate-300 hover:text-white transition-colors"
          >
            Contact
          </Link>
          <Link 
            to="/faq" 
            className="hidden sm:inline-block text-slate-300 hover:text-white transition-colors"
          >
            FAQ
          </Link>

          <Link
            to="/"
            className="ml-2 px-3.5 py-1.5 sm:px-4 sm:py-2 bg-[#F5C21B] hover:bg-[#e0b018] text-black font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <span>Sign In</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </nav>
      </header>

      {/* Main Page Content */}
      <main className="flex-1 relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {children || <Outlet />}
      </main>

      {/* Footer */}
      <div className="relative z-10 mt-auto">
        <Footer />
      </div>
    </div>
  );
};
