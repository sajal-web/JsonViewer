import React from 'react';
import useResize from '../hooks/useResize';
import { cn } from '../utils/cn';

interface SplitPaneProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  ratio: number;
  onChange: (ratio: number) => void;
}

export const SplitPane: React.FC<SplitPaneProps> = ({
  leftPanel,
  rightPanel,
  ratio,
  onChange,
}) => {
  const { isResizing, startResize, containerRef } = useResize(onChange);

  return (
    <div
      ref={containerRef}
      className="flex flex-1 w-full overflow-hidden relative"
      style={{ cursor: isResizing ? 'col-resize' : 'default' }}
    >
      {/* Left Panel */}
      <div
        className="h-full overflow-hidden flex flex-col"
        style={{ width: `${ratio * 100}%` }}
      >
        {leftPanel}
      </div>

      {/* Resize Handle */}
      <div
        className="w-1.5 h-full relative cursor-col-resize flex-shrink-0 bg-slate-900 dark:bg-slate-900 border-x border-slate-800 hover:bg-blue-500/50 hover:border-blue-500/50 transition-colors z-20 group"
        onMouseDown={startResize}
        onTouchStart={startResize}
      >
        <div
          className={cn(
            "absolute inset-y-0 left-[2px] w-[2px] bg-transparent group-hover:bg-blue-500 transition-colors",
            isResizing && "bg-blue-500"
          )}
        />
      </div>

      {/* Right Panel */}
      <div
        className="h-full overflow-hidden flex flex-col flex-1"
        style={{ width: `${(1 - ratio) * 100}%` }}
      >
        {rightPanel}
      </div>

      {/* Fullscreen Overlay when Resizing to prevent iframe mouse capturing */}
      {isResizing && <div className="absolute inset-0 z-30 cursor-col-resize select-none" />}
    </div>
  );
};

export default SplitPane;
