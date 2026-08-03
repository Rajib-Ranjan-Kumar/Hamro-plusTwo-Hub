import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, FileText, Upload, Trophy, CheckCircle, Users, Play, ChevronDown, Rocket, User, Loader2, AlertCircle, X, Mail, MapPin, Phone, Github, Twitter, Youtube, Menu } from 'lucide-react';
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
      
      // Redirect to target destination originally clicked, fallback to root
      const redirectPath = localStorage.getItem('redirect_after_login') || '/';
      localStorage.removeItem('redirect_after_login');
      navigate(redirectPath);
    } catch (err: any) {
      console.error("Google auth failed:", err);
      setError(getFirebaseErrorMessage(err));
      setIsLoggingIn(false);
    }
  };

  const openAuthModal = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const ProtectedWrapper = ({ children, path }: { children: React.ReactElement; path: string; key?: React.Key }) => {
    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      localStorage.setItem('redirect_after_login', path);
      openAuthModal('login');
    };

    return React.cloneElement(children, {
      onClick: handleClick,
      className: `${children.props.className || ''} cursor-pointer`.trim()
    });
  };

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-transparent text-white font-sans selection:bg-[#F5C21B]/30 flex flex-col relative overflow-x-hidden pt-[72px] xl:pt-[88px]">
      <SEO />

      {/* Premium Navigation Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 w-full h-[72px] xl:h-[88px] bg-[#070C12]/88 backdrop-blur-md border-b border-white/8 z-50 flex items-center justify-between px-6 xl:px-8 transition-all duration-300"
      >
        {/* Left: Logo Section */}
        <div className="flex items-center gap-2 shrink-0 select-none">
          <div className="bg-[#F4B400] text-black text-[11px] font-black px-2 py-0.5 rounded shadow-[0_0_8px_rgba(244,180,0,0.3)]">
            +2
          </div>
          <span className="text-lg font-bold text-white tracking-wide shrink-0">Hamro +2 Hub</span>
        </div>

        {/* Center: Navigation Links (Desktop/Laptop only, hidden on tablet/mobile) */}
        <nav className="hidden xl:flex items-center gap-[48px] absolute left-1/2 -translate-x-1/2">
          {[
            { name: 'Home', path: '/', active: true },
            { name: 'PYQs', path: '/pyq' },
            { name: 'Notes', path: '/syllabus' },
            { name: 'Syllabus', path: '/syllabus' },
            { name: 'Chat', path: '/chat' },
            { name: 'Membership', path: '/get-premium' },
            { name: 'About', path: '#about', isAnchor: true }
          ].map((item) => {
            const linkContent = (
              <span className={`relative text-[22px] font-semibold transition-all duration-250 ease-in-out cursor-pointer ${item.active ? 'text-[#F4B400]' : 'text-white/80 hover:text-white'}`}>
                {item.name}
                {item.active && (
                  <motion.span 
                    layoutId="navbar-underline"
                    className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 w-[58px] h-[3px] bg-[#F4B400] rounded-full"
                  />
                )}
              </span>
            );

            if (item.isAnchor) {
              return (
                <a key={item.name} href={item.path} className="no-underline">
                  {linkContent}
                </a>
              );
            }

            return (
              <ProtectedWrapper key={item.name} path={item.path}>
                {linkContent}
              </ProtectedWrapper>
            );
          })}
        </nav>

        {/* Right: Language Selector + Login Button + Mobile Hamburger */}
        <div className="flex items-center gap-[12px] sm:gap-[18px] shrink-0">
          {/* Language Selector Pill */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 h-[40px] xl:h-[54px] px-4 xl:px-6 border border-white/35 rounded-full text-white text-sm xl:text-[18px] font-semibold hover:border-white/60 bg-transparent transition-all cursor-pointer">
              <span>English</span>
              <ChevronDown className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Log In Button - Gold Pill */}
          <button 
            onClick={() => openAuthModal('login')}
            className="bg-[#F4B400] hover:bg-[#F4B400]/95 text-black h-[40px] xl:h-[54px] px-4 xl:px-[28px] rounded-full font-semibold text-sm xl:text-[18px] transition-all flex items-center gap-[10px] shadow-[0_0_15px_rgba(244,180,0,0.3)] cursor-pointer hover:scale-102 hover:-translate-y-0.5 duration-250 shrink-0"
          >
            <User className="w-4 h-4 xl:w-5 xl:h-5 stroke-[2.5px]" />
            <span>Log In</span>
          </button>

          {/* Hamburger Menu Toggle (Hidden on desktop/laptop) */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="xl:hidden p-2 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </motion.header>

      {/* Mobile Drawer Navigation Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black z-40 xl:hidden"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3, ease: 'easeInOut' }}
              className="fixed top-0 right-0 w-[280px] sm:w-[320px] h-full bg-[#070C12] border-l border-white/8 z-40 pt-[100px] px-6 shadow-2xl xl:hidden flex flex-col justify-between pb-8"
            >
              {/* Menu Links */}
              <nav className="flex flex-col gap-6">
                {[
                  { name: 'Home', path: '/', active: true },
                  { name: 'PYQs', path: '/pyq' },
                  { name: 'Notes', path: '/syllabus' },
                  { name: 'Syllabus', path: '/syllabus' },
                  { name: 'Chat', path: '/chat' },
                  { name: 'Membership', path: '/get-premium' },
                  { name: 'About', path: '#about', isAnchor: true }
                ].map((item) => {
                  const linkContent = (
                    <span 
                      onClick={() => setIsMenuOpen(false)}
                      className={`text-lg font-semibold transition-all duration-200 block py-1 cursor-pointer ${item.active ? 'text-[#F4B400] border-l-2 border-[#F4B400] pl-3' : 'text-white/80 hover:text-white hover:pl-2'}`}
                    >
                      {item.name}
                    </span>
                  );

                  if (item.isAnchor) {
                    return (
                      <a key={item.name} href={item.path} className="no-underline" onClick={() => setIsMenuOpen(false)}>
                        {linkContent}
                      </a>
                    );
                  }

                  return (
                    <ProtectedWrapper key={item.name} path={item.path}>
                      {linkContent}
                    </ProtectedWrapper>
                  );
                })}
              </nav>

              {/* Bottom footer text inside drawer */}
              <div className="text-[11px] text-slate-600 border-t border-white/5 pt-4">
                &copy; {new Date().getFullYear()} Hamro +2 Hub
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 100vh Hero Fold Section */}
      <div className="relative h-[calc(100vh-72px)] xl:h-[calc(100vh-88px)] min-h-[500px] sm:min-h-[700px] w-full flex flex-col justify-between overflow-hidden">
        {/* Full Screen Clean Background Image */}
        <div className="absolute inset-0 z-0 site-bg" />
        
        {/* Subtle dark gradient overlay behind left-aligned text for readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-transparent z-0 pointer-events-none" />

        {/* Hero Left Content - Vertically Centered */}
        <div className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-6 md:px-[80px] flex flex-col justify-center">
          <div className="max-w-[520px] text-left space-y-[24px]">
            {/* Main Title - Nepali (Fluid size using clamp inline style) */}
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              style={{ fontSize: 'clamp(20px, 6.5vw, 72px)' }}
              className="font-extrabold text-white leading-[1.15] tracking-tight whitespace-pre-line select-text"
            >
              तपाईँको मेहनत,{"\n"}
              हाम्रो सहयोग
            </motion.h1>

            {/* Subtitle (Fluid size using clamp inline style) */}
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              style={{ fontSize: 'clamp(12px, 2.8vw, 32px)' }}
              className="font-normal text-white leading-[1.3] whitespace-pre-line select-text"
            >
              PYQs, Notes & Study Materials{"\n"}
              for Your Success...
            </motion.p>

            {/* Interactive Action Buttons - Scaled down to 70% */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="flex flex-wrap items-center gap-[16px] pt-1"
            >
              {/* Button 1: Get Started */}
              <ProtectedWrapper path="/">
                <button className="bg-[#F5C21B] hover:bg-[#e0b018] text-black font-semibold text-[20px] h-[45px] w-[154px] rounded-[12px] flex items-center justify-center gap-1.5 transition-all hover:scale-103 shadow-lg">
                  <span>🚀 Get Started</span>
                </button>
              </ProtectedWrapper>

              {/* Button 2: Explore Now */}
              <ProtectedWrapper path="/syllabus">
                <button className="bg-black/35 hover:bg-black/50 border border-white/35 text-white font-normal text-[20px] h-[45px] w-[168px] rounded-[12px] flex items-center justify-center gap-1.5 transition-all hover:scale-102 backdrop-blur-sm">
                  <span>▶ Explore Now</span>
                </button>
              </ProtectedWrapper>
            </motion.div>
          </div>
        </div>

        {/* Empty Spacer to preserve bottom-aligned village background scenery */}
        <div className="h-12 w-full z-0" />
      </div>

      {/* About Section - Scaled down by ~30% */}
      <section id="about" className="min-h-screen bg-[#0F172A] py-[70px] px-6 md:px-[70px] flex items-center border-t border-white/5 relative">
        <div className="max-w-7xl w-full mx-auto grid lg:grid-cols-2 gap-[56px] items-center">
          {/* Left Side - Embedded Video Placeholder */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-[#F5C21B] tracking-wide uppercase">Watch How Hamro +2 Works</h3>
            <div className="aspect-video w-full rounded-[16px] overflow-hidden bg-slate-900 border border-white/10 shadow-2xl relative group">
              <div className="absolute inset-0 bg-cover bg-center opacity-60" style={{ backgroundImage: "url('/hero-bg.jpg')" }} />
              <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center">
                <button className="w-14 h-14 rounded-full bg-[#F5C21B] hover:bg-[#e0b018] text-black flex items-center justify-center shadow-lg transition-transform hover:scale-105 cursor-pointer">
                  <Play className="w-6 h-6 fill-current ml-0.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Side - Why Hamro +2 */}
          <div className="space-y-6">
            <h2 className="text-[36px] font-bold text-white tracking-tight leading-none">Why Hamro +2?</h2>
            <p className="text-slate-300 text-[15px] leading-relaxed">
              We provide a complete study companion for +2 science and management students in Nepal. Easily access question banks, notes, exam patterns, and complete resources for your term prep.
            </p>

            <div className="grid gap-3">
              {[
                { icon: FileText, title: "Smart Learning", desc: "Access high-quality revision files, subject guides, and verified reference documents." },
                { icon: BookOpen, title: "Free Resources", desc: "No subscriptions required. Free updates on notes and solutions from top colleges." },
                { icon: CheckCircle, title: "Easy Access", desc: "Clean navigation and simple downloads for preparation on the go." }
              ].map((feat, i) => (
                <div key={i} className="flex gap-3.5 p-3 rounded-xl bg-white/[0.03] border border-white/5 backdrop-blur-md">
                  <div className="w-8 h-8 rounded-lg bg-[#F5C21B]/10 flex items-center justify-center shrink-0">
                    <feat.icon className="w-4 h-4 text-[#F5C21B]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{feat.title}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section - Scaled down by ~30% */}
      <section className="bg-[#0F1115] py-[70px] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-[70px]">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <h2 className="text-[30px] font-bold text-white tracking-tight">Everything You Need</h2>
            <p className="text-slate-400 text-sm">
              All the tools and resources you need to excel in your +2 examinations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: FileText, title: "Previous Year Questions", desc: "Detailed past papers with step-by-step solution breakdowns for revision.", path: "/pyq" },
              { icon: BookOpen, title: "Structured Notes", desc: "Handwritten and typed notes from top teachers in Kathmandu Valley.", path: "/syllabus" },
              { icon: Upload, title: "Contribute Notes", desc: "Share your own class notes to help peers and get recognized on our platform.", path: "/contribute" },
              { icon: Trophy, title: "Student Leaderboard", desc: "Earn reputation badges for verified notes uploads and correct solutions.", path: "/leaderboard" },
              { icon: Users, title: "Peer Discussions", desc: "Ask doubts and get answers from fellow +2 students across Nepal.", path: "/chat" },
              { icon: CheckCircle, title: "Syllabus Compliance", desc: "100% updated according to the latest NEB board exam patterns.", path: "/syllabus" }
            ].map((feature, i) => (
              <ProtectedWrapper key={i} path={feature.path}>
                <div className="p-6 rounded-xl bg-white/[0.03] border border-white/5 hover:border-[#F5C21B]/50 transition-all group hover:-translate-y-1">
                  <div className="w-9 h-9 rounded-lg bg-slate-800/80 flex items-center justify-center mb-4 group-hover:bg-[#F5C21B]/10 transition-colors">
                    <feature.icon className="w-4 h-4 text-slate-400 group-hover:text-[#F5C21B] transition-all" />
                  </div>
                  <h3 className="text-[16px] font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{feature.desc}</p>
                </div>
              </ProtectedWrapper>
            ))}
          </div>
        </div>
      </section>

      {/* Subjects Section - Scaled down by ~30% */}
      <section className="bg-[#0F172A] py-[70px] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-[70px]">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <h2 className="text-[30px] font-bold text-white tracking-tight">Access Course Subjects</h2>
            <p className="text-slate-400 text-sm">
              Choose your course and access curated notes, questions, and guides.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { title: "Physics", count: "140+ Files", color: "from-[#F5C21B] to-[#e0b018]", path: "/syllabus" },
              { title: "Chemistry", count: "120+ Files", color: "from-[#F5C21B] to-[#e0b018]", path: "/syllabus" },
              { title: "Biology", count: "90+ Files", color: "from-[#F5C21B] to-[#e0b018]", path: "/syllabus" },
              { title: "Mathematics", count: "150+ Files", color: "from-[#F5C21B] to-[#e0b018]", path: "/syllabus" },
              { title: "Computer Science", count: "80+ Files", color: "from-[#F5C21B] to-[#e0b018]", path: "/syllabus" },
              { title: "English", count: "70+ Files", color: "from-[#F5C21B] to-[#e0b018]", path: "/syllabus" }
            ].map((sub, i) => (
              <ProtectedWrapper key={i} path={sub.path}>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex justify-between items-center group hover:bg-white/[0.04] transition-all">
                  <div>
                    <h3 className="text-[18px] font-bold text-white group-hover:text-[#F5C21B] transition-colors">{sub.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{sub.count}</p>
                  </div>
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${sub.color} text-black flex items-center justify-center font-black group-hover:scale-105 transition-transform text-sm`}>
                    &rarr;
                  </div>
                </div>
              </ProtectedWrapper>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials - Scaled down by ~30% */}
      <section className="bg-[#0F1115] py-[70px] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-[70px]">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <h2 className="text-[30px] font-bold text-white tracking-tight">Student Feedback</h2>
            <p className="text-slate-400 text-sm">
              Hear what students and contributors from colleges across Nepal say.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              { name: "Aashish Shrestha", role: "St. Xavier's College", review: "The mathematics notes solved references are amazing. Saved a lot of time before my board terminals." },
              { name: "Priya Adhikari", role: "Trinity International", review: "Direct downloads and neat interface. Highly recommend for NEB board exams preparation notes." },
              { name: "Rohit Gurung", role: "KMC Lalitpur", review: "Contributing notes is highly motivating. The leaderboard badge adds a fun competitive touch." }
            ].map((test, i) => (
              <div key={i} className="p-6 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col justify-between space-y-4">
                <p className="text-slate-300 italic text-[14px] leading-relaxed">"{test.review}"</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#F5C21B]/20 flex items-center justify-center font-bold text-[#F5C21B] text-sm">
                    {test.name[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs">{test.name}</h4>
                    <p className="text-[10px] text-slate-500">{test.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section - Scaled down by ~30% */}
      <section className="bg-[#0F172A] py-[70px] border-t border-white/5">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12 space-y-3">
            <h2 className="text-[30px] font-bold text-white tracking-tight">Frequently Asked Questions</h2>
            <p className="text-slate-400 text-sm">
              Quick answers to the common questions about Hamro +2 Hub.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { q: "Is Hamro +2 Hub completely free to use?", a: "Yes, access to all note files, term papers, and solutions is 100% free with no hidden charges." },
              { q: "How can I contribute my study materials?", a: "Register/Login with Google, click the Contribute tab in your dashboard, and upload your PDF files." },
              { q: "Are the resources aligned with NEB board?", a: "Yes, all materials are verified according to the latest syllabus of Nepal National Examinations Board (NEB)." },
              { q: "How does the student leaderboard badge system work?", a: "You earn repute points each time your contributed document is downloaded or approved by admin." }
            ].map((faq, i) => (
              <div key={i} className="border border-white/5 rounded-xl overflow-hidden bg-white/[0.01]">
                <button 
                  onClick={() => toggleFaq(i)}
                  className="w-full flex justify-between items-center p-4 text-left font-bold text-[15px] text-white hover:bg-white/[0.02] transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${activeFaq === i ? 'rotate-180' : ''}`} />
                </button>
                <div className={`transition-all duration-300 overflow-hidden ${activeFaq === i ? 'max-h-40 border-t border-white/5 p-4' : 'max-h-0'}`}>
                  <p className="text-slate-400 text-xs leading-relaxed">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0D0D0F] border-t border-white/5 py-10 text-slate-400 text-[13px]">
        <div className="max-w-7xl mx-auto px-6 md:px-[70px] grid md:grid-cols-4 gap-6 mb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="bg-[#F5C21B] text-black text-[10px] font-black px-2 py-0.5 rounded">
                +2
              </div>
              <span className="text-base font-bold text-white">Hamro +2 Hub</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Nepal's collaborative platform for high school students. Quality resources, syllabus references, and term guides.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-3 text-sm">Quick Links</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li><button onClick={() => openAuthModal('login')} className="hover:text-[#F5C21B] transition-colors cursor-pointer">Study Dashboard</button></li>
              <li><button onClick={() => openAuthModal('signup')} className="hover:text-[#F5C21B] transition-colors cursor-pointer">Contribute File</button></li>
              <li><button onClick={() => openAuthModal('login')} className="hover:text-[#F5C21B] transition-colors cursor-pointer">Course Syllabus</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-3 text-sm">Contact Us</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> support@hamroplustwo.com</li>
              <li className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> +977-1-5555555</li>
              <li className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Kathmandu, Nepal</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-white mb-3 text-sm">Follow Us</h4>
            <div className="flex gap-3">
              <a href="#" className="w-7 h-7 rounded-full bg-white/5 hover:bg-[#F5C21B]/15 hover:text-[#F5C21B] flex items-center justify-center transition-colors"><Github className="w-3.5 h-3.5" /></a>
              <a href="#" className="w-7 h-7 rounded-full bg-white/5 hover:bg-[#F5C21B]/15 hover:text-[#F5C21B] flex items-center justify-center transition-colors"><Twitter className="w-3.5 h-3.5" /></a>
              <a href="#" className="w-7 h-7 rounded-full bg-white/5 hover:bg-[#F5C21B]/15 hover:text-[#F5C21B] flex items-center justify-center transition-colors"><Youtube className="w-3.5 h-3.5" /></a>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 md:px-[70px] border-t border-white/5 pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-[11px] text-slate-600">
          <div>&copy; {new Date().getFullYear()} Hamro +2 Hub. Made with love in Nepal. All rights reserved.</div>
          <div className="flex gap-4">
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
            className="fixed inset-0 z-55 flex items-center justify-center bg-black/45 backdrop-blur-[6px] p-4"
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
                <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight">
                  {authMode === 'login' ? 'Welcome Back' : 'Create an Account'}
                </h2>
                <p className="text-slate-400 text-sm">
                  {authMode === 'login' ? 'Sign in to access your study materials.' : 'Sign up to start saving notes and study materials.'}
                </p>
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
                className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-[#F5C21B] hover:bg-[#e0b018] text-black font-bold rounded-full transition-all border border-transparent disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] cursor-pointer"
              >
                {isLoggingIn ? (
                  <Loader2 className="w-5 h-5 animate-spin text-slate-700" />
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#0D0D0F" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#0D0D0F" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#0D0D0F" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#0D0D0F" />
                    </svg>
                    <span>
                      {authMode === 'login' ? 'Sign in with Google' : 'Sign up with Google'}
                    </span>
                  </>
                )}
              </button>

              <p className="mt-8 text-center text-sm text-slate-400">
                {authMode === 'login' ? (
                  <>
                    Don't have an account?{' '}
                    <button 
                      onClick={() => setAuthMode('signup')}
                      className="text-[#F5C21B] hover:underline font-bold transition-all cursor-pointer bg-transparent border-none"
                    >
                      Sign Up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button 
                      onClick={() => setAuthMode('login')}
                      className="text-[#F5C21B] hover:underline font-bold transition-all cursor-pointer bg-transparent border-none"
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
