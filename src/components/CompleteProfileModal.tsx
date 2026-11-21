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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900/95 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-700/80 backdrop-blur-xl">
        <div className="p-6 sm:p-8 border-b border-slate-700/60">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Complete Your Profile</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">Please select your college, stream, and class to tailor your academic experience.</p>
        </div>
        
        <div className="p-6 sm:p-8">
          <form onSubmit={handleSave} className="space-y-5">
            {status && (
              <div className="p-3.5 rounded-xl text-xs sm:text-sm bg-rose-500/10 text-rose-400 border border-rose-500/20">
                {status}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">College</label>
              <select 
                required
                className="w-full px-4 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 text-white outline-none transition-all cursor-pointer text-sm"
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
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Stream</label>
              <select 
                required
                className="w-full px-4 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 text-white outline-none transition-all cursor-pointer text-sm"
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
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Class</label>
              <select 
                required
                className="w-full px-4 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 text-white outline-none transition-all cursor-pointer text-sm"
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
              className="w-full py-3 mt-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer flex items-center justify-center text-sm"
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
