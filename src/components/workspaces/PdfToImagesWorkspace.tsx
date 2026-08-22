import React, { useState, useRef } from 'react';
import { PdfEngine } from '../../engines/pdfEngine';
import { formatBytes, downloadBlob, readFileAsArrayBuffer } from '../../lib/utils';
import JSZip from 'jszip';
import { Upload, FileImage, Archive, CheckCircle, AlertCircle, Loader2, Download } from 'lucide-react';

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

      // If single page, directly download the image
      if (pages.length === 1) {
        const outName = `${file.name.replace('.pdf', '')}_page_1.${format === 'png' ? 'png' : 'jpg'}`;
        downloadBlob(pages[0].blob, outName);
      } else {
        // Multi-page automatic zip compilation
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
            <FileImage className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-zinc-200">
            Upload PDF to Convert Pages into High-Res Images
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            Rasterize all text, graphics, and pages into crisp PNG or JPEG images directly on your device.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-surface-border bg-surface p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-surface-border pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400">
                <FileImage className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-zinc-200">{file.name}</h4>
                <p className="text-xs text-zinc-400 font-mono">
                  {pageCount} {pageCount === 1 ? 'Page' : 'Pages'} · {formatBytes(file.size)}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setBuffer(null);
                setRenderedPages([]);
              }}
              className="text-xs text-zinc-400 hover:text-zinc-200"
            >
              Choose different file
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Output Format
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as any)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-xs text-zinc-100 focus:border-brand-500 focus:outline-none"
              >
                <option value="png">PNG (Lossless Vector Quality)</option>
                <option value="jpeg">JPEG (Compressed Photo)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Resolution Scale (DPI)
              </label>
              <select
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-xs text-zinc-100 focus:border-brand-500 focus:outline-none"
              >
                <option value="1">1x Standard (72 DPI)</option>
                <option value="2">2x High-DPI (150 DPI - Recommended)</option>
                <option value="3">3x Ultra-HD (300 DPI - Razor Sharp)</option>
              </select>
            </div>
          </div>

          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-zinc-400 font-mono">
                <span>Rasterizing Pages in Browser Memory...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full bg-brand-500 transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={handleRender}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white shadow-glow-sm transition-all hover:bg-brand-600 active:scale-[0.98] disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Converting Pages ({progress}%)...</span>
                </>
              ) : (
                <>
                  <Archive className="h-4 w-4" />
                  <span>Render & Download {pageCount} {pageCount === 1 ? 'Page' : 'Pages'}</span>
                </>
              )}
            </button>
          </div>

          {/* Rendered Pages Thumbnail Gallery */}
          {renderedPages.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-surface-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4" />
                  Rendered Page Previews ({renderedPages.length})
                </span>
                {renderedPages.length > 1 && (
                  <button
                    onClick={downloadAllZip}
                    className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-700"
                  >
                    <Archive className="h-3.5 w-3.5" />
                    Download All as ZIP
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[480px] overflow-y-auto p-1">
                {renderedPages.map((page) => (
                  <div
                    key={page.pageNumber}
                    className="group relative flex flex-col rounded-xl border border-zinc-800 bg-zinc-900 p-2 transition-all hover:border-zinc-700"
                  >
                    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-black/40 mb-2 border border-zinc-800">
                      <img
                        src={page.dataUrl}
                        alt={`Page ${page.pageNumber}`}
                        className="h-full w-full object-contain"
                      />
                      <span className="absolute bottom-1 left-1 rounded bg-black/80 px-1.5 py-0.5 font-mono text-[10px] text-zinc-200">
                        Page {page.pageNumber}
                      </span>
                    </div>

                    <button
                      onClick={() => downloadSinglePage(page)}
                      className="flex items-center justify-center gap-1 rounded-lg bg-zinc-800 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700 hover:text-white"
                    >
                      <Download className="h-3 w-3" />
                      <span>Download Image</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}
          {success && renderedPages.length > 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>PDF pages rendered and downloaded successfully!</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
