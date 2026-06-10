import React from 'react';
import { ArrowLeft, Shield, EyeOff, ServerCrash, FileLock2 } from 'lucide-react';
import { useJsonStore } from '../store/useJsonStore';
import Footer from '../components/Footer';

export const PrivacyPage: React.FC = () => {
  const { setActivePage } = useJsonStore();

  return (
    <div className="flex-1 w-full overflow-y-auto bg-slate-950 dark:bg-slate-950 light:bg-slate-50 text-slate-100 p-6 md:p-12 flex flex-col justify-between">
      <div className="max-w-3xl mx-auto space-y-8 pb-12">
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
            <Shield className="w-3.5 h-3.5" />
            <span>Data Privacy</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white dark:text-white light:text-slate-900 tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs text-slate-500">
            Last Updated: June 10, 2026
          </p>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/30 border border-slate-900/50 light:bg-white light:border-slate-250 p-4 rounded-xl flex flex-col items-center text-center space-y-2">
            <EyeOff className="w-6 h-6 text-sky-400" />
            <h3 className="text-xs font-bold text-slate-200 light:text-slate-850">No Remote Logging</h3>
            <p className="text-[11px] text-slate-400 light:text-slate-500">Your documents and structures are parsed natively within your client runtime environment.</p>
          </div>

          <div className="bg-slate-900/30 border border-slate-900/50 light:bg-white light:border-slate-250 p-4 rounded-xl flex flex-col items-center text-center space-y-2">
            <ServerCrash className="w-6 h-6 text-rose-400" />
            <h3 className="text-xs font-bold text-slate-200 light:text-slate-850">No Server Storage</h3>
            <p className="text-[11px] text-slate-400 light:text-slate-500">We do not own database storage or cloud servers to preserve input logs.</p>
          </div>

          <div className="bg-slate-900/30 border border-slate-900/50 light:bg-white light:border-slate-250 p-4 rounded-xl flex flex-col items-center text-center space-y-2">
            <FileLock2 className="w-6 h-6 text-emerald-400" />
            <h3 className="text-xs font-bold text-slate-200 light:text-slate-850">Local Web Workers</h3>
            <p className="text-[11px] text-slate-400 light:text-slate-500">Parsing executes on local browser background threads without external network calls.</p>
          </div>
        </div>

        {/* Detailed Document */}
        <div className="bg-slate-900/40 dark:bg-slate-900/40 light:bg-white border border-slate-900 light:border-slate-200 rounded-xl p-6 md:p-8 space-y-6 text-xs md:text-sm text-slate-300 light:text-slate-650 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-sm md:text-base font-bold text-slate-200 light:text-slate-850">1. Information We Do Not Collect</h2>
            <p>
              JSON Viewer Online is designed to operate as a utility tool running purely inside your browser's frontend sandbox context. Paste operations, syntax checks, YAML conversion, sorting, and comparison actions occur client-side. We do not transmit your data inputs or payloads to remote servers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm md:text-base font-bold text-slate-200 light:text-slate-850">2. Cookies & Ad Networks</h2>
            <p>
              We partner with third-party advertising networks, such as Google Adsense, to serve ads when you visit our website. These ad servers or networks use automated systems to compile statistics on views or clicks. They may utilize cookies, web beacons, and JavaScript scripts to measure the efficacy of their advertisements and to personalize content. Note that JSON Viewer Online has no access to or control over these cookies used by third-party advertisers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm md:text-base font-bold text-slate-200 light:text-slate-850">3. Google DART Cookie Policy</h2>
            <p>
              Google, as a third-party vendor, uses cookies to serve ads on our site. Google's use of the DART cookie enables it to serve ads to our users based on their visit to our site and other sites on the Internet. Users may opt out of the use of the DART cookie by visiting the Google Ad and Content Network privacy policy.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm md:text-base font-bold text-slate-200 light:text-slate-850">4. User Rights (GDPR & CCPA Compliance)</h2>
            <p>
              Depending on your location, you may have specific rights regarding your personal information, including the right to opt-out of ad personalization, clear configuration state cookies, or submit support questions. Because we do not store payload logs on remote systems, we have no personal user data files to delete or export.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm md:text-base font-bold text-slate-200 light:text-slate-850">5. Local Configuration Storage</h2>
            <p>
              We utilize local browser storage features (such as `localStorage`) solely to store user configuration preferences, including theme styles (dark vs light mode settings), splits ratios, and a session-based list of parsing logs. This configuration remains on your machine and is never shared.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PrivacyPage;
