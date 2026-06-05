import { useState, memo } from 'react';
import type { CSSProperties, MouseEvent } from 'react';
import { ChevronRight, ChevronDown, Copy, Link, Check } from 'lucide-react';
import type { FlatNode } from '../types';
import { cn } from '../utils/cn';

interface JsonNodeProps {
  node: FlatNode;
  style?: CSSProperties;
  isSearched: boolean;
  isHighlighted: boolean;
  diffStatus?: 'added' | 'changed';
  onToggle: (path: string) => void;
  onCopyPath: (path: string) => void;
  onCopyValue: (value: any) => void;
}


export const JsonNode = memo(({
  node,
  style,
  isSearched,
  isHighlighted,
  diffStatus,
  onToggle,
  onCopyPath,
  onCopyValue,
}: JsonNodeProps) => {

  const [copiedValue, setCopiedValue] = useState(false);
  const [copiedPath, setCopiedPath] = useState(false);

  const handleCopyValue = (e: MouseEvent) => {
    e.stopPropagation();
    onCopyValue(node.value);
    setCopiedValue(true);
    setTimeout(() => setCopiedValue(false), 1500);
  };

  const handleCopyPath = (e: MouseEvent) => {
    e.stopPropagation();
    onCopyPath(node.id);
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 1500);
  };

  // Render values based on type
  const renderValue = () => {
    if (node.hasChildren) {
      if (node.type === 'object') {
        return (
          <span className="text-slate-400 text-xs">
            {`{ `}
            <span className="text-sky-400 font-semibold">{node.size || 0}</span>
            {` keys }`}
          </span>
        );
      } else {
        return (
          <span className="text-slate-400 text-xs">
            {`[ `}
            <span className="text-sky-400 font-semibold">{node.size || 0}</span>
            {` items ]`}
          </span>
        );
      }
    }

    const val = node.value;
    switch (node.type) {
      case 'string':
        return <span className="text-emerald-400 font-mono break-all font-medium">"{String(val)}"</span>;
      case 'number':
        return <span className="text-rose-400 font-mono font-medium">{String(val)}</span>;
      case 'boolean':
        return <span className="text-violet-400 font-mono font-semibold uppercase text-[10px]">{String(val)}</span>;
      case 'null':
        return <span className="text-slate-500 font-mono italic">null</span>;
      default:
        return <span className="text-slate-300 font-mono">{String(val)}</span>;
    }
  };

  const hasKey = node.key && !node.key.startsWith('[') && node.key !== 'root';

  return (
    <div
      style={style}
      onClick={() => node.hasChildren && onToggle(node.id)}
      className={cn(
        "group json-node-hover flex items-center h-[28px] px-2 py-0.5 select-none transition-all cursor-default border-l-2 border-transparent text-xs",
        node.hasChildren && "cursor-pointer hover:bg-slate-800/80 dark:hover:bg-slate-800/80 light:hover:bg-slate-100",
        !node.hasChildren && "hover:bg-slate-900/60 dark:hover:bg-slate-900/60 light:hover:bg-slate-50",
        isSearched && "bg-amber-500/10 border-l-amber-500",
        diffStatus === 'added' && "bg-emerald-500/20 border-l-emerald-500 font-semibold",
        diffStatus === 'changed' && "bg-amber-500/25 border-l-amber-500 font-semibold",
        isHighlighted && "bg-amber-500/25 border-l-amber-500 font-semibold"

      )}
    >
      {/* Indent Spacer */}
      <div style={{ width: `${node.depth * 16}px` }} className="flex-shrink-0" />

      {/* Expand/Collapse Icon */}
      <div className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-300 flex-shrink-0 mr-0.5">
        {node.hasChildren ? (
          node.isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )
        ) : (
          <span className="w-1.5 h-1.5 rounded-full bg-slate-700/60 flex-shrink-0" />
        )}
      </div>

      {/* Node Key */}
      {hasKey ? (
        <span className="text-sky-400 dark:text-sky-400 light:text-sky-600 font-mono font-semibold mr-1.5 flex-shrink-0">
          {node.key}
          <span className="text-slate-500 dark:text-slate-600 ml-0.5">:</span>
        </span>
      ) : node.key.startsWith('[') ? (
        <span className="text-slate-500 dark:text-slate-600 font-mono text-[10px] mr-1.5 flex-shrink-0">
          {node.key}
        </span>
      ) : null}

      {/* Node Value or Node structure */}
      <div className="truncate flex-1 min-w-0 mr-4">
        {renderValue()}
      </div>

      {/* Hover Action Controls */}
      <div className="json-node-controls opacity-0 group-hover:opacity-100 flex items-center gap-1.5 flex-shrink-0 bg-slate-900/90 dark:bg-slate-900/90 light:bg-slate-100 px-2 py-0.5 rounded shadow-sm border border-slate-800 hover:bg-slate-800/90">
        {/* Copy Path */}
        <button
          onClick={handleCopyPath}
          className="text-slate-400 hover:text-slate-200 p-0.5 cursor-pointer focus:outline-none"
          title="Copy node path ID"
        >
          {copiedPath ? (
            <Check className="w-3 h-3 text-emerald-500 animate-pulse" />
          ) : (
            <Link className="w-3 h-3" />
          )}
        </button>

        {/* Copy Value */}
        {!node.hasChildren && (
          <button
            onClick={handleCopyValue}
            className="text-slate-400 hover:text-slate-200 p-0.5 cursor-pointer focus:outline-none"
            title="Copy node value"
          >
            {copiedValue ? (
              <Check className="w-3 h-3 text-emerald-500 animate-pulse" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.node.id === nextProps.node.id &&
    prevProps.node.key === nextProps.node.key &&
    prevProps.node.value === nextProps.node.value &&
    prevProps.node.isExpanded === nextProps.node.isExpanded &&
    prevProps.node.depth === nextProps.node.depth &&
    prevProps.node.size === nextProps.node.size &&
    prevProps.node.hasChildren === nextProps.node.hasChildren &&
    prevProps.isSearched === nextProps.isSearched &&
    prevProps.isHighlighted === nextProps.isHighlighted &&
    prevProps.style?.top === nextProps.style?.top &&
    prevProps.style?.height === nextProps.style?.height
  );
});

export default JsonNode;

