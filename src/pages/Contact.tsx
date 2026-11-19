import React, { useState, useEffect } from 'react';
import { Mail, MessageSquare, Send, Phone, MapPin, Clock, Edit3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { subscribeToGlobalSettings, GlobalSettings, DEFAULT_GLOBAL_SETTINGS } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { SEO } from '../components/SEO';

export const Contact = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<GlobalSettings>(DEFAULT_GLOBAL_SETTINGS);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });

  useEffect(() => {
    const unsubscribe = subscribeToGlobalSettings((liveSettings) => {
      setSettings(liveSettings);
    });
    return () => unsubscribe();
  }, []);

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

  const supportEmail = settings.support_email || 'hamroplus2support@gmail.com';
  const supportPhone = settings.support_phone || '+977 9800000000';
  const contactLocation = settings.contact_location || 'Kathmandu, Nepal';
  const contactHours = settings.contact_hours || 'Sunday – Friday, 9:00 AM – 6:00 PM NPT';

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <SEO 
        title="Contact Us - Hamro +2 Hub"
        description="Get in touch with the Hamro +2 Hub support team for inquiries, study material requests, or account assistance."
      />

      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Contact Us</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 sm:mt-2">Have a question or feedback? We'd love to hear from you.</p>
        </div>

        {user?.role === 'admin' && (
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#F5C21B]/15 hover:bg-[#F5C21B]/25 border border-[#F5C21B]/40 text-[#F5C21B] rounded-xl text-xs font-semibold transition-all shadow-sm w-fit"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Admin: Edit Contact Details</span>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Contact Information (Managed only by Admin) */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-6">
          <div className="bg-slate-800/90 backdrop-blur-md p-4 sm:p-6 rounded-2xl border border-slate-700 shadow-sm">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-4 sm:mb-6">Get in Touch</h3>
            
            <div className="space-y-4 sm:space-y-6">
              {/* Email */}
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="p-2.5 sm:p-3 bg-amber-400/10 text-[#F5C21B] border border-amber-400/20 rounded-xl shrink-0">
                  <Mail className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-white">Official Support Email</p>
                  <a 
                    href={`mailto:${supportEmail}`} 
                    className="text-xs sm:text-sm text-slate-300 hover:text-[#F5C21B] transition-colors break-all font-mono"
                  >
                    {supportEmail}
                  </a>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="p-2.5 sm:p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl shrink-0">
                  <Phone className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-white">Phone / Helpline</p>
                  <a 
                    href={`tel:${supportPhone}`} 
                    className="text-xs sm:text-sm text-slate-300 hover:text-emerald-400 transition-colors font-mono"
                  >
                    {supportPhone}
                  </a>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="p-2.5 sm:p-3 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl shrink-0">
                  <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-white">Location</p>
                  <p className="text-xs sm:text-sm text-slate-300">{contactLocation}</p>
                </div>
              </div>

              {/* Hours */}
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="p-2.5 sm:p-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl shrink-0">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-white">Support Hours</p>
                  <p className="text-xs sm:text-sm text-slate-300">{contactHours}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2">
          <div className="bg-slate-800/90 backdrop-blur-md p-4 sm:p-6 md:p-8 rounded-2xl border border-slate-700 shadow-sm">
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
                    className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-[#F5C21B] text-white transition-colors text-sm"
                    placeholder="e.g. Aarav Sharma"
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
                    className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-[#F5C21B] text-white transition-colors text-sm"
                    placeholder="aarav@example.com"
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
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-[#F5C21B] text-white transition-colors text-sm"
                  placeholder="e.g. Question Paper Contribution Inquiry"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-[#F5C21B] text-white transition-colors text-sm resize-none"
                  placeholder="How can we help you?"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-[#F5C21B] hover:bg-[#e0b018] text-black font-semibold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
