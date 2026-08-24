import React, { useState, useRef } from 'react';
import { ImageEngine } from '../../engines/imageEngine';
import { formatBytes, downloadBlob, readFileAsDataURL } from '../../lib/utils';
import { Upload, Maximize2, Lock, Unlock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

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
            <Maximize2 className="h-5 w-5" />
          </div>
          <h3 className="mt-3 text-xs font-semibold text-[#ECEDEF]">
            Drop image to resize, or <span className="text-[#4F8CFF] underline">browse files</span>
          </h3>
          <p className="mt-0.5 font-mono text-[11px] text-[#8B8F98]">
            Pixel-perfect bicubic resampling with aspect ratio lock. 100% local WASM.
          </p>
        </div>
      ) : (
        <div className="rounded border border-[#2A2D33] bg-[#131418] p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#2A2D33] pb-3">
            <div>
              <span className="text-xs font-medium text-[#ECEDEF]">{file.name}</span>
              <p className="text-[10px] text-[#8B8F98] font-mono mt-0.5">
                Original Resolution: {origWidth} × {origHeight} px · {formatBytes(file.size)}
              </p>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setPreviewUrl(null);
              }}
              className="font-mono text-[11px] text-[#8B8F98] hover:text-[#ECEDEF] transition-colors"
            >
              Choose different image
            </button>
          </div>

          {/* Quick Presets & Scale Percentage */}
          <div className="space-y-2 rounded bg-[#1B1D22] border border-[#2A2D33] p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2A2D33] pb-2">
              <span className="text-xs font-medium text-[#ECEDEF]">Quick Scaling</span>
              <div className="flex items-center gap-1.5">
                {[25, 50, 75, 100, 200].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => applyScalePercent(pct)}
                    className="rounded bg-[#131418] hover:bg-[#181920] border border-[#2A2D33] px-2 py-0.5 font-mono text-[10px] text-[#8B8F98] hover:text-[#ECEDEF] transition-colors"
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-[#8B8F98] font-mono mr-1">Social Presets:</span>
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
                  className="rounded bg-[#131418] hover:bg-[#181920] border border-[#2A2D33] px-2 py-0.5 text-[10px] text-[#8B8F98] hover:text-[#ECEDEF] transition-colors"
                >
                  {p.label.split(' (')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Dimension Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 rounded bg-[#1B1D22] border border-[#2A2D33] p-3.5 items-end">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#ECEDEF] block">
                Target Width (px)
              </label>
              <input
                type="number"
                value={width || ''}
                onChange={(e) => handleWidthChange(parseInt(e.target.value) || 0)}
                className="w-full rounded border border-[#2A2D33] bg-[#131418] px-3 py-1.5 font-mono text-xs text-[#ECEDEF] focus:border-[#4F8CFF] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[#ECEDEF] block">
                Target Height (px)
              </label>
              <input
                type="number"
                value={height || ''}
                onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0)}
                className="w-full rounded border border-[#2A2D33] bg-[#131418] px-3 py-1.5 font-mono text-xs text-[#ECEDEF] focus:border-[#4F8CFF] focus:outline-none"
              />
            </div>

            <div>
              <button
                type="button"
                onClick={() => setLockRatio(!lockRatio)}
                className={`w-full flex items-center justify-center gap-1.5 rounded border py-1.5 px-3 text-xs font-medium transition-colors ${
                  lockRatio
                    ? 'border-[#4F8CFF] bg-[#16233F] text-[#4F8CFF]'
                    : 'border-[#2A2D33] bg-[#131418] text-[#8B8F98] hover:text-[#ECEDEF]'
                }`}
              >
                {lockRatio ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                <span>{lockRatio ? 'Ratio Locked' : 'Ratio Free'}</span>
              </button>
            </div>
          </div>

          {/* Action */}
          <div>
            <button
              onClick={handleResize}
              disabled={isProcessing || width <= 0 || height <= 0}
              className="w-full flex items-center justify-center gap-2 rounded bg-[#4F8CFF] hover:bg-[#3B79F0] py-2.5 px-4 text-xs font-semibold text-white transition-colors disabled:opacity-40"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Resampling Pixels...</span>
                </>
              ) : (
                <span>Resize & Download ({width} × {height} px)</span>
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
              <span>Resized image downloaded successfully.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
