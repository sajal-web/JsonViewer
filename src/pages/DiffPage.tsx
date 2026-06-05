import React, { useMemo, useRef, useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  AlertTriangle, 
  Columns2, 
  Rows2, 
  PanelRight, 
  PanelRightClose, 
  Trash2, 
  Sparkles, 
  Search, 
  Check, 
  Braces,
  HelpCircle,
  Copy,
  ChevronRight,
  PlusCircle,
  Edit3
} from 'lucide-react';
import { DiffEditor } from '@monaco-editor/react';

import { useJsonStore } from '../store/useJsonStore';
import { parseJsonWithErrorInfo, parseYamlWithErrorInfo } from '../utils/jsonParser';

const PLACEHOLDER_LEFT = `{
  "users": [
    { "id": 1, "name": "Alice" },
    { "id": 2, "name": "Bob" }
  ],
  "active": true
}`;

const PLACEHOLDER_RIGHT = `{
  "users": [
    { "id": 1, "name": "Alice" },
    { "id": 2, "name": "Bobby" },
    { "id": 3, "name": "Charlie" }
  ],
  "active": false
}`;

const SAMPLE_LEFT_DATA = `{
  "appName": "Antigravity Cloud",
  "version": "1.4.2",
  "status": "operational",
  "settings": {
    "theme": "dark",
    "notifications": true,
    "maxConnections": 100,
    "features": ["auth", "billing"]
  },
  "database": {
    "host": "localhost",
    "port": 5432,
    "replica": false
  }
}`;

const SAMPLE_RIGHT_DATA = `{
  "appName": "Antigravity Cloud Pro",
  "version": "1.5.0",
  "status": "maintenance",
  "settings": {
    "theme": "slate-dark",
    "notifications": false,
    "maxConnections": 250,
    "features": ["auth", "billing", "analytics", "realtime"]
  },
  "database": {
    "host": "postgres-prod.internal",
    "port": 5432,
    "replica": true,
    "readOnly": true
  }
}`;

type DiffStatus = 'added' | 'changed';

function getByPath(root: any, path: string): any {
  if (path === '$') return root;

  let cur = root;
  let s = path.startsWith('$') ? path.slice(1) : path;

  while (s.length > 0) {
    if (s[0] === '.') {
      s = s.slice(1);
      const m = /^[a-zA-Z0-9_\-]+/.exec(s);
      if (!m) return undefined;
      const key = m[0];
      cur = cur?.[key];
      s = s.slice(key.length);
      continue;
    }

    if (s[0] === '[') {
      s = s.slice(1);
      const idxStr = s.split(']')[0];
      const idx = Number(idxStr);
      cur = cur?.[idx];
      s = s.slice(idxStr.length + 1);
      continue;
    }

    return undefined;
  }

  return cur;
}

function safeTypeOf(val: any): string {
  if (val === null) return 'null';
  if (Array.isArray(val)) return 'array';
  return typeof val;
}

function stablePrimitiveString(val: any): string {
  if (val === null) return 'null';
  if (typeof val === 'string') return val;
  return String(val);
}

function computeDiffByPath(prev: any, next: any): Record<string, DiffStatus> {
  const out: Record<string, DiffStatus> = {};
  const prevHas = new Set<string>();
  const nextHas = new Set<string>();

  const LIMIT = 20000;
  let nodeCount = 0;

  function traverseCapped(val: any, path: string, set: Set<string>) {
    if (nodeCount > LIMIT) return;
    nodeCount++;
    set.add(path);
    if (val && typeof val === 'object') {
      if (Array.isArray(val)) {
        for (let i = 0; i < val.length; i++) {
          traverseCapped(val[i], `${path}[${i}]`, set);
        }
      } else {
        for (const k of Object.keys(val)) {
          const childPath = path === '$' ? `$.${k}` : `${path}.${k}`;
          traverseCapped(val[k], childPath, set);
        }
      }
    }
  }

  traverseCapped(prev, '$', prevHas);
  nodeCount = 0;
  traverseCapped(next, '$', nextHas);

  for (const p of nextHas) {
    if (!prevHas.has(p)) out[p] = 'added';
  }

  const changedAt = new Set<string>();
  for (const p of nextHas) {
    if (!prevHas.has(p)) continue;
    const a = getByPath(prev, p);
    const b = getByPath(next, p);

    const typeA = safeTypeOf(a);
    const typeB = safeTypeOf(b);

    if (typeA !== typeB) {
      out[p] = 'changed';
      changedAt.add(p);
      continue;
    }

    if (typeA === 'array' || typeA === 'object') {
      continue;
    }

    const primA = stablePrimitiveString(a);
    const primB = stablePrimitiveString(b);
    if (primA !== primB) {
      out[p] = 'changed';
      changedAt.add(p);
    }
  }

  // Bubble changes/added to ancestors so you see where structure diverged.
  for (const p of changedAt) {
    let cur = p;
    while (cur.includes('.')) {
      const lastDot = cur.lastIndexOf('.');
      cur = cur.slice(0, lastDot);
      if (cur && cur !== '$' && !out[cur]) out[cur] = 'changed';
    }

    cur = p;
    while (cur.includes('[')) {
      const lastBracket = cur.lastIndexOf('[');
      cur = cur.slice(0, lastBracket);
      if (cur && cur !== '$' && !out[cur]) out[cur] = 'changed';
    }

    if (!out['$']) out['$'] = 'changed';
  }

  for (const p of Object.keys(out)) {
    if (out[p] !== 'added') continue;

    let cur = p;
    while (cur.includes('.')) {
      const lastDot = cur.lastIndexOf('.');
      cur = cur.slice(0, lastDot);
      if (cur && cur !== '$' && !out[cur]) out[cur] = 'changed';
    }

    cur = p;
    while (cur.includes('[')) {
      const lastBracket = cur.lastIndexOf('[');
      cur = cur.slice(0, lastBracket);
      if (cur && cur !== '$' && !out[cur]) out[cur] = 'changed';
    }

    if (!out['$']) out['$'] = 'changed';
  }

  return out;
}

function getFriendlyDiffMessage(path: string, status: DiffStatus, prev: any, next: any): string {
  const leftVal = getByPath(prev, path);
  const rightVal = getByPath(next, path);

  const typeLeft = safeTypeOf(leftVal);
  const typeRight = safeTypeOf(rightVal);

  const displayVal = (v: any) => {
    if (v === null) return 'null';
    if (v === undefined) return 'empty';
    if (typeof v === 'object') {
      return Array.isArray(v) ? 'List/Array' : 'Group/Object';
    }
    if (typeof v === 'string') return `"${v}"`;
    return String(v);
  };

  if (status === 'added') {
    if (typeRight === 'object') {
      return 'Added a new group / section of info.';
    }
    if (typeRight === 'array') {
      return 'Added a new list of items.';
    }
    return `Added new info: ${displayVal(rightVal)}`;
  }

  // status === 'changed'
  if (typeLeft !== typeRight) {
    return `Switched from type ${typeLeft} to ${typeRight}.`;
  }

  if (typeRight === 'object' || typeRight === 'array') {
    return 'Details inside this section were updated.';
  }

  return `Changed from ${displayVal(leftVal)} to ${displayVal(rightVal)}`;
}

export const DiffPage: React.FC = () => {
  const { setActivePage, theme, activeMode } = useJsonStore();

  const [leftText, setLeftText] = useState<string>('');
  const [rightText, setRightText] = useState<string>('');

  const [isSplitView, setIsSplitView] = useState<boolean>(true);
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [selectedDiffPath, setSelectedDiffPath] = useState<string | null>(null);

  const [diffQuery, setDiffQuery] = useState('');
  const [diffFilter, setDiffFilter] = useState<'all' | DiffStatus>('all');
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const diffEditorRef = useRef<any>(null);

  const leftInput = leftText.trim() ? leftText : PLACEHOLDER_LEFT;
  const rightInput = rightText.trim() ? rightText : PLACEHOLDER_RIGHT;

  const leftParsed = useMemo(() => {
    if (activeMode === 'yaml') return parseYamlWithErrorInfo(leftInput);
    return parseJsonWithErrorInfo(leftInput);
  }, [leftInput, activeMode]);

  const rightParsed = useMemo(() => {
    if (activeMode === 'yaml') return parseYamlWithErrorInfo(rightInput);
    return parseJsonWithErrorInfo(rightInput);
  }, [rightInput, activeMode]);

  const diffMap = useMemo(() => {
    if (!leftParsed.success || !rightParsed.success) return {};
    return computeDiffByPath(leftParsed.data, rightParsed.data);
  }, [leftParsed, rightParsed]);

  const diffList = useMemo(() => {
    if (!leftParsed.success || !rightParsed.success)
      return [] as Array<{ path: string; status: DiffStatus }>;

    return Object.keys(diffMap)
      .filter((p) => p !== '$')
      .sort((a, b) => {
        const da = (a.match(/\./g) || []).length + (a.match(/\[/g) || []).length;
        const db = (b.match(/\./g) || []).length + (b.match(/\[/g) || []).length;
        return db - da;
      })
      .map((path) => ({ path, status: diffMap[path] }));
  }, [diffMap, leftParsed.success, rightParsed.success]);

  const counts = useMemo(() => {
    let added = 0;
    let changed = 0;
    diffList.forEach(item => {
      if (item.status === 'added') added++;
      else changed++;
    });
    return { added, changed };
  }, [diffList]);

  const DIFF_CAP = 200;

  const filteredDiffList = useMemo(() => {
    const q = diffQuery.trim().toLowerCase();
    return diffList
      .filter((d) => (diffFilter === 'all' ? true : d.status === diffFilter))
      .filter((d) => (q ? d.path.toLowerCase().includes(q) : true));
  }, [diffList, diffFilter, diffQuery]);

  const language = activeMode === 'yaml' ? 'yaml' : 'json';

  const handlePickDiff = (path: string) => {
    setSelectedDiffPath(path);
    clearMarkers();
    selectByPathInEditor(path);
  };

  const clearMarkers = () => {
    try {
      const monaco = (window as any).monaco;
      if (!monaco || !diffEditorRef.current) return;

      const leftModel = diffEditorRef.current.getOriginalEditor().getModel();
      const rightModel = diffEditorRef.current.getModifiedEditor().getModel();

      if (leftModel) monaco.editor.setModelMarkers(leftModel, 'diff', []);
      if (rightModel) monaco.editor.setModelMarkers(rightModel, 'diff', []);
    } catch {
      // ignore
    }
  };

  const selectByPathInEditor = (path: string) => {
    setSelectedDiffPath(path);

    try {
      const monaco = (window as any).monaco;
      if (!monaco || !diffEditorRef.current) return;

      const leftEditor = diffEditorRef.current.getOriginalEditor();
      const rightEditor = diffEditorRef.current.getModifiedEditor();
      const leftModel = leftEditor?.getModel?.();
      const rightModel = rightEditor?.getModel?.();
      if (!leftModel || !rightModel) return;

      const lastSegment = (() => {
        const dotParts = path.replace(/^\$\./, '$').split('.');
        const last = dotParts[dotParts.length - 1] || path;
        return last.replace(/\[\d+\].*$/, '').replace(/\[\d+\]/g, '');
      })();

      const keyToFind = lastSegment || path;

      const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const keyRegex = new RegExp(`"${escapeRegExp(keyToFind)}"\\s*:\\s*`, 'g');

      const buildMarkerForModel = (model: any, text: string) => {
        const fullText = text ?? model.getValue?.() ?? '';
        const matches: any[] = [];

        let match: RegExpExecArray | null;
        const MAX = 3000;
        let count = 0;
        while ((match = keyRegex.exec(fullText)) !== null && count < MAX) {
          count++;
          const idx = match.index;
          const before = fullText.slice(0, idx);
          const line = before.split('\n').length;
          const col = before.length - before.lastIndexOf('\n');

          matches.push({
            startLineNumber: line,
            startColumn: Math.max(1, col),
            endLineNumber: line,
            endColumn: Math.max(1, col + match[0].length),
          });
          if (matches.length >= 1) break;

          if (keyRegex.lastIndex === match.index) keyRegex.lastIndex++;
        }

        if (matches.length === 0) return [];
        const m = matches[0];
        return [
          {
            startLineNumber: m.startLineNumber,
            startColumn: m.startColumn,
            endLineNumber: m.endLineNumber,
            endColumn: m.endColumn,
            message: `Diff highlight: ${path}`,
            severity: monaco.MarkerSeverity.Info,
          },
        ];
      };

      const leftTextValue = leftModel.getValue?.() ?? '';
      const rightTextValue = rightModel.getValue?.() ?? '';

      const leftMarkers = buildMarkerForModel(leftModel, leftTextValue);
      const rightMarkers = buildMarkerForModel(rightModel, rightTextValue);

      monaco.editor.setModelMarkers(leftModel, 'diff', leftMarkers);
      monaco.editor.setModelMarkers(rightModel, 'diff', rightMarkers);

      const leftHit = leftMarkers[0];
      const rightHit = rightMarkers[0];

      if (leftHit) {
        leftEditor.revealPositionInCenter({ lineNumber: leftHit.startLineNumber, column: leftHit.startColumn });
        leftEditor.setPosition({ lineNumber: leftHit.startLineNumber, column: leftHit.startColumn });
        leftEditor.focus?.();
      }

      if (rightHit) {
        rightEditor.revealPositionInCenter({ lineNumber: rightHit.startLineNumber, column: rightHit.startColumn });
        rightEditor.setPosition({ lineNumber: rightHit.startLineNumber, column: rightHit.startColumn });
      }
    } catch {
      // ignore
    }
  };

  const handleEditorMount = (editor: any, monaco: any) => {
    diffEditorRef.current = editor;

    // Define themes if they don't exist yet
    try {
      const themes = monaco.editor.getThemes ? monaco.editor.getThemes() : [];
      if (!themes.includes('slate-dark')) {
        monaco.editor.defineTheme('slate-dark', {
          base: 'vs-dark',
          inherit: true,
          rules: [
            { token: 'string', foreground: 'E2E8F0' },
            { token: 'string.key', foreground: '38BDF8' },
            { token: 'number', foreground: 'F43F5E' },
            { token: 'keyword', foreground: '60A5FA' },
            { token: 'keyword.json', foreground: '60A5FA' },
            { token: 'delimiter.comma.json', foreground: '94A3B8' },
            { token: 'delimiter.bracket.json', foreground: '94A3B8' },
          ],
          colors: {
            'editor.background': '#070a13',
            'editor.foreground': '#F8FAFC',
            'editor.lineHighlightBackground': '#1e293b40',
            'editorLineNumber.foreground': '#475569',
            'editorLineNumber.activeForeground': '#38BDF8',
            'editor.selectionBackground': '#38bdf820',
            'editorCursor.foreground': '#38BDF8',
          },
        });
      }
      if (!themes.includes('slate-light')) {
        monaco.editor.defineTheme('slate-light', {
          base: 'vs',
          inherit: true,
          rules: [
            { token: 'string', foreground: '334155' },
            { token: 'string.key', foreground: '0284C7' },
            { token: 'number', foreground: 'E11D48' },
            { token: 'keyword', foreground: '2563EB' },
          ],
          colors: {
            'editor.background': '#ffffff',
            'editor.foreground': '#0f172a',
            'editor.lineHighlightBackground': '#f1f5f990',
            'editorLineNumber.foreground': '#94a3b8',
            'editorLineNumber.activeForeground': '#0284c7',
            'editor.selectionBackground': '#0284c715',
            'editorCursor.foreground': '#0284C7',
          },
        });
      }
    } catch (e) {
      console.warn("Theme registration failed:", e);
    }

    monaco.editor.setTheme(theme === 'dark' ? 'slate-dark' : 'slate-light');

    const originalEditor = editor.getOriginalEditor();
    const modifiedEditor = editor.getModifiedEditor();

    originalEditor.onDidChangeModelContent(() => {
      setLeftText(originalEditor.getValue() || '');
    });

    modifiedEditor.onDidChangeModelContent(() => {
      setRightText(modifiedEditor.getValue() || '');
    });
  };

  useEffect(() => {
    try {
      const monaco = (window as any).monaco;
      if (monaco) {
        monaco.editor.setTheme(theme === 'dark' ? 'slate-dark' : 'slate-light');
      }
    } catch {
      // ignore
    }
  }, [theme]);

  const handleFormatBoth = () => {
    try {
      if (activeMode === 'json') {
        if (leftInput.trim()) {
          const formattedLeft = JSON.stringify(JSON.parse(leftInput), null, 2);
          setLeftText(formattedLeft);
          if (diffEditorRef.current) {
            diffEditorRef.current.getOriginalEditor().setValue(formattedLeft);
          }
        }
        if (rightInput.trim()) {
          const formattedRight = JSON.stringify(JSON.parse(rightInput), null, 2);
          setRightText(formattedRight);
          if (diffEditorRef.current) {
            diffEditorRef.current.getModifiedEditor().setValue(formattedRight);
          }
        }
      }
    } catch (e: any) {
      alert(`Format failed: Make sure both inputs are valid ${activeMode.toUpperCase()}`);
    }
  };

  const handleClearBoth = () => {
    setLeftText('');
    setRightText('');
    setSelectedDiffPath(null);
    if (diffEditorRef.current) {
      diffEditorRef.current.getOriginalEditor().setValue('');
      diffEditorRef.current.getModifiedEditor().setValue('');
    }
  };

  const handleLoadSample = () => {
    setLeftText(SAMPLE_LEFT_DATA);
    setRightText(SAMPLE_RIGHT_DATA);
    setSelectedDiffPath(null);
    if (diffEditorRef.current) {
      diffEditorRef.current.getOriginalEditor().setValue(SAMPLE_LEFT_DATA);
      diffEditorRef.current.getModifiedEditor().setValue(SAMPLE_RIGHT_DATA);
    }
  };

  const handleCopyPath = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(path);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 1500);
  };

  return (
    <div className="flex-1 w-full flex flex-col bg-slate-950 dark:bg-slate-950 light:bg-slate-50 text-slate-100 overflow-hidden">
      {/* Top Controls bar */}
      <div className="h-14 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md px-4 flex items-center justify-between flex-shrink-0 z-10 select-none">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActivePage('editor')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200 text-xs font-semibold cursor-pointer transition-all hover:bg-slate-800/80 focus:outline-none"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Editor</span>
          </button>
          
          <div className="h-4 w-px bg-slate-800 hidden sm:block" />

          {/* Quick Change Stats */}
          <div className="hidden md:flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Differences:</span>
            {leftParsed.success && rightParsed.success ? (
              diffList.length === 0 ? (
                <span className="text-[11px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                  All Synced
                </span>
              ) : (
                <div className="flex items-center gap-1.5">
                  {counts.added > 0 && (
                    <span className="text-[11px] font-semibold bg-sky-500/10 border border-sky-500/20 text-sky-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <PlusCircle className="w-3 h-3" /> {counts.added} Added
                    </span>
                  )}
                  {counts.changed > 0 && (
                    <span className="text-[11px] font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Edit3 className="w-3 h-3" /> {counts.changed} Changed
                    </span>
                  )}
                </div>
              )
            ) : (
              <span className="text-xs text-amber-400/80 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Waiting for valid input
              </span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Load Sample Button */}
          <button
            onClick={handleLoadSample}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:text-indigo-100 hover:bg-indigo-500/20 text-xs font-semibold cursor-pointer transition-all focus:outline-none"
            title="Load sample JSON changes"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Load Sample</span>
          </button>

          {/* Format Button */}
          <button
            onClick={handleFormatBoth}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-300 hover:text-slate-100 hover:bg-slate-800/80 text-xs font-semibold cursor-pointer transition-all focus:outline-none"
            title="Format JSON"
          >
            <Braces className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Format</span>
          </button>

          {/* Clear Button */}
          <button
            onClick={handleClearBoth}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:text-rose-100 hover:bg-rose-500/20 text-xs font-semibold cursor-pointer transition-all focus:outline-none"
            title="Clear text inputs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>

          <div className="h-4 w-px bg-slate-800" />

          {/* View Toggles */}
          <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setIsSplitView(true)}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                isSplitView ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Split View"
            >
              <Columns2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsSplitView(false)}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                !isSplitView ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Unified/Inline View"
            >
              <Rows2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Sidebar Toggle */}
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer focus:outline-none ${
              showSidebar 
                ? 'bg-slate-900 border-slate-700 text-slate-200' 
                : 'border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle differences list panel"
          >
            {showSidebar ? <PanelRightClose className="w-4 h-4" /> : <PanelRight className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main diff body layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Monaco DiffEditor */}
        <div className="flex-1 flex flex-col relative bg-[#070a13] overflow-hidden">
          <div className="h-7 flex justify-between items-center px-4 bg-slate-900/30 border-b border-slate-800/60 text-[10px] font-mono text-slate-500 select-none">
            <div className="flex items-center gap-1.5">
              <span>Original (Left)</span>
              <ChevronRight className="w-2.5 h-2.5" />
              <span>Modified (Right)</span>
            </div>
            <div>Language: {activeMode.toUpperCase()}</div>
          </div>

          <div className="flex-1 relative w-full h-[calc(100%-28px)]">
            <DiffEditor
              height="100%"
              width="100%"
              language={language}
              original={leftInput}
              modified={rightInput}
              onMount={handleEditorMount}
              options={{
                renderSideBySide: isSplitView,
                originalEditable: true,
                readOnly: false,
                minimap: { enabled: false },
                fontSize: 13,
                lineHeight: 20,
                fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, Consolas, monospace",
                automaticLayout: true,
                wordWrap: 'on',
                folding: true,
                tabSize: 2,
                scrollBeyondLastLine: false,
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
                renderLineHighlight: 'all',
              } as any}
            />
          </div>

          {/* Bottom parser alerts */}
          {(!leftParsed.success || !rightParsed.success) && (
            <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-col gap-2 max-w-lg">
              {!leftParsed.success && (
                <div className="p-3 rounded-xl border border-red-500/20 bg-red-950/80 backdrop-blur-md text-red-200 text-xs flex items-start gap-2.5 shadow-lg shadow-red-950/35">
                  <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold block mb-0.5">Left Source Invalid</span>
                    <div className="text-[11px] text-red-100/70 font-mono">{leftParsed.error.message}</div>
                  </div>
                </div>
              )}
              {!rightParsed.success && (
                <div className="p-3 rounded-xl border border-red-500/20 bg-red-950/80 backdrop-blur-md text-red-200 text-xs flex items-start gap-2.5 shadow-lg shadow-red-950/35">
                  <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold block mb-0.5">Right Source Invalid</span>
                    <div className="text-[11px] text-red-100/70 font-mono">{rightParsed.error.message}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Differences list panel */}
        {showSidebar && (
          <div className="w-[380px] shrink-0 border-l border-slate-900 bg-slate-950 flex flex-col z-10">
            <div className="h-10 flex items-center justify-between px-4 border-b border-slate-900 text-xs font-mono text-slate-400 select-none">
              <span className="font-semibold text-slate-200">CHANGED PATHS</span>
              <span className="text-[10px] text-slate-500 font-bold bg-slate-900 px-2 py-0.5 rounded-full">
                {diffList.length} total
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* How to use info */}
              <div className="rounded-xl border border-slate-900 bg-slate-950/50 p-3 text-xs text-slate-400 space-y-2 select-none">
                <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                  <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                  <span>How to navigate</span>
                </div>
                <p className="leading-relaxed">
                  Comparing <span className="text-slate-200 font-medium">Original</span> vs <span className="text-slate-200 font-medium">Modified</span>. Click any path below to instantly jump to that line in the editor.
                </p>
                <div className="flex items-center gap-3 pt-1 border-t border-slate-900/60">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-400/90" />
                    <span className="text-[10px] text-slate-400">Added</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400/90" />
                    <span className="text-[10px] text-slate-400">Changed</span>
                  </div>
                </div>
              </div>

              {!leftParsed.success || !rightParsed.success ? (
                <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-900 bg-slate-950/20 text-slate-500">
                  <Braces className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                  <p className="text-xs">Provide valid input in both editors to see diff breakdown.</p>
                </div>
              ) : diffList.length === 0 ? (
                <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-4 text-center select-none">
                  <Check className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <span className="text-xs font-semibold text-emerald-300 block mb-1">No Differences Detected</span>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Both documents are identical. Modify keys or values to analyze structural changes.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Search and Filters */}
                  <div className="rounded-xl border border-slate-900 bg-slate-950/40 p-3 space-y-3">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
                      <input
                        value={diffQuery}
                        onChange={(e) => setDiffQuery(e.target.value)}
                        placeholder="Search path..."
                        className="w-full bg-slate-950 border border-slate-900 text-xs text-slate-100 placeholder:text-slate-600 rounded-lg pl-8 pr-3 py-2 outline-none focus:border-blue-500/70 transition-all"
                      />
                    </div>

                    <div className="flex bg-slate-900 rounded-lg p-0.5 text-[11px] font-semibold">
                      <button
                        onClick={() => setDiffFilter('all')}
                        className={`flex-1 py-1 rounded-md transition-all cursor-pointer ${
                          diffFilter === 'all' 
                            ? 'bg-slate-800 text-white' 
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setDiffFilter('added')}
                        className={`flex-1 py-1 rounded-md transition-all cursor-pointer ${
                          diffFilter === 'added' 
                            ? 'bg-sky-500/10 text-sky-400 border border-sky-500/15' 
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Added ({counts.added})
                      </button>
                      <button
                        onClick={() => setDiffFilter('changed')}
                        className={`flex-1 py-1 rounded-md transition-all cursor-pointer ${
                          diffFilter === 'changed' 
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/15' 
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Changed ({counts.changed})
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono select-none">
                      <span>Matches: {filteredDiffList.length}</span>
                      {filteredDiffList.length > DIFF_CAP && (
                        <span>Showing top {DIFF_CAP}</span>
                      )}
                    </div>
                  </div>

                  {/* Results list */}
                  {filteredDiffList.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-500">
                      No paths match filter or search.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredDiffList.slice(0, DIFF_CAP).map((d) => {
                        const isAdded = d.status === 'added';
                        const badgeColor = isAdded
                          ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20';

                        const isSelected = selectedDiffPath === d.path;

                        return (
                          <button
                            key={d.path}
                            onClick={() => handlePickDiff(d.path)}
                            className={`w-full rounded-xl border text-left p-3 transition-all relative group flex flex-col gap-1.5 cursor-pointer ${
                              isSelected
                                ? 'bg-blue-600/10 border-blue-500/50 shadow-md shadow-blue-500/5'
                                : 'bg-slate-900/40 border-slate-900/60 hover:bg-slate-900/80 hover:border-slate-800'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 w-full">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${badgeColor}`}>
                                {isAdded ? 'ADDED' : 'CHANGED'}
                              </span>

                              {/* Copy button */}
                              <button
                                onClick={(e) => handleCopyPath(d.path, e)}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
                                title="Copy json path"
                              >
                                {copiedPath === d.path ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>

                            <div className="font-mono text-xs text-slate-100 break-all select-all">
                              {d.path}
                            </div>

                            <span className="text-[10.5px] text-slate-300 select-none leading-relaxed mt-0.5">
                              {getFriendlyDiffMessage(d.path, d.status, leftParsed.data, rightParsed.data)}
                            </span>
                          </button>
                        );
                      })}

                      {filteredDiffList.length > DIFF_CAP && (
                        <div className="text-[10px] text-slate-500 text-center py-2">
                          And {filteredDiffList.length - DIFF_CAP} more differences.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiffPage;
