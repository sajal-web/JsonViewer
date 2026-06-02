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
} from 'lucide-react';
import { useJsonStore } from '../store/useJsonStore';
import ThemeToggle from './ThemeToggle';
import { useState } from 'react';

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
  } = useJsonStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawInput);
      setCopied(true);
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

  return (
    <div className="h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur px-4 flex items-center justify-between z-10 sticky top-0 flex-shrink-0 select-none">
      {/* File Actions Group */}
      <div className="flex items-center gap-2">
        <button
          onClick={handlePaste}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-slate-100 transition-all cursor-pointer focus:outline-none"
          title="Paste from clipboard"
        >
          <Clipboard className="w-3.5 h-3.5" />
          <span>Paste</span>
        </button>

        <button
          onClick={handleCopy}
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
      <div className="flex items-center gap-2">
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
          onClick={formatJson}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-slate-100 transition-all cursor-pointer focus:outline-none"
          title="Format (Pretty Print) (Cmd+Shift+F)"
          id="format-btn"
        >
          <AlignLeft className="w-3.5 h-3.5" />
          <span>Format</span>
        </button>

        <button
          onClick={minifyJson}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-slate-100 transition-all cursor-pointer focus:outline-none"
          title="Minify JSON (collapses spaces)"
          id="minify-btn"
        >
          <Minimize2 className="w-3.5 h-3.5" />
          <span>Minify</span>
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
    </div>
  );
};

export default Toolbar;
