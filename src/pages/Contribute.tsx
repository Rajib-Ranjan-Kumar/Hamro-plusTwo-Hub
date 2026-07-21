import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Upload, FileText, CheckCircle, DollarSign, AlertCircle, CreditCard, History } from 'lucide-react';
import { getColleges, getSubjects, getContentTypes, getExamYears, getContributions, getWithdrawals, addContribution, addWithdrawal, uploadFile } from '../services/db';
import { motion } from 'motion/react';

export const Contribute = () => {
  const { user, fetchUser } = useAuth();
  const [colleges, setColleges] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [contentTypes, setContentTypes] = useState<any[]>([]);
  const [examYears, setExamYears] = useState<any[]>([]);
  const [contributions, setContributions] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  
  const [activeTab, setActiveTab] = useState<'submit' | 'withdraw'>('submit');

  // Submit Form State
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    college_id: user?.college_id?.toString() || '',
    year: user?.year || 'Class 11',
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
    }
  }, [user]);

  useEffect(() => {
    getSubjects(formData.college_id).then(data => {
      setSubjects(data);
      if (data.length > 0 && !data.find((s: any) => s.id.toString() === formData.subject_id)) {
        setFormData(prev => ({ ...prev, subject_id: data[0].id.toString() }));
      }
    });

    getContentTypes(formData.college_id, formData.year).then(data => setContentTypes(data));
    getExamYears(formData.college_id, formData.year).then(data => setExamYears(data));
  }, [formData.college_id, formData.year]);

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

    try {
      let file_url = '';
      if (file) {
        file_url = await uploadFile(file, 'contributions');
      } else {
        throw new Error("Please select a file to upload.");
      }

      await addContribution({
        ...formData,
        file_url,
        user_id: user?.id,
        college_id: formData.college_id === '0' ? null : formData.college_id,
      }, user);
      
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
      className="space-y-6 max-w-6xl mx-auto"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-300" />
            Contribute & Earn
          </h1>
          <p className="text-emerald-100 mt-1">Share your study materials and earn real money!</p>
        </div>
        <div className="bg-slate-800/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 flex items-center gap-6">
          <div>
            <p className="text-emerald-100 text-sm font-medium">Available Balance</p>
            <p className="text-3xl font-bold text-emerald-300">NPR {user?.wallet_balance?.toFixed(2) || '0.00'}</p>
          </div>
          {(user?.holding_balance || 0) > 0 && (
            <div className="hidden sm:block border-l border-white/20 pl-6">
              <p className="text-emerald-100 text-sm font-medium">On Hold</p>
              <p className="text-xl font-bold text-amber-300">NPR {user?.holding_balance?.toFixed(2)}</p>
            </div>
          )}
          <button 
            onClick={() => setActiveTab('withdraw')}
            className="px-4 py-2 bg-slate-800 text-emerald-600 font-bold rounded-lg shadow-sm hover:bg-emerald-50 transition-colors hover-lift ml-2"
          >
            Withdraw
          </button>
        </div>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="border-b border-slate-700">
          <nav className="flex -mb-px">
            <button
              onClick={() => { setActiveTab('submit'); setStatus({ type: null, message: '' }); }}
              className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                activeTab === 'submit'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              Submit Material
            </button>
            <button
              onClick={() => { setActiveTab('withdraw'); setStatus({ type: null, message: '' }); }}
              className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                activeTab === 'withdraw'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              Withdrawals & History
            </button>
          </nav>
        </div>

        <div className="p-6">
          {status.type && (
            <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${
              status.type === 'success' 
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                : 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
            }`}>
              {status.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
              <p>{status.message}</p>
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
                      <label className="block text-sm font-medium text-slate-300 mb-1">Subject</label>
                      <select 
                        required
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white"
                        value={formData.subject_id}
                        onChange={(e) => setFormData({...formData, subject_id: e.target.value})}
                      >
                        <option value="">Select Subject</option>
                        {subjects.filter(s => s.year === formData.year).map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.stream})</option>
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

                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-full transition-colors flex items-center justify-center gap-2 disabled:opacity-70 hover-lift"
                  >
                    {isSubmitting ? 'Submitting...' : (
                      <>
                        <Upload className="w-5 h-5" />
                        Submit Contribution
                      </>
                    )}
                  </button>
                </form>
              </div>

              <div className="glass-panel rounded-2xl p-6 h-fit">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <History className="w-5 h-5 text-emerald-500" />
                  Recent Submissions
                </h2>
                
                <div className="space-y-4">
                  {contributions.length === 0 ? (
                    <p className="text-sm text-slate-400">No contributions yet. Start uploading to earn!</p>
                  ) : (
                    contributions.slice(0, 5).map((c: any) => (
                      <div key={c.id} className="p-4 rounded-xl bg-slate-800 border border-slate-700 flex flex-col gap-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium text-white text-sm">{c.subject_name} ({c.type.toUpperCase()})</h3>
                            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                              {c.description} {c.exam_year && `(${c.exam_year})`}
                            </p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${
                            c.status === 'verified' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' :
                            c.status === 'rejected' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300' :
                            'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
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
                <div className="glass-panel rounded-2xl p-6">
                  <h2 className="text-lg font-bold text-white mb-4">Request Withdrawal</h2>
                  
                  <form onSubmit={handleWithdrawalSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Amount (NPR)</label>
                      <input 
                        type="number"
                        required
                        min="100"
                        max={user?.wallet_balance || 0}
                        placeholder="Min. 100"
                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white"
                        value={withdrawData.amount}
                        onChange={(e) => setWithdrawData({...withdrawData, amount: e.target.value})}
                      />
                      <p className="text-xs text-slate-500 mt-1">Available: NPR {user?.wallet_balance?.toFixed(2) || '0.00'}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Payment Method</label>
                      <select 
                        required
                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white"
                        value={withdrawData.payment_method}
                        onChange={(e) => setWithdrawData({...withdrawData, payment_method: e.target.value})}
                      >
                        <option value="esewa">eSewa</option>
                        <option value="khalti">Khalti</option>
                        <option value="bank">Bank Transfer</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Payment Details</label>
                      <textarea 
                        required
                        rows={3}
                        placeholder={
                          withdrawData.payment_method === 'bank' 
                            ? "Bank Name, Account Name, Account Number" 
                            : "eSewa/Khalti ID (Mobile Number)"
                        }
                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white"
                        value={withdrawData.payment_details}
                        onChange={(e) => setWithdrawData({...withdrawData, payment_details: e.target.value})}
                      />
                    </div>

                    <button 
                      type="submit"
                      disabled={isSubmitting || !user || user.wallet_balance < 100}
                      className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-full transition-colors disabled:opacity-70 disabled:cursor-not-allowed hover-lift"
                    >
                      {isSubmitting ? 'Processing...' : 'Request Payout'}
                    </button>
                  </form>
                </div>
              </div>

              <div className="lg:col-span-2">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <History className="w-5 h-5 text-emerald-500" />
                  Withdrawal History
                </h2>
                
                <div className="glass-panel rounded-xl overflow-hidden">
                  {withdrawals.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                      No withdrawal requests yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-emerald-50 dark:bg-emerald-900/20 text-slate-400">
                          <tr>
                            <th className="px-4 py-3 font-medium">Date</th>
                            <th className="px-4 py-3 font-medium">Amount</th>
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
