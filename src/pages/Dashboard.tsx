import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { 
  BookOpen, FileText, Target, TrendingUp, AlertCircle, 
  Clock, Calendar, Star, Bookmark, Bell, CheckCircle, 
  MessageSquare, UploadCloud, ChevronRight, BrainCircuit,
  BarChart3, Flame
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getCollegeExamTimer, getGlobalSettings } from '../services/db';
import { ContentGate } from '../components/ContentGate';
import { motion } from 'motion/react';

export const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>({
    progressStats: [],
    notifications: [],
    recentMaterials: [],
    bookmarks: [],
    examTimer: null
  });
  const [loading, setLoading] = useState(true);
  const [premiumOnlyMode, setPremiumOnlyMode] = useState(true);

  useEffect(() => {
    getGlobalSettings().then(settings => {
      setPremiumOnlyMode(settings.premium_only_mode !== false);
    });
  }, []);

  // Check if user is premium or in grace period (e.g., 3 days after expiry)
  let hasPremiumAccess = user?.is_premium;
  if (!hasPremiumAccess && user?.subscription_expiry_date) {
    const expiryDate = new Date(user.subscription_expiry_date);
    const gracePeriodEnd = new Date(expiryDate);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 3); // 3 days grace period
    if (new Date() <= gracePeriodEnd) {
      hasPremiumAccess = true;
    }
  }

  const isLocked = premiumOnlyMode && !hasPremiumAccess && user?.role !== 'admin';

  const handleMaterialClick = (e: React.MouseEvent, url: string, type: string, title?: string, accessLevel?: string) => {
    const isPremiumType = ['pyq', 'syllabus', 'notes'].includes(type.toLowerCase());
    if (isLocked && isPremiumType) {
      e.preventDefault();
      alert("This content is only available for premium users. Please upgrade your account.");
      return;
    }
    
    if (accessLevel === 'secure' && url) {
      e.preventDefault();
      window.open(`/viewer?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title || 'Document Viewer')}`, '_blank');
    }
  };

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        // Fetch Exam Timer
        let examTimer = null;
        if (user.college_id) {
          examTimer = await getCollegeExamTimer(user.college_id);
        }
        // Recent Materials
        let recentMaterials: any[] = [];
        let newMaterialNotifications: any[] = [];
        let validSubjectIds = new Set<string>();
        try {
          const collegeIds = Array.from(new Set([user.college_id || null, null]));
          let materialsQuery = query(
            collection(db, 'contributions'),
            where('status', '==', 'verified'),
            where('college_id', 'in', collegeIds),
            orderBy('created_at', 'desc'),
            limit(20) // Fetch more to allow client-side filtering
          );
          
          const materialsSnapshot = await getDocs(materialsQuery);
          recentMaterials = materialsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

          // Filter by user's year and stream
          if (user.year && user.stream) {
            // We need to know which subjects belong to the user's year and stream
            const subjectsQuery = query(
              collection(db, 'subjects'),
              where('college_id', 'in', collegeIds)
            );
            const subjectsSnap = await getDocs(subjectsQuery);
            validSubjectIds = new Set(
              subjectsSnap.docs
                .map(doc => ({ id: doc.id, ...doc.data() as any }))
                .filter(s => s.year === user.year && s.stream === user.stream)
                .map(s => s.id)
            );
            
            recentMaterials = recentMaterials.filter(m => validSubjectIds.has(m.subject_id));
          }
          
          // Convert recent materials to notifications if they are new (e.g., within last 7 days)
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          
          newMaterialNotifications = recentMaterials
            .filter(m => {
              const mDate = m.created_at?.toDate ? m.created_at.toDate() : (m.created_at?.seconds ? new Date(m.created_at.seconds * 1000) : new Date(m.created_at || 0));
              return mDate > sevenDaysAgo && m.user_id !== user.id;
            })
            .map(m => ({
              id: `mat_${m.id}`,
              title: 'New Material Added',
              message: `New ${m.type} added: ${m.description || 'Check it out!'}`,
              type: 'upload',
              created_at: m.created_at,
              read: false
            }));

          recentMaterials = recentMaterials.slice(0, 3); // Keep only top 3
        } catch (err) {
          console.error("Failed to fetch recent materials:", err);
          // If premium only mode is on, this query might fail for non-premium users.
        }

        // Bookmarks
        const bookmarksQuery = query(
          collection(db, 'bookmarks'),
          where('user_id', '==', user.id),
          orderBy('created_at', 'desc'),
          limit(100) // Fetch more to get a better count
        );
        const bookmarksSnapshot = await getDocs(bookmarksQuery);
        const bookmarks = bookmarksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

        // Progress Stats (Operational)
        const progressStats = [
          { name: 'Subjects Enrolled', value: validSubjectIds ? validSubjectIds.size : 0, icon: 'BookOpen', color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/50' },
          { name: 'Materials Bookmarked', value: bookmarks.length, icon: 'Bookmark', color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/50' },
          { name: 'Contributions Made', value: Math.floor((user.points || 0) / 10), icon: 'UploadCloud', color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/50' },
          { name: 'Available Balance', value: `Rs. ${user.wallet_balance || 0}`, icon: 'TrendingUp', color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/50' },
        ];

        setData(prev => ({ 
          ...prev, 
          progressStats, 
          recentMaterials, 
          bookmarks: bookmarks.slice(0, 4), // Only show top 4 in the list
          examTimer,
          newMaterialNotifications // Store temporarily to merge later
        }));
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
        setLoading(false);
      }
    };

    fetchData();

    // Real-time notifications
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('user_id', '==', user.id),
      orderBy('created_at', 'desc'),
      limit(10)
    );
    
    const unsubscribeNotifications = onSnapshot(notificationsQuery, (snapshot) => {
      const dbNotifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      setData(prev => {
        // Merge DB notifications with new material notifications
        const merged = [...dbNotifications, ...(prev.newMaterialNotifications || [])];
        // Sort by date descending
        merged.sort((a, b) => {
          const dateA = a.created_at?.toDate ? a.created_at.toDate().getTime() : (a.created_at?.seconds ? a.created_at.seconds * 1000 : new Date(a.created_at || 0).getTime());
          const dateB = b.created_at?.toDate ? b.created_at.toDate().getTime() : (b.created_at?.seconds ? b.created_at.seconds * 1000 : new Date(b.created_at || 0).getTime());
          return dateB - dateA;
        });
        
        return { ...prev, notifications: merged.slice(0, 5) };
      });
    }, (error) => {
      console.error('Dashboard notifications onSnapshot error:', error);
    });

    return () => unsubscribeNotifications();
  }, [user]);

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-slate-500">Loading dashboard...</div>;
  }

  // Map string icon names to actual components
  const iconMap: any = {
    BookOpen, FileText, Target, TrendingUp, UploadCloud, CheckCircle, Star, MessageSquare
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'upload': return UploadCloud;
      case 'correction': return CheckCircle;
      case 'approval': return Star;
      case 'withdrawal': return CheckCircle;
      case 'admin': return MessageSquare;
      default: return Bell;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'upload': return 'text-blue-500';
      case 'correction': return 'text-emerald-500';
      case 'approval': return 'text-amber-500';
      case 'withdrawal': return 'text-emerald-500';
      case 'admin': return 'text-purple-500';
      default: return 'text-slate-500';
    }
  };

  const progressStats = data?.progressStats || [];
  const notifications = data?.notifications || [];
  const recentMaterials = data?.recentMaterials || [];
  const bookmarks = data?.bookmarks || [];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-7xl mx-auto pb-12"
    >
      {/* Header & Daily Reminder */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome back, {user?.name}! 👋
          </h1>
          <div className="text-sm text-slate-400 mt-1">
            {user?.stream} • {user?.year}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-xl p-3 flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-800 rounded-lg">
              <Flame className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Daily Revision</p>
              <p className="text-sm font-medium text-slate-300">
                {data.recentMaterials && data.recentMaterials.length > 0 
                  ? `Review ${data.recentMaterials[0].subject_name || 'new materials'} today`
                  : 'Check out new materials today'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Section */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-500" /> My Progress
        </h2>
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {progressStats.map((stat: any) => {
            const IconComponent = iconMap[stat.icon] || BookOpen;
            return (
              <motion.div 
                key={stat.name} 
                whileHover={{ y: -5, scale: 1.02 }}
                className="glass-panel rounded-2xl p-5 flex items-center gap-4"
              >
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <IconComponent className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400">{stat.name}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column: Smart Features */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Exam Countdown */}
          {data.examTimer ? (
            <motion.div whileHover={{ scale: 1.01 }} className="grid grid-cols-1 gap-6">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-900/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-20">
                  <Clock className="w-24 h-24" />
                </div>
                <h3 className="text-lg font-bold mb-1 relative z-10">{data.examTimer.term}</h3>
                <p className="text-emerald-100 text-sm mb-4 relative z-10">Upcoming Examination</p>
                <div className="flex gap-4 relative z-10">
                  <div className="bg-slate-800/20 backdrop-blur-sm rounded-xl p-3 text-center min-w-[70px]">
                    <span className="block text-3xl font-bold">
                      {Math.max(0, Math.floor((new Date(data.examTimer.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))}
                    </span>
                    <span className="text-xs uppercase tracking-wider">Days</span>
                  </div>
                  <div className="bg-slate-800/20 backdrop-blur-sm rounded-xl p-3 text-center min-w-[70px]">
                    <span className="block text-3xl font-bold">
                      {Math.max(0, Math.floor(((new Date(data.examTimer.date).getTime() - new Date().getTime()) / (1000 * 60 * 60)) % 24))}
                    </span>
                    <span className="text-xs uppercase tracking-wider">Hours</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-slate-800 rounded-2xl p-6 text-slate-400 shadow-sm border border-slate-700 flex items-center justify-center text-center">
                <div>
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <h3 className="text-lg font-medium text-slate-300">No Upcoming Exams</h3>
                  <p className="text-sm mt-1">Check back later for exam schedules.</p>
                </div>
              </div>
            </div>
          )}

          {/* Stream Chats Promo / Link */}
          <ContentGate requirePremium fallback={
            <motion.div whileHover={{ y: -2 }} className="glass-panel rounded-2xl p-6 opacity-75">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-emerald-500" /> Stream Chats
                </h3>
                <span className="text-sm text-slate-400 font-medium flex items-center">
                  Premium Only
                </span>
              </div>
              <p className="text-sm text-slate-400 mb-4">
                Connect with students from your college, stream, and year. Discuss topics, share resources, and study together!
              </p>
              <button disabled className="inline-flex items-center justify-center px-4 py-2 bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 font-medium rounded-lg cursor-not-allowed">
                Locked
              </button>
            </motion.div>
          }>
            <motion.div whileHover={{ y: -2 }} className="glass-panel rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-emerald-500" /> Stream Chats
                </h3>
                <Link to="/chat" className="text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-medium flex items-center">
                  Join Chat <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <p className="text-sm text-slate-400 mb-4">
                Connect with students from your college, stream, and year. Discuss topics, share resources, and study together!
              </p>
              <Link to="/chat" className="inline-flex items-center justify-center px-4 py-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 font-medium rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
                Open Stream Chat
              </Link>
            </motion.div>
          </ContentGate>

          {/* Bookmarks & Saved for Later */}
          <motion.div variants={itemVariants} className="glass-panel rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-emerald-500" /> Saved for Later
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {bookmarks.length > 0 ? bookmarks.map((bookmark: any) => (
                <a 
                  key={bookmark.id} 
                  href={`/viewer?url=${encodeURIComponent(bookmark.file_url || '#')}&title=${encodeURIComponent(bookmark.title || 'Document Viewer')}${bookmark.access_level !== 'secure' ? '&download=true' : ''}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={(e) => handleMaterialClick(e, bookmark.file_url, bookmark.type, bookmark.title, bookmark.access_level)}
                  className="p-4 rounded-xl border border-slate-200/50 dark:border-slate-700/50 flex items-start gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors hover-lift"
                >
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white line-clamp-1">{bookmark.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{bookmark.subject} • {bookmark.type}</p>
                  </div>
                </a>
              )) : (
                <p className="text-sm text-slate-400 col-span-2">You haven't saved any materials yet.</p>
              )}
            </div>
          </motion.div>

        </div>

        {/* Right Column: Notifications & Recent */}
        <div className="space-y-6">
          
          {/* Notifications Panel */}
          <motion.div variants={itemVariants} className="glass-panel rounded-2xl overflow-hidden flex flex-col h-[400px] border border-slate-700/50 shadow-lg">
            <div className="p-5 border-b border-slate-700/50 flex items-center justify-between bg-slate-800/80 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-xl">
                  <Bell className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Notifications</h3>
              </div>
              {notifications.length > 0 && (
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold px-2.5 py-1 rounded-full">
                  {notifications.length} New
                </span>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-900/40">
              {notifications.length > 0 ? notifications.map((notif: any) => {
                const NotifIcon = getIcon(notif.type);
                return (
                  <div key={notif.id} className="group p-4 bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/30 hover:border-slate-600/50 rounded-xl transition-all duration-200 flex gap-4 cursor-pointer relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className={`shrink-0 p-2.5 rounded-xl bg-slate-800 border border-slate-700/50 shadow-sm ${getColor(notif.type)}`}>
                      <NotifIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors truncate">{notif.title}</p>
                        <span className="text-[10px] font-medium text-slate-500 shrink-0 mt-0.5">
                          {notif.created_at?.toDate ? notif.created_at.toDate().toLocaleDateString() : (notif.created_at?.seconds ? new Date(notif.created_at.seconds * 1000).toLocaleDateString() : new Date(notif.created_at || notif.time || Date.now()).toLocaleDateString())}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{notif.message}</p>
                    </div>
                  </div>
                );
              }) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3">
                  <div className="p-4 bg-slate-800/50 rounded-full">
                    <Bell className="w-8 h-8 opacity-40" />
                  </div>
                  <p className="text-sm font-medium">No new notifications</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Recently Uploaded */}
          <motion.div variants={itemVariants} className="glass-panel rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-emerald-500" /> Recently Uploaded
            </h3>
            <div className="space-y-4">
              {recentMaterials.length > 0 ? recentMaterials.map((material: any, idx: number) => (
                <a 
                  key={idx} 
                  href={`/viewer?url=${encodeURIComponent(material.file_url || '#')}&title=${encodeURIComponent(material.title || material.description || 'Document Viewer')}${material.access_level !== 'secure' ? '&download=true' : ''}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={(e) => handleMaterialClick(e, material.file_url, material.type, material.title || material.description, material.access_level)}
                  className="flex items-center gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 p-2 rounded-lg transition-colors -mx-2 hover-lift"
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-100/50 dark:bg-slate-700/50 flex items-center justify-center text-slate-400 shrink-0">
                    {material.type === 'PYQ' ? <Target className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white line-clamp-1">{material.title || material.description}</p>
                    <p className="text-xs text-slate-400">{material.subject_name || material.subject} • {material.type}</p>
                  </div>
                </a>
              )) : (
                <p className="text-sm text-slate-400">No recent materials uploaded.</p>
              )}
            </div>
            <Link to="/syllabus" className="mt-4 w-full py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-300 text-sm font-medium rounded-xl transition-colors flex items-center justify-center">
              Browse All Materials
            </Link>
          </motion.div>

        </div>
      </motion.div>
    </motion.div>
  );
};
