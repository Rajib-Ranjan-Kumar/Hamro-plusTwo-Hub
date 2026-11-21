import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { auth, db } from '../firebase';
import { collection, getDocs, doc, updateDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { updatePassword, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { Settings as SettingsIcon, Save, LogOut, Key, Trash2, AlertTriangle, Activity, Calendar, Clock, CreditCard } from 'lucide-react';
import { LogoutModal } from '../components/LogoutModal';
import { motion } from 'motion/react';
import { format } from 'date-fns';

export const Settings = () => {
  const { user, login, logout, premiumOnlyMode } = useAuth();
  const [colleges, setColleges] = useState<any[]>([]);
  const [name, setName] = useState(user?.name || '');
  const [collegeId, setCollegeId] = useState(user?.college_id || '');
  const [stream, setStream] = useState(user?.stream || 'Science');
  const [year, setYear] = useState(user?.year || 'Class 11');
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
  // Status states
  const [profileStatus, setProfileStatus] = useState({ type: '', message: '' });
  const [passwordStatus, setPasswordStatus] = useState({ type: '', message: '' });
  const [deleteStatus, setDeleteStatus] = useState({ type: '', message: '' });
  
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'colleges'));
        const collegesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setColleges(collegesData);
      } catch (err) {
        console.error("Failed to fetch colleges", err);
      }
    };
    fetchColleges();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        name,
        college_id: collegeId,
        stream,
        year
      });
      
      const updatedDoc = await getDoc(userRef);
      if (updatedDoc.exists()) {
        login(localStorage.getItem('token') || '', { id: user.id, ...updatedDoc.data() } as any);
        setProfileStatus({ type: 'success', message: 'Profile updated successfully!' });
        setTimeout(() => setProfileStatus({ type: '', message: '' }), 3000);
      }
    } catch (err) {
      console.error(err);
      setProfileStatus({ type: 'error', message: 'Error updating profile.' });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    if (newPassword !== confirmNewPassword) {
      setPasswordStatus({ type: 'error', message: 'New passwords do not match.' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordStatus({ type: 'error', message: 'Password must be at least 6 characters.' });
      return;
    }

    try {
      // Re-authenticate first
      const credential = EmailAuthProvider.credential(auth.currentUser.email!, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      // Update password
      await updatePassword(auth.currentUser, newPassword);
      
      setPasswordStatus({ type: 'success', message: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => setPasswordStatus({ type: '', message: '' }), 3000);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential') {
        setPasswordStatus({ type: 'error', message: 'Incorrect current password.' });
      } else {
        setPasswordStatus({ type: 'error', message: 'Failed to update password. You may need to log in again.' });
      }
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !user) return;

    try {
      // Re-authenticate
      const credential = EmailAuthProvider.credential(auth.currentUser.email!, deletePassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      // Delete from Firestore
      await deleteDoc(doc(db, 'users', user.id));
      
      // Delete auth user
      await deleteUser(auth.currentUser);
      
      // Logout will handle cleanup and redirect
      logout();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential') {
        setDeleteStatus({ type: 'error', message: 'Incorrect password.' });
      } else {
        setDeleteStatus({ type: 'error', message: 'Failed to delete account. Please contact support.' });
      }
    }
  };

  const formatMemberSince = (createdVal: any) => {
    if (!createdVal) return 'Unknown';
    try {
      let date: Date;
      if (typeof createdVal === 'object' && createdVal?.seconds) {
        date = new Date(createdVal.seconds * 1000);
      } else if (typeof createdVal?.toDate === 'function') {
        date = createdVal.toDate();
      } else {
        date = new Date(createdVal);
      }
      if (isNaN(date.getTime())) return 'Unknown';
      return format(date, 'MMMM d, yyyy');
    } catch {
      return 'Unknown';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6 sm:space-y-8 pb-12"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900/90 via-slate-800/80 to-slate-900/90 border border-slate-700/60 shadow-xl backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
              <SettingsIcon className="w-3.5 h-3.5 text-amber-400" />
              User Preferences
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Account Settings</h1>
          <p className="text-xs sm:text-sm text-slate-400">Manage your student profile, academic affiliation, and security credentials.</p>
        </div>
      </div>

      {/* Profile Settings */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/85 border border-slate-700/60 shadow-lg backdrop-blur-md space-y-6">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
          <div className="p-2 rounded-xl bg-amber-500/10 text-[#F5C21B]">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Profile Information</h2>
            <p className="text-xs text-slate-400">Update your public student credentials</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-5">
          {profileStatus.message && (
            <div className={`p-3.5 rounded-xl text-xs sm:text-sm ${profileStatus.type === 'success' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'}`}>
              {profileStatus.message}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Full Name</label>
              <input 
                type="text"
                className="w-full px-4 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 text-white outline-none text-sm transition-all"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Email Address</label>
              <input 
                type="email"
                className="w-full px-4 py-2.5 bg-slate-950/40 border border-slate-800 rounded-xl text-slate-400 cursor-not-allowed text-sm"
                value={user?.email || ''}
                disabled
              />
              <p className="text-[11px] text-slate-500 mt-1">Email is tied to your primary Google account.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">College</label>
              <select 
                className="w-full px-4 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 text-white outline-none text-sm transition-all cursor-pointer"
                value={collegeId}
                onChange={(e) => setCollegeId(e.target.value)}
              >
                <option value="">Select College</option>
                {colleges.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Stream</label>
              <select 
                className="w-full px-4 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 text-white outline-none text-sm transition-all cursor-pointer"
                value={stream}
                onChange={(e) => setStream(e.target.value)}
              >
                <option value="Science">Science</option>
                <option value="Management">Management</option>
                <option value="Humanities">Humanities</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Class</label>
              <select 
                className="w-full px-4 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 text-white outline-none text-sm transition-all cursor-pointer"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              >
                <option value="Class 11">Class 11</option>
                <option value="Class 12">Class 12</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button 
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer flex items-center justify-center gap-2 text-sm"
            >
              <Save className="w-4 h-4" /> Save Profile
            </button>
          </div>
        </form>
      </div>

      {/* User Activity & Subscription */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/85 border border-slate-700/60 shadow-lg backdrop-blur-md space-y-6">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Account Activity & Status</h2>
            <p className="text-xs text-slate-400">Enrollment history and membership tier</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
          <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2.5 mb-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Member Since</span>
            </div>
            <p className="text-base sm:text-lg font-bold text-white">
              {formatMemberSince(user?.created_at)}
            </p>
          </div>

          <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2.5 mb-2">
              <CreditCard className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Subscription Status</span>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-base sm:text-lg font-bold text-white">
                {!premiumOnlyMode ? 'Open Access (Bypass)' : user?.is_premium ? 'Premium Plan' : 'Free Plan'}
              </p>
              {!premiumOnlyMode ? (
                <span className="px-2 py-0.5 text-[11px] font-bold bg-emerald-500/15 text-emerald-400 rounded-full border border-emerald-500/30">
                  All Materials Free
                </span>
              ) : user?.is_premium ? (
                <span className="px-2 py-0.5 text-[11px] font-bold bg-amber-500/15 text-amber-400 rounded-full border border-amber-500/30">
                  Active
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/85 border border-slate-700/60 shadow-lg backdrop-blur-md space-y-6">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
          <div className="p-2 rounded-xl bg-amber-500/10 text-[#F5C21B]">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Security & Password</h2>
            <p className="text-xs text-slate-400">Manage account access and credentials</p>
          </div>
        </div>
        
        {auth.currentUser?.providerData.some(p => p.providerId === 'password') ? (
          <form onSubmit={handleChangePassword} className="space-y-5 max-w-md">
            {passwordStatus.message && (
              <div className={`p-3.5 rounded-xl text-xs sm:text-sm ${passwordStatus.type === 'success' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'}`}>
                {passwordStatus.message}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Current Password</label>
              <input 
                type="password"
                className="w-full px-4 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 text-white outline-none text-sm transition-all"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">New Password</label>
              <input 
                type="password"
                className="w-full px-4 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 text-white outline-none text-sm transition-all"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Confirm New Password</label>
              <input 
                type="password"
                className="w-full px-4 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 text-white outline-none text-sm transition-all"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <button 
              type="submit"
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer text-sm"
            >
              Update Password
            </button>
          </form>
        ) : (
          <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800 text-slate-400 text-xs sm:text-sm">
            You are securely authenticated via Google Single Sign-On (SSO). Password changes are managed directly in your Google Security settings.
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/85 border border-rose-500/30 shadow-lg backdrop-blur-md space-y-6">
        <h2 className="text-base font-bold text-rose-400 pb-3 border-b border-rose-500/20">Danger Zone</h2>
        
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-950/70 rounded-2xl border border-slate-800">
            <div>
              <h3 className="font-semibold text-white text-sm">Sign Out</h3>
              <p className="text-xs text-slate-400 mt-0.5">Sign out of your account on this browser.</p>
            </div>
            <button
              onClick={() => setIsLogoutModalOpen(true)}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2 whitespace-nowrap text-xs sm:text-sm cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-rose-500/5 rounded-2xl border border-rose-500/20">
            <div>
              <h3 className="font-semibold text-rose-400 text-sm">Delete Account</h3>
              <p className="text-xs text-rose-300/70 mt-0.5">Permanently delete your account, contributions, and earned balance.</p>
            </div>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap text-xs sm:text-sm shadow-sm hover:shadow-md cursor-pointer"
            >
              <Trash2 className="w-4 h-4" /> Delete Account
            </button>
          </div>
        </div>
      </div>

      <LogoutModal 
        isOpen={isLogoutModalOpen} 
        onClose={() => setIsLogoutModalOpen(false)} 
        onConfirm={() => {
          setIsLogoutModalOpen(false);
          logout();
        }} 
      />

      {/* Delete Account Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900/95 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-700/80 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 mb-4 text-rose-400">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-white">Delete Account</h3>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              Are you sure you want to delete your account? This action cannot be undone. All your data, contributions, and points will be permanently lost.
            </p>

            {deleteStatus.message && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-500/15 text-rose-400 text-xs sm:text-sm border border-rose-500/30">
                {deleteStatus.message}
              </div>
            )}

            {auth.currentUser?.providerData.some(p => p.providerId === 'password') && (
              <form id="delete-form" onSubmit={handleDeleteAccount} className="mb-6">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Confirm Password to Delete
                </label>
                <input 
                  type="password"
                  className="w-full px-4 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl focus:border-rose-500 focus:ring-1 focus:ring-rose-500/50 text-white outline-none text-sm transition-all"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                />
              </form>
            )}

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeletePassword('');
                  setDeleteStatus({ type: '', message: '' });
                }}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors font-semibold text-sm border border-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              {auth.currentUser?.providerData.some(p => p.providerId === 'password') ? (
                <button 
                  form="delete-form"
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-all font-bold text-sm shadow-sm hover:shadow-md cursor-pointer"
                >
                  Delete Permanently
                </button>
              ) : (
                <button 
                  onClick={handleDeleteAccount}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-all font-bold text-sm shadow-sm hover:shadow-md cursor-pointer"
                >
                  Delete Permanently
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
