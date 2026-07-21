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
  const { user, login, logout } = useAuth();
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
      className="max-w-3xl mx-auto space-y-8 pb-12"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl">
          <SettingsIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h1 className="text-3xl font-bold text-white">Account Settings</h1>
      </div>

      {/* Profile Settings */}
      <div className="bg-slate-800 rounded-2xl p-6 md:p-8 border border-slate-700 shadow-sm">
        <h2 className="text-xl font-semibold text-white mb-6">Profile Information</h2>
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {profileStatus.message && (
            <div className={`p-4 rounded-xl text-sm ${profileStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800'}`}>
              {profileStatus.message}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
              <input 
                type="text"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white transition-colors"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
              <input 
                type="email"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-400 cursor-not-allowed"
                value={user?.email || ''}
                disabled
              />
              <p className="text-xs text-slate-500 mt-1">Email cannot be changed.</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">College</label>
              <select 
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white transition-colors"
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
              <label className="block text-sm font-medium text-slate-300 mb-2">Stream</label>
              <select 
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white transition-colors"
                value={stream}
                onChange={(e) => setStream(e.target.value)}
              >
                <option value="Science">Science</option>
                <option value="Management">Management</option>
                <option value="Humanities">Humanities</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Class</label>
              <select 
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white transition-colors"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              >
                <option value="Class 11">Class 11</option>
                <option value="Class 12">Class 12</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button 
              type="submit"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-full transition-colors flex items-center gap-2 shadow-sm shadow-indigo-600/20"
            >
              <Save className="w-5 h-5" /> Save Profile
            </button>
          </div>
        </form>
      </div>

      {/* User Activity & Subscription */}
      <div className="bg-slate-800 rounded-2xl p-6 md:p-8 border border-slate-700 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
            <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">Account Activity & Status</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-300">Member Since</span>
            </div>
            <p className="text-lg font-semibold text-white">
              {formatMemberSince(user?.created_at)}
            </p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-2">
              <CreditCard className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-300">Subscription Status</span>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold text-white">
                {user?.is_premium ? 'Premium Plan' : 'Free Plan'}
              </p>
              {user?.is_premium && (
                <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full border border-amber-200 dark:border-amber-800">
                  Active
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-slate-800 rounded-2xl p-6 md:p-8 border border-slate-700 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
            <Key className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">Change Password</h2>
        </div>
        
        {auth.currentUser?.providerData.some(p => p.providerId === 'password') ? (
          <form onSubmit={handleChangePassword} className="space-y-6 max-w-md">
            {passwordStatus.message && (
              <div className={`p-4 rounded-xl text-sm ${passwordStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800'}`}>
                {passwordStatus.message}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Current Password</label>
              <input 
                type="password"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white transition-colors"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
              <input 
                type="password"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white transition-colors"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Confirm New Password</label>
              <input 
                type="password"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white transition-colors"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <button 
              type="submit"
              className="px-6 py-3 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white font-medium rounded-full transition-colors"
            >
              Update Password
            </button>
          </form>
        ) : (
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl text-slate-400 text-sm">
            You are signed in with Google. Password changes are managed through your Google account.
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="bg-slate-800 rounded-2xl p-6 md:p-8 border border-rose-200 dark:border-rose-900/50 shadow-sm">
        <h2 className="text-xl font-semibold text-rose-600 dark:text-rose-400 mb-6">Danger Zone</h2>
        
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-rose-50 dark:bg-rose-900/10 rounded-xl border border-rose-100 dark:border-rose-900/30">
            <div>
              <h3 className="font-medium text-white">Logout</h3>
              <p className="text-sm text-slate-400">Sign out of your account on this device.</p>
            </div>
            <button
              onClick={() => setIsLogoutModalOpen(true)}
              className="px-6 py-2.5 bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-300 font-medium rounded-full border border-slate-700 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-rose-50 dark:bg-rose-900/10 rounded-xl border border-rose-100 dark:border-rose-900/30">
            <div>
              <h3 className="font-medium text-rose-700 dark:text-rose-400">Delete Account</h3>
              <p className="text-sm text-rose-600/80 dark:text-rose-400/80">Permanently delete your account and all data.</p>
            </div>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-full transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-xl border border-slate-700"
          >
            <div className="flex items-center gap-3 mb-4 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-xl font-bold">Delete Account</h3>
            </div>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Are you sure you want to delete your account? This action cannot be undone. All your data, contributions, and points will be permanently lost.
            </p>

            {deleteStatus.message && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 text-sm border border-rose-200 dark:border-rose-800">
                {deleteStatus.message}
              </div>
            )}

            {auth.currentUser?.providerData.some(p => p.providerId === 'password') && (
              <form id="delete-form" onSubmit={handleDeleteAccount} className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Confirm Password to Delete
                </label>
                <input 
                  type="password"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500 dark:text-white transition-colors"
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
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-700 rounded-full transition-colors font-medium"
              >
                Cancel
              </button>
              {auth.currentUser?.providerData.some(p => p.providerId === 'password') ? (
                <button 
                  form="delete-form"
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition-colors font-medium"
                >
                  Delete Permanently
                </button>
              ) : (
                <button 
                  onClick={handleDeleteAccount}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition-colors font-medium"
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
