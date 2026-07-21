import React from 'react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 py-8 bg-white dark:bg-slate-900 mt-auto">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-600 text-white text-xs font-bold px-2 py-1 rounded">
            +2
          </div>
          <span className="text-sm font-bold text-white">Hamro +2 Hub</span>
        </div>
        
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-400">
          <Link to="/about" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">About Us</Link>
          <Link to="/contact" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Contact</Link>
          <Link to="/faq" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">FAQ</Link>
          <Link to="/privacy-policy" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Privacy Policy</Link>
          <Link to="/terms-conditions" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Terms & Conditions</Link>
          <Link to="/cookie-policy" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Cookie Policy</Link>
          <Link to="/disclaimer" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Disclaimer</Link>
        </div>
        
        <div className="text-xs text-slate-500 dark:text-slate-500">
          &copy; {new Date().getFullYear()} Hamro +2 Hub. Made with love in Nepal.
        </div>
      </div>
    </footer>
  );
};
