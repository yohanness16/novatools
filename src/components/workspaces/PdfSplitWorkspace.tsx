import React, { useState, useRef } from 'react';
import { PdfEngine } from '../../engines/pdfEngine';
import { formatBytes, downloadUint8Array, downloadBlob, readFileAsArrayBuffer } from '../../lib/utils';
import JSZip from 'jszip';
import { Upload, FileText, Scissors, Archive, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export const PdfSplitWorkspace: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [rangeStr, setRangeStr] = useState<string>('1-2');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Please choose a valid PDF file.');
      return;
    }

    setError(null);
    setSuccessMsg(null);

    try {
      const buf = await readFileAsArrayBuffer(selectedFile);
      const count = await PdfEngine.getPageCount(buf);
      setFile(selectedFile);
      setBuffer(buf);
      setPageCount(count);
      setRangeStr(count > 1 ? `1-${Math.min(count, 3)}` : '1');
    } catch (err: any) {
      setError('Failed to inspect PDF: ' + err.message);
    }
  };

  const handleExtractRange = async () => {
    if (!buffer || !file) return;
    setIsProcessing(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const extractedBytes = await PdfEngine.splitPdf(buffer, rangeStr);
      const outName = `${file.name.replace('.pdf', '')}_extracted_pages_${rangeStr.replace(/\s+/g, '')}.pdf`;
      downloadUint8Array(extractedBytes, outName, 'application/pdf');
      setSuccessMsg(`Extracted range [${rangeStr}] successfully.`);
    } catch (err: any) {
      setError('Extraction failed: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBurstAll = async () => {
    if (!buffer || !file) return;
    setIsProcessing(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const burstPages = await PdfEngine.burstPdf(buffer);
      const zip = new JSZip();

      burstPages.forEach((p) => {
        const pageFileName = `${file.name.replace('.pdf', '')}_page_${p.pageNumber}.pdf`;
        zip.file(pageFileName, p.data);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(zipBlob, `${file.name.replace('.pdf', '')}_all_pages.zip`);
      setSuccessMsg(`Extracted all ${pageCount} pages into ZIP archive.`);
    } catch (err: any) {
      setError('Burst all failed: ' + err.message);
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
            <Upload className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-zinc-200">
            Choose a PDF to Split or Extract Pages
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            Extract custom page ranges or burst all pages into individual files.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-surface-border bg-surface p-6 space-y-6">
          {/* Document Summary Card */}
          <div className="flex items-center justify-between border-b border-surface-border pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-zinc-200">{file.name}</h4>
                <p className="text-xs text-zinc-400 font-mono">
                  {pageCount} {pageCount === 1 ? 'page' : 'total pages'} · {formatBytes(file.size)}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setBuffer(null);
              }}
              className="text-xs text-zinc-400 hover:text-zinc-200"
            >
              Choose different file
            </button>
          </div>

          {/* Action 1: Extract Custom Range */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Scissors className="h-4 w-4 text-brand-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Extract Page Range
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Specify page numbers or comma-separated intervals (e.g. <code className="text-brand-300">1-3, 5, 7-{pageCount}</code>).
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={rangeStr}
                onChange={(e) => setRangeStr(e.target.value)}
                placeholder={`e.g. 1-${Math.min(pageCount, 3)}`}
                className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-brand-500 focus:outline-none"
              />
              <button
                onClick={handleExtractRange}
                disabled={isProcessing || !rangeStr.trim()}
                className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-600 active:scale-95 disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Scissors className="h-3.5 w-3.5" />}
                Extract Range
              </button>
            </div>
          </div>

          {/* Action 2: Burst All Pages */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Archive className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  Burst All Pages into ZIP
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Generates a single separate PDF for each of the {pageCount} pages and downloads as a ZIP archive.
              </p>
            </div>
            <button
              onClick={handleBurstAll}
              disabled={isProcessing}
              className="shrink-0 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 active:scale-95 disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Archive className="h-3.5 w-3.5" />}
              Burst All Pages
            </button>
          </div>

          {/* Alerts */}
          {error && (
            <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
