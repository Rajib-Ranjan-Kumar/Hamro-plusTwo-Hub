import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FileText, Download, Lock, ChevronDown, Star, ThumbsUp, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { getSubjects, getExamYears, getContent, upvoteContent, downvoteContent, rateContent, reportContent, updateSolutionStatus, getGlobalSettings } from '../services/db';
import { ConfirmModal } from '../components/ConfirmModal';
import { ThumbsDown } from 'lucide-react';
import { motion } from 'motion/react';

export const PYQ = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void}>({
    isOpen: false, title: '', message: '', onConfirm: () => {}
  });

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

  const [subjects, setSubjects] = useState<any[]>([]);
  const [content, setContent] = useState<any[]>([]);
  
  // Filters
  const [filterYear, setFilterYear] = useState(user?.year || 'Class 11');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterTerm, setFilterTerm] = useState('');
  const [filterExamYear, setFilterExamYear] = useState('');
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

  useEffect(() => {
    const fetchCollegeId = user?.college_id;
    getSubjects(fetchCollegeId).then(data => {
      // Filter by stream and year for both users and admins
      const filtered = data.filter((s: any) => s.stream === user?.stream && s.year === filterYear);
      setSubjects(filtered);
      if (filtered.length > 0 && !filterSubject) setFilterSubject(filtered[0].id.toString());
    });

    getExamYears(fetchCollegeId, filterYear).then(data => setExamYears(data));
  }, [filterYear, user?.college_id, user?.stream]);

  useEffect(() => {
    if (filterSubject) {
      const fetchCollegeId = user?.college_id;
      getContent('pyq', filterSubject, filterYear, filterTerm, filterExamYear, fetchCollegeId).then(data => setContent(data));
    }
  }, [filterSubject, filterYear, filterTerm, filterExamYear, user?.college_id]);

  const handleUpvote = async (id: string) => {
    if (!user) return;
    try {
      const result = await upvoteContent(id, user.id);
      if (result) {
        // Refresh content to get exact counts
        const fetchCollegeId = user?.college_id;
        const data = await getContent('pyq', filterSubject, filterYear, filterTerm, filterExamYear, fetchCollegeId);
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
        const fetchCollegeId = user?.college_id;
        const data = await getContent('pyq', filterSubject, filterYear, filterTerm, filterExamYear, fetchCollegeId);
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
      const fetchCollegeId = user?.college_id;
      const data = await getContent('pyq', filterSubject, filterYear, filterTerm, filterExamYear, fetchCollegeId);
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
      const fetchCollegeId = user?.college_id;
      const data = await getContent('pyq', filterSubject, filterYear, filterTerm, filterExamYear, fetchCollegeId);
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
          {user?.stream} • {user?.year}
        </div>
      </div>

      <div className="glass-panel p-4 rounded-2xl mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Class</label>
            <select 
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm disabled:opacity-50"
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              disabled
            >
              <option value="Class 11">Class 11</option>
              <option value="Class 12">Class 12</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Subject</label>
            <select 
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm"
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
            >
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Term</label>
            <select 
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm"
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
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Exam Year</label>
            <select 
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm"
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
        <div className="flex-1 glass-panel rounded-2xl overflow-hidden relative">
          {isLocked && (
            <div className="absolute inset-0 z-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Premium Content Locked</h3>
              <p className="text-slate-600 dark:text-slate-300 max-w-md mb-6">
                This content is only available for premium users. Upgrade your account to access all Previous Year Questions, structured notes, and more.
              </p>
              <button 
                onClick={() => navigate('/get-premium')}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors shadow-sm hover-lift"
              >
                Get Premium Access
              </button>
            </div>
          )}
          
          <div className={`p-6 ${isLocked ? 'opacity-20 pointer-events-none' : ''}`}>
            <h2 className="text-xl font-bold text-white mb-6">
              {subjects.find(s => s.id.toString() === filterSubject)?.name} - PYQs
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
