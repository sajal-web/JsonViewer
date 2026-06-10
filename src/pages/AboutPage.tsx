import React from 'react';
import { ArrowLeft, Info, Cpu, Zap, Shield, HelpCircle, Code2, GitCompare, RefreshCw, Braces } from 'lucide-react';
import { useJsonStore } from '../store/useJsonStore';
import Footer from '../components/Footer';

export const AboutPage: React.FC = () => {
  const { setActivePage } = useJsonStore();

  return (
    <div className="flex-1 w-full overflow-y-auto bg-slate-950 dark:bg-slate-950 light:bg-slate-50 text-slate-100 p-6 md:p-12 flex flex-col justify-between">
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        {/* Back Button */}
        <button
          onClick={() => setActivePage('editor')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 dark:bg-slate-900/60 light:bg-white light:border-slate-200 text-slate-400 hover:text-slate-200 light:hover:text-slate-900 text-xs font-medium cursor-pointer transition-all focus:outline-none"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Editor</span>
        </button>

        {/* Hero Section */}
        <div className="text-center md:text-left space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-semibold tracking-wider uppercase">
            <Info className="w-3 h-3" />
            <span>About Our Platform</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white dark:text-white light:text-slate-900 tracking-tight">
            Comprehensive JSON & YAML Developer Platform
          </h1>
          <p className="text-sm md:text-base text-slate-400 light:text-slate-650 max-w-3xl leading-relaxed">
            Welcome to JSON Viewer Online, a premium, high-performance editor and visualization suite built specifically for developers, devops engineers, and data analysts to inspect, format, validate, structure, and compare JSON and YAML payloads seamlessly.
          </p>
        </div>

        {/* Deep Feature Explanations */}
        <div className="border-t border-slate-900 dark:border-slate-900 light:border-slate-200 pt-8 space-y-6">
          <h2 className="text-xl font-bold text-white dark:text-white light:text-slate-900 flex items-center gap-2">
            <Code2 className="w-5 h-5 text-blue-500" />
            Core Capabilities Explained
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-200 light:text-slate-800 flex items-center gap-2">
                <Braces className="w-4 h-4 text-sky-400" />
                1. JSON & YAML Formatter (Beautifier)
              </h3>
              <p className="text-xs text-slate-400 light:text-slate-600 leading-relaxed">
                Minified datasets or single-line payload outputs can be difficult to read. Our online formatter parses your payloads and formats them with perfect indentations, custom-tuned syntax color hierarchies, and collapsible nodes, making complex structured payloads easily readable in seconds.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-200 light:text-slate-800 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                2. Real-Time Parser & Validator
              </h3>
              <p className="text-xs text-slate-400 light:text-slate-600 leading-relaxed">
                Avoid debugging runtime errors in production. Our validation suite automatically highlights missing braces, extra commas, unquoted keys, and string mismatches. It marks the exact line of error and provides descriptive diagnoses to fix your schema format instantly.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-200 light:text-slate-800 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-violet-400" />
                3. Lossless YAML & JSON Conversion
              </h3>
              <p className="text-xs text-slate-400 light:text-slate-600 leading-relaxed">
                Seamlessly convert configuration payloads between JSON and YAML. Our bi-directional converter preserves array arrangements, value types, nested sections, and keys, simplifying tasks such as editing Kubernetes manifests or API payload definitions.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-200 light:text-slate-800 flex items-center gap-2">
                <GitCompare className="w-4 h-4 text-pink-400" />
                4. Side-by-Side JSON Diff Checker
              </h3>
              <p className="text-xs text-slate-400 light:text-slate-600 leading-relaxed">
                Easily compare two JSON documents or YAML manifests. Our automated structural comparison highlights additions, modifications, and deletions. Click on any path to navigate directly to changes in the visual tree editor view.
              </p>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="bg-slate-900/50 dark:bg-slate-900/50 light:bg-white border border-slate-900 light:border-slate-100 p-5 rounded-xl space-y-3 shadow-sm hover:border-slate-850 light:hover:border-slate-250 transition-all">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-205 light:text-slate-850 text-sm">Monaco Editor Integration</h3>
            <p className="text-xs text-slate-400 light:text-slate-500 leading-relaxed">
              Equipped with VS Code's editor core, providing robust syntax highlighting, auto-complete, multi-cursor editing, and precise validation diagnostics natively.
            </p>
          </div>

          <div className="bg-slate-900/50 dark:bg-slate-900/50 light:bg-white border border-slate-900 light:border-slate-100 p-5 rounded-xl space-y-3 shadow-sm hover:border-slate-850 light:hover:border-slate-250 transition-all">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-205 light:text-slate-850 text-sm">Web Worker Parsing</h3>
            <p className="text-xs text-slate-400 light:text-slate-500 leading-relaxed">
              Heavy payloads (5MB+) are parsed concurrently inside independent Web Workers, keeping the editor, tree rendering, and UI fully responsive.
            </p>
          </div>

          <div className="bg-slate-900/50 dark:bg-slate-900/50 light:bg-white border border-slate-900 light:border-slate-100 p-5 rounded-xl space-y-3 shadow-sm hover:border-slate-850 light:hover:border-slate-250 transition-all">
            <div className="w-10 h-10 rounded-lg bg-violet-500/10 border border-violet-500/25 flex items-center justify-center text-violet-400">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-205 light:text-slate-850 text-sm">Local Execution</h3>
            <p className="text-xs text-slate-400 light:text-slate-500 leading-relaxed">
              Your raw data remains inside your browser sandbox. We never transmit your files or JSON inputs to third-party endpoints.
            </p>
          </div>
        </div>

        {/* Technology details */}
        <div className="border-t border-slate-900 dark:border-slate-900 light:border-slate-200 pt-8 space-y-4">
          <h2 className="text-xl font-bold text-white dark:text-white light:text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-500" />
            FAQ & Stack Details
          </h2>
          <div className="space-y-4 text-xs text-slate-400 light:text-slate-650 leading-relaxed">
            <div>
              <h4 className="font-semibold text-slate-200 light:text-slate-800 text-sm">Is my payload data secure?</h4>
              <p className="mt-1">
                Yes. Since processing runs fully on the client-side, your data stays entirely within your local browser sandbox. No input is ever transmitted to a database or shared with external analytics trackers.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-200 light:text-slate-800 text-sm">How does the Tree View virtualization work?</h4>
              <p className="mt-1">
                By calculating visible nodes based on scroll offsets, our virtualized list only instantiates DOM nodes for elements currently in the viewport, supporting massive tree depths without browser lags.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AboutPage;
