import React, { useState, useRef } from 'react';
import { ImageEngine } from '../../engines/imageEngine';
import { formatBytes, downloadBlob, readFileAsDataURL } from '../../lib/utils';
import { Upload, Maximize2, Lock, Unlock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export const ImageResizerWorkspace: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [origWidth, setOrigWidth] = useState<number>(0);
  const [origHeight, setOrigHeight] = useState<number>(0);
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [lockRatio, setLockRatio] = useState<boolean>(true);
  const [format, setFormat] = useState<'image/png' | 'image/jpeg' | 'image/webp'>('image/png');
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
            <Maximize2 className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-zinc-200">
            Upload Image to Resize
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            Scale dimensions with aspect ratio lock or custom social media presets.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-surface-border bg-surface p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-surface-border pb-4">
            <div>
              <span className="text-sm font-medium text-zinc-200">{file.name}</span>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Original Dimensions: {origWidth} × {origHeight} px · {formatBytes(file.size)}
              </p>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setPreviewUrl(null);
              }}
              className="text-xs text-zinc-400 hover:text-zinc-200"
            >
              Change image
            </button>
          </div>

          {/* Dimension Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Width (pixels)
              </label>
              <input
                type="number"
                value={width}
                onChange={(e) => handleWidthChange(parseInt(e.target.value, 10) || 0)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs text-zinc-100 font-mono focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Height (pixels)
              </label>
              <input
                type="number"
                value={height}
                onChange={(e) => handleHeightChange(parseInt(e.target.value, 10) || 0)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs text-zinc-100 font-mono focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Aspect Ratio Lock & Presets */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-y border-surface-border py-3">
            <button
              type="button"
              onClick={() => setLockRatio(!lockRatio)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium border transition-colors ${
                lockRatio
                  ? 'border-brand-500/30 bg-brand-500/10 text-brand-400'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-400'
              }`}
            >
              {lockRatio ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
              <span>Lock Aspect Ratio</span>
            </button>

            {/* Quick Percentage Presets */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-zinc-500">Scale:</span>
              {[25, 50, 75, 150, 200].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => applyScalePercent(pct)}
                  className="rounded-lg bg-zinc-800 px-2 py-1 font-mono text-[11px] text-zinc-300 hover:bg-zinc-700"
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          {/* Social Presets */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-zinc-400">Social Media Presets:</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => applyPreset(1080, 1080)}
                className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-2 text-left hover:border-zinc-700"
              >
                <div className="text-xs font-medium text-zinc-200">Square Post</div>
                <div className="text-[10px] text-zinc-500 font-mono">1080 × 1080</div>
              </button>
              <button
                type="button"
                onClick={() => applyPreset(1080, 1920)}
                className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-2 text-left hover:border-zinc-700"
              >
                <div className="text-xs font-medium text-zinc-200">Story / Reel</div>
                <div className="text-[10px] text-zinc-500 font-mono">1080 × 1920</div>
              </button>
              <button
                type="button"
                onClick={() => applyPreset(1280, 720)}
                className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-2 text-left hover:border-zinc-700"
              >
                <div className="text-xs font-medium text-zinc-200">YouTube Thumb</div>
                <div className="text-[10px] text-zinc-500 font-mono">1280 × 720</div>
              </button>
              <button
                type="button"
                onClick={() => applyPreset(1500, 500)}
                className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-2 text-left hover:border-zinc-700"
              >
                <div className="text-xs font-medium text-zinc-200">Twitter Banner</div>
                <div className="text-[10px] text-zinc-500 font-mono">1500 × 500</div>
              </button>
            </div>
          </div>

          {/* Action */}
          <div className="pt-2">
            <button
              onClick={handleResize}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white shadow-glow-sm transition-all hover:bg-brand-600 active:scale-[0.98] disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Resizing Image...</span>
                </>
              ) : (
                <span>Resize & Download ({width} × {height} px)</span>
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
              <span>Resized image downloaded successfully!</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
