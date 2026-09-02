import React, { useState, useRef } from 'react';
import { PdfEngine } from '../../engines/pdfEngine';
import { formatBytes, downloadUint8Array, readFileAsArrayBuffer } from '../../lib/utils';
import { Upload, FileText, RotateCw, RotateCcw, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

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
        // Fallback
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
    <div className="w-full space-y-4">
      {!file ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="group relative flex cursor-pointer flex-col items-center justify-center rounded border border-dashed border-[#2A2D33] bg-[#1B1D22] p-6 sm:p-10 hover:border-[#4F8CFF] hover:bg-[#151820] transition-colors"
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
          <div className="flex h-10 w-10 items-center justify-center rounded bg-[#131418] border border-[#2A2D33] text-[#8B8F98] group-hover:text-[#4F8CFF] group-hover:border-[#4F8CFF]/40 transition-colors">
            <RotateCw className="h-5 w-5" />
          </div>
          <h3 className="mt-3 text-xs font-semibold text-[#ECEDEF]">
            Drop PDF to rotate pages, or <span className="text-[#4F8CFF] underline">browse files</span>
          </h3>
          <p className="mt-0.5 font-mono text-[11px] text-[#8B8F98]">
            Rotate individual pages or entire documents 90°/180°/270°. 100% local processing.
          </p>
        </div>
      ) : (
        <div className="rounded border border-[#2A2D33] bg-[#131418] p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2A2D33] pb-3">
            <div>
              <span className="text-xs font-medium text-[#ECEDEF]">{file.name}</span>
              <p className="text-[10px] text-[#8B8F98] font-mono mt-0.5">
                {pageCount} Pages · {formatBytes(file.size)}
              </p>
            </div>

            {/* Global Quick Rotate Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => rotateAll(-90)}
                className="flex items-center gap-1 rounded bg-[#1B1D22] border border-[#2A2D33] px-2.5 py-1 text-xs font-medium text-[#ECEDEF] hover:border-[#4F8CFF] transition-colors"
              >
                <RotateCcw className="h-3 w-3 text-[#8B8F98]" />
                <span>Rotate All Left</span>
              </button>
              <button
                type="button"
                onClick={() => rotateAll(90)}
                className="flex items-center gap-1 rounded bg-[#1B1D22] border border-[#2A2D33] px-2.5 py-1 text-xs font-medium text-[#ECEDEF] hover:border-[#4F8CFF] transition-colors"
              >
                <RotateCw className="h-3 w-3 text-[#8B8F98]" />
                <span>Rotate All Right</span>
              </button>
              <button
                onClick={() => {
                  setFile(null);
                  setBuffer(null);
                  setThumbnails([]);
                }}
                className="font-mono text-[11px] text-[#8B8F98] hover:text-[#ECEDEF] transition-colors pl-2"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Page Thumbnails Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-[420px] overflow-y-auto p-1">
            {Array.from({ length: pageCount }).map((_, idx) => {
              const rot = rotations[idx] || 0;
              const thumb = thumbnails.find((t) => t.pageNumber === idx + 1);

              return (
                <div
                  key={idx}
                  className="rounded bg-[#1B1D22] border border-[#2A2D33] p-2 space-y-2 flex flex-col justify-between"
                >
                  <div className="relative aspect-[3/4] w-full overflow-hidden rounded bg-[#131418] border border-[#2A2D33] flex items-center justify-center p-1">
                    {thumb ? (
                      <img
                        src={thumb.dataUrl}
                        alt={`Page ${idx + 1}`}
                        style={{ transform: `rotate(${rot}deg)` }}
                        className="max-h-full max-w-full object-contain transition-transform duration-150"
                      />
                    ) : (
                      <div
                        style={{ transform: `rotate(${rot}deg)` }}
                        className="flex flex-col items-center justify-center text-[#8B8F98] transition-transform duration-150"
                      >
                        <FileText className="h-8 w-8 text-[#5B606D]" />
                        <span className="font-mono text-[10px] mt-1">Page {idx + 1}</span>
                      </div>
                    )}

                    {rot > 0 && (
                      <span className="absolute top-1 right-1 rounded bg-[#16233F] border border-[#4F8CFF]/30 px-1 font-mono text-[9px] font-semibold text-[#4F8CFF]">
                        {rot}°
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-[#2A2D33]/60">
                    <span className="font-mono text-[10px] text-[#8B8F98]">#{idx + 1}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => rotatePage(idx, -90)}
                        className="rounded p-1 text-[#8B8F98] hover:bg-[#131418] hover:text-[#ECEDEF]"
                        title="Rotate 90° CCW"
                      >
                        <RotateCcw className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => rotatePage(idx, 90)}
                        className="rounded p-1 text-[#8B8F98] hover:bg-[#131418] hover:text-[#ECEDEF]"
                        title="Rotate 90° CW"
                      >
                        <RotateCw className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Save Button */}
          <div className="pt-2">
            <button
              onClick={handleSave}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 rounded bg-[#4F8CFF] hover:bg-[#3B79F0] py-2.5 px-4 text-xs font-semibold text-white transition-colors disabled:opacity-40"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving Rotated PDF in Memory...</span>
                </>
              ) : (
                <span>Save & Download Rotated PDF</span>
              )}
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded bg-[#331614] border border-[#F0564B]/40 p-3 text-xs text-[#F0564B]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 rounded bg-[#122D1F] border border-[#3FBE73]/40 p-3 text-xs text-[#3FBE73]">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Rotated PDF downloaded successfully.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
