import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, FileText, Upload, Trophy, CheckCircle, Users, Play, ChevronDown, Rocket, User, Loader2, AlertCircle, X, Mail, MapPin, Phone, Github, Twitter, Youtube } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SEO } from '../components/SEO';
import { auth, googleProvider, db } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { getFirebaseErrorMessage } from '../utils/firebaseErrors';
import { translations } from '../utils/translations';

export const Landing = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState('');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  
  const [lang, setLang] = useState<'en' | 'ne'>(() => (localStorage.getItem('preferred_language') as 'en' | 'ne') || 'en');
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  const t = (section: string, key: string) => {
    return translations[lang]?.[section]?.[key] || translations['en']?.[section]?.[key] || '';
  };

  const handleLanguageChange = (newLang: 'en' | 'ne') => {
    setLang(newLang);
    localStorage.setItem('preferred_language', newLang);
  };

  // Automatically trigger Auth Modal if redirected from a protected route
  useEffect(() => {
    if (location.state?.from) {
      setAuthMode('login');
      setIsAuthModalOpen(true);
    }
  }, [location.state]);

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
      
      const destination = redirectPath || location.state?.from?.pathname || '/';
      navigate(destination);
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

  const handleFeatureClick = (path: string) => {
    setRedirectPath(path);
    openAuthModal('login');
  };

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-transparent text-white font-sans selection:bg-[#F5C21B]/30 flex flex-col relative overflow-x-hidden">
      <SEO />

      {/* 100vh Hero Fold Section */}
      <div className="relative h-screen min-h-[500px] sm:min-h-[700px] w-full flex flex-col justify-between overflow-hidden">
        {/* Full Screen Clean Background Image */}
        <div className="absolute inset-0 z-0 site-bg" />
        
        {/* Subtle dark gradient overlay behind left-aligned text for readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-transparent z-0 pointer-events-none" />

        {/* Navbar - Positioned Top Right, scaled down to 70% */}
        <motion.nav 
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="absolute top-0 right-0 z-10 pt-4 pr-6 sm:pt-[28px] sm:pr-[42px] flex items-center gap-[24px]"
        >
          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-[20px] text-[15px] font-medium text-white/80">
            {/* Public Links */}
            <a href="/" className="hover:text-white transition-colors">{t('navbar', 'home')}</a>
            <a href="#about" className="hover:text-white transition-colors">{t('navbar', 'about')}</a>
            <Link to="/contact" className="hover:text-white transition-colors">{t('navbar', 'contact')}</Link>
            <Link to="/faq" className="hover:text-white transition-colors">{t('navbar', 'faq')}</Link>
            <Link to="/privacy-policy" className="hover:text-white transition-colors">{t('navbar', 'privacy')}</Link>
            
            {/* Protected Links */}
            <button onClick={() => handleFeatureClick('/pyq')} className="hover:text-white transition-colors cursor-pointer bg-transparent border-none">{t('navbar', 'pyqs')}</button>
            <button onClick={() => handleFeatureClick('/syllabus')} className="hover:text-white transition-colors cursor-pointer bg-transparent border-none">{t('navbar', 'notes')}</button>
            <button onClick={() => handleFeatureClick('/syllabus')} className="hover:text-white transition-colors cursor-pointer bg-transparent border-none">{t('navbar', 'syllabus')}</button>
            <button onClick={() => handleFeatureClick('/chat')} className="hover:text-white transition-colors cursor-pointer bg-transparent border-none">{t('navbar', 'chat')}</button>
            <button onClick={() => handleFeatureClick('/get-premium')} className="hover:text-white transition-colors cursor-pointer bg-transparent border-none">{t('navbar', 'membership')}</button>
          </div>

          {/* Language Selector Dropdown Pill */}
          <div className="relative">
            <button 
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              className="flex items-center gap-1 h-[36px] px-[14px] border border-white/80 rounded-full text-white text-[15px] font-semibold hover:bg-white/10 transition-all cursor-pointer"
            >
              <span>{lang === 'en' ? 'English' : 'नेपाली'}</span>
              <ChevronDown className="w-4 h-4 text-white" />
            </button>

            {isLangDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsLangDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 w-32 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden">
                  <button 
                    onClick={() => {
                      handleLanguageChange('en');
                      setIsLangDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-[14px] hover:bg-white/5 transition-all ${lang === 'en' ? 'text-[#F5C21B] font-bold' : 'text-white'}`}
                  >
                    English
                  </button>
                  <button 
                    onClick={() => {
                      handleLanguageChange('ne');
                      setIsLangDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-[14px] hover:bg-white/5 transition-all ${lang === 'ne' ? 'text-[#F5C21B] font-bold' : 'text-white'}`}
                  >
                    नेपाली
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Log In Button - Gold Pill */}
          <button 
            onClick={() => {
              setRedirectPath('/');
              openAuthModal('login');
            }}
            className="bg-[#F5C21B] hover:bg-[#e0b018] text-black h-[36px] px-[21px] rounded-full font-semibold text-[14px] transition-all flex items-center gap-1.5 shadow-md cursor-pointer hover:scale-102"
          >
            <User className="w-4 h-4 stroke-[2.5px]" />
            <span>{t('navbar', 'login')}</span>
          </button>
        </motion.nav>

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
              {t('hero', 'title')}
            </motion.h1>

            {/* Subtitle (Fluid size using clamp inline style) */}
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              style={{ fontSize: 'clamp(12px, 2.8vw, 32px)' }}
              className="font-normal text-white leading-[1.3] whitespace-pre-line select-text"
            >
              {t('hero', 'subtitle')}
            </motion.p>

            {/* Interactive Action Buttons - Scaled down to 70% */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="flex flex-wrap items-center gap-[16px] pt-1"
            >
              {/* Button 1: Get Started */}
              <button 
                onClick={() => {
                  setRedirectPath('/');
                  openAuthModal('signup');
                }}
                className="bg-[#F5C21B] hover:bg-[#e0b018] text-black font-semibold text-[20px] h-[45px] w-[154px] rounded-[12px] flex items-center justify-center gap-1.5 transition-all hover:scale-103 shadow-lg cursor-pointer"
              >
                <span>{t('hero', 'getStarted')}</span>
              </button>

              {/* Button 2: Explore Now */}
              <a 
                href="#about"
                className="bg-black/35 hover:bg-black/50 border border-white/35 text-white font-normal text-[20px] h-[45px] w-[168px] rounded-[12px] flex items-center justify-center gap-1.5 transition-all hover:scale-102 backdrop-blur-sm cursor-pointer"
              >
                <span>{t('hero', 'exploreNow')}</span>
              </a>
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
            <h3 className="text-base font-bold text-[#F5C21B] tracking-wide uppercase">{t('about', 'tag')}</h3>
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
            <h2 className="text-[36px] font-bold text-white tracking-tight leading-none">{t('about', 'title')}</h2>
            <p className="text-slate-300 text-[15px] leading-relaxed">
              {t('about', 'desc')}
            </p>

            <div className="grid gap-3">
              {[
                { icon: FileText, titleKey: "feature1Title", descKey: "feature1Desc" },
                { icon: BookOpen, titleKey: "feature2Title", descKey: "feature2Desc" },
                { icon: CheckCircle, titleKey: "feature3Title", descKey: "feature3Desc" }
              ].map((feat, i) => (
                <div key={i} className="flex gap-3.5 p-3 rounded-xl bg-white/[0.03] border border-white/5 backdrop-blur-md">
                  <div className="w-8 h-8 rounded-lg bg-[#F5C21B]/10 flex items-center justify-center shrink-0">
                    <feat.icon className="w-4 h-4 text-[#F5C21B]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{t('about', feat.titleKey)}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{t('about', feat.descKey)}</p>
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
            <h2 className="text-[30px] font-bold text-white tracking-tight">{t('features', 'tag')}</h2>
            <p className="text-slate-400 text-sm">
              {t('features', 'desc')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: FileText, titleKey: "card1Title", descKey: "card1Desc", path: "/pyq" },
              { icon: BookOpen, titleKey: "card2Title", descKey: "card2Desc", path: "/syllabus" },
              { icon: Upload, titleKey: "card3Title", descKey: "card3Desc", path: "/contribute" },
              { icon: Trophy, titleKey: "card4Title", descKey: "card4Desc", path: "/leaderboard" },
              { icon: Users, titleKey: "card5Title", descKey: "card5Desc", path: "/chat" },
              { icon: CheckCircle, titleKey: "card6Title", descKey: "card6Desc", path: "/syllabus" }
            ].map((feature, i) => (
              <div 
                key={i} 
                onClick={() => handleFeatureClick(feature.path)}
                className="p-6 rounded-xl bg-white/[0.03] border border-white/5 hover:border-[#F5C21B]/50 transition-all group hover:-translate-y-1 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-800/80 flex items-center justify-center mb-4 group-hover:bg-[#F5C21B]/10 transition-colors">
                  <feature.icon className="w-4 h-4 text-slate-400 group-hover:text-[#F5C21B] transition-all" />
                </div>
                <h3 className="text-[16px] font-bold text-white mb-2">{t('features', feature.titleKey)}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{t('features', feature.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Subjects Section - Scaled down by ~30% */}
      <section className="bg-[#0F172A] py-[70px] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-[70px]">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <h2 className="text-[30px] font-bold text-white tracking-tight">{t('subjects', 'title')}</h2>
            <p className="text-slate-400 text-sm">
              {t('subjects', 'desc')}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { titleKey: "physics", count: "140+", color: "from-[#F5C21B] to-[#e0b018]" },
              { titleKey: "chemistry", count: "120+", color: "from-[#F5C21B] to-[#e0b018]" },
              { titleKey: "biology", count: "90+", color: "from-[#F5C21B] to-[#e0b018]" },
              { titleKey: "math", count: "150+", color: "from-[#F5C21B] to-[#e0b018]" },
              { titleKey: "cs", count: "80+", color: "from-[#F5C21B] to-[#e0b018]" },
              { titleKey: "english", count: "70+", color: "from-[#F5C21B] to-[#e0b018]" }
            ].map((sub, i) => (
              <div 
                key={i} 
                onClick={() => handleFeatureClick('/syllabus')}
                className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex justify-between items-center group hover:bg-white/[0.04] transition-all cursor-pointer"
              >
                <div>
                  <h3 className="text-[18px] font-bold text-white group-hover:text-[#F5C21B] transition-colors">{t('subjects', sub.titleKey)}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{sub.count} {t('subjects', 'filesCount')}</p>
                </div>
                <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${sub.color} text-black flex items-center justify-center font-black group-hover:scale-105 transition-transform text-sm`}>
                  &rarr;
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials - Scaled down by ~30% */}
      <section className="bg-[#0F1115] py-[70px] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-[70px]">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <h2 className="text-[30px] font-bold text-white tracking-tight">{t('feedback', 'title')}</h2>
            <p className="text-slate-400 text-sm">
              {t('feedback', 'desc')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              { name: "Aashish Shrestha", roleKey: "student1Role", reviewKey: "student1Review" },
              { name: "Priya Adhikari", roleKey: "student2Role", reviewKey: "student2Review" },
              { name: "Rohit Gurung", roleKey: "student3Role", reviewKey: "student3Review" }
            ].map((test, i) => (
              <div key={i} className="p-6 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col justify-between space-y-4">
                <p className="text-slate-300 italic text-[14px] leading-relaxed">"{t('feedback', test.reviewKey)}"</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#F5C21B]/20 flex items-center justify-center font-bold text-[#F5C21B] text-sm">
                    {test.name[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs">{test.name}</h4>
                    <p className="text-[10px] text-slate-500">{t('feedback', test.roleKey)}</p>
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
            <h2 className="text-[30px] font-bold text-white tracking-tight">{t('faq', 'title')}</h2>
            <p className="text-slate-400 text-sm">
              {t('faq', 'desc')}
            </p>
          </div>

          <div className="space-y-3">
            {[
              { qKey: "q1", aKey: "a1" },
              { qKey: "q2", aKey: "a2" },
              { qKey: "q3", aKey: "a3" },
              { qKey: "q4", aKey: "a4" }
            ].map((faq, i) => (
              <div key={i} className="border border-white/5 rounded-xl overflow-hidden bg-white/[0.01]">
                <button 
                  onClick={() => toggleFaq(i)}
                  className="w-full flex justify-between items-center p-4 text-left font-bold text-[15px] text-white hover:bg-white/[0.02] transition-colors cursor-pointer"
                >
                  <span>{t('faq', faq.qKey)}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${activeFaq === i ? 'rotate-180' : ''}`} />
                </button>
                <div className={`transition-all duration-300 overflow-hidden ${activeFaq === i ? 'max-h-40 border-t border-white/5 p-4' : 'max-h-0'}`}>
                  <p className="text-slate-400 text-xs leading-relaxed">{t('faq', faq.aKey)}</p>
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
              {t('footer', 'tagline')}
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-3 text-sm">{t('footer', 'quickLinks')}</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li><button onClick={() => handleFeatureClick('/')} className="hover:text-[#F5C21B] transition-colors cursor-pointer bg-transparent border-none">{t('footer', 'dashboard')}</button></li>
              <li><button onClick={() => handleFeatureClick('/contribute')} className="hover:text-[#F5C21B] transition-colors cursor-pointer bg-transparent border-none">{t('footer', 'contribute')}</button></li>
              <li><button onClick={() => handleFeatureClick('/syllabus')} className="hover:text-[#F5C21B] transition-colors cursor-pointer bg-transparent border-none">{t('footer', 'syllabus')}</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-3 text-sm">{t('footer', 'contactUs')}</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> support@hamroplustwo.com</li>
              <li className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> +977-1-5555555</li>
              <li className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Kathmandu, Nepal</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-white mb-3 text-sm">{t('footer', 'followUs')}</h4>
            <div className="flex gap-3">
              <a href="#" className="w-7 h-7 rounded-full bg-white/5 hover:bg-[#F5C21B]/15 hover:text-[#F5C21B] flex items-center justify-center transition-colors"><Github className="w-3.5 h-3.5" /></a>
              <a href="#" className="w-7 h-7 rounded-full bg-white/5 hover:bg-[#F5C21B]/15 hover:text-[#F5C21B] flex items-center justify-center transition-colors"><Twitter className="w-3.5 h-3.5" /></a>
              <a href="#" className="w-7 h-7 rounded-full bg-white/5 hover:bg-[#F5C21B]/15 hover:text-[#F5C21B] flex items-center justify-center transition-colors"><Youtube className="w-3.5 h-3.5" /></a>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 md:px-[70px] border-t border-white/5 pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-[11px] text-slate-600">
          <div>&copy; {new Date().getFullYear()} {t('footer', 'copyright')}</div>
          <div className="flex gap-4">
            <Link to="/privacy-policy" className="hover:text-slate-400">{t('footer', 'privacy')}</Link>
            <Link to="/terms-conditions" className="hover:text-slate-400">{t('footer', 'terms')}</Link>
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
