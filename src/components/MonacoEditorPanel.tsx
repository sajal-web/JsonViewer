import { useEffect, useRef } from 'react';
import Editor, { loader } from '@monaco-editor/react';
import type { Monaco } from '@monaco-editor/react';
import { useJsonStore } from '../store/useJsonStore';


// Custom theme definitions for Monaco Editor
const defineMonacoThemes = (monaco: Monaco) => {
  // Slate VSCode Dark Theme
  monaco.editor.defineTheme('slate-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'string', foreground: 'E2E8F0' }, // slate-200
      { token: 'string.key', foreground: '38BDF8' }, // sky-400
      { token: 'number', foreground: 'F43F5E' }, // rose-500
      { token: 'keyword', foreground: '60A5FA' }, // blue-400
      { token: 'keyword.json', foreground: '60A5FA' },
      { token: 'delimiter.comma.json', foreground: '94A3B8' }, // slate-400
      { token: 'delimiter.bracket.json', foreground: '94A3B8' },
    ],
    colors: {
      'editor.background': '#0b0f19', // Matches our dark slate-950 base background
      'editor.foreground': '#F8FAFC',
      'editor.lineHighlightBackground': '#1e293b50', // slate-800/30
      'editorLineNumber.foreground': '#475569',
      'editorLineNumber.activeForeground': '#38BDF8',
      'editor.selectionBackground': '#38bdf825',
      'editorCursor.foreground': '#38BDF8',
    },
  });

  // Clean Slate Light Theme
  monaco.editor.defineTheme('slate-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'string', foreground: '334155' }, // slate-700
      { token: 'string.key', foreground: '0284C7' }, // sky-600
      { token: 'number', foreground: 'E11D48' }, // rose-600
      { token: 'keyword', foreground: '2563EB' }, // blue-600
    ],
    colors: {
      'editor.background': '#ffffff',
      'editor.foreground': '#0f172a',
      'editor.lineHighlightBackground': '#f1f5f990',
      'editorLineNumber.foreground': '#94a3b8',
      'editorLineNumber.activeForeground': '#0284c7',
      'editor.selectionBackground': '#0284c720',
      'editorCursor.foreground': '#0284C7',
    },
  });
};

// Hook up the loader
loader.init().then((monaco) => {
  defineMonacoThemes(monaco);
});

export const MonacoEditorPanel = () => {
  const { rawInput, setRawInput, activeMode, theme, validationError, searchResults, searchIndex } = useJsonStore();
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const decorationIdsRef = useRef<string[]>([]);

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setRawInput(value);
    }
  };

  // Switch Monaco themes dynamically based on store theme
  useEffect(() => {
    if (monacoRef.current) {
      monacoRef.current.editor.setTheme(theme === 'dark' ? 'slate-dark' : 'slate-light');
    }
  }, [theme]);

  // Handle displaying validation error marker decorations inside Monaco Editor
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;

    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const model = editor.getModel();

    if (!model) return;

    if (validationError && validationError.line) {
      const line = validationError.line;
      const column = validationError.column || 1;

      // Set markers (squiggles)
      monaco.editor.setModelMarkers(model, 'json-validation', [
        {
          startLineNumber: line,
          startColumn: column,
          endLineNumber: line,
          endColumn: column + 10, // Highlight a small chunk after the column error
          message: validationError.message,
          severity: monaco.MarkerSeverity.Error,
        },
      ]);
    } else {
      // Clear markers
      monaco.editor.setModelMarkers(model, 'json-validation', []);
    }
  }, [validationError]);

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const model = editor.getModel();
    if (!model) return;

    const decorations = searchResults
      .map((match, index) => {
        const parts = match.id.split(':').map(Number);
        if (parts.length !== 3) return null;
        const [lineNumber, startColumn, length] = parts;
        return {
          range: new monaco.Range(lineNumber, startColumn, lineNumber, startColumn + length),
          options: {
            inlineClassName: index === searchIndex ? 'search-match-active' : 'search-match',
          },
        };
      })
      .filter(Boolean);

    decorationIdsRef.current = editor.deltaDecorations(decorationIdsRef.current, decorations as any);

    if (searchIndex >= 0 && searchResults[searchIndex]) {
      const [lineNumber, startColumn, length] = searchResults[searchIndex].id.split(':').map(Number);
      const range = new monaco.Range(lineNumber, startColumn, lineNumber, startColumn + length);
      editor.revealRangeInCenter(range, monaco.editor.ScrollType.Smooth);
      editor.setSelection(range);
    }
  }, [searchResults, searchIndex]);

  return (
    <div className="flex-1 w-full h-full relative overflow-hidden flex flex-col bg-[#0b0f19] dark:bg-[#0b0f19] light:bg-white border-r border-slate-800">
      <div className="h-8 flex items-center px-4 bg-slate-900/50 border-b border-slate-800/80 text-xs font-mono text-slate-400 select-none flex-shrink-0">
        <span>EDITOR ({activeMode.toUpperCase()})</span>
      </div>
      <div className="flex-1 w-full relative">
        <Editor
          height="100%"
          language={activeMode === 'json' ? 'json' : 'yaml'}
          value={rawInput}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          theme={theme === 'dark' ? 'slate-dark' : 'slate-light'}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineHeight: 20,
            lineNumbers: 'on',
            fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, Consolas, monospace",
            fontLigatures: true,
            automaticLayout: true,
            wordWrap: 'on',
            folding: true,
            tabSize: 2,
            scrollBeyondLastLine: false,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            renderLineHighlight: 'all',
            padding: { top: 12, bottom: 12 },
          }}
        />
      </div>
    </div>
  );
};

export default MonacoEditorPanel;
