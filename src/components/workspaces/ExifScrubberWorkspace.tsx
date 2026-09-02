import React, { useState, useRef } from 'react';
import { ExifEngine, type ExifTag } from '../../engines/exifEngine';
import { formatBytes, downloadBlob, readFileAsDataURL } from '../../lib/utils';
import { Upload, ShieldCheck, MapPin, Camera, Calendar, AlertCircle, CheckCircle2, Loader2, Download } from 'lucide-react';

export const ExifScrubberWorkspace: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [hasExif, setHasExif] = useState(false);
  const [hasGps, setHasGps] = useState(false);
  const [tags, setTags] = useState<ExifTag[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
      setError('Please choose a valid photo (JPEG/PNG).');
      return;
    }

    setError(null);
    setSuccess(false);

    try {
      const dataUrl = await readFileAsDataURL(selectedFile);
      const meta = await ExifEngine.inspectMetadata(selectedFile);
      setFile(selectedFile);
      setPreviewUrl(dataUrl);
      setHasExif(meta.hasExif);
      setHasGps(meta.hasGps);
      setTags(meta.tags);
    } catch (err: any) {
      setError('Failed to inspect metadata: ' + err.message);
    }
  };

  const handleScrub = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    setSuccess(false);

    try {
      const { blob } = await ExifEngine.scrubMetadata(file);
      const outName = `clean_${file.name}`;
      downloadBlob(blob, outName);
      setSuccess(true);
    } catch (err: any) {
      setError('Scrubbing failed: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {!file ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="group flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-white/[0.1] bg-slate-50 dark:bg-[#16171a] p-10 text-center hover:border-blue-500 hover:bg-slate-100 dark:hover:bg-[#1e2025] transition-all cursor-pointer"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFile(e.target.files[0]);
              e.target.value = '';
            }}
          />
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white dark:bg-[#1e2025] border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-[#9ca3af] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h3 className="mt-3 text-xs font-bold text-slate-900 dark:text-white">
            Drop photo to inspect & scrub EXIF, or <span className="text-blue-600 dark:text-blue-400 underline">browse files</span>
          </h3>
          <p className="mt-0.5 font-mono text-[11px] text-slate-500 dark:text-[#9ca3af]">
            Strip GPS coordinates, device identifiers, and timestamps. 100% local processing.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#1e2025] p-5 sm:p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-3">
            <div className="flex items-center gap-3">
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Thumbnail"
                  className="h-10 w-10 rounded-lg object-cover border border-slate-200 dark:border-white/[0.08]"
                />
              )}
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">{file.name}</span>
                <p className="text-[10px] text-slate-500 dark:text-[#9ca3af] font-mono mt-0.5">
                  {formatBytes(file.size)} · {file.type || 'image/jpeg'}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setPreviewUrl(null);
                setTags([]);
              }}
              className="font-mono text-[11px] text-slate-500 dark:text-[#9ca3af] hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Choose different photo
            </button>
          </div>

          {/* Privacy Status Readout */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-lg px-3 py-1 font-mono text-xs border flex items-center gap-1.5 ${
                hasGps
                  ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 font-bold'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
              }`}
            >
              <MapPin className="h-3.5 w-3.5" />
              {hasGps ? 'GPS Location Exposed' : 'No GPS Coordinates'}
            </span>

            <span
              className={`rounded-lg px-3 py-1 font-mono text-xs border flex items-center gap-1.5 ${
                hasExif
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500/30 text-amber-700 dark:text-amber-300 font-bold'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
              }`}
            >
              <Camera className="h-3.5 w-3.5" />
              {hasExif ? `${tags.length} Metadata Tags Detected` : 'Zero EXIF Tags'}
            </span>
          </div>

          {/* Metadata Table */}
          {tags.length > 0 ? (
            <div className="rounded-lg bg-slate-50 dark:bg-[#16171a] border border-slate-200 dark:border-white/[0.06] overflow-hidden">
              <div className="border-b border-slate-200 dark:border-white/[0.06] px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-[#d1d5db]">
                Detected EXIF Headers
              </div>
              <div className="max-h-56 overflow-y-auto divide-y divide-slate-200/60 dark:divide-white/[0.04]">
                {tags.map((t, idx) => (
                  <div key={idx} className="flex justify-between px-4 py-2 text-xs font-mono">
                    <span className="text-slate-500 dark:text-[#9ca3af]">{t.name}</span>
                    <span className="text-slate-900 dark:text-[#f9fafb] max-w-[60%] truncate text-right font-medium">{t.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-slate-50 dark:bg-[#16171a] border border-slate-200 dark:border-white/[0.06] p-4 text-center">
              <p className="text-xs text-slate-500 dark:text-[#9ca3af] font-mono">
                No sensitive EXIF tags detected in this image header.
              </p>
            </div>
          )}

          {/* Action */}
          <div>
            <button
              onClick={handleScrub}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 py-2.5 px-4 text-xs font-bold text-white transition-colors disabled:opacity-40 cursor-pointer active:scale-95"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Sanitizing Header in Memory...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Sanitize & Download Clean Photo</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 p-3 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 p-3 text-xs text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Sanitized image downloaded without metadata.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
