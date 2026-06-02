import React from 'react';
import { ArrowLeft, Shield, EyeOff, ServerCrash, FileLock2 } from 'lucide-react';
import { useJsonStore } from '../store/useJsonStore';

export const PrivacyPage: React.FC = () => {
  const { setActivePage } = useJsonStore();

  return (
    <div className="flex-1 w-full overflow-y-auto bg-slate-950 dark:bg-slate-950 light:bg-slate-50 text-slate-150 p-6 md:p-12">
      <div className="max-w-3xl mx-auto space-y-8">
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
            Last Updated: June 2, 2026
          </p>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/30 border border-slate-900/50 light:bg-white light:border-slate-200 p-4 rounded-xl flex flex-col items-center text-center space-y-2">
            <EyeOff className="w-6 h-6 text-sky-400" />
            <h3 className="text-xs font-bold text-slate-200 light:text-slate-850">No Remote Logging</h3>
            <p className="text-[11px] text-slate-450 light:text-slate-500">Your documents and structures are parsed natively within your client runtime environment.</p>
          </div>

          <div className="bg-slate-900/30 border border-slate-900/50 light:bg-white light:border-slate-200 p-4 rounded-xl flex flex-col items-center text-center space-y-2">
            <ServerCrash className="w-6 h-6 text-rose-400" />
            <h3 className="text-xs font-bold text-slate-200 light:text-slate-850">No Server Storage</h3>
            <p className="text-[11px] text-slate-450 light:text-slate-500">We do not own database storage or cloud servers to preserve input logs.</p>
          </div>

          <div className="bg-slate-900/30 border border-slate-900/50 light:bg-white light:border-slate-200 p-4 rounded-xl flex flex-col items-center text-center space-y-2">
            <FileLock2 className="w-6 h-6 text-emerald-400" />
            <h3 className="text-xs font-bold text-slate-200 light:text-slate-850">Local Web Workers</h3>
            <p className="text-[11px] text-slate-450 light:text-slate-500">Parsing executes on local browser background threads without external network calls.</p>
          </div>
        </div>

        {/* Detailed Document */}
        <div className="bg-slate-900/40 dark:bg-slate-900/40 light:bg-white border border-slate-900 light:border-slate-200 rounded-xl p-6 md:p-8 space-y-6 text-xs md:text-sm text-slate-350 light:text-slate-650 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-sm md:text-base font-bold text-slate-200 light:text-slate-850">1. Information We Do Not Collect</h2>
            <p>
              The Service does not collect, capture, store, transmit, or share any raw datasets, JSON, YAML, or plain text pasted or uploaded by you. All processing operations are conducted client-side.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm md:text-base font-bold text-slate-200 light:text-slate-850">2. Local Storage</h2>
            <p>
              We use standard browser features like `localStorage` solely to save your configuration preferences, such as selected theme (dark or light mode), code editor panel split ratio, and a session-based history list of formatting actions.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm md:text-base font-bold text-slate-200 light:text-slate-850">3. External Links</h2>
            <p>
              Our application may contain links to external sites that are not operated by us. We advise you to review the Privacy Policy of any external site you visit.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
