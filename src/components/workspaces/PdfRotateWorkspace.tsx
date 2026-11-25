import React, { useState, useRef } from 'react';
import { PdfEngine } from '../../engines/pdfEngine';
import { formatBytes, downloadUint8Array, readFileAsArrayBuffer } from '../../lib/utils';
import { WorkspaceDropzone, WorkspaceAlert } from './WorkspaceUI';
import { useHandoffFiles } from '../../lib/useHandoffFiles';
import { FileText, RotateCw, RotateCcw, Loader2 } from 'lucide-react';

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useHandoffFiles((files) => {
    if (files[0]) handleFile(files[0]);
  });

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
    <div className="w-full space-y-5">
      {!file ? (
        <WorkspaceDropzone
          onClick={() => fileInputRef.current?.click()}
          onFilesDrop={(files) => files[0] && handleFile(files[0])}
          icon={<RotateCw className="h-5 w-5" />}
          title="Drop PDF to rotate pages, or"
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
        </WorkspaceDropzone>
      ) : (
        <div className="nt-card p-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--nt-border)] pb-3">
            <div>
              <span className="text-sm font-extrabold text-[#141413] dark:text-[#FAF7F0]">{file.name}</span>
              <p className="text-xs text-[#746D61] dark:text-[#938B7D] font-mono mt-0.5">
                {pageCount} Pages · {formatBytes(file.size)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => rotateAll(-90)}
                className="nt-btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Rotate All Left</span>
              </button>
              <button
                type="button"
                onClick={() => rotateAll(90)}
                className="nt-btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold"
              >
                <RotateCw className="h-3.5 w-3.5" />
                <span>Rotate All Right</span>
              </button>
              <button
                onClick={() => {
                  setFile(null);
                  setBuffer(null);
                  setThumbnails([]);
                }}
                className="nt-btn-secondary px-3 py-1.5 font-mono text-[11px] font-semibold"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="nt-well p-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-[420px] overflow-y-auto p-1">
              {Array.from({ length: pageCount }).map((_, idx) => {
                const rot = rotations[idx] || 0;
                const thumb = thumbnails.find((t) => t.pageNumber === idx + 1);

                return (
                  <div key={idx} className="nt-card p-2.5 space-y-2 flex flex-col justify-between">
                    <div className="nt-well relative aspect-[3/4] w-full overflow-hidden flex items-center justify-center p-1.5">
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
                          className="flex flex-col items-center justify-center text-[#746D61] transition-transform duration-150"
                        >
                          <FileText className="h-8 w-8" />
                          <span className="font-mono text-[10px] mt-1">Page {idx + 1}</span>
                        </div>
                      )}

                      {rot > 0 && (
                        <span className="nt-badge-yellow absolute top-1.5 right-1.5 px-1.5 py-0.5 font-mono text-[9px] font-bold">
                          {rot}°
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1.5 border-t border-[var(--nt-border)]">
                      <span className="font-mono text-[10px] font-bold text-[#746D61]">#{idx + 1}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => rotatePage(idx, -90)}
                          className="nt-btn-secondary p-1"
                          title="Rotate 90° CCW"
                        >
                          <RotateCcw className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => rotatePage(idx, 90)}
                          className="nt-btn-secondary p-1"
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
          </div>

          <button
            onClick={handleSave}
            disabled={isProcessing}
            className="w-full flex items-center justify-center gap-2 nt-btn-yellow py-3 px-4 text-xs disabled:opacity-40"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving Rotated PDF in Memory...</span>
              </>
            ) : (
              <span>Save & Download Rotated PDF</span>
            )}
          </button>

          {error && <WorkspaceAlert variant="error" message={error} />}
          {success && <WorkspaceAlert variant="success" message="Rotated PDF downloaded successfully." />}
        </div>
      )}
    </div>
  );
};
