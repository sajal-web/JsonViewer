import { create } from 'zustand';
import type { ValidationError, AppTheme, HistoryItem, SearchMatch, AppPage } from '../types';
import { parseJsonWithErrorInfo, parseYamlWithErrorInfo, jsonToYaml, yamlToJson, sortJson, jsonToTypeScript, jsonToLanguage } from '../utils/jsonParser';
import type { CodeLanguage } from '../utils/jsonParser';

import { DEFAULT_JSON_MOCK } from '../constants';

function escapeRegExp(query: string) {
  return query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findMatchesInText(text: string, query: string): SearchMatch[] {
  const escaped = escapeRegExp(query);
  const results: SearchMatch[] = [];

  const lines = text.split('\n');
  lines.forEach((lineText, lineIndex) => {
    let match: RegExpExecArray | null;
    const lineRegex = new RegExp(escaped, 'gi');
    while ((match = lineRegex.exec(lineText)) !== null) {
      results.push({
        id: `${lineIndex + 1}:${match.index + 1}:${match[0].length}`,
        matchType: 'value',
      });
      if (lineRegex.lastIndex === match.index) {
        lineRegex.lastIndex += 1;
      }
    }
  });

  return results;
}

function safeTypeOf(val: any): string {
  if (val === null) return 'null';
  if (Array.isArray(val)) return 'array';
  return typeof val;
}

function stablePrimitiveString(val: any): string {

  if (val === null) return 'null';
  return String(val);
}

function computeDiffByPath(prev: any, next: any): Record<string, 'added' | 'changed'> {
  const out: Record<string, 'added' | 'changed'> = {};
  if (prev === undefined || prev === null) {
    return next && typeof next === 'object' ? { '$': 'added' } : { '$': 'changed' };
  }

  const prevHas = new Set<string>();
  const nextHas = new Set<string>();

  // Only include leaves + structural nodes; cap to avoid huge maps

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

  // Added: exists in next but not prev
  for (const p of nextHas) {
    if (!prevHas.has(p)) out[p] = 'added';
  }

  // Changed: type or primitive value differs at same path
  function getByPath(root: any, path: string): any {
    if (path === '$') return root;
    // path formats: $.k, $.a.b, $[0], $.arr[0].x
    // We'll interpret token-by-token for safety.
    let cur = root;
    let i = 0;
    // remove leading $
    while (i < path.length && path[i] !== '$') i++;
    let s = path.slice(1); // remove first '$'
    // s starts with '.' or '['
    while (s.length > 0) {
      if (s[0] === '.') {
        s = s.slice(1);
        const m = /^[a-zA-Z0-9_\-]+/.exec(s);
        if (!m) return undefined;
        const key = m[0];
        cur = cur?.[key];
        s = s.slice(key.length);
      } else if (s[0] === '[') {
        s = s.slice(1);
        const idxStr = s.split(']')[0];
        const idx = Number(idxStr);
        cur = cur?.[idx];
        s = s.slice(idxStr.length + 1);
      } else {
        return undefined;
      }
    }
    return cur;
  }

  const changedAt: Set<string> = new Set();
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

    // Only compare primitives directly; for objects/arrays just mark if structure exists and we already have children paths
    if (typeA === 'array' || typeA === 'object') {
      // no-op (structural diffs handled by added paths)
      continue;
    }

    const primA = stablePrimitiveString(a);
    const primB = stablePrimitiveString(b);
    if (primA !== primB) {
      out[p] = 'changed';
      changedAt.add(p);
    }
  }

  // Bubble up changes to ancestors so parent rows are marked.
  for (const p of changedAt) {
    // '$.a.b[0].c' => ancestors
    let cur = p;
    while (cur.includes('.')) {
      const lastDot = cur.lastIndexOf('.');
      cur = cur.slice(0, lastDot);
      if (cur && cur !== '$') {
        if (!out[cur]) out[cur] = 'changed';
      }
    }
    // array ancestors
    cur = p;
    while (cur.includes('[')) {
      const lastBracket = cur.lastIndexOf('[');
      cur = cur.slice(0, lastBracket);
      if (cur && cur !== '$') {
        if (!out[cur]) out[cur] = 'changed';
      }
    }
    if (!out['$']) out['$'] = 'changed';
  }

  // Bubble up added nodes to ancestors as changed to indicate structural change.
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

interface JsonStore {

  rawInput: string;
  parsedJson: any;
  activeMode: 'json' | 'yaml';
  theme: AppTheme;
  expandedPaths: Set<string>;
  searchQuery: string;
  searchResults: SearchMatch[];
  searchIndex: number;
  validationError: ValidationError | null;
  isSidebarOpen: boolean;
  splitRatio: number;
  history: HistoryItem[];
  isParsing: boolean;
  activePage: AppPage;

  // Diff mode: highlight added/changed nodes vs previous successfully parsed document
  isDiffEnabled: boolean;
  prevParsedJson: any | null;
  diffByPath: Record<string, 'added' | 'changed'>;

  setDiffEnabled: (enabled: boolean) => void;

  setRawInput: (text: string, bypassWorker?: boolean) => void;


  setTheme: (theme: AppTheme) => void;
  setActiveMode: (mode: 'json' | 'yaml') => void;
  setSplitRatio: (ratio: number) => void;
  toggleSidebar: () => void;
  togglePath: (path: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  expandToDepth: (depth: number) => void;
  formatJson: () => void;
  minifyJson: () => void;
  clearAll: () => void;
  setSearchQuery: (query: string) => void;
  nextSearchMatch: () => void;
  prevSearchMatch: () => void;
  addHistoryItem: (label: string, data: string) => void;
  clearHistory: () => void;
  setActivePage: (page: AppPage) => void;
  sortKeys: () => void;
  exportToTypeScript: () => string | null;
  exportToLanguage: (language: CodeLanguage) => string | null;
  burstTrigger: { x: number; y: number; time: number } | null;
  triggerBurst: (x: number, y: number) => void;
}

// Instantiate worker with fallback
let worker: Worker | null = null;
if (typeof window !== 'undefined' && window.Worker) {

  try {
    worker = new Worker(new URL('../workers/json.worker.ts', import.meta.url), { type: 'module' });
  } catch (e) {
    console.warn("Could not load worker, falling back to main-thread execution:", e);
  }
}

export const useJsonStore = create<JsonStore>((set, get) => {
  // Handle worker messages
  if (worker) {
    worker.onmessage = (event: MessageEvent) => {
      const { action, payload } = event.data;
      if (action === 'parseResult') {
        const { success, data, error } = payload;
        if (success) {
          // Check node count to decide expansion
          const expanded = new Set<string>(['$']);
          if (data) {
            // Expand first level by default
            if (typeof data === 'object') {
              if (Array.isArray(data)) {
                for (let i = 0; i < Math.min(data.length, 20); i++) {
                  expanded.add(`$[${i}]`);
                }
              } else {
                Object.keys(data).forEach(k => expanded.add(`$.${k}`));
              }
            }
          }
          set({
            parsedJson: data,
            validationError: null,
            expandedPaths: expanded,
            isParsing: false,
            prevParsedJson: get().parsedJson,
            diffByPath: get().isDiffEnabled ? computeDiffByPath(get().parsedJson, data) : {},
          });

          get().addHistoryItem(
            get().activeMode === 'json' ? 'Parsed JSON' : 'Parsed YAML',
            get().rawInput
          );
        } else {
          set({
            validationError: error,
            isParsing: false,
          });
        }
      }
    };
  }

  return {
    rawInput: JSON.stringify(DEFAULT_JSON_MOCK, null, 2),
    parsedJson: DEFAULT_JSON_MOCK,
    activeMode: 'json',
    theme: 'dark',
    expandedPaths: new Set<string>(['$', '$.performance', '$.settings', '$.metadata']),
    searchQuery: '',
    searchResults: [],
    searchIndex: -1,
    validationError: null,
    isSidebarOpen: false,
    splitRatio: 0.45,
    history: [],
    isParsing: false,
    activePage: 'editor',

    isDiffEnabled: false,
    prevParsedJson: null,
    diffByPath: {},

    setDiffEnabled: (enabled: boolean) => {
      set({ isDiffEnabled: enabled });
    },

    setRawInput: (text: string, bypassWorker = false) => {

      set({ rawInput: text });

      const searchQuery = get().searchQuery;
      if (searchQuery.trim()) {
        const results = findMatchesInText(text, searchQuery);
        set({
          searchResults: results,
          searchIndex: results.length > 0 ? 0 : -1,
        });
      }

      if (!text.trim()) {
        set({ parsedJson: null, validationError: null, searchResults: [], searchIndex: -1 });
        return;
      }

      const mode = get().activeMode;
      const isLargeFile = text.length > 5 * 1024 * 1024; // > 5 MB

      if (isLargeFile && worker && !bypassWorker) {
        set({ isParsing: true });
        worker.postMessage({
          action: 'parse',
          payload: { text, mode },
        });
      } else {
        // Sync parsing on main thread for small files or bypass
        const parseResult =
          mode === 'json'
            ? parseJsonWithErrorInfo(text)
            : parseYamlWithErrorInfo(text);

        if (parseResult.success) {
          const oldData = get().parsedJson;
          const newData = parseResult.data;
          let expanded = new Set<string>(get().expandedPaths);

          const isOldObj = oldData && typeof oldData === 'object';
          const isNewObj = newData && typeof newData === 'object';

          // Determine if we should reset expanded paths (e.g. if root keys or structure changed,
          // or if the previous expansion size was small/empty)
          let shouldResetExpansion = false;

          if (!isOldObj || !isNewObj || Array.isArray(oldData) !== Array.isArray(newData)) {
            shouldResetExpansion = true;
          } else if (isNewObj && !Array.isArray(newData)) {
            const oldKeys = Object.keys(oldData);
            const newKeys = Object.keys(newData);
            const keysChanged = oldKeys.length !== newKeys.length || oldKeys.some((k, i) => k !== newKeys[i]);
            if (keysChanged) {
              shouldResetExpansion = true;
            }
          } else if (isNewObj && Array.isArray(newData)) {
            if (oldData.length !== newData.length) {
              shouldResetExpansion = true;
            }
          }

          if (shouldResetExpansion || expanded.size <= 1) {
            expanded = new Set<string>(['$']);
            if (isNewObj) {
              if (Array.isArray(newData)) {
                for (let i = 0; i < Math.min(newData.length, 20); i++) {
                  expanded.add(`$[${i}]`);
                }
              } else {
                Object.keys(newData).forEach(k => expanded.add(`$.${k}`));
              }
            }
          }

          set({
            parsedJson: newData,
            validationError: null,
            expandedPaths: expanded,
            prevParsedJson: oldData,
            diffByPath: get().isDiffEnabled ? computeDiffByPath(oldData, newData) : {},
          });

        } else {
          set({
            validationError: parseResult.error,
          });
        }
      }
    },

    setTheme: (theme) => {
      set({ theme });
      if (typeof document !== 'undefined') {
        const root = document.documentElement;
        if (theme === 'light') {
          root.classList.add('light');
        } else {
          root.classList.remove('light');
        }
      }
    },

    setActiveMode: (mode) => {
      const currentMode = get().activeMode;
      if (currentMode === mode) return;

      const raw = get().rawInput;
      if (!raw.trim()) {
        set({ activeMode: mode });
        return;
      }

      try {
        let converted = '';
        if (mode === 'yaml') {
          // JSON -> YAML
          converted = jsonToYaml(raw);
        } else {
          // YAML -> JSON
          converted = yamlToJson(raw);
        }
        set({ activeMode: mode, rawInput: converted, validationError: null });
        get().setRawInput(converted, true);
      } catch (err: any) {
        // Just switch mode but display the validation error
        set({
          activeMode: mode,
          validationError: { message: err.message || 'Conversion failed' },
        });
      }
    },

    setSplitRatio: (ratio) => {
      set({ splitRatio: Math.max(0.2, Math.min(0.8, ratio)) });
    },

    toggleSidebar: () => {
      set((state) => ({ isSidebarOpen: !state.isSidebarOpen }));
    },

    togglePath: (path) => {
      const expanded = new Set(get().expandedPaths);
      if (expanded.has(path)) {
        expanded.delete(path);
      } else {
        expanded.add(path);
      }
      set({ expandedPaths: expanded });
    },

    expandAll: () => {
      const data = get().parsedJson;
      if (!data) return;

      const expanded = new Set<string>();
      let nodeCount = 0;
      const LIMIT = 5000; // Protection limit

      function traverse(val: any, path: string) {
        if (nodeCount > LIMIT) return;
        expanded.add(path);
        nodeCount++;

        if (val && typeof val === 'object') {
          if (Array.isArray(val)) {
            for (let i = 0; i < val.length; i++) {
              traverse(val[i], `${path}[${i}]`);
            }
          } else {
            Object.keys(val).forEach((k) => {
              const childPath = path === '$' ? `$.${k}` : `${path}.${k}`;
              traverse(val[k], childPath);
            });
          }
        }
      }

      traverse(data, '$');
      set({ expandedPaths: expanded });
    },

    collapseAll: () => {
      set({ expandedPaths: new Set(['$']) });
    },

    expandToDepth: (maxDepth) => {
      const data = get().parsedJson;
      if (!data) return;

      const expanded = new Set<string>();

      function traverse(val: any, path: string, depth: number) {
        if (depth > maxDepth) return;
        expanded.add(path);

        if (val && typeof val === 'object') {
          if (Array.isArray(val)) {
            for (let i = 0; i < val.length; i++) {
              traverse(val[i], `${path}[${i}]`, depth + 1);
            }
          } else {
            Object.keys(val).forEach((k) => {
              const childPath = path === '$' ? `$.${k}` : `${path}.${k}`;
              traverse(val[k], childPath, depth + 1);
            });
          }
        }
      }

      traverse(data, '$', 0);
      set({ expandedPaths: expanded });
    },

    formatJson: () => {
      const raw = get().rawInput;
      const mode = get().activeMode;
      if (!raw.trim()) return;

      try {
        if (mode === 'json') {
          const parsed = JSON.parse(raw);
          const formatted = JSON.stringify(parsed, null, 2);
          set({ rawInput: formatted, validationError: null });
        } else {
          // YAML format
          const parsed = parseYamlWithErrorInfo(raw);
          if (parsed.success) {
            const formatted = jsonToYaml(JSON.stringify(parsed.data));
            set({ rawInput: formatted, validationError: null });
          }
        }
      } catch (err: any) {
        set({ validationError: { message: `Format failed: ${err.message}` } });
      }
    },

    minifyJson: () => {
      const raw = get().rawInput;
      const mode = get().activeMode;
      if (!raw.trim()) return;

      try {
        if (mode === 'json') {
          const parsed = JSON.parse(raw);
          const minified = JSON.stringify(parsed);
          set({ rawInput: minified, validationError: null });
        } else {
          // YAML doesn't have standard "minify", we convert to single-line JSON or compact format
          const parsed = parseYamlWithErrorInfo(raw);
          if (parsed.success) {
            const minified = JSON.stringify(parsed.data);
            set({ rawInput: minified, activeMode: 'json', validationError: null });
          }
        }
      } catch (err: any) {
        set({ validationError: { message: `Minify failed: ${err.message}` } });
      }
    },

    clearAll: () => {
      set({
        rawInput: '',
        parsedJson: null,
        validationError: null,
        expandedPaths: new Set(['$']),
        searchQuery: '',
        searchResults: [],
        searchIndex: -1,
      });
    },



    setSearchQuery: (query) => {
      set({ searchQuery: query });
      const rawText = get().rawInput;
      if (!query.trim()) {
        set({ searchResults: [], searchIndex: -1 });
        return;
      }

      const results = findMatchesInText(rawText, query);
      set({
        searchResults: results,
        searchIndex: results.length > 0 ? 0 : -1,
      });
    },

    nextSearchMatch: () => {
      const { searchResults, searchIndex } = get();
      if (searchResults.length === 0) return;
      const nextIndex = (searchIndex + 1) % searchResults.length;
      set({ searchIndex: nextIndex });
    },

    prevSearchMatch: () => {
      const { searchResults, searchIndex } = get();
      if (searchResults.length === 0) return;
      const prevIndex = (searchIndex - 1 + searchResults.length) % searchResults.length;
      set({ searchIndex: prevIndex });
    },

    addHistoryItem: (label, data) => {
      const maxHistory = 15;
      const item: HistoryItem = {
        id: Math.random().toString(36).substring(7),
        timestamp: Date.now(),
        label,
        data,
      };

      set((state) => {
        const filtered = state.history.filter((h) => h.data !== data);
        return {
          history: [item, ...filtered].slice(0, maxHistory),
        };
      });
    },

    clearHistory: () => {
      set({ history: [] });
    },
    setActivePage: (page) => {
      set({ activePage: page, isSidebarOpen: false });
    },
    sortKeys: () => {
      const parsed = get().parsedJson;
      if (!parsed) return;
      try {
        const sorted = sortJson(parsed);
        const text = get().activeMode === 'json' ? JSON.stringify(sorted, null, 2) : jsonToYaml(JSON.stringify(sorted));
        set({ parsedJson: sorted, rawInput: text, validationError: null });
        get().addHistoryItem('Sorted Keys', text);
      } catch (err: any) {
        set({ validationError: { message: `Sort keys failed: ${err.message}` } });
      }
    },
    exportToTypeScript: () => {
      const parsed = get().parsedJson;
      if (!parsed) return null;
      try {
        return jsonToTypeScript(parsed);
      } catch (err: any) {
        set({ validationError: { message: `TS Export failed: ${err.message}` } });
        return null;
      }
    },
    exportToLanguage: (language) => {
      const parsed = get().parsedJson;
      if (!parsed) return null;
      try {
        return jsonToLanguage(parsed, language);
      } catch (err: any) {
        set({ validationError: { message: `${language} export failed: ${err.message}` } });
        return null;
      }
    },
    burstTrigger: null,
    triggerBurst: (x, y) => {
      set({ burstTrigger: { x, y, time: Date.now() } });
    },
  };
});
