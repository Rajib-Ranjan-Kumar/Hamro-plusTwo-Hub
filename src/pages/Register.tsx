import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, googleProvider, db } from '../firebase';
import { signInWithPopup, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Loader2, Mail, Lock, AlertCircle, CheckCircle2, User, ShieldCheck } from 'lucide-react';
import { getFirebaseErrorMessage } from '../utils/firebaseErrors';
import { useAuth } from '../context/AuthContext';
import { useRateLimit } from '../hooks/useRateLimit';
import { motion } from 'motion/react';

export const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // CAPTCHA state
  const [captchaNum1, setCaptchaNum1] = useState(0);
  const [captchaNum2, setCaptchaNum2] = useState(0);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaError, setCaptchaError] = useState('');

  const { isLocked, recordAttempt, resetAttempts, remainingAttempts, lockoutEndTime } = useRateLimit({
    key: 'register',
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

  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (!pass) return { score: 0, label: '', color: 'bg-slate-700' };
    if (pass.length > 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score === 0) return { score, label: 'Very Weak', color: 'bg-rose-500' };
    if (score === 1) return { score, label: 'Weak', color: 'bg-orange-500' };
    if (score === 2) return { score, label: 'Fair', color: 'bg-amber-500' };
    if (score === 3) return { score, label: 'Good', color: 'bg-emerald-400' };
    return { score, label: 'Strong', color: 'bg-emerald-600' };
  };

  const strength = getPasswordStrength(password);

  const handleEmailRegister = async (e: React.FormEvent) => {
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

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (strength.score < 2) {
      setError('Please choose a stronger password.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setMessage('');
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Send verification email
      await sendEmailVerification(result.user);
      
      // Create user document
      await setDoc(doc(db, 'users', result.user.uid), {
        name: name,
        email: result.user.email,
        role: 'user',
        points: 0,
        is_premium: false,
        created_at: new Date().toISOString(),
        session_id: Date.now().toString() + Math.random().toString(36).substring(2)
      });

      setMessage('Registration successful! Please check your email to verify your account.');
      auth.signOut(); // Sign out until verified
      resetAttempts();
      
      setTimeout(() => {
        navigate('/login');
      }, 5000);
    } catch (err: any) {
      setError(getFirebaseErrorMessage(err));
      setIsSubmitting(false);
      generateCaptcha(); // Regenerate on error
      recordAttempt();
    }
  };

  const handleGoogleRegister = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // AuthContext will handle creating the user document if it doesn't exist
      navigate('/');
    } catch (err: any) {
      console.error("Google register failed:", err);
      setError(getFirebaseErrorMessage(err));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 bg-[#0F1115] text-white font-sans selection:bg-[#F4B400]/30 overflow-hidden">
      {/* Full-screen Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0" 
        style={{ backgroundImage: "url('/hero-bg.jpg')" }}
      />
      {/* Dark blur overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xl z-0 pointer-events-none" />

      {/* Top right Brand Badge */}
      <div className="absolute top-8 right-8 z-10 flex items-center gap-2">
        <div className="bg-[#F4B400] text-black text-xs font-black px-2.5 py-1 rounded">
          +2
        </div>
        <span className="text-lg font-bold tracking-tight text-white">Hamro +2</span>
      </div>

      {/* Centered Glass Register Form Card */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 max-w-md w-full bg-slate-800/90 border border-slate-700/80 backdrop-blur-md rounded-3xl p-8 sm:p-10 shadow-2xl flex flex-col justify-center"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Create an Account</h2>
          <p className="text-slate-400 text-sm">Join thousands of +2 students in Nepal.</p>
        </div>

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
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm">{message}</p>
          </div>
        )}

        <button
          onClick={handleGoogleRegister}
          disabled={isSubmitting || isLocked}
          className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-full transition-all border border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover-lift"
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
              <span>Sign up with Google</span>
            </>
          )}
        </button>

        <p className="mt-8 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-[#F4B400] hover:text-[#FFC107] font-bold transition-colors">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
};
