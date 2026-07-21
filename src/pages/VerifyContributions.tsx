import React, { useState, useEffect } from 'react';
import { 
  getColleges, 
  getSubjects, 
  approveContribution, 
  rejectContribution 
} from '../services/db';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot
} from 'firebase/firestore';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  ExternalLink, 
  Search, 
  Filter, 
  Loader2, 
  FileText, 
  User as UserIcon,
  Check,
  History,
  BookOpen,
  GraduationCap,
  Calendar,
  Layers
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export const VerifyContributions = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [colleges, setColleges] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  
  // Review State
  const [reviewData, setReviewData] = useState<Record<string, { reward: number, comment: string }>>({});
  const [isApproving, setIsApproving] = useState<string | null>(null);
  const [isRejecting, setIsRejecting] = useState<string | null>(null);

  useEffect(() => {
    // Fetch Colleges for display
    getColleges().then(data => setColleges(data));

    // Fetch Subjects for display
    getSubjects().then(data => setSubjects(data));

    // Fetch Contributions
    const q = query(collection(db, 'contributions'), orderBy('created_at', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const contributionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const pending = contributionsData.filter((r: any) => r.status === 'pending');
      setRequests(pending);
      setHistory(contributionsData.filter((r: any) => r.status !== 'pending'));
      
      // Initialize review data
      const initialReview: Record<string, { reward: number, comment: string }> = {};
      pending.forEach((c: any) => {
        initialReview[c.id] = { reward: 50, comment: '' };
      });
      setReviewData(prev => ({ ...initialReview, ...prev }));
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleReviewChange = (id: string, field: 'reward' | 'comment', value: any) => {
    setReviewData(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  const handleAction = async (contributionId: string, status: 'verified' | 'rejected') => {
    try {
      if (status === 'verified') {
        setIsApproving(contributionId);
        const { reward, comment } = reviewData[contributionId] || { reward: 50, comment: '' };
        await approveContribution(contributionId, reward, comment);
      } else {
        setIsRejecting(contributionId);
        const { comment } = reviewData[contributionId] || { comment: '' };
        await rejectContribution(contributionId, comment);
      }
    } catch (err) {
      console.error("Error updating contribution status:", err);
      alert("Failed to update status.");
    } finally {
      setIsApproving(null);
      setIsRejecting(null);
    }
  };

  const getCollegeName = (id: string) => colleges.find(c => c.id === id)?.name || 'General';
  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || 'Unknown';

  const filteredRequests = requests.filter(r => 
    r.description?.toLowerCase().includes(search.toLowerCase()) || 
    r.user_name?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredHistory = history.filter(r => 
    r.description?.toLowerCase().includes(search.toLowerCase()) || 
    r.user_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-8 pb-12"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Contribution Management</h1>
          <p className="text-slate-500 text-sm">Verify materials submitted by users before they go live.</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search contributions..." 
            className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none w-full md:w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Pending Contributions */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            Pending Verification ({requests.length})
          </h2>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          ) : filteredRequests.length > 0 ? (
            <div className="grid gap-6">
              {filteredRequests.map((item) => (
                <div key={item.id} className="glass-panel rounded-2xl p-6 border border-slate-700 space-y-4">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                          item.type === 'pyq' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                          item.type === 'notes' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                          "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        )}>
                          {item.type}
                        </span>
                        <h3 className="text-lg font-bold text-white">{item.description}</h3>
                      </div>
                      <p className="text-sm text-slate-500">{item.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-slate-400">Submitted by</p>
                      <p className="text-sm font-bold text-white">{item.user_name || 'Anonymous'}</p>
                      <p className="text-[10px] text-slate-500">{new Date(item.created_at?.seconds * 1000 || Date.now()).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-slate-50 dark:border-slate-700/50">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-slate-400" />
                      <div className="text-xs">
                        <p className="text-slate-400">College</p>
                        <p className="font-bold text-slate-300 truncate max-w-[100px]">{getCollegeName(item.college_id)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-slate-400" />
                      <div className="text-xs">
                        <p className="text-slate-400">Subject</p>
                        <p className="font-bold text-slate-300 truncate max-w-[100px]">{getSubjectName(item.subject_id)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-slate-400" />
                      <div className="text-xs">
                        <p className="text-slate-400">Term</p>
                        <p className="font-bold text-slate-300">{item.term || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <div className="text-xs">
                        <p className="text-slate-400">Year</p>
                        <p className="font-bold text-slate-300">{item.exam_year || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                    <span className="bg-slate-800 px-2 py-1 rounded">Contact: {item.contact_number || 'N/A'}</span>
                    {item.payment_info && (
                      <span className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded border border-emerald-100 dark:border-emerald-800/50">
                        Payment Info: {item.payment_info}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col md:flex-row gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-slate-300 mb-1">Reward Amount (NPR)</label>
                      <input 
                        type="number"
                        className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-slate-700 dark:text-white"
                        value={reviewData[item.id]?.reward || 0}
                        onChange={(e) => handleReviewChange(item.id, 'reward', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="flex-[2]">
                      <label className="block text-xs font-medium text-slate-300 mb-1">Admin Comment (Optional)</label>
                      <input 
                        type="text"
                        placeholder="e.g., Great notes!"
                        className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-slate-700 dark:text-white"
                        value={reviewData[item.id]?.comment || ''}
                        onChange={(e) => handleReviewChange(item.id, 'comment', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <a 
                      href={`/viewer?url=${encodeURIComponent(item.file_url)}&title=${encodeURIComponent(item.title)}`}
                      target="_blank" 
                      rel="noreferrer"
                      className="w-full sm:w-auto px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-300 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" /> View Material
                    </a>
                    {item.solution_url && (
                      <a 
                        href={`/viewer?url=${encodeURIComponent(item.solution_url)}&title=${encodeURIComponent(item.title + ' - Solution')}`}
                        target="_blank" 
                        rel="noreferrer"
                        className="w-full sm:w-auto px-4 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" /> View Solution
                      </a>
                    )}
                    <div className="flex-1" />
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button 
                        onClick={() => handleAction(item.id, 'verified')}
                        disabled={isApproving === item.id || isRejecting === item.id}
                        className="flex-1 sm:flex-none px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isApproving === item.id ? (
                          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        {isApproving === item.id ? 'Approving...' : 'Approve'}
                      </button>
                      <button 
                        onClick={() => handleAction(item.id, 'rejected')}
                        disabled={isApproving === item.id || isRejecting === item.id}
                        className="flex-1 sm:flex-none px-6 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 text-sm font-bold rounded-lg transition-colors border border-rose-200 dark:border-rose-800 disabled:opacity-50"
                      >
                        {isRejecting === item.id ? (
                          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-rose-600 dark:border-rose-400"></span>
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        {isRejecting === item.id ? 'Rejecting...' : 'Reject'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900/50 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Check className="w-8 h-8 text-emerald-500" />
              </div>
              <p className="text-slate-500 font-medium">All contributions have been verified!</p>
            </div>
          )}
        </div>

        {/* History Sidebar */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-500" />
            Recent History
          </h2>
          <div className="glass-panel rounded-2xl overflow-hidden">
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredHistory.slice(0, 10).map((item) => (
                <div key={item.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <h4 className="text-sm font-bold text-white truncate">{item.description}</h4>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[8px] font-bold uppercase shrink-0",
                      item.status === 'verified' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                    )}>
                      {item.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-slate-500">{item.user_name}</p>
                    <p className="text-[10px] text-slate-400">{new Date(item.updated_at || item.created_at?.seconds * 1000).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
              {filteredHistory.length === 0 && (
                <div className="p-8 text-center text-slate-500 text-sm italic">No history yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
