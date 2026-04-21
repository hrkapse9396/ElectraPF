import React, { useState, useRef } from 'react';
import { Upload, FileText, X, Loader2, Camera, File as FileIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

interface BillUploaderProps {
  onUpload: (base64: string, mimeType: string) => void;
  isLoading: boolean;
}

export const BillUploader: React.FC<BillUploaderProps> = ({ onUpload, isLoading }) => {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<{ url: string; type: string; name: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setPreview({
          url: base64,
          type: file.type,
          name: file.name
        });
        const base64Clean = base64.split(',')[1];
        onUpload(base64Clean, file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <div 
        id="uploader-container"
        className={cn(
          "panel relative group transition-all duration-300",
          dragActive ? "border-accent bg-accent/5 scale-[1.01]" : "",
          isLoading ? "pointer-events-none opacity-50" : ""
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="panel-header">
           <Upload className="w-4 h-4" />
           01. Bill Intake Interface
        </div>
        <div className="input-area-themed">
          <AnimatePresence mode="wait">
            {!preview ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center py-12"
              >
                <div className="mb-8 w-20 h-20 rounded-3xl bg-accent-soft flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                  <Upload className="w-8 h-8 text-accent" strokeWidth={2} />
                </div>
                <p className="text-base font-display font-medium text-text mb-2 text-center">
                  Drop your bill document here
                </p>
                <p className="text-xs font-sans text-text-dim mb-8 text-center max-w-xs leading-relaxed">
                  Support for JPEGs, PNGs, and Multi-page PDFs. Use your camera for high-accuracy local scanning.
                </p>
                <button 
                  id="browse-button"
                  onClick={() => inputRef.current?.click()}
                  className="px-8 py-3 accent-gradient text-white font-bold rounded-xl text-[12px] uppercase tracking-wider hover:shadow-lg hover:shadow-accent/30 transition-all cursor-pointer flex items-center gap-2 group"
                >
                  <Camera className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                  Select or Scan Bill
                </button>
              </motion.div>
            ) : (
              <motion.div 
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative w-full max-w-md py-4"
              >
                <div className="flex flex-col items-center">
                  {preview.type === 'application/pdf' ? (
                    <div className="w-40 h-52 bg-bg/50 border border-border flex flex-col items-center justify-center p-4 text-center rounded-lg shadow-sm">
                      <FileIcon className="w-12 h-12 text-accent mb-3" strokeWidth={1} />
                      <span className="text-[10px] font-mono text-text truncate w-full">{preview.name}</span>
                      <span className="text-[9px] text-text-dim uppercase mt-2 tracking-widest font-bold">PDF DOCUMENT</span>
                    </div>
                  ) : (
                    <img src={preview.url} alt="Bill preview" className="rounded-lg shadow-lg w-full h-auto max-h-[300px] object-contain bg-surface border border-border" />
                  )}
                </div>
                
                <button 
                  id="clear-button"
                  onClick={() => setPreview(null)}
                  className="absolute top-6 right-2 p-1.5 bg-surface rounded-full border border-border shadow-sm hover:bg-error/10 hover:text-error transition-colors z-10"
                >
                  <X className="w-4 h-4" />
                </button>
                {isLoading ? (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-md flex flex-col items-center justify-center z-20 rounded-2xl border border-white/20 shadow-2xl">
                    <div className="relative">
                      <Loader2 className="w-12 h-12 text-accent animate-spin mb-4" />
                      <div className="absolute inset-0 blur-xl bg-accent/20 animate-pulse"></div>
                    </div>
                    <p className="font-display font-black text-accent text-sm tracking-widest uppercase">Analyzing Pulse...</p>
                    <p className="text-[10px] text-text-dim mt-2 font-mono uppercase tracking-tighter">AI Vector Extraction in Progress</p>
                  </div>
                ) : (
                  <div className="mt-8 flex justify-center">
                    <button 
                      onClick={() => setPreview(null)}
                      className="flex items-center gap-2 px-6 py-2 bg-text text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-md active:scale-95"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Analyze New Bill
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="logic-explainer bg-bg/30 p-5 border-t border-border mt-auto">
          <h3 className="text-[10px] uppercase font-bold text-accent tracking-widest mb-3">System Logs</h3>
          <p className="font-mono text-[10px] text-text-dim leading-relaxed">
            [INFO] Multi-format bridge initialized...<br />
            [INFO] Camera capture module: ACTIVE<br />
            [INFO] PDF parser: READY
          </p>
        </div>
        <input 
          ref={inputRef}
          type="file" 
          className="hidden" 
          accept="image/*,application/pdf"
          capture="environment"
          onChange={handleChange}
        />
      </div>
    </div>
  );
};
