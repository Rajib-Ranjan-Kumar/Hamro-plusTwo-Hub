import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from './Logo';

export const Footer = () => {
  return (
    <footer className="border-t border-slate-700/50 py-6 sm:py-8 bg-slate-900/80 backdrop-blur-md mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
        <Logo size="sm" to="/" textClassName="text-sm font-bold text-white tracking-wide" />

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs sm:text-sm text-slate-400">
          <Link to="/about" className="hover:text-[#F4B400] transition-colors">About Us</Link>
          <Link to="/contact" className="hover:text-[#F4B400] transition-colors">Contact</Link>
          <Link to="/faq" className="hover:text-[#F4B400] transition-colors">FAQ</Link>
          <Link to="/privacy-policy" className="hover:text-[#F4B400] transition-colors">Privacy Policy</Link>
          <Link to="/terms-conditions" className="hover:text-[#F4B400] transition-colors">Terms & Conditions</Link>
          <Link to="/cookie-policy" className="hover:text-[#F4B400] transition-colors">Cookie Policy</Link>
          <Link to="/disclaimer" className="hover:text-[#F4B400] transition-colors">Disclaimer</Link>
        </div>

        <div className="text-[11px] sm:text-xs text-slate-500 text-center">
          &copy; {new Date().getFullYear()} Hamro +2 Hub. Made with love in Nepal.
        </div>
      </div>
    </footer>
  );
};
