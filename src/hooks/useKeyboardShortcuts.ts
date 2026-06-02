import { useEffect } from 'react';

interface ShortcutOptions {
  onSave?: () => void;
  onSearch?: () => void;
  onFormat?: () => void;
  onUpload?: () => void;
  onLoadMock?: () => void;
}

export function useKeyboardShortcuts({
  onSave,
  onSearch,
  onFormat,
  onUpload,
  onLoadMock,
}: ShortcutOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      // Save: Cmd/Ctrl + S
      if (isCmdOrCtrl && e.key.toLowerCase() === 's') {
        if (onSave) {
          e.preventDefault();
          onSave();
        }
      }

      // Search: Cmd/Ctrl + F
      if (isCmdOrCtrl && e.key.toLowerCase() === 'f' && !e.shiftKey) {
        if (onSearch) {
          e.preventDefault();
          onSearch();
        }
      }

      // Format: Cmd/Ctrl + Shift + F
      if (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'f') {
        if (onFormat) {
          e.preventDefault();
          onFormat();
        }
      }

      // Upload: Cmd/Ctrl + O
      if (isCmdOrCtrl && e.key.toLowerCase() === 'o') {
        if (onUpload) {
          e.preventDefault();
          onUpload();
        }
      }

      // Load mock: Cmd/Ctrl + D
      if (isCmdOrCtrl && e.key.toLowerCase() === 'd') {
        if (onLoadMock) {
          e.preventDefault();
          onLoadMock();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onSave, onSearch, onFormat, onUpload, onLoadMock]);
}

export default useKeyboardShortcuts;
