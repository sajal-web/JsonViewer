import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileCode2 } from 'lucide-react';
import { useJsonStore } from '../store/useJsonStore';
import { motion, AnimatePresence } from 'framer-motion';

interface FileUploaderProps {
  children: React.ReactNode;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ children }) => {
  const { setRawInput, setActiveMode } = useJsonStore();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          // Detect mode based on extension
          const ext = file.name.split('.').pop()?.toLowerCase();
          if (ext === 'yaml' || ext === 'yml') {
            setActiveMode('yaml');
          } else {
            setActiveMode('json');
          }
          setRawInput(text);
        }
      };
      reader.readAsText(file);
    },
    [setRawInput, setActiveMode]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true, // Let toolbar buttons trigger manual file dialogs
    accept: {
      'application/json': ['.json'],
      'text/yaml': ['.yaml', '.yml'],
      'text/plain': ['.txt'],
    },
  });

  return (
    <div {...getRootProps()} className="relative w-full h-full min-h-screen overflow-hidden">
      <input {...getInputProps()} />

      {/* Main App content */}
      {children}

      {/* Fullscreen Overlay when Dragging File */}
      <AnimatePresence>
        {isDragActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex flex-col items-center justify-center pointer-events-none select-none"
          >
            <motion.div
              initial={{ scale: 0.9, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 10 }}
              className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-blue-500 bg-slate-900/60 shadow-2xl max-w-sm text-center"
            >
              <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-blue-400 animate-bounce" />
              </div>
              <h3 className="text-lg font-bold text-slate-100 mb-2">Import Document</h3>
              <p className="text-xs text-slate-400">
                Drop your JSON, YAML, or TXT file here to parse it instantly into the workspace.
              </p>
              <div className="mt-4 flex items-center gap-1.5 px-3 py-1 bg-slate-950 rounded text-[10px] text-slate-500 font-mono">
                <FileCode2 className="w-3 h-3 text-slate-650" />
                <span>Supported: .json, .yaml, .yml, .txt</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FileUploader;
