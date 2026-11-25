import React, { useState, useRef } from 'react';
import { PdfEngine } from '../../engines/pdfEngine';
import { formatBytes, downloadUint8Array, downloadBlob, readFileAsArrayBuffer } from '../../lib/utils';
import { WorkspaceDropzone, WorkspaceAlert } from './WorkspaceUI';
import { useHandoffFiles } from '../../lib/useHandoffFiles';
import JSZip from 'jszip';
import { Upload, Scissors, Archive, Loader2 } from 'lucide-react';

export const PdfSplitWorkspace: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [rangeStr, setRangeStr] = useState<string>('1-2');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
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
    <div className="w-full space-y-5">
      {!file ? (
        <WorkspaceDropzone
          onClick={() => fileInputRef.current?.click()}
          onFilesDrop={(files) => files[0] && handleFile(files[0])}
          icon={<Upload className="h-5 w-5" />}
          title="Drop PDF to split or extract, or"
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
              <span className="text-sm font-extrabold text-[#111214] dark:text-[#F3F4F6]">{file.name}</span>
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] font-mono mt-0.5">
                Total Pages: {pageCount} · {formatBytes(file.size)}
              </p>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setBuffer(null);
                setSuccessMsg(null);
              }}
              className="nt-btn-secondary px-3 py-1.5 font-mono text-[11px] font-semibold"
            >
              Choose different file
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Custom Range */}
            <div className="nt-well p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#111214] dark:text-[#F3F4F6]">
                  <Scissors className="h-4 w-4 text-[#2563EB]" />
                  <span>Range</span>
                </div>
                <input
                  type="text"
                  value={rangeStr}
                  onChange={(e) => setRangeStr(e.target.value)}
                  placeholder={`1-3, 5, 7-${pageCount || 10}`}
                  className="nt-input w-full px-3 py-2 font-mono text-xs"
                />
              </div>

              <button
                onClick={handleExtractRange}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 nt-btn-yellow py-2.5 px-3 text-xs disabled:opacity-40"
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

            {/* Burst All */}
            <div className="nt-well p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#111214] dark:text-[#F3F4F6]">
                  <Archive className="h-4 w-4 text-[#15803D] dark:text-[#4ADE80]" />
                  <span>All Pages (ZIP)</span>
                </div>
                <div className="nt-subcard font-mono text-[11px] text-[#4B5563] dark:text-[#9CA3AF] px-3 py-2">
                  {pageCount} PDFs
                </div>
              </div>

              <button
                onClick={handleBurstAll}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 nt-btn-primary py-2.5 px-3 text-xs font-bold disabled:opacity-40"
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

          {error && <WorkspaceAlert variant="error" message={error} />}
          {successMsg && <WorkspaceAlert variant="success" message={successMsg} />}
        </div>
      )}
    </div>
  );
};
