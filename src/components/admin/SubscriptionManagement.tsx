import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Eye, 
  ExternalLink, 
  Loader2, 
  X, 
  ShieldCheck,
  Calendar,
  DollarSign
} from 'lucide-react';
import { db } from '../../firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  addDoc 
} from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';

export const SubscriptionManagement = () => {
  const { user: currentAdmin } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [previewSlipUrl, setPreviewSlipUrl] = useState<string | null>(null);
  const [activeActionModal, setActiveActionModal] = useState<{
    request: any;
    action: 'approve' | 'reject';
  } | null>(null);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [planDays, setPlanDays] = useState(30);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'subscription_requests'), orderBy('created_at', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRequests(list);
      setIsLoading(false);
    }, (err) => {
      console.error("Error fetching subscriptions:", err);
      setIsLoading(false);
    });

    return () => unsub();
  }, []);

  const counts = {
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  const filteredRequests = requests
    .filter(r => activeTab === 'pending' ? r.status === 'pending' : activeTab === 'approved' ? r.status === 'approved' : r.status === 'rejected')
    .filter(r => {
      const nameMatch = (r.user_name || '').toLowerCase().includes(searchQuery.toLowerCase());
      const emailMatch = (r.user_email || '').toLowerCase().includes(searchQuery.toLowerCase());
      const planMatch = (r.plan_selected || '').toLowerCase().includes(searchQuery.toLowerCase());
      return nameMatch || emailMatch || planMatch;
    });

  const handleApprove = async () => {
    if (!activeActionModal?.request) return;
    const req = activeActionModal.request;

    try {
      setIsProcessing(true);
      // Calculate expiry date
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + planDays);
      const expiryIso = expiry.toISOString();

      // 1. Update subscription request
      await updateDoc(doc(db, 'subscription_requests', req.id), {
        status: 'approved',
        admin_comment: feedbackComment.trim() || 'Subscription verified and activated.',
        approved_at: new Date().toISOString(),
        expiry_date: expiryIso
      });

      // 2. Update user's premium status in Firestore
      if (req.user_id) {
        await updateDoc(doc(db, 'users', req.user_id), {
          is_premium: true,
          subscription_plan: req.plan_selected || 'Pro Plan',
          subscription_expiry_date: expiryIso
        }).catch(err => console.warn("Could not update user document:", err));
      }

      // 3. Add to audit log
      await addDoc(collection(db, 'audit_logs'), {
        action: 'SUBSCRIPTION_APPROVED',
        admin_id: currentAdmin?.id || 'admin',
        admin_name: currentAdmin?.name || currentAdmin?.email || 'Admin',
        target_user_id: req.user_id,
        target_request_id: req.id,
        plan: req.plan_selected,
        created_at: new Date().toISOString()
      }).catch(() => null);

      setActiveActionModal(null);
      setFeedbackComment('');
    } catch (err) {
      console.error("Error approving subscription:", err);
      alert("Failed to approve subscription.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!activeActionModal?.request) return;
    if (!feedbackComment.trim()) {
      alert("Please provide a rejection reason for the student.");
      return;
    }
    const req = activeActionModal.request;

    try {
      setIsProcessing(true);
      await updateDoc(doc(db, 'subscription_requests', req.id), {
        status: 'rejected',
        admin_comment: feedbackComment.trim(),
        rejected_at: new Date().toISOString()
      });

      await addDoc(collection(db, 'audit_logs'), {
        action: 'SUBSCRIPTION_REJECTED',
        admin_id: currentAdmin?.id || 'admin',
        admin_name: currentAdmin?.name || currentAdmin?.email || 'Admin',
        target_user_id: req.user_id,
        target_request_id: req.id,
        reason: feedbackComment.trim(),
        created_at: new Date().toISOString()
      }).catch(() => null);

      setActiveActionModal(null);
      setFeedbackComment('');
    } catch (err) {
      console.error("Error rejecting subscription:", err);
      alert("Failed to reject subscription.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <Loader2 className="w-8 h-8 text-[#F4B400] animate-spin" />
        <p className="text-xs text-slate-400">Loading subscription requests...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Filter Tabs */}
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
            <span>Pending ({counts.pending})</span>
          </button>

          <button
            onClick={() => setActiveTab('approved')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'approved'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Active / Approved ({counts.approved})</span>
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
            placeholder="Search student or plan..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#080A0E] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#F4B400]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-[#111827] border border-white/10 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-[#0F172A]/80 text-slate-400 font-semibold">
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Plan Selected</th>
                <th className="py-3 px-4">Amount Paid</th>
                <th className="py-3 px-4">Payment Receipt</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 font-medium">
                    No subscription requests in the {activeTab} queue.
                  </td>
                </tr>
              ) : (
                filteredRequests.map(item => {
                  const dateStr = item.created_at?.toDate 
                    ? item.created_at.toDate().toLocaleDateString() 
                    : (item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A');

                  return (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Student */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-white truncate max-w-[150px]">{item.user_name || 'Student'}</span>
                          <span className="text-[11px] text-slate-400 truncate max-w-[150px]">{item.user_email}</span>
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#F4B400]/15 text-[#F5C21B] border border-[#F4B400]/30">
                          {item.plan_selected || 'Pro Plan'}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 font-bold text-emerald-400">
                        NPR {item.amount_paid || 199}
                      </td>

                      {/* Slip preview */}
                      <td className="py-3.5 px-4">
                        {item.payment_proof_url ? (
                          <button
                            onClick={() => setPreviewSlipUrl(item.payment_proof_url)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-medium border border-white/10"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                            <span>View Slip</span>
                          </button>
                        ) : (
                          <span className="text-slate-500 text-[11px]">No receipt file</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-400">
                        {dateStr}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => {
                                  setPlanDays(30);
                                  setFeedbackComment('');
                                  setActiveActionModal({ request: item, action: 'approve' });
                                }}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 text-[11px] font-bold"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setFeedbackComment('');
                                  setActiveActionModal({ request: item, action: 'reject' });
                                }}
                                className="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 border border-rose-500/30 text-[11px] font-bold"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              item.status === 'approved'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                              {item.status}
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

      {/* Payment Receipt Modal */}
      {previewSlipUrl && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#111827] border border-white/10 rounded-2xl p-4 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#F5C21B]" />
                Payment Proof Receipt
              </span>
              <button
                onClick={() => setPreviewSlipUrl(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-black/50 rounded-xl p-2">
              <img src={previewSlipUrl} alt="Payment Receipt" className="max-h-[65vh] object-contain rounded-lg" />
            </div>
          </div>
        </div>
      )}

      {/* Action Dialog */}
      {activeActionModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#111827] border border-white/10 rounded-2xl p-6 shadow-2xl relative animate-in zoom-in-95">
            <button
              onClick={() => setActiveActionModal(null)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-2">
              {activeActionModal.action === 'approve' ? 'Approve Subscription' : 'Reject Subscription'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Subscription for {activeActionModal.request.user_name || activeActionModal.request.user_email} ({activeActionModal.request.plan_selected || 'Pro'}).
            </p>

            {activeActionModal.action === 'approve' && (
              <div className="space-y-3 mb-4 text-xs">
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Subscription Duration (Days)</label>
                  <select
                    value={planDays}
                    onChange={e => setPlanDays(Number(e.target.value))}
                    className="w-full bg-[#080A0E] border border-white/10 rounded-xl px-3 py-2 text-white font-bold"
                  >
                    <option value={30}>30 Days (Monthly Pass)</option>
                    <option value={90}>90 Days (Quarterly Pass)</option>
                    <option value={180}>180 Days (Semester Pass)</option>
                    <option value={365}>365 Days (Annual Pass)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Admin Notes (Optional)</label>
                  <input
                    type="text"
                    value={feedbackComment}
                    onChange={e => setFeedbackComment(e.target.value)}
                    placeholder="e.g. eSewa transaction verified successfully."
                    className="w-full bg-[#080A0E] border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-500"
                  />
                </div>
              </div>
            )}

            {activeActionModal.action === 'reject' && (
              <div className="mb-4 text-xs">
                <label className="text-slate-300 block mb-1 font-medium">Rejection Reason (Required)</label>
                <textarea
                  value={feedbackComment}
                  onChange={e => setFeedbackComment(e.target.value)}
                  placeholder="e.g. Transaction code not found in statement. Please re-check receipt."
                  rows={3}
                  className="w-full bg-[#080A0E] border border-white/10 rounded-xl p-2.5 text-white placeholder-slate-500 focus:border-rose-500"
                  required
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                onClick={() => setActiveActionModal(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={activeActionModal.action === 'approve' ? handleApprove : handleReject}
                disabled={isProcessing}
                className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition-colors flex items-center gap-2 cursor-pointer ${
                  activeActionModal.action === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{activeActionModal.action === 'approve' ? 'Activate Pro Access' : 'Reject Request'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
