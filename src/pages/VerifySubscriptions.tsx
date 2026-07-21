import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { db, auth } from '../firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  orderBy, 
  onSnapshot,
  setDoc,
  addDoc,
  limit,
  getDoc,
  deleteField
} from 'firebase/firestore';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Loader2, 
  User as UserIcon,
  Check,
  AlertCircle,
  CreditCard,
  ShieldAlert,
  BarChart3,
  List,
  Eye,
  Settings,
  X,
  Upload,
  Save,
  History
} from 'lucide-react';
import { cn } from '../lib/utils';
import { uploadFile } from '../services/db';
import { motion, AnimatePresence } from 'motion/react';
import { format, formatDistanceToNow } from 'date-fns';
import { ConfirmModal } from '../components/ConfirmModal';
import { PromptModal } from '../components/PromptModal';
import { AlertModal } from '../components/AlertModal';

type TabType = 'pending' | 'verified' | 'rejected' | 'analytics' | 'audit' | 'settings';

export const VerifySubscriptions = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState('all');
  
  // Modal State
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [adminComment, setAdminComment] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Custom Modals State
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void}>({
    isOpen: false, title: '', message: '', onConfirm: () => {}
  });
  const [promptModal, setPromptModal] = useState<{isOpen: boolean, title: string, message: string, placeholder?: string, defaultValue?: string, onConfirm: (val: string) => void}>({
    isOpen: false, title: '', message: '', onConfirm: () => {}
  });
  const [alertModal, setAlertModal] = useState<{isOpen: boolean, title: string, message: string}>({
    isOpen: false, title: '', message: ''
  });

  // Payment Info State
  const [paymentInfo, setPaymentInfo] = useState({
    esewa_qr_url: '',
    account_number: '',
    account_holder: '',
    bank_name: ''
  });
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [isSavingPayment, setIsSavingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');

  useEffect(() => {
    // Fetch Requests
    const q = query(collection(db, 'subscription_requests'), orderBy('created_at', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requestsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRequests(requestsData);
      setIsLoading(false);
    });

    // Fetch Audit Logs
    const auditQ = query(collection(db, 'audit_logs'), orderBy('created_at', 'desc'), limit(50));
    const unsubscribeAudit = onSnapshot(auditQ, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAuditLogs(logs);
    });

    // Fetch Payment Info
    const fetchPaymentInfo = async () => {
      const q = query(collection(db, 'payment_info'), limit(1));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const data = querySnapshot.docs[0].data();
        setPaymentInfo({
          esewa_qr_url: data.esewa_qr_url || '',
          account_number: data.account_number || '',
          account_holder: data.account_holder || '',
          bank_name: data.bank_name || ''
        });
      }
    };
    fetchPaymentInfo();

    return () => {
      unsubscribe();
      unsubscribeAudit();
    };
  }, []);

  useEffect(() => {
    if (selectedRequest?.user_id) {
      const fetchUser = async () => {
        try {
          const userDoc = await getDoc(doc(db, 'users', selectedRequest.user_id));
          if (userDoc.exists()) {
            setSelectedUser({ id: userDoc.id, ...userDoc.data() });
          }
        } catch (err) {
          console.error("Error fetching user:", err);
        }
      };
      fetchUser();
    } else {
      setSelectedUser(null);
    }
  }, [selectedRequest]);

  const logAction = async (action: string, targetUserId: string, targetRequestId: string, changes: any) => {
    try {
      await addDoc(collection(db, 'audit_logs'), {
        action,
        admin_id: auth.currentUser?.uid || 'unknown',
        admin_name: auth.currentUser?.displayName || auth.currentUser?.email || 'Admin',
        target_user_id: targetUserId,
        target_request_id: targetRequestId,
        changes: JSON.stringify(changes),
        created_at: new Date().toISOString()
      });
    } catch (err) {
      console.error("Error logging action:", err);
    }
  };

  const handleAction = async (requestId: string, userId: string, status: 'approved' | 'rejected' | 'need_review') => {
    setIsProcessing(true);
    try {
      const requestRef = doc(db, 'subscription_requests', requestId);
      const updates: any = {
        status,
        updated_at: new Date().toISOString()
      };
      
      if (adminComment) {
        updates.admin_comment = adminComment;
      }

      await updateDoc(requestRef, updates);

      if (status === 'approved') {
        const userRef = doc(db, 'users', userId);
        
        // Calculate expiry date (e.g., 1 year from now)
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        
        await updateDoc(userRef, {
          is_premium: true,
          subscription_plan: selectedRequest.plan_selected || 'premium',
          subscription_expiry_date: expiryDate.toISOString()
        });
        
        // Also update the request with the expiry date
        await updateDoc(requestRef, {
          subscription_start_date: new Date().toISOString(),
          subscription_expiry_date: expiryDate.toISOString()
        });
      } else if (status === 'rejected') {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          is_premium: false
        });
      }

      await logAction(`subscription_${status}`, userId, requestId, updates);
      
      setSelectedRequest(null);
      setAdminComment('');
    } catch (err) {
      console.error("Error updating subscription status:", err);
      setAlertModal({ isOpen: true, title: 'Error', message: 'Failed to update status. Please try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExtendSubscription = async (requestId: string, userId: string, days: number) => {
    setIsProcessing(true);
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        let currentExpiry = new Date();
        
        if (userData.subscription_expiry_date) {
          const existingExpiry = new Date(userData.subscription_expiry_date);
          if (existingExpiry > currentExpiry) {
            currentExpiry = existingExpiry;
          }
        }
        
        currentExpiry.setDate(currentExpiry.getDate() + days);
        
        await updateDoc(userRef, {
          subscription_expiry_date: currentExpiry.toISOString()
        });
        
        const requestRef = doc(db, 'subscription_requests', requestId);
        await updateDoc(requestRef, {
          subscription_expiry_date: currentExpiry.toISOString()
        });
        
        await logAction('subscription_extended', userId, requestId, { days_added: days, new_expiry: currentExpiry.toISOString() });
        
        setSelectedRequest(null);
        setAlertModal({ isOpen: true, title: 'Success', message: `Subscription extended by ${days} days.` });
      }
    } catch (err) {
      console.error("Error extending subscription:", err);
      setAlertModal({ isOpen: true, title: 'Error', message: 'Failed to extend subscription.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelSubscription = async (requestId: string, userId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Cancel Subscription',
      message: 'Are you sure you want to cancel this subscription? This will immediately revoke premium access.',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setIsProcessing(true);
        try {
          const userRef = doc(db, 'users', userId);
          await updateDoc(userRef, {
            is_premium: false,
            subscription_expiry_date: deleteField()
          });
          
          const requestRef = doc(db, 'subscription_requests', requestId);
          await updateDoc(requestRef, {
            status: 'cancelled',
            updated_at: new Date().toISOString()
          });
          
          await logAction('subscription_cancelled', userId, requestId, { reason: adminComment || 'Manually cancelled by admin' });
          
          setSelectedRequest(null);
          setAdminComment('');
          setAlertModal({ isOpen: true, title: 'Success', message: 'Subscription cancelled successfully.' });
        } catch (err) {
          console.error("Error cancelling subscription:", err);
          setAlertModal({ isOpen: true, title: 'Error', message: 'Failed to cancel subscription.' });
        } finally {
          setIsProcessing(false);
        }
      }
    });
  };

  const handleChangePlan = async (requestId: string, userId: string, newPlan: string) => {
    setIsProcessing(true);
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        subscription_plan: newPlan
      });
      
      const requestRef = doc(db, 'subscription_requests', requestId);
      await updateDoc(requestRef, {
        plan_selected: newPlan,
        updated_at: new Date().toISOString()
      });
      
      await logAction('subscription_plan_changed', userId, requestId, { new_plan: newPlan });
      
      setSelectedRequest(null);
      setAlertModal({ isOpen: true, title: 'Success', message: `Subscription plan changed to ${newPlan}.` });
    } catch (err) {
      console.error("Error changing subscription plan:", err);
      setAlertModal({ isOpen: true, title: 'Error', message: 'Failed to change subscription plan.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSavePaymentInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPayment(true);
    setPaymentStatus('');
    try {
      let finalQrUrl = paymentInfo.esewa_qr_url;

      if (qrFile) {
        setPaymentStatus('Uploading QR code...');
        finalQrUrl = await uploadFile(qrFile, 'admin/payment');
      }

      const infoRef = doc(db, 'payment_info', 'admin_settings');
      await setDoc(infoRef, {
        ...paymentInfo,
        esewa_qr_url: finalQrUrl,
        updated_at: new Date().toISOString()
      }, { merge: true });
      
      setPaymentInfo(prev => ({ ...prev, esewa_qr_url: finalQrUrl }));
      setQrFile(null);
      setPaymentStatus('Payment info updated successfully!');
      
      await logAction('update_payment_settings', 'system', 'system', { updated: true });
      
      setTimeout(() => setPaymentStatus(''), 3000);
    } catch (err) {
      console.error("Error saving payment info:", err);
      setPaymentStatus('Error saving payment info.');
    } finally {
      setIsSavingPayment(false);
    }
  };

  const filteredRequests = requests.filter(r => {
    const matchesSearch = r.user_name?.toLowerCase().includes(search.toLowerCase()) || 
                          r.user_email?.toLowerCase().includes(search.toLowerCase()) ||
                          r.transaction_id?.toLowerCase().includes(search.toLowerCase());
    
    const matchesPlan = filterPlan === 'all' || r.plan_selected === filterPlan;
    
    let matchesDate = true;
    if (filterDateRange !== 'all' && r.created_at) {
      const requestDate = new Date(r.created_at);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - requestDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (filterDateRange === 'today') matchesDate = diffDays <= 1;
      else if (filterDateRange === 'week') matchesDate = diffDays <= 7;
      else if (filterDateRange === 'month') matchesDate = diffDays <= 30;
    }

    const matchesAllFilters = matchesSearch && matchesPlan && matchesDate;

    if (activeTab === 'pending') return (r.status === 'pending' || r.status === 'need_review') && matchesAllFilters;
    if (activeTab === 'verified') return r.status === 'approved' && matchesAllFilters;
    if (activeTab === 'rejected') return (r.status === 'rejected' || r.status === 'cancelled') && matchesAllFilters;
    return false;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending' || r.status === 'need_review').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected' || r.status === 'cancelled').length,
    revenue: requests.filter(r => r.status === 'approved').reduce((acc, curr) => acc + (curr.amount_paid || 0), 0)
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-8 pb-12"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Subscription Management</h1>
          <p className="text-slate-500 text-sm">Verify premium requests, manage users, and view analytics.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
        {[
          { id: 'pending', label: 'Pending Requests', icon: Clock, count: stats.pending, color: 'text-amber-500' },
          { id: 'verified', label: 'Verified', icon: CheckCircle, count: stats.approved, color: 'text-emerald-500' },
          { id: 'rejected', label: 'Rejected', icon: XCircle, count: stats.rejected, color: 'text-rose-500' },
          { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'text-indigo-500' },
          { id: 'audit', label: 'Audit Logs', icon: List, color: 'text-slate-500' },
          { id: 'settings', label: 'Payment Settings', icon: Settings, color: 'text-slate-500' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
              activeTab === tab.id 
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md" 
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
            )}
          >
            <tab.icon className={cn("w-4 h-4", activeTab !== tab.id && tab.color)} />
            {tab.label}
            {tab.count !== undefined && (
              <span className={cn(
                "ml-1.5 px-2 py-0.5 rounded-full text-xs",
                activeTab === tab.id ? "bg-white/20 dark:bg-slate-900/20" : "bg-slate-200 dark:bg-slate-700"
              )}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="min-h-[500px]">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : (
          <>
            {/* List Views (Pending, Verified, Rejected) */}
            {['pending', 'verified', 'rejected'].includes(activeTab) && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="relative w-full md:w-96">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search by name, email, or transaction ID..." 
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <select
                      value={filterPlan}
                      onChange={(e) => setFilterPlan(e.target.value)}
                      className="px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      <option value="all">All Plans</option>
                      <option value="premium">Premium</option>
                      <option value="pro">Pro</option>
                      <option value="basic">Basic</option>
                    </select>
                    <select
                      value={filterDateRange}
                      onChange={(e) => setFilterDateRange(e.target.value)}
                      className="px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="week">Past Week</option>
                      <option value="month">Past Month</option>
                    </select>
                  </div>
                </div>

                <div className="glass-panel rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="px-6 py-4 font-medium">User</th>
                          <th className="px-6 py-4 font-medium">Plan & Method</th>
                          <th className="px-6 py-4 font-medium">Transaction ID</th>
                          <th className="px-6 py-4 font-medium">Date</th>
                          <th className="px-6 py-4 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {filteredRequests.length > 0 ? filteredRequests.map((request) => (
                          <tr key={request.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">
                                  {request.user_name?.charAt(0) || 'U'}
                                </div>
                                <div>
                                  <p className="font-medium text-white flex items-center gap-2">
                                    {request.user_name}
                                    {request.status === 'need_review' && (
                                      <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded text-[10px] font-bold uppercase tracking-wider">
                                        Review
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-xs text-slate-500">{request.user_email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-1">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 w-fit">
                                  {request.plan_selected || 'Premium'}
                                </span>
                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                  <CreditCard className="w-3 h-3" /> {request.payment_method || 'Manual'}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 font-mono text-xs text-slate-400">
                              {request.transaction_id || 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-slate-500">
                              {request.created_at ? format(new Date(request.created_at), 'MMM d, yyyy') : 'Unknown'}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => setSelectedRequest(request)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" /> View Details
                              </button>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                              No requests found matching your criteria.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Analytics Dashboard */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-medium text-slate-500">Active Subs</h3>
                    </div>
                    <p className="text-3xl font-bold text-white">{stats.approved}</p>
                  </div>
                  <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                        <Clock className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-medium text-slate-500">Pending</h3>
                    </div>
                    <p className="text-3xl font-bold text-white">{stats.pending}</p>
                  </div>
                  <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-medium text-slate-500">Total Revenue</h3>
                    </div>
                    <p className="text-3xl font-bold text-white">₹{stats.revenue}</p>
                  </div>
                  <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg">
                        <XCircle className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-medium text-slate-500">Rejected</h3>
                    </div>
                    <p className="text-3xl font-bold text-white">{stats.rejected}</p>
                  </div>
                </div>
                <div className="glass-panel p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>Detailed charts and revenue growth graphs will appear here.</p>
                </div>
              </div>
            )}

            {/* Audit Logs */}
            {activeTab === 'audit' && (
              <div className="glass-panel rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                  <h3 className="font-medium text-white flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-slate-500" /> System Audit Trail
                  </h3>
                </div>
                <div className="divide-y divide-slate-200 dark:divide-slate-800 max-h-[600px] overflow-y-auto">
                  {auditLogs.length > 0 ? auditLogs.map((log) => (
                    <div key={log.id} className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm text-white">
                            <span className="font-medium">{log.admin_name}</span> performed <span className="font-mono text-xs bg-slate-800 px-1 py-0.5 rounded">{log.action}</span>
                          </p>
                          <p className="text-xs text-slate-500 mt-1">Target User: {log.target_user_id}</p>
                        </div>
                        <span className="text-xs text-slate-400 whitespace-nowrap">
                          {log.created_at ? formatDistanceToNow(new Date(log.created_at), { addSuffix: true }) : ''}
                        </span>
                      </div>
                    </div>
                  )) : (
                    <div className="p-8 text-center text-slate-500">No audit logs found.</div>
                  )}
                </div>
              </div>
            )}

            {/* Payment Settings */}
            {activeTab === 'settings' && (
              <div className="max-w-2xl">
                <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
                  <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-emerald-500" />
                    Manual Payment Configuration
                  </h2>
                  <form onSubmit={handleSavePaymentInfo} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-1">Bank Name</label>
                          <input 
                            type="text" 
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                            value={paymentInfo.bank_name}
                            onChange={(e) => setPaymentInfo({...paymentInfo, bank_name: e.target.value})}
                            placeholder="e.g. Global IME Bank"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-1">Account Holder Name</label>
                          <input 
                            type="text" 
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                            value={paymentInfo.account_holder}
                            onChange={(e) => setPaymentInfo({...paymentInfo, account_holder: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-1">Account Number</label>
                          <input 
                            type="text" 
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                            value={paymentInfo.account_number}
                            onChange={(e) => setPaymentInfo({...paymentInfo, account_number: e.target.value})}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">eSewa / UPI QR Code</label>
                        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 text-center h-[200px] flex flex-col items-center justify-center relative overflow-hidden group hover:border-emerald-500 transition-colors">
                          {qrFile ? (
                            <img src={URL.createObjectURL(qrFile)} alt="QR Preview" referrerPolicy="no-referrer" className="h-full object-contain" />
                          ) : paymentInfo.esewa_qr_url ? (
                            <img src={paymentInfo.esewa_qr_url} alt="Current QR" referrerPolicy="no-referrer" className="h-full object-contain" />
                          ) : (
                            <div className="text-slate-500">
                              <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">Click to upload QR code</p>
                            </div>
                          )}
                          <input 
                            type="file" 
                            accept="image/*"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={(e) => setQrFile(e.target.files?.[0] || null)}
                          />
                        </div>
                      </div>
                    </div>

                    {paymentStatus && (
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm text-center">
                        {paymentStatus}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSavingPayment}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                    >
                      {isSavingPayment ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      Save Payment Configuration
                    </button>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Subscription Details Modal */}
      {createPortal(
        <AnimatePresence>
          {selectedRequest && (
            <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800"
              >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    Subscription Verification
                    {selectedRequest.status === 'need_review' && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full text-xs font-bold uppercase tracking-wider">
                        Needs Review
                      </span>
                    )}
                  </h2>
                  <p className="text-sm text-slate-500">Request ID: <span className="font-mono">{selectedRequest.id}</span></p>
                </div>
                <button 
                  onClick={() => setSelectedRequest(null)}
                  className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column: User & Payment Details */}
                  <div className="space-y-6">
                    {/* User Profile Summary */}
                    <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-emerald-500" /> User Profile
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-slate-500">Full Name</p>
                          <p className="font-medium text-white">{selectedRequest.user_name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Email Address</p>
                          <p className="font-medium text-white">{selectedRequest.user_email}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">User ID</p>
                          <p className="font-mono text-xs text-slate-400">{selectedRequest.user_id}</p>
                        </div>
                        {selectedUser && (
                          <>
                            <div>
                              <p className="text-xs text-slate-500">Current Status</p>
                              <p className="font-medium text-white">
                                {selectedUser.is_premium ? (
                                  <span className="text-emerald-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Premium Active</span>
                                ) : (
                                  <span className="text-slate-500 flex items-center gap-1"><XCircle className="w-3 h-3" /> Free Tier</span>
                                )}
                              </p>
                            </div>
                            {selectedUser.subscription_expiry_date && (
                              <div>
                                <p className="text-xs text-slate-500">Expiry Date</p>
                                <p className="font-medium text-white">
                                  {format(new Date(selectedUser.subscription_expiry_date), 'PP')}
                                </p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Payment Verification Details */}
                    <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-emerald-500" /> Payment Details
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-slate-500">Plan Selected</p>
                          <p className="font-medium text-indigo-600 dark:text-indigo-400">{selectedRequest.plan_selected || 'Premium'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Payment Method</p>
                          <p className="font-medium text-white">{selectedRequest.payment_method || 'Manual Transfer'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Amount Paid</p>
                          <p className="font-medium text-white">₹{selectedRequest.amount_paid || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Transaction ID</p>
                          <p className="font-mono text-xs text-white">{selectedRequest.transaction_id || 'N/A'}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-slate-500">Request Date</p>
                          <p className="font-medium text-white">
                            {selectedRequest.created_at ? format(new Date(selectedRequest.created_at), 'PPpp') : 'Unknown'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Previous Subscription History */}
                    <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                        <History className="w-4 h-4 text-emerald-500" /> Subscription History
                      </h3>
                      <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
                        {requests.filter(r => r.user_id === selectedRequest.user_id && r.id !== selectedRequest.id).length > 0 ? (
                          requests.filter(r => r.user_id === selectedRequest.user_id && r.id !== selectedRequest.id).map(historyReq => (
                            <div key={historyReq.id} className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                              <div>
                                <p className="text-xs font-medium text-white">{historyReq.plan_selected || 'Premium'} Plan</p>
                                <p className="text-[10px] text-slate-500">{historyReq.created_at ? format(new Date(historyReq.created_at), 'MMM d, yyyy') : 'Unknown'}</p>
                              </div>
                              <span className={cn(
                                "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                                historyReq.status === 'approved' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                                historyReq.status === 'rejected' ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" :
                                historyReq.status === 'cancelled' ? "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400" :
                                "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                              )}>
                                {historyReq.status}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-500 italic text-center py-2">No previous subscription history found.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Screenshot & Actions */}
                  <div className="space-y-6 flex flex-col h-full">
                    <div className="flex-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-700 overflow-hidden flex flex-col">
                      <div className="p-3 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Payment Proof</span>
                        <a 
                          href={selectedRequest.transaction_image_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> View Full Size
                        </a>
                      </div>
                      <div className="flex-1 p-2 flex items-center justify-center bg-black/5">
                        <img 
                          src={selectedRequest.transaction_image_url} 
                          alt="Transaction Proof" 
                          className="max-h-[300px] object-contain rounded"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>

                    {/* Admin Actions Panel */}
                    <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-emerald-500" /> Admin Actions
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Admin Comment / Reason (Optional)</label>
                          <textarea 
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                            rows={2}
                            placeholder="Add a note for the user or audit log..."
                            value={adminComment}
                            onChange={(e) => setAdminComment(e.target.value)}
                          />
                        </div>

                        {selectedRequest.status === 'pending' || selectedRequest.status === 'need_review' ? (
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={() => handleAction(selectedRequest.id, selectedRequest.user_id, 'approved')}
                              disabled={isProcessing}
                              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                              Approve
                            </button>
                            <button
                              onClick={() => handleAction(selectedRequest.id, selectedRequest.user_id, 'rejected')}
                              disabled={isProcessing}
                              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                              Reject
                            </button>
                            <button
                              onClick={() => handleAction(selectedRequest.id, selectedRequest.user_id, 'need_review')}
                              disabled={isProcessing || selectedRequest.status === 'need_review'}
                              className="col-span-2 w-full py-2 bg-amber-100 hover:bg-amber-200 text-amber-700 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 dark:text-amber-400 font-medium rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              <AlertCircle className="w-4 h-4" /> Mark as "Need Review"
                            </button>
                          </div>
                        ) : (
                          <div className="p-4 rounded-xl border flex items-center justify-between bg-white dark:bg-slate-900">
                            <div>
                              <p className="text-xs text-slate-500">Current Status</p>
                              <p className={cn(
                                "font-bold capitalize",
                                selectedRequest.status === 'approved' ? "text-emerald-600" : "text-rose-600"
                              )}>
                                {selectedRequest.status}
                              </p>
                            </div>
                            {selectedRequest.status === 'approved' && (
                              <div className="flex flex-col gap-2 w-2/3">
                                <button
                                  onClick={() => handleCancelSubscription(selectedRequest.id, selectedRequest.user_id)}
                                  disabled={isProcessing}
                                  className="w-full px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 dark:text-rose-400 font-medium rounded-lg text-sm transition-colors"
                                >
                                  Cancel Subscription
                                </button>
                                <button
                                  onClick={() => {
                                    setPromptModal({
                                      isOpen: true,
                                      title: 'Extend Subscription',
                                      message: 'Enter number of days to extend:',
                                      placeholder: 'e.g. 30',
                                      onConfirm: (daysStr) => {
                                        setPromptModal(prev => ({ ...prev, isOpen: false }));
                                        const days = Number(daysStr);
                                        if (days && !isNaN(days)) {
                                          handleExtendSubscription(selectedRequest.id, selectedRequest.user_id, days);
                                        } else {
                                          setAlertModal({ isOpen: true, title: 'Invalid Input', message: 'Please enter a valid number of days.' });
                                        }
                                      }
                                    });
                                  }}
                                  disabled={isProcessing}
                                  className="w-full px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-400 font-medium rounded-lg text-sm transition-colors"
                                >
                                  Extend Subscription
                                </button>
                                <button
                                  onClick={() => {
                                    setPromptModal({
                                      isOpen: true,
                                      title: 'Change Plan',
                                      message: 'Enter new plan name (e.g., premium, pro):',
                                      placeholder: 'premium',
                                      onConfirm: (newPlan) => {
                                        setPromptModal(prev => ({ ...prev, isOpen: false }));
                                        if (newPlan && newPlan.trim() !== '') {
                                          handleChangePlan(selectedRequest.id, selectedRequest.user_id, newPlan.trim());
                                        } else {
                                          setAlertModal({ isOpen: true, title: 'Invalid Input', message: 'Please enter a valid plan name.' });
                                        }
                                      }
                                    });
                                  }}
                                  disabled={isProcessing}
                                  className="w-full px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-700 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 dark:text-amber-400 font-medium rounded-lg text-sm transition-colors"
                                >
                                  Change Plan
                                </button>
                              </div>
                            )}
                            {(selectedRequest.status === 'rejected' || selectedRequest.status === 'cancelled') && (
                              <button
                                onClick={() => handleAction(selectedRequest.id, selectedRequest.user_id, 'approved')}
                                disabled={isProcessing}
                                className="px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-400 font-medium rounded-lg text-sm transition-colors"
                              >
                                Approve Access
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
    )}

    {/* Custom Modals */}
    <ConfirmModal
      isOpen={confirmModal.isOpen}
      title={confirmModal.title}
      message={confirmModal.message}
      onConfirm={confirmModal.onConfirm}
      onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
    />
    <PromptModal
      isOpen={promptModal.isOpen}
      title={promptModal.title}
      message={promptModal.message}
      placeholder={promptModal.placeholder}
      defaultValue={promptModal.defaultValue}
      onConfirm={promptModal.onConfirm}
      onCancel={() => setPromptModal(prev => ({ ...prev, isOpen: false }))}
    />
    <AlertModal
      isOpen={alertModal.isOpen}
      title={alertModal.title}
      message={alertModal.message}
      onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
    />
    </motion.div>
  );
};
