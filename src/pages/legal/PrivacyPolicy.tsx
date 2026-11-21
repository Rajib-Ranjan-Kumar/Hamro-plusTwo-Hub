import React from 'react';
import { Shield } from 'lucide-react';

export const PrivacyPolicy = () => {
  return (
    <div className="max-w-4xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-slate-900/85 border border-slate-700/60 shadow-xl backdrop-blur-xl p-6 sm:p-10">
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-800">
          <div className="p-3.5 bg-amber-500/15 border border-amber-500/30 rounded-2xl text-[#F5C21B] shadow-sm">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Privacy Policy</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">Last updated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
        
        <div className="space-y-6 text-slate-300 leading-relaxed text-sm sm:text-base">
          <section className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3">1. Introduction</h2>
            <p>Welcome to Hamro +2 Hub. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.</p>
          </section>

          <section className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3">2. Data We Collect</h2>
            <p className="mb-3">We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:</p>
            <ul className="list-disc pl-5 space-y-2 text-slate-300">
              <li><strong className="text-white">Identity Data:</strong> includes first name, last name, username or similar identifier.</li>
              <li><strong className="text-white">Contact Data:</strong> includes email address.</li>
              <li><strong className="text-white">Profile Data:</strong> includes your college, stream, year, contributions, and preferences.</li>
              <li><strong className="text-white">Technical Data:</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location.</li>
              <li><strong className="text-white">Usage Data:</strong> includes information about how you use our website, products and services.</li>
            </ul>
          </section>

          <section className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3">3. How We Use Your Data</h2>
            <p className="mb-3">We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
            <ul className="list-disc pl-5 space-y-2 text-slate-300">
              <li>To register you as a new user.</li>
              <li>To manage our relationship with you.</li>
              <li>To enable you to partake in a prize draw, competition or complete a survey.</li>
              <li>To administer and protect our business and this website.</li>
              <li>To deliver relevant website content and advertisements to you.</li>
              <li>To use data analytics to improve our website, products/services, marketing, customer relationships and experiences.</li>
            </ul>
          </section>

          <section className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3">4. Data Security</h2>
            <p>We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorised way, altered or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.</p>
          </section>

          <section className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3">5. Your Legal Rights</h2>
            <p className="mb-3">Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to:</p>
            <ul className="list-disc pl-5 space-y-2 text-slate-300">
              <li>Request access to your personal data.</li>
              <li>Request correction of your personal data.</li>
              <li>Request erasure of your personal data.</li>
              <li>Object to processing of your personal data.</li>
              <li>Request restriction of processing your personal data.</li>
              <li>Request transfer of your personal data.</li>
              <li>Right to withdraw consent.</li>
            </ul>
          </section>

          <section className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3">6. Contact Us</h2>
            <p>If you have any questions about this privacy policy or our privacy practices, please contact us at <a href="mailto:hamroplus2support@gmail.com" className="text-[#F5C21B] hover:underline font-mono">hamroplus2support@gmail.com</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
};
