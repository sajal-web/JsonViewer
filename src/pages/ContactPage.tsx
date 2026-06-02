import React, { useState } from 'react';
import { ArrowLeft, Mail, Send, CheckCircle, MessageSquare } from 'lucide-react';
import { useJsonStore } from '../store/useJsonStore';

export const ContactPage: React.FC = () => {
  const { setActivePage } = useJsonStore();
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', message: '' });
    }, 3000);
  };

  return (
    <div className="flex-1 w-full overflow-y-auto bg-slate-950 dark:bg-slate-950 light:bg-slate-50 text-slate-150 p-6 md:p-12">
      <div className="max-w-xl mx-auto space-y-8">
        {/* Back Button */}
        <button
          onClick={() => setActivePage('editor')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 dark:bg-slate-900/60 light:bg-white light:border-slate-200 text-slate-400 hover:text-slate-200 light:hover:text-slate-900 text-xs font-medium cursor-pointer transition-all focus:outline-none"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Editor</span>
        </button>

        {/* Heading */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-semibold tracking-wider uppercase">
            <Mail className="w-3 h-3" />
            <span>Support & Contact</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white dark:text-white light:text-slate-900 tracking-tight">
            Get in touch
          </h1>
          <p className="text-xs md:text-sm text-slate-400 light:text-slate-650">
            Have questions about integrations, security configurations, or custom features? Drop us a note.
          </p>
        </div>

        {/* Contact Form Card */}
        <div className="bg-slate-900/50 dark:bg-slate-900/50 light:bg-white border border-slate-900 light:border-slate-200 p-6 rounded-xl shadow-xl">
          {submitted ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle className="w-6 h-6 animate-bounce" />
              </div>
              <h3 className="text-base font-bold text-slate-250 light:text-slate-850">Message Sent!</h3>
              <p className="text-xs text-slate-400 light:text-slate-500 max-w-xs">
                Thank you for contacting us. Our engineering team will review your message shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400 light:text-slate-600 uppercase tracking-wider">Your Name</label>
                <input
                  type="text"
                  required
                  placeholder="Enter name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950/80 dark:bg-slate-950/80 light:bg-slate-50 border border-slate-800 light:border-slate-250 focus:border-blue-500 focus:outline-none rounded-lg p-2.5 text-xs text-slate-100 dark:text-slate-100 light:text-slate-900 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400 light:text-slate-600 uppercase tracking-wider">Your Email</label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-950/80 dark:bg-slate-950/80 light:bg-slate-50 border border-slate-800 light:border-slate-250 focus:border-blue-500 focus:outline-none rounded-lg p-2.5 text-xs text-slate-100 dark:text-slate-100 light:text-slate-900 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400 light:text-slate-600 uppercase tracking-wider">Your Message</label>
                <textarea
                  required
                  rows={4}
                  placeholder="How can we help?"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-slate-950/80 dark:bg-slate-950/80 light:bg-slate-50 border border-slate-800 light:border-slate-250 focus:border-blue-500 focus:outline-none rounded-lg p-2.5 text-xs text-slate-100 dark:text-slate-100 light:text-slate-900 transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 cursor-pointer flex items-center justify-center gap-1.5 focus:outline-none"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Message</span>
              </button>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="flex justify-between items-center text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            Average response rate &lt; 24h
          </span>
          <span>support@jsonviewer.example.com</span>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
