import { useEffect, useRef, useState, useMemo } from 'react';
import { FileJson, SearchCode } from 'lucide-react';
import { useJsonStore } from '../store/useJsonStore';
import { flattenJson } from '../utils/treeUtils';
import JsonNode from './JsonNode';
import VirtualList from './VirtualList';

export const JsonTreeView = () => {
  const {
    parsedJson,
    expandedPaths,
    togglePath,
  } = useJsonStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 400 });

  // Native ResizeObserver to dynamic size virtualized list viewport
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Compute the flat list of nodes based on raw data and expansion state
  const visibleNodes = useMemo(() => {
    return flattenJson(parsedJson, expandedPaths);
  }, [parsedJson, expandedPaths]);

  const handleCopyPath = (path: string) => {
    navigator.clipboard.writeText(path);
  };

  const handleCopyValue = (value: any) => {
    const str = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
    navigator.clipboard.writeText(str);
  };

  // If JSON empty, render user instruction card
  if (!parsedJson) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950/20 text-slate-500 select-none">
        <FileJson className="w-12 h-12 text-slate-700 mb-3 animate-pulse" />
        <h3 className="text-slate-300 font-medium mb-1">Tree View Viewer</h3>
        <p className="text-xs text-slate-500 max-w-xs">
          Paste some data into the editor or upload a JSON/YAML file to display the structural tree here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full h-full flex flex-col overflow-hidden bg-slate-950/50 dark:bg-slate-950/50 light:bg-slate-50/50">
      <div className="h-8 flex items-center justify-between px-4 bg-slate-900/50 border-b border-slate-800/80 text-xs font-mono text-slate-400 select-none flex-shrink-0">
        <span>TREE VIEW</span>
        {visibleNodes.length > 0 && (
          <span className="text-[10px] text-slate-500">
            Showing <strong className="text-slate-400">{visibleNodes.length}</strong> visible rows
          </span>
        )}
      </div>

      <div ref={containerRef} className="flex-1 w-full relative overflow-hidden font-mono py-2">
        {visibleNodes.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600">
            <SearchCode className="w-8 h-8 mb-2 text-slate-800" />
            <span className="text-xs">No matching nodes found.</span>
          </div>
        ) : (
          <VirtualList
            height={dimensions.height}
            width={dimensions.width || '100%'}
            itemCount={visibleNodes.length}
            itemSize={28}
          >
            {({ index, style }: { index: number; style: any }) => {
              const node = visibleNodes[index];
              return (
                <JsonNode
                  node={node}
                  style={style}
                  isSearched={false}
                  isHighlighted={false}
                  onToggle={togglePath}
                  onCopyPath={handleCopyPath}
                  onCopyValue={handleCopyValue}
                />
              );
            }}
          </VirtualList>
        )}
      </div>
    </div>
  );
};

export default JsonTreeView;
