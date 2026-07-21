import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, limit, where } from 'firebase/firestore';
import { Crown, Upload, CheckCircle, AlertCircle, Loader2, CreditCard, ExternalLink, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import { uploadFile, handleFirestoreError, OperationType } from '../services/db';
import { motion } from 'motion/react';

export const GetPremium = () => {
  const { user } = useAuth();
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
      try {
        handleFirestoreError(err, OperationType.CREATE, 'subscription_requests');
      } catch (jsonErr: any) {
        const errorData = JSON.parse(jsonErr.message);
        setStatus({ type: 'error', message: `Failed to submit request: ${errorData.error}` });
        return;
      }
      setStatus({ type: 'error', message: 'Failed to submit request. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user?.is_premium) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto text-center py-12 space-y-6 glass-panel rounded-3xl p-12"
      >
        <div className="inline-flex p-4 bg-amber-100 dark:bg-amber-900/30 rounded-full">
          <Crown className="w-12 h-12 text-amber-500 fill-amber-500" />
        </div>
        <h1 className="text-3xl font-bold text-white">You are a Premium Member!</h1>
        <p className="text-slate-400">
          Enjoy unlimited access to PYQs, Syllabus, and Notes.
        </p>
      </motion.div>
    );
  }

  if (hasPendingRequest) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto text-center py-12 space-y-6 glass-panel rounded-3xl p-12"
      >
        <div className="inline-flex p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
          <Clock className="w-12 h-12 text-blue-500" />
        </div>
        <h1 className="text-3xl font-bold text-white">Request Pending</h1>
        <p className="text-slate-400">
          Your premium subscription request is currently being reviewed by an administrator. 
          Please check back later.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8 pb-12"
    >
      <div className="text-center space-y-4">
        <div className="inline-flex p-3 bg-amber-100 dark:bg-amber-900/30 rounded-2xl">
          <Crown className="w-8 h-8 text-amber-500" />
        </div>
        <h1 className="text-3xl font-bold text-white">Upgrade to Premium</h1>
        <p className="text-slate-400 max-w-lg mx-auto">
          Get exclusive access to all Past Year Questions (PYQs), detailed Syllabus, and comprehensive Notes.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Payment Info Section */}
        <div className="glass-panel rounded-2xl p-6 space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            Payment Details
          </h2>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          ) : paymentInfo ? (
            <div className="space-y-6">
              {paymentInfo.esewa_qr_url && (
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium text-slate-500">Scan QR to Pay via eSewa</p>
                  <div className="bg-white/50 dark:bg-slate-900/50 p-4 rounded-xl inline-block border border-slate-700/50 backdrop-blur-sm">
                    <img 
                      src={paymentInfo.esewa_qr_url} 
                      alt="eSewa QR" 
                      className="w-48 h-48 object-contain mx-auto"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-3 bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Bank Transfer Details</p>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <span className="text-slate-500">Bank Name:</span>
                  <span className="font-medium text-white">{paymentInfo.bank_name || 'N/A'}</span>
                  <span className="text-slate-500">Account Holder:</span>
                  <span className="font-medium text-white">{paymentInfo.account_holder || 'N/A'}</span>
                  <span className="text-slate-500">Account Number:</span>
                  <span className="font-medium text-white font-mono">{paymentInfo.account_number || 'N/A'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-500">Admin hasn't set up payment info yet.</p>
            </div>
          )}
        </div>

        {/* Upload Section */}
        <div className="glass-panel rounded-2xl p-6 space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-emerald-600" />
            Upload Proof
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {status && (
              <div className={cn(
                "p-4 rounded-xl text-sm flex items-start gap-3",
                status.type === 'success' ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
              )}>
                {status.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                {status.message}
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300">Plan</label>
                  <select
                    value={planSelected}
                    onChange={(e) => setPlanSelected(e.target.value)}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                  >
                    <option value="Basic">Basic</option>
                    <option value="Premium">Premium</option>
                    <option value="Pro">Pro</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                  >
                    <option value="eSewa">eSewa</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Khalti">Khalti</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300">Amount Paid</label>
                  <input
                    type="number"
                    required
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                    placeholder="e.g. 500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300">Transaction ID</label>
                  <input
                    type="text"
                    required
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                    placeholder="e.g. 123456789"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Transaction Screenshot</label>
              <div 
                className={cn(
                  "relative border-2 border-dashed rounded-xl transition-all flex flex-col items-center justify-center p-8 text-center cursor-pointer",
                  previewUrl ? "border-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/10" : "border-slate-300 dark:border-slate-700 hover:border-emerald-500 hover:bg-slate-700/50"
                )}
                onClick={() => document.getElementById('screenshot-upload')?.click()}
              >
                {previewUrl ? (
                  <div className="space-y-4">
                    <img src={previewUrl} alt="Preview" referrerPolicy="no-referrer" className="max-h-48 rounded-lg shadow-md mx-auto" />
                    <p className="text-xs text-emerald-600 font-medium">Click to change image</p>
                  </div>
                ) : (
                  <>
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-full mb-4">
                      <Upload className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="text-sm font-medium text-white">Click to upload screenshot</p>
                    <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 5MB</p>
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
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-bold rounded-full transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 hover-lift"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
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
