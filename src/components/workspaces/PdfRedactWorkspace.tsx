import React, { useState, useRef } from 'react';
import { PdfEngine } from '../../engines/pdfEngine';
import { formatBytes, downloadUint8Array, readFileAsArrayBuffer } from '../../lib/utils';
import { WorkspaceDropzone, WorkspaceAlert } from './WorkspaceUI';
import { FileText, EyeOff, Loader2 } from 'lucide-react';

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
    <div className="w-full space-y-5">
      {!file ? (
        <WorkspaceDropzone
          onClick={() => fileInputRef.current?.click()}
          onFilesDrop={(files) => files[0] && handleFile(files[0])}
          icon={<EyeOff className="h-5 w-5" />}
          title="Drop PDF to flatten & lock, or"
          subtitle="Lock interactive form values and bake annotations permanently."
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
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#141413] text-[#FACC15]">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <span className="text-sm font-extrabold text-[#141413] dark:text-[#FAF7F0]">{file.name}</span>
                <p className="text-xs text-[#746D61] dark:text-[#938B7D] font-mono mt-0.5">
                  {pageCount} Pages · {formatBytes(file.size)}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setBuffer(null);
              }}
              className="nt-btn-secondary px-3 py-1.5 font-mono text-[11px] font-semibold"
            >
              Choose different file
            </button>
          </div>

          <div className="nt-well p-4 space-y-2.5">
            <span className="text-xs font-extrabold text-[#141413] dark:text-[#FAF7F0] block">
              Flattening Rules
            </span>

            <div className="space-y-2 text-xs">
              <label className="nt-subcard flex items-center gap-2.5 p-3 cursor-pointer text-[#141413] dark:text-[#FAF7F0]">
                <input
                  type="checkbox"
                  checked={flattenForms}
                  onChange={(e) => setFlattenForms(e.target.checked)}
                  className="rounded border-[var(--nt-border-strong)] accent-[#141413] dark:accent-[#FACC15]"
                />
                <span className="font-medium">Flatten Fillable AcroForm Fields into static text</span>
              </label>

              <label className="nt-subcard flex items-center gap-2.5 p-3 cursor-pointer text-[#141413] dark:text-[#FAF7F0]">
                <input
                  type="checkbox"
                  checked={flattenAnnotations}
                  onChange={(e) => setFlattenAnnotations(e.target.checked)}
                  className="rounded border-[var(--nt-border-strong)] accent-[#141413] dark:accent-[#FACC15]"
                />
                <span className="font-medium">Merge Annotations, Highlights, and Vector Markups</span>
              </label>
            </div>
          </div>

          <button
            onClick={handleFlatten}
            disabled={isProcessing}
            className="w-full flex items-center justify-center gap-2 nt-btn-yellow py-3 px-4 text-xs disabled:opacity-40"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Flattening Layers in Local Memory...</span>
              </>
            ) : (
              <>
                <EyeOff className="h-4 w-4" />
                <span>Flatten & Lock PDF</span>
              </>
            )}
          </button>

          {error && <WorkspaceAlert variant="error" message={error} />}
          {success && <WorkspaceAlert variant="success" message="PDF flattened and downloaded successfully." />}
        </div>
      )}
    </div>
  );
};
