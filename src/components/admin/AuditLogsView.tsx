import React, { useState, useEffect } from 'react';
import { 
  History, 
  ShieldCheck, 
  Search, 
  Filter, 
  Clock, 
  User, 
  FileText, 
  CreditCard, 
  DollarSign, 
  Settings, 
  Loader2,
  Calendar
} from 'lucide-react';
import { db } from '../../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

export const AuditLogsView = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  useEffect(() => {
    const q = query(collection(db, 'audit_logs'), orderBy('created_at', 'desc'), limit(100));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setLogs(list);
      setIsLoading(false);
    }, (err) => {
      console.error("Error loading audit logs:", err);
      setIsLoading(false);
    });

    return () => unsub();
  }, []);

  const filteredLogs = logs.filter(log => {
    const actionMatch = actionFilter === 'all' || (log.action || '').toLowerCase().includes(actionFilter.toLowerCase());
    const adminMatch = (log.admin_name || log.admin_id || '').toLowerCase().includes(searchQuery.toLowerCase());
    const targetMatch = (log.target_user_id || log.target_email || log.action || '').toLowerCase().includes(searchQuery.toLowerCase());
    return actionMatch && (adminMatch || targetMatch);
  });

  const getActionBadge = (action: string) => {
    const act = (action || '').toUpperCase();
    if (act.includes('APPROVED')) {
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{action}</span>;
    }
    if (act.includes('REJECTED') || act.includes('DELETED') || act.includes('SUSPENDED')) {
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">{action}</span>;
    }
    if (act.includes('ROLE')) {
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">{action}</span>;
    }
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-[#F5C21B] border border-amber-500/20">{action}</span>;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <Loader2 className="w-8 h-8 text-[#F4B400] animate-spin" />
        <p className="text-xs text-slate-400">Loading audit trail...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-[#111827] border border-white/10 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Immutable Security Audit Trail</h3>
            <p className="text-[11px] text-slate-400">Chronological verification of administrative activities & compliance</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="bg-[#080A0E] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-300"
          >
            <option value="all">All Actions</option>
            <option value="APPROVED">Approvals</option>
            <option value="REJECTED">Rejections</option>
            <option value="ROLE">Role Updates</option>
            <option value="DELETED">Deletions</option>
            <option value="SUSPENDED">Suspensions</option>
          </select>

          {/* Search */}
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by admin or target..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#080A0E] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#F4B400]"
            />
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl bg-[#111827] border border-white/10 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-[#0F172A]/80 text-slate-400 font-semibold">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Administrator</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Record</th>
                <th className="py-3 px-4">Details / Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 font-medium">
                    No audit records found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  let dateStr = 'Recent';
                  if (log.created_at) {
                    const d = log.created_at.toDate ? log.created_at.toDate() : new Date(log.created_at);
                    dateStr = d.toLocaleString();
                  }

                  return (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-white truncate max-w-[140px]">{log.admin_name || 'Admin'}</span>
                          <span className="text-[10px] text-slate-500 font-mono truncate max-w-[140px]">{log.admin_id}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {getActionBadge(log.action || 'ACTION')}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px] truncate max-w-[160px]">
                        {log.target_email || log.target_user_id || log.target_request_id || 'System Record'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 truncate max-w-xs">
                        {log.reason || log.new_role || log.plan || log.changes || 'Verified compliance action'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
