import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, FileText, Upload, Trophy, CheckCircle, Users, Play, ChevronDown, Rocket, User, Loader2, AlertCircle, X, ChevronUp, Star, HelpCircle, Mail, MapPin, Phone, Github, Twitter, Youtube } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SEO } from '../components/SEO';
import { auth, googleProvider, db } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { getFirebaseErrorMessage } from '../utils/firebaseErrors';

export const Landing = () => {
  const navigate = useNavigate();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState('');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

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
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await handleSessionUpdate(result.user);
      setIsAuthModalOpen(false);
      navigate('/');
    } catch (err: any) {
      console.error("Google login failed:", err);
      setError(getFirebaseErrorMessage(err));
      setIsLoggingIn(false);
    }
  };

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#0F1115] text-white font-sans selection:bg-[#F5C21B]/30 flex flex-col relative overflow-x-hidden">
      <SEO />

      {/* 100vh Hero Fold Section */}
      <div className="relative h-screen min-h-[750px] w-full flex flex-col justify-between overflow-hidden">
        {/* Full Screen Clean Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0" 
          style={{ backgroundImage: "url('/hero-bg.jpg')" }}
        />
        
        {/* Subtle dark gradient overlay behind left-aligned text for readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-transparent z-0 pointer-events-none" />

        {/* Navbar - Positioned Top Right */}
        <motion.nav 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="absolute top-0 right-0 z-10 pt-[40px] pr-[60px] flex items-center gap-5"
        >
          {/* Language Selector Pill */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 h-[52px] px-[20px] border border-white/80 rounded-full text-white text-[22px] font-semibold hover:bg-white/10 transition-all cursor-pointer">
              <span>English</span>
              <ChevronDown className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Log In Button - Gold Pill */}
          <button 
            onClick={() => setIsAuthModalOpen(true)}
            className="bg-[#F5C21B] hover:bg-[#e0b018] text-black h-[52px] px-[30px] rounded-full font-semibold text-[20px] transition-all flex items-center gap-2 shadow-md cursor-pointer hover:scale-102"
          >
            <User className="w-5 h-5 stroke-[2.5px]" />
            <span>Log In</span>
          </button>
        </motion.nav>

        {/* Hero Left Content - Vertically Centered */}
        <div className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-6 md:px-[80px] flex flex-col justify-center">
          <div className="max-w-[520px] text-left space-y-8">
            {/* Main Title - Nepali */}
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-[72px] font-extrabold text-white leading-[1.1] tracking-tight whitespace-pre-line select-text"
            >
              तपाईँको मेहनत,{"\n"}
              हाम्रो सहयोग
            </motion.h1>

            {/* Subtitle */}
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="text-[32px] font-normal text-white leading-[1.3] whitespace-pre-line select-text"
            >
              PYQs, Notes & Study Materials{"\n"}
              for Your Success...
            </motion.p>

            {/* Interactive Action Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="flex flex-wrap items-center gap-6 pt-2"
            >
              {/* Button 1: Get Started */}
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-[#F5C21B] hover:bg-[#e0b018] text-black font-semibold text-[28px] h-[64px] w-[220px] rounded-[18px] flex items-center justify-center gap-2 transition-all hover:scale-103 shadow-lg cursor-pointer"
              >
                <span>🚀 Get Started</span>
              </button>

              {/* Button 2: Explore Now */}
              <a 
                href="#about"
                className="bg-black/35 hover:bg-black/50 border border-white/35 text-white font-normal text-[28px] h-[64px] w-[240px] rounded-[18px] flex items-center justify-center gap-2 transition-all hover:scale-102 backdrop-blur-sm cursor-pointer"
              >
                <span>▶ Explore Now</span>
              </a>
            </motion.div>
          </div>
        </div>

        {/* Empty Spacer to preserve bottom-aligned village background scenery */}
        <div className="h-16 w-full z-0" />
      </div>

      {/* About Section - Apple-inspired minimal glassmorphic features */}
      <section id="about" className="min-h-screen bg-[#0F172A] py-[100px] px-6 md:px-[100px] flex items-center border-t border-white/5 relative">
        <div className="max-w-7xl w-full mx-auto grid lg:grid-cols-2 gap-[80px] items-center">
          {/* Left Side - Embedded Video Placeholder */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-[#F5C21B] tracking-wide uppercase">Watch How Hamro +2 Works</h3>
            <div className="aspect-video w-full rounded-[24px] overflow-hidden bg-slate-900 border border-white/10 shadow-2xl relative group">
              <div className="absolute inset-0 bg-cover bg-center opacity-60" style={{ backgroundImage: "url('/hero-bg.jpg')" }} />
              <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center">
                <button className="w-20 h-20 rounded-full bg-[#F5C21B] hover:bg-[#e0b018] text-black flex items-center justify-center shadow-lg transition-transform hover:scale-105 cursor-pointer">
                  <Play className="w-8 h-8 fill-current ml-1" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Side - Why Hamro +2 */}
          <div className="space-y-8">
            <h2 className="text-[52px] font-bold text-white tracking-tight leading-none">Why Hamro +2?</h2>
            <p className="text-slate-300 text-lg leading-relaxed">
              We provide a complete study companion for +2 science and management students in Nepal. Easily access question banks, notes, exam patterns, and complete resources for your term prep.
            </p>

            <div className="grid gap-4">
              {[
                { icon: FileText, title: "Smart Learning", desc: "Access high-quality revision files, subject guides, and verified reference documents." },
                { icon: BookOpen, title: "Free Resources", desc: "No subscriptions required. Free updates on notes and solutions from top colleges." },
                { icon: CheckCircle, title: "Easy Access", desc: "Clean navigation and simple downloads for preparation on the go." }
              ].map((feat, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-md">
                  <div className="w-10 h-10 rounded-lg bg-[#F5C21B]/10 flex items-center justify-center shrink-0">
                    <feat.icon className="w-5 h-5 text-[#F5C21B]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base">{feat.title}</h4>
                    <p className="text-sm text-slate-400 mt-0.5">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="bg-[#0F1115] py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-[100px]">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-[44px] font-bold text-white tracking-tight">Everything You Need</h2>
            <p className="text-slate-400 text-lg">
              All the tools and resources you need to excel in your +2 examinations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: FileText, title: "Previous Year Questions", desc: "Detailed past papers with step-by-step solution breakdowns for revision." },
              { icon: BookOpen, title: "Structured Notes", desc: "Handwritten and typed notes from top teachers in Kathmandu Valley." },
              { icon: Upload, title: "Contribute Notes", desc: "Share your own class notes to help peers and get recognized on our platform." },
              { icon: Trophy, title: "Student Leaderboard", desc: "Earn reputation badges for verified notes uploads and correct solutions." },
              { icon: Users, title: "Peer Discussions", desc: "Ask doubts and get answers from fellow +2 students across Nepal." },
              { icon: CheckCircle, title: "Syllabus Compliance", desc: "100% updated according to the latest NEB board exam patterns." }
            ].map((feature, i) => (
              <div key={i} className="p-8 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-[#F5C21B]/50 transition-all group hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-slate-800/80 flex items-center justify-center mb-6 group-hover:bg-[#F5C21B]/10 transition-colors">
                  <feature.icon className="w-6 h-6 text-slate-400 group-hover:text-[#F5C21B] transition-all" />
                </div>
                <h3 className="text-[20px] font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Subjects Section */}
      <section className="bg-[#0F172A] py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-[100px]">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-[44px] font-bold text-white tracking-tight">Access Course Subjects</h2>
            <p className="text-slate-400 text-lg">
              Choose your course and access curated notes, questions, and guides.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Physics", count: "140+ Files", color: "from-[#F5C21B] to-[#e0b018]" },
              { title: "Chemistry", count: "120+ Files", color: "from-[#F5C21B] to-[#e0b018]" },
              { title: "Biology", count: "90+ Files", color: "from-[#F5C21B] to-[#e0b018]" },
              { title: "Mathematics", count: "150+ Files", color: "from-[#F5C21B] to-[#e0b018]" },
              { title: "Computer Science", count: "80+ Files", color: "from-[#F5C21B] to-[#e0b018]" },
              { title: "English", count: "70+ Files", color: "from-[#F5C21B] to-[#e0b018]" }
            ].map((sub, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex justify-between items-center group hover:bg-white/[0.04] transition-all cursor-pointer">
                <div>
                  <h3 className="text-[22px] font-bold text-white group-hover:text-[#F5C21B] transition-colors">{sub.title}</h3>
                  <p className="text-sm text-slate-400 mt-1">{sub.count}</p>
                </div>
                <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${sub.color} text-black flex items-center justify-center font-black group-hover:scale-105 transition-transform`}>
                  &rarr;
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-[#0F1115] py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-[100px]">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-[44px] font-bold text-white tracking-tight">Student Feedback</h2>
            <p className="text-slate-400 text-lg">
              Hear what students and contributors from colleges across Nepal say.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Aashish Shrestha", role: "St. Xavier's College", review: "The mathematics notes solved references are amazing. Saved a lot of time before my board terminals." },
              { name: "Priya Adhikari", role: "Trinity International", review: "Direct downloads and neat interface. Highly recommend for NEB board exams preparation notes." },
              { name: "Rohit Gurung", role: "KMC Lalitpur", review: "Contributing notes is highly motivating. The leaderboard badge adds a fun competitive touch." }
            ].map((test, i) => (
              <div key={i} className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between space-y-6">
                <p className="text-slate-300 italic text-base leading-relaxed">"{test.review}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#F5C21B]/20 flex items-center justify-center font-bold text-[#F5C21B]">
                    {test.name[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{test.name}</h4>
                    <p className="text-xs text-slate-500">{test.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="bg-[#0F172A] py-24 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-[44px] font-bold text-white tracking-tight">Frequently Asked Questions</h2>
            <p className="text-slate-400 text-lg">
              Quick answers to the common questions about Hamro +2 Hub.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { q: "Is Hamro +2 Hub completely free to use?", a: "Yes, access to all note files, term papers, and solutions is 100% free with no hidden charges." },
              { q: "How can I contribute my study materials?", a: "Register/Login with Google, click the Contribute tab in your dashboard, and upload your PDF files." },
              { q: "Are the resources aligned with NEB board?", a: "Yes, all materials are verified according to the latest syllabus of Nepal National Examinations Board (NEB)." },
              { q: "How does the student leaderboard badge system work?", a: "You earn repute points each time your contributed document is downloaded or approved by admin." }
            ].map((faq, i) => (
              <div key={i} className="border border-white/5 rounded-2xl overflow-hidden bg-white/[0.01]">
                <button 
                  onClick={() => toggleFaq(i)}
                  className="w-full flex justify-between items-center p-6 text-left font-bold text-lg text-white hover:bg-white/[0.02] transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${activeFaq === i ? 'rotate-180' : ''}`} />
                </button>
                <div className={`transition-all duration-300 overflow-hidden ${activeFaq === i ? 'max-h-40 border-t border-white/5 p-6' : 'max-h-0'}`}>
                  <p className="text-slate-400 text-sm leading-relaxed">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0D0D0F] border-t border-white/5 py-12 text-slate-400 text-sm">
        <div className="max-w-7xl mx-auto px-6 md:px-[100px] grid md:grid-cols-4 gap-8 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-[#F5C21B] text-black text-xs font-black px-2.5 py-1 rounded">
                +2
              </div>
              <span className="text-lg font-bold text-white">Hamro +2 Hub</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Nepal's collaborative platform for high school students. Quality resources, syllabus references, and term guides.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4 text-base">Quick Links</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/login" className="hover:text-[#F5C21B] transition-colors">Study Dashboard</Link></li>
              <li><Link to="/login" className="hover:text-[#F5C21B] transition-colors">Contribute File</Link></li>
              <li><Link to="/login" className="hover:text-[#F5C21B] transition-colors">Course Syllabus</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4 text-base">Contact Us</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> support@hamroplustwo.com</li>
              <li className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> +977-1-5555555</li>
              <li className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> Kathmandu, Nepal</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-white mb-4 text-base">Follow Us</h4>
            <div className="flex gap-4">
              <a href="#" className="w-9 h-9 rounded-full bg-white/5 hover:bg-[#F5C21B]/15 hover:text-[#F5C21B] flex items-center justify-center transition-colors"><Github className="w-4 h-4" /></a>
              <a href="#" className="w-9 h-9 rounded-full bg-white/5 hover:bg-[#F5C21B]/15 hover:text-[#F5C21B] flex items-center justify-center transition-colors"><Twitter className="w-4 h-4" /></a>
              <a href="#" className="w-9 h-9 rounded-full bg-white/5 hover:bg-[#F5C21B]/15 hover:text-[#F5C21B] flex items-center justify-center transition-colors"><Youtube className="w-4 h-4" /></a>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 md:px-[100px] border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-600">
          <div>&copy; {new Date().getFullYear()} Hamro +2 Hub. Made with love in Nepal. All rights reserved.</div>
          <div className="flex gap-6">
            <Link to="/privacy-policy" className="hover:text-slate-400">Privacy Policy</Link>
            <Link to="/terms-conditions" className="hover:text-slate-400">Terms & Conditions</Link>
          </div>
        </div>
      </footer>

      {/* Auth Modal Overlay System */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[6px] p-4"
          >
            {/* Modal Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative w-full max-w-md bg-slate-800/95 border border-slate-700/80 backdrop-blur-md rounded-3xl p-8 sm:p-10 shadow-2xl flex flex-col justify-center"
            >
              {/* Close Button */}
              <button 
                onClick={() => setIsAuthModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/5 transition-all cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="text-center mb-8">
                <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Welcome Back</h2>
                <p className="text-slate-400 text-sm">Sign in to access your study materials.</p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 text-rose-400 animate-in fade-in">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {/* Google Sign In Action */}
              <button
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
                className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-full transition-all border border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] cursor-pointer"
              >
                {isLoggingIn ? (
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    <span>Sign in with Google</span>
                  </>
                )}
              </button>

              <p className="mt-8 text-center text-sm text-slate-400">
                Don't have an account?{' '}
                <Link to="/register" className="text-[#F5C21B] hover:underline font-bold transition-all">
                  Sign Up
                </Link>
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
