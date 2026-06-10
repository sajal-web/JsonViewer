import { useRef } from 'react';
import {
  Clipboard,

  ClipboardCheck,
  FileUp,
  FileDown,
  Trash2,
  ChevronsDown,
  ChevronsUp,
  AlignLeft,
  Minimize2,
  ArrowUpDown,
  FileCode,
  GitCompare,
} from 'lucide-react';
import { useJsonStore } from '../store/useJsonStore';
import ThemeToggle from './ThemeToggle';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const Toolbar = () => {
  const {
    rawInput,

    setRawInput,
    activeMode,
    setActiveMode,
    formatJson,
    minifyJson,
    clearAll,
    expandAll,
    collapseAll,
    sortKeys,
    exportToTypeScript,
    exportToLanguage,
    triggerBurst,
    setDiffEnabled,
  } = useJsonStore();


  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const EXPORT_LANGUAGES = [
    { value: 'typescript', label: 'TypeScript' },
    { value: 'python', label: 'Python' },
    { value: 'go', label: 'Go' },
    { value: 'csharp', label: 'C#' },
    { value: 'java', label: 'Java' },
    { value: 'kotlin', label: 'Kotlin' },
    { value: 'swift', label: 'Swift' },
  ] as const;
  type ExportLanguage = (typeof EXPORT_LANGUAGES)[number]['value'];

  const [exportLanguage, setExportLanguage] = useState<ExportLanguage>('typescript');

  const languageLabel = EXPORT_LANGUAGES.find((item) => item.value === exportLanguage)?.label ?? 'TypeScript';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleCopy = async (x: number, y: number) => {
    try {
      await navigator.clipboard.writeText(rawInput);
      setCopied(true);
      triggerBurst(x, y);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setRawInput(text);
      }
    } catch (err) {
      console.error('Failed to read clipboard', err);
    }
  };

  const handleDownload = () => {
    if (!rawInput.trim()) return;
    const blob = new Blob([rawInput], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeMode === 'json' ? 'document.json' : 'document.yaml';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        // Detect mode from filename extension
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext === 'yaml' || ext === 'yml') {
          setActiveMode('yaml');
        } else {
          setActiveMode('json');
        }
        setRawInput(result);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // clear input
    }
  };

  const handleSortKeys = (e: React.MouseEvent) => {
    sortKeys();
    triggerBurst(e.clientX, e.clientY);
    showToast('Keys sorted alphabetically!');
  };

  const handleExportCode = (e: React.MouseEvent) => {
    const result =
      exportLanguage === 'typescript'
        ? exportToTypeScript()
        : exportToLanguage(exportLanguage as ExportLanguage);

    if (result) {
      navigator.clipboard.writeText(result);
      triggerBurst(e.clientX, e.clientY);
      showToast(`${languageLabel} output copied to clipboard!`);
    } else {
      showToast(`${languageLabel} export failed. Ensure JSON/YAML is valid.`);
    }
  };

  const handleFormatClick = (e: React.MouseEvent) => {
    formatJson();
    triggerBurst(e.clientX, e.clientY);
  };

  const handleMinifyClick = (e: React.MouseEvent) => {
    minifyJson();
    triggerBurst(e.clientX, e.clientY);
  };

  return (
    <div className="h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur px-4 flex items-center justify-between gap-4 z-10 sticky top-0 flex-shrink-0 select-none overflow-x-auto md:overflow-x-visible whitespace-nowrap scrollbar-none">
      {/* File Actions Group */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={handlePaste}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-slate-100 transition-all cursor-pointer focus:outline-none"
          title="Paste from clipboard"
        >
          <Clipboard className="w-3.5 h-3.5" />
          <span>Paste</span>
        </button>

        <button
          onClick={(e) => handleCopy(e.clientX, e.clientY)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-slate-100 transition-all cursor-pointer focus:outline-none"
          title="Copy contents"
        >
          {copied ? <ClipboardCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Clipboard className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>

        <span className="w-px h-5 bg-slate-800 mx-1" />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-slate-100 transition-all cursor-pointer focus:outline-none"
          title="Upload JSON/YAML/TXT file"
          id="upload-btn"
        >
          <FileUp className="w-3.5 h-3.5" />
          <span>Upload</span>
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".json,.yaml,.yml,.txt"
          className="hidden"
          id="hidden-file-input"
        />

        <button
          onClick={handleDownload}
          disabled={!rawInput.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer focus:outline-none"
          title="Download current content"
          id="download-btn"
        >
          <FileDown className="w-3.5 h-3.5" />
          <span>Download</span>
        </button>


      </div>

      {/* Editor & Tree Operations Group */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* JSON / YAML Mode switcher */}
        <div className="flex bg-slate-950/80 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveMode('json')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
              activeMode === 'json'
                ? 'bg-blue-600/25 text-blue-400 border border-blue-600/30 shadow-inner'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            JSON
          </button>
          <button
            onClick={() => setActiveMode('yaml')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
              activeMode === 'yaml'
                ? 'bg-blue-600/25 text-blue-400 border border-blue-600/30 shadow-inner'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            YAML
          </button>
        </div>

        <span className="w-px h-5 bg-slate-800 mx-1" />

        {/* Format / Minify Actions */}
        <button
          onClick={handleFormatClick}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-slate-100 transition-all cursor-pointer focus:outline-none"
          title="Format (Pretty Print) (Cmd+Shift+F)"
          id="format-btn"
        >
          <AlignLeft className="w-3.5 h-3.5" />
          <span>Format</span>
        </button>

        <button
          onClick={handleMinifyClick}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-slate-100 transition-all cursor-pointer focus:outline-none"
          title="Minify JSON (collapses spaces)"
          id="minify-btn"
        >
          <Minimize2 className="w-3.5 h-3.5" />
          <span>Minify</span>
        </button>

        <button
          onClick={handleSortKeys}
          disabled={!rawInput.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer focus:outline-none"
          title="Sort keys alphabetically"
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
          <span>Sort Keys</span>
        </button>

        <div className="flex items-center gap-2">
          <select
            value={exportLanguage}
            onChange={(event) => setExportLanguage(event.target.value as ExportLanguage)}
            className="h-9 rounded-md bg-slate-850 border border-slate-800 text-slate-200 text-xs px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Select target export language"
          >
            {EXPORT_LANGUAGES.map((option) => (
              <option key={option.value} value={option.value} className="bg-slate-900 text-slate-200">
                {option.label}
              </option>
            ))}
          </select>

          <button
            onClick={handleExportCode}
            disabled={!rawInput.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border border-blue-500/20 text-white transition-all cursor-pointer focus:outline-none shadow-md shadow-blue-500/10 hover:shadow-blue-500/25 disabled:opacity-40 disabled:pointer-events-none"
            title={`Generate ${languageLabel} code & copy to clipboard`}
          >
            <FileCode className="w-3.5 h-3.5 text-blue-200" />
            <span>{`JSON to ${languageLabel}`}</span>
          </button>
        </div>

        <span className="w-px h-5 bg-slate-800 mx-1" />

        {/* Diff toggle */}
        <button
          onClick={() => {
            setDiffEnabled(true);
            const { setActivePage } = useJsonStore.getState();
            setActivePage('diff');
          }}
          className="relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-indigo-500/40 bg-indigo-500/10 text-indigo-300 hover:text-indigo-100 hover:bg-indigo-500/20 shadow-[0_0_12px_rgba(99,102,241,0.15)] hover:shadow-[0_0_18px_rgba(99,102,241,0.35)] transition-all cursor-pointer focus:outline-none"
          title="Compare two JSON/YAML inputs and view differences side-by-side"
        >
          <GitCompare className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span>Compare JSON (Diff)</span>
          <span className="absolute -top-2.5 -right-2.5 bg-indigo-600 text-[8px] font-bold text-white px-1.5 py-0.5 rounded-full select-none shadow shadow-indigo-900 border border-indigo-400/30 animate-bounce">
            NEW
          </span>
        </button>

        <span className="w-px h-5 bg-slate-800 mx-1" />

        {/* Tree actions */}
        <button

          onClick={expandAll}
          className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-md hover:bg-slate-800 border border-transparent hover:border-slate-800 text-slate-400 hover:text-slate-200 transition-all cursor-pointer focus:outline-none"
          title="Expand Tree Nodes"
        >
          <ChevronsDown className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={collapseAll}
          className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-md hover:bg-slate-800 border border-transparent hover:border-slate-800 text-slate-400 hover:text-slate-200 transition-all cursor-pointer focus:outline-none"
          title="Collapse Tree Nodes"
        >
          <ChevronsUp className="w-3.5 h-3.5" />
        </button>

        <span className="w-px h-5 bg-slate-800 mx-1" />

        {/* Theme & Reset */}
        <ThemeToggle />

        <button
          onClick={clearAll}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/30 text-rose-400 hover:text-rose-300 transition-all cursor-pointer focus:outline-none"
          title="Clear editor contents"
          id="clear-btn"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear</span>
        </button>
      </div>

      {/* Floaty Notification Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10, x: '-50%', scale: 0.95 }}
            animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
            exit={{ opacity: 0, y: -10, x: '-50%', scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="absolute top-16 left-1/2 px-4 py-2 bg-slate-900/90 border border-slate-800 text-slate-200 rounded-lg shadow-xl text-xs font-medium backdrop-blur-md flex items-center gap-2 z-[999]"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Toolbar;
