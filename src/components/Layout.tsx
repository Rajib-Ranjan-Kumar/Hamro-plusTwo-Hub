import React, { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { Menu, X } from 'lucide-react';
import { CompleteProfileModal } from './CompleteProfileModal';
import { motion, AnimatePresence } from 'motion/react';
import { SEO } from './SEO';

export const Layout = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (isLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/landing" replace />;

  return (
    <div className="flex h-screen bg-slate-900 text-white overflow-hidden relative">
      <SEO />
      {/* Background Image - nature Inspired */}
      <div className="absolute inset-0 z-0 pointer-events-none site-bg opacity-75">
        <div className="absolute inset-0 bg-[#080A0E]/40 z-10"></div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 sm:h-16 bg-slate-900/90 backdrop-blur-xl border-b border-slate-700/60 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2 select-none">
          <div className="bg-[#F4B400] text-black text-[10px] font-black h-[28px] w-[28px] flex items-center justify-center rounded-[6px] shadow-[0_0_8px_rgba(244,180,0,0.3)]">
            +2
          </div>
          <h1 className="text-base sm:text-lg font-bold text-white tracking-wide">Hamro +2 Hub</h1>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle navigation menu"
          className="p-2 text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
        </button>
      </div>

      <Sidebar isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />
      
      <main className="flex-1 min-w-0 overflow-y-auto relative z-10 flex flex-col">
        <div className="flex-1 p-3.5 sm:p-6 md:p-8 pt-18 sm:pt-20 md:pt-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
        <Footer />
      </main>

      {!user.college_id && <CompleteProfileModal />}
    </div>
  );
};
