import { useState, useCallback, useEffect, useRef } from 'react';

export function useResize(onResize: (ratio: number) => void) {
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const startResize = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    // Check if it's touch or mouse event and prevent default behavior
    if ('cancelable' in e && e.cancelable) {
      e.preventDefault();
    }
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      
      // Calculate split ratio relative to container width
      const ratio = (clientX - rect.left) / rect.width;
      onResize(ratio);
    };

    const handleUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleUp);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isResizing, onResize]);

  return { isResizing, startResize, containerRef };
}
export default useResize;
