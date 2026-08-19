import React, { useState, useRef } from 'react';
import { PdfEngine } from '../../engines/pdfEngine';
import { formatBytes, downloadUint8Array, readFileAsArrayBuffer } from '../../lib/utils';
import { Upload, FileText, EyeOff, Layers, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

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
            <EyeOff className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-zinc-200">
            Upload PDF to Flatten Form Fields & Annotations
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            Lock all form responses and make interactive elements permanent and non-editable.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-surface-border bg-surface p-6 space-y-6">
          {/* File Card */}
          <div className="flex items-center justify-between border-b border-surface-border pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-zinc-200">{file.name}</h4>
                <p className="text-xs text-zinc-400 font-mono">
                  {pageCount} Pages · {formatBytes(file.size)}
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

          {/* Options Checklist */}
          <div className="space-y-3">
            <label className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5 cursor-pointer hover:border-zinc-700">
              <input
                type="checkbox"
                checked={flattenForms}
                onChange={(e) => setFlattenForms(e.target.checked)}
                className="mt-0.5 rounded border-zinc-700 bg-zinc-900 text-brand-500 focus:ring-brand-500"
              />
              <div className="text-xs">
                <span className="font-medium text-zinc-200">Flatten Form Fields</span>
                <p className="text-zinc-400 mt-0.5">
                  Converts interactive text inputs, checkboxes, and radio buttons into permanent static graphics.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5 cursor-pointer hover:border-zinc-700">
              <input
                type="checkbox"
                checked={flattenAnnotations}
                onChange={(e) => setFlattenAnnotations(e.target.checked)}
                className="mt-0.5 rounded border-zinc-700 bg-zinc-900 text-brand-500 focus:ring-brand-500"
              />
              <div className="text-xs">
                <span className="font-medium text-zinc-200">Bake Annotations & Markup</span>
                <p className="text-zinc-400 mt-0.5">
                  Strips annotation editing capabilities so highlights and drawings cannot be modified or moved.
                </p>
              </div>
            </label>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              onClick={handleFlatten}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white shadow-glow-sm transition-all hover:bg-brand-600 active:scale-[0.98] disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Flattening Layers...</span>
                </>
              ) : (
                <span>Flatten & Secure PDF</span>
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
              <span>Flattened PDF downloaded successfully!</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
