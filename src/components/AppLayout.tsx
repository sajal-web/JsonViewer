import { Menu, Loader2 } from 'lucide-react';
import { useJsonStore } from '../store/useJsonStore';
import Sidebar from './Sidebar';
import Toolbar from './Toolbar';
import SearchBar from './SearchBar';
import MonacoEditorPanel from './MonacoEditorPanel';
import JsonTreeView from './JsonTreeView';
import SplitPane from './SplitPane';
import ErrorConsole from './ErrorConsole';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';

export const AppLayout: React.FC = () => {
  const {
    isParsing,
    splitRatio,
    setSplitRatio,
    toggleSidebar,
    rawInput,
    formatJson,
    loadExample,
  } = useJsonStore();


  const triggerFileUploadClick = () => {
    const fileInput = document.getElementById('hidden-file-input') as HTMLInputElement;
    fileInput?.click();
  };

  const handleDownloadTrigger = () => {
    const downloadBtn = document.getElementById('download-btn') as HTMLButtonElement;
    downloadBtn?.click();
  };

  const triggerSearchFocus = () => {
    const searchInput = document.getElementById('search-input-field') as HTMLInputElement;
    searchInput?.focus();
    searchInput?.select();
  };

  // Bind system-wide developer keyboard shortcuts
  useKeyboardShortcuts({
    onSave: handleDownloadTrigger,
    onSearch: triggerSearchFocus,
    onFormat: formatJson,
    onUpload: triggerFileUploadClick,
    onLoadMock: loadExample,
  });

  const handleSplitRatioChange = (ratio: number) => {
    setSplitRatio(ratio);
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-950 dark:bg-slate-950 light:bg-slate-50 text-slate-100 overflow-hidden relative">
      {/* Drawer Sidebar */}
      <Sidebar />

      {/* Main Top Header Branding */}
      <header className="h-12 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md px-4 flex items-center justify-between flex-shrink-0 z-30 select-none">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800 text-slate-400 hover:text-slate-100 transition-all cursor-pointer focus:outline-none"
            title="Open side panel dashboard"
            id="sidebar-toggle-btn"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Logo Brand */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-[10px] font-bold text-white shadow-md shadow-blue-500/25">
              {"{}"}
            </div>
            <span className="font-bold text-slate-100 text-sm tracking-tight flex items-center gap-1.5">
              JSON Viewer Pro
              <span className="text-[9px] font-semibold bg-blue-500/10 border border-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full">
                v1.0
              </span>
            </span>
          </div>
        </div>

        {/* Global Loading Parsing/Worker Indicator */}
        <div className="flex items-center gap-3">
          {isParsing && (
            <div className="flex items-center gap-1.5 text-xs text-blue-400 font-mono animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Parsing large file...</span>
            </div>
          )}

          {/* Quick Stats Summary */}
          {!isParsing && rawInput.trim() && (
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-500">
                {rawInput.length} chars
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-800" />
              <span className="text-[10px] font-mono text-slate-500">
                {rawInput.split('\n').length} lines
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Primary Editor Workspace Container */}
      <main className="flex-1 w-full flex flex-col overflow-hidden relative">
        {/* Row 2: Developer Tooling Actions */}
        <Toolbar />

        {/* Row 3: Live search bar */}
        <SearchBar />

        {/* Row 4: Resizable Splitted Editor/Tree Panel */}
        <div className="flex-1 w-full overflow-hidden flex">
          <SplitPane
            leftPanel={<MonacoEditorPanel />}
            rightPanel={<JsonTreeView />}
            ratio={splitRatio}
            onChange={handleSplitRatioChange}
          />
        </div>

        {/* Bottom Console Panel */}
        <ErrorConsole />
      </main>
    </div>
  );
};

export default AppLayout;
