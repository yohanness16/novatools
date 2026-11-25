import React, { useState, useRef } from 'react';
import { ExifEngine, type ExifTag } from '../../engines/exifEngine';
import { formatBytes, downloadBlob, readFileAsDataURL } from '../../lib/utils';
import { WorkspaceDropzone, WorkspaceAlert } from './WorkspaceUI';
import { useHandoffFiles } from '../../lib/useHandoffFiles';
import { ShieldCheck, MapPin, Camera, Loader2 } from 'lucide-react';

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

  useHandoffFiles((files) => {
    if (files[0]) handleFile(files[0]);
  });

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
    <div className="w-full space-y-5">
      {!file ? (
        <WorkspaceDropzone
          onClick={() => fileInputRef.current?.click()}
          onFilesDrop={(files) => files[0] && handleFile(files[0])}
          icon={<ShieldCheck className="h-5 w-5" />}
          title="Drop photo to inspect & scrub EXIF, or"
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
        </WorkspaceDropzone>
      ) : (
        <div className="nt-card p-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--nt-border)] pb-3">
            <div className="flex items-center gap-3">
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Thumbnail"
                  className="h-10 w-10 rounded-lg object-cover border border-[var(--nt-border)]"
                />
              )}
              <div>
                <span className="text-sm font-extrabold text-[#111214] dark:text-[#F3F4F6]">{file.name}</span>
                <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] font-mono mt-0.5">
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
              className="nt-btn-secondary px-3 py-1.5 font-mono text-[11px] font-semibold"
            >
              Choose different photo
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className={`px-3 py-1 font-mono text-xs font-bold flex items-center gap-1.5 ${
                hasGps ? 'nt-badge-danger rounded-full' : 'nt-badge-success'
              }`}
            >
              <MapPin className="h-3.5 w-3.5" />
              {hasGps ? 'GPS Location Exposed' : 'No GPS Coordinates'}
            </span>

            <span
              className={`px-3 py-1 font-mono text-xs font-bold flex items-center gap-1.5 ${
                hasExif ? 'nt-badge-yellow' : 'nt-badge-success'
              }`}
            >
              <Camera className="h-3.5 w-3.5" />
              {hasExif ? `${tags.length} Metadata Tags Detected` : 'Zero EXIF Tags'}
            </span>
          </div>

          {tags.length > 0 ? (
            <div className="nt-well overflow-hidden">
              <div className="border-b border-[var(--nt-border)] px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-[#111214] dark:text-[#F3F4F6]">
                Detected EXIF Headers
              </div>
              <div className="max-h-56 overflow-y-auto divide-y divide-[var(--nt-border)] bg-white/60 dark:bg-[#1F1D19]/60">
                {tags.map((t, idx) => (
                  <div key={idx} className="flex justify-between px-4 py-2 text-xs font-mono">
                    <span className="text-[#6B7280] dark:text-[#9CA3AF]">{t.name}</span>
                    <span className="text-[#111214] dark:text-[#F3F4F6] max-w-[60%] truncate text-right font-semibold">
                      {t.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="nt-well p-4 text-center">
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] font-mono">
                No sensitive EXIF tags detected in this image header.
              </p>
            </div>
          )}

          <button
            onClick={handleScrub}
            disabled={isProcessing}
            className="w-full flex items-center justify-center gap-2 nt-btn-yellow py-3 px-4 text-xs disabled:opacity-40"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Sanitizing Header in Memory...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                <span>Sanitize & Download Clean Photo</span>
              </>
            )}
          </button>

          {error && <WorkspaceAlert variant="error" message={error} />}
          {success && <WorkspaceAlert variant="success" message="Sanitized image downloaded without metadata." />}
        </div>
      )}
    </div>
  );
};
