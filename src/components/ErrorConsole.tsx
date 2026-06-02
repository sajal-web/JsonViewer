import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Terminal } from 'lucide-react';
import { useJsonStore } from '../store/useJsonStore';
import { cn } from '../utils/cn';

export const ErrorConsole: React.FC = () => {
  const { validationError, parsedJson, activeMode } = useJsonStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleConsole = () => setIsExpanded(!isExpanded);

  const modeUpper = activeMode.toUpperCase();

  return (
    <div
      className={cn(
        "border-t border-slate-800 bg-[#070b13] dark:bg-[#070b13] light:bg-slate-50 transition-all flex flex-col flex-shrink-0 select-none",
        isExpanded ? "h-40" : "h-9"
      )}
    >
      {/* Console Header Bar */}
      <div
        onClick={toggleConsole}
        className="h-9 px-4 flex items-center justify-between border-b border-slate-900/60 cursor-pointer hover:bg-slate-900/40 text-xs font-mono"
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-400 font-semibold uppercase tracking-wider">Console Panel</span>

          <span className="w-px h-3 bg-slate-800" />

          {/* Status Indicator */}
          {validationError ? (
            <div className="flex items-center gap-1 text-rose-500 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Invalid {modeUpper} (Line {validationError.line}:{validationError.column})</span>
            </div>
          ) : parsedJson ? (
            <div className="flex items-center gap-1 text-emerald-500 font-medium animate-pulse">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{modeUpper} Syntax Valid</span>
            </div>
          ) : (
            <span className="text-slate-500 italic">No document parsed</span>
          )}
        </div>

        <button className="text-slate-500 hover:text-slate-300">
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded Console Body */}
      {isExpanded && (
        <div className="flex-1 p-4 overflow-y-auto font-mono text-xs">
          {validationError ? (
            <div className="space-y-2 text-rose-400">
              <div className="flex items-start gap-2">
                <span className="bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded text-[10px] text-rose-500 font-semibold flex-shrink-0 mt-0.5">
                  ERROR
                </span>
                <span className="leading-5 font-semibold text-slate-200">
                  {validationError.message}
                </span>
              </div>
              <div className="pl-14 text-slate-450 space-y-1">
                <p>
                  📍 Location:{' '}
                  <strong className="text-slate-350">
                    Line {validationError.line}, Column {validationError.column}
                  </strong>
                </p>
                <p className="text-[10px] text-slate-500 max-w-xl">
                  💡 Hint: Review the lines preceding {validationError.line}. A missing comma, bracket, quotes, or trailing comma is the most common cause.
                </p>
              </div>
            </div>
          ) : parsedJson ? (
            <div className="text-emerald-400 space-y-2">
              <div className="flex items-start gap-2">
                <span className="bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] text-emerald-500 font-semibold flex-shrink-0 mt-0.5">
                  SUCCESS
                </span>
                <span className="leading-5 font-semibold text-slate-200">
                  Congratulations! No syntax compilation errors were found in this {modeUpper} workspace.
                </span>
              </div>
              <div className="pl-18 text-slate-450 space-y-1">
                <p>🎯 Structure is fully parsed and virtual tree model is generated.</p>
                <p>⚡ Rendered nodes cache is fully optimized.</p>
              </div>
            </div>
          ) : (
            <span className="text-slate-600 italic">Console output empty. Write code or load a sample to inspect results.</span>
          )}
        </div>
      )}
    </div>
  );
};

export default ErrorConsole;
