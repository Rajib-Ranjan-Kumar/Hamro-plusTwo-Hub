import React, { useState, useEffect } from 'react';
import { Search, Filter, CheckCircle, XCircle, Clock, Eye, Loader2 } from 'lucide-react';
import { db } from '../../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { updateWithdrawalStatus } from '../../services/db';
import { format } from 'date-fns';

export const WithdrawalManagement = () => {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<'approved' | 'rejected' | null>(null);
  const [selectedWithdrawalId, setSelectedWithdrawalId] = useState<string | null>(null);
  const [feedbackComment, setFeedbackComment] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'withdrawals'), orderBy('created_at', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWithdrawals(data);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching withdrawals:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const openFeedbackModal = (id: string, action: 'approved' | 'rejected') => {
    setSelectedWithdrawalId(id);
    setModalAction(action);
    setFeedbackComment('');
    setIsModalOpen(true);
  };

  const confirmStatusUpdate = async () => {
    if (!selectedWithdrawalId || !modalAction) return;

    if (modalAction === 'rejected' && !feedbackComment.trim()) {
      alert("Please provide a reason for rejection.");
      return;
    }

    setProcessingId(selectedWithdrawalId);
    setIsModalOpen(false);
    
    try {
      await updateWithdrawalStatus(selectedWithdrawalId, modalAction, feedbackComment);
    } catch (error) {
      console.error(`Error updating withdrawal status to ${modalAction}:`, error);
      alert(`Failed to ${modalAction} withdrawal. Check console for details.`);
    } finally {
      setProcessingId(null);
      setSelectedWithdrawalId(null);
      setModalAction(null);
    }
  };

  const filteredWithdrawals = withdrawals.filter(wd => {
    const matchesSearch = (wd.user_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (wd.user_email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          wd.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || wd.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredWithdrawals.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedWithdrawals = filteredWithdrawals.slice(startIndex, startIndex + itemsPerPage);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'approved':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"><CheckCircle className="w-3 h-3" /> Approved</span>;
      case 'pending':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"><Clock className="w-3 h-3" /> Pending</span>;
      case 'rejected':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"><XCircle className="w-3 h-3" /> Rejected</span>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-white">Withdrawal Requests</h2>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search user, email, or ID..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 dark:text-white"
          />
        </div>
        
        <div className="relative w-full sm:w-48">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 dark:text-white appearance-none"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-400 border-b border-slate-700">
              <tr>
                <th className="px-6 py-4 font-medium">Request ID</th>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Method</th>
                <th className="px-6 py-4 font-medium">Details</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {paginatedWithdrawals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                    No withdrawals found matching your filters.
                  </td>
                </tr>
              ) : (
                paginatedWithdrawals.map((wd) => (
                  <tr key={wd.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">
                      {wd.id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-white">{wd.user_name || 'Unknown'}</p>
                        <p className="text-xs text-slate-400">{wd.user_email || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-white">
                      Rs. {wd.amount}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      <span className="capitalize">{wd.payment_method}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-xs max-w-[150px] truncate" title={wd.payment_details}>
                      {wd.payment_details}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(wd.status)}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {wd.created_at ? format(wd.created_at.toDate(), 'MMM d, yyyy') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {wd.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => openFeedbackModal(wd.id, 'approved')}
                            disabled={processingId === wd.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            {processingId === wd.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                            Approve
                          </button>
                          <button 
                            onClick={() => openFeedbackModal(wd.id, 'rejected')}
                            disabled={processingId === wd.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-400 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            {processingId === wd.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500">Processed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="px-6 py-4 border-t border-slate-700 flex items-center justify-between">
          <p className="text-sm text-slate-400">
            Showing <span className="font-medium text-white">{filteredWithdrawals.length > 0 ? startIndex + 1 : 0}</span> to <span className="font-medium text-white">{Math.min(startIndex + itemsPerPage, filteredWithdrawals.length)}</span> of <span className="font-medium text-white">{filteredWithdrawals.length}</span> items
          </p>
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-300 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Previous
            </button>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-1 border border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-300 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-700">
              <h3 className="text-xl font-bold text-white">
                {modalAction === 'approved' ? 'Approve Withdrawal' : 'Reject Withdrawal'}
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                {modalAction === 'approved' 
                  ? 'Add an optional note for the user. This will deduct the amount from their holding balance.' 
                  : 'Please provide a reason for rejection. This will refund the amount to their wallet.'}
              </p>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Feedback / Reason {modalAction === 'rejected' && <span className="text-rose-500">*</span>}
              </label>
              <textarea
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                placeholder={modalAction === 'approved' ? 'e.g., Processed successfully via eSewa.' : 'e.g., Invalid account details provided.'}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white resize-none"
                rows={4}
              />
            </div>
            <div className="p-6 border-t border-slate-700 flex justify-end gap-3 bg-slate-800/50">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusUpdate}
                disabled={modalAction === 'rejected' && !feedbackComment.trim()}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 ${
                  modalAction === 'approved' 
                    ? 'bg-emerald-600 hover:bg-emerald-700' 
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                Confirm {modalAction === 'approved' ? 'Approval' : 'Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
