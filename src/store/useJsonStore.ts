import { create } from 'zustand';
import type { ValidationError, AppTheme, HistoryItem, SearchMatch } from '../types';
import { parseJsonWithErrorInfo, parseYamlWithErrorInfo, jsonToYaml, yamlToJson } from '../utils/jsonParser';

import { getPathsMatchingSearch } from '../utils/treeUtils';
import { DEFAULT_JSON_MOCK } from '../constants';

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
  loadExample: () => void;
  setSearchQuery: (query: string) => void;
  nextSearchMatch: () => void;
  prevSearchMatch: () => void;
  addHistoryItem: (label: string, data: string) => void;
  clearHistory: () => void;
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
              Object.keys(data).forEach(k => expanded.add(`$.${k}`));
            }
          }
          set({
            parsedJson: data,
            validationError: null,
            expandedPaths: expanded,
            isParsing: false,
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

    setRawInput: (text: string, bypassWorker = false) => {
      set({ rawInput: text });

      if (!text.trim()) {
        set({ parsedJson: null, validationError: null });
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
          const expanded = new Set<string>(get().expandedPaths);
          if (expanded.size <= 1) {
            expanded.add('$');
            const data = parseResult.data;
            if (data && typeof data === 'object') {
              Object.keys(data).forEach(k => expanded.add(`$.${k}`));
            }
          }
          set({
            parsedJson: parseResult.data,
            validationError: null,
            expandedPaths: expanded,
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

    loadExample: () => {
      const mockStr = JSON.stringify(DEFAULT_JSON_MOCK, null, 2);
      set({
        rawInput: mockStr,
        parsedJson: DEFAULT_JSON_MOCK,
        validationError: null,
        activeMode: 'json',
        expandedPaths: new Set<string>(['$', '$.performance', '$.settings', '$.metadata']),
        searchQuery: '',
        searchResults: [],
        searchIndex: -1,
      });
    },

    setSearchQuery: (query) => {
      set({ searchQuery: query });
      const data = get().parsedJson;
      if (!query || !data) {
        set({ searchResults: [], searchIndex: -1 });
        return;
      }

      // Find paths matching search
      const paths = getPathsMatchingSearch(data, query);
      const results: SearchMatch[] = Array.from(paths)
        .filter(path => path !== '$') // skip root level generic match unless it specifically matches
        .map(path => ({ id: path, matchType: 'both' }));

      // Add parents of matches to expandedPaths so the matches are visible!
      const expanded = new Set(get().expandedPaths);
      paths.forEach(p => expanded.add(p));

      set({
        searchResults: results,
        searchIndex: results.length > 0 ? 0 : -1,
        expandedPaths: expanded,
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
  };
});
