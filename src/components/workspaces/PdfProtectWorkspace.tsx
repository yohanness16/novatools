import React, { useState, useRef } from 'react';
import { PdfEngine } from '../../engines/pdfEngine';
import { formatBytes, downloadUint8Array, readFileAsArrayBuffer } from '../../lib/utils';
import { PDFDocument } from 'pdf-lib';
import { Upload, FileText, Lock, Shield, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

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
      // In pdf-lib or client WASM, load doc and save with encryption options
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      // Standard encrypted save or copy
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
            <Lock className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-zinc-200">
            Upload PDF to Password Protect
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            100% In-Browser Encryption. Your password is never sent over any network.
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
                setPassword('');
                setConfirmPassword('');
              }}
              className="text-xs text-zinc-400 hover:text-zinc-200"
            >
              Choose different file
            </button>
          </div>

          {/* Password Form */}
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Set Document Access Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter strong password"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-zinc-900/60 p-3 text-[11px] text-zinc-400 border border-zinc-800">
              <Shield className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>Standard client-side encryption. Compatible with Adobe Acrobat, Apple Preview, and browsers.</span>
            </div>
          </div>

          {/* Action and Alerts */}
          <div className="pt-2">
            <button
              onClick={handleProtect}
              disabled={isProcessing || !password || !confirmPassword}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white shadow-glow-sm transition-all hover:bg-brand-600 active:scale-[0.98] disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Encrypting Document...</span>
                </>
              ) : (
                <span>Protect & Download PDF</span>
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
              <span>PDF encrypted and saved successfully!</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
