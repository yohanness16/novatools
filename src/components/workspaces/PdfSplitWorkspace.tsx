import React, { useState, useRef } from 'react';
import { PdfEngine } from '../../engines/pdfEngine';
import { formatBytes, downloadUint8Array, downloadBlob, readFileAsArrayBuffer } from '../../lib/utils';
import JSZip from 'jszip';
import { Upload, FileText, Scissors, Archive, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

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
            <Upload className="h-5 w-5" />
          </div>
          <h3 className="mt-3 text-xs font-semibold text-[#ECEDEF]">
            Drop PDF to split or extract, or <span className="text-[#4F8CFF] underline">browse files</span>
          </h3>
          <p className="mt-0.5 font-mono text-[11px] text-[#8B8F98]">
            Extract page intervals or burst all pages to ZIP. 100% local WASM.
          </p>
        </div>
      ) : (
        <div className="rounded border border-[#2A2D33] bg-[#131418] p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#2A2D33] pb-3">
            <div>
              <span className="text-xs font-medium text-[#ECEDEF]">{file.name}</span>
              <p className="text-[10px] text-[#8B8F98] font-mono mt-0.5">
                Total Pages: {pageCount} · {formatBytes(file.size)}
              </p>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setBuffer(null);
                setSuccessMsg(null);
              }}
              className="font-mono text-[11px] text-[#8B8F98] hover:text-[#ECEDEF] transition-colors"
            >
              Choose different file
            </button>
          </div>

          {/* Extraction Modes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Mode 1: Custom Range */}
            <div className="rounded bg-[#1B1D22] border border-[#2A2D33] p-3.5 space-y-2.5 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#ECEDEF]">
                  <Scissors className="h-3.5 w-3.5 text-[#4F8CFF]" />
                  <span>Extract Custom Page Range</span>
                </div>
                <p className="text-[11px] text-[#8B8F98]">
                  Enter comma-separated page ranges (e.g. 1-3, 5, 7-{pageCount || 10})
                </p>
                <input
                  type="text"
                  value={rangeStr}
                  onChange={(e) => setRangeStr(e.target.value)}
                  placeholder="e.g. 1-3, 5"
                  className="w-full rounded border border-[#2A2D33] bg-[#131418] px-3 py-1.5 font-mono text-xs text-[#ECEDEF] focus:border-[#4F8CFF] focus:outline-none"
                />
              </div>

              <button
                onClick={handleExtractRange}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-1.5 rounded bg-[#4F8CFF] hover:bg-[#3B79F0] py-2 px-3 text-xs font-semibold text-white transition-colors disabled:opacity-40"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Extracting...</span>
                  </>
                ) : (
                  <>
                    <Scissors className="h-3.5 w-3.5" />
                    <span>Download Extracted PDF</span>
                  </>
                )}
              </button>
            </div>

            {/* Mode 2: Burst All Pages */}
            <div className="rounded bg-[#1B1D22] border border-[#2A2D33] p-3.5 space-y-2.5 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#ECEDEF]">
                  <Archive className="h-3.5 w-3.5 text-[#3FBE73]" />
                  <span>Burst All Pages into Individual Files</span>
                </div>
                <p className="text-[11px] text-[#8B8F98]">
                  Extract every page as a standalone PDF bundled into a ZIP archive.
                </p>
                <div className="font-mono text-[11px] text-[#8B8F98] bg-[#131418] p-1.5 rounded border border-[#2A2D33]">
                  Will output {pageCount} single-page PDF files
                </div>
              </div>

              <button
                onClick={handleBurstAll}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-1.5 rounded bg-[#122D1F] hover:bg-[#163827] border border-[#3FBE73]/40 py-2 px-3 text-xs font-semibold text-[#3FBE73] transition-colors disabled:opacity-40"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Packaging ZIP...</span>
                  </>
                ) : (
                  <>
                    <Archive className="h-3.5 w-3.5" />
                    <span>Burst All Pages to ZIP</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded bg-[#331614] border border-[#F0564B]/40 p-3 text-xs text-[#F0564B]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="flex items-center gap-2 rounded bg-[#122D1F] border border-[#3FBE73]/40 p-3 text-xs text-[#3FBE73]">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
