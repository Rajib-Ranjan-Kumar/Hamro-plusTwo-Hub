import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FileText, Download, Lock, ChevronDown, Star, ThumbsUp, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { getSubjects, getExamYears, getContent, upvoteContent, downvoteContent, rateContent, reportContent, updateSolutionStatus, getGlobalSettings, getColleges } from '../services/db';
import { ConfirmModal } from '../components/ConfirmModal';
import { ThumbsDown } from 'lucide-react';
import { motion } from 'motion/react';

export const PYQ = () => {
  const { user, hasPremiumAccess, isPremiumSubscriber } = useAuth();
  const navigate = useNavigate();

  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void}>({
    isOpen: false, title: '', message: '', onConfirm: () => {}
  });

  const isLocked = !hasPremiumAccess;

  const [colleges, setColleges] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [content, setContent] = useState<any[]>([]);
  
  // Filters persisted in localStorage with user default fallbacks
  const [filterCollege, setFilterCollege] = useState(() => localStorage.getItem('pyq_filter_college') || user?.college_id || '');
  const [filterStream, setFilterStream] = useState(() => localStorage.getItem('pyq_filter_stream') || user?.stream || 'Science');
  const [filterYear, setFilterYear] = useState(() => localStorage.getItem('pyq_filter_year') || user?.year || 'Class 11');
  const [filterSubject, setFilterSubject] = useState(() => localStorage.getItem('pyq_filter_subject') || '');
  const [filterTerm, setFilterTerm] = useState(() => localStorage.getItem('pyq_filter_term') || '');
  const [filterExamYear, setFilterExamYear] = useState(() => localStorage.getItem('pyq_filter_exam_year') || '');
  const [examYears, setExamYears] = useState<any[]>([]);

  // Detailed View
  const [selectedPyq, setSelectedPyq] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  
  // Report Modal
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportingId, setReportingId] = useState<string | null>(null);

  const openViewer = (url: string, title: string, allowDownload: boolean = false, id?: string) => {
    const params = new URLSearchParams();
    if (id) params.set('id', id);
    if (url) params.set('url', url);
    params.set('title', title);
    if (allowDownload) params.set('download', 'true');
    window.open(`/viewer?${params.toString()}`, '_blank');
  };

  // Fetch colleges list
  useEffect(() => {
    getColleges().then(data => setColleges(data));
  }, []);

  // Save filter changes to localStorage
  useEffect(() => {
    localStorage.setItem('pyq_filter_college', filterCollege);
  }, [filterCollege]);

  useEffect(() => {
    localStorage.setItem('pyq_filter_stream', filterStream);
  }, [filterStream]);

  useEffect(() => {
    localStorage.setItem('pyq_filter_year', filterYear);
  }, [filterYear]);

  useEffect(() => {
    if (filterSubject) {
      localStorage.setItem('pyq_filter_subject', filterSubject);
    }
  }, [filterSubject]);

  useEffect(() => {
    localStorage.setItem('pyq_filter_term', filterTerm);
  }, [filterTerm]);

  useEffect(() => {
    localStorage.setItem('pyq_filter_exam_year', filterExamYear);
  }, [filterExamYear]);

  // Fetch subjects and exam years based on parent selections
  useEffect(() => {
    getSubjects(filterCollege).then(data => {
      const filtered = data.filter((s: any) => s.stream === filterStream && s.year === filterYear);
      setSubjects(filtered);
      
      // Auto-restore saved subject if compatible, or select first available
      const savedSubject = localStorage.getItem('pyq_filter_subject');
      if (savedSubject && filtered.some(s => s.id.toString() === savedSubject)) {
        setFilterSubject(savedSubject);
      } else if (filtered.length > 0) {
        setFilterSubject(filtered[0].id.toString());
      } else {
        setFilterSubject('');
      }
    });

    getExamYears(filterCollege, filterYear).then(data => setExamYears(data));
  }, [filterCollege, filterStream, filterYear]);

  // Fetch content list
  useEffect(() => {
    getContent('pyq', filterSubject || undefined, filterYear, filterTerm, filterExamYear, filterCollege).then(data => setContent(data));
  }, [filterSubject, filterYear, filterTerm, filterExamYear, filterCollege]);

  const handleUpvote = async (id: string) => {
    if (!user) return;
    try {
      const result = await upvoteContent(id, user.id);
      if (result) {
        // Refresh content to get exact counts
        const data = await getContent('pyq', filterSubject, filterYear, filterTerm, filterExamYear, filterCollege);
        setContent(data);
        const updatedItem = data.find((c: any) => c.id === id);
        if (selectedPyq?.id === id && updatedItem) {
          setSelectedPyq(updatedItem);
        }
      }
    } catch (err) {
      console.error("Failed to upvote:", err);
      alert("Failed to upvote.");
    }
  };

  const handleDownvote = async (id: string) => {
    if (!user) return;
    try {
      const result = await downvoteContent(id, user.id);
      if (result) {
        // Refresh content to get exact counts
        const data = await getContent('pyq', filterSubject, filterYear, filterTerm, filterExamYear, filterCollege);
        setContent(data);
        const updatedItem = data.find((c: any) => c.id === id);
        if (selectedPyq?.id === id && updatedItem) {
          setSelectedPyq(updatedItem);
        }
      }
    } catch (err) {
      console.error("Failed to downvote:", err);
      alert("Failed to downvote.");
    }
  };

  const handleRate = async (id: string, val: number) => {
    try {
      await rateContent(id, val);
      alert('Thank you for rating!');
      // Refresh content
      const data = await getContent('pyq', filterSubject, filterYear, filterTerm, filterExamYear, filterCollege);
      setContent(data);
      const updatedItem = data.find((c: any) => c.id === id);
      if (selectedPyq?.id === id && updatedItem) {
        setSelectedPyq(updatedItem);
      }
    } catch (err) {
      console.error("Failed to rate:", err);
      alert("Failed to rate. You cannot rate your own content.");
    }
  };

  const handleReportClick = (id: string) => {
    setReportingId(id);
    setReportReason('');
    setReportModalOpen(true);
  };

  const handleReportSubmit = async () => {
    if (!reportingId || !reportReason.trim()) {
      alert("Please provide a reason for reporting.");
      return;
    }
    
    try {
      await reportContent(reportingId, reportReason, user?.name || 'Anonymous User');
      alert('Report submitted. Admins will review it.');
      setReportModalOpen(false);
      setReportingId(null);
      setReportReason('');
      
      // Refresh content
      const data = await getContent('pyq', filterSubject, filterYear, filterTerm, filterExamYear, filterCollege);
      setContent(data);
      const updatedItem = data.find((c: any) => c.id === reportingId);
      if (selectedPyq?.id === reportingId && updatedItem) {
        setSelectedPyq(updatedItem);
      }
    } catch (err) {
      console.error("Failed to report:", err);
      alert("Failed to submit report.");
    }
  };

  const handleAdminStatus = async (id: string, status: string) => {
    try {
      await updateSolutionStatus(id, status);
      // Optimistic update
      setContent(content.map(c => c.id === id ? { ...c, solution_status: status } : c));
      if (selectedPyq?.id === id) setSelectedPyq({ ...selectedPyq, solution_status: status });
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Failed to update status.");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-6xl mx-auto"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-white">
          Previous Year Questions (PYQs)
        </h1>
        <div className="text-sm text-slate-400">
          {filterStream} • {filterYear}
        </div>
      </div>

      <div className="bg-slate-900/85 border border-slate-700/60 rounded-3xl p-5 sm:p-6 mb-6 shadow-xl backdrop-blur-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* 1. College */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">College</label>
            <select 
              className="w-full px-3.5 py-2.5 border border-slate-700/80 bg-slate-950/70 rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 outline-none text-white text-sm transition-all cursor-pointer"
              value={filterCollege}
              onChange={(e) => setFilterCollege(e.target.value)}
            >
              <option value="">General (No College)</option>
              {colleges.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {/* 2. Stream */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Stream</label>
            <select 
              className="w-full px-3.5 py-2.5 border border-slate-700/80 bg-slate-950/70 rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 outline-none text-white text-sm transition-all cursor-pointer"
              value={filterStream}
              onChange={(e) => setFilterStream(e.target.value)}
            >
              <option value="Science">Science</option>
              <option value="Management">Management</option>
              <option value="Humanities">Humanities</option>
            </select>
          </div>
          {/* 3. Class */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Class</label>
            <select 
              className="w-full px-3.5 py-2.5 border border-slate-700/80 bg-slate-950/70 rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 outline-none text-white text-sm transition-all cursor-pointer"
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
            >
              <option value="Class 11">Class 11</option>
              <option value="Class 12">Class 12</option>
            </select>
          </div>
          {/* 4. Subject */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Subject</label>
            <select 
              className="w-full px-3.5 py-2.5 border border-slate-700/80 bg-slate-950/70 rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 outline-none text-white text-sm transition-all cursor-pointer"
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
            >
              <option value="">All Subjects</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          {/* 5. Term */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Term</label>
            <select 
              className="w-full px-3.5 py-2.5 border border-slate-700/80 bg-slate-950/70 rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 outline-none text-white text-sm transition-all cursor-pointer"
              value={filterTerm}
              onChange={(e) => setFilterTerm(e.target.value)}
            >
              <option value="">All Terms</option>
              <option value="1st Term">1st Term</option>
              <option value="2nd Term">2nd Term</option>
              <option value="3rd Term">3rd Term</option>
              <option value="Final Term">Final Term</option>
            </select>
          </div>
          {/* 6. Exam Year */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Exam Year</label>
            <select 
              className="w-full px-3.5 py-2.5 border border-slate-700/80 bg-slate-950/70 rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 outline-none text-white text-sm transition-all cursor-pointer"
              value={filterExamYear}
              onChange={(e) => setFilterExamYear(e.target.value)}
            >
              <option value="">All Years</option>
              {[2026, 2025, 2024, 2023, 2022, 2021, 2020].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
              {examYears.map(ey => <option key={ey.id} value={ey.year_value}>{ey.year_value}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Main Content Area */}
        <div className="flex-1 bg-slate-900/85 border border-slate-700/60 rounded-3xl overflow-hidden relative min-h-[400px] flex flex-col shadow-xl backdrop-blur-xl">
          {isLocked && (
            <div className="absolute inset-0 z-10 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-6 text-center">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-slate-900/95 border border-slate-700/80 rounded-3xl p-8 max-w-md mx-auto text-center shadow-2xl backdrop-blur-xl flex flex-col items-center"
              >
                <div className="w-16 h-16 bg-amber-500/15 border border-amber-500/30 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                  <Lock className="w-7 h-7 text-amber-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Premium Content Locked</h3>
                <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                  This content is restricted to premium members. Upgrade your account to unlock all Previous Year Questions, structured notes, and verified solutions.
                </p>
                <button 
                  onClick={() => navigate('/get-premium')}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer"
                >
                  Unlock Premium Access
                </button>
              </motion.div>
            </div>
          )}
          
          <div className={`p-6 flex-1 flex flex-col ${isLocked ? 'opacity-20 pointer-events-none' : ''}`}>
            <h2 className="text-xl font-bold text-white mb-6">
              {subjects.find(s => s.id.toString() === filterSubject)?.name || 'General'} - PYQs
            </h2>

            {selectedPyq ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <button 
                  onClick={() => setSelectedPyq(null)}
                  className="text-sm font-semibold text-amber-400 hover:text-amber-300 hover:underline mb-4 inline-block cursor-pointer"
                >
                  &larr; Back to list
                </button>
                
                <div className="border border-slate-800 bg-slate-950/60 rounded-2xl p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-white">{selectedPyq.description}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {selectedPyq.term && <span className="text-xs font-semibold text-slate-300 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg">{selectedPyq.term}</span>}
                        {selectedPyq.exam_year && <span className="text-xs font-semibold text-slate-300 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg">{selectedPyq.exam_year}</span>}
                        {selectedPyq.college_name && <span className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md">{selectedPyq.college_name}</span>}
                      </div>
                    </div>
                    {selectedPyq.access_level === 'secure' && (
                      <span className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 shrink-0">
                        <Lock className="w-4 h-4" /> Secure View
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-sm">
                      <h4 className="font-bold text-white mb-3 flex items-center gap-2 text-sm">
                        <FileText className="w-4 h-4 text-amber-400" /> Question Paper
                      </h4>
                      {(selectedPyq.status === 'premium_only' || selectedPyq.access_level === 'premium') ? (
                        !isPremiumSubscriber ? (
                          <button 
                            onClick={() => navigate('/get-premium')}
                            className="w-full sm:w-auto px-5 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer"
                          >
                            <Lock className="w-4 h-4 text-amber-400" /> Unlock with Premium
                          </button>
                        ) : (
                          <button 
                            onClick={() => openViewer(selectedPyq.file_url, `${selectedPyq.description} - Question Paper`, false, selectedPyq.id)}
                            className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm flex items-center gap-2 transition-all shadow-sm hover:shadow-md cursor-pointer"
                          >
                            <FileText className="w-4 h-4" /> View Question Paper (View Only)
                          </button>
                        )
                      ) : !hasPremiumAccess ? (
                        <button 
                          onClick={() => navigate('/get-premium')}
                          className="w-full sm:w-auto px-5 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer"
                        >
                          <Lock className="w-4 h-4 text-amber-400" /> Unlock with Premium
                        </button>
                      ) : (
                        <button 
                          onClick={() => openViewer(selectedPyq.file_url, `${selectedPyq.description} - Question Paper`, false, selectedPyq.id)}
                          className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm flex items-center gap-2 transition-all shadow-sm hover:shadow-md cursor-pointer"
                        >
                          <FileText className="w-4 h-4" /> View Question Paper (View Only)
                        </button>
                      )}
                    </div>
                    
                    <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-sm">
                      <h4 className="font-bold text-white mb-3 flex items-center gap-2 text-sm">
                        {!selectedPyq.solution_url ? (
                          <><FileText className="w-4 h-4 text-slate-400" /> No Solution</>
                        ) : selectedPyq.solution_status === 'verified' ? (
                          <><CheckCircle className="w-4 h-4 text-emerald-400" /> Verified Solution</>
                        ) : (
                          <><CheckCircle className="w-4 h-4 text-[#F5C21B]" /> Solution Available</>
                        )}
                      </h4>
                      {selectedPyq.solution_url ? (
                        (selectedPyq.status === 'premium_only' || selectedPyq.access_level === 'premium') ? (
                          !isPremiumSubscriber ? (
                            <button 
                              onClick={() => navigate('/get-premium')}
                              className="w-full sm:w-auto px-5 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer"
                            >
                              <Lock className="w-4 h-4 text-amber-400" /> Unlock Solution with Premium
                            </button>
                          ) : (
                            <button 
                              onClick={() => openViewer(selectedPyq.solution_url, `${selectedPyq.description} - Solution`, false, selectedPyq.id)}
                              className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm flex items-center gap-2 transition-all shadow-sm hover:shadow-md cursor-pointer"
                            >
                              <FileText className="w-4 h-4" /> View Solution (View Only)
                            </button>
                          )
                        ) : !hasPremiumAccess ? (
                          <button 
                            onClick={() => navigate('/get-premium')}
                            className="w-full sm:w-auto px-5 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer"
                          >
                            <Lock className="w-4 h-4 text-amber-400" /> Unlock Solution with Premium
                          </button>
                        ) : (
                          <button 
                            onClick={() => openViewer(selectedPyq.solution_url, `${selectedPyq.description} - Solution`, false, selectedPyq.id)}
                            className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm flex items-center gap-2 transition-all shadow-sm hover:shadow-md cursor-pointer"
                          >
                            <FileText className="w-4 h-4" /> View Solution (View Only)
                          </button>
                        )
                      ) : (
                        <p className="text-sm text-slate-500">No solution provided yet.</p>
                      )}
                      
                      {selectedPyq.solution_status === 'needs_correction' && (
                        <p className="text-xs text-rose-400 mt-2 flex items-center gap-1 font-semibold">
                          <AlertTriangle className="w-3.5 h-3.5" /> Admin marked as needs correction
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Feedback Section */}
                  <div className="border-t border-slate-700 pt-6">
                    <h4 className="font-semibold text-white mb-4">Student Feedback</h4>
                    
                    <div className="flex flex-wrap items-center gap-6">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleUpvote(selectedPyq.id)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${selectedPyq.upvoted_by?.includes(user?.id) ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-300'}`}
                        >
                          <ThumbsUp className="w-4 h-4" /> 
                          Helpful ({selectedPyq.upvotes || 0})
                        </button>
                        <button 
                          onClick={() => handleDownvote(selectedPyq.id)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${selectedPyq.downvoted_by?.includes(user?.id) ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-300'}`}
                        >
                          <ThumbsDown className="w-4 h-4" /> 
                          Not Helpful ({selectedPyq.downvotes || 0})
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-sm text-slate-400 mr-2">Rate:</span>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => { setRating(star); handleRate(selectedPyq.id, star); }}
                            className="focus:outline-none"
                          >
                            <Star className={`w-5 h-5 ${star <= (hoverRating || rating || Math.round(selectedPyq.rating || 0)) ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
                          </button>
                        ))}
                        <span className="text-xs text-slate-500 ml-2">({selectedPyq.rating?.toFixed(1) || '0.0'})</span>
                      </div>

                      <button 
                        onClick={() => handleReportClick(selectedPyq.id)}
                        className="flex items-center gap-1 text-sm text-rose-600 hover:text-rose-700 ml-auto"
                      >
                        <AlertTriangle className="w-4 h-4" /> Report Incorrect
                      </button>
                    </div>

                    {/* Admin Controls */}
                    {user?.role === 'admin' && (
                      <div className="mt-6 p-4 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-sm">
                        <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Admin Controls</h5>
                        <div className="flex gap-3">
                          <button 
                            onClick={() => handleAdminStatus(selectedPyq.id, 'verified')}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${selectedPyq.solution_status === 'verified' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'bg-slate-800 text-slate-300 border border-slate-700 hover:text-white'}`}
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Mark Verified
                          </button>
                          <button 
                            onClick={() => handleAdminStatus(selectedPyq.id, 'needs_correction')}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${selectedPyq.solution_status === 'needs_correction' ? 'bg-rose-500 text-slate-950 shadow-sm' : 'bg-slate-800 text-slate-300 border border-slate-700 hover:text-white'}`}
                          >
                            <XCircle className="w-3.5 h-3.5" /> Needs Correction
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : content.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-slate-500 mb-4" />
                <h3 className="text-lg font-bold text-white">No PYQs available</h3>
                <p className="text-slate-400 mt-1 text-sm">
                  {user?.role === 'admin' ? 'No PYQs have been added yet.' : 'Check back later or contribute to earn rewards!'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {content.map(item => (
                  <div 
                    key={item.id} 
                    onClick={() => setSelectedPyq(item)}
                    className="p-4 sm:p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-amber-500/40 hover:shadow-lg transition-all cursor-pointer group bg-slate-950/60 shadow-sm"
                  >
                    <div className="flex items-start sm:items-center gap-4">
                      <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl text-[#F5C21B] shrink-0 shadow-sm">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white group-hover:text-[#F5C21B] transition-colors text-base">
                          {item.description}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {(item.status === 'premium_only' || item.access_level === 'premium') && (
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center gap-1">
                              <Lock className="w-3 h-3 text-amber-400" /> Premium Only
                            </span>
                          )}
                          {item.term && <span className="text-xs font-semibold text-slate-300 bg-slate-800 border border-slate-700 px-2.5 py-0.5 rounded-md">{item.term}</span>}
                          {item.exam_year && <span className="text-xs font-semibold text-slate-300 bg-slate-800 border border-slate-700 px-2.5 py-0.5 rounded-md">{item.exam_year}</span>}
                          {!item.solution_url ? (
                            <span className="text-xs font-medium px-2.5 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-400 flex items-center gap-1">
                              <FileText className="w-3 h-3" /> No Solution
                            </span>
                          ) : item.solution_status === 'verified' ? (
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Verified Solution
                            </span>
                          ) : item.solution_status === 'needs_correction' ? (
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/25 text-rose-400 flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> Needs Correction
                            </span>
                          ) : (
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-[#F5C21B] flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Solution Available
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <button className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 border border-slate-700/80 text-slate-300 rounded-xl text-sm font-bold flex items-center justify-center gap-2 group-hover:bg-amber-500 group-hover:text-slate-950 group-hover:border-amber-500 transition-all shrink-0 cursor-pointer shadow-sm">
                      {item.access_level === 'secure' ? <Lock className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      {item.access_level === 'secure' ? 'Secure View' : 'View Details'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900/95 border border-slate-700/80 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            <h3 className="text-xl font-bold text-white mb-2">Report Incorrect Content</h3>
            <p className="text-sm text-slate-400 mb-4">
              Please provide specific details about what is incorrect in this content so our admins can review it.
            </p>
            <textarea
              className="w-full px-4 py-3 bg-slate-950/70 border border-slate-700/80 rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 text-white resize-none mb-6 outline-none text-sm placeholder-slate-500"
              rows={4}
              placeholder="E.g., Question 3 has the wrong formula..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
            ></textarea>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setReportModalOpen(false)}
                className="px-4 py-2.5 text-sm font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-all cursor-pointer border border-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleReportSubmit}
                disabled={!reportReason.trim()}
                className="px-5 py-2.5 text-sm font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all cursor-pointer shadow-sm"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
