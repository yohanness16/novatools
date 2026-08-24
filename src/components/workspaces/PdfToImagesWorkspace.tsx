import React, { useState, useRef } from 'react';
import { PdfEngine } from '../../engines/pdfEngine';
import { formatBytes, downloadBlob, readFileAsArrayBuffer } from '../../lib/utils';
import JSZip from 'jszip';
import { Upload, FileImage, Archive, CheckCircle2, AlertCircle, Loader2, Download } from 'lucide-react';

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
  const [scale, setScale] = useState<number>(2); // 2x high-dpi
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [renderedPages, setRenderedPages] = useState<RenderedPage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a valid PDF file.');
      return;
    }

    setError(null);
    setSuccess(false);
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
    setSuccess(false);
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
      setSuccess(true);

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
            <FileImage className="h-5 w-5" />
          </div>
          <h3 className="mt-3 text-xs font-semibold text-[#ECEDEF]">
            Drop PDF to convert to images, or <span className="text-[#4F8CFF] underline">browse files</span>
          </h3>
          <p className="mt-0.5 font-mono text-[11px] text-[#8B8F98]">
            Render high-DPI vector pages into crisp PNG or JPEG images. 100% local WASM.
          </p>
        </div>
      ) : (
        <div className="rounded border border-[#2A2D33] bg-[#131418] p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#2A2D33] pb-3">
            <div>
              <span className="text-xs font-medium text-[#ECEDEF]">{file.name}</span>
              <p className="text-[10px] text-[#8B8F98] font-mono mt-0.5">
                {pageCount} Pages · {formatBytes(file.size)}
              </p>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setBuffer(null);
                setRenderedPages([]);
              }}
              className="font-mono text-[11px] text-[#8B8F98] hover:text-[#ECEDEF] transition-colors"
            >
              Choose different file
            </button>
          </div>

          {/* Configuration Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded bg-[#1B1D22] border border-[#2A2D33] p-3.5">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#ECEDEF] block">
                Target Image Format
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormat('png')}
                  className={`rounded border py-1.5 text-xs font-medium transition-colors ${
                    format === 'png'
                      ? 'border-[#4F8CFF] bg-[#16233F] text-[#4F8CFF]'
                      : 'border-[#2A2D33] bg-[#131418] text-[#8B8F98] hover:text-[#ECEDEF]'
                  }`}
                >
                  PNG (Lossless)
                </button>
                <button
                  type="button"
                  onClick={() => setFormat('jpeg')}
                  className={`rounded border py-1.5 text-xs font-medium transition-colors ${
                    format === 'jpeg'
                      ? 'border-[#4F8CFF] bg-[#16233F] text-[#4F8CFF]'
                      : 'border-[#2A2D33] bg-[#131418] text-[#8B8F98] hover:text-[#ECEDEF]'
                  }`}
                >
                  JPEG (Compact)
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[#ECEDEF] block">
                DPI Resolution Scale
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setScale(s)}
                    className={`rounded border py-1.5 text-xs font-medium transition-colors ${
                      scale === s
                        ? 'border-[#4F8CFF] bg-[#16233F] text-[#4F8CFF]'
                        : 'border-[#2A2D33] bg-[#131418] text-[#8B8F98] hover:text-[#ECEDEF]'
                    }`}
                  >
                    {s}x {s === 2 ? '(HD)' : s === 3 ? '(Ultra)' : '(Standard)'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {isProcessing && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-[#8B8F98] font-mono">
                <span>Rasterizing PDF Pages in Memory...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded bg-[#1B1D22]">
                <div
                  className="h-full bg-[#4F8CFF] transition-all duration-150 rounded"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Button */}
          {renderedPages.length === 0 && (
            <div>
              <button
                onClick={handleRender}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 rounded bg-[#4F8CFF] hover:bg-[#3B79F0] py-2.5 px-4 text-xs font-semibold text-white transition-colors disabled:opacity-40"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Rasterizing Pages ({progress}%)...</span>
                  </>
                ) : (
                  <>
                    <FileImage className="h-3.5 w-3.5" />
                    <span>Convert {pageCount} Pages to {format.toUpperCase()}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Rendered Pages Gallery */}
          {renderedPages.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-[#2A2D33] pb-2">
                <span className="text-xs font-medium text-[#ECEDEF]">
                  Rendered Page Images ({renderedPages.length})
                </span>
                {renderedPages.length > 1 && (
                  <button
                    onClick={downloadAllZip}
                    className="flex items-center gap-1.5 rounded bg-[#4F8CFF] hover:bg-[#3B79F0] px-3 py-1.5 text-xs font-semibold text-white transition-colors"
                  >
                    <Download className="h-3 w-3" />
                    <span>Download All (ZIP)</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[380px] overflow-y-auto p-1">
                {renderedPages.map((page) => (
                  <div
                    key={page.pageNumber}
                    className="rounded bg-[#1B1D22] border border-[#2A2D33] p-2 space-y-2 flex flex-col justify-between"
                  >
                    <div className="relative aspect-[3/4] w-full overflow-hidden rounded bg-[#131418] border border-[#2A2D33] flex items-center justify-center p-1">
                      <img
                        src={page.dataUrl}
                        alt={`Page ${page.pageNumber}`}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-[#2A2D33]/60">
                      <span className="font-mono text-[10px] text-[#8B8F98]">Page {page.pageNumber}</span>
                      <button
                        onClick={() => downloadSinglePage(page)}
                        className="flex items-center gap-1 rounded bg-[#131418] hover:bg-[#181920] border border-[#2A2D33] px-2 py-0.5 font-mono text-[10px] text-[#ECEDEF] transition-colors"
                      >
                        <Download className="h-3 w-3" />
                        <span>Save</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded bg-[#331614] border border-[#F0564B]/40 p-3 text-xs text-[#F0564B]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
