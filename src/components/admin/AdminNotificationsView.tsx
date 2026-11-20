import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  CheckSquare, 
  CreditCard, 
  DollarSign, 
  ShieldAlert, 
  UserPlus, 
  ArrowRight, 
  CheckCheck,
  Clock,
  Loader2
} from 'lucide-react';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { AdminTab } from './AdminSidebar';

interface AdminNotificationsViewProps {
  onNavigateTab: (tab: AdminTab) => void;
}

export const AdminNotificationsView: React.FC<AdminNotificationsViewProps> = ({ onNavigateTab }) => {
  const [pendingContributions, setPendingContributions] = useState<any[]>([]);
  const [pendingSubs, setPendingSubs] = useState<any[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<any[]>([]);
  const [flaggedItems, setFlaggedItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Pending Contributions
    const unsubContribs = onSnapshot(
      query(collection(db, 'contributions'), where('status', '==', 'pending')),
      snap => setPendingContributions(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    // 2. Pending Subscriptions
    const unsubSubs = onSnapshot(
      query(collection(db, 'subscription_requests'), where('status', '==', 'pending')),
      snap => setPendingSubs(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    // 3. Pending Withdrawals
    const unsubWithdrawals = onSnapshot(
      query(collection(db, 'withdrawals'), where('status', '==', 'pending')),
      snap => {
        setPendingWithdrawals(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setIsLoading(false);
      }
    );

    return () => {
      unsubContribs();
      unsubSubs();
      unsubWithdrawals();
    };
  }, []);

  const totalActionItems = pendingContributions.length + pendingSubs.length + pendingWithdrawals.length;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <Loader2 className="w-8 h-8 text-[#F4B400] animate-spin" />
        <p className="text-xs text-slate-400">Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="p-5 rounded-2xl bg-[#111827] border border-white/10 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white">System Notification Center</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            You have <strong className="text-[#F5C21B]">{totalActionItems}</strong> pending operational tasks requiring administrator action.
          </p>
        </div>
      </div>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Contributions Alert */}
        <div className="p-5 rounded-2xl bg-[#111827] border border-white/10 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <CheckSquare className="w-5 h-5" />
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300">
              {pendingContributions.length} Pending
            </span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Notes & Question Papers</h4>
            <p className="text-xs text-slate-400 mt-1">
              Peer-submitted materials waiting for curriculum verification and reward points credit.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('contributions')}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-white border border-white/10 transition-colors"
          >
            <span>Review Contributions</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#F5C21B]" />
          </button>
        </div>

        {/* Subscriptions Alert */}
        <div className="p-5 rounded-2xl bg-[#111827] border border-white/10 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300">
              {pendingSubs.length} Pending
            </span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Pro Subscriptions</h4>
            <p className="text-xs text-slate-400 mt-1">
              Payment receipts submitted by students awaiting eSewa / Bank slip verification.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('subscriptions')}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-white border border-white/10 transition-colors"
          >
            <span>Verify Receipts</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#F5C21B]" />
          </button>
        </div>

        {/* Withdrawals Alert */}
        <div className="p-5 rounded-2xl bg-[#111827] border border-white/10 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300">
              {pendingWithdrawals.length} Pending
            </span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Reward Withdrawals</h4>
            <p className="text-xs text-slate-400 mt-1">
              Cashout requests from verified contributors requesting payment to eSewa/Bank.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('withdrawals')}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-white border border-white/10 transition-colors"
          >
            <span>Process Payouts</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#F5C21B]" />
          </button>
        </div>
      </div>
    </div>
  );
};
