import React, { useState } from 'react';
import { Mail, Send, CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    topic: 'feedback',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setErrorMsg('Please complete all required fields before submitting.');
      return;
    }

    if (!formData.email.includes('@') || !formData.email.includes('.')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    // Record submission
    setSubmitted(true);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
      {/* Header */}
      <div className="max-w-3xl space-y-4">
        <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
          Communication & Support
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white [text-wrap:balance]">
          Contact the G-SENSE Team
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          Questions regarding architecture, interaction algorithms, or enterprise deployment? Send us a message below.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Form */}
        <div className="lg:col-span-7">
          <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
            {submitted ? (
              <div className="py-12 text-center space-y-4">
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Message Transmitted
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                  Thank you for reaching out, <strong>{formData.name}</strong>. Our team will review your inquiry and follow up at <strong>{formData.email}</strong>.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ name: '', email: '', topic: 'feedback', message: '' });
                  }}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 cursor-pointer"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {errorMsg && (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Your Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Alex Morgan"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="alex@example.com"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Inquiry Topic
                  </label>
                  <select
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white cursor-pointer"
                  >
                    <option value="feedback">General Feedback & Suggestions</option>
                    <option value="bug">Bug Report / Inconsistency</option>
                    <option value="architecture">Algorithm & Engine Questions</option>
                    <option value="enterprise">Enterprise Integration</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Message <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Describe your inquiry or observation..."
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                  <span>Send Inquiry</span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-900/40 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Project Correspondence
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              G-SENSE is an open adaptive software project. We welcome code contributions, algorithmic reviews, and peer audits of our privacy invariants.
            </p>
            <div className="pt-2 text-xs text-slate-500 dark:text-slate-400">
              Target response time: Within 24-48 business hours.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
