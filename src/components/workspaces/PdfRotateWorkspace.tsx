import React, { useState, useRef } from 'react';
import { PdfEngine } from '../../engines/pdfEngine';
import { formatBytes, downloadUint8Array, readFileAsArrayBuffer } from '../../lib/utils';
import { Upload, FileText, RotateCw, RotateCcw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface PageThumbnail {
  pageNumber: number;
  dataUrl: string;
}

export const PdfRotateWorkspace: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [rotations, setRotations] = useState<Record<number, number>>({});
  const [thumbnails, setThumbnails] = useState<PageThumbnail[]>([]);
  const [isLoadingThumbnails, setIsLoadingThumbnails] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Please choose a valid PDF file.');
      return;
    }

    setError(null);
    setSuccess(false);
    setThumbnails([]);

    try {
      const buf = await readFileAsArrayBuffer(selectedFile);
      const count = await PdfEngine.getPageCount(buf);
      setFile(selectedFile);
      setBuffer(buf);
      setPageCount(count);
      setRotations({});

      // Render fast thumbnail previews in background
      setIsLoadingThumbnails(true);
      try {
        const rendered = await PdfEngine.renderAllPagesToImages(buf, 'png', 0.6);
        setThumbnails(
          rendered.map((r) => ({
            pageNumber: r.pageNumber,
            dataUrl: r.dataUrl,
          }))
        );
      } catch {
        // Fallback gracefully if thumbnail renderer encounters issue
      } finally {
        setIsLoadingThumbnails(false);
      }
    } catch (err: any) {
      setError('Failed to load PDF: ' + err.message);
    }
  };

  const rotatePage = (pageIndex: number, delta: number) => {
    setRotations((prev) => {
      const current = prev[pageIndex] || 0;
      const next = (current + delta + 360) % 360;
      return { ...prev, [pageIndex]: next };
    });
  };

  const rotateAll = (delta: number) => {
    setRotations((prev) => {
      const updated: Record<number, number> = {};
      for (let i = 0; i < pageCount; i++) {
        const current = prev[i] || 0;
        updated[i] = (current + delta + 360) % 360;
      }
      return updated;
    });
  };

  const handleSave = async () => {
    if (!buffer || !file) return;
    setIsProcessing(true);
    setError(null);
    setSuccess(false);

    try {
      const rotatedBytes = await PdfEngine.rotatePages(buffer, rotations);
      const outName = `${file.name.replace('.pdf', '')}_rotated.pdf`;
      downloadUint8Array(rotatedBytes, outName, 'application/pdf');
      setSuccess(true);
    } catch (err: any) {
      setError('Failed to rotate PDF: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {!file ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-surface-border bg-surface/60 p-8 sm:p-12 hover:border-zinc-700 hover:bg-surface transition-all"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFile(e.target.files[0]);
              e.target.value = '';
            }}
          />
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:scale-105 group-hover:border-brand-500/50 group-hover:text-brand-400 transition-all">
            <RotateCw className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-zinc-200">
            Upload PDF to Rotate Pages
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            Rotate individual pages or entire documents permanently with real visual previews.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-surface-border bg-surface p-6 space-y-6">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-surface-border pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-zinc-200">{file.name}</h4>
                <p className="text-xs text-zinc-400 font-mono">
                  {pageCount} {pageCount === 1 ? 'Page' : 'Pages'} · {formatBytes(file.size)}
                  {isLoadingThumbnails && ' · Loading previews...'}
                </p>
              </div>
            </div>

            {/* Bulk Rotate Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => rotateAll(90)}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700 active:scale-95 transition-all"
              >
                <RotateCw className="h-3.5 w-3.5" />
                Rotate All +90°
              </button>
              <button
                onClick={() => rotateAll(-90)}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700 active:scale-95 transition-all"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Rotate All -90°
              </button>
            </div>
          </div>

          {/* Page Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-[460px] overflow-y-auto p-1">
            {Array.from({ length: pageCount }).map((_, idx) => {
              const currentAngle = rotations[idx] || 0;
              const thumb = thumbnails[idx];

              return (
                <div
                  key={idx}
                  className="flex flex-col items-center rounded-xl border border-zinc-800 bg-zinc-900/80 p-3 text-center transition-all hover:border-zinc-700"
                >
                  <div className="relative flex h-32 w-full items-center justify-center rounded-lg bg-zinc-950 border border-zinc-800 overflow-hidden mb-2">
                    <div
                      style={{ transform: `rotate(${currentAngle}deg)` }}
                      className="flex h-24 w-18 items-center justify-center rounded bg-white shadow-sm transition-transform duration-200 overflow-hidden"
                    >
                      {thumb ? (
                        <img
                          src={thumb.dataUrl}
                          alt={`Page ${idx + 1}`}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <FileText className="h-6 w-6 text-zinc-500" />
                      )}
                    </div>
                    {currentAngle !== 0 && (
                      <span className="absolute top-1 right-1 rounded bg-brand-500 px-1.5 py-0.2 font-mono text-[9px] text-white">
                        {currentAngle}°
                      </span>
                    )}
                  </div>

                  <span className="text-xs font-medium text-zinc-400 mb-2">Page {idx + 1}</span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => rotatePage(idx, -90)}
                      title="Rotate 90° Left"
                      className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => rotatePage(idx, 90)}
                      title="Rotate 90° Right"
                      className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                    >
                      <RotateCw className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action and Alerts */}
          <div className="pt-2">
            <button
              onClick={handleSave}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white shadow-glow-sm transition-all hover:bg-brand-600 active:scale-[0.98] disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving Rotations...</span>
                </>
              ) : (
                <span>Download Rotated PDF</span>
              )}
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>Rotated PDF downloaded successfully!</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
