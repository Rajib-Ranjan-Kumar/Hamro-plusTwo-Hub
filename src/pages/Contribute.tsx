import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLoading } from '../context/LoadingContext';
import { Upload, FileText, CheckCircle, DollarSign, AlertCircle, CreditCard, History, Loader2 } from 'lucide-react';
import { getColleges, getSubjects, getContentTypes, getExamYears, getContributions, getWithdrawals, addContribution, addWithdrawal, uploadFile } from '../services/db';
import { motion } from 'motion/react';

export const Contribute = () => {
  const { user, fetchUser } = useAuth();
  const { startLoading, setProgress, stopLoading } = useLoading();
  const [colleges, setColleges] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [contentTypes, setContentTypes] = useState<any[]>([]);
  const [examYears, setExamYears] = useState<any[]>([]);
  const [contributions, setContributions] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStep, setUploadStep] = useState('');
  
  const [activeTab, setActiveTab] = useState<'submit' | 'withdraw'>('submit');

  // Submit Form State
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    college_id: user?.college_id?.toString() || '',
    year: user?.year || 'Class 11',
    stream: user?.stream || 'Science',
    subject_id: '',
    type: 'pyq',
    term: '',
    exam_year: '',
    description: '',
    payment_info: '',
    contact_number: ''
  });

  // Withdraw Form State
  const [withdrawData, setWithdrawData] = useState({
    amount: '',
    payment_method: 'esewa',
    payment_details: ''
  });

  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getColleges().then(data => setColleges(data));
      
    if (user) {
      fetchContributions();
      fetchWithdrawals();
      setFormData(prev => ({
        ...prev,
        college_id: prev.college_id || user.college_id?.toString() || '',
        year: prev.year || user.year || 'Class 11',
        stream: prev.stream || user.stream || 'Science'
      }));
    }
  }, [user]);

  useEffect(() => {
    getSubjects(formData.college_id).then(data => {
      setSubjects(data);
      const matching = data.filter((s: any) => 
        s.year === formData.year && (!formData.stream || s.stream === formData.stream)
      );
      if (matching.length > 0 && !matching.find((s: any) => s.id.toString() === formData.subject_id)) {
        setFormData(prev => ({ ...prev, subject_id: matching[0].id.toString() }));
      }
    });

    getContentTypes(formData.college_id, formData.year).then(data => setContentTypes(data));
    getExamYears(formData.college_id, formData.year).then(data => setExamYears(data));
  }, [formData.college_id, formData.year, formData.stream]);

  const fetchContributions = async () => {
    if (user) {
      const data = await getContributions(user.id);
      setContributions(data);
    }
  };

  const fetchWithdrawals = async () => {
    if (user) {
      const data = await getWithdrawals(user.id);
      // Sort by date descending
      data.sort((a: any, b: any) => {
        const dateA = a.created_at?.toDate ? a.created_at.toDate().getTime() : (a.created_at?.seconds ? a.created_at.seconds * 1000 : new Date(a.created_at || 0).getTime());
        const dateB = b.created_at?.toDate ? b.created_at.toDate().getTime() : (b.created_at?.seconds ? b.created_at.seconds * 1000 : new Date(b.created_at || 0).getTime());
        return dateB - dateA;
      });
      setWithdrawals(data);
    }
  };

  const handleContributionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: null, message: '' });
    setUploadProgress(15);
    setUploadStep('Preparing document upload...');
    startLoading(20, 'Preparing document upload...');

    try {
      let file_url = '';
      if (file) {
        setUploadProgress(35);
        setUploadStep('Uploading file to Cloudinary...');
        setProgress(45, 'Uploading file to Cloudinary...');
        file_url = await uploadFile(file, 'contributions');
        setUploadProgress(75);
        setUploadStep('Saving contribution details to database...');
        setProgress(80, 'Saving contribution details...');
      } else {
        throw new Error("Please select a file to upload.");
      }

      const selectedSubject = subjects.find(s => s.id.toString() === formData.subject_id.toString());
      await addContribution({
        ...formData,
        stream: selectedSubject?.stream || formData.stream || user?.stream || 'Science',
        year: selectedSubject?.year || formData.year,
        file_url,
        user_id: user?.id,
        college_id: formData.college_id === '0' ? null : formData.college_id,
      }, user);
      
      setUploadProgress(100);
      setUploadStep('Uploaded successfully!');
      setProgress(100, 'Uploaded successfully!');

      setStatus({ type: 'success', message: 'Contribution submitted successfully! Waiting for admin approval.' });
      setFormData({
        ...formData,
        description: '',
        payment_info: '',
        contact_number: ''
      });
      setFile(null);
      (e.target as HTMLFormElement).reset();
      fetchContributions();
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'An error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
      stopLoading();
      setTimeout(() => {
        setUploadProgress(0);
        setUploadStep('');
      }, 2000);
    }
  };

  const handleWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: null, message: '' });

    const amount = parseFloat(withdrawData.amount);
    if (isNaN(amount) || amount <= 0) {
      setStatus({ type: 'error', message: 'Please enter a valid amount.' });
      setIsSubmitting(false);
      return;
    }

    if (user && amount > (user.wallet_balance || 0)) {
      setStatus({ type: 'error', message: 'Insufficient wallet balance.' });
      setIsSubmitting(false);
      return;
    }

    if (amount < 100) {
      setStatus({ type: 'error', message: 'Minimum withdrawal amount is NPR 100.' });
      setIsSubmitting(false);
      return;
    }

    try {
      await addWithdrawal({
        user_id: user?.id,
        amount,
        payment_method: withdrawData.payment_method,
        payment_details: withdrawData.payment_details
      });
      
      setStatus({ type: 'success', message: 'Withdrawal request submitted successfully!' });
      setWithdrawData({
        amount: '',
        payment_method: 'esewa',
        payment_details: ''
      });
      fetchWithdrawals();
      if (fetchUser) fetchUser(); // Update wallet balance
    } catch (err: any) {
      console.error('Withdrawal error:', err);
      setStatus({ type: 'error', message: err.message || 'An error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-6xl mx-auto pb-12"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900/90 via-slate-800/80 to-slate-900/90 border border-slate-700/60 shadow-xl backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-purple-400" />
              Contributor Program
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Contribute & Earn
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">Share your verified study materials, question papers & notes to earn real money directly.</p>
        </div>
        <div className="relative z-10 shrink-0 flex items-center gap-4 bg-slate-950/70 p-4 rounded-2xl border border-slate-700/60 backdrop-blur-md">
          <div className="w-12 h-12 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Available Balance</p>
            <p className="text-xl sm:text-2xl font-bold text-white tracking-tight">NPR {user?.wallet_balance?.toFixed(2) || '0.00'}</p>
            {(user?.holding_balance || 0) > 0 && (
              <p className="text-[11px] text-amber-400 font-medium">On Hold: NPR {user?.holding_balance?.toFixed(2)}</p>
            )}
          </div>
          <button 
            onClick={() => setActiveTab('withdraw')}
            className="ml-2 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-sm text-xs cursor-pointer transition-all"
          >
            Withdraw
          </button>
        </div>
      </div>

      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/85 border border-slate-700/60 shadow-lg backdrop-blur-md space-y-6">
        <div className="border-b border-slate-800 flex gap-4">
          <button
            onClick={() => { setActiveTab('submit'); setStatus({ type: null, message: '' }); }}
            className={`pb-3 px-2 font-bold text-sm transition-all border-b-2 cursor-pointer ${
              activeTab === 'submit'
                ? 'border-amber-500 text-[#F5C21B]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Submit Material
          </button>
          <button
            onClick={() => { setActiveTab('withdraw'); setStatus({ type: null, message: '' }); }}
            className={`pb-3 px-2 font-bold text-sm transition-all border-b-2 cursor-pointer ${
              activeTab === 'withdraw'
                ? 'border-amber-500 text-[#F5C21B]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Withdrawals & History
          </button>
        </div>

        <div>
          {status.type && (
            <div className={`mb-6 p-4 rounded-2xl flex items-start gap-3 ${
              status.type === 'success' 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}>
              {status.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
              <p className="text-sm font-medium">{status.message}</p>
            </div>
          )}

          {activeTab === 'submit' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <form onSubmit={handleContributionSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">College</label>
                      <select 
                        required
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white"
                        value={formData.college_id}
                        onChange={(e) => setFormData({...formData, college_id: e.target.value})}
                      >
                        <option value="">Select College</option>
                        <option value="0">Global (Not specific to a college)</option>
                        {colleges.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Class</label>
                      <select 
                        required
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white"
                        value={formData.year}
                        onChange={(e) => setFormData({...formData, year: e.target.value})}
                      >
                        <option value="Class 11">Class 11</option>
                        <option value="Class 12">Class 12</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        Stream <span className="text-emerald-400">*</span>
                      </label>
                      <select 
                        required
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white cursor-pointer"
                        value={formData.stream}
                        onChange={(e) => {
                          const newStream = e.target.value;
                          setFormData(prev => ({ ...prev, stream: newStream, subject_id: '' }));
                        }}
                      >
                        <option value="Science">Science</option>
                        <option value="Management">Management</option>
                        <option value="Humanities">Humanities</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Subject</label>
                      <select 
                        required
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white"
                        value={formData.subject_id}
                        onChange={(e) => setFormData({...formData, subject_id: e.target.value})}
                      >
                        <option value="">Select Subject</option>
                        {subjects
                          .filter(s => s.year === formData.year && (!formData.stream || s.stream === formData.stream))
                          .map(s => (
                            <option key={s.id} value={s.id}>
                              {s.name} {!formData.stream && s.stream ? `(${s.stream})` : ''}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Content Type</label>
                      <select 
                        required
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white"
                        value={formData.type}
                        onChange={(e) => setFormData({...formData, type: e.target.value})}
                      >
                        <option value="pyq">Question Paper</option>
                        <option value="solution">Solution</option>
                        <option value="notes">Notes</option>
                        <option value="syllabus">Syllabus</option>
                        {contentTypes.map(ct => <option key={ct.id} value={ct.name.toLowerCase()}>{ct.name}</option>)}
                      </select>
                    </div>
                  </div>

                  {formData.type === 'pyq' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Term (Optional)</label>
                        <select 
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white"
                          value={formData.term}
                          onChange={(e) => setFormData({...formData, term: e.target.value})}
                        >
                          <option value="">Select Term</option>
                          <option value="1st Term">1st Term</option>
                          <option value="2nd Term">2nd Term</option>
                          <option value="3rd Term">3rd Term</option>
                          <option value="Final Term">Final Term</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Exam Year</label>
                        <select 
                          required
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white"
                          value={formData.exam_year}
                          onChange={(e) => setFormData({...formData, exam_year: e.target.value})}
                        >
                          <option value="">Select Exam Year</option>
                          {[2026, 2025, 2024, 2023, 2022, 2021, 2020].map(y => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                          {examYears.map(ey => <option key={ey.id} value={ey.year_value}>{ey.year_value}</option>)}
                        </select>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Description / Title</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g., 2079 Final Exam Paper, Chapter 1 Complete Notes"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Upload Document (PDF/Image)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FileText className="h-5 w-5 text-slate-400" />
                      </div>
                      <input 
                        type="file"
                        required
                        accept=".pdf,image/*"
                        className="w-full pl-10 px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-emerald-900/30 dark:file:text-emerald-400"
                        onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Upload your document directly from your device.</p>
                  </div>

                  <div className="border-t border-slate-700 pt-6 mt-6">
                    <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-emerald-500" />
                      Payment Details (For Reward)
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">eSewa / Khalti / Bank Details</label>
                        <input 
                          type="text"
                          required
                          placeholder="eSewa ID: 98XXXXXXXX"
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white"
                          value={formData.payment_info}
                          onChange={(e) => setFormData({...formData, payment_info: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Contact Number</label>
                        <input 
                          type="tel"
                          required
                          placeholder="98XXXXXXXX"
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white"
                          value={formData.contact_number}
                          onChange={(e) => setFormData({...formData, contact_number: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  {isSubmitting && (
                    <div className="p-3.5 bg-slate-900/80 rounded-xl border border-amber-400/30 space-y-2">
                      <div className="flex justify-between items-center text-xs text-amber-300 font-medium">
                        <span className="flex items-center gap-1.5">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                          {uploadStep || 'Uploading to server...'}
                        </span>
                        <span className="text-white font-bold">{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                        <div 
                          className="bg-gradient-to-r from-amber-500 via-[#F4B400] to-yellow-300 h-2 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(244,180,0,0.5)]"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-sm hover:shadow-md cursor-pointer text-sm"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                        Uploading {uploadProgress}%...
                      </span>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-slate-950" />
                        Submit Contribution
                      </>
                    )}
                  </button>
                </form>
              </div>

              <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 h-fit">
                <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <History className="w-5 h-5 text-[#F5C21B]" />
                  Recent Submissions
                </h2>
                
                <div className="space-y-3">
                  {contributions.length === 0 ? (
                    <p className="text-xs text-slate-400">No contributions yet. Start uploading to earn!</p>
                  ) : (
                    contributions.slice(0, 5).map((c: any) => (
                      <div key={c.id} className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col gap-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-white text-xs">{c.subject_name} ({c.type.toUpperCase()})</h3>
                            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                              {c.description} {c.exam_year && `(${c.exam_year})`}
                            </p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            c.status === 'verified' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                            c.status === 'rejected' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' :
                            'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          }`}>
                            {c.status.toUpperCase()}
                          </span>
                        </div>
                        {c.status === 'verified' && (
                          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">+ NPR {c.reward}</p>
                        )}
                        {c.admin_comment && (
                          <div className="mt-1 p-2 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs text-slate-400 border border-slate-700">
                            <span className="font-semibold">Admin:</span> {c.admin_comment}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <h2 className="text-base font-bold text-white mb-4">Request Withdrawal</h2>
                  
                  <form onSubmit={handleWithdrawalSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Amount (NPR)</label>
                      <input 
                        type="number"
                        required
                        min="100"
                        max={user?.wallet_balance || 0}
                        placeholder="Min. 100"
                        className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 text-white outline-none text-sm transition-all"
                        value={withdrawData.amount}
                        onChange={(e) => setWithdrawData({...withdrawData, amount: e.target.value})}
                      />
                      <p className="text-xs text-slate-400 mt-1">Available: NPR {user?.wallet_balance?.toFixed(2) || '0.00'}</p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Payment Method</label>
                      <select 
                        required
                        className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 text-white outline-none text-sm transition-all cursor-pointer"
                        value={withdrawData.payment_method}
                        onChange={(e) => setWithdrawData({...withdrawData, payment_method: e.target.value})}
                      >
                        <option value="esewa">eSewa</option>
                        <option value="khalti">Khalti</option>
                        <option value="bank">Bank Transfer</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Payment Details</label>
                      <textarea 
                        required
                        rows={3}
                        placeholder={
                          withdrawData.payment_method === 'bank' 
                            ? "Bank Name, Account Name, Account Number" 
                            : "eSewa/Khalti ID (Mobile Number)"
                        }
                        className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 text-white outline-none text-sm transition-all placeholder-slate-500"
                        value={withdrawData.payment_details}
                        onChange={(e) => setWithdrawData({...withdrawData, payment_details: e.target.value})}
                      />
                    </div>

                    <button 
                      type="submit"
                      disabled={isSubmitting || !user || user.wallet_balance < 100}
                      className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md cursor-pointer text-sm"
                    >
                      {isSubmitting ? 'Processing...' : 'Request Payout'}
                    </button>
                  </form>
                </div>
              </div>

              <div className="lg:col-span-2">
                <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <History className="w-5 h-5 text-[#F5C21B]" />
                  Withdrawal History
                </h2>
                
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden shadow-sm">
                  {withdrawals.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm">
                      No withdrawal requests yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-400 text-xs uppercase font-semibold">
                          <tr>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Amount</th>
                            <th className="px-4 py-3 font-medium">Method</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                            <th className="px-4 py-3 font-medium">Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                          {withdrawals.map((w: any) => (
                            <tr key={w.id} className="hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10">
                              <td className="px-4 py-3 text-white">
                                {w.created_at?.toDate ? w.created_at.toDate().toLocaleDateString() : (w.created_at?.seconds ? new Date(w.created_at.seconds * 1000).toLocaleDateString() : new Date(w.created_at || Date.now()).toLocaleDateString())}
                              </td>
                              <td className="px-4 py-3 font-medium text-white">
                                NPR {w.amount.toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-slate-600 dark:text-slate-300 capitalize">
                                {w.payment_method}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                                  w.status === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' :
                                  w.status === 'rejected' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300' :
                                  'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                                }`}>
                                  {w.status.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-400 text-xs max-w-[200px] truncate">
                                {w.admin_comment || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
