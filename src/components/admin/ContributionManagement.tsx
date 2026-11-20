import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  Eye, 
  Award, 
  FileText, 
  User as UserIcon, 
  ExternalLink,
  Loader2,
  X,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { db } from '../../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { approveContribution, rejectContribution } from '../../services/db';
import { ConfirmModal } from '../ConfirmModal';
import { useAuth } from '../../context/AuthContext';

export const ContributionManagement = () => {
  const { user: currentAdmin } = useAuth();
  const [contributions, setContributions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'verified' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  // Moderation state
  const [selectedContribution, setSelectedContribution] = useState<any | null>(null);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [rewardAmount, setRewardAmount] = useState(50);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: 'approve' | 'reject';
    contribution: any;
  } | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'contributions'), orderBy('created_at', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setContributions(list);
      setIsLoading(false);
    }, (err) => {
      console.error("Error fetching contributions:", err);
      setIsLoading(false);
    });

    return () => unsub();
  }, []);

  const counts = {
    pending: contributions.filter(c => c.status === 'pending').length,
    verified: contributions.filter(c => c.status === 'verified').length,
    rejected: contributions.filter(c => c.status === 'rejected').length,
  };

  const filteredContributions = contributions
    .filter(c => (activeTab === 'pending' ? c.status === 'pending' : activeTab === 'verified' ? c.status === 'verified' : c.status === 'rejected'))
    .filter(c => {
      const titleMatch = (c.title || c.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      const authorMatch = (c.user_name || c.user_email || '').toLowerCase().includes(searchQuery.toLowerCase());
      const subjectMatch = (c.subject_name || c.subject || '').toLowerCase().includes(searchQuery.toLowerCase());
      return titleMatch || authorMatch || subjectMatch;
    });

  const handleApprove = async () => {
    if (!confirmModal?.contribution) return;
    try {
      setIsProcessing(true);
      await approveContribution(confirmModal.contribution.id, rewardAmount, feedbackComment.trim());
      setConfirmModal(null);
      setSelectedContribution(null);
      setFeedbackComment('');
    } catch (err) {
      console.error("Error approving contribution:", err);
      alert("Failed to approve contribution.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!confirmModal?.contribution) return;
    if (!feedbackComment.trim()) {
      alert("Please provide a rejection reason so the student knows what to fix.");
      return;
    }
    try {
      setIsProcessing(true);
      await rejectContribution(confirmModal.contribution.id, feedbackComment.trim());
      setConfirmModal(null);
      setSelectedContribution(null);
      setFeedbackComment('');
    } catch (err) {
      console.error("Error rejecting contribution:", err);
      alert("Failed to reject contribution.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <Loader2 className="w-8 h-8 text-[#F4B400] animate-spin" />
        <p className="text-xs text-slate-400">Loading contribution submissions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 bg-[#111827] border border-white/10 rounded-2xl">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Review ({counts.pending})</span>
          </button>

          <button
            onClick={() => setActiveTab('verified')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'verified'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Approved ({counts.verified})</span>
          </button>

          <button
            onClick={() => setActiveTab('rejected')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'rejected'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Rejected ({counts.rejected})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student, title, subject..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#080A0E] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#F4B400]"
          />
        </div>
      </div>

      {/* Contributions Table */}
      <div className="rounded-2xl bg-[#111827] border border-white/10 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-[#0F172A]/80 text-slate-400 font-semibold">
                <th className="py-3 px-4">Contributor</th>
                <th className="py-3 px-4">Material Details</th>
                <th className="py-3 px-4">Type & Term</th>
                <th className="py-3 px-4">Submitted Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredContributions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 font-medium">
                    No contributions in the {activeTab} queue.
                  </td>
                </tr>
              ) : (
                filteredContributions.map(item => {
                  const dateStr = item.created_at?.toDate 
                    ? item.created_at.toDate().toLocaleDateString() 
                    : (item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent');

                  return (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Contributor */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-slate-800 text-white text-xs font-bold flex items-center justify-center shrink-0 border border-white/10">
                            {item.user_name ? item.user_name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-white truncate max-w-[140px]">
                              {item.user_name || 'Student'}
                            </span>
                            <span className="text-[11px] text-slate-400 truncate max-w-[140px]">
                              {item.user_email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Material Details */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-200 truncate max-w-xs">
                            {item.description || item.title || 'Academic Submission'}
                          </span>
                          <span className="text-[11px] text-[#F5C21B]">
                            {item.subject_name || item.subject || 'Curriculum Subject'}
                          </span>
                        </div>
                      </td>

                      {/* Type & Term */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="capitalize text-slate-300 font-medium">{item.type || 'Question Paper'}</span>
                          <span className="text-[11px] text-slate-400">{item.term || item.year || 'Class 11'}</span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-400">
                        {dateStr}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.file_url && (
                            <button
                              onClick={() => setPreviewPdfUrl(item.file_url)}
                              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
                              title="Preview Document"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}

                          {item.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => {
                                  setRewardAmount(50);
                                  setFeedbackComment('');
                                  setConfirmModal({
                                    isOpen: true,
                                    title: 'Approve & Award Points',
                                    message: `Approve contribution from ${item.user_name || 'student'} and award reputation points to their wallet?`,
                                    action: 'approve',
                                    contribution: item
                                  });
                                }}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 text-[11px] font-bold"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setFeedbackComment('');
                                  setConfirmModal({
                                    isOpen: true,
                                    title: 'Reject Contribution',
                                    message: `Reject contribution from ${item.user_name || 'student'}?`,
                                    action: 'reject',
                                    contribution: item
                                  });
                                }}
                                className="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 border border-rose-500/30 text-[11px] font-bold"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              item.status === 'verified'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                              {item.status === 'verified' ? `Verified (+${item.reward || 50} pts)` : 'Rejected'}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document PDF Preview Modal */}
      {previewPdfUrl && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl h-[85vh] bg-[#111827] border border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-2xl relative">
            <div className="p-3.5 bg-[#0F172A] border-b border-white/10 flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#F5C21B]" />
                Contribution Document Preview
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={previewPdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
                  title="Open externally"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setPreviewPdfUrl(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-950">
              <iframe
                src={previewPdfUrl}
                className="w-full h-full border-0"
                title="Contribution Document"
              />
            </div>
          </div>
        </div>
      )}

      {/* Moderation Action Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#111827] border border-white/10 rounded-2xl p-6 shadow-2xl relative animate-in zoom-in-95">
            <button
              onClick={() => setConfirmModal(null)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-white mb-2">{confirmModal.title}</h3>
            <p className="text-xs text-slate-400 mb-4">{confirmModal.message}</p>

            {confirmModal.action === 'approve' && (
              <div className="space-y-3 mb-4 text-xs">
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Reward Points to Credit</label>
                  <input
                    type="number"
                    value={rewardAmount}
                    onChange={e => setRewardAmount(Number(e.target.value))}
                    min={1}
                    className="w-full bg-[#080A0E] border border-white/10 rounded-xl px-3 py-2 text-white font-bold text-sm focus:border-[#F4B400]"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Admin Feedback (Optional)</label>
                  <textarea
                    value={feedbackComment}
                    onChange={e => setFeedbackComment(e.target.value)}
                    placeholder="e.g. Great handwriting and verified correct answers."
                    rows={2}
                    className="w-full bg-[#080A0E] border border-white/10 rounded-xl p-2.5 text-white placeholder-slate-500"
                  />
                </div>
              </div>
            )}

            {confirmModal.action === 'reject' && (
              <div className="mb-4 text-xs">
                <label className="text-slate-300 block mb-1 font-medium">Rejection Reason (Required)</label>
                <textarea
                  value={feedbackComment}
                  onChange={e => setFeedbackComment(e.target.value)}
                  placeholder="e.g. Pages 3-4 are blurry and illegible. Please re-upload in high resolution."
                  rows={3}
                  className="w-full bg-[#080A0E] border border-white/10 rounded-xl p-2.5 text-white placeholder-slate-500 focus:border-rose-500"
                  required
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.action === 'approve' ? handleApprove : handleReject}
                disabled={isProcessing}
                className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition-colors flex items-center gap-2 cursor-pointer ${
                  confirmModal.action === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{confirmModal.action === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
