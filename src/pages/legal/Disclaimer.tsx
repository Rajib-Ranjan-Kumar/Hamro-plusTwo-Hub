import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const Disclaimer = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-rose-100 dark:bg-rose-900/30 rounded-xl">
          <AlertTriangle className="w-8 h-8 text-rose-600 dark:text-rose-400" />
        </div>
        <h1 className="text-3xl font-bold text-white">Disclaimer</h1>
      </div>
      
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <p className="text-sm text-slate-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. General Information</h2>
          <p>The information provided by Hamro +2 Hub ("we," "us," or "our") on our website is for general informational purposes only. All information on the site is provided in good faith, however we make no representation or warranty of any kind, express or implied, regarding the accuracy, adequacy, validity, reliability, availability, or completeness of any information on the site.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Educational Content</h2>
          <p>The notes, past year questions (PYQs), and other educational materials provided on this platform are contributed by users and are intended to serve as supplementary study aids. They should not replace official textbooks, lectures, or guidance from your educational institution. We do not guarantee the accuracy or completeness of user-contributed content.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. External Links</h2>
          <p>The site may contain (or you may be sent through the site) links to other websites or content belonging to or originating from third parties or links to websites and features in banners or other advertising. Such external links are not investigated, monitored, or checked for accuracy, adequacy, validity, reliability, availability, or completeness by us.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Professional Advice</h2>
          <p>The site cannot and does not contain professional advice. The educational information is provided for general informational and educational purposes only and is not a substitute for professional advice. Accordingly, before taking any actions based upon such information, we encourage you to consult with the appropriate professionals. We do not provide any kind of professional advice.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Errors and Omissions</h2>
          <p>While we strive to ensure that the information on this site is accurate, we assume no liability or responsibility for any errors or omissions in the content of this site. The information provided is on an "as is" basis with no guarantees of completeness, accuracy, usefulness, or timeliness.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. Contact Us</h2>
          <p>If you have any questions about this disclaimer, please contact us at support@hamroplus2hub.com.</p>
        </section>
      </div>
    </div>
  );
};
