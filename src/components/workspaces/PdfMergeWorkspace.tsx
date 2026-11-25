import React, { useState, useRef } from 'react';
import { PdfEngine } from '../../engines/pdfEngine';
import { formatBytes, downloadUint8Array, readFileAsArrayBuffer } from '../../lib/utils';
import { WorkspaceDropzone, WorkspaceAlert } from './WorkspaceUI';
import { useHandoffFiles } from '../../lib/useHandoffFiles';
import { Upload, FileText, ArrowUp, ArrowDown, Trash2, Loader2 } from 'lucide-react';

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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useHandoffFiles((files) => {
    handleFiles(files);
  });

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
    <div className="w-full space-y-5">
      <WorkspaceDropzone
        onClick={() => fileInputRef.current?.click()}
        onFilesDrop={handleFiles}
        icon={<Upload className="h-5 w-5" />}
        title="Drop PDF files here, or"
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
      </WorkspaceDropzone>

      {error && <WorkspaceAlert variant="error" message={error} />}
      {success && <WorkspaceAlert variant="success" message="PDFs compiled and downloaded successfully." />}

      {files.length > 0 && (
        <div className="nt-card p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--nt-border)] pb-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-extrabold text-[#141413] dark:text-[#FAF7F0]">
                Queued Documents ({files.length})
              </span>
              <span className="nt-badge-yellow px-2.5 py-0.5 font-mono text-[10px] font-bold">
                {totalPages} Total Pages · {formatBytes(totalSize)}
              </span>
            </div>
            <button
              onClick={clearAll}
              className="font-mono text-[11px] font-semibold text-[#746D61] hover:text-[#B91C1C] dark:hover:text-[#F87171] transition-colors cursor-pointer"
            >
              Clear Queue
            </button>
          </div>

          <div className="nt-well p-2.5 space-y-2">
            {files.map((item, index) => (
              <div
                key={item.id}
                className="nt-subcard flex items-center justify-between p-3 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#FEF7D6] dark:bg-[#FACC15]/15 text-[#CA8A04] dark:text-[#FACC15] font-mono text-[11px] font-bold">
                    {index + 1}
                  </div>
                  <FileText className="h-4 w-4 shrink-0 text-[#746D61]" />
                  <div className="truncate min-w-0">
                    <p className="truncate text-xs font-bold text-[#141413] dark:text-[#FAF7F0]">{item.name}</p>
                    <p className="text-[10px] text-[#746D61] dark:text-[#938B7D] font-mono">
                      {item.pageCount} {item.pageCount === 1 ? 'page' : 'pages'} · {formatBytes(item.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button
                    onClick={() => moveFile(index, 'up')}
                    disabled={index === 0}
                    title="Move Up"
                    className="nt-btn-secondary p-1.5 disabled:opacity-30"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => moveFile(index, 'down')}
                    disabled={index === files.length - 1}
                    title="Move Down"
                    className="nt-btn-secondary p-1.5 disabled:opacity-30"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => removeFile(item.id)}
                    title="Remove"
                    className="nt-btn-secondary p-1.5 hover:!text-[#B91C1C]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleMerge}
            disabled={isProcessing || files.length < 2}
            className="w-full flex items-center justify-center gap-2 nt-btn-yellow py-3 px-4 text-xs disabled:opacity-40 disabled:pointer-events-none"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Compiling PDF in Local Memory...</span>
              </>
            ) : (
              <span>Merge {files.length} PDF Documents</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
