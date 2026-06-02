import React, { useState, useRef, useEffect } from 'react';
import type { UIEvent, CSSProperties } from 'react';


interface VirtualListProps {
  height: number;
  width: number | string;
  itemCount: number;
  itemSize: number;
  children: (props: { index: number; style: CSSProperties }) => React.ReactNode;
  scrollToIndex?: number;
}

export const VirtualList = ({
  height,
  width,
  itemCount,
  itemSize,
  children,
  scrollToIndex,
}: VirtualListProps) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Jump scroll to highlighted index when search results shift
  useEffect(() => {
    if (scrollToIndex !== undefined && scrollToIndex >= 0 && containerRef.current) {
      const targetScroll = scrollToIndex * itemSize - height / 2 + itemSize / 2;
      containerRef.current.scrollTop = Math.max(0, targetScroll);
    }
  }, [scrollToIndex, height, itemSize]);

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  // Calculate rendering window bounds with overscan buffer of 5 rows
  const buffer = 5;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemSize) - buffer);
  const endIndex = Math.min(itemCount - 1, Math.floor((scrollTop + height) / itemSize) + buffer);

  const items = [];
  for (let i = startIndex; i <= endIndex; i++) {
    items.push(
      children({
        index: i,
        style: {
          position: 'absolute',
          top: `${i * itemSize}px`,
          left: 0,
          right: 0,
          height: `${itemSize}px`,
        },
      })
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="scrollbar-thin"
      style={{
        overflowY: 'auto',
        overflowX: 'hidden',
        height: `${height}px`,
        width: typeof width === 'number' ? `${width}px` : width,
        position: 'relative',
      }}
    >
      <div style={{ height: `${itemCount * itemSize}px`, width: '100%', position: 'relative' }}>
        {items}
      </div>
    </div>
  );
};

export default VirtualList;
