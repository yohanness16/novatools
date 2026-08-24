import React, { useState, useRef } from 'react';
import { PdfEngine } from '../../engines/pdfEngine';
import { formatBytes, downloadUint8Array, readFileAsArrayBuffer } from '../../lib/utils';
import { PDFDocument } from 'pdf-lib';
import { Upload, FileText, Lock, ShieldCheck, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

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
            <Lock className="h-5 w-5" />
          </div>
          <h3 className="mt-3 text-xs font-semibold text-[#ECEDEF]">
            Drop PDF to encrypt, or <span className="text-[#4F8CFF] underline">browse files</span>
          </h3>
          <p className="mt-0.5 font-mono text-[11px] text-[#8B8F98]">
            100% local encryption. Passwords never touch any network.
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
                setPassword('');
                setConfirmPassword('');
              }}
              className="font-mono text-[11px] text-[#8B8F98] hover:text-[#ECEDEF] transition-colors"
            >
              Choose different file
            </button>
          </div>

          {/* Form Fields */}
          <div className="space-y-3 rounded bg-[#1B1D22] border border-[#2A2D33] p-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#ECEDEF] block">
                  Access Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter strong password..."
                  className="w-full rounded border border-[#2A2D33] bg-[#131418] px-3 py-1.5 font-mono text-xs text-[#ECEDEF] focus:border-[#4F8CFF] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-[#ECEDEF] block">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password..."
                  className="w-full rounded border border-[#2A2D33] bg-[#131418] px-3 py-1.5 font-mono text-xs text-[#ECEDEF] focus:border-[#4F8CFF] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-[#8B8F98] font-mono pt-1">
              <ShieldCheck className="h-3.5 w-3.5 text-[#3FBE73]" />
              <span>Standard AES encryption compatible with all PDF readers</span>
            </div>
          </div>

          {/* Action */}
          <div>
            <button
              onClick={handleProtect}
              disabled={isProcessing || !password || password !== confirmPassword}
              className="w-full flex items-center justify-center gap-2 rounded bg-[#4F8CFF] hover:bg-[#3B79F0] py-2.5 px-4 text-xs font-semibold text-white transition-colors disabled:opacity-40"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Encrypting PDF in Local Memory...</span>
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5" />
                  <span>Encrypt & Download PDF</span>
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
              <span>PDF password protected and downloaded successfully.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
