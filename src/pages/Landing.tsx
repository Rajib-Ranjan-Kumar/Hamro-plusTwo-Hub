import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, FileText, Upload, Trophy, CheckCircle, Users, Sun, Moon, Play, ChevronDown, Rocket, User, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { SEO } from '../components/SEO';
import { auth, googleProvider, db } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { getFirebaseErrorMessage } from '../utils/firebaseErrors';

export const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isDark, setIsDark] = React.useState(true);
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);
  const [loginError, setLoginError] = React.useState('');

  React.useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const handleSessionUpdate = async (firebaseUser: any) => {
    const newSessionId = Date.now().toString() + Math.random().toString(36).substring(2);
    localStorage.setItem(`session_${firebaseUser.uid}`, newSessionId);
    
    const userRef = doc(db, 'users', firebaseUser.uid);
    await updateDoc(userRef, { session_id: newSessionId }).catch(() => {
      // If doc doesn't exist, AuthContext will handle creation
    });
  };

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setLoginError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await handleSessionUpdate(result.user);
      navigate('/');
    } catch (err: any) {
      console.error("Google login failed:", err);
      setLoginError(getFirebaseErrorMessage(err));
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1115] text-white font-sans selection:bg-[#F4B400]/30 flex flex-col relative overflow-x-hidden">
      <SEO />

      {/* Hero Fold Background and Content */}
      <div className="min-h-screen relative flex flex-col justify-between w-full">
        {/* Hero Background Image - Using the custom user-uploaded png containing pre-rendered texts */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0" 
          style={{ backgroundImage: "url('/hero-bg-login.png')" }}
        />
        {/* Soft overlay to match dark gold design system */}
        <div className="absolute inset-0 bg-black/10 z-0 pointer-events-none" />

        {/* Navbar */}
        <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 h-20 bg-black/5 backdrop-blur-[2px]">
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
          </div>
        </nav>

        {/* Hero Content Fold - Left aligned, centered vertically */}
        <div className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-6 md:px-12 flex flex-col justify-center py-20">
          <div className="space-y-6 md:space-y-8 max-w-2xl text-left">
            {/* Invisible elements to match pre-rendered background text height and alignment */}
            <h1 className="text-5xl md:text-7xl font-extrabold opacity-0 pointer-events-none select-none leading-[1.15]">
              तपाईंको मेहेनत,<br />
              हाम्रो सहयोग
            </h1>
            
            <p className="text-lg md:text-xl opacity-0 pointer-events-none select-none max-w-md leading-relaxed">
              PYQs, Notes & Study Materials<br />
              for Your Success...
            </p>
            
            {/* Buttons Row - Fully interactive and visible! */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              {user ? (
                <Link 
                  to="/dashboard" 
                  className="bg-[#F4B400] hover:bg-[#FFC107] text-[#0F1115] font-bold px-8 py-3.5 rounded-full flex items-center gap-2 transition-all hover:scale-103 shadow-lg shadow-[#F4B400]/25"
                >
                  <span>Go to Dashboard</span>
                  <span aria-hidden="true">&rarr;</span>
                </Link>
              ) : (
                <button 
                  onClick={handleGoogleLogin}
                  disabled={isLoggingIn}
                  className="bg-[#F4B400] hover:bg-[#FFC107] text-[#0F1115] font-bold px-8 py-3.5 rounded-full flex items-center gap-3 transition-all hover:scale-103 shadow-lg shadow-[#F4B400]/25 disabled:opacity-50 cursor-pointer"
                >
                  {isLoggingIn ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="currentColor" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor" />
                    </svg>
                  )}
                  <span>Sign in with Google</span>
                </button>
              )}

              {/* Transparent interactive hitbox overlay over the pre-rendered 'Explore Now' background button */}
              <Link 
                to={user ? "/dashboard" : "/login"} 
                className="bg-transparent border border-transparent text-transparent font-bold px-8 py-3.5 rounded-full cursor-pointer select-none"
              >
                Explore Now
              </Link>
            </div>

            {loginError && (
              <div className="text-rose-500 font-bold text-sm bg-rose-950/20 border border-rose-500/30 px-4 py-2 rounded-xl max-w-sm">
                {loginError}
              </div>
            )}
          </div>
        </div>

        {/* Transparent bottom spacer to align with stats */}
        <div className="relative z-10 w-full py-6">
          <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-2 md:grid-cols-4 gap-6 opacity-0 select-none pointer-events-none">
            <div>
              <div className="text-2xl md:text-3xl font-extrabold text-[#F4B400]">50+</div>
              <div className="text-xs md:text-sm text-slate-300 mt-0.5">Colleges</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-extrabold text-[#F4B400]">1000+</div>
              <div className="text-xs md:text-sm text-slate-300 mt-0.5">Students</div>
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
