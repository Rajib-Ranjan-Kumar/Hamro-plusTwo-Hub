import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Search } from 'lucide-react';

const faqs = [
  {
    question: "What is Hamro +2 Hub?",
    answer: "Hamro +2 Hub is an educational platform designed specifically for +2 students in Nepal. It provides a centralized repository for study materials, past year questions (PYQs), and a community for students to collaborate and learn together."
  },
  {
    question: "How do I earn points?",
    answer: "You can earn points by contributing high-quality notes, PYQs, and solutions. When your contributions are verified and approved by our admin team, points are added to your account. You also earn points when other students find your materials helpful."
  },
  {
    question: "Can I withdraw my earned points as cash?",
    answer: "Yes! Once you accumulate a minimum of 100 points (equivalent to NPR 100), you can request a withdrawal. We currently support eSewa, Khalti, and direct bank transfers for withdrawals."
  },
  {
    question: "Is the premium subscription worth it?",
    answer: "Premium subscription gives you ad-free access, priority support, and exclusive access to verified, high-quality study materials and detailed solutions that are not available to free users. It's highly recommended for students preparing for board exams."
  },
  {
    question: "How long does it take for a contribution to be verified?",
    answer: "Our admin team typically reviews contributions within 24-48 hours. You will receive a notification once your material has been approved or if any changes are required."
  },
  {
    question: "I forgot my password. How can I reset it?",
    answer: "You can reset your password by clicking on the 'Forgot Password' link on the login page. Enter your registered email address, and we will send you instructions to create a new password."
  }
];

export const FAQ = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(0); // First one open by default

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl mb-6">
          <HelpCircle className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">Frequently Asked Questions</h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          Find answers to common questions about Hamro +2 Hub, earning points, subscriptions, and more.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-2xl mx-auto mb-12">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search for answers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-slate-800 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 dark:text-white shadow-sm transition-shadow"
        />
      </div>

      {/* FAQ Accordion */}
      <div className="space-y-4">
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq, index) => (
            <div 
              key={index}
              className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden transition-all duration-200"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
              >
                <span className="text-lg font-medium text-white pr-8">
                  {faq.question}
                </span>
                <div className={`p-2 rounded-full flex-shrink-0 transition-colors ${
                  openIndex === index 
                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                }`}>
                  {openIndex === index ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </button>
              
              <div 
                className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${
                  openIndex === index ? 'max-h-96 pb-6 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-slate-800 rounded-2xl border border-slate-700">
            <HelpCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No results found</h3>
            <p className="text-slate-400">
              We couldn't find any FAQs matching "{searchQuery}". Please try a different search term or contact support.
            </p>
          </div>
        )}
      </div>

      {/* Still need help? */}
      <div className="mt-16 text-center bg-indigo-50 dark:bg-indigo-900/10 rounded-3xl p-8 border border-indigo-100 dark:border-indigo-900/30">
        <h3 className="text-xl font-bold text-white mb-2">Still have questions?</h3>
        <p className="text-slate-400 mb-6">
          Can't find the answer you're looking for? Our support team is here to help.
        </p>
        <a 
          href="/contact" 
          className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors shadow-sm shadow-indigo-600/20"
        >
          Contact Support
        </a>
      </div>
    </div>
  );
};
