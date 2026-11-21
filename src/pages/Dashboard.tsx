import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { 
  BookOpen, 
  FileText, 
  Target, 
  Sparkles,
  Clock, 
  Calendar, 
  Bookmark, 
  Bell, 
  MessageSquare, 
  UploadCloud, 
  ArrowRight, 
  GraduationCap, 
  Award, 
  Wallet, 
  ChevronRight,
  ExternalLink,
  Flame,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getCollegeExamTimer } from '../services/db';
import { motion } from 'motion/react';

interface RecentItem {
  id: string;
  title: string;
  type: string;
  subject: string;
  file_url: string;
  created_at: any;
  author_name?: string;
}

export const Dashboard = () => {
  const { user, hasPremiumAccess, premiumOnlyMode } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [examInfo, setExamInfo] = useState<{ title: string; date: Date } | null>(null);
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // Calculate next default NEB Board Exam Date (typically Baishakh / May)
  const getDefaultExamDate = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    // NEB Board exams usually start around May 5th
    const examDate = new Date(currentYear, 4, 5, 8, 0, 0); // May 5th 8:00 AM
    if (now > examDate) {
      examDate.setFullYear(currentYear + 1);
    }
    return examDate;
  };

  useEffect(() => {
    let timerInterval: any = null;

    const setupExamTimer = async () => {
      let targetDate = getDefaultExamDate();
      let title = 'NEB Board Examination';

      if (user?.college_id) {
        try {
          const collegeExam = await getCollegeExamTimer(user.college_id);
          if (collegeExam && collegeExam.exam_date) {
            const parsed = new Date(collegeExam.exam_date);
            if (!isNaN(parsed.getTime())) {
              targetDate = parsed;
              title = collegeExam.title || `${user.college_name || 'College'} Term Exam`;
            }
          }
        } catch (err) {
          console.warn('Could not fetch college exam timer:', err);
        }
      }

      setExamInfo({ title, date: targetDate });

      const updateCountdown = () => {
        const now = new Date().getTime();
        const difference = targetDate.getTime() - now;

        if (difference > 0) {
          const days = Math.floor(difference / (1000 * 60 * 60 * 24));
          const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((difference % (1000 * 60)) / 1000);
          setTimeLeft({ days, hours, minutes, seconds });
        } else {
          setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        }
      };

      updateCountdown();
      timerInterval = setInterval(updateCountdown, 1000);
    };

    const fetchRecentResources = async () => {
      try {
        setLoading(true);
        const combined: RecentItem[] = [];

        // 1. Fetch latest published academic resources
        try {
          const resSnap = await getDocs(
            query(
              collection(db, 'academic_resources'),
              limit(8)
            )
          );
          resSnap.docs.forEach(doc => {
            const data = doc.data();
            combined.push({
              id: doc.id,
              title: data.title || data.description || 'Study Material',
              type: data.resource_type || 'notes',
              subject: data.subject || data.subject_name || 'General',
              file_url: data.file_url || '',
              created_at: data.created_at,
              author_name: data.created_by_name || 'Hamro +2 Hub'
            });
          });
        } catch (e) {
          console.warn('Error fetching academic_resources for dashboard:', e);
        }

        // 2. Fetch verified contributions
        try {
          const contribSnap = await getDocs(
            query(
              collection(db, 'contributions'),
              where('status', '==', 'verified'),
              limit(8)
            )
          );
          contribSnap.docs.forEach(doc => {
            const data = doc.data();
            combined.push({
              id: doc.id,
              title: data.title || data.description || 'Verified Contribution',
              type: data.type || 'notes',
              subject: data.subject_name || data.subject || 'General',
              file_url: data.file_url || '',
              created_at: data.created_at,
              author_name: data.user_name || 'Student Contributor'
            });
          });
        } catch (e) {
          console.warn('Error fetching contributions for dashboard:', e);
        }

        // Sort descending by created_at
        combined.sort((a, b) => {
          const tA = a.created_at?.toMillis ? a.created_at.toMillis() : (a.created_at?.seconds ? a.created_at.seconds * 1000 : new Date(a.created_at || 0).getTime());
          const tB = b.created_at?.toMillis ? b.created_at.toMillis() : (b.created_at?.seconds ? b.created_at.seconds * 1000 : new Date(b.created_at || 0).getTime());
          return tB - tA;
        });

        setRecentItems(combined.slice(0, 6));
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    setupExamTimer();
    fetchRecentResources();

    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [user]);

  const handleOpenDoc = (item: RecentItem) => {
    if (item.file_url) {
      window.open(
        `/viewer?url=${encodeURIComponent(item.file_url)}&title=${encodeURIComponent(item.title)}&download=true`,
        '_blank'
      );
    } else {
      navigate('/syllabus');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-12 select-auto"
    >
      {/* 1. Welcome & Student Status Header */}
      <motion.div variants={cardVariants} className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900/90 via-slate-800/80 to-slate-900/90 border border-slate-700/60 shadow-xl backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                NEB Academic Hub
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 capitalize">
                {user?.role || 'Student'}
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Namaste, <span className="text-[#F5C21B]">{user?.name || 'Scholar'}</span>!
            </h1>
            
            <p className="text-sm text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="flex items-center gap-1 text-slate-300">
                <GraduationCap className="w-4 h-4 text-emerald-400" />
                {user?.college_name || 'National Curriculum (+2)'}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-300 font-medium">
                {user?.year || 'Class 11 / 12'}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-300 font-medium">
                {user?.stream || 'Science & Management'}
              </span>
            </p>
          </div>

          {/* Quick Wallet / Rewards Card */}
          <div className="shrink-0 flex items-center gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-700/60 backdrop-blur-md">
            <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-[#F5C21B]">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Contributor Balance</div>
              <div className="text-lg sm:text-xl font-bold text-white tracking-tight">
                NPR {typeof user?.wallet_balance === 'number' ? user.wallet_balance.toFixed(2) : (user?.wallet_balance || '0.00')}
              </div>
              <Link to="/contribute" className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 mt-0.5 font-medium transition-colors">
                Upload & Earn <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 2. Upcoming Exam Countdown Banner */}
      <motion.div variants={cardVariants} className="p-5 sm:p-6 rounded-3xl bg-slate-900/85 border border-slate-700/60 shadow-lg backdrop-blur-md flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-1 max-w-lg">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs tracking-wider uppercase">
            <Clock className="w-4 h-4 text-amber-400" />
            Upcoming Exam Target
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            {examInfo?.title || 'NEB Board Examinations'}
          </h2>
          <p className="text-xs text-slate-400">
            Target date: <span className="text-slate-300 font-medium">{examInfo?.date ? examInfo.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'May 2027'}</span>. Prepare daily with past question papers and revision notes.
          </p>
        </div>

        {/* Live Countdown Digits */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex-1 sm:flex-initial text-center px-3 sm:px-4 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-2xl min-w-[64px] sm:min-w-[76px]">
            <div className="text-xl sm:text-2xl font-black text-[#F5C21B]">{timeLeft.days}</div>
            <div className="text-[10px] uppercase font-semibold text-slate-400">Days</div>
          </div>
          <span className="text-slate-600 font-bold text-lg">:</span>
          <div className="flex-1 sm:flex-initial text-center px-3 sm:px-4 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-2xl min-w-[64px] sm:min-w-[76px]">
            <div className="text-xl sm:text-2xl font-black text-white">{String(timeLeft.hours).padStart(2, '0')}</div>
            <div className="text-[10px] uppercase font-semibold text-slate-400">Hours</div>
          </div>
          <span className="text-slate-600 font-bold text-lg">:</span>
          <div className="flex-1 sm:flex-initial text-center px-3 sm:px-4 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-2xl min-w-[64px] sm:min-w-[76px]">
            <div className="text-xl sm:text-2xl font-black text-white">{String(timeLeft.minutes).padStart(2, '0')}</div>
            <div className="text-[10px] uppercase font-semibold text-slate-400">Mins</div>
          </div>
          <span className="text-slate-600 font-bold text-lg">:</span>
          <div className="flex-1 sm:flex-initial text-center px-3 sm:px-4 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-2xl min-w-[64px] sm:min-w-[76px]">
            <div className="text-xl sm:text-2xl font-black text-emerald-400">{String(timeLeft.seconds).padStart(2, '0')}</div>
            <div className="text-[10px] uppercase font-semibold text-slate-400">Secs</div>
          </div>
        </div>
      </motion.div>

      {/* 3. 4 High-Yield Primary Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: PYQ Bank */}
        <motion.div variants={cardVariants}>
          <Link
            to="/pyq"
            className="group block p-6 rounded-3xl bg-slate-900/85 hover:bg-slate-800/90 border border-slate-700/60 hover:border-amber-500/40 transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-1 h-full flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[#F5C21B] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-[#F5C21B] transition-colors mb-1">
                Past Year Questions
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Solve authentic NEB Board question papers, model question sets, and chapter-wise collections.
              </p>
            </div>
            <div className="mt-5 flex items-center text-xs font-semibold text-amber-400 group-hover:translate-x-1 transition-transform">
              Explore PYQs <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </Link>
        </motion.div>

        {/* Card 2: Syllabus & Notes */}
        <motion.div variants={cardVariants}>
          <Link
            to="/syllabus"
            className="group block p-6 rounded-3xl bg-slate-900/85 hover:bg-slate-800/90 border border-slate-700/60 hover:border-emerald-500/40 transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-1 h-full flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors mb-1">
                Syllabus & Notes
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Curriculum outlines, revision summaries, formula sheets, and verified class notes.
              </p>
            </div>
            <div className="mt-5 flex items-center text-xs font-semibold text-emerald-400 group-hover:translate-x-1 transition-transform">
              Browse Notes <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </Link>
        </motion.div>

        {/* Card 3: AI Exam Tutor */}
        <motion.div variants={cardVariants}>
          <Link
            to="/chat"
            className="group block p-6 rounded-3xl bg-slate-900/85 hover:bg-slate-800/90 border border-slate-700/60 hover:border-blue-500/40 transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-1 h-full flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors mb-1">
                Hamro AI Tutor
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                24/7 instant homework doubt clearance, step-by-step problem solver, and NEB formula guides.
              </p>
            </div>
            <div className="mt-5 flex items-center text-xs font-semibold text-blue-400 group-hover:translate-x-1 transition-transform">
              Start Chat <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </Link>
        </motion.div>

        {/* Card 4: Contribute & Earn */}
        <motion.div variants={cardVariants}>
          <Link
            to="/contribute"
            className="group block p-6 rounded-3xl bg-slate-900/85 hover:bg-slate-800/90 border border-slate-700/60 hover:border-purple-500/40 transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-1 h-full flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-purple-400 transition-colors mb-1">
                Contribute & Earn
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Upload your handwritten notes, past question solutions, and receive cash rewards straight to your wallet.
              </p>
            </div>
            <div className="mt-5 flex items-center text-xs font-semibold text-purple-400 group-hover:translate-x-1 transition-transform">
              Upload Material <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </Link>
        </motion.div>
      </div>

      {/* 4. Bottom Grid: Recently Added Materials & Quick Curriculum Jump */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recently Added Study Materials */}
        <motion.div variants={cardVariants} className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/85 border border-slate-700/60 shadow-lg backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-[#F5C21B]">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Recently Added Study Materials</h3>
                <p className="text-xs text-slate-400">Fresh notes, question sets, and curriculum resources</p>
              </div>
            </div>
            <Link to="/syllabus" className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-2">
              <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
              <p className="text-xs text-slate-400">Loading verified materials...</p>
            </div>
          ) : recentItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {recentItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleOpenDoc(item)}
                  className="p-3.5 rounded-2xl bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group flex items-start gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-300 group-hover:text-amber-400 shrink-0 group-hover:scale-105 transition-all">
                    {item.type.toLowerCase().includes('pyq') || item.type.toLowerCase().includes('question') ? (
                      <Target className="w-5 h-5" />
                    ) : (
                      <BookOpen className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors truncate">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <span className="capitalize text-amber-400/90 font-medium">{item.type}</span>
                      <span>•</span>
                      <span className="truncate">{item.subject}</span>
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-slate-300 shrink-0 mt-1 transition-colors" />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 space-y-3">
              <BookOpen className="w-10 h-10 mx-auto text-slate-600" />
              <p className="text-sm font-medium">New academic materials are being prepared for your stream.</p>
              <Link to="/syllabus" className="inline-block px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors">
                Browse Full Library
              </Link>
            </div>
          )}
        </motion.div>

        {/* Right 1 Col: Academic Quick Links & Tips */}
        <motion.div variants={cardVariants} className="p-6 rounded-3xl bg-slate-900/85 border border-slate-700/60 shadow-lg backdrop-blur-md flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Exam Preparation Tips</h3>
                <p className="text-xs text-slate-400">NEB Success Strategies</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 rounded-2xl bg-slate-950/50 border border-slate-800/80 flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">Solve at least 5 years of PYQs</div>
                  <p className="text-slate-400 mt-0.5">Over 60% of board questions follow predictable formats from previous exam cycles.</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/50 border border-slate-800/80 flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">Check Official Marking Schemes</div>
                  <p className="text-slate-400 mt-0.5">Review verified PYQ solutions to see how step-by-step marks are awarded.</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/50 border border-slate-800/80 flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">Ask AI for Concept Clarity</div>
                  <p className="text-slate-400 mt-0.5">Stuck on derivations or numerical problems? Use Hamro AI Tutor for immediate answers.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-emerald-500/10 border border-amber-500/20 text-center">
            <h4 className="text-xs font-bold text-white mb-1">Need Help or Found an Issue?</h4>
            <p className="text-[11px] text-slate-400 mb-2">Our support team and academic moderators are here for you.</p>
            <Link to="/contact" className="inline-block text-xs font-semibold text-[#F5C21B] hover:underline">
              Contact Academic Support →
            </Link>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
