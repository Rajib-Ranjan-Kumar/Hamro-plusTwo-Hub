import React from 'react';
import { FileText } from 'lucide-react';

export const TermsConditions = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
          <FileText className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h1 className="text-3xl font-bold text-white">Terms & Conditions</h1>
      </div>
      
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <p className="text-sm text-slate-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
          <p>By accessing and using Hamro +2 Hub, you accept and agree to be bound by the terms and provision of this agreement. In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
          <p>Hamro +2 Hub provides a platform for students to share and access educational materials, including notes, past year questions (PYQs), and other resources. We reserve the right to modify, suspend, or discontinue any aspect of the service at any time.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. User Conduct</h2>
          <p>You agree to use the service only for lawful purposes. You are prohibited from:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Posting or transmitting any material that is offensive, defamatory, or infringes on intellectual property rights.</li>
            <li>Attempting to gain unauthorized access to any part of the service.</li>
            <li>Using the service to distribute spam or malicious software.</li>
            <li>Impersonating any person or entity.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Intellectual Property</h2>
          <p>All content provided on Hamro +2 Hub, including text, graphics, logos, and software, is the property of Hamro +2 Hub or its content suppliers and is protected by international copyright laws. Users retain ownership of the content they upload but grant Hamro +2 Hub a non-exclusive license to use, reproduce, and distribute it.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Limitation of Liability</h2>
          <p>Hamro +2 Hub shall not be liable for any direct, indirect, incidental, special, or consequential damages resulting from the use or inability to use the service, or from any content obtained through the service.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. Changes to Terms</h2>
          <p>We reserve the right to modify these terms at any time. Your continued use of the service following any changes constitutes your acceptance of the new terms.</p>
        </section>
      </div>
    </div>
  );
};
