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
    <div className="w-full space-y-4">
      {!file ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="group relative flex cursor-pointer flex-col items-center justify-center rounded border border-dashed border-[#2A2D33] bg-[#1B1D22] p-6 sm:p-10 hover:border-[#4F8CFF] hover:bg-[#151820] transition-colors"
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
          <div className="flex h-10 w-10 items-center justify-center rounded bg-[#131418] border border-[#2A2D33] text-[#8B8F98] group-hover:text-[#4F8CFF] group-hover:border-[#4F8CFF]/40 transition-colors">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h3 className="mt-3 text-xs font-semibold text-[#ECEDEF]">
            Drop photo to inspect & scrub EXIF, or <span className="text-[#4F8CFF] underline">browse files</span>
          </h3>
          <p className="mt-0.5 font-mono text-[11px] text-[#8B8F98]">
            Strip GPS coordinates, device identifiers, and timestamps. 100% local WASM.
          </p>
        </div>
      ) : (
        <div className="rounded border border-[#2A2D33] bg-[#131418] p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#2A2D33] pb-3">
            <div className="flex items-center gap-2.5">
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Thumbnail"
                  className="h-9 w-9 rounded object-cover border border-[#2A2D33]"
                />
              )}
              <div>
                <span className="text-xs font-medium text-[#ECEDEF]">{file.name}</span>
                <p className="text-[10px] text-[#8B8F98] font-mono mt-0.5">
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
              className="font-mono text-[11px] text-[#8B8F98] hover:text-[#ECEDEF] transition-colors"
            >
              Choose different photo
            </button>
          </div>

          {/* Privacy Status Readout */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded px-2.5 py-1 font-mono text-[11px] border flex items-center gap-1.5 ${
                hasGps
                  ? 'bg-[#331614] border-[#F0564B]/40 text-[#F0564B]'
                  : 'bg-[#122D1F] border-[#3FBE73]/30 text-[#3FBE73]'
              }`}
            >
              <MapPin className="h-3 w-3" />
              {hasGps ? 'GPS Location Exposed' : 'No GPS Coordinates'}
            </span>

            <span
              className={`rounded px-2.5 py-1 font-mono text-[11px] border flex items-center gap-1.5 ${
                hasExif
                  ? 'bg-[#2E2413] border-[#E0A93E]/40 text-[#E0A93E]'
                  : 'bg-[#122D1F] border-[#3FBE73]/30 text-[#3FBE73]'
              }`}
            >
              <Camera className="h-3 w-3" />
              {hasExif ? `${tags.length} Metadata Tags Detected` : 'Zero EXIF Tags'}
            </span>
          </div>

          {/* Metadata Table */}
          {tags.length > 0 ? (
            <div className="rounded bg-[#1B1D22] border border-[#2A2D33] overflow-hidden">
              <div className="border-b border-[#2A2D33] px-3.5 py-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#8B8F98]">
                Detected EXIF Headers
              </div>
              <div className="max-h-56 overflow-y-auto divide-y divide-[#2A2D33]">
                {tags.map((t, idx) => (
                  <div key={idx} className="flex justify-between px-3.5 py-1.5 text-xs font-mono">
                    <span className="text-[#8B8F98]">{t.name}</span>
                    <span className="text-[#ECEDEF] max-w-[60%] truncate text-right">{t.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded bg-[#1B1D22] border border-[#2A2D33] p-4 text-center">
              <p className="text-xs text-[#8B8F98] font-mono">
                No sensitive EXIF tags detected in this image header.
              </p>
            </div>
          )}

          {/* Action */}
          <div>
            <button
              onClick={handleScrub}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 rounded bg-[#4F8CFF] hover:bg-[#3B79F0] py-2.5 px-4 text-xs font-semibold text-white transition-colors disabled:opacity-40"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Sanitizing Header in Memory...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Sanitize & Download Clean Image</span>
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
              <span>Sanitized image downloaded without metadata.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
