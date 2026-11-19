import React, { useState } from 'react';
import { Mail, MessageSquare, Send, Phone, MapPin } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../services/db';

export const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: null, message: '' });

    try {
      await addDoc(collection(db, 'contact_messages'), {
        ...formData,
        created_at: serverTimestamp(),
        status: 'new'
      });
      setStatus({ type: 'success', message: 'Your message has been sent successfully! We will get back to you soon.' });
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      console.error("Error sending message:", error);
      setStatus({ type: 'error', message: 'Failed to send message. Please try again later.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Contact Us</h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1 sm:mt-2">Have a question or feedback? We'd love to hear from you.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Contact Information */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-6">
          <div className="bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-700 shadow-sm">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-4 sm:mb-6">Get in Touch</h3>
            
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="p-2.5 sm:p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-400 rounded-xl shrink-0">
                  <Mail className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-white">Email</p>
                  <a href="mailto:support@hamroplus2hub.com" className="text-xs sm:text-sm text-slate-400 hover:text-indigo-400 transition-colors break-all">
                    support@hamroplus2hub.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:gap-4">
                <div className="p-2.5 sm:p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-400 rounded-xl shrink-0">
                  <Phone className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-white">Phone</p>
                  <p className="text-xs sm:text-sm text-slate-400">+977 9800000000</p>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:gap-4">
                <div className="p-2.5 sm:p-3 bg-rose-100 dark:bg-rose-900/30 text-rose-400 rounded-xl shrink-0">
                  <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-white">Location</p>
                  <p className="text-xs sm:text-sm text-slate-400">Kathmandu, Nepal</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2">
          <div className="bg-slate-800 p-4 sm:p-6 md:p-8 rounded-2xl border border-slate-700 shadow-sm">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6">Send us a Message</h3>
            
            {status.message && (
              <div className={`p-3.5 sm:p-4 rounded-xl mb-6 text-xs sm:text-sm ${
                status.type === 'success' 
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' 
                  : 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
              }`}>
                {status.message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label htmlFor="name" className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white transition-colors text-sm"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white transition-colors text-sm"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white transition-colors text-sm"
                  placeholder="How can we help?"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white transition-colors resize-none text-sm"
                  placeholder="Your message here..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed text-sm"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
