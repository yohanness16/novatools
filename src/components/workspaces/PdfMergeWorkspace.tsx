import React, { useState, useRef } from 'react';
import { PdfEngine } from '../../engines/pdfEngine';
import { formatBytes, downloadUint8Array, readFileAsArrayBuffer } from '../../lib/utils';
import { Upload, FileText, ArrowUp, ArrowDown, Trash2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

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
    <div className="w-full space-y-4">
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
        className={`group relative flex cursor-pointer flex-col items-center justify-center rounded border border-dashed p-6 sm:p-10 transition-colors ${
          isDragOver
            ? 'border-[#4F8CFF] bg-[#16233F]'
            : 'border-[#2A2D33] bg-[#1B1D22] hover:border-[#4F8CFF] hover:bg-[#151820]'
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

        <div className="flex h-10 w-10 items-center justify-center rounded bg-[#131418] border border-[#2A2D33] text-[#8B8F98] group-hover:text-[#4F8CFF] group-hover:border-[#4F8CFF]/40 transition-colors">
          <Upload className="h-5 w-5" />
        </div>

        <h3 className="mt-3 text-xs font-semibold text-[#ECEDEF]">
          Drop PDF files here, or <span className="text-[#4F8CFF] underline">browse files</span>
        </h3>
        <p className="mt-0.5 font-mono text-[11px] text-[#8B8F98]">
          Select 2+ documents to merge into one sequence. 100% local processing.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-2 rounded bg-[#331614] border border-[#F0564B]/40 p-3 text-xs text-[#F0564B]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div className="flex items-center gap-2 rounded bg-[#122D1F] border border-[#3FBE73]/40 p-3 text-xs text-[#3FBE73]">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>PDFs compiled and downloaded successfully.</span>
        </div>
      )}

      {/* File Queue List */}
      {files.length > 0 && (
        <div className="rounded border border-[#2A2D33] bg-[#131418] p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2A2D33] pb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[#ECEDEF]">
                Queued Documents ({files.length})
              </span>
              <span className="rounded bg-[#1B1D22] px-2 py-0.5 font-mono text-[10px] text-[#8B8F98] border border-[#2A2D33]">
                {totalPages} Total Pages · {formatBytes(totalSize)}
              </span>
            </div>
            <button
              onClick={clearAll}
              className="font-mono text-[11px] text-[#8B8F98] hover:text-[#F0564B] transition-colors"
            >
              Clear Queue
            </button>
          </div>

          <div className="space-y-1.5">
            {files.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded bg-[#1B1D22] border border-[#2A2D33] p-2.5 transition-colors hover:border-[#4F8CFF]/40"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[#131418] text-[#8B8F98] font-mono text-[10px] border border-[#2A2D33]">
                    {index + 1}
                  </div>
                  <FileText className="h-3.5 w-3.5 shrink-0 text-[#8B8F98]" />
                  <div className="truncate min-w-0">
                    <p className="truncate text-xs font-medium text-[#ECEDEF]">{item.name}</p>
                    <p className="text-[10px] text-[#8B8F98] font-mono">
                      {item.pageCount} {item.pageCount === 1 ? 'page' : 'pages'} · {formatBytes(item.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button
                    onClick={() => moveFile(index, 'up')}
                    disabled={index === 0}
                    title="Move Up"
                    className="rounded p-1 text-[#8B8F98] hover:bg-[#131418] hover:text-[#ECEDEF] disabled:opacity-25"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => moveFile(index, 'down')}
                    disabled={index === files.length - 1}
                    title="Move Down"
                    className="rounded p-1 text-[#8B8F98] hover:bg-[#131418] hover:text-[#ECEDEF] disabled:opacity-25"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => removeFile(item.id)}
                    title="Remove"
                    className="rounded p-1 text-[#8B8F98] hover:bg-[#331614] hover:text-[#F0564B]"
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
              className="w-full flex items-center justify-center gap-2 rounded bg-[#4F8CFF] hover:bg-[#3B79F0] py-2.5 px-4 text-xs font-semibold text-white transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Compiling PDF in Local Memory...</span>
                </>
              ) : (
                <span>Merge {files.length} PDF Documents</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
