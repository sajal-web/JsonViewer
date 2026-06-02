import React, { useRef, useEffect } from 'react';
import { Search, ChevronUp, ChevronDown, X, Info } from 'lucide-react';
import { useJsonStore } from '../store/useJsonStore';

export const SearchBar: React.FC = () => {
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    searchIndex,
    nextSearchMatch,
    prevSearchMatch,
  } = useJsonStore();

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on shortcut trigger
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      if (isCmdOrCtrl && e.key.toLowerCase() === 'f' && !e.shiftKey) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleClear = () => {
    setSearchQuery('');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        prevSearchMatch();
      } else {
        nextSearchMatch();
      }
    } else if (e.key === 'Escape') {
      inputRef.current?.blur();
    }
  };

  const totalResults = searchResults.length;
  const currentResultIndex = searchIndex >= 0 ? searchIndex + 1 : 0;

  return (
    <div className="bg-slate-900 border-b border-slate-800/80 px-4 py-2 flex items-center justify-between flex-shrink-0 select-none">
      <div className="relative flex-1 max-w-lg flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-slate-500" />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search keys or values... (Cmd + F / Enter to navigate)"
          className="w-full pl-9 pr-24 py-1.5 text-xs bg-slate-950/80 hover:bg-slate-950 border border-slate-800 hover:border-slate-700/80 focus:border-blue-500 text-slate-200 placeholder-slate-550 rounded-lg outline-none transition-all focus:ring-1 focus:ring-blue-500"
          id="search-input-field"
        />

        {/* Results indicator */}
        {searchQuery && (
          <div className="absolute right-2 flex items-center gap-1">
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded">
              {totalResults > 0 ? `${currentResultIndex}/${totalResults}` : '0 results'}
            </span>
            <button
              onClick={handleClear}
              className="text-slate-500 hover:text-slate-350 p-0.5 rounded cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 ml-4">
        {/* Navigation Buttons */}
        <button
          onClick={prevSearchMatch}
          disabled={totalResults === 0}
          className="p-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-800 disabled:opacity-30 disabled:pointer-events-none text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          title="Previous Match (Shift+Enter)"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={nextSearchMatch}
          disabled={totalResults === 0}
          className="p-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-800 disabled:opacity-30 disabled:pointer-events-none text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          title="Next Match (Enter)"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>

        <div className="hidden lg:flex items-center gap-1 text-[10px] text-slate-500 ml-2">
          <Info className="w-3 h-3 text-slate-650" />
          <span>Autofolds expanded to highlight matches</span>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
