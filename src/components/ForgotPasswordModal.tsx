import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { auth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Mail, X } from 'lucide-react';
import { getFirebaseErrorMessage } from '../utils/firebaseErrors';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
}

export const ForgotPasswordModal = ({ isOpen, onClose, defaultEmail = '' }: ForgotPasswordModalProps) => {
  const [email, setEmail] = useState(defaultEmail);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setStatus('error');
      setMessage('Please enter your email address.');
      return;
    }

    setStatus('loading');
    try {
      await sendPasswordResetEmail(auth, email);
      setStatus('success');
      setMessage('Password reset link has been sent to your email.');
    } catch (error: any) {
      setStatus('error');
      setMessage(getFirebaseErrorMessage(error));
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:bg-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <Mail className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Reset Password</h2>
          <p className="text-sm text-slate-400 mb-6">
            Enter your email address and we'll send you a link to reset your password.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {status === 'error' && (
              <div className="p-3 text-sm rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-left">
                {message}
              </div>
            )}
            
            {status === 'success' && (
              <div className="p-3 text-sm rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-left">
                {message}
              </div>
            )}

            {status !== 'success' && (
              <>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white text-sm"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                
                <button 
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-xl transition-colors"
                >
                  {status === 'loading' ? 'Sending...' : 'Send Reset Link'}
                </button>
              </>
            )}

            {status === 'success' && (
              <button 
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-300 font-medium rounded-xl transition-colors"
              >
                Close
              </button>
            )}
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
};
