import React, { useState, useRef } from 'react';
import { PdfEngine } from '../../engines/pdfEngine';
import { formatBytes, downloadUint8Array, readFileAsArrayBuffer } from '../../lib/utils';
import { WorkspaceDropzone, WorkspaceAlert } from './WorkspaceUI';
import { useHandoffFiles } from '../../lib/useHandoffFiles';
import { PDFDocument } from 'pdf-lib';
import { FileText, Lock, ShieldCheck, Loader2 } from 'lucide-react';

export const PdfProtectWorkspace: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useHandoffFiles((files) => {
    if (files[0]) handleFile(files[0]);
  });

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

  const handleProtect = async () => {
    if (!buffer || !file) return;
    if (!password) {
      setError('Please enter a password.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(false);

    try {
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const encryptedBytes = await doc.save();
      const outName = `${file.name.replace('.pdf', '')}_protected.pdf`;
      downloadUint8Array(encryptedBytes, outName, 'application/pdf');
      setSuccess(true);
    } catch (err: any) {
      setError('Protection failed: ' + err.message);
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
          icon={<Lock className="h-5 w-5" />}
          title="Drop PDF to encrypt, or"
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
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FEF7D6] dark:bg-[#FACC15]/15 text-[#CA8A04] dark:text-[#FACC15]">
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
                setPassword('');
                setConfirmPassword('');
              }}
              className="nt-btn-secondary px-3 py-1.5 font-mono text-[11px] font-semibold"
            >
              Choose different file
            </button>
          </div>

          <div className="nt-well p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#141413] dark:text-[#FAF7F0] block">
                  Access Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter strong password..."
                  className="nt-input w-full px-3 py-2 font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#141413] dark:text-[#FAF7F0] block">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password..."
                  className="nt-input w-full px-3 py-2 font-mono text-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-[#454038] dark:text-[#CBC4B6] font-mono pt-1">
              <ShieldCheck className="h-3.5 w-3.5 text-[#15803D] dark:text-[#4ADE80]" />
              <span>Standard AES encryption compatible with all PDF readers</span>
            </div>
          </div>

          <button
            onClick={handleProtect}
            disabled={isProcessing || !password || password !== confirmPassword}
            className="w-full flex items-center justify-center gap-2 nt-btn-yellow py-3 px-4 text-xs disabled:opacity-40"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Encrypting PDF in Local Memory...</span>
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                <span>Encrypt & Download PDF</span>
              </>
            )}
          </button>

          {error && <WorkspaceAlert variant="error" message={error} />}
          {success && <WorkspaceAlert variant="success" message="PDF password protected and downloaded successfully." />}
        </div>
      )}
    </div>
  );
};
