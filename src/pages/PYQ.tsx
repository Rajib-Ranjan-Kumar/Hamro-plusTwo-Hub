import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FileText, Download, Lock, ChevronDown, Star, ThumbsUp, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { getSubjects, getExamYears, getContent, upvoteContent, downvoteContent, rateContent, reportContent, updateSolutionStatus, getGlobalSettings, getColleges } from '../services/db';
import { ConfirmModal } from '../components/ConfirmModal';
import { ThumbsDown } from 'lucide-react';
import { motion } from 'motion/react';

export const PYQ = () => {
  const { user, hasPremiumAccess } = useAuth();
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

  const openViewer = (url: string, title: string, allowDownload: boolean = false) => {
    window.open(`/viewer?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}${allowDownload ? '&download=true' : ''}`, '_blank');
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
    if (filterSubject) {
      getContent('pyq', filterSubject, filterYear, filterTerm, filterExamYear, filterCollege).then(data => setContent(data));
    } else {
      setContent([]);
    }
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

      <div className="glass-panel p-4 rounded-2xl mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* 1. College */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">College</label>
            <select 
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-slate-800 dark:text-slate-100 text-sm transition-colors cursor-pointer"
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
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-slate-800 dark:text-slate-100 text-sm transition-colors cursor-pointer"
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
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-slate-800 dark:text-slate-100 text-sm transition-colors cursor-pointer"
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
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-slate-800 dark:text-slate-100 text-sm transition-colors cursor-pointer"
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
            >
              {subjects.length === 0 ? (
                <option value="">No Subjects</option>
              ) : (
                subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
              )}
            </select>
          </div>
          {/* 5. Term */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Term</label>
            <select 
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-slate-800 dark:text-slate-100 text-sm transition-colors cursor-pointer"
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
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-slate-800 dark:text-slate-100 text-sm transition-colors cursor-pointer"
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
        <div className="flex-1 glass-panel rounded-2xl overflow-hidden relative min-h-[400px] flex flex-col">
          {isLocked && (
            <div className="absolute inset-0 z-10 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-6 text-center">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-slate-800/95 border border-slate-700/80 rounded-2xl p-8 max-w-md mx-auto text-center shadow-2xl backdrop-blur-sm flex flex-col items-center"
              >
                <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mb-6">
                  <Lock className="w-7 h-7 text-amber-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Premium Content Locked</h3>
                <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                  This content is restricted to premium members. Upgrade your account to unlock all Previous Year Questions, structured notes, and verified solutions.
                </p>
                <button 
                  onClick={() => navigate('/get-premium')}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/35"
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
                  className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline mb-4 inline-block"
                >
                  &larr; Back to list
                </button>
                
                <div className="border border-slate-700 rounded-xl p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-white">{selectedPyq.description}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {selectedPyq.term && <span className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md">{selectedPyq.term}</span>}
                        {selectedPyq.exam_year && <span className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md">{selectedPyq.exam_year}</span>}
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
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-700">
                      <h4 className="font-semibold text-slate-300 mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Question Paper
                      </h4>
                      {selectedPyq.access_level === 'secure' ? (
                        <button 
                          onClick={() => openViewer(selectedPyq.file_url, `${selectedPyq.description} - Question Paper`, false)}
                          className="text-emerald-600 hover:underline text-sm text-left flex items-center gap-1"
                        >
                          <Lock className="w-3 h-3" /> View Secure PDF
                        </button>
                      ) : (
                        <a href={`/viewer?url=${encodeURIComponent(selectedPyq.file_url)}&title=${encodeURIComponent(selectedPyq.description + ' - Question Paper')}&download=true`} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline text-sm flex items-center gap-1">
                          <FileText className="w-3 h-3" /> View Question Paper
                        </a>
                      )}
                    </div>
                    
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-700">
                      <h4 className="font-semibold text-slate-300 mb-2 flex items-center gap-2">
                        {!selectedPyq.solution_url ? (
                          <><FileText className="w-4 h-4" /> No Solution</>
                        ) : selectedPyq.solution_status === 'verified' ? (
                          <><CheckCircle className="w-4 h-4 text-emerald-600" /> Verified Solution</>
                        ) : (
                          <><CheckCircle className="w-4 h-4" /> Solution Available</>
                        )}
                      </h4>
                      {selectedPyq.solution_url ? (
                        selectedPyq.access_level === 'secure' ? (
                          <button 
                            onClick={() => openViewer(selectedPyq.solution_url, `${selectedPyq.description} - Solution`, false)}
                            className="text-emerald-600 hover:underline text-sm text-left flex items-center gap-1"
                          >
                            <Lock className="w-3 h-3" /> View Secure PDF
                          </button>
                        ) : (
                          <a href={`/viewer?url=${encodeURIComponent(selectedPyq.solution_url)}&title=${encodeURIComponent(selectedPyq.description + ' - Solution')}&download=true`} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline text-sm flex items-center gap-1">
                            <FileText className="w-3 h-3" /> View Solution
                          </a>
                        )
                      ) : (
                        <p className="text-sm text-slate-500">No solution provided yet.</p>
                      )}
                      
                      {selectedPyq.solution_status === 'needs_correction' && (
                        <p className="text-xs text-rose-600 mt-2 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Admin marked as needs correction
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
                      <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800">
                        <h5 className="text-sm font-semibold text-indigo-900 dark:text-indigo-300 mb-3">Admin Controls</h5>
                        <div className="flex gap-3">
                          <button 
                            onClick={() => handleAdminStatus(selectedPyq.id, 'verified')}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 ${selectedPyq.solution_status === 'verified' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 border border-slate-300'}`}
                          >
                            <CheckCircle className="w-3 h-3" /> Mark Verified
                          </button>
                          <button 
                            onClick={() => handleAdminStatus(selectedPyq.id, 'needs_correction')}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 ${selectedPyq.solution_status === 'needs_correction' ? 'bg-rose-600 text-white' : 'bg-white text-slate-700 border border-slate-300'}`}
                          >
                            <XCircle className="w-3 h-3" /> Needs Correction
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : content.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
                <h3 className="text-lg font-medium text-white">No PYQs available</h3>
                <p className="text-slate-400 mt-1">
                  {user?.role === 'admin' ? 'No PYQs have been added yet.' : 'Check back later or contribute to earn rewards!'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {content.map(item => (
                  <div 
                    key={item.id} 
                    onClick={() => setSelectedPyq(item)}
                    className="p-4 sm:p-5 rounded-xl border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all cursor-pointer group bg-slate-800"
                  >
                    <div className="flex items-start sm:items-center gap-4">
                      <div className="p-3 bg-indigo-50 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400 shrink-0">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors text-base">
                          {item.description}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {item.term && <span className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md">{item.term}</span>}
                          {item.exam_year && <span className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md">{item.exam_year}</span>}
                          {!item.solution_url ? (
                            <span className="text-xs font-medium px-2 py-1 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 flex items-center gap-1">
                              <FileText className="w-3 h-3" /> No Solution
                            </span>
                          ) : item.solution_status === 'verified' ? (
                            <span className="text-xs font-medium px-2 py-1 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Verified Solution
                            </span>
                          ) : item.solution_status === 'needs_correction' ? (
                            <span className="text-xs font-medium px-2 py-1 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300 flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> Needs Correction
                            </span>
                          ) : (
                            <span className="text-xs font-medium px-2 py-1 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Solution Available
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <button className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold flex items-center justify-center gap-2 group-hover:bg-indigo-600 group-hover:text-white dark:group-hover:bg-indigo-500 transition-colors shrink-0">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6 shadow-xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Report Incorrect Content</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              Please provide specific details about what is incorrect in this content so our admins can review it.
            </p>
            <textarea
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-rose-500 dark:text-white resize-none mb-6"
              rows={4}
              placeholder="E.g., Question 3 has the wrong formula..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
            ></textarea>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setReportModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReportSubmit}
                disabled={!reportReason.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
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
