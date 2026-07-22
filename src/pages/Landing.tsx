import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, FileText, Upload, Trophy, CheckCircle, Users, Play, ChevronDown, Rocket, User, Loader2, AlertCircle, X, Mail, MapPin, Phone, Github, Twitter, Youtube, Menu, ArrowRight, Shield, Zap, Heart, Check, Clock, Globe, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SEO } from '../components/SEO';
import { auth, googleProvider, db } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { getFirebaseErrorMessage } from '../utils/firebaseErrors';

export const Landing = () => {
  const navigate = useNavigate();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState('');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Force Light mode styling on Landing Page mount, restore dark mode on unmount
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    return () => {
      document.documentElement.classList.add('dark');
    };
  }, []);

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
      console.error("Google auth failed:", err);
      setError(getFirebaseErrorMessage(err));
      setIsLoggingIn(false);
    }
  };

  const openAuthModal = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
    setIsMobileMenuOpen(false);
  };

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-600/30 flex flex-col relative overflow-x-hidden">
      <SEO />

      {/* Sticky Premium Navbar */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md z-40 border-b border-slate-100 px-6 md:px-[60px] py-4 flex items-center justify-between transition-all">
        {/* Left Side: Logo */}
        <div className="flex items-center gap-2">
          <div className="bg-[#2563EB] text-white text-xs font-black px-2.5 py-1 rounded">
            +2
          </div>
          <span className="text-xl font-bold tracking-tight text-[#111827]">Hamro +2 Hub</span>
        </div>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-600">
          <a href="#" className="hover:text-[#2563EB] transition-colors">Home</a>
          <a href="#about" className="hover:text-[#2563EB] transition-colors">Explore</a>
          <a href="#features" className="hover:text-[#2563EB] transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-[#2563EB] transition-colors">How it Works</a>
          <a href="#faq" className="hover:text-[#2563EB] transition-colors">FAQ</a>
        </nav>

        {/* Right Side: Language & Auth Actions */}
        <div className="hidden lg:flex items-center gap-4">
          <div className="relative group">
            <button className="flex items-center gap-1.5 h-[36px] px-[14px] border border-slate-200 rounded-full text-slate-700 text-[14px] font-semibold hover:bg-slate-50 transition-all cursor-pointer">
              <span>English</span>
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          <button 
            onClick={() => openAuthModal('login')}
            className="border border-[#2563EB] hover:bg-blue-50 text-[#2563EB] h-[36px] px-[21px] rounded-full font-semibold text-[14px] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer hover:scale-102"
          >
            <User className="w-4 h-4" />
            <span>Log In</span>
          </button>

          <button 
            onClick={() => openAuthModal('signup')}
            className="bg-[#2563EB] hover:bg-blue-700 text-white h-[36px] px-[21px] rounded-full font-semibold text-[14px] transition-all flex items-center gap-1.5 shadow-md cursor-pointer hover:scale-102"
          >
            <span>Get Started</span>
          </button>
        </div>

        {/* Mobile Hamburger Menu Toggle */}
        <div className="lg:hidden flex items-center gap-3">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Mobile Slide-Down Dropdown Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-b border-slate-100 flex flex-col px-6 py-6 space-y-4 shadow-lg z-30"
          >
            <a href="#" onClick={() => setIsMobileMenuOpen(false)} className="font-semibold text-slate-700 hover:text-[#2563EB]">Home</a>
            <a href="#about" onClick={() => setIsMobileMenuOpen(false)} className="font-semibold text-slate-700 hover:text-[#2563EB]">Explore</a>
            <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="font-semibold text-slate-700 hover:text-[#2563EB]">Features</a>
            <a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="font-semibold text-slate-700 hover:text-[#2563EB]">How it Works</a>
            <a href="#faq" onClick={() => setIsMobileMenuOpen(false)} className="font-semibold text-slate-700 hover:text-[#2563EB]">FAQ</a>
            <hr className="border-slate-100" />
            <div className="flex items-center gap-3 pt-2">
              <button 
                onClick={() => openAuthModal('login')}
                className="flex-1 border border-[#2563EB] hover:bg-blue-50 text-[#2563EB] h-[40px] rounded-full font-semibold text-sm transition-all flex items-center justify-center gap-1.5"
              >
                <User className="w-4 h-4" />
                <span>Log In</span>
              </button>
              <button 
                onClick={() => openAuthModal('signup')}
                className="flex-1 bg-[#2563EB] hover:bg-blue-700 text-white h-[40px] rounded-full font-semibold text-sm transition-all flex items-center justify-center"
              >
                <span>Get Started</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section: White background with soft blue gradients */}
      <section className="relative min-h-[90vh] flex items-center pt-10 pb-20 px-6 md:px-[80px] bg-gradient-to-b from-blue-50/50 via-white to-slate-50 overflow-hidden">
        {/* Background illustration vectors */}
        <div className="absolute top-[10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-100/40 blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-[5%] left-[-5%] w-[300px] h-[300px] rounded-full bg-orange-100/40 blur-2xl -z-10 pointer-events-none" />

        <div className="max-w-7xl w-full mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column: Heading text and CTAs */}
          <div className="text-left space-y-6 lg:max-w-[560px]">
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/50 text-[#2563EB] text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Premium High School Portal of Nepal</span>
            </div>

            {/* Title (Nepali, Unchanged size) */}
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-[72px] font-extrabold text-[#111827] leading-[1.1] tracking-tight whitespace-pre-line"
            >
              तपाईँको मेहनत,{"\n"}
              हाम्रो सहयोग
            </motion.h1>

            {/* Subtitle (Unchanged size) */}
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-[32px] font-normal text-slate-600 leading-[1.3] whitespace-pre-line"
            >
              PYQs, Notes & Study Materials{"\n"}
              for Your Success...
            </motion.p>

            {/* CTA Actions */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-wrap items-center gap-[16px] pt-4"
            >
              <button 
                onClick={() => openAuthModal('signup')}
                className="bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-[20px] h-[45px] w-[154px] rounded-[12px] flex items-center justify-center gap-1.5 transition-all hover:scale-103 shadow-lg cursor-pointer"
              >
                <span>🚀 Get Started</span>
              </button>

              <a 
                href="#about"
                className="border border-slate-200 bg-white/70 hover:bg-slate-50 text-[#111827] font-semibold text-[20px] h-[45px] w-[168px] rounded-[12px] flex items-center justify-center gap-1.5 transition-all hover:scale-102 shadow-sm cursor-pointer"
              >
                <span>▶ Explore</span>
              </a>
            </motion.div>

            {/* Verified/Secure Bullet Indicators */}
            <div className="flex flex-wrap items-center gap-4 pt-6 text-xs font-semibold text-slate-500">
              <span className="flex items-center gap-1"><Check className="w-4 h-4 text-emerald-600" /> Verified Documents</span>
              <span className="flex items-center gap-1"><Check className="w-4 h-4 text-emerald-600" /> Secure Login</span>
              <span className="flex items-center gap-1"><Check className="w-4 h-4 text-emerald-600" /> Easy Access</span>
            </div>
          </div>

          {/* Right Column: Premium Illustration & Stats Badges */}
          <div className="relative flex justify-center items-center">
            {/* Main village path scenic clean background container */}
            <div className="w-full max-w-[500px] aspect-[4/3] rounded-[24px] overflow-hidden shadow-2xl border border-slate-100 bg-cover bg-center" style={{ backgroundImage: "url('/hero-bg.jpg')" }}>
              <div className="w-full h-full bg-gradient-to-t from-slate-900/40 to-transparent" />
            </div>

            {/* Floating verification Stat Card */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="absolute top-6 left-[-20px] bg-white border border-slate-100 shadow-xl rounded-2xl p-4 flex items-center gap-3.5 z-10 glass-panel-light max-w-[180px]"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500">Resource Status</div>
                <div className="text-sm font-bold text-slate-900">Verified Files</div>
              </div>
            </motion.div>

            {/* Floating uptime Stat Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="absolute bottom-6 right-[-20px] bg-white border border-slate-100 shadow-xl rounded-2xl p-4 flex items-center gap-3.5 z-10 glass-panel-light max-w-[180px]"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-[#2563EB] shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500">Security Core</div>
                <div className="text-sm font-bold text-slate-900">Secure Access</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section id="about" className="bg-white py-[70px] px-6 md:px-[70px] flex items-center border-t border-slate-100 relative">
        <div className="max-w-4xl w-full mx-auto text-center space-y-8">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[#2563EB] tracking-wide uppercase">Watch How It Works</h3>
            <h2 className="text-[36px] font-bold text-slate-900 tracking-tight leading-none">Watch How Hamro +2 Works</h2>
          </div>

          <div className="aspect-video w-full rounded-[24px] overflow-hidden bg-slate-900 border border-slate-100 shadow-2xl relative group">
            <div className="absolute inset-0 bg-cover bg-center opacity-75" style={{ backgroundImage: "url('/hero-bg.jpg')" }} />
            <div className="absolute inset-0 bg-slate-950/20 flex items-center justify-center">
              <button className="w-16 h-16 rounded-full bg-[#2563EB] hover:bg-blue-700 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 cursor-pointer">
                <Play className="w-6 h-6 fill-current ml-1" />
              </button>
            </div>
          </div>

          <p className="text-slate-500 text-[15px] leading-relaxed max-w-xl mx-auto">
            Get a quick walkthrough of how to browse notes, check model answers, search previous year exam papers, and contribute resources.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-slate-50 py-[70px] border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 md:px-[70px]">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <h2 className="text-[30px] font-bold text-slate-900 tracking-tight">Everything You Need</h2>
            <p className="text-slate-500 text-sm">
              All the tools and resources you need to excel in your +2 examinations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: FileText, title: "Digital Documents", desc: "Access high-quality reference notes, syllabus blueprints, and subject guides." },
              { icon: ShieldCheck, title: "Government Integration", desc: "NEB syllabus compliance checks for all science and management courses." },
              { icon: Zap, title: "Fast Verification", desc: "Uploaded study notes are verified by moderators within 24 hours." },
              { icon: Users, title: "QR Code Support", desc: "Easily scan notes and share documents with high school peers." },
              { icon: BookOpen, title: "Secure Cloud Storage", desc: "Save notes directly to your personal study dashboard securely." },
              { icon: Globe, title: "Multi-language Support", desc: "Syllabus guides translated and accessible in both Nepali and English." }
            ].map((feature, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white border border-slate-100 hover:border-[#2563EB]/40 hover:shadow-lg transition-all group hover:-translate-y-1">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:bg-[#2563EB]/15 transition-colors">
                  <feature.icon className="w-5 h-5 text-[#2563EB]" />
                </div>
                <h3 className="text-[16px] font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Timeline */}
      <section id="how-it-works" className="bg-white py-[70px] border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16 space-y-3">
            <h2 className="text-[30px] font-bold text-slate-900 tracking-tight">How It Works</h2>
            <p className="text-slate-500 text-sm">
              Follow these simple steps to start accessing high school resources.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 relative">
            {[
              { step: "01", title: "Login", desc: "Securely authenticate with Google to set up your profile." },
              { step: "02", title: "Upload Notes", desc: "Share handwritten study files or verify resources." },
              { step: "03", title: "Verification", desc: "Admin reviews files to ensure accuracy and relevance." },
              { step: "04", title: "Use Anywhere", desc: "Download and read documents offline on any device." }
            ].map((step, i) => (
              <div key={i} className="text-center space-y-3 relative">
                <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 text-[#2563EB] font-bold text-lg flex items-center justify-center mx-auto shadow-sm">
                  {step.step}
                </div>
                <h3 className="font-bold text-slate-900 text-base">{step.title}</h3>
                <p className="text-xs text-slate-500 max-w-[180px] mx-auto leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-slate-50 py-[70px] border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 md:px-[70px]">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <h2 className="text-[30px] font-bold text-slate-900 tracking-tight">Why Choose Us</h2>
            <p className="text-slate-500 text-sm">
              We make academic research simple, verified, and free.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Shield, title: "100% Security", desc: "Secure cloud access with encrypted account data profiles." },
              { icon: Zap, title: "Instant Access", desc: "Lightning fast loads with offline capabilities on phone browser viewports." },
              { icon: Heart, title: "Peer Trusted", desc: "Recommended by thousands of high school students and teachers in Nepal." },
              { icon: Clock, title: "24/7 Availability", desc: "Access verified documents, syllabus updates, and prep materials anytime." },
              { icon: Globe, title: "Government Ready", desc: "NEB exam standards mapped to cover complete term blueprint syllabuses." },
              { icon: Users, title: "Colleges Coverage", desc: "Covering terminal test questions from over 50 prominent High Schools." }
            ].map((card, i) => (
              <div key={i} className="p-5 rounded-2xl bg-white border border-slate-100 flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-[#2563EB] shrink-0">
                  <card.icon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1">{card.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Animated Statistics Section */}
      <section className="bg-white py-[70px] border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 md:px-[70px] grid grid-cols-2 md:grid-cols-3 gap-8 text-center">
          <div className="space-y-1">
            <div className="text-[44px] font-black text-[#2563EB] tracking-tight">100K+</div>
            <div className="text-sm font-bold text-slate-800">Total Users</div>
          </div>
          <div className="space-y-1">
            <div className="text-[44px] font-black text-[#2563EB] tracking-tight">500K+</div>
            <div className="text-sm font-bold text-slate-800">Verified Files</div>
          </div>
          <div className="space-y-1 col-span-2 md:col-span-1">
            <div className="text-[44px] font-black text-[#2563EB] tracking-tight">99.9%</div>
            <div className="text-sm font-bold text-slate-800">Service Uptime</div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-slate-50 py-[70px] border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 md:px-[70px]">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <h2 className="text-[30px] font-bold text-slate-900 tracking-tight">Student Feedback</h2>
            <p className="text-slate-500 text-sm">
              Hear what students and contributors from colleges across Nepal say.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              { name: "Aashish Shrestha", role: "St. Xavier's College", review: "The mathematics notes solved references are amazing. Saved a lot of time before my board terminals." },
              { name: "Priya Adhikari", role: "Trinity International", review: "Direct downloads and neat interface. Highly recommend for NEB board exams preparation notes." },
              { name: "Rohit Gurung", role: "KMC Lalitpur", review: "Contributing notes is highly motivating. The leaderboard badge adds a fun competitive touch." }
            ].map((test, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white border border-slate-100 flex flex-col justify-between space-y-4 shadow-sm">
                <p className="text-slate-600 italic text-[14px] leading-relaxed">"{test.review}"</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center font-bold text-[#2563EB] text-sm">
                    {test.name[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">{test.name}</h4>
                    <p className="text-[10px] text-slate-500">{test.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section id="faq" className="bg-white py-[70px] border-t border-slate-100">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12 space-y-3">
            <h2 className="text-[30px] font-bold text-slate-900 tracking-tight">Frequently Asked Questions</h2>
            <p className="text-slate-500 text-sm">
              Quick answers to the common questions about Hamro +2 Hub.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { q: "Is Hamro +2 Hub completely free to use?", a: "Yes, access to all note files, term papers, and solutions is 100% free with no hidden charges." },
              { q: "How can I contribute my study materials?", a: "Register/Login with Google, click the Contribute tab in your dashboard, and upload your PDF files." },
              { q: "Are the resources aligned with NEB board?", a: "Yes, all resources are verified according to the latest syllabus of Nepal National Examinations Board (NEB)." },
              { q: "How does the student leaderboard badge system work?", a: "You earn repute points each time your contributed document is downloaded or approved by admin." }
            ].map((faq, i) => (
              <div key={i} className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <button 
                  onClick={() => toggleFaq(i)}
                  className="w-full flex justify-between items-center p-4 text-left font-bold text-[15px] text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${activeFaq === i ? 'rotate-180' : ''}`} />
                </button>
                <div className={`transition-all duration-300 overflow-hidden ${activeFaq === i ? 'max-h-40 border-t border-slate-200 p-4 bg-slate-50/50' : 'max-h-0'}`}>
                  <p className="text-slate-600 text-xs leading-relaxed">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-10 text-slate-500 text-[13px]">
        <div className="max-w-7xl mx-auto px-6 md:px-[70px] grid md:grid-cols-4 gap-6 mb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="bg-[#2563EB] text-white text-[10px] font-black px-2 py-0.5 rounded">
                +2
              </div>
              <span className="text-base font-bold text-slate-900">Hamro +2 Hub</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Nepal's collaborative platform for high school students. Quality resources, syllabus references, and term guides.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-3 text-sm">Quick Links</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li><button onClick={() => openAuthModal('login')} className="hover:text-[#2563EB] transition-colors cursor-pointer bg-transparent border-none p-0 text-left">Study Dashboard</button></li>
              <li><button onClick={() => openAuthModal('signup')} className="hover:text-[#2563EB] transition-colors cursor-pointer bg-transparent border-none p-0 text-left">Contribute File</button></li>
              <li><button onClick={() => openAuthModal('login')} className="hover:text-[#2563EB] transition-colors cursor-pointer bg-transparent border-none p-0 text-left">Course Syllabus</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-3 text-sm">Contact Us</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> support@hamroplustwo.com</li>
              <li className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> +977-1-5555555</li>
              <li className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Kathmandu, Nepal</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 mb-3 text-sm">Follow Us</h4>
            <div className="flex gap-3">
              <a href="#" className="w-7 h-7 rounded-full bg-slate-50 hover:bg-[#2563EB]/10 hover:text-[#2563EB] flex items-center justify-center transition-colors"><Github className="w-3.5 h-3.5" /></a>
              <a href="#" className="w-7 h-7 rounded-full bg-slate-50 hover:bg-[#2563EB]/10 hover:text-[#2563EB] flex items-center justify-center transition-colors"><Twitter className="w-3.5 h-3.5" /></a>
              <a href="#" className="w-7 h-7 rounded-full bg-slate-50 hover:bg-[#2563EB]/10 hover:text-[#2563EB] flex items-center justify-center transition-colors"><Youtube className="w-3.5 h-3.5" /></a>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 md:px-[70px] border-t border-slate-100 pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-[11px] text-slate-400">
          <div>&copy; {new Date().getFullYear()} Hamro +2 Hub. Made with love in Nepal. All rights reserved.</div>
          <div className="flex gap-4">
            <Link to="/privacy-policy" className="hover:text-slate-600">Privacy Policy</Link>
            <Link to="/terms-conditions" className="hover:text-slate-600">Terms & Conditions</Link>
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
            className="fixed inset-0 z-55 flex items-center justify-center bg-black/45 backdrop-blur-[6px] p-4"
          >
            {/* Modal Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative w-full max-w-md bg-white border border-slate-100 rounded-3xl p-8 sm:p-10 shadow-2xl flex flex-col justify-center text-slate-900"
            >
              {/* Close Button */}
              <button 
                onClick={() => setIsAuthModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-50 transition-all cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="text-center mb-8">
                <h2 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">
                  {authMode === 'login' ? 'Welcome Back' : 'Create an Account'}
                </h2>
                <p className="text-slate-500 text-sm">
                  {authMode === 'login' ? 'Sign in to access your study materials.' : 'Sign up to start saving notes and study materials.'}
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 text-rose-600 animate-in fade-in">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {/* Google Sign In Action */}
              <button
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
                className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-[#2563EB] hover:bg-blue-700 text-white font-bold rounded-full transition-all border border-transparent disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] cursor-pointer"
              >
                {isLoggingIn ? (
                  <Loader2 className="w-5 h-5 animate-spin text-white animate-spin" />
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#FFFFFF" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#FFFFFF" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FFFFFF" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#FFFFFF" />
                    </svg>
                    <span>
                      {authMode === 'login' ? 'Sign in with Google' : 'Sign up with Google'}
                    </span>
                  </>
                )}
              </button>

              <div className="flex items-center my-6">
                <div className="flex-1 border-t border-slate-100"></div>
                <span className="px-3 text-xs text-slate-400 uppercase">or</span>
                <div className="flex-1 border-t border-slate-100"></div>
              </div>

              {/* Continue with Email placeholder */}
              <button 
                onClick={() => {
                  setError("Email sign in is currently disabled. Please use Google Login.");
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-full transition-all border border-slate-200 text-sm cursor-pointer mb-3"
              >
                <span>Continue with Email</span>
              </button>

              {/* Guest mode */}
              <button 
                onClick={() => {
                  setIsAuthModalOpen(false);
                  navigate('/');
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-transparent hover:bg-slate-50 text-slate-500 font-bold rounded-full transition-all text-xs cursor-pointer"
              >
                <span>Access as Guest</span>
              </button>

              <p className="mt-8 text-center text-sm text-slate-500">
                {authMode === 'login' ? (
                  <>
                    Don't have an account?{' '}
                    <button 
                      onClick={() => setAuthMode('signup')}
                      className="text-[#2563EB] hover:underline font-bold transition-all cursor-pointer bg-transparent border-none"
                    >
                      Sign Up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button 
                      onClick={() => setAuthMode('login')}
                      className="text-[#2563EB] hover:underline font-bold transition-all cursor-pointer bg-transparent border-none"
                    >
                      Sign In
                    </button>
                  </>
                )}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
