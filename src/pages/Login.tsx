import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, googleProvider, db } from '../firebase';
import { signInWithPopup, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { Loader2, Mail, Lock, AlertCircle, ShieldCheck } from 'lucide-react';
import { getFirebaseErrorMessage } from '../utils/firebaseErrors';
import { useAuth } from '../context/AuthContext';
import { useRateLimit } from '../hooks/useRateLimit';
import { motion } from 'motion/react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // CAPTCHA state
  const [captchaNum1, setCaptchaNum1] = useState(0);
  const [captchaNum2, setCaptchaNum2] = useState(0);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaError, setCaptchaError] = useState('');

  const { isLocked, recordAttempt, resetAttempts, remainingAttempts, lockoutEndTime } = useRateLimit({
    key: 'login',
    maxAttempts: 5,
    timeWindowMs: 15 * 60 * 1000, // 15 minutes
  });

  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    generateCaptcha();
  }, []);

  const generateCaptcha = () => {
    setCaptchaNum1(Math.floor(Math.random() * 10) + 1);
    setCaptchaNum2(Math.floor(Math.random() * 10) + 1);
    setCaptchaAnswer('');
  };

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Wait for the AuthContext to finish loading the user profile before navigating
  useEffect(() => {
    if (user && !isSubmitting) {
      navigate('/');
    }
  }, [user, isSubmitting, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const handleSessionUpdate = async (firebaseUser: any) => {
    const newSessionId = Date.now().toString() + Math.random().toString(36).substring(2);
    localStorage.setItem(`session_${firebaseUser.uid}`, newSessionId);
    
    const userRef = doc(db, 'users', firebaseUser.uid);
    await updateDoc(userRef, { session_id: newSessionId }).catch(() => {
      // If doc doesn't exist, AuthContext will handle creation
    });
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLocked) {
      const remainingMinutes = Math.ceil((lockoutEndTime! - Date.now()) / 60000);
      setError(`Too many failed attempts. Please try again in ${remainingMinutes} minutes.`);
      return;
    }

    // Verify CAPTCHA
    if (parseInt(captchaAnswer) !== (captchaNum1 + captchaNum2)) {
      setCaptchaError('Incorrect CAPTCHA answer. Please try again.');
      generateCaptcha();
      recordAttempt();
      return;
    }
    setCaptchaError('');

    setIsSubmitting(true);
    setError('');
    setMessage('');
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      if (!result.user.emailVerified) {
        setError('Please verify your email before logging in.');
        auth.signOut();
        setIsSubmitting(false);
        return;
      }
      await handleSessionUpdate(result.user);
      resetAttempts();
      navigate('/');
    } catch (err: any) {
      console.error("Email login failed:", err);
      setError(getFirebaseErrorMessage(err));
      setIsSubmitting(false);
      generateCaptcha(); // Regenerate on error
      recordAttempt();
    }
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setError('');
    setMessage('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await handleSessionUpdate(result.user);
      navigate('/');
    } catch (err: any) {
      console.error("Google login failed:", err);
      setError(getFirebaseErrorMessage(err));
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address to reset your password.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    setMessage('');
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset email sent. Please check your inbox.');
    } catch (err: any) {
      setError(getFirebaseErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0F1115] text-white font-sans selection:bg-[#F4B400]/30">
      {/* Left Side - Image */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="hidden lg:flex lg:w-1/2 relative"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-10"></div>
        <img 
          src="/hero-bg.jpg" 
          alt="Sunset Mountains" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="relative z-20 flex flex-col justify-end p-12 h-full">
          <h1 className="text-4xl font-extrabold text-white mb-4 drop-shadow-md">Hamro +2 Hub</h1>
          <p className="text-lg text-white/90 max-w-md drop-shadow-sm">
            Your complete academic companion for +2 studies in Nepal. Access notes, syllabus, and verified solutions.
          </p>
        </div>
      </motion.div>

      {/* Right Side - Login Form */}
      <motion.div 
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        className="w-full lg:w-1/2 flex flex-col p-8 sm:p-12 lg:p-24 justify-center relative bg-[#0d0d0f]"
      >
        <div className="absolute top-8 right-8 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-[#F4B400] text-black text-xs font-black px-2.5 py-1 rounded">
              +2
            </div>
            <span className="text-lg font-bold tracking-tight text-white">Hamro +2</span>
          </div>
        </div>

        <div className="max-w-md w-full mx-auto">
          <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Welcome Back</h2>
          <p className="text-slate-400 mb-8 text-sm">Sign in to access your study materials.</p>

          {isLocked && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 text-rose-400 animate-in fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm">Too many failed attempts. Please try again later.</p>
            </div>
          )}

          {error && !isLocked && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 text-rose-400 animate-in fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {message && (
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3 text-emerald-400 animate-in fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm">{message}</p>
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={isSubmitting || isLocked}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-full transition-all border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover-lift"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span>Sign in with Google</span>
              </>
            )}
          </button>

          <p className="mt-8 text-center text-sm text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#F4B400] hover:text-[#FFC107] font-bold transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
