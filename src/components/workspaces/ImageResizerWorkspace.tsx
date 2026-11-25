import React, { useState, useRef } from 'react';
import { ImageEngine } from '../../engines/imageEngine';
import { formatBytes, downloadBlob, readFileAsDataURL } from '../../lib/utils';
import { WorkspaceDropzone, WorkspaceAlert } from './WorkspaceUI';
import { Maximize2, Lock, Unlock, Loader2 } from 'lucide-react';

export const ImageResizerWorkspace: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [origWidth, setOrigWidth] = useState<number>(0);
  const [origHeight, setOrigHeight] = useState<number>(0);
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [lockRatio, setLockRatio] = useState<boolean>(true);
  const [format] = useState<'image/png' | 'image/jpeg' | 'image/webp'>('image/png');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
      setError('Please choose a valid image file.');
      return;
    }

    setError(null);
    setSuccess(false);

    try {
      const dataUrl = await readFileAsDataURL(selectedFile);
      const dims = await ImageEngine.getImageDimensions(selectedFile);
      setFile(selectedFile);
      setPreviewUrl(dataUrl);
      setOrigWidth(dims.width);
      setOrigHeight(dims.height);
      setWidth(dims.width);
      setHeight(dims.height);
    } catch (err: any) {
      setError('Failed to load image: ' + err.message);
    }
  };

  const handleWidthChange = (val: number) => {
    setWidth(val);
    if (lockRatio && origWidth > 0) {
      const ratio = origHeight / origWidth;
      setHeight(Math.round(val * ratio));
    }
  };

  const handleHeightChange = (val: number) => {
    setHeight(val);
    if (lockRatio && origHeight > 0) {
      const ratio = origWidth / origHeight;
      setWidth(Math.round(val * ratio));
    }
  };

  const applyScalePercent = (pct: number) => {
    const newW = Math.round((origWidth * pct) / 100);
    const newH = Math.round((origHeight * pct) / 100);
    setWidth(newW);
    setHeight(newH);
  };

  const applyPreset = (w: number, h: number) => {
    setWidth(w);
    setHeight(h);
    setLockRatio(false);
  };

  const handleResize = async () => {
    if (!file || width <= 0 || height <= 0) return;
    setIsProcessing(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await ImageEngine.resizeImage(file, width, height, format, 0.92);
      const ext = format === 'image/png' ? 'png' : format === 'image/jpeg' ? 'jpg' : 'webp';
      const outName = `${file.name.replace(/\.[^/.]+$/, '')}_${width}x${height}.${ext}`;
      downloadBlob(res.blob, outName);
      setSuccess(true);
    } catch (err: any) {
      setError('Resize failed: ' + err.message);
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
          icon={<Maximize2 className="h-5 w-5" />}
          title="Drop image to resize, or"
          subtitle="Pixel-perfect bicubic resampling with aspect ratio lock and social presets."
          badgeText="100% Local Processing"
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
                  alt="Preview"
                  className="h-10 w-10 rounded-lg object-cover border border-[var(--nt-border)]"
                />
              )}
              <div>
                <span className="text-sm font-extrabold text-[#141413] dark:text-[#FAF7F0]">{file.name}</span>
                <p className="text-xs text-[#746D61] dark:text-[#938B7D] font-mono mt-0.5">
                  Original Resolution: {origWidth} × {origHeight} px · {formatBytes(file.size)}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setPreviewUrl(null);
              }}
              className="nt-btn-secondary px-3 py-1.5 font-mono text-[11px] font-semibold"
            >
              Choose different image
            </button>
          </div>

          <div className="nt-well p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--nt-border)] pb-2.5">
              <span className="text-xs font-extrabold text-[#141413] dark:text-[#FAF7F0]">Quick Scaling</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[25, 50, 75, 100, 200].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => applyScalePercent(pct)}
                    className="nt-btn-secondary px-2.5 py-1 font-mono text-[11px] font-bold"
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[11px] text-[#746D61] dark:text-[#938B7D] font-mono font-bold mr-1">Social Presets:</span>
              {[
                { label: 'Instagram Post (1080×1080)', w: 1080, h: 1080 },
                { label: 'Instagram Story (1080×1920)', w: 1080, h: 1920 },
                { label: 'YouTube Thumb (1280×720)', w: 1280, h: 720 },
                { label: 'Twitter Header (1500×500)', w: 1500, h: 500 },
              ].map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => applyPreset(p.w, p.h)}
                  className="nt-btn-secondary px-2.5 py-1 text-[11px] font-semibold"
                >
                  {p.label.split(' (')[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="nt-well grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-4 items-end">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#141413] dark:text-[#FAF7F0] block">
                Target Width (px)
              </label>
              <input
                type="number"
                value={width || ''}
                onChange={(e) => handleWidthChange(parseInt(e.target.value) || 0)}
                className="nt-input w-full px-3 py-2 font-mono text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#141413] dark:text-[#FAF7F0] block">
                Target Height (px)
              </label>
              <input
                type="number"
                value={height || ''}
                onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0)}
                className="nt-input w-full px-3 py-2 font-mono text-xs"
              />
            </div>

            <div>
              <button
                type="button"
                onClick={() => setLockRatio(!lockRatio)}
                className={`w-full flex items-center justify-center gap-1.5 rounded-xl border py-2 px-3 text-xs font-bold transition-all cursor-pointer ${
                  lockRatio
                    ? 'bg-[#141413] dark:bg-[#FACC15] text-[#FACC15] dark:text-[#141413] border-[#141413] shadow-sm'
                    : 'nt-btn-secondary'
                }`}
              >
                {lockRatio ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                <span>{lockRatio ? 'Ratio Locked' : 'Ratio Free'}</span>
              </button>
            </div>
          </div>

          <button
            onClick={handleResize}
            disabled={isProcessing || width <= 0 || height <= 0}
            className="w-full flex items-center justify-center gap-2 nt-btn-yellow py-3 px-4 text-xs disabled:opacity-40"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Resampling Pixels...</span>
              </>
            ) : (
              <span>Resize & Download ({width} × {height} px)</span>
            )}
          </button>

          {error && <WorkspaceAlert variant="error" message={error} />}
          {success && <WorkspaceAlert variant="success" message="Resized image downloaded successfully." />}
        </div>
      )}
    </div>
  );
};
