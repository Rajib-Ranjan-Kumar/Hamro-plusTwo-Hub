import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, FileText, Upload, Trophy, CheckCircle, Users, Sun, Moon, Play, ChevronDown, Rocket, User } from 'lucide-react';
import { motion } from 'motion/react';
import { SEO } from '../components/SEO';

export const Landing = () => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = React.useState(true);

  React.useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <div className="min-h-screen bg-[#0F1115] text-white font-sans selection:bg-[#F4B400]/30 flex flex-col relative overflow-x-hidden">
      <SEO />

      {/* Hero Fold Background and Content */}
      <div className="min-h-screen relative flex flex-col justify-between w-full">
        {/* Hero Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0" 
          style={{ backgroundImage: "url('/hero-bg.jpg')" }}
        />
        {/* Dark overlay for text readability, matching the warm sunset theme */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent z-0 pointer-events-none" />

        {/* Navbar */}
        <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 h-20 bg-black/15 backdrop-blur-sm border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="bg-[#F4B400] text-black text-xs font-black px-2.5 py-1 rounded">
              +2
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Hamro +2 Hub</span>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Language Selector Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1.5 px-4 py-1.5 border border-white/30 rounded-full text-white text-sm font-medium hover:bg-white/10 transition-all cursor-pointer">
                <span>English</span>
                <ChevronDown className="w-4 h-4 text-white/80" />
              </button>
            </div>

            {/* Log In Button - Gold Pill */}
            <Link 
              to="/login" 
              className="bg-[#F4B400] hover:bg-[#FFC107] text-[#0F1115] text-sm font-bold px-5 py-2 rounded-full transition-all hover:scale-102 flex items-center gap-1.5 shadow-lg shadow-[#F4B400]/20"
            >
              <User className="w-4 h-4 fill-current" />
              <span>Log In</span>
            </Link>
          </div>
        </nav>

        {/* Hero Content Fold - Left aligned, centered vertically */}
        <div className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-6 md:px-12 flex flex-col justify-center py-20">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-6 md:space-y-8 max-w-2xl text-left"
          >
            {/* Nepali title matching reference */}
            <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-[1.15] drop-shadow-md">
              तपाईंको मेहेनत,<br />
              हाम्रो सहयोग
            </h1>
            
            {/* Subtitle */}
            <p className="text-lg md:text-xl text-white/95 font-medium leading-relaxed max-w-md drop-shadow-sm">
              PYQs, Notes & Study Materials<br />
              for Your Success...
            </p>
            
            {/* Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link 
                to="/login" 
                className="bg-[#F4B400] hover:bg-[#FFC107] text-[#0F1115] font-bold px-8 py-3.5 rounded-full flex items-center gap-2 transition-all hover:scale-103 shadow-lg shadow-[#F4B400]/25"
              >
                <Rocket className="w-5 h-5 fill-current" />
                <span>Get Started</span>
              </Link>
              <Link 
                to="/login" 
                className="bg-black/40 hover:bg-black/60 border border-white/30 hover:border-white/50 text-white font-bold px-8 py-3.5 rounded-full flex items-center gap-2 transition-all hover:scale-102 backdrop-blur-sm"
              >
                <Play className="w-4 h-4 fill-current text-white" />
                <span>Explore Now</span>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Stat counters inside the hero fold bottom */}
        <div className="relative z-10 w-full bg-gradient-to-t from-black/60 to-transparent py-6">
          <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="text-2xl md:text-3xl font-extrabold text-[#F4B400]">50+</div>
              <div className="text-xs md:text-sm text-slate-300 mt-0.5">Colleges</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-extrabold text-[#F4B400]">1000+</div>
              <div className="text-xs md:text-sm text-slate-300 mt-0.5">Students</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-extrabold text-[#F4B400]">500+</div>
              <div className="text-xs md:text-sm text-slate-300 mt-0.5">Notes</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-extrabold text-[#F4B400]">300+</div>
              <div className="text-xs md:text-sm text-slate-300 mt-0.5">Questions</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="relative z-10 bg-[#0F1115] py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need</h2>
            <p className="text-slate-400">
              All the resources you need to excel in your +2 exams, organized by your college.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: FileText,
                title: 'Previous Year Questions',
                desc: 'Access question papers from all terms with verified solutions.'
              },
              {
                icon: BookOpen,
                title: 'Syllabus & Notes',
                desc: 'Complete syllabus and structured notes for every subject.'
              },
              {
                icon: Upload,
                title: 'Contribute & Earn',
                desc: 'Share your notes and earn rewards for helping others.'
              },
              {
                icon: Trophy,
                title: 'Leaderboard',
                desc: 'Compete with peers and earn badges for your contributions.'
              }
            ].map((feature, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-panel p-8 rounded-2xl hover:border-[#F4B400]/50 transition-colors group hover-lift"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-800/50 flex items-center justify-center mb-6 group-hover:bg-[#F4B400]/10 transition-colors">
                  <feature.icon className="w-6 h-6 text-slate-400 group-hover:text-[#F4B400] transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 bg-[#0F1115] py-24 max-w-7xl mx-auto px-6 md:px-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-[#F4B400] to-[#FFC107] rounded-3xl p-12 relative overflow-hidden shadow-2xl shadow-yellow-900/10 text-[#0F1115]"
        >
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 -mb-16 w-48 h-48 bg-black/5 rounded-full blur-2xl"></div>
          
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Learning?</h2>
            <p className="text-[#0F1115]/80 text-lg mb-8 font-medium">
              Join thousands of +2 students across Nepal. Access quality study materials and contribute to help your peers succeed.
            </p>
            <Link 
              to="/login" 
              className="inline-flex items-center gap-2 bg-[#0F1115] hover:bg-slate-900 text-white font-bold px-6 py-3 rounded-full transition-colors hover-lift"
            >
              Create Free Account <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-[#0F1115] border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-[#F4B400] text-black text-xs font-black px-2.5 py-1 rounded">
              +2
            </div>
            <span className="text-sm font-bold text-white">Hamro +2 Hub</span>
          </div>
          
          <div className="text-xs text-slate-500 flex items-center gap-4">
            <span>Frontend Preview Only. Please wake servers to enable backend functionality.</span>
            <button className="bg-[#F4B400]/10 text-[#F4B400] px-3 py-1 rounded-full border border-[#F4B400]/20">
              Wake up servers
            </button>
          </div>
          
          <div className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} Hamro +2 Hub. Made with love in Nepal.
          </div>
        </div>
      </footer>
    </div>
  );
};
