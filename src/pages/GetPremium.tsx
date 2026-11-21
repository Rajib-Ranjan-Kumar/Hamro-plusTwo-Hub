import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, limit, where } from 'firebase/firestore';
import { Crown, Upload, CheckCircle, AlertCircle, Loader2, CreditCard, ExternalLink, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import { uploadFile, handleFirestoreError, OperationType } from '../services/db';
import { getFriendlyErrorMessage } from '../utils/friendlyErrors';
import { motion } from 'motion/react';

export const GetPremium = () => {
  const { user, premiumOnlyMode } = useAuth();
  const navigate = useNavigate();
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [planSelected, setPlanSelected] = useState('Premium');
  const [paymentMethod, setPaymentMethod] = useState('eSewa');
  const [amountPaid, setAmountPaid] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch payment info
        const qPayment = query(collection(db, 'payment_info'), limit(1));
        const paymentSnapshot = await getDocs(qPayment);
        if (!paymentSnapshot.empty) {
          setPaymentInfo(paymentSnapshot.docs[0].data());
        }

        // Check for pending requests
        if (user?.id) {
          const qPending = query(
            collection(db, 'subscription_requests'),
            where('user_id', '==', user.id),
            where('status', '==', 'pending'),
            limit(1)
          );
          const pendingSnapshot = await getDocs(qPending);
          if (!pendingSnapshot.empty) {
            setHasPendingRequest(true);
          }
        }
      } catch (err) {
        console.error("Error fetching initial data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, [user?.id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleStripePayment = async () => {
    // Placeholder for Stripe Checkout integration
    // In a real app, this would call a backend endpoint to create a Stripe Checkout session
    // and then redirect the user to the Stripe hosted checkout page.
    alert('Stripe integration is currently in development. Please use manual payment for now.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !file) return;

    setIsSubmitting(true);
    setStatus(null);

    try {
      // Use real storage upload instead of base64 to avoid Firestore document size limits
      const transactionImageUrl = await uploadFile(file, `subscriptions/${user.id}`);

      await addDoc(collection(db, 'subscription_requests'), {
        user_id: user.id,
        user_name: user.name || user.email?.split('@')[0] || 'User',
        user_email: user.email || 'no-email',
        transaction_image_url: transactionImageUrl,
        status: 'pending',
        plan_selected: planSelected,
        payment_method: paymentMethod,
        amount_paid: Number(amountPaid) || 0,
        transaction_id: transactionId || '',
        payment_date: new Date().toISOString(),
        created_at: new Date().toISOString()
      });

      setStatus({ type: 'success', message: 'Subscription request submitted successfully! Admin will verify it soon.' });
      setFile(null);
      setPreviewUrl(null);
      setAmountPaid('');
      setTransactionId('');
      setHasPendingRequest(true);
    } catch (err) {
      console.error("Error submitting request:", err);
      setStatus({ 
        type: 'error', 
        message: getFriendlyErrorMessage(err, 'Unable to submit your subscription request. Please try again or contact support.') 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!premiumOnlyMode) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto text-center py-12 space-y-6 glass-panel rounded-3xl p-8 sm:p-12 border border-emerald-500/30"
      >
        <div className="inline-flex p-4 bg-emerald-500/10 rounded-full border border-emerald-500/30">
          <CheckCircle className="w-12 h-12 text-emerald-400" />
        </div>
        <h1 className="text-3xl font-bold text-white">All Materials Are Free!</h1>
        <p className="text-slate-300 max-w-md mx-auto leading-relaxed">
          Open Access mode is currently active. All Previous Year Questions, complete chapter notes, syllabus documents, and AI Chat are 100% free for all students without requiring a paid subscription.
        </p>
        <div className="pt-2">
          <button
            onClick={() => navigate('/pyq')}
            className="px-6 py-3 bg-[#F4B400] hover:bg-[#F5C21B] text-slate-950 font-bold rounded-xl transition-all shadow-md cursor-pointer"
          >
            Explore Free Resources
          </button>
        </div>
      </motion.div>
    );
  }

  if (user?.is_premium) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto text-center py-12 space-y-6 rounded-3xl bg-slate-900/85 border border-slate-700/60 p-8 sm:p-12 shadow-xl backdrop-blur-xl"
      >
        <div className="inline-flex p-4 bg-amber-500/15 border border-amber-500/30 rounded-2xl">
          <Crown className="w-12 h-12 text-[#F5C21B] fill-[#F5C21B]" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">You are a Premium Member!</h1>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          Enjoy unlimited, high-speed access to all Past Year Question Papers, complete chapter notes, and curriculum guides.
        </p>
      </motion.div>
    );
  }

  if (hasPendingRequest) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto text-center py-12 space-y-6 rounded-3xl bg-slate-900/85 border border-slate-700/60 p-8 sm:p-12 shadow-xl backdrop-blur-xl"
      >
        <div className="inline-flex p-4 bg-blue-500/15 border border-blue-500/30 rounded-2xl">
          <Clock className="w-12 h-12 text-blue-400" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Request Under Review</h1>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          Your payment receipt has been submitted and is currently being verified by an administrator. Please check back shortly!
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto space-y-6 sm:space-y-8 pb-12"
    >
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900/90 via-slate-800/80 to-slate-900/90 border border-slate-700/60 shadow-xl backdrop-blur-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              Full Academic Pass
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Upgrade to Premium
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg">
            Unlock complete solutions, terminal exam question papers, verified high-yield revision summaries, and 24/7 AI tutor assistance.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment Info Section */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/85 border border-slate-700/60 shadow-lg backdrop-blur-md space-y-6">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <div className="p-2 rounded-xl bg-amber-500/10 text-[#F5C21B]">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Payment Options</h2>
              <p className="text-xs text-slate-400">Scan QR or direct bank transfer</p>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#F5C21B]" />
            </div>
          ) : paymentInfo ? (
            <div className="space-y-6">
              {paymentInfo.esewa_qr_url && (
                <div className="text-center space-y-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Scan QR with eSewa</p>
                  <div className="bg-slate-950/80 p-3 sm:p-4 rounded-2xl inline-block border border-slate-800 shadow-md">
                    <img 
                      src={paymentInfo.esewa_qr_url} 
                      alt="eSewa QR" 
                      className="w-40 h-40 sm:w-44 sm:h-44 object-contain mx-auto rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-3 bg-slate-950/70 p-4 rounded-2xl border border-slate-800 text-xs sm:text-sm">
                <p className="text-xs font-bold text-[#F5C21B] uppercase tracking-wider">Bank Transfer Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2">
                  <span className="text-slate-400">Bank Name:</span>
                  <span className="font-semibold text-white break-words">{paymentInfo.bank_name || 'N/A'}</span>
                  <span className="text-slate-400">Account Holder:</span>
                  <span className="font-semibold text-white break-words">{paymentInfo.account_holder || 'N/A'}</span>
                  <span className="text-slate-400">Account Number:</span>
                  <span className="font-semibold text-white font-mono break-all">{paymentInfo.account_number || 'N/A'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-950/60 rounded-2xl border border-dashed border-slate-800">
              <AlertCircle className="w-10 h-10 text-slate-500 mx-auto mb-2" />
              <p className="text-slate-400 text-xs">Payment options are currently being updated.</p>
            </div>
          )}
        </div>

        {/* Upload Section */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/85 border border-slate-700/60 shadow-lg backdrop-blur-md space-y-6">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Upload Receipt Proof</h2>
              <p className="text-xs text-slate-400">Submit screenshot to activate subscription</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {status && (
              <div className={cn(
                "p-3.5 rounded-xl text-xs sm:text-sm flex items-start gap-3",
                status.type === 'success' ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
              )}>
                {status.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                <span>{status.message}</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Plan</label>
                  <select
                    value={planSelected}
                    onChange={(e) => setPlanSelected(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 text-white outline-none text-sm transition-all cursor-pointer"
                  >
                    <option value="Basic">Basic</option>
                    <option value="Premium">Premium</option>
                    <option value="Pro">Pro</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 text-white outline-none text-sm transition-all cursor-pointer"
                  >
                    <option value="eSewa">eSewa</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Khalti">Khalti</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Amount Paid</label>
                  <input
                    type="number"
                    required
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 text-white outline-none text-sm transition-all placeholder-slate-500"
                    placeholder="e.g. 500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Transaction ID</label>
                  <input
                    type="text"
                    required
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 text-white outline-none text-sm transition-all placeholder-slate-500"
                    placeholder="e.g. 123456789"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Payment Screenshot</label>
              <div 
                className={cn(
                  "relative border-2 border-dashed rounded-2xl transition-all flex flex-col items-center justify-center p-5 sm:p-6 text-center cursor-pointer bg-slate-950/50",
                  previewUrl ? "border-emerald-500/50 bg-emerald-500/10" : "border-slate-700 hover:border-amber-500/60 hover:bg-slate-950/80"
                )}
                onClick={() => document.getElementById('screenshot-upload')?.click()}
              >
                {previewUrl ? (
                  <div className="space-y-2">
                    <img src={previewUrl} alt="Preview" referrerPolicy="no-referrer" className="max-h-40 rounded-xl shadow-md mx-auto" />
                    <p className="text-xs text-emerald-400 font-semibold">Click to change screenshot</p>
                  </div>
                ) : (
                  <>
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-[#F5C21B] rounded-2xl mb-2">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-white">Click or tap to upload receipt</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">PNG, JPG up to 5MB</p>
                  </>
                )}
                <input 
                  id="screenshot-upload"
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleFileChange}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !file}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-slate-950" />
                  Submitting Verification...
                </>
              ) : (
                <>
                  <Crown className="w-5 h-5" />
                  Submit Request
                </>
              )}
            </button>
          </form>

          {/* Stripe Placeholder */}
          <div className="mt-8 pt-8 border-t border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-500" /> Pay with Card
            </h3>
            <button
              onClick={handleStripePayment}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              Pay with Stripe <ExternalLink className="w-4 h-4" />
            </button>
            <p className="text-xs text-center text-slate-500 mt-3">
              Secure payment processing powered by Stripe.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
