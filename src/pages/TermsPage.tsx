import React from 'react';
import { ArrowLeft, Scale, ShieldCheck, CheckCircle } from 'lucide-react';
import { useJsonStore } from '../store/useJsonStore';
import Footer from '../components/Footer';

export const TermsPage: React.FC = () => {
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
            <Scale className="w-3 h-3" />
            <span>Legal Framework</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white dark:text-white light:text-slate-900 tracking-tight">
            Terms of Service
          </h1>
          <p className="text-xs text-slate-500">
            Last Updated: June 10, 2026
          </p>
        </div>

        {/* Contents */}
        <div className="bg-slate-900/40 dark:bg-slate-900/40 light:bg-white border border-slate-900 light:border-slate-200 rounded-xl p-6 md:p-8 space-y-6 text-xs md:text-sm text-slate-300 light:text-slate-650 leading-relaxed font-sans">
          <section className="space-y-2">
            <h2 className="text-sm md:text-base font-bold text-slate-200 light:text-slate-850 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing, browsing, and using this web-based JSON/YAML Viewer application ("the Service"), you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm md:text-base font-bold text-slate-200 light:text-slate-850 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
              2. Permitted Use & Local Sandbox
            </h2>
            <p>
              The Service is provided free of charge for developers, engineers, and general users to visualize and format data. All text, schema, files, or payloads parsed in the editor are processed purely client-side inside the user's browser runtime. No data is stored, transmitted, or logged on remote servers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm md:text-base font-bold text-slate-200 light:text-slate-850 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
              3. Disclaimer of Warranties
            </h2>
            <p>
              THE SERVICE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT, OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SERVICE.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm md:text-base font-bold text-slate-200 light:text-slate-850 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              4. Complete Security Isolation
            </h2>
            <p>
              Because this product functions entirely inside the frontend context of the client browser sandbox, users retain complete security and intellectual property over all inputs pasted or loaded. You are solely responsible for ensuring the compliance of your data inputs with your local business agreements.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm md:text-base font-bold text-slate-200 light:text-slate-850 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
              5. Modification of Terms
            </h2>
            <p>
              We reserve the right to revise or update these Terms of Service at any time. Your continued use of the website following the posting of any updates constitutes acceptance of the new terms.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TermsPage;
