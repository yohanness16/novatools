import React, { useState, useRef } from 'react';
import { PdfEngine } from '../../engines/pdfEngine';
import { formatBytes, downloadUint8Array, readFileAsArrayBuffer } from '../../lib/utils';
import { Upload, FileText, ArrowUp, ArrowDown, Trash2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface PdfFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  buffer: ArrayBuffer;
  pageCount?: number;
}

export const PdfMergeWorkspace: React.FC = () => {
  const [files, setFiles] = useState<PdfFileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (newFiles: FileList | File[]) => {
    setError(null);
    setSuccess(false);

    const pdfFiles = Array.from(newFiles).filter(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );

    if (pdfFiles.length === 0) {
      setError('Please upload valid PDF documents.');
      return;
    }

    try {
      const items: PdfFileItem[] = [];
      for (const file of pdfFiles) {
        const buffer = await readFileAsArrayBuffer(file);
        let pageCount = 0;
        try {
          pageCount = await PdfEngine.getPageCount(buffer);
        } catch {
          pageCount = 1;
        }

        items.push({
          id: Math.random().toString(36).substring(2, 9),
          file,
          name: file.name,
          size: file.size,
          buffer,
          pageCount,
        });
      }

      setFiles((prev) => [...prev, ...items]);
    } catch (err: any) {
      setError('Error reading PDF files: ' + err.message);
    }
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= files.length) return;
    const updated = [...files];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setFiles(updated);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const clearAll = () => {
    setFiles([]);
    setSuccess(false);
    setError(null);
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      setError('Please add at least 2 PDF files to merge.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const buffers = files.map((f) => f.buffer);
      const mergedBytes = await PdfEngine.mergePdfs(buffers);
      downloadUint8Array(mergedBytes, 'merged-document.pdf', 'application/pdf');
      setSuccess(true);
    } catch (err: any) {
      setError('Failed to merge PDFs: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const totalPages = files.reduce((acc, f) => acc + (f.pageCount || 0), 0);
  const totalSize = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="w-full space-y-6">
      {/* Dropzone Container */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-all sm:p-12 ${
          isDragOver
            ? 'border-brand-500 bg-brand-500/10'
            : 'border-surface-border bg-surface/60 hover:border-zinc-700 hover:bg-surface'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = '';
          }}
        />

        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:scale-105 group-hover:border-brand-500/50 group-hover:text-brand-400 transition-all">
          <Upload className="h-6 w-6" />
        </div>

        <h3 className="mt-4 text-sm font-semibold text-zinc-200">
          Drop PDF files here or <span className="text-brand-400 underline">browse</span>
        </h3>
        <p className="mt-1 text-xs text-zinc-500">
          Select 2 or more PDF documents to merge into one. 100% processed locally.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300">
          <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>PDFs merged and downloaded successfully!</span>
        </div>
      )}

      {/* File Queue List */}
      {files.length > 0 && (
        <div className="rounded-2xl border border-surface-border bg-surface p-4 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-border pb-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-zinc-200">
                Queued Documents ({files.length})
              </span>
              <span className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-xs text-zinc-400">
                {totalPages} Total Pages · {formatBytes(totalSize)}
              </span>
            </div>
            <button
              onClick={clearAll}
              className="text-xs text-zinc-500 hover:text-red-400 transition-colors"
            >
              Clear Queue
            </button>
          </div>

          <div className="space-y-2">
            {files.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 transition-colors hover:border-zinc-700"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 font-mono text-xs">
                    {index + 1}
                  </div>
                  <FileText className="h-4 w-4 shrink-0 text-brand-400" />
                  <div className="truncate min-w-0">
                    <p className="truncate text-xs font-medium text-zinc-200">{item.name}</p>
                    <p className="text-[11px] text-zinc-500 font-mono">
                      {item.pageCount} {item.pageCount === 1 ? 'page' : 'pages'} · {formatBytes(item.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-3">
                  <button
                    onClick={() => moveFile(index, 'up')}
                    disabled={index === 0}
                    title="Move Up"
                    className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-30"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => moveFile(index, 'down')}
                    disabled={index === files.length - 1}
                    title="Move Down"
                    className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-30"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => removeFile(item.id)}
                    title="Remove"
                    className="rounded p-1 text-zinc-500 hover:bg-red-500/20 hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Merge Action Button */}
          <div className="pt-2">
            <button
              onClick={handleMerge}
              disabled={isProcessing || files.length < 2}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white shadow-glow-sm transition-all hover:bg-brand-600 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Merging Documents in Memory...</span>
                </>
              ) : (
                <span>Merge {files.length} PDFs</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
