import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, FileText, Upload, Trophy, CheckCircle, Users, Sun, Moon } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-emerald-500/30">
      <SEO />
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-600 text-white text-xs font-bold px-2 py-1 rounded">
            +2
          </div>
          <span className="text-xl font-bold tracking-tight">Hamro +2 Hub</span>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <button 
            onClick={() => setIsDark(!isDark)}
            className="text-slate-400 hover:text-white transition-colors hidden sm:block"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <Link to="/login" className="text-sm font-medium hover:text-emerald-400 transition-colors hidden sm:block">
            Log in
          </Link>
          <Link 
            to="/login" 
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-4 py-2 sm:px-5 rounded-full transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-12 sm:pt-20 pb-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="space-y-6 sm:space-y-8 text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20 mx-auto lg:mx-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Nepal's #1 +2 Academic Platform
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
              Your Complete <br className="hidden sm:block" />
              <span className="text-emerald-500">+2 Study</span> Hub
            </h1>
            
            <p className="text-base sm:text-lg text-slate-400 max-w-xl leading-relaxed mx-auto lg:mx-0">
              Access notes, syllabus, previous year questions, and verified solutions from your college. Contribute and earn while helping fellow students.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link 
                to="/login" 
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-8 py-3.5 rounded-full flex items-center justify-center gap-2 transition-all hover:gap-3 hover-lift"
              >
                Start Learning Free <span aria-hidden="true">&rarr;</span>
              </Link>
              <Link 
                to="/login" 
                className="w-full sm:w-auto bg-transparent border border-slate-700 hover:border-slate-500 text-white font-medium px-8 py-3.5 rounded-full transition-colors hover-lift text-center"
              >
                I have an account
              </Link>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-transparent rounded-3xl blur-3xl"></div>
            <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1543731068-7e0f5beff43a?q=80&w=2070&auto=format&fit=crop" 
                alt="Students in Nepal Nature" 
                referrerPolicy="no-referrer"
                className="w-full h-[600px] object-cover hover:scale-105 transition-transform duration-700"
              />
              
              {/* Floating Cards */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="hidden sm:flex absolute top-1/3 -left-6 glass-panel p-4 rounded-xl items-center gap-4 animate-bounce" style={{ animationDuration: '3s' }}
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Verified Solutions</div>
                  <div className="text-xs text-slate-400">Expert reviewed</div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="hidden sm:flex absolute bottom-1/4 -right-6 glass-panel p-4 rounded-xl items-center gap-4 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">1000+ Students</div>
                  <div className="text-xs text-slate-400">Active community</div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-16 mt-16 border-t border-slate-800 max-w-3xl">
          <div>
            <div className="text-3xl font-bold text-white">50+</div>
            <div className="text-sm text-slate-500 mt-1">Colleges</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white">1000+</div>
            <div className="text-sm text-slate-500 mt-1">Students</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white">500+</div>
            <div className="text-sm text-slate-500 mt-1">Notes</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white">300+</div>
            <div className="text-sm text-slate-500 mt-1">Questions</div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="bg-[#0F172A] py-24 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
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
                className="glass-panel p-8 rounded-2xl hover:border-emerald-500/50 transition-colors group hover-lift"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-800/50 flex items-center justify-center mb-6 group-hover:bg-emerald-500/10 transition-colors">
                  <feature.icon className="w-6 h-6 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-3xl p-12 relative overflow-hidden shadow-2xl shadow-emerald-900/50"
        >
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-slate-800/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 -mb-16 w-48 h-48 bg-black/10 rounded-full blur-2xl"></div>
          
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Start Learning?</h2>
            <p className="text-emerald-50 text-lg mb-8">
              Join thousands of +2 students across Nepal. Access quality study materials and contribute to help your peers succeed.
            </p>
            <Link 
              to="/login" 
              className="inline-flex items-center gap-2 bg-[#022c22] hover:bg-slate-900 text-white font-medium px-6 py-3 rounded-full transition-colors hover-lift"
            >
              Create Free Account <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-600 text-white text-xs font-bold px-2 py-1 rounded">
              +2
            </div>
            <span className="text-sm font-bold text-white">Hamro +2 Hub</span>
          </div>
          
          <div className="text-xs text-slate-500 flex items-center gap-4">
            <span>Frontend Preview Only. Please wake servers to enable backend functionality.</span>
            <button className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20">
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
