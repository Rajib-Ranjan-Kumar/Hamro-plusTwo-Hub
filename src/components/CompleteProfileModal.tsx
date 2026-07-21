import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';

export const CompleteProfileModal = () => {
  const { user, login } = useAuth();
  const [colleges, setColleges] = useState<any[]>([]);
  const [collegeId, setCollegeId] = useState('');
  const [stream, setStream] = useState('');
  const [year, setYear] = useState('');
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!collegeId || !stream || !year) {
      setStatus('Please select college, stream, and year.');
      return;
    }

    setIsSubmitting(true);
    setStatus('');
    
    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        college_id: collegeId,
        stream,
        year
      });
      
      const updatedDoc = await getDoc(userRef);
      if (updatedDoc.exists()) {
        login(localStorage.getItem('token') || '', { id: user.id, ...updatedDoc.data() } as any);
      }
    } catch (err) {
      console.error(err);
      setStatus('Error updating profile.');
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Complete Your Profile</h2>
          <p className="text-sm text-slate-400 mt-1">Please select your college, stream, and year to continue.</p>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleSave} className="space-y-5">
            {status && (
              <div className="p-3 rounded-lg text-sm bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                {status}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">College</label>
              <select 
                required
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white"
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
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Stream</label>
              <select 
                required
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white"
                value={stream}
                onChange={(e) => setStream(e.target.value)}
              >
                <option value="">Select Stream</option>
                <option value="Science">Science</option>
                <option value="Management">Management</option>
                <option value="Humanities">Humanities</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Class</label>
              <select 
                required
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              >
                <option value="">Select Class</option>
                <option value="Class 11">Class 11</option>
                <option value="Class 12">Class 12</option>
              </select>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 mt-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-xl transition-colors flex items-center justify-center"
            >
              {isSubmitting ? 'Saving...' : 'Save & Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
};
