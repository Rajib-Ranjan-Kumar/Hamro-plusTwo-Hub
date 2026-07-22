import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, ChevronDown, Rocket, User } from 'lucide-react';
import { motion } from 'motion/react';
import { SEO } from '../components/SEO';

export const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-screen relative bg-cover bg-center bg-no-repeat overflow-hidden flex flex-col justify-between" style={{ backgroundImage: "url('/hero-bg.jpg')" }}>
      <SEO />
      
      {/* Dark overlay for contrast on the left side */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent z-0"></div>

      {/* Navbar */}
      <nav className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 h-20 flex items-center justify-between">
        {/* Left Side: Empty or Logo */}
        <div className="flex items-center gap-2">
          <div className="bg-[#F4B400] text-black text-xs font-black px-2.5 py-1 rounded-md">
            +2
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Hamro +2 Hub</span>
        </div>

        {/* Right Side: Language select & Login button */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-4 py-2 border border-white/20 hover:bg-white/10 rounded-full text-white text-sm font-medium transition-all cursor-pointer backdrop-blur-sm">
            <span>English</span>
            <ChevronDown className="w-4 h-4 text-white/80" />
          </div>
          
          <Link 
            to="/login" 
            className="bg-[#F4B400] hover:bg-[#FFC107] text-black font-extrabold px-6 py-2.5 rounded-full text-sm flex items-center gap-2 transition-all hover:scale-105 shadow-lg shadow-amber-500/20"
          >
            <User className="w-4 h-4 text-black" />
            <span>Log In</span>
          </Link>
        </div>
      </nav>

      {/* Hero Content */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 flex-1 flex flex-col justify-center pb-24 md:pb-32">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-2xl space-y-6 text-left"
        >
          <h1 className="text-5xl md:text-[80px] font-extrabold text-white leading-tight tracking-tight font-sans">
            तपाईंको मेहेनत,<br />
            हाम्रो सहयोग
          </h1>
          
          <p className="text-xl md:text-2xl text-white/80 leading-relaxed font-medium font-sans">
            PYQs, Notes & Study Materials<br />
            for Your Success...
          </p>
          
          <div className="flex flex-wrap items-center gap-4 pt-6">
            <Link 
              to="/login" 
              className="bg-[#F4B400] hover:bg-[#FFC107] text-black font-extrabold px-8 py-3.5 rounded-full flex items-center gap-2 transition-all hover:scale-105 hover-lift shadow-lg shadow-amber-500/20"
            >
              <Rocket className="w-5 h-5 text-black" />
              <span>Get Started</span>
            </Link>
            
            <Link 
              to="/login" 
              className="bg-black/35 hover:bg-black/55 border border-white/20 text-white font-bold px-8 py-3.5 rounded-full flex items-center gap-2 transition-all hover:scale-105 hover-lift backdrop-blur-sm"
            >
              <Play className="w-4 h-4 fill-white text-white" />
              <span>Explore Now</span>
            </Link>
          </div>
        </motion.div>
      </main>

      {/* Bottom Area: Simple Footer or spacing */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 py-6 flex justify-between items-center text-xs text-white/40">
        <div>&copy; {new Date().getFullYear()} Hamro +2 Hub. Made with love in Nepal.</div>
        <div className="flex items-center gap-4">
          <Link to="/legal/privacy" className="hover:text-white/70 transition-colors">Privacy Policy</Link>
          <Link to="/legal/terms" className="hover:text-white/70 transition-colors">Terms of Service</Link>
        </div>
      </div>
    </div>
  );
};
