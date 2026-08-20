import React, { useState, useRef } from 'react';
import { ExifEngine, type ExifTag } from '../../engines/exifEngine';
import { formatBytes, downloadBlob, readFileAsDataURL } from '../../lib/utils';
import { Upload, ShieldCheck, MapPin, Camera, Calendar, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

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
          className="group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-surface-border bg-surface/60 p-8 sm:p-12 hover:border-zinc-700 hover:bg-surface transition-all"
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
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:scale-105 group-hover:border-brand-500/50 group-hover:text-brand-400 transition-all">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-zinc-200">
            Upload Photo to Inspect & Scrub EXIF Metadata
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            Remove hidden GPS locations, camera parameters, and device serial numbers.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-surface-border bg-surface p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-surface-border pb-4">
            <div className="flex items-center gap-3">
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Thumbnail"
                  className="h-10 w-10 rounded-lg object-cover border border-zinc-800"
                />
              )}
              <div>
                <h4 className="text-sm font-medium text-zinc-200">{file.name}</h4>
                <p className="text-xs text-zinc-400 font-mono">
                  {formatBytes(file.size)} · {file.type || 'image/jpeg'}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setPreviewUrl(null);
              }}
              className="text-xs text-zinc-400 hover:text-zinc-200"
            >
              Choose different photo
            </button>
          </div>

          {/* Privacy Status Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className={`flex items-center gap-3 rounded-xl border p-3 ${
              hasGps ? 'border-amber-500/30 bg-amber-500/10 text-amber-300' : 'border-zinc-800 bg-zinc-900/60 text-zinc-400'
            }`}>
              <MapPin className="h-4 w-4 shrink-0" />
              <div className="text-xs">
                <span className="font-semibold">{hasGps ? 'GPS Location Detected' : 'No GPS Coordinates'}</span>
                <p className="text-[11px] opacity-80">{hasGps ? 'Photo contains location tags.' : 'No geographical coordinates found.'}</p>
              </div>
            </div>

            <div className={`flex items-center gap-3 rounded-xl border p-3 ${
              hasExif ? 'border-brand-500/30 bg-brand-500/10 text-brand-300' : 'border-zinc-800 bg-zinc-900/60 text-zinc-400'
            }`}>
              <Camera className="h-4 w-4 shrink-0" />
              <div className="text-xs">
                <span className="font-semibold">{hasExif ? 'EXIF Header Found' : 'Clean Header'}</span>
                <p className="text-[11px] opacity-80">{hasExif ? 'Device & capture parameters present.' : 'No EXIF metadata block found.'}</p>
              </div>
            </div>
          </div>

          {/* Tag Viewer */}
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Metadata Tags Found
            </span>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 divide-y divide-zinc-800 max-h-48 overflow-y-auto">
              {tags.map((tag, idx) => (
                <div key={idx} className="flex justify-between px-3 py-2 text-xs">
                  <span className="text-zinc-400 font-medium">{tag.name}</span>
                  <span className="text-zinc-200 font-mono text-[11px] truncate max-w-xs">{tag.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action */}
          <div className="pt-2">
            <button
              onClick={handleScrub}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-600 active:scale-[0.98] disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Sanitizing Photo Pixels...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>Scrub All Metadata & Download Safe Image</span>
                </>
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
              <span>Clean sanitized image downloaded without any metadata!</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
