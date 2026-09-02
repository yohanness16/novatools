import React, { useState, useRef } from 'react';
import { PdfEngine } from '../../engines/pdfEngine';
import { formatBytes, downloadUint8Array, readFileAsArrayBuffer } from '../../lib/utils';
import { Upload, FileText, EyeOff, Layers, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export const PdfRedactWorkspace: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [flattenForms, setFlattenForms] = useState(true);
  const [flattenAnnotations, setFlattenAnnotations] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
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

    try {
      const buf = await readFileAsArrayBuffer(selectedFile);
      const count = await PdfEngine.getPageCount(buf);
      setFile(selectedFile);
      setBuffer(buf);
      setPageCount(count);
    } catch (err: any) {
      setError('Failed to open PDF: ' + err.message);
    }
  };

  const handleFlatten = async () => {
    if (!buffer || !file) return;
    setIsProcessing(true);
    setError(null);
    setSuccess(false);

    try {
      const flattenedBytes = await PdfEngine.flattenPdf(buffer);
      const outName = `${file.name.replace('.pdf', '')}_flattened.pdf`;
      downloadUint8Array(flattenedBytes, outName, 'application/pdf');
      setSuccess(true);
    } catch (err: any) {
      setError('Flattening failed: ' + err.message);
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
            <EyeOff className="h-5 w-5" />
          </div>
          <h3 className="mt-3 text-xs font-semibold text-[#ECEDEF]">
            Drop PDF to flatten & lock, or <span className="text-[#4F8CFF] underline">browse files</span>
          </h3>
          <p className="mt-0.5 font-mono text-[11px] text-[#8B8F98]">
            Lock interactive form values and rasterize annotations. 100% local processing.
          </p>
        </div>
      ) : (
        <div className="rounded border border-[#2A2D33] bg-[#131418] p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#2A2D33] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-[#1B1D22] border border-[#2A2D33] text-[#4F8CFF]">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-medium text-[#ECEDEF]">{file.name}</span>
                <p className="text-[10px] text-[#8B8F98] font-mono mt-0.5">
                  {pageCount} Pages · {formatBytes(file.size)}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setBuffer(null);
              }}
              className="font-mono text-[11px] text-[#8B8F98] hover:text-[#ECEDEF] transition-colors"
            >
              Choose different file
            </button>
          </div>

          {/* Configuration Options */}
          <div className="space-y-2 rounded bg-[#1B1D22] border border-[#2A2D33] p-3.5">
            <span className="text-xs font-medium text-[#ECEDEF] block mb-1">
              Flattening Rules
            </span>

            <div className="space-y-1.5 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-[#ECEDEF]">
                <input
                  type="checkbox"
                  checked={flattenForms}
                  onChange={(e) => setFlattenForms(e.target.checked)}
                  className="rounded border-[#2A2D33] bg-[#131418] text-[#4F8CFF] focus:ring-0"
                />
                <span>Flatten Fillable AcroForm Fields into static text</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-[#ECEDEF]">
                <input
                  type="checkbox"
                  checked={flattenAnnotations}
                  onChange={(e) => setFlattenAnnotations(e.target.checked)}
                  className="rounded border-[#2A2D33] bg-[#131418] text-[#4F8CFF] focus:ring-0"
                />
                <span>Merge Annotations, Highlights, and Vector Markups</span>
              </label>
            </div>
          </div>

          {/* Action */}
          <div>
            <button
              onClick={handleFlatten}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 rounded bg-[#4F8CFF] hover:bg-[#3B79F0] py-2.5 px-4 text-xs font-semibold text-white transition-colors disabled:opacity-40"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Flattening Layers in Local Memory...</span>
                </>
              ) : (
                <>
                  <EyeOff className="h-3.5 w-3.5" />
                  <span>Flatten & Lock PDF</span>
                </>
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
              <span>PDF flattened and downloaded successfully.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
