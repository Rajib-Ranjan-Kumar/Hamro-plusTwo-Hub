import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Shield, 
  Trash2, 
  User as UserIcon, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Eye, 
  Ban, 
  UserCheck, 
  ArrowUpDown,
  GraduationCap,
  Mail,
  Award,
  Wallet,
  Calendar,
  X
} from 'lucide-react';
import { ConfirmModal } from '../ConfirmModal';
import { db } from '../../firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  addDoc 
} from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';

export const StudentManagement = () => {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [colleges, setColleges] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [streamFilter, setStreamFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [collegeFilter, setCollegeFilter] = useState('all');

  // Sorting
  const [sortField, setSortField] = useState<'name' | 'created_at' | 'points'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals & Drawers
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any | null>(null);

  useEffect(() => {
    // 1. Fetch Users
    const qUsers = query(collection(db, 'users'));
    const unsubUsers = onSnapshot(qUsers, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsers(list);
      setIsLoading(false);
    }, (err) => {
      console.error("Error loading users:", err);
      setIsLoading(false);
    });

    // 2. Fetch Colleges for filter
    const qColleges = query(collection(db, 'colleges'));
    const unsubColleges = onSnapshot(qColleges, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setColleges(list);
    }, err => console.error("Error loading colleges:", err));

    return () => {
      unsubUsers();
      unsubColleges();
    };
  }, []);

  // Filter logic
  const filteredUsers = users.filter(user => {
    const nameMatch = (user.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const emailMatch = (user.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSearch = nameMatch || emailMatch;

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStream = streamFilter === 'all' || (user.stream || '').toLowerCase() === streamFilter.toLowerCase();
    const matchesClass = classFilter === 'all' || (user.year || '').toLowerCase().includes(classFilter.toLowerCase());
    
    const userStatus = user.account_status || (user.is_suspended ? 'suspended' : 'active');
    const matchesStatus = statusFilter === 'all' || userStatus === statusFilter;
    const matchesCollege = collegeFilter === 'all' || user.college_id === collegeFilter;

    return matchesSearch && matchesRole && matchesStream && matchesClass && matchesStatus && matchesCollege;
  });

  // Sort logic
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (sortField === 'name') {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    }
    if (sortField === 'points') {
      const ptsA = a.points || 0;
      const ptsB = b.points || 0;
      return sortOrder === 'asc' ? ptsA - ptsB : ptsB - ptsA;
    }
    // Date
    const timeA = a.created_at?.toMillis ? a.created_at.toMillis() : (a.created_at ? new Date(a.created_at).getTime() : 0);
    const timeB = b.created_at?.toMillis ? b.created_at.toMillis() : (b.created_at ? new Date(b.created_at).getTime() : 0);
    return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
  });

  // Pagination
  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage) || 1;
  const paginatedUsers = sortedUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleSort = (field: 'name' | 'created_at' | 'points') => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Actions
  const handleToggleSuspend = async (student: any) => {
    const currentStatus = student.account_status || (student.is_suspended ? 'suspended' : 'active');
    const nextStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    try {
      await updateDoc(doc(db, 'users', student.id), {
        account_status: nextStatus,
        is_suspended: nextStatus === 'suspended'
      });
      // Audit log
      await addDoc(collection(db, 'audit_logs'), {
        action: nextStatus === 'suspended' ? 'USER_SUSPENDED' : 'USER_REACTIVATED',
        admin_id: currentAdmin?.id || 'admin',
        admin_name: currentAdmin?.name || currentAdmin?.email || 'Admin',
        target_user_id: student.id,
        target_email: student.email,
        created_at: new Date().toISOString()
      }).catch(() => null);
    } catch (err) {
      console.error("Error updating account status:", err);
      alert("Failed to update student status.");
    }
  };

  const handleToggleRole = async (student: any) => {
    const nextRole = student.role === 'admin' ? 'student' : 'admin';
    try {
      await updateDoc(doc(db, 'users', student.id), { role: nextRole });
      await addDoc(collection(db, 'audit_logs'), {
        action: 'USER_ROLE_CHANGED',
        admin_id: currentAdmin?.id || 'admin',
        admin_name: currentAdmin?.name || currentAdmin?.email || 'Admin',
        target_user_id: student.id,
        new_role: nextRole,
        created_at: new Date().toISOString()
      }).catch(() => null);
    } catch (err) {
      console.error("Error updating user role:", err);
      alert("Failed to update role.");
    }
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await deleteDoc(doc(db, 'users', userToDelete.id));
      await addDoc(collection(db, 'audit_logs'), {
        action: 'USER_DELETED',
        admin_id: currentAdmin?.id || 'admin',
        admin_name: currentAdmin?.name || currentAdmin?.email || 'Admin',
        target_user_id: userToDelete.id,
        target_email: userToDelete.email,
        created_at: new Date().toISOString()
      }).catch(() => null);
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    } catch (err) {
      console.error("Error deleting user:", err);
      alert("Failed to delete user record.");
    }
  };

  const collegeMap = colleges.reduce((acc, c) => {
    acc[c.id] = c.name;
    return acc;
  }, {} as Record<string, string>);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <Loader2 className="w-8 h-8 text-[#F4B400] animate-spin" />
        <p className="text-xs text-slate-400">Loading student directory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Search & Filters Header */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#111827] border border-white/10 space-y-3.5 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#080A0E] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#F4B400]/50"
            />
          </div>
          <span className="text-xs font-semibold text-slate-400 self-center">
            {filteredUsers.length} of {users.length} Students
          </span>
        </div>

        {/* Filter Chips Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-xs">
          <select
            value={classFilter}
            onChange={(e) => { setClassFilter(e.target.value); setCurrentPage(1); }}
            className="bg-[#080A0E] border border-white/10 rounded-xl px-2.5 py-1.5 text-slate-300 focus:outline-none"
          >
            <option value="all">All Classes</option>
            <option value="11">Class 11</option>
            <option value="12">Class 12</option>
          </select>

          <select
            value={streamFilter}
            onChange={(e) => { setStreamFilter(e.target.value); setCurrentPage(1); }}
            className="bg-[#080A0E] border border-white/10 rounded-xl px-2.5 py-1.5 text-slate-300 focus:outline-none"
          >
            <option value="all">All Streams</option>
            <option value="science">Science</option>
            <option value="management">Management</option>
            <option value="humanities">Humanities</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="bg-[#080A0E] border border-white/10 rounded-xl px-2.5 py-1.5 text-slate-300 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
            className="bg-[#080A0E] border border-white/10 rounded-xl px-2.5 py-1.5 text-slate-300 focus:outline-none"
          >
            <option value="all">All Roles</option>
            <option value="student">Student</option>
            <option value="admin">Admin</option>
          </select>

          <select
            value={collegeFilter}
            onChange={(e) => { setCollegeFilter(e.target.value); setCurrentPage(1); }}
            className="bg-[#080A0E] border border-white/10 rounded-xl px-2.5 py-1.5 text-slate-300 focus:outline-none col-span-2 sm:col-span-1"
          >
            <option value="all">All Colleges</option>
            {colleges.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Modern SaaS Table */}
      <div className="rounded-2xl bg-[#111827] border border-white/10 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-[#0F172A]/80 text-slate-400 font-semibold select-none">
                <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => toggleSort('name')}>
                  <div className="flex items-center gap-1.5">
                    <span>Student</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Academic Details</th>
                <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => toggleSort('points')}>
                  <div className="flex items-center gap-1.5">
                    <span>Points / Wallet</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Status & Role</th>
                <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => toggleSort('created_at')}>
                  <div className="flex items-center gap-1.5">
                    <span>Joined Date</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 font-medium">
                    No student records match the active filters.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((student) => {
                  const status = student.account_status || (student.is_suspended ? 'suspended' : 'active');
                  const collegeName = collegeMap[student.college_id] || student.college || 'Unassigned';
                  const dateStr = student.created_at?.toDate 
                    ? student.created_at.toDate().toLocaleDateString() 
                    : (student.created_at ? new Date(student.created_at).toLocaleDateString() : 'N/A');

                  return (
                    <tr key={student.id} className="hover:bg-white/[0.02] transition-colors group">
                      {/* Student Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0 border border-white/10">
                            {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-white truncate max-w-[150px] sm:max-w-[180px]">
                              {student.name || 'Anonymous Student'}
                            </span>
                            <span className="text-[11px] text-slate-400 truncate max-w-[150px] sm:max-w-[180px]">
                              {student.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Academic */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-200 truncate max-w-[140px]">{collegeName}</span>
                          <span className="text-[11px] text-slate-400">
                            {student.year || 'Class 11'} &bull; {student.stream || 'Science'}
                          </span>
                        </div>
                      </td>

                      {/* Points / Wallet */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#F5C21B]">{student.points || 0} pts</span>
                          <span className="text-[11px] text-emerald-400 font-medium">
                            NPR {student.wallet_balance || 0}
                          </span>
                        </div>
                      </td>

                      {/* Status & Role */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            status === 'active' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {status}
                          </span>
                          {student.role === 'admin' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                              Admin
                            </span>
                          )}
                          {student.is_premium && (
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-[#F5C21B]">
                              PRO
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-400">
                        {dateStr}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedStudent(student)}
                            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
                            title="View Student Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleSuspend(student)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              status === 'active' 
                                ? 'text-slate-400 hover:text-amber-400 hover:bg-amber-500/10' 
                                : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10'
                            }`}
                            title={status === 'active' ? 'Suspend Account' : 'Reactivate Account'}
                          >
                            {status === 'active' ? <Ban className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => {
                              setUserToDelete(student);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10"
                            title="Delete Student"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <span>
            Showing {filteredUsers.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} entries
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed text-white"
            >
              Previous
            </button>
            <span className="px-2 font-medium">Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed text-white"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Student Profile Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#111827] border border-white/10 rounded-2xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setSelectedStudent(null)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 border-b border-white/10 pb-5 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-black font-black text-xl flex items-center justify-center">
                {selectedStudent.name ? selectedStudent.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-white truncate">{selectedStudent.name || 'Anonymous Student'}</h3>
                <p className="text-xs text-slate-400 truncate">{selectedStudent.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    (selectedStudent.account_status || 'active') === 'active' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {selectedStudent.account_status || 'active'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/5 text-slate-300 border border-white/10 uppercase">
                    {selectedStudent.role || 'student'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5 text-xs">
              <div className="p-3 rounded-xl bg-[#080A0E] border border-white/5">
                <span className="text-slate-400 block text-[11px]">Enrolled College</span>
                <span className="font-semibold text-white mt-1 block truncate">
                  {collegeMap[selectedStudent.college_id] || selectedStudent.college || 'Unassigned'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#080A0E] border border-white/5">
                <span className="text-slate-400 block text-[11px]">Academic Track</span>
                <span className="font-semibold text-white mt-1 block">
                  {selectedStudent.year || 'Class 11'} ({selectedStudent.stream || 'Science'})
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#080A0E] border border-white/5">
                <span className="text-slate-400 block text-[11px]">Reputation Points</span>
                <span className="font-bold text-[#F5C21B] mt-1 block">
                  {selectedStudent.points || 0} Points
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#080A0E] border border-white/5">
                <span className="text-slate-400 block text-[11px]">Wallet Available</span>
                <span className="font-bold text-emerald-400 mt-1 block">
                  NPR {selectedStudent.wallet_balance || 0}
                </span>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-white/10">
              <button
                onClick={() => {
                  handleToggleRole(selectedStudent);
                  setSelectedStudent(null);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-purple-500/30 text-purple-400 hover:bg-purple-500/10 transition-colors"
              >
                {selectedStudent.role === 'admin' ? 'Revoke Admin' : 'Make Administrator'}
              </button>
              <button
                onClick={() => {
                  handleToggleSuspend(selectedStudent);
                  setSelectedStudent(null);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-colors"
              >
                {(selectedStudent.account_status || 'active') === 'active' ? 'Suspend' : 'Reactivate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Student Record"
        message={`Are you sure you want to permanently delete the profile for ${userToDelete?.name || userToDelete?.email}? This action cannot be undone.`}
        confirmText="Delete Student"
        isDanger={true}
        onConfirm={confirmDelete}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setUserToDelete(null);
        }}
      />
    </div>
  );
};
