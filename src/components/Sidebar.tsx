import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  History,
  Keyboard,
  BarChart3,
  Trash2,
  FileCode2,
  Calendar,
  FileDown,
} from 'lucide-react';
import { useJsonStore } from '../store/useJsonStore';
import { SHORTCUTS } from '../constants';

export const Sidebar = () => {
  const {
    isSidebarOpen,
    toggleSidebar,
    history,
    clearHistory,
    rawInput,
    parsedJson,
    setRawInput,
  } = useJsonStore();

  // Calculate live JSON statistics
  const stats = useMemo(() => {
    if (!parsedJson) return { size: 0, lines: 0, keys: 0, depth: 0 };

    let keysCount = 0;
    let maxDepth = 0;

    function getDepthAndKeys(val: any, currentDepth: number) {
      if (currentDepth > maxDepth) maxDepth = currentDepth;

      if (val && typeof val === 'object') {
        if (Array.isArray(val)) {
          keysCount += val.length;
          for (let i = 0; i < val.length; i++) {
            getDepthAndKeys(val[i], currentDepth + 1);
          }
        } else {
          const keys = Object.keys(val);
          keysCount += keys.length;
          keys.forEach((k) => {
            getDepthAndKeys(val[k], currentDepth + 1);
          });
        }
      }
    }

    getDepthAndKeys(parsedJson, 1);

    return {
      size: new Blob([rawInput]).size,
      lines: rawInput.split('\n').length,
      keys: keysCount,
      depth: maxDepth,
    };
  }, [parsedJson, rawInput]);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleHistoryItemClick = (data: string) => {
    setRawInput(data);
  };

  return (
    <AnimatePresence>
      {isSidebarOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
            className="absolute inset-0 bg-black z-40"
          />

          {/* Sidebar Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="absolute inset-y-0 left-0 w-80 bg-slate-950/95 border-r border-slate-800 z-50 flex flex-col shadow-2xl backdrop-blur-lg select-none"
          >
            {/* Header */}
            <div className="h-14 px-4 border-b border-slate-800/80 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-5 h-5 text-blue-500" />
                <span className="font-semibold text-slate-100 text-sm">Dashboard Info</span>
              </div>
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800 text-slate-400 hover:text-slate-200 transition-all cursor-pointer focus:outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Stats Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-400 font-semibold text-xs uppercase tracking-wider">
                  <BarChart3 className="w-4 h-4 text-blue-400" />
                  <span>Document Stats</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-900/60 border border-slate-900/85 p-2.5 rounded-lg">
                    <p className="text-[10px] text-slate-500 uppercase font-mono">File Size</p>
                    <p className="font-bold text-slate-250 mt-1 font-mono">{formatSize(stats.size)}</p>
                  </div>
                  <div className="bg-slate-900/60 border border-slate-900/85 p-2.5 rounded-lg">
                    <p className="text-[10px] text-slate-500 uppercase font-mono">Total Lines</p>
                    <p className="font-bold text-slate-250 mt-1 font-mono">{stats.lines}</p>
                  </div>
                  <div className="bg-slate-900/60 border border-slate-900/85 p-2.5 rounded-lg">
                    <p className="text-[10px] text-slate-500 uppercase font-mono">Structural Keys</p>
                    <p className="font-bold text-slate-250 mt-1 font-mono">{stats.keys}</p>
                  </div>
                  <div className="bg-slate-900/60 border border-slate-900/85 p-2.5 rounded-lg">
                    <p className="text-[10px] text-slate-500 uppercase font-mono">Max Depth</p>
                    <p className="font-bold text-slate-250 mt-1 font-mono">{stats.depth}</p>
                  </div>
                </div>
              </div>

              {/* History logs section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-400 font-semibold text-xs uppercase tracking-wider">
                    <History className="w-4 h-4 text-violet-400" />
                    <span>Workspace History</span>
                  </div>
                  {history.length > 0 && (
                    <button
                      onClick={clearHistory}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-rose-500/10 transition-colors flex items-center gap-1 text-[10px] font-semibold cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {history.length === 0 ? (
                    <div className="text-center p-4 border border-dashed border-slate-900 rounded-lg text-slate-600 text-xs">
                      No logs in this session.
                    </div>
                  ) : (
                    history.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleHistoryItemClick(item.data)}
                        className="p-2 border border-slate-900 hover:border-slate-800/80 bg-slate-900/35 hover:bg-slate-900 rounded-lg cursor-pointer flex items-center justify-between text-xs transition-all group"
                      >
                        <div className="truncate pr-2">
                          <p className="text-slate-300 truncate font-medium">{item.label}</p>
                          <div className="flex items-center gap-1 text-[9px] text-slate-500 mt-0.5">
                            <Calendar className="w-2.5 h-2.5" />
                            <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                          </div>
                        </div>
                        <FileDown className="w-3.5 h-3.5 text-slate-600 group-hover:text-blue-400 flex-shrink-0 transition-colors" />
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Shortcuts references */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-400 font-semibold text-xs uppercase tracking-wider">
                  <Keyboard className="w-4 h-4 text-emerald-400" />
                  <span>Developer Hotkeys</span>
                </div>
                <div className="border border-slate-900/60 rounded-lg overflow-hidden divide-y divide-slate-900/80 bg-slate-950/40 text-xs">
                  {SHORTCUTS.map((s, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between">
                      <span className="text-slate-400">{s.action}</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-mono">
                        {s.keys}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;
