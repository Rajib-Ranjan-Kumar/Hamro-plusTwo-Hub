import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, FileText, Upload, Trophy, CheckCircle, Users, Play, ChevronDown, Rocket, User, Loader2, AlertCircle, X, Mail, MapPin, Phone, Github, Twitter, Youtube } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SEO } from '../components/SEO';
import { auth, googleProvider, db } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { getFirebaseErrorMessage } from '../utils/firebaseErrors';

// Language translation dictionary
const TRANSLATIONS = {
  en: {
    home: "Home",
    about: "About",
    contact: "Contact",
    faq: "FAQ",
    privacyPolicy: "Privacy Policy",
    termsConditions: "Terms & Conditions",
    pyqs: "PYQs",
    notes: "Notes",
    syllabus: "Syllabus",
    chat: "Chat",
    membership: "Membership",
    logIn: "Log In",
    english: "English",
    nepali: "नेपाली",
    title: "Your Effort,\nOur Support",
    subtitle: "PYQs, Notes & Study Materials\nfor Your Success...",
    getStarted: "🚀 Get Started",
    exploreNow: "▶ Explore Now",
    watchVideo: "Watch How Hamro +2 Works",
    whyTitle: "Why Hamro +2?",
    whyDesc: "We provide a complete study companion for +2 science and management students in Nepal. Easily access question banks, notes, exam patterns, and complete resources for your term prep.",
    smartLearning: "Smart Learning",
    smartLearningDesc: "Access high-quality revision files, subject guides, and verified reference documents.",
    freeResources: "Free Resources",
    freeResourcesDesc: "No subscriptions required. Free updates on notes and solutions from top colleges.",
    easyAccess: "Easy Access",
    easyAccessDesc: "Clean navigation and simple downloads for preparation on the go.",
    everythingTitle: "Everything You Need",
    everythingDesc: "All the tools and resources you need to excel in your +2 examinations.",
    pyqCardTitle: "Previous Year Questions",
    pyqCardDesc: "Detailed past papers with step-by-step solution breakdowns for revision.",
    notesCardTitle: "Structured Notes",
    notesCardDesc: "Handwritten and typed notes from top teachers in Kathmandu Valley.",
    contributeCardTitle: "Contribute Notes",
    contributeCardDesc: "Share your own class notes to help peers and get recognized on our platform.",
    leaderboardCardTitle: "Student Leaderboard",
    leaderboardCardDesc: "Earn reputation badges for verified notes uploads and correct solutions.",
    chatCardTitle: "Peer Discussions",
    chatCardDesc: "Ask doubts and get answers from fellow +2 students across Nepal.",
    syllabusCardTitle: "Syllabus Compliance",
    syllabusCardDesc: "100% updated according to the latest NEB board exam patterns.",
    accessSubjectsTitle: "Access Course Subjects",
    accessSubjectsDesc: "Choose your course and access curated notes, questions, and guides.",
    physics: "Physics",
    chemistry: "Chemistry",
    biology: "Biology",
    mathematics: "Mathematics",
    computerScience: "Computer Science",
    englishSub: "English",
    filesCount: "Files",
    studentFeedback: "Student Feedback",
    studentFeedbackDesc: "Hear what students and contributors from colleges across Nepal say.",
    faqTitle: "Frequently Asked Questions",
    faqDesc: "Quick answers to the common questions about Hamro +2 Hub.",
    footerDesc: "Nepal's collaborative platform for high school students. Quality resources, syllabus references, and term guides.",
    quickLinks: "Quick Links",
    contactUs: "Contact Us",
    followUs: "Follow Us",
    copyright: "Hamro +2 Hub. Made with love in Nepal. All rights reserved.",
    faqs: [
      { q: "Is Hamro +2 Hub completely free to use?", a: "Yes, access to all note files, term papers, and solutions is 100% free with no hidden charges." },
      { q: "How can I contribute my study materials?", a: "Register/Login with Google, click the Contribute tab in your dashboard, and upload your PDF files." },
      { q: "Are the resources aligned with NEB board?", a: "Yes, all materials are verified according to the latest syllabus of Nepal National Examinations Board (NEB)." },
      { q: "How does the student leaderboard badge system work?", a: "You earn repute points each time your contributed document is downloaded or approved by admin." }
    ],
    testimonials: [
      { name: "Aashish Shrestha", role: "St. Xavier's College", review: "The mathematics notes solved references are amazing. Saved a lot of time before my board terminals." },
      { name: "Priya Adhikari", role: "Trinity International", review: "Direct downloads and neat interface. Highly recommend for NEB board exams preparation notes." },
      { name: "Rohit Gurung", role: "KMC Lalitpur", review: "Contributing notes is highly motivating. The leaderboard badge adds a fun competitive touch." }
    ]
  },
  ne: {
    home: "गृहपृष्ठ",
    about: "हाम्रो बारेमा",
    contact: "सम्पर्क",
    faq: "प्रश्नोत्तर",
    privacyPolicy: "गोपनीयता नीति",
    termsConditions: "शर्त र नियमहरू",
    pyqs: "पुराना प्रश्नहरू",
    notes: "नोटहरू",
    syllabus: "पाठ्यक्रम",
    chat: "च्याट",
    membership: "सदस्यता",
    logIn: "लग इन",
    english: "English",
    nepali: "नेपाली",
    title: "तपाईँको मेहनत,\nहाम्रो सहयोग",
    subtitle: "PYQs, नोटहरू र अध्ययन सामग्रीहरू\nतपाईँको सफलताको लागि...",
    getStarted: "🚀 सुरु गर्नुहोस्",
    exploreNow: "▶ अहिले अन्वेषण गर्नुहोस्",
    watchVideo: "हाम्रो +२ कसरी काम गर्छ हेर्नुहोस्",
    whyTitle: "हाम्रो +२ किन?",
    whyDesc: "हामी नेपालमा +२ विज्ञान र व्यवस्थापनका विद्यार्थीहरूको लागि पूर्ण अध्ययन साथी प्रदान गर्दछौं। आफ्नो परीक्षा तयारीको लागि सजिलैसँग प्रश्न बैंकहरू, नोटहरू र पाठ्यक्रमहरू पहुँच गर्नुहोस्।",
    smartLearning: "स्मार्ट सिकाइ",
    smartLearningDesc: "उच्च गुणस्तरका नोटहरू, विषयगत गाईडहरू र प्रमाणित कागजातहरू पहुँच गर्नुहोस्।",
    freeResources: "नि:शुल्क स्रोतहरू",
    freeResourcesDesc: "कुनै शुल्क आवश्यक छैन। उत्कृष्ट कलेजहरूका नोटहरू र समाधानहरू नि:शुल्क प्राप्त गर्नुहोस्।",
    easyAccess: "सजिलो पहुँच",
    easyAccessDesc: "सजिलो नेभिगेसन र सजिलो डाउनलोडहरू मार्फत जहाँसुकैबाट अध्ययन गर्नुहोस्।",
    everythingTitle: "तपाईँलाई चाहिने सबै कुरा",
    everythingDesc: "तपाईँको +२ परीक्षामा उत्कृष्ट प्रदर्शन गर्न आवश्यक पर्ने सबै उपकरण र स्रोतहरू।",
    pyqCardTitle: "पुराना प्रश्नहरू (PYQs)",
    pyqCardDesc: "परीक्षाको तयारीको लागि विस्तृत उत्तरसहितका पुराना प्रश्न पत्रहरू।",
    notesCardTitle: "व्यवस्थित नोटहरू",
    notesCardDesc: "काठमाडौं उपत्यकाका उत्कृष्ट शिक्षकहरूले तयार पारेका हस्तलिखित र टाइप गरिएका नोटहरू।",
    contributeCardTitle: "योगदान गर्नुहोस्",
    contributeCardDesc: "साथीहरूलाई मद्दत गर्न आफ्नै नोटहरू साझा गर्नुहोस् र हाम्रो प्लेटफर्ममा पुरस्कृत हुनुहोस्।",
    leaderboardCardTitle: "विद्यार्थी लिडरबोर्ड",
    leaderboardCardDesc: "प्रमाणित नोट अपलोड र सही समाधानको लागि लिडरबोर्डमा स्थान प्राप्त गर्नुहोस्।",
    chatCardTitle: "साथीहरूसँग छलफल",
    chatCardDesc: "नेपालभरिका +२ विद्यार्थीहरूसँग प्रश्न सोध्नुहोस् र उत्तरहरू प्राप्त गर्नुहोस्।",
    syllabusCardTitle: "पाठ्यक्रम अनुकूलता",
    syllabusCardDesc: "नेपाल राष्ट्रिय परीक्षा बोर्ड (NEB) को पछिल्लो पाठ्यक्रम अनुसार १००% अद्यावधिक।",
    accessSubjectsTitle: "विषयहरू पहुँच गर्नुहोस्",
    accessSubjectsDesc: "आफ्नो विषय छनौट गर्नुहोस् र सम्बन्धित नोटहरू, प्रश्नहरू र गाईडहरू पहुँच गर्नुहोस्।",
    physics: "भौतिक विज्ञान (Physics)",
    chemistry: "रसायन विज्ञान (Chemistry)",
    biology: "जीवविज्ञान (Biology)",
    mathematics: "गणित (Mathematics)",
    computerScience: "कम्प्युटर विज्ञान",
    englishSub: "अंग्रेजी (English)",
    filesCount: "फाइलहरू",
    studentFeedback: "विद्यार्थीहरूको प्रतिक्रिया",
    studentFeedbackDesc: "नेपालभरिका कलेजका विद्यार्थी र योगदानकर्ताहरूले के भन्छन्, सुन्नुहोस्।",
    faqTitle: "बारम्बार सोधिने प्रश्नहरू",
    faqDesc: "Hamro +2 Hub को बारेमा सोधिने साझा प्रश्नहरूको द्रुत जवाफ।",
    footerDesc: "नेपालका उच्च माध्यमिक विद्यार्थीहरूको लागि साझा डिजिटल प्लेटफर्म। गुणस्तरीय स्रोतहरू, पाठ्यक्रम र परीक्षा निर्देशिका।",
    quickLinks: "द्रुत लिङ्कहरू",
    contactUs: "सम्पर्क गर्नुहोस्",
    followUs: "हामीलाई पछ्याउनुहोस्",
    copyright: "Hamro +2 Hub। नेपालमा मायाका साथ बनाइएको। सबै अधिकार सुरक्षित।",
    faqs: [
      { q: "के Hamro +2 Hub प्रयोग गर्न पूर्ण रूपमा नि:शुल्क छ?", a: "हो, सबै नोट फाइलहरू, परीक्षाका प्रश्नहरू र उत्तरहरू पहुँच गर्न १००% नि:शुल्क छ र कुनै लुकेको शुल्क छैन।" },
      { q: "मैले आफ्नो अध्ययन सामग्री कसरी योगदान गर्न सक्छु?", a: "गुगलबाट दर्ता/लगइन गर्नुहोस्, आफ्नो ड्यासबोर्डमा रहेको 'योगदान' ट्याबमा क्लिक गर्नुहोस् र आफ्ना PDF फाइलहरू अपलोड गर्नुहोस्।" },
      { q: "के सामग्रीहरू NEB बोर्डसँग मिल्दाजुल्दा छन्?", a: "हो, सबै अध्ययन सामग्रीहरू नेपाल राष्ट्रिय परीक्षा बोर्ड (NEB) को पछिल्लो पाठ्यक्रम अनुसार प्रमाणित गरिएका छन्।" },
      { q: "विद्यार्थी लिडरबोर्ड ब्याज प्रणालीले कसरी काम गर्छ?", a: "तपाईंले योगदान गर्नुभएको कागजात डाउनलोड हुँदा वा एडमिनद्वारा स्वीकृत हुँदा तपाईंले स्टार/प्रतिष्ठा अंकहरू कमाउनुहुनेछ।" }
    ],
    testimonials: [
      { name: "आशिष श्रेष्ठ", role: "सेन्ट जेभियर्स कलेज", review: "गणित विषयका नोट र समाधानहरू एकदमै राम्रा छन्। यसले मेरो बोर्ड परीक्षाको तयारीमा धेरै समय बचायो।" },
      { name: "प्रिया अधिकारी", role: "ट्रिनिटी इन्टरनेशनल", review: "सजिलो डाउनलोड र सफा इन्टरफेस। NEB बोर्ड परीक्षा तयारीका नोटहरूको लागि म यसलाई प्रयोग गर्न सिफारिस गर्दछु।" },
      { name: "रोहित गुरुङ", role: "केएमसी ललितपुर", review: "नोटहरू योगदान गर्न पाउँदा धेरै खुसी लाग्छ। लिडरबोर्ड प्रणालीले थप उत्प्रेरणा दिन्छ।" }
    ]
  }
};

export const Landing = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [toastError, setToastError] = useState('');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  const [lang, setLang] = useState<'en' | 'ne'>('en');
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  const t = TRANSLATIONS[lang];

  // Automatically trigger Auth popup if redirected from a protected route
  useEffect(() => {
    if (location.state?.from) {
      handleGoogleLogin(location.state.from.pathname);
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

  const handleGoogleLogin = async (path: string = '') => {
    setIsLoggingIn(true);
    setToastError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await handleSessionUpdate(result.user);
      
      const destination = path || redirectPath || location.state?.from?.pathname || '/';
      navigate(destination);
    } catch (err: any) {
      console.error("Google auth failed:", err);
      // Only show error toast if it wasn't cancelled by the user
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setToastError(getFirebaseErrorMessage(err));
      }
      setIsLoggingIn(false);
    }
  };

  const handleFeatureClick = (path: string) => {
    setRedirectPath(path);
    handleGoogleLogin(path);
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
            <a href="/" className="hover:text-white transition-colors">{t.home}</a>
            <a href="#about" className="hover:text-white transition-colors">{t.about}</a>
            <Link to="/contact" className="hover:text-white transition-colors">{t.contact}</Link>
            <Link to="/faq" className="hover:text-white transition-colors">{t.faq}</Link>
            <Link to="/privacy-policy" className="hover:text-white transition-colors">{t.privacyPolicy}</Link>
            
            {/* Protected Links */}
            <button onClick={() => handleFeatureClick('/pyq')} className="hover:text-white transition-colors cursor-pointer bg-transparent border-none">{t.pyqs}</button>
            <button onClick={() => handleFeatureClick('/syllabus')} className="hover:text-white transition-colors cursor-pointer bg-transparent border-none">{t.notes}</button>
            <button onClick={() => handleFeatureClick('/syllabus')} className="hover:text-white transition-colors cursor-pointer bg-transparent border-none">{t.syllabus}</button>
            <button onClick={() => handleFeatureClick('/chat')} className="hover:text-white transition-colors cursor-pointer bg-transparent border-none">{t.chat}</button>
            <button onClick={() => handleFeatureClick('/get-premium')} className="hover:text-white transition-colors cursor-pointer bg-transparent border-none">{t.membership}</button>
          </div>

          {/* Language Selector Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              className="flex items-center gap-1.5 h-[36px] px-[14px] border border-white/80 rounded-full text-white text-[15px] font-semibold hover:bg-white/10 transition-all cursor-pointer select-none"
            >
              <span>{lang === 'en' ? 'English' : 'नेपाली'}</span>
              <ChevronDown className={`w-4 h-4 text-white transition-transform duration-200 ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            <AnimatePresence>
              {isLangDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsLangDropdownOpen(false)} />
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-[120px] bg-slate-800/95 border border-slate-700/80 backdrop-blur-md rounded-xl py-1.5 shadow-xl z-20"
                  >
                    <button 
                      onClick={() => {
                        setLang('en');
                        setIsLangDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-semibold hover:bg-white/5 transition-all ${lang === 'en' ? 'text-[#F5C21B]' : 'text-slate-300'}`}
                    >
                      English
                    </button>
                    <button 
                      onClick={() => {
                        setLang('ne');
                        setIsLangDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-semibold hover:bg-white/5 transition-all ${lang === 'ne' ? 'text-[#F5C21B]' : 'text-slate-300'}`}
                    >
                      नेपाली
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Log In Button - Gold Pill */}
          <button 
            onClick={() => handleGoogleLogin('/')}
            className="bg-[#F5C21B] hover:bg-[#e0b018] text-black h-[36px] px-[21px] rounded-full font-semibold text-[14px] transition-all flex items-center gap-1.5 shadow-md cursor-pointer hover:scale-102"
          >
            <User className="w-4 h-4 stroke-[2.5px]" />
            <span>{t.logIn}</span>
          </button>
        </motion.nav>

        {/* Hero Left Content - Vertically Centered */}
        <div className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-6 md:px-[80px] flex flex-col justify-center">
          <div className="max-w-[520px] text-left space-y-[24px]">
            {/* Main Title - Dynamic Translation */}
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              style={{ fontSize: 'clamp(20px, 6.5vw, 72px)' }}
              className="font-extrabold text-white leading-[1.15] tracking-tight whitespace-pre-line select-text"
            >
              {t.title}
            </motion.h1>

            {/* Subtitle - Dynamic Translation */}
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              style={{ fontSize: 'clamp(12px, 2.8vw, 32px)' }}
              className="font-normal text-white leading-[1.3] whitespace-pre-line select-text"
            >
              {t.subtitle}
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
                onClick={() => handleGoogleLogin('/')}
                className="bg-[#F5C21B] hover:bg-[#e0b018] text-black font-semibold text-[20px] h-[45px] w-[154px] rounded-[12px] flex items-center justify-center gap-1.5 transition-all hover:scale-103 shadow-lg cursor-pointer animate-in fade-in"
              >
                <span>{t.getStarted}</span>
              </button>

              {/* Button 2: Explore Now */}
              <a 
                href="#about"
                className="bg-black/35 hover:bg-black/50 border border-white/35 text-white font-normal text-[20px] h-[45px] w-[168px] rounded-[12px] flex items-center justify-center gap-1.5 transition-all hover:scale-102 backdrop-blur-sm cursor-pointer"
              >
                <span>{t.exploreNow}</span>
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
            <h3 className="text-base font-bold text-[#F5C21B] tracking-wide uppercase">{t.watchVideo}</h3>
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
            <h2 className="text-[36px] font-bold text-white tracking-tight leading-none">{t.whyTitle}</h2>
            <p className="text-slate-300 text-[15px] leading-relaxed">
              {t.whyDesc}
            </p>

            <div className="grid gap-3">
              {[
                { icon: FileText, title: t.smartLearning, desc: t.smartLearningDesc },
                { icon: BookOpen, title: t.freeResources, desc: t.freeResourcesDesc },
                { icon: CheckCircle, title: t.easyAccess, desc: t.easyAccessDesc }
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
            <h2 className="text-[30px] font-bold text-white tracking-tight">{t.everythingTitle}</h2>
            <p className="text-slate-400 text-sm">
              {t.everythingDesc}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: FileText, title: t.pyqCardTitle, desc: t.pyqCardDesc, path: "/pyq" },
              { icon: BookOpen, title: t.notesCardTitle, desc: t.notesCardDesc, path: "/syllabus" },
              { icon: Upload, title: t.contributeCardTitle, desc: t.contributeCardDesc, path: "/contribute" },
              { icon: Trophy, title: t.leaderboardCardTitle, desc: t.leaderboardCardDesc, path: "/leaderboard" },
              { icon: Users, title: t.chatCardTitle, desc: t.chatCardDesc, path: "/chat" },
              { icon: CheckCircle, title: t.syllabusCardTitle, desc: t.syllabusCardDesc, path: "/syllabus" }
            ].map((feature, i) => (
              <div 
                key={i} 
                onClick={() => handleFeatureClick(feature.path)}
                className="p-6 rounded-xl bg-white/[0.03] border border-white/5 hover:border-[#F5C21B]/50 transition-all group hover:-translate-y-1 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-800/80 flex items-center justify-center mb-4 group-hover:bg-[#F5C21B]/10 transition-colors">
                  <feature.icon className="w-4 h-4 text-slate-400 group-hover:text-[#F5C21B] transition-all" />
                </div>
                <h3 className="text-[16px] font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Subjects Section - Scaled down by ~30% */}
      <section className="bg-[#0F172A] py-[70px] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-[70px]">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <h2 className="text-[30px] font-bold text-white tracking-tight">{t.accessSubjectsTitle}</h2>
            <p className="text-slate-400 text-sm">
              {t.accessSubjectsDesc}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { title: t.physics, count: `140+ ${t.filesCount}`, color: "from-[#F5C21B] to-[#e0b018]" },
              { title: t.chemistry, count: `120+ ${t.filesCount}`, color: "from-[#F5C21B] to-[#e0b018]" },
              { title: t.biology, count: `90+ ${t.filesCount}`, color: "from-[#F5C21B] to-[#e0b018]" },
              { title: t.mathematics, count: `150+ ${t.filesCount}`, color: "from-[#F5C21B] to-[#e0b018]" },
              { title: t.computerScience, count: `80+ ${t.filesCount}`, color: "from-[#F5C21B] to-[#e0b018]" },
              { title: t.englishSub, count: `70+ ${t.filesCount}`, color: "from-[#F5C21B] to-[#e0b018]" }
            ].map((sub, i) => (
              <div 
                key={i} 
                onClick={() => handleFeatureClick('/syllabus')}
                className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex justify-between items-center group hover:bg-white/[0.04] transition-all cursor-pointer"
              >
                <div>
                  <h3 className="text-[18px] font-bold text-white group-hover:text-[#F5C21B] transition-colors">{sub.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{sub.count}</p>
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
            <h2 className="text-[30px] font-bold text-white tracking-tight">{t.studentFeedback}</h2>
            <p className="text-slate-400 text-sm">
              {t.studentFeedbackDesc}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {t.testimonials.map((test, i) => (
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
            <h2 className="text-[30px] font-bold text-white tracking-tight">{t.faqTitle}</h2>
            <p className="text-slate-400 text-sm">
              {t.faqDesc}
            </p>
          </div>

          <div className="space-y-3">
            {t.faqs.map((faq, i) => (
              <div key={i} className="border border-white/5 rounded-xl overflow-hidden bg-white/[0.01]">
                <button 
                  onClick={() => toggleFaq(i)}
                  className="w-full flex justify-between items-center p-4 text-left font-bold text-[15px] text-white hover:bg-white/[0.02] transition-colors cursor-pointer animate-in fade-in duration-300"
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
              {t.footerDesc}
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-3 text-sm">{t.quickLinks}</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li><button onClick={() => handleFeatureClick('/')} className="hover:text-[#F5C21B] transition-colors cursor-pointer bg-transparent border-none">{t.home}</button></li>
              <li><button onClick={() => handleFeatureClick('/contribute')} className="hover:text-[#F5C21B] transition-colors cursor-pointer bg-transparent border-none">{t.contributeCardTitle}</button></li>
              <li><button onClick={() => handleFeatureClick('/syllabus')} className="hover:text-[#F5C21B] transition-colors cursor-pointer bg-transparent border-none">{t.syllabus}</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-3 text-sm">{t.contactUs}</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> support@hamroplustwo.com</li>
              <li className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> +977-1-5555555</li>
              <li className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Kathmandu, Nepal</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-white mb-3 text-sm">{t.followUs}</h4>
            <div className="flex gap-3">
              <a href="#" className="w-7 h-7 rounded-full bg-white/5 hover:bg-[#F5C21B]/15 hover:text-[#F5C21B] flex items-center justify-center transition-colors"><Github className="w-3.5 h-3.5" /></a>
              <a href="#" className="w-7 h-7 rounded-full bg-white/5 hover:bg-[#F5C21B]/15 hover:text-[#F5C21B] flex items-center justify-center transition-colors"><Twitter className="w-3.5 h-3.5" /></a>
              <a href="#" className="w-7 h-7 rounded-full bg-white/5 hover:bg-[#F5C21B]/15 hover:text-[#F5C21B] flex items-center justify-center transition-colors"><Youtube className="w-3.5 h-3.5" /></a>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 md:px-[70px] border-t border-white/5 pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-[11px] text-slate-600">
          <div>&copy; {new Date().getFullYear()} {t.copyright}</div>
          <div className="flex gap-4">
            <Link to="/privacy-policy" className="hover:text-slate-400">{t.privacyPolicy}</Link>
            <Link to="/terms-conditions" className="hover:text-slate-400">{t.termsConditions}</Link>
          </div>
        </div>
      </footer>

      {/* Global Background Authenticating Loader */}
      {isLoggingIn && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="flex flex-col items-center gap-3 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-[#F5C21B]" />
            <p className="text-slate-300 text-sm font-semibold">Connecting to Google Account...</p>
          </div>
        </div>
      )}

      {/* Authentication Floating Toast Notification */}
      <AnimatePresence>
        {toastError && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-55 max-w-sm bg-rose-950/90 border border-rose-500/30 backdrop-blur-md rounded-2xl p-4 shadow-2xl flex items-start gap-3 text-rose-300"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs leading-relaxed">
              <p className="font-bold text-white mb-0.5">Authentication Error</p>
              <p>{toastError}</p>
            </div>
            <button 
              onClick={() => setToastError('')}
              className="text-rose-400 hover:text-white p-0.5 hover:bg-white/5 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
