import React, { useState, useRef } from 'react';
import { PdfEngine } from '../../engines/pdfEngine';
import { formatBytes, downloadBlob, readFileAsArrayBuffer } from '../../lib/utils';
import { WorkspaceDropzone, WorkspaceAlert, WorkspaceProgress } from './WorkspaceUI';
import JSZip from 'jszip';
import { FileImage, Loader2, Download } from 'lucide-react';

interface RenderedPage {
  pageNumber: number;
  dataUrl: string;
  blob: Blob;
}

export const PdfToImagesWorkspace: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [scale, setScale] = useState<number>(2);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [renderedPages, setRenderedPages] = useState<RenderedPage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a valid PDF file.');
      return;
    }

    setError(null);
    setRenderedPages([]);

    try {
      const buf = await readFileAsArrayBuffer(selectedFile);
      const count = await PdfEngine.getPageCount(buf);
      setFile(selectedFile);
      setBuffer(buf);
      setPageCount(count);
    } catch (err: any) {
      setError('Failed to inspect PDF: ' + err.message);
    }
  };

  const handleRender = async () => {
    if (!file || !buffer) return;
    setIsProcessing(true);
    setError(null);
    setProgress(0);
    setRenderedPages([]);

    try {
      const pages = await PdfEngine.renderAllPagesToImages(
        buffer,
        format,
        scale,
        (curr, total) => {
          setProgress(Math.round((curr / total) * 100));
        }
      );

      setRenderedPages(pages);

      if (pages.length === 1) {
        const outName = `${file.name.replace('.pdf', '')}_page_1.${format === 'png' ? 'png' : 'jpg'}`;
        downloadBlob(pages[0].blob, outName);
      } else {
        const zip = new JSZip();
        const ext = format === 'png' ? 'png' : 'jpg';
        pages.forEach((p) => {
          zip.file(`page_${p.pageNumber}.${ext}`, p.blob);
        });
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        downloadBlob(zipBlob, `${file.name.replace('.pdf', '')}_images_${ext}.zip`);
      }
    } catch (err: any) {
      setError('Failed to render PDF pages: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadSinglePage = (page: RenderedPage) => {
    if (!file) return;
    const ext = format === 'png' ? 'png' : 'jpg';
    downloadBlob(page.blob, `${file.name.replace('.pdf', '')}_page_${page.pageNumber}.${ext}`);
  };

  const downloadAllZip = async () => {
    if (!file || renderedPages.length === 0) return;
    const zip = new JSZip();
    const ext = format === 'png' ? 'png' : 'jpg';
    renderedPages.forEach((p) => {
      zip.file(`page_${p.pageNumber}.${ext}`, p.blob);
    });
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipBlob, `${file.name.replace('.pdf', '')}_all_pages_${ext}.zip`);
  };

  return (
    <div className="w-full space-y-5">
      {!file ? (
        <WorkspaceDropzone
          onClick={() => fileInputRef.current?.click()}
          onFilesDrop={(files) => files[0] && handleFile(files[0])}
          icon={<FileImage className="h-5 w-5" />}
          title="Drop PDF to convert to images, or"
          subtitle="Render high-DPI vector pages into crisp PNG or JPEG images."
          badgeText="100% Local Processing"
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
            <button
              onClick={() => {
                setFile(null);
                setBuffer(null);
                setRenderedPages([]);
              }}
              className="nt-btn-secondary px-3 py-1.5 font-mono text-[11px] font-semibold"
            >
              Choose different file
            </button>
          </div>

          <div className="nt-well grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#141413] dark:text-[#FAF7F0] block">
                Target Image Format
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormat('png')}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    format === 'png'
                      ? 'bg-[#141413] dark:bg-[#FACC15] text-[#FACC15] dark:text-[#141413] border-[#141413] shadow-sm'
                      : 'nt-btn-secondary'
                  }`}
                >
                  PNG (Lossless)
                </button>
                <button
                  type="button"
                  onClick={() => setFormat('jpeg')}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    format === 'jpeg'
                      ? 'bg-[#141413] dark:bg-[#FACC15] text-[#FACC15] dark:text-[#141413] border-[#141413] shadow-sm'
                      : 'nt-btn-secondary'
                  }`}
                >
                  JPEG (Compact)
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#141413] dark:text-[#FAF7F0] block">
                DPI Resolution Scale
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setScale(s)}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      scale === s
                        ? 'bg-[#141413] dark:bg-[#FACC15] text-[#FACC15] dark:text-[#141413] border-[#141413] shadow-sm'
                        : 'nt-btn-secondary'
                    }`}
                  >
                    {s}x {s === 2 ? 'HD' : s === 3 ? 'Ultra' : 'Std'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {isProcessing && (
            <WorkspaceProgress message="Rasterizing PDF Pages in Memory..." progress={progress} />
          )}

          {renderedPages.length === 0 && (
            <button
              onClick={handleRender}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 nt-btn-yellow py-3 px-4 text-xs disabled:opacity-40"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Rasterizing Pages ({progress}%)...</span>
                </>
              ) : (
                <>
                  <FileImage className="h-4 w-4" />
                  <span>Convert {pageCount} Pages to {format.toUpperCase()}</span>
                </>
              )}
            </button>
          )}

          {renderedPages.length > 0 && (
            <div className="space-y-3 pt-1">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--nt-border)] pb-3">
                <span className="text-xs font-extrabold text-[#141413] dark:text-[#FAF7F0]">
                  Rendered Page Images ({renderedPages.length})
                </span>
                {renderedPages.length > 1 && (
                  <button
                    onClick={downloadAllZip}
                    className="flex items-center gap-1.5 nt-btn-yellow px-3.5 py-1.5 text-xs"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download All (ZIP)</span>
                  </button>
                )}
              </div>

              <div className="nt-well p-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[380px] overflow-y-auto p-1">
                  {renderedPages.map((page) => (
                    <div key={page.pageNumber} className="nt-card p-2.5 space-y-2 flex flex-col justify-between">
                      <div className="nt-well relative aspect-[3/4] w-full overflow-hidden flex items-center justify-center p-1.5">
                        <img
                          src={page.dataUrl}
                          alt={`Page ${page.pageNumber}`}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1.5 border-t border-[var(--nt-border)]">
                        <span className="font-mono text-[10px] font-bold text-[#746D61]">Page {page.pageNumber}</span>
                        <button
                          onClick={() => downloadSinglePage(page)}
                          className="nt-btn-secondary flex items-center gap-1 px-2 py-1 font-mono text-[10px] font-semibold"
                        >
                          <Download className="h-3 w-3" />
                          <span>Save</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {error && <WorkspaceAlert variant="error" message={error} />}
        </div>
      )}
    </div>
  );
};
